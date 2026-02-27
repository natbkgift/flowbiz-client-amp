from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import RedirectRule, SeoPageOverride

router = APIRouter(prefix="/v1", tags=["meta"])


def _normalize_path(value: str) -> str:
    raw = value.strip() or "/"
    if not raw.startswith("/"):
        raw = f"/{raw}"
    if len(raw) > 1 and raw.endswith("/"):
        raw = raw[:-1]
    return raw


@router.get("/seo/resolve")
def resolve_seo_override(
    path: str = Query(..., min_length=1),
    locale: str = Query(default="en", min_length=2, max_length=8),
    db: Session = Depends(get_db),
) -> dict:
    normalized_path = _normalize_path(path)
    normalized_locale = locale.strip().lower()
    row = db.scalar(
        select(SeoPageOverride).where(
            SeoPageOverride.path == normalized_path,
            SeoPageOverride.locale == normalized_locale,
            SeoPageOverride.enabled.is_(True),
        )
    )
    if row is None:
        return {"found": False, "path": normalized_path, "locale": normalized_locale}

    return {
        "found": True,
        "path": row.path,
        "locale": row.locale,
        "title": row.title,
        "description": row.description,
        "canonical": row.canonical,
        "robots": {"index": row.robots_index, "follow": row.robots_follow},
        "schema": {
            "organization_name": row.schema_org_name,
            "local_business_name": row.schema_local_business_name,
            "article_author": row.schema_article_author,
        },
    }


@router.get("/redirects/resolve")
def resolve_redirect(
    path: str = Query(..., min_length=1),
    query_string: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    normalized_path = _normalize_path(path)
    row = db.scalar(
        select(RedirectRule).where(
            RedirectRule.old_path == normalized_path,
            RedirectRule.enabled.is_(True),
        )
    )
    if row is None:
        return {"matched": False, "path": normalized_path}

    location = row.new_path
    if row.preserve_query and query_string:
        sep = "&" if "?" in location else "?"
        location = f"{location}{sep}{query_string}"
    return {
        "matched": True,
        "path": normalized_path,
        "location": location,
        "status_code": row.status_code,
        "preserve_query": row.preserve_query,
    }
