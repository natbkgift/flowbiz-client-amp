from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Article, MediaAsset

router = APIRouter(prefix="/v1/content", tags=["content"])


def _safe_media_path(value: object | None) -> str | None:
    if not isinstance(value, str):
        return None
    candidate = value.strip()
    if not candidate or "://" in candidate:
        return None
    return candidate


def _localized_complete(payload: dict | None) -> bool:
    if not isinstance(payload, dict):
        return False
    en = payload.get("en")
    th = payload.get("th")
    return bool(en) and bool(th)


def _hero_rights_ok(db: Session, article: Article) -> bool:
    if not article.hero_image_url or "://" in article.hero_image_url:
        return False
    if not article.hero_media_asset_id:
        return False
    media = db.get(MediaAsset, article.hero_media_asset_id)
    if media is None:
        return False
    return (media.approval_status or "").lower() == "approved"


def _taxonomy_value(value: Any) -> list[str] | dict[str, list[str]] | None:
    if isinstance(value, dict):
        localized: dict[str, list[str]] = {}
        for key in ["en", "th"]:
            nested = _taxonomy_value(value.get(key))
            if isinstance(nested, list) and nested:
                localized[key] = nested
        return localized or None
    if isinstance(value, list):
        out: list[str] = []
        seen: set[str] = set()
        for item in value:
            text = str(item or "").strip()
            if not text:
                continue
            normalized = text.casefold()
            if normalized in seen:
                continue
            seen.add(normalized)
            out.append(text)
        return out or None
    if isinstance(value, str):
        return _taxonomy_value([part.strip() for part in value.split(",")])
    return None


def _article_metadata(article: Article) -> tuple[dict[str, Any], dict[str, Any]]:
    body_meta = article.body_md if isinstance(article.body_md, dict) else {}
    source_meta = body_meta.get("source_meta") if isinstance(body_meta.get("source_meta"), dict) else {}
    author_profile = body_meta.get("author_profile") if isinstance(body_meta.get("author_profile"), dict) else {}
    return source_meta, author_profile


def _publishable(db: Session, article: Article) -> bool:
    if article.status != "published":
        return False
    if not _localized_complete(article.title):
        return False
    if not _localized_complete(article.body_md):
        return False
    return _hero_rights_ok(db, article)


def _serialize(article: Article) -> dict:
    body_meta = article.body_md if isinstance(article.body_md, dict) else {}
    tags = _taxonomy_value(body_meta.get("tags"))
    topics = _taxonomy_value(body_meta.get("topics"))
    source_meta, author_profile = _article_metadata(article)
    return {
        "id": str(article.id),
        "slug": article.slug,
        "category": article.category,
        "title": article.title,
        "excerpt": article.excerpt,
        "body_md": article.body_md,
        "hero_image_url": _safe_media_path(article.hero_image_url),
        "published_at": article.published_at.isoformat() if article.published_at else None,
        "updated_at": article.updated_at.isoformat() if article.updated_at else None,
        "tags": tags,
        "topics": topics,
        "author_profile": author_profile or None,
        "source_meta": source_meta or None,
    }


@router.get("/blog-posts/")
def list_blog_posts(
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[dict]:
    rows = db.scalars(
        select(Article)
        .where(Article.deleted_at.is_(None), Article.category == "blog")
        .order_by(desc(Article.published_at), desc(Article.created_at))
        .limit(limit)
    ).all()
    return [_serialize(row) for row in rows if _publishable(db, row)]


@router.get("/blog-posts/{slug}/")
def get_blog_post(slug: str, db: Session = Depends(get_db)) -> dict:
    row = db.scalar(select(Article).where(Article.slug == slug, Article.deleted_at.is_(None)))
    if row is None or row.category != "blog" or not _publishable(db, row):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")
    return _serialize(row)


@router.get("/guides/")
def list_guides(
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[dict]:
    rows = db.scalars(
        select(Article)
        .where(Article.deleted_at.is_(None), Article.category == "guide")
        .order_by(desc(Article.published_at), desc(Article.created_at))
        .limit(limit)
    ).all()
    return [_serialize(row) for row in rows if _publishable(db, row)]


@router.get("/guides/{slug}/")
def get_guide(slug: str, db: Session = Depends(get_db)) -> dict:
    row = db.scalar(select(Article).where(Article.slug == slug, Article.deleted_at.is_(None)))
    if row is None or row.category != "guide" or not _publishable(db, row):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")
    return _serialize(row)
