from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from packages.core.database import SessionLocal, init_db
from packages.core.media_library import require_local_media_path
from packages.core.models import Article, CompanyInfo, TeamMember, Testimonial

_SYNCABLE_ENTITIES = {"company_info", "team_members", "testimonials", "articles"}
_MANAGED_COMPANY_SLUGS = {
    "about",
    "how-we-work",
    "contact",
    "privacy",
    "terms",
    "cookies",
    "investment-methodology",
}


def _load_rows(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return [row for row in raw if isinstance(row, dict)]
    if isinstance(raw, dict) and isinstance(raw.get("data"), list):
        return [row for row in raw["data"] if isinstance(row, dict)]
    return []


def _upsert_company_info(
    db: Session, rows: list[dict[str, Any]], *, dry_run: bool
) -> tuple[int, int]:
    created = 0
    updated = 0
    for row in rows:
        slug = str(row.get("slug") or "").strip()
        title = str(row.get("title") or "").strip()
        content = str(row.get("content") or "").strip()
        if not slug or not title or not content:
            continue

        existing = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == slug))
        values = {
            "title": title,
            "content": content,
            "meta_title": str(row.get("meta_title") or "").strip() or None,
            "meta_description": str(row.get("meta_description") or "").strip() or None,
        }
        if existing is None:
            if not dry_run:
                db.add(CompanyInfo(slug=slug, **values))
            created += 1
        else:
            if not dry_run:
                for key, value in values.items():
                    setattr(existing, key, value)
                db.add(existing)
            updated += 1
    return created, updated


def _upsert_team_members(
    db: Session, rows: list[dict[str, Any]], *, dry_run: bool
) -> tuple[int, int]:
    created = 0
    updated = 0
    for index, row in enumerate(rows, 1):
        name = str(row.get("name") or "").strip()
        role_title = str(row.get("role_title") or "").strip()
        if not name or not role_title:
            continue

        photo_raw = str(row.get("photo_url") or "").strip() or None
        if photo_raw is not None:
            try:
                photo_raw = require_local_media_path(photo_raw, field_name="photo_url")
            except Exception as exc:  # HTTPException in normal path
                detail = getattr(exc, "detail", str(exc))
                raise ValueError(f"team_members[{index}] invalid photo_url: {detail}") from exc

        existing = db.scalar(
            select(TeamMember)
            .where(
                TeamMember.deleted_at.is_(None),
                TeamMember.name == name,
                TeamMember.role_title == role_title,
            )
            .limit(1)
        )
        values = {
            "bio": row.get("bio") if isinstance(row.get("bio"), dict) else None,
            "photo_url": photo_raw,
            "languages": list(row.get("languages") or []) or None,
            "specialties": list(row.get("specialties") or []) or None,
            "display_order": int(row.get("display_order") or 0),
            "status": str(row.get("status") or "active").strip() or "active",
        }
        if existing is None:
            if not dry_run:
                db.add(TeamMember(name=name, role_title=role_title, **values))
            created += 1
        else:
            if not dry_run:
                for key, value in values.items():
                    setattr(existing, key, value)
                db.add(existing)
            updated += 1
    return created, updated


def _upsert_testimonials(
    db: Session, rows: list[dict[str, Any]], *, dry_run: bool
) -> tuple[int, int]:
    created = 0
    updated = 0
    for row in rows:
        quote = str(row.get("quote") or "").strip()
        persona = str(row.get("persona") or "").strip()
        intent = str(row.get("intent") or "").strip()
        if not quote or not persona or not intent:
            continue

        attribution_name = str(row.get("attribution_name") or "").strip() or None
        existing = db.scalar(
            select(Testimonial)
            .where(
                Testimonial.deleted_at.is_(None),
                Testimonial.quote == quote,
                Testimonial.attribution_name == attribution_name,
            )
            .limit(1)
        )
        values = {
            "status": str(row.get("status") or "published").strip() or "published",
            "persona": persona,
            "intent": intent,
            "context": str(row.get("context") or "").strip() or None,
            "display_order": int(row.get("display_order") or 0),
        }
        if existing is None:
            if not dry_run:
                db.add(
                    Testimonial(
                        quote=quote,
                        attribution_name=attribution_name,
                        **values,
                    )
                )
            created += 1
        else:
            if not dry_run:
                for key, value in values.items():
                    setattr(existing, key, value)
                db.add(existing)
            updated += 1
    return created, updated


def _coerce_localized_text(value: Any) -> dict[str, str]:
    if isinstance(value, dict):
        en = str(value.get("en") or "").strip()
        th = str(value.get("th") or "").strip()
        out: dict[str, str] = {}
        if en:
            out["en"] = en
        if th:
            out["th"] = th
        return out
    text = str(value or "").strip()
    return {"en": text} if text else {}


def _coerce_localized_profile(value: Any) -> dict[str, str]:
    if isinstance(value, dict):
        out: dict[str, str] = {}
        for key in ["en", "th"]:
            text = str(value.get(key) or "").strip()
            if text:
                out[key] = text
        return out
    text = str(value or "").strip()
    return {"en": text} if text else {}


def _coerce_taxonomy_list(value: Any) -> list[str]:
    if isinstance(value, list):
        values = [str(item).strip() for item in value if str(item).strip()]
    elif isinstance(value, str):
        values = [part.strip() for part in value.split(",") if part.strip()]
    else:
        values = []
    out: list[str] = []
    seen: set[str] = set()
    for item in values:
        normalized = item.casefold()
        if normalized in seen:
            continue
        seen.add(normalized)
        out.append(item)
    return out


def _coerce_taxonomy_value(value: Any) -> list[str] | dict[str, list[str]]:
    if isinstance(value, dict):
        localized: dict[str, list[str]] = {}
        for key in ["en", "th"]:
            values = _coerce_taxonomy_list(value.get(key))
            if values:
                localized[key] = values
        return localized
    return _coerce_taxonomy_list(value)


def _parse_optional_datetime(value: Any) -> datetime | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _upsert_articles(db: Session, rows: list[dict[str, Any]], *, dry_run: bool) -> tuple[int, int]:
    created = 0
    updated = 0
    for index, row in enumerate(rows, 1):
        slug = str(row.get("slug") or "").strip()
        category = str(row.get("category") or "guide").strip() or "guide"
        status = str(row.get("status") or "published").strip() or "published"
        title = _coerce_localized_text(row.get("title"))
        body_md = _coerce_localized_text(row.get("body_md"))
        excerpt = _coerce_localized_text(row.get("excerpt"))
        if not slug or not title or not body_md:
            continue

        hero_image_url = str(row.get("hero_image_url") or "").strip() or None
        if hero_image_url is not None:
            try:
                hero_image_url = require_local_media_path(
                    hero_image_url, field_name="hero_image_url"
                )
            except Exception as exc:
                detail = getattr(exc, "detail", str(exc))
                raise ValueError(f"articles[{index}] invalid hero_image_url: {detail}") from exc

        tags = _coerce_taxonomy_value(row.get("tags"))
        topics = _coerce_taxonomy_value(row.get("topics"))
        author_name = _coerce_localized_profile(row.get("author_name"))
        author_role = _coerce_localized_profile(row.get("author_role"))
        author_bio = _coerce_localized_profile(row.get("author_bio"))
        author_profile: dict[str, Any] = {}
        if author_name:
            author_profile["name"] = author_name
        if author_role:
            author_profile["role"] = author_role
        if author_bio:
            author_profile["bio"] = author_bio
        source_meta: dict[str, Any] = {}
        source_url = str(row.get("source_url") or "").strip()
        source_domain = str(row.get("source_domain") or "").strip()
        source_rights = str(row.get("source_rights") or "").strip()
        if source_url:
            source_meta["url"] = source_url
        if source_domain:
            source_meta["domain"] = source_domain
        if source_rights:
            source_meta["rights"] = source_rights

        body_payload = dict(body_md)
        if tags:
            body_payload["tags"] = tags
        if topics:
            body_payload["topics"] = topics
        if author_profile:
            body_payload["author_profile"] = author_profile
        if source_meta:
            body_payload["source_meta"] = source_meta
        published_at = _parse_optional_datetime(row.get("published_at"))
        updated_at = _parse_optional_datetime(row.get("updated_at"))

        existing = db.scalar(select(Article).where(Article.slug == slug).limit(1))
        values = {
            "category": category,
            "status": status,
            "title": title,
            "excerpt": excerpt or None,
            "body_md": body_payload,
            "hero_image_url": hero_image_url,
            "published_at": published_at,
        }
        if existing is None:
            if not dry_run:
                article = Article(slug=slug, **values)
                if updated_at is not None:
                    article.updated_at = updated_at
                db.add(article)
            created += 1
        else:
            if not dry_run:
                for key, value in values.items():
                    setattr(existing, key, value)
                if updated_at is not None:
                    existing.updated_at = updated_at
                db.add(existing)
            updated += 1
    return created, updated


def _sync_company_info(db: Session, rows: list[dict[str, Any]], *, dry_run: bool) -> int:
    slugs = {
        str(row.get("slug") or "").strip() for row in rows if str(row.get("slug") or "").strip()
    }
    removable = _MANAGED_COMPANY_SLUGS - slugs
    if not removable:
        return 0
    if dry_run:
        return len(
            db.scalars(
                select(CompanyInfo.slug).where(CompanyInfo.slug.in_(sorted(removable)))
            ).all()
        )
    result = db.execute(delete(CompanyInfo).where(CompanyInfo.slug.in_(sorted(removable))))
    return int(result.rowcount or 0)


def _sync_team_members(db: Session, rows: list[dict[str, Any]], *, dry_run: bool) -> int:
    keys = {
        (str(row.get("name") or "").strip(), str(row.get("role_title") or "").strip())
        for row in rows
        if str(row.get("name") or "").strip() and str(row.get("role_title") or "").strip()
    }
    existing_rows = db.scalars(select(TeamMember).where(TeamMember.deleted_at.is_(None))).all()
    removable_ids = [row.id for row in existing_rows if (row.name, row.role_title) not in keys]
    if dry_run:
        return len(removable_ids)
    if not removable_ids:
        return 0
    result = db.execute(delete(TeamMember).where(TeamMember.id.in_(removable_ids)))
    return int(result.rowcount or 0)


def _sync_testimonials(db: Session, rows: list[dict[str, Any]], *, dry_run: bool) -> int:
    keys = {
        (
            str(row.get("quote") or "").strip(),
            str(row.get("attribution_name") or "").strip() or None,
        )
        for row in rows
        if str(row.get("quote") or "").strip()
    }
    existing_rows = db.scalars(select(Testimonial).where(Testimonial.deleted_at.is_(None))).all()
    removable_ids = [
        row.id for row in existing_rows if (row.quote, row.attribution_name) not in keys
    ]
    if dry_run:
        return len(removable_ids)
    if not removable_ids:
        return 0
    result = db.execute(delete(Testimonial).where(Testimonial.id.in_(removable_ids)))
    return int(result.rowcount or 0)


def _sync_articles(db: Session, rows: list[dict[str, Any]], *, dry_run: bool) -> int:
    slugs = {
        str(row.get("slug") or "").strip() for row in rows if str(row.get("slug") or "").strip()
    }
    existing_rows = db.scalars(select(Article).where(Article.deleted_at.is_(None))).all()
    removable_ids = [row.id for row in existing_rows if row.slug not in slugs]
    if dry_run:
        return len(removable_ids)
    if not removable_ids:
        return 0
    result = db.execute(delete(Article).where(Article.id.in_(removable_ids)))
    return int(result.rowcount or 0)


def seed_content(
    *, input_dir: Path, dry_run: bool, sync_entities: set[str] | None = None
) -> dict[str, dict[str, int]]:
    init_db()
    company_rows = _load_rows(input_dir / "company_info.json")
    team_rows = _load_rows(input_dir / "team_members.json")
    testimonial_rows = _load_rows(input_dir / "testimonials.json")
    article_rows = _load_rows(input_dir / "articles.json")
    sync_entities = set(sync_entities or set()) & _SYNCABLE_ENTITIES

    with SessionLocal() as db:
        company_created, company_updated = _upsert_company_info(db, company_rows, dry_run=dry_run)
        team_created, team_updated = _upsert_team_members(db, team_rows, dry_run=dry_run)
        testimonial_created, testimonial_updated = _upsert_testimonials(
            db, testimonial_rows, dry_run=dry_run
        )
        article_created, article_updated = _upsert_articles(db, article_rows, dry_run=dry_run)
        company_removed = (
            _sync_company_info(db, company_rows, dry_run=dry_run)
            if "company_info" in sync_entities
            else 0
        )
        team_removed = (
            _sync_team_members(db, team_rows, dry_run=dry_run)
            if "team_members" in sync_entities
            else 0
        )
        testimonial_removed = (
            _sync_testimonials(db, testimonial_rows, dry_run=dry_run)
            if "testimonials" in sync_entities
            else 0
        )
        article_removed = (
            _sync_articles(db, article_rows, dry_run=dry_run)
            if "articles" in sync_entities
            else 0
        )
        if not dry_run:
            db.commit()

    return {
        "company_info": {
            "created": company_created,
            "updated": company_updated,
            "removed": company_removed,
        },
        "team_members": {"created": team_created, "updated": team_updated, "removed": team_removed},
        "testimonials": {
            "created": testimonial_created,
            "updated": testimonial_updated,
            "removed": testimonial_removed,
        },
        "articles": {
            "created": article_created,
            "updated": article_updated,
            "removed": article_removed,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Seed CompanyInfo, TeamMember, and Testimonial content"
    )
    parser.add_argument(
        "--input", default="data/import", help="Input directory containing JSON files"
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate and count only")
    parser.add_argument(
        "--sync",
        nargs="*",
        choices=sorted(_SYNCABLE_ENTITIES),
        default=[],
        help="Explicitly remove existing rows for listed entities when they are not present in the input set",
    )
    args = parser.parse_args()

    summary = seed_content(
        input_dir=Path(args.input), dry_run=bool(args.dry_run), sync_entities=set(args.sync or [])
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
