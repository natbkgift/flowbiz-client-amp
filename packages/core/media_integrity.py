"""
Media Integrity Scanner — Phase B2.

Scans the media_assets registry and key entity image references for:
  - External URL leakage (http/https paths in fields that must be local)
  - Missing local files (path in DB but file absent on disk)
  - Invalid path format (not /media/...)
  - Empty files (file_size_bytes == 0 or actual size == 0)
  - Basic MIME/extension mismatch
  - Duplicate checksums (warn)
  - Archived assets referenced by live entities (TODO — tracked as pending)

Supports:
  --strict        exit non-zero on any error-level finding
  --fail-on-warn  exit non-zero on any warn-or-error finding
"""
from __future__ import annotations

import hashlib
import json
import mimetypes
import os
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from packages.core.config import settings

# ---------------------------------------------------------------------------
# Severity levels
# ---------------------------------------------------------------------------

SEVERITY_ERROR = "error"
SEVERITY_WARN = "warn"
SEVERITY_INFO = "info"

# ---------------------------------------------------------------------------
# Entity image field registry
# Each entry: (table_name, id_column, image_field, field_type)
#   field_type: "scalar" | "json_list"
# ---------------------------------------------------------------------------

ENTITY_IMAGE_FIELDS: list[tuple[str, str, str, str]] = [
    ("properties", "source_id",  "cover_image",     "scalar"),
    ("properties", "source_id",  "cover_image_url",  "scalar"),
    ("properties", "source_id",  "images",           "json_list"),
    ("properties", "source_id",  "local_images",     "json_list"),
    ("projects",   "slug",       "cover_image_url",  "scalar"),
    ("projects",   "slug",       "hero_image_url",   "scalar"),
    ("projects",   "slug",       "images",           "json_list"),
    ("areas",      "slug",       "hero_image_url",   "scalar"),
    ("developers", "slug",       "logo_url",         "scalar"),
    ("team",       "name",       "photo_url",        "scalar"),
    # articles: no hero_image_url in current model (tracked in B3/TODO)
]

# Fields in ENTITY_IMAGE_FIELDS where having an external URL is a hard error
# (they are supposed to hold local media paths only after B1+ migration)
_EXTERNAL_ERROR_FIELDS = {
    "cover_image",
    "local_images",
}
# For legacy transition fields (cover_image_url etc.) treat external URL as warn,
# unless the system env is prod (where all should already be migrated).

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class IntegrityFinding:
    severity: str          # error | warn | info
    category: str          # e.g. "external_leakage", "missing_file"
    entity: str            # e.g. "properties.cover_image"
    record_id: str         # e.g. source_id or uuid
    value: str             # the problematic value
    detail: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class IntegritySummary:
    scanned_at: str = ""
    total_media_assets: int = 0
    total_entity_refs_scanned: int = 0
    local_paths_ok: int = 0
    missing_file_count: int = 0
    external_leakage_count: int = 0
    invalid_path_format_count: int = 0
    empty_file_count: int = 0
    mime_ext_mismatch_count: int = 0
    duplicate_checksum_groups: int = 0
    error_count: int = 0
    warn_count: int = 0
    info_count: int = 0


@dataclass
class IntegrityReport:
    summary: IntegritySummary = field(default_factory=IntegritySummary)
    findings: list[IntegrityFinding] = field(default_factory=list)

    def add(self, f: IntegrityFinding) -> None:
        self.findings.append(f)
        if f.severity == SEVERITY_ERROR:
            self.summary.error_count += 1
        elif f.severity == SEVERITY_WARN:
            self.summary.warn_count += 1
        else:
            self.summary.info_count += 1

    def to_dict(self) -> dict[str, Any]:
        return {
            "summary": asdict(self.summary),
            "findings": [f.to_dict() for f in self.findings],
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)


# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------

def _media_base_dir() -> Path:
    return Path(settings.media_storage_dir_resolved).resolve()


def _media_public_prefix() -> str:
    return settings.media_public_prefix.rstrip("/")


def _is_local_media_path(value: str) -> bool:
    prefix = _media_public_prefix()
    return value.startswith(f"{prefix}/") or value == prefix


def _is_external_url(value: str) -> bool:
    return value.startswith("http://") or value.startswith("https://")


def _local_path_to_disk(value: str) -> Path:
    """Convert /media/library/... -> absolute filesystem path."""
    prefix = _media_public_prefix()  # e.g. "/media"
    relative = value[len(prefix):].lstrip("/")
    return _media_base_dir() / relative


def _check_disk_file(path: Path) -> tuple[bool, int]:
    """Returns (exists, size_bytes)."""
    try:
        if not path.exists():
            return False, 0
        size = path.stat().st_size
        return True, size
    except OSError:
        return False, 0


def _ext_for_mime(mime: str) -> str | None:
    ext = mimetypes.guess_extension(mime)
    if ext == ".jpe":
        ext = ".jpg"
    return ext


def _disk_ext(path_str: str) -> str:
    return Path(path_str).suffix.lower()


# ---------------------------------------------------------------------------
# Core scanner
# ---------------------------------------------------------------------------


def run_scan(db: Session) -> IntegrityReport:
    """Execute full integrity scan and return IntegrityReport.

    This is the main entry point used by the CLI and the admin API endpoint.
    Reads only — no writes to the database.
    """
    report = IntegrityReport()
    report.summary.scanned_at = datetime.now(timezone.utc).isoformat()

    _scan_media_assets(db, report)
    _scan_entity_image_fields(db, report)

    return report


# ---------------------------------------------------------------------------
# Scan: media_assets table
# ---------------------------------------------------------------------------


def _scan_media_assets(db: Session, report: IntegrityReport) -> None:
    rows = db.execute(
        text(
            "SELECT id, storage_path, mime_type, file_size_bytes, checksum_sha256, status "
            "FROM media_assets ORDER BY created_at"
        )
    ).fetchall()

    report.summary.total_media_assets = len(rows)
    prefix = _media_public_prefix()
    checksum_map: dict[str, list[str]] = defaultdict(list)

    for row in rows:
        asset_id = str(row.id)
        path_val = row.storage_path or ""
        checksum = row.checksum_sha256 or ""
        mime = (row.mime_type or "").lower()
        db_size = row.file_size_bytes or 0

        # 1) Path format
        if not _is_local_media_path(path_val):
            if _is_external_url(path_val):
                report.add(IntegrityFinding(
                    severity=SEVERITY_ERROR,
                    category="invalid_path_format",
                    entity="media_assets.storage_path",
                    record_id=asset_id,
                    value=path_val,
                    detail="storage_path must be /media/... not an external URL",
                ))
                report.summary.external_leakage_count += 1
            else:
                report.add(IntegrityFinding(
                    severity=SEVERITY_ERROR,
                    category="invalid_path_format",
                    entity="media_assets.storage_path",
                    record_id=asset_id,
                    value=path_val,
                    detail=f"storage_path does not start with '{prefix}/'",
                ))
            report.summary.invalid_path_format_count += 1
            continue

        # 2) File existence + size
        disk_path = _local_path_to_disk(path_val)
        exists, actual_size = _check_disk_file(disk_path)

        if not exists:
            report.add(IntegrityFinding(
                severity=SEVERITY_ERROR,
                category="missing_file",
                entity="media_assets.storage_path",
                record_id=asset_id,
                value=path_val,
                detail=f"File not found on disk: {disk_path}",
            ))
            report.summary.missing_file_count += 1
            continue

        if db_size == 0 or actual_size == 0:
            report.add(IntegrityFinding(
                severity=SEVERITY_ERROR,
                category="empty_file",
                entity="media_assets.storage_path",
                record_id=asset_id,
                value=path_val,
                detail=f"File is empty (db_size={db_size}, disk_size={actual_size})",
            ))
            report.summary.empty_file_count += 1
            continue

        report.summary.local_paths_ok += 1

        # 3) MIME/ext mismatch (warn only)
        expected_ext = _ext_for_mime(mime)
        actual_ext = _disk_ext(path_val)
        if expected_ext and actual_ext and expected_ext != actual_ext:
            report.add(IntegrityFinding(
                severity=SEVERITY_WARN,
                category="mime_ext_mismatch",
                entity="media_assets",
                record_id=asset_id,
                value=path_val,
                detail=f"mime={mime} expects ext={expected_ext} but file has {actual_ext}",
            ))
            report.summary.mime_ext_mismatch_count += 1

        # 4) Duplicate checksum tracking
        if checksum:
            checksum_map[checksum].append(asset_id)

    # 5) Duplicate checksum report
    dup_groups = {k: v for k, v in checksum_map.items() if len(v) > 1}
    report.summary.duplicate_checksum_groups = len(dup_groups)
    for cksum, ids in dup_groups.items():
        report.add(IntegrityFinding(
            severity=SEVERITY_WARN,
            category="duplicate_checksum",
            entity="media_assets.checksum_sha256",
            record_id=",".join(ids[:5]),
            value=cksum,
            detail=f"{len(ids)} assets share this checksum",
        ))


# ---------------------------------------------------------------------------
# Scan: entity image reference fields
# ---------------------------------------------------------------------------


def _scan_entity_image_fields(db: Session, report: IntegrityReport) -> None:
    prefix = _media_public_prefix()

    for (table, id_col, img_field, field_type) in ENTITY_IMAGE_FIELDS:
        # Guard: check column exists (table may not have the field in all envs)
        try:
            rows = db.execute(
                text(f"SELECT {id_col}, {img_field} FROM {table}")  # noqa: S608
            ).fetchall()
        except Exception:
            report.add(IntegrityFinding(
                severity=SEVERITY_INFO,
                category="scan_skipped",
                entity=f"{table}.{img_field}",
                record_id="N/A",
                value="",
                detail="Column not found or query failed; skipped",
            ))
            continue

        for row in rows:
            record_id = str(getattr(row, id_col, "?"))
            raw_value = getattr(row, img_field, None)

            if raw_value is None:
                continue

            # Flatten depending on field type
            values: list[str] = []
            if field_type == "json_list":
                if isinstance(raw_value, list):
                    values = [str(v) for v in raw_value if v is not None]
                elif isinstance(raw_value, str):
                    try:
                        parsed = json.loads(raw_value)
                        if isinstance(parsed, list):
                            values = [str(v) for v in parsed if v is not None]
                    except json.JSONDecodeError:
                        pass
            else:
                values = [str(raw_value)]

            report.summary.total_entity_refs_scanned += len(values)

            for val in values:
                if not val or not val.strip():
                    continue
                val = val.strip()

                if _is_external_url(val):
                    # Determine severity: strict fields always error; legacy transition fields warn
                    severity = (
                        SEVERITY_ERROR
                        if img_field in _EXTERNAL_ERROR_FIELDS or settings.app_env == "prod"
                        else SEVERITY_WARN
                    )
                    report.add(IntegrityFinding(
                        severity=severity,
                        category="external_leakage",
                        entity=f"{table}.{img_field}",
                        record_id=record_id,
                        value=val,
                        detail="External URL found in image field; must be local /media/... path",
                    ))
                    report.summary.external_leakage_count += 1

                elif _is_local_media_path(val):
                    disk_path = _local_path_to_disk(val)
                    exists, _ = _check_disk_file(disk_path)
                    if not exists:
                        report.add(IntegrityFinding(
                            severity=SEVERITY_ERROR,
                            category="missing_local_file",
                            entity=f"{table}.{img_field}",
                            record_id=record_id,
                            value=val,
                            detail=f"Path in DB but file not on disk: {disk_path}",
                        ))
                        report.summary.missing_file_count += 1
                    else:
                        report.summary.local_paths_ok += 1


# ---------------------------------------------------------------------------
# Console summary
# ---------------------------------------------------------------------------


def print_console_summary(report: IntegrityReport, *, verbose: bool = False) -> None:
    s = report.summary
    now = s.scanned_at or "?"
    lines = [
        "",
        f"=== Media Integrity Report — {now} ===",
        f"  Media assets scanned   : {s.total_media_assets}",
        f"  Entity refs scanned    : {s.total_entity_refs_scanned}",
        f"  Local paths OK         : {s.local_paths_ok}",
        "  ----------------------------------------",
        f"  Missing files          : {s.missing_file_count}",
        f"  External leakage       : {s.external_leakage_count}",
        f"  Invalid path format    : {s.invalid_path_format_count}",
        f"  Empty files            : {s.empty_file_count}",
        f"  MIME/ext mismatches    : {s.mime_ext_mismatch_count}  [warn]",
        f"  Duplicate checksum grp : {s.duplicate_checksum_groups}  [warn]",
        "  ----------------------------------------",
        f"  ERRORS   : {s.error_count}",
        f"  WARNINGS : {s.warn_count}",
        f"  INFO     : {s.info_count}",
        "=========================================",
    ]
    print("\n".join(lines))

    if verbose and report.findings:
        print("\n--- Findings (verbose) ---")
        for f in report.findings:
            marker = {"error": "✖", "warn": "⚠", "info": "ℹ"}.get(f.severity, "?")
            print(f"  [{marker}] [{f.severity.upper():5}] {f.category} | {f.entity} | {f.record_id[:40]} | {f.value[:80]}")
            if f.detail:
                print(f"         {f.detail}")

    if s.error_count:
        print(f"\n  ✖ {s.error_count} error(s) found. Run with --strict to fail CI.")
    elif s.warn_count:
        print(f"\n  ⚠ {s.warn_count} warning(s) found. Run with --fail-on-warn to fail CI.")
    else:
        print("\n  ✔ No issues found.")
