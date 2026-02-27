from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.media_library import require_local_media_path
from packages.core.models import Article, MediaAsset, User

router = APIRouter(prefix="/admin", tags=["admin"])


class HeroImageIngestRequest(BaseModel):
    storage_path: str
    source_url: str | None = None
    source_domain: str | None = None
    rights_status: str | None = None
    approval_status: str | None = None
    publish_now: bool = False


@router.post("/content/articles/{slug}/hero-image/ingest")
def ingest_article_hero_image(
    slug: str,
    payload: HeroImageIngestRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    article = db.scalar(select(Article).where(Article.slug == slug, Article.deleted_at.is_(None)))
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    normalized_path = require_local_media_path(payload.storage_path, field_name="storage_path")
    media = db.scalar(select(MediaAsset).where(MediaAsset.storage_path == normalized_path))
    if media is None:
        media = MediaAsset(
            id=uuid4(),
            storage_path=normalized_path,
            kind="image",
            mime_type="image/jpeg",
            file_size_bytes=1,
            checksum_sha256=(uuid4().hex + uuid4().hex)[:64],
            source_url=payload.source_url,
            source_domain=payload.source_domain,
            rights_status=payload.rights_status,
            approval_status=payload.approval_status,
            status="active",
        )
        db.add(media)
        db.flush()
    else:
        if payload.source_url is not None:
            media.source_url = payload.source_url
        if payload.source_domain is not None:
            media.source_domain = payload.source_domain
        if payload.rights_status is not None:
            media.rights_status = payload.rights_status
        if payload.approval_status is not None:
            media.approval_status = payload.approval_status

    article.hero_image_url = normalized_path
    article.hero_media_asset_id = media.id
    if payload.publish_now:
        article.status = "published"
    db.add(article)
    db.commit()
    db.refresh(article)

    return {
        "article": {
            "id": str(article.id),
            "slug": article.slug,
            "status": article.status,
            "hero_image_url": article.hero_image_url,
            "hero_media_asset_id": str(article.hero_media_asset_id) if article.hero_media_asset_id else None,
        }
    }
