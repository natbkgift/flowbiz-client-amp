#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from packages.core.database import SessionLocal
from packages.core.models import MediaAsset, Project
from packages.core.source_rights_registry import (
    normalize_approval_status,
    normalize_rights_status,
    normalize_source_type,
)


@dataclass
class BackfillSummary:
    mapping_rows: int = 0
    matched_assets: int = 0
    updated_assets: int = 0
    skipped_existing: int = 0
    unmatched_rows: int = 0


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Backfill B12 source-rights registry metadata")
    parser.add_argument(
        "--mapping",
        default="data/import/project_cover_sources.json",
        help="Path to project cover source mapping JSON",
    )
    parser.add_argument(
        "--write",
        default="ops/logs/source_rights_backfill_report.json",
        help="Output JSON report path",
    )
    parser.add_argument(
        "--db-path",
        default=None,
        help="SQLite DB path override (for staging/prod-like backfill)",
    )
    parser.add_argument(
        "--database-url",
        default=None,
        help="Full SQLAlchemy database URL override (takes precedence over --db-path)",
    )
    parser.add_argument("--apply", action="store_true", help="Apply updates to DB")
    parser.add_argument("--force", action="store_true", help="Overwrite existing values")
    return parser.parse_args()


def _normalize_row(src: dict[str, Any]) -> dict[str, Any]:
    source_type = normalize_source_type(src.get("source_type")) or "unknown"
    rights_status = normalize_rights_status(src.get("rights_status")) or "pending_review"
    approval_status = "pending"
    if src.get("approved_for_seed"):
        approval_status = "approved" if rights_status not in {"pending_review"} else "pending"
    approval_status = normalize_approval_status(approval_status)

    is_exception = source_type in {"archive", "marketplace_exception"}
    exception_reason = src.get("notes") if is_exception else None

    return {
        "project_slug": src.get("project_slug"),
        "storage_path": src.get("mirrored_local_path"),
        "source_url": src.get("mirror_source_url") or src.get("cover_image_url"),
        "source_page_url": src.get("source_page_url"),
        "source_domain": (src.get("source_domain") or "").strip().lower() or None,
        "source_type": source_type,
        "rights_status": rights_status,
        "approval_status": approval_status,
        "credit": src.get("credit"),
        "rights_note": f"backfilled_from_project_cover_sources:{src.get('source_title') or ''}".strip(":"),
        "license_evidence_url": src.get("source_page_url"),
        "is_exception": is_exception,
        "exception_reason": exception_reason,
        "usage_scope": "project-card",
        "linked_entity_hint": f"project:{src.get('project_slug')}" if src.get("project_slug") else None,
    }


def _set_field(row: MediaAsset, field: str, value: Any, *, force: bool) -> bool:
    current = getattr(row, field)
    if force or current in (None, "", []):
        setattr(row, field, value)
        return True
    return False


def _find_asset(db, normalized: dict[str, Any]) -> MediaAsset | None:
    storage_path = normalized.get("storage_path")
    source_url = normalized.get("source_url")
    slug = normalized.get("project_slug")

    if storage_path:
        by_storage = db.scalar(select(MediaAsset).where(MediaAsset.storage_path == storage_path))
        if by_storage is not None:
            return by_storage

    if source_url:
        by_source = db.scalar(select(MediaAsset).where(MediaAsset.source_url == source_url))
        if by_source is not None:
            return by_source

    if slug:
        project = db.scalar(select(Project).where(Project.slug == slug))
        if project and project.cover_image_url and project.cover_image_url.startswith("/media/"):
            by_project_cover = db.scalar(
                select(MediaAsset).where(MediaAsset.storage_path == project.cover_image_url)
            )
            if by_project_cover is not None:
                return by_project_cover

    return None


def _build_session_factory(args: argparse.Namespace):
    if args.database_url:
        connect_args = {"check_same_thread": False} if args.database_url.startswith("sqlite:///") else {}
        engine = create_engine(args.database_url, connect_args=connect_args, future=True)
        return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    if args.db_path:
        db_path = Path(args.db_path).expanduser().resolve()
        database_url = f"sqlite:///{db_path.as_posix()}"
        engine = create_engine(database_url, connect_args={"check_same_thread": False}, future=True)
        return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    return SessionLocal


def main() -> int:
    args = _parse_args()
    mapping_path = Path(args.mapping)
    out_path = Path(args.write)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    session_factory = _build_session_factory(args)

    if not mapping_path.exists():
        raise SystemExit(f"Mapping file not found: {mapping_path}")

    rows = json.loads(mapping_path.read_text(encoding="utf-8"))
    summary = BackfillSummary(mapping_rows=len(rows))
    unmatched: list[dict[str, Any]] = []

    with session_factory() as db:
        for src in rows:
            normalized = _normalize_row(src)
            row = _find_asset(db, normalized)
            if row is None:
                summary.unmatched_rows += 1
                unmatched.append(
                    {
                        "project_slug": normalized.get("project_slug"),
                        "storage_path": normalized.get("storage_path"),
                        "source_url": normalized.get("source_url"),
                    }
                )
                continue

            summary.matched_assets += 1
            changed = False
            for field in [
                "source_url",
                "source_page_url",
                "source_domain",
                "source_type",
                "rights_status",
                "approval_status",
                "credit",
                "rights_note",
                "license_evidence_url",
                "exception_reason",
                "is_exception",
                "usage_scope",
                "linked_entity_hint",
            ]:
                if _set_field(row, field, normalized.get(field), force=args.force):
                    changed = True
                else:
                    summary.skipped_existing += 1

            if changed:
                summary.updated_assets += 1
                db.add(row)

        if args.apply:
            db.commit()
        else:
            db.rollback()

    payload = {
        "mode": "apply" if args.apply else "dry-run",
        "force": args.force,
        "mapping": str(mapping_path),
        "summary": asdict(summary),
        "unmatched": unmatched,
    }

    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"WROTE {out_path}")
    print(payload["summary"])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
