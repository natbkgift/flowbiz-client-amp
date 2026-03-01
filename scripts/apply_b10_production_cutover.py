"""Apply B10 production schema baseline + legacy redirect preload.

Usage:
  python scripts/apply_b10_production_cutover.py --dry-run
  python scripts/apply_b10_production_cutover.py
  python scripts/apply_b10_production_cutover.py --locale en --overwrite-existing
"""
# ruff: noqa: E402

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import select

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from packages.core.database import SessionLocal, init_db
from packages.core.media_library import require_local_media_path
from packages.core.models import RedirectRule, SeoPageOverride
from packages.core.seo_controls import normalize_locale, normalize_path, upsert_redirect_rule
from packages.core.seo_cutover_profiles import (
    load_production_legacy_redirect_rows,
    load_production_schema_profile,
    load_production_schema_profiles,
)


def _opt_text(value: Any) -> str | None:
    text = str(value or "").strip()
    return text or None


def _opt_list(value: Any) -> list[str] | None:
    if not isinstance(value, list):
        return None
    out: list[str] = []
    seen: set[str] = set()
    for raw in value:
        item = str(raw or "").strip()
        if not item or item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out or None


def _apply_schema(
    *,
    dry_run: bool,
    overwrite_existing: bool,
    locale: str | None,
) -> dict[str, int]:
    profiles = load_production_schema_profiles()
    if not profiles:
        return {"upserted": 0, "skipped_existing": 0, "missing_profile": 0}

    locales = [normalize_locale(locale)] if locale else sorted(profiles.keys())
    upserted = 0
    skipped_existing = 0
    missing_profile = 0
    with SessionLocal() as db:
        for loc in locales:
            profile = load_production_schema_profile(loc)
            if profile is None:
                missing_profile += 1
                continue
            row = db.scalar(
                select(SeoPageOverride).where(
                    SeoPageOverride.path == "/",
                    SeoPageOverride.locale == loc,
                )
            )
            if row is not None and not overwrite_existing:
                skipped_existing += 1
                continue
            if row is None:
                row = SeoPageOverride(path="/", locale=loc)
            row.enabled = bool(profile.get("enabled", True))
            row.schema_org_name = _opt_text(profile.get("schema_org_name"))
            row.schema_org_url = _opt_text(profile.get("schema_org_url"))
            logo_path = _opt_text(profile.get("schema_org_logo_url"))
            row.schema_org_logo_url = (
                require_local_media_path(logo_path, field_name="schema_org_logo_url")
                if logo_path
                else None
            )
            row.schema_org_same_as = _opt_list(profile.get("schema_org_same_as"))
            row.schema_local_business_name = _opt_text(profile.get("schema_local_business_name"))
            row.schema_local_business_url = _opt_text(profile.get("schema_local_business_url"))
            row.schema_local_business_phone = _opt_text(profile.get("schema_local_business_phone"))
            row.schema_local_business_price_range = _opt_text(
                profile.get("schema_local_business_price_range")
            )
            row.schema_local_business_address = _opt_text(
                profile.get("schema_local_business_address")
            )
            row.schema_website_name = _opt_text(profile.get("schema_website_name"))
            row.schema_website_url = _opt_text(profile.get("schema_website_url"))
            row.schema_website_search_path = _opt_text(profile.get("schema_website_search_path"))
            row.schema_article_author = _opt_text(profile.get("schema_article_author"))
            row.schema_article_author_url = _opt_text(profile.get("schema_article_author_url"))
            db.add(row)
            upserted += 1
        if not dry_run:
            db.commit()
        else:
            db.rollback()
    return {
        "upserted": upserted,
        "skipped_existing": skipped_existing,
        "missing_profile": missing_profile,
    }


def _apply_redirects(*, dry_run: bool, overwrite_existing: bool) -> dict[str, int]:
    rows = load_production_legacy_redirect_rows()
    if not rows:
        return {"created": 0, "updated": 0, "skipped_existing": 0, "failed": 0}

    created = 0
    updated = 0
    skipped_existing = 0
    failed = 0
    with SessionLocal() as db:
        for row in rows:
            old_path = normalize_path(row.get("old_path"))
            existing = db.scalar(select(RedirectRule).where(RedirectRule.old_path == old_path))
            if existing is not None and not overwrite_existing:
                skipped_existing += 1
                continue
            try:
                upsert_redirect_rule(
                    db,
                    old_path=old_path,
                    new_path=str(row.get("new_path") or "").strip(),
                    status_code=int(row.get("status_code") or 301),
                    preserve_query=bool(row.get("preserve_query", True)),
                    enabled=bool(row.get("enabled", True)),
                )
                if existing is None:
                    created += 1
                else:
                    updated += 1
            except ValueError:
                failed += 1
        if not dry_run:
            db.commit()
        else:
            db.rollback()
    return {
        "created": created,
        "updated": updated,
        "skipped_existing": skipped_existing,
        "failed": failed,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply B10 production schema baseline and legacy redirect preload."
    )
    parser.add_argument("--dry-run", action="store_true", help="Do not persist DB changes")
    parser.add_argument(
        "--overwrite-existing",
        action="store_true",
        help="Allow replacing existing schema/redirect values",
    )
    parser.add_argument(
        "--locale",
        choices=["en", "th"],
        help="Apply schema source for one locale only (default applies both locales)",
    )
    parser.add_argument("--skip-schema", action="store_true")
    parser.add_argument("--skip-redirects", action="store_true")
    args = parser.parse_args()

    init_db()
    summary: dict[str, Any] = {"dry_run": bool(args.dry_run)}
    if not args.skip_schema:
        summary["schema"] = _apply_schema(
            dry_run=bool(args.dry_run),
            overwrite_existing=bool(args.overwrite_existing),
            locale=args.locale,
        )
    if not args.skip_redirects:
        summary["redirects"] = _apply_redirects(
            dry_run=bool(args.dry_run),
            overwrite_existing=bool(args.overwrite_existing),
        )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
