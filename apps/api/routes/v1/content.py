from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Article, MediaAsset

router = APIRouter(prefix="/v1/content", tags=["content"])


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


def _publishable(db: Session, article: Article) -> bool:
    if article.status != "published":
        return False
    if not _localized_complete(article.title):
        return False
    if not _localized_complete(article.body_md):
        return False
    return _hero_rights_ok(db, article)


def _serialize(article: Article) -> dict:
    return {
        "id": str(article.id),
        "slug": article.slug,
        "category": article.category,
        "title": article.title,
        "excerpt": article.excerpt,
        "body_md": article.body_md,
        "hero_image_url": article.hero_image_url,
        "published_at": article.published_at.isoformat() if article.published_at else None,
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
