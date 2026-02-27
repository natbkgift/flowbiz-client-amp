from __future__ import annotations

import hashlib
import json
import mimetypes
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

SEVERITY_ERROR = "error"
SEVERITY_WARN = "warn"
SEVERITY_INFO = "info"

# table, id_column, image_field, field_type(scalar|json_list)
ENTITY_IMAGE_FIELDS: list[tuple[str, str, str, str]] = [
    ("properties", "source_id", "cover_image", "scalar"),
    ("properties", "source_id", "cover_image_url", "scalar"),
    ("properties", "source_id", "images", "json_list"),
    ("properties", "source_id", "local_images", "json_list"),
    ("projects", "slug", "cover_image_url", "scalar"),
    ("projects", "slug", "hero_image_url", "scalar"),
    ("projects", "slug", "images", "json_list"),
    ("areas", "slug", "hero_image_url", "scalar"),
    ("developers", "slug", "logo_url", "scalar"),
    ("team", "name", "photo_url", "scalar"),
]

# These should always be local /media/... paths.
_EXTERNAL_ERROR_FIELDS = {"cover_image", "local_images"}


@dataclass
class IntegrityFinding:
    severity: str
    category: str
    entity: str
    record_id: str
    value: str
    detail: str = ""
    suggestion: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class IntegritySummary:
    scanned_at: str = ""
    total_media_assets: int = 0
    total_entity_refs_scanned: int = 0
    local_paths_ok: int = 0
    missing_file_count: int = 0
    checksum_mismatch_count: int = 0
    external_leakage_count: int = 0
    invalid_path_format_count: int = 0
    empty_file_count: int = 0
    mime_ext_mismatch_count: int = 0
    duplicate_checksum_groups: int = 0
    orphan_file_count: int = 0
    orphan_file_sample_count: int = 0
    error_count: int = 0
    warn_count: int = 0
    info_count: int = 0


@dataclass
class IntegrityReport:
    summary: IntegritySummary = field(default_factory=IntegritySummary)
    findings: list[IntegrityFinding] = field(default_factory=list)

    def add(self, item: IntegrityFinding) -> None:
        self.findings.append(item)
        if item.severity == SEVERITY_ERROR:
            self.summary.error_count += 1
        elif item.severity == SEVERITY_WARN:
            self.summary.warn_count += 1
        else:
            self.summary.info_count += 1

    def to_dict(self) -> dict[str, Any]:
        return {
            "summary": asdict(self.summary),
            "findings": [row.to_dict() for row in self.findings],
        }

    def to_json(self, *, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)


def _normalize_prefix(prefix: str) -> str:
    value = str(prefix or "").strip() or "/media"
    if not value.startswith("/"):
        value = f"/{value}"
    return value.rstrip("/")


def _is_external_url(value: str) -> bool:
    return value.startswith("http://") or value.startswith("https://")


def _is_local_media_path(value: str, *, prefix: str) -> bool:
    return value == prefix or value.startswith(f"{prefix}/")


def _local_path_to_disk(value: str, *, prefix: str, media_root: Path) -> Path:
    relative = value[len(prefix) :].lstrip("/")
    return media_root / relative


def _check_disk_file(path: Path) -> tuple[bool, int]:
    try:
        if not path.exists() or not path.is_file():
            return False, 0
        return True, path.stat().st_size
    except OSError:
        return False, 0


def _sha256_file(path: Path) -> str | None:
    try:
        digest = hashlib.sha256()
        with path.open("rb") as fp:
            for chunk in iter(lambda: fp.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()
    except OSError:
        return None


def _mime_to_ext(mime_type: str) -> str | None:
    ext = mimetypes.guess_extension(mime_type)
    if ext == ".jpe":
        return ".jpg"
    return ext


def run_scan(
    db: Session,
    *,
    media_root: str | Path | None = None,
    media_public_prefix: str = "/media",
    orphan_sample_limit: int = 20,
) -> IntegrityReport:
    report = IntegrityReport()
    report.summary.scanned_at = datetime.now(timezone.utc).isoformat()

    root = Path(media_root or "storage/media").resolve()
    prefix = _normalize_prefix(media_public_prefix)
    referenced_local_paths: set[str] = set()

    _scan_media_assets(db, report, media_root=root, media_public_prefix=prefix, referenced_local_paths=referenced_local_paths)
    _scan_entity_image_fields(
        db,
        report,
        media_root=root,
        media_public_prefix=prefix,
        referenced_local_paths=referenced_local_paths,
    )
    _scan_orphan_files(
        report,
        media_root=root,
        media_public_prefix=prefix,
        referenced_local_paths=referenced_local_paths,
        sample_limit=max(0, orphan_sample_limit),
    )
    return report


def _scan_media_assets(
    db: Session,
    report: IntegrityReport,
    *,
    media_root: Path,
    media_public_prefix: str,
    referenced_local_paths: set[str],
) -> None:
    rows = db.execute(
        text(
            "SELECT id, storage_path, mime_type, file_size_bytes, checksum_sha256 "
            "FROM media_assets ORDER BY created_at"
        )
    ).fetchall()
    report.summary.total_media_assets = len(rows)

    checksum_map: dict[str, list[str]] = defaultdict(list)

    for row in rows:
        asset_id = str(row.id)
        path_val = str(row.storage_path or "").strip()
        mime_type = str(row.mime_type or "").strip().lower()
        db_size = int(row.file_size_bytes or 0)
        checksum = str(row.checksum_sha256 or "").strip().lower()

        if not _is_local_media_path(path_val, prefix=media_public_prefix):
            if _is_external_url(path_val):
                report.summary.external_leakage_count += 1
                report.add(
                    IntegrityFinding(
                        severity=SEVERITY_ERROR,
                        category="invalid_path_format",
                        entity="media_assets.storage_path",
                        record_id=asset_id,
                        value=path_val,
                        detail="storage_path must be local /media/... path",
                        suggestion="replace with a local /media/... path and keep source_url for provenance",
                    )
                )
            else:
                report.add(
                    IntegrityFinding(
                        severity=SEVERITY_ERROR,
                        category="invalid_path_format",
                        entity="media_assets.storage_path",
                        record_id=asset_id,
                        value=path_val,
                        detail=f"storage_path must start with '{media_public_prefix}/'",
                        suggestion="rewrite invalid storage_path values to local /media/... paths",
                    )
                )
            report.summary.invalid_path_format_count += 1
            continue

        referenced_local_paths.add(path_val)
        disk_path = _local_path_to_disk(path_val, prefix=media_public_prefix, media_root=media_root)
        exists, actual_size = _check_disk_file(disk_path)
        if not exists:
            report.summary.missing_file_count += 1
            report.add(
                IntegrityFinding(
                    severity=SEVERITY_ERROR,
                    category="missing_file",
                    entity="media_assets.storage_path",
                    record_id=asset_id,
                    value=path_val,
                    detail=f"file does not exist on disk: {disk_path}",
                    suggestion="re-upload file for this asset or clear broken reference after approval",
                )
            )
            continue

        if db_size == 0 or actual_size == 0:
            report.summary.empty_file_count += 1
            report.add(
                IntegrityFinding(
                    severity=SEVERITY_ERROR,
                    category="empty_file",
                    entity="media_assets.storage_path",
                    record_id=asset_id,
                    value=path_val,
                    detail=f"file is empty (db_size={db_size}, disk_size={actual_size})",
                    suggestion="replace file content and refresh metadata/checksum",
                )
            )
            continue

        report.summary.local_paths_ok += 1

        if checksum:
            checksum_map[checksum].append(asset_id)
            computed = _sha256_file(disk_path)
            if computed and computed != checksum:
                report.summary.checksum_mismatch_count += 1
                report.add(
                    IntegrityFinding(
                        severity=SEVERITY_ERROR,
                        category="checksum_mismatch",
                        entity="media_assets.checksum_sha256",
                        record_id=asset_id,
                        value=path_val,
                        detail=f"db checksum={checksum} disk checksum={computed}",
                        suggestion="recompute checksum from disk or replace corrupted file after verification",
                    )
                )

        expected_ext = _mime_to_ext(mime_type) if mime_type else None
        actual_ext = Path(path_val).suffix.lower()
        if expected_ext and actual_ext and expected_ext != actual_ext:
            report.summary.mime_ext_mismatch_count += 1
            report.add(
                IntegrityFinding(
                    severity=SEVERITY_WARN,
                    category="mime_ext_mismatch",
                    entity="media_assets.mime_type",
                    record_id=asset_id,
                    value=path_val,
                    detail=f"mime={mime_type} expects ext={expected_ext}, got {actual_ext}",
                    suggestion="normalize filename extension or update mime metadata",
                )
            )

    duplicate_groups = {key: ids for key, ids in checksum_map.items() if key and len(ids) > 1}
    report.summary.duplicate_checksum_groups = len(duplicate_groups)
    for checksum, ids in duplicate_groups.items():
        report.add(
            IntegrityFinding(
                severity=SEVERITY_WARN,
                category="duplicate_checksum",
                entity="media_assets.checksum_sha256",
                record_id=",".join(ids[:5]),
                value=checksum,
                detail=f"{len(ids)} assets share the same checksum",
                suggestion="deduplicate assets and preserve one canonical reference",
            )
        )


def _scan_entity_image_fields(
    db: Session,
    report: IntegrityReport,
    *,
    media_root: Path,
    media_public_prefix: str,
    referenced_local_paths: set[str],
) -> None:
    for table, id_col, field_name, field_type in ENTITY_IMAGE_FIELDS:
        try:
            rows = db.execute(
                text(f"SELECT {id_col} AS record_id, {field_name} AS field_value FROM {table}")  # noqa: S608
            ).fetchall()
        except Exception:
            report.add(
                IntegrityFinding(
                    severity=SEVERITY_INFO,
                    category="scan_skipped",
                    entity=f"{table}.{field_name}",
                    record_id="N/A",
                    value="",
                    detail="field not found or query failed",
                )
            )
            continue

        for row in rows:
            record_id = str(getattr(row, "record_id", "?"))
            raw_value = getattr(row, "field_value", None)
            if raw_value is None:
                continue

            values: list[str] = []
            if field_type == "json_list":
                if isinstance(raw_value, list):
                    values = [str(item) for item in raw_value if item is not None]
                elif isinstance(raw_value, str):
                    try:
                        parsed = json.loads(raw_value)
                    except json.JSONDecodeError:
                        parsed = None
                    if isinstance(parsed, list):
                        values = [str(item) for item in parsed if item is not None]
            else:
                values = [str(raw_value)]

            report.summary.total_entity_refs_scanned += len(values)
            for value in values:
                item = value.strip()
                if not item:
                    continue

                if _is_external_url(item):
                    severity = SEVERITY_ERROR if field_name in _EXTERNAL_ERROR_FIELDS else SEVERITY_WARN
                    report.summary.external_leakage_count += 1
                    report.add(
                        IntegrityFinding(
                            severity=severity,
                            category="external_leakage",
                            entity=f"{table}.{field_name}",
                            record_id=record_id,
                            value=item,
                            detail="external URL found in field that should use local media paths",
                            suggestion="ingest external file into local media library and replace field with /media/... path",
                        )
                    )
                    continue

                if _is_local_media_path(item, prefix=media_public_prefix):
                    referenced_local_paths.add(item)
                    disk_path = _local_path_to_disk(item, prefix=media_public_prefix, media_root=media_root)
                    exists, _ = _check_disk_file(disk_path)
                    if not exists:
                        report.summary.missing_file_count += 1
                        report.add(
                            IntegrityFinding(
                                severity=SEVERITY_ERROR,
                                category="missing_local_file",
                                entity=f"{table}.{field_name}",
                                record_id=record_id,
                                value=item,
                                detail=f"path exists in DB but not on disk: {disk_path}",
                                suggestion="restore file or remove stale reference after approval",
                            )
                        )
                    else:
                        report.summary.local_paths_ok += 1


def _scan_orphan_files(
    report: IntegrityReport,
    *,
    media_root: Path,
    media_public_prefix: str,
    referenced_local_paths: set[str],
    sample_limit: int,
) -> None:
    if not media_root.exists():
        report.add(
            IntegrityFinding(
                severity=SEVERITY_INFO,
                category="scan_skipped",
                entity="filesystem.media",
                record_id="N/A",
                value=str(media_root),
                detail="media root not found; orphan scan skipped",
            )
        )
        return

    sample_count = 0
    for disk_file in media_root.rglob("*"):
        if not disk_file.is_file():
            continue
        try:
            rel = disk_file.relative_to(media_root)
        except ValueError:
            continue

        local_path = f"{media_public_prefix}/{rel.as_posix()}"
        if local_path in referenced_local_paths:
            continue

        report.summary.orphan_file_count += 1
        if sample_count < sample_limit:
            sample_count += 1
            report.add(
                IntegrityFinding(
                    severity=SEVERITY_WARN,
                    category="orphan_file",
                    entity="filesystem.media",
                    record_id=rel.as_posix(),
                    value=local_path,
                    detail="file exists on disk but is not referenced by media_assets or entity image fields",
                    suggestion="review and archive/move orphan file; do not delete without confirmation",
                )
            )

    report.summary.orphan_file_sample_count = sample_count


def print_console_summary(report: IntegrityReport, *, verbose: bool = False) -> None:
    summary = report.summary
    lines = [
        "",
        f"=== Media Integrity Report ({summary.scanned_at or '?'}) ===",
        f"Media assets scanned       : {summary.total_media_assets}",
        f"Entity refs scanned        : {summary.total_entity_refs_scanned}",
        f"Local paths OK             : {summary.local_paths_ok}",
        "----------------------------------------",
        f"Missing files              : {summary.missing_file_count}",
        f"Checksum mismatches        : {summary.checksum_mismatch_count}",
        f"External URL leakage       : {summary.external_leakage_count}",
        f"Invalid path format        : {summary.invalid_path_format_count}",
        f"Empty files                : {summary.empty_file_count}",
        f"MIME/ext mismatches (warn) : {summary.mime_ext_mismatch_count}",
        f"Duplicate checksum groups  : {summary.duplicate_checksum_groups}",
        f"Orphan files (warn)        : {summary.orphan_file_count}",
        "----------------------------------------",
        f"ERROR: {summary.error_count}",
        f"WARN : {summary.warn_count}",
        f"INFO : {summary.info_count}",
        "========================================",
    ]
    print("\n".join(lines))

    if verbose and report.findings:
        print("\nFindings:")
        for item in report.findings:
            print(
                f"[{item.severity.upper():5}] {item.category} | {item.entity} | "
                f"{item.record_id} | {item.value}"
            )
            if item.detail:
                print(f"  detail: {item.detail}")
            if item.suggestion:
                print(f"  suggestion: {item.suggestion}")

