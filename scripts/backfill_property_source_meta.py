from __future__ import annotations

import argparse
from datetime import UTC, datetime
from urllib.parse import urlparse

from sqlalchemy import select

from packages.core.database import SessionLocal, init_db
from packages.core.models import MediaAsset, Property


def _domain_from_url(value: str | None) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    try:
        parsed = urlparse(raw)
        return str(parsed.hostname or "").strip().lower()
    except ValueError:
        return ""


def _property_media_paths(prop: Property) -> list[str]:
    paths: list[str] = []
    for value in [prop.cover_image_url, prop.cover_image]:
        text = str(value or "").strip()
        if text.startswith("/media/"):
            paths.append(text)
    for payload in [prop.local_images, prop.images]:
        if not isinstance(payload, list):
            continue
        for value in payload:
            text = str(value or "").strip()
            if text.startswith("/media/"):
                paths.append(text)
    out: list[str] = []
    seen: set[str] = set()
    for path in paths:
        if path in seen:
            continue
        seen.add(path)
        out.append(path)
    return out


def run_backfill(*, write: bool) -> int:
    init_db()
    updated = 0
    scanned = 0
    with SessionLocal() as db:
        props = db.scalars(
            select(Property)
            .where(Property.deleted_at.is_(None))
            .order_by(Property.created_at.asc())
        ).all()
        for prop in props:
            scanned += 1
            source_meta = prop.source_meta if isinstance(prop.source_meta, dict) else {}
            mutable_meta = dict(source_meta)
            source_domain = str(mutable_meta.get("source_domain") or "").strip().lower()
            rights_status = str(mutable_meta.get("rights_status") or "").strip().lower()

            if not source_domain:
                source_domain = _domain_from_url(str(mutable_meta.get("source_url") or ""))
            if not source_domain:
                source_domain = _domain_from_url(str(mutable_meta.get("source") or ""))

            if not source_domain or not rights_status:
                for path in _property_media_paths(prop):
                    media = db.scalar(
                        select(MediaAsset).where(MediaAsset.storage_path == path).limit(1)
                    )
                    if media is None:
                        continue
                    if not source_domain:
                        source_domain = str(media.source_domain or "").strip().lower()
                    if not rights_status:
                        rights_status = str(media.rights_status or "").strip().lower()
                    if source_domain and rights_status:
                        break

            if not source_domain:
                source_domain = "flowbiz.com" if _property_media_paths(prop) else "unknown"
            if not rights_status:
                rights_status = "pending_review"

            changed = False
            if str(mutable_meta.get("source_domain") or "").strip().lower() != source_domain:
                mutable_meta["source_domain"] = source_domain
                changed = True
            if str(mutable_meta.get("rights_status") or "").strip().lower() != rights_status:
                mutable_meta["rights_status"] = rights_status
                changed = True

            if changed:
                mutable_meta["source_meta_backfilled_at"] = datetime.now(UTC).isoformat()
                updated += 1
                if write:
                    prop.source_meta = mutable_meta
                    db.add(prop)

        if write:
            db.commit()

    mode = "WRITE" if write else "DRY-RUN"
    print(f"[{mode}] scanned={scanned} updated={updated}")
    if not write:
        print("Use --write to persist changes.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backfill Property.source_meta with source_domain and rights_status."
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Persist backfilled metadata to DB (default: dry-run).",
    )
    args = parser.parse_args()
    return run_backfill(write=args.write)


if __name__ == "__main__":
    raise SystemExit(main())
