#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from sqlalchemy import select

from packages.core.config import settings
from packages.core.database import SessionLocal
from packages.core.media_integrity import run_scan
from packages.core.media_storage import MediaStorageService, parse_source_domain
from packages.core.models import MediaAsset, Project, Property


@dataclass
class ActionStats:
    attempted_external_mirror: int = 0
    mirrored_external_success: int = 0
    mirrored_external_failed: int = 0
    property_refs_removed: int = 0
    property_rows_updated: int = 0
    property_cover_cleared: int = 0
    project_cover_cleared: int = 0


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="B2.R remediation for media integrity findings",
    )
    parser.add_argument("--apply", action="store_true", help="Apply DB changes. Default is dry-run.")
    parser.add_argument(
        "--write",
        default="ops/logs/b2r_remediation_report.json",
        help="Write remediation report JSON to path",
    )
    parser.add_argument(
        "--max-external-mirror",
        type=int,
        default=20,
        help="Maximum external project cover URLs to mirror in one run",
    )
    parser.add_argument(
        "--skip-clear-broken",
        action="store_true",
        help="Skip clearing broken local refs in properties/projects",
    )
    return parser.parse_args()


def _is_local_media_path(value: str) -> bool:
    prefix = settings.media_public_prefix.rstrip("/")
    return value.startswith(f"{prefix}/") or value == prefix


def _local_to_relative(value: str) -> Path:
    prefix = settings.media_public_prefix.rstrip("/")
    return Path(value[len(prefix):].lstrip("/"))


def _candidate_roots() -> list[Path]:
    roots = [Path(settings.media_storage_dir_resolved)]
    for extra in [Path("admin-app/public/media"), Path("public/media")]:
        if extra not in roots:
            roots.append(extra)
    return [p.resolve() for p in roots]


def _exists_in_any_root(value: str) -> tuple[bool, str | None]:
    if not _is_local_media_path(value):
        return False, None

    rel = _local_to_relative(value)
    for root in _candidate_roots():
        target = root / rel
        try:
            if target.exists() and target.is_file() and target.stat().st_size > 0:
                return True, str(root)
        except OSError:
            continue
    return False, None


def _classify_findings(report: dict[str, Any]) -> dict[str, Any]:
    env_mismatch = 0
    real_missing = 0
    by_entity: dict[str, int] = {}
    by_prefix: dict[str, int] = {}

    for finding in report.get("findings", []):
        entity = finding.get("entity", "")
        value = str(finding.get("value") or "")
        by_entity[entity] = by_entity.get(entity, 0) + 1

        if value.startswith("/media/"):
            parts = value.split("/")
            prefix = "/".join(parts[:3]) if len(parts) >= 3 else "/media"
            by_prefix[prefix] = by_prefix.get(prefix, 0) + 1

        if finding.get("category") == "missing_local_file":
            exists_elsewhere, _ = _exists_in_any_root(value)
            if exists_elsewhere:
                env_mismatch += 1
            else:
                real_missing += 1

    return {
        "missing_local_file_env_mismatch": env_mismatch,
        "missing_local_file_real_missing": real_missing,
        "top_entities": sorted(by_entity.items(), key=lambda x: x[1], reverse=True)[:10],
        "top_prefixes": sorted(by_prefix.items(), key=lambda x: x[1], reverse=True)[:10],
    }


def _mirror_external_project_covers(*, db, stats: ActionStats, max_items: int) -> list[dict[str, str]]:
    service = MediaStorageService()
    failures: list[dict[str, str]] = []

    projects = db.scalars(
        select(Project).where(Project.cover_image_url.is_not(None))
    ).all()

    for project in projects:
        value = (project.cover_image_url or "").strip()
        if not (value.startswith("http://") or value.startswith("https://")):
            continue

        if stats.attempted_external_mirror >= max_items:
            break

        stats.attempted_external_mirror += 1
        try:
            stored = service.ingest_from_url(value)

            existing = db.scalar(
                select(MediaAsset).where(MediaAsset.checksum_sha256 == stored.checksum_sha256)
            )
            if existing is None:
                existing = MediaAsset(
                    storage_path=stored.storage_path,
                    kind="image",
                    mime_type=stored.mime_type,
                    file_size_bytes=stored.file_size_bytes,
                    width=stored.width,
                    height=stored.height,
                    checksum_sha256=stored.checksum_sha256,
                    source_url=value,
                    source_domain=parse_source_domain(value),
                    source_type="remediation_mirror",
                    rights_status="unverified",
                    credit=parse_source_domain(value),
                    status="active",
                )
                db.add(existing)
                db.flush()

            project.cover_image_url = existing.storage_path
            stats.mirrored_external_success += 1
        except Exception as exc:  # noqa: BLE001
            stats.mirrored_external_failed += 1
            failures.append({
                "project_slug": project.slug,
                "url": value,
                "error": str(exc),
            })

    return failures


def _clear_broken_local_refs(*, db, stats: ActionStats) -> None:
    properties = db.scalars(select(Property)).all()
    for row in properties:
        changed = False

        original_images = list(row.images or []) if isinstance(row.images, list) else []
        kept_images: list[str] = []
        for item in original_images:
            val = str(item).strip()
            if not val:
                continue
            if _is_local_media_path(val):
                exists, _ = _exists_in_any_root(val)
                if not exists:
                    stats.property_refs_removed += 1
                    changed = True
                    continue
            kept_images.append(val)

        if kept_images != original_images:
            row.images = kept_images or None
            changed = True

        original_local_images = list(row.local_images or []) if isinstance(row.local_images, list) else []
        kept_local_images: list[str] = []
        for item in original_local_images:
            val = str(item).strip()
            if not val:
                continue
            if _is_local_media_path(val):
                exists, _ = _exists_in_any_root(val)
                if not exists:
                    changed = True
                    continue
            kept_local_images.append(val)

        if kept_local_images != original_local_images:
            row.local_images = kept_local_images or None
            changed = True

        if row.cover_image and _is_local_media_path(row.cover_image):
            exists, _ = _exists_in_any_root(row.cover_image)
            if not exists:
                row.cover_image = None
                stats.property_cover_cleared += 1
                changed = True

        if row.cover_image_url and _is_local_media_path(row.cover_image_url):
            exists, _ = _exists_in_any_root(row.cover_image_url)
            if not exists:
                row.cover_image_url = None
                stats.property_cover_cleared += 1
                changed = True

        if changed:
            stats.property_rows_updated += 1

    projects = db.scalars(select(Project)).all()
    for row in projects:
        if row.cover_image_url and _is_local_media_path(row.cover_image_url):
            exists, _ = _exists_in_any_root(row.cover_image_url)
            if not exists:
                row.cover_image_url = None
                stats.project_cover_cleared += 1


def main() -> int:
    args = _parse_args()

    report_out = Path(args.write)
    report_out.parent.mkdir(parents=True, exist_ok=True)

    stats = ActionStats()
    failures: list[dict[str, str]] = []

    with SessionLocal() as db:
        before = run_scan(db).to_dict()
        classification_before = _classify_findings(before)

        if args.apply:
            failures = _mirror_external_project_covers(
                db=db,
                stats=stats,
                max_items=args.max_external_mirror,
            )

            if not args.skip_clear_broken:
                _clear_broken_local_refs(db=db, stats=stats)

            db.commit()

        after = run_scan(db).to_dict()
        classification_after = _classify_findings(after)

    payload = {
        "mode": "apply" if args.apply else "dry-run",
        "config": {
            "media_storage_dir_resolved": settings.media_storage_dir_resolved,
            "media_public_prefix": settings.media_public_prefix,
            "candidate_roots": [str(p) for p in _candidate_roots()],
            "max_external_mirror": args.max_external_mirror,
            "skip_clear_broken": args.skip_clear_broken,
        },
        "before": before,
        "after": after,
        "classification_before": classification_before,
        "classification_after": classification_after,
        "actions": asdict(stats),
        "external_mirror_failures": failures,
        "todo": [
            "Review rights_status='unverified' mirrored assets and update legal/credit metadata.",
            "Confirm article image-field policy if/when articles.hero_image_url is introduced.",
        ],
    }

    report_out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"WROTE {report_out}")
    print("BEFORE", before["summary"])
    print("AFTER", after["summary"])
    print("ACTIONS", asdict(stats))
    if failures:
        print(f"MIRROR_FAILURES={len(failures)}")

    # Remediation command itself should not be used as strict gate.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
