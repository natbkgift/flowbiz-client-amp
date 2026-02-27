from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Article, MediaAsset
from packages.core.schemas.content import (
    BlogPostDetailResponse,
    ContentSummaryItem,
    GuideDetailResponse,
    LocalizedText,
)

router = APIRouter(prefix="/v1/content", tags=["content"])


def _to_text_dict(value: dict | None) -> LocalizedText:
    if not isinstance(value, dict):
        return LocalizedText(en="", th="")
    en = str(value.get("en") or "").strip()
    th = str(value.get("th") or "").strip()
    return LocalizedText(en=en, th=th)


def _to_paragraphs(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        chunks = [segment.strip() for segment in value.split("\n\n")]
        return [segment for segment in chunks if segment]
    return []


def _is_local_media_path(value: str | None) -> bool:
    if not value:
        return False
    return value.startswith("/media/")


def _article_locales_complete(article: Article) -> bool:
    title = _to_text_dict(article.title)
    body = article.body_md if isinstance(article.body_md, dict) else {}
    body_en = _to_paragraphs(body.get("en"))
    body_th = _to_paragraphs(body.get("th"))
    return bool(title.en and title.th and body_en and body_th)


def _resolve_hero_media_asset(article: Article, db: Session) -> MediaAsset | None:
    if not _is_local_media_path(article.hero_image_url):
        return None
    if article.hero_media_asset_id is not None:
        row = db.get(MediaAsset, article.hero_media_asset_id)
        if row is not None:
            return row
    return db.scalar(select(MediaAsset).where(MediaAsset.storage_path == article.hero_image_url))


def _hero_rights_ok(article: Article, db: Session) -> bool:
    if not article.hero_image_url:
        return True
    if not _is_local_media_path(article.hero_image_url):
        return False

    media = _resolve_hero_media_asset(article, db)
    if media is None:
        return False

    approval_ok = (media.approval_status or "").strip().lower() == "approved"
    rights_status = (media.rights_status or "").strip().lower()
    rights_ok = rights_status in {"approved", "exception_allowed"}
    source_ok = bool(media.source_url and media.source_domain and media.source_type)
    return bool(approval_ok and rights_ok and source_ok)


def _is_publicly_publishable(article: Article, db: Session) -> bool:
    if article.status != "published" or article.deleted_at is not None:
        return False
    return _article_locales_complete(article) and _hero_rights_ok(article, db)


def _category_label(category: str) -> LocalizedText:
    normalized = (category or "article").strip().lower()
    if normalized == "guide":
        return LocalizedText(en="Guide", th="คู่มือ")
    if normalized == "blog":
        return LocalizedText(en="Blog", th="บล็อก")
    return LocalizedText(en="Article", th="บทความ")


def _to_summary(article: Article) -> ContentSummaryItem:
    return ContentSummaryItem(
        slug=article.slug,
        title=_to_text_dict(article.title),
        excerpt=_to_text_dict(article.excerpt) if isinstance(article.excerpt, dict) else None,
        category=_category_label(article.category),
        read_time=None,
        published_at=article.published_at,
        updated_at=article.updated_at,
        hero_image_url=article.hero_image_url,
    )


@router.get("/blog-posts/", response_model=list[ContentSummaryItem])
def list_blog_posts(db: Session = Depends(get_db)) -> list[ContentSummaryItem]:
    rows = db.scalars(
        select(Article)
        .where(Article.category == "blog")
        .order_by(desc(Article.published_at), desc(Article.updated_at), desc(Article.id))
    ).all()
    return [_to_summary(row) for row in rows if _is_publicly_publishable(row, db)]


@router.get("/blog-posts/{slug}/", response_model=BlogPostDetailResponse)
def get_blog_post(slug: str, db: Session = Depends(get_db)) -> BlogPostDetailResponse:
    row = db.scalar(select(Article).where(Article.category == "blog", Article.slug == slug))
    if row is None or not _is_publicly_publishable(row, db):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found")

    body = row.body_md if isinstance(row.body_md, dict) else {}
    summary = _to_summary(row)
    return BlogPostDetailResponse(
        **summary.model_dump(),
        body={
            "en": _to_paragraphs(body.get("en")),
            "th": _to_paragraphs(body.get("th")),
        },
        related_guides=[],
        links=[],
    )


@router.get("/guides/", response_model=list[ContentSummaryItem])
def list_guides(db: Session = Depends(get_db)) -> list[ContentSummaryItem]:
    rows = db.scalars(
        select(Article)
        .where(Article.category == "guide")
        .order_by(desc(Article.published_at), desc(Article.updated_at), desc(Article.id))
    ).all()
    return [_to_summary(row) for row in rows if _is_publicly_publishable(row, db)]


@router.get("/guides/{slug}/", response_model=GuideDetailResponse)
def get_guide(slug: str, db: Session = Depends(get_db)) -> GuideDetailResponse:
    row = db.scalar(select(Article).where(Article.category == "guide", Article.slug == slug))
    if row is None or not _is_publicly_publishable(row, db):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guide not found")

    body = row.body_md if isinstance(row.body_md, dict) else {}
    summary = _to_summary(row)
    return GuideDetailResponse(
        **summary.model_dump(),
        summary=_to_text_dict(row.excerpt) if isinstance(row.excerpt, dict) else None,
        checklist={
            "en": _to_paragraphs(body.get("en")),
            "th": _to_paragraphs(body.get("th")),
        },
        related_blog_posts=[],
        links=[],
    )
