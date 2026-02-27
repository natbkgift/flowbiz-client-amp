from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from apps.api.routes.v1.content import _article_locales_complete, _hero_rights_ok
from packages.core.database import get_db
from packages.core.media_storage import MediaStorageService, parse_source_domain
from packages.core.models import Article, MediaAsset, User
from packages.core.schemas.content import ContentHeroIngestRequest, ContentHeroIngestResponse
from packages.core.source_rights_registry import (
    normalize_approval_status,
    normalize_rights_status,
    normalize_source_type,
)

router = APIRouter(prefix="/admin/content", tags=["admin"])


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _coerce_tags(tags: list[str] | None) -> list[str] | None:
    if tags is None:
        return None
    out: list[str] = []
    for tag in tags:
        value = str(tag).strip()
        if value and value not in out:
            out.append(value)
    return out or None


@router.post(
    "/articles/{slug}/hero-image/ingest",
    response_model=ContentHeroIngestResponse,
    status_code=201,
)
def ingest_article_hero_image(
    slug: str,
    payload: ContentHeroIngestRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ContentHeroIngestResponse:
    article = db.scalar(select(Article).where(Article.slug == slug, Article.deleted_at.is_(None)))
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    service = MediaStorageService()
    stored = service.ingest_from_url(str(payload.source_url))

    existing = db.scalar(select(MediaAsset).where(MediaAsset.checksum_sha256 == stored.checksum_sha256))
    deduped = existing is not None
    row = existing

    if row is None:
        row = MediaAsset(
            storage_path=stored.storage_path,
            kind="image",
            mime_type=stored.mime_type,
            file_size_bytes=stored.file_size_bytes,
            width=stored.width,
            height=stored.height,
            checksum_sha256=stored.checksum_sha256,
            source_url=str(payload.source_url),
            source_page_url=(str(payload.source_page_url) if payload.source_page_url is not None else None),
            source_domain=parse_source_domain(str(payload.source_url)),
            source_type=normalize_source_type(payload.source_type),
            rights_status=normalize_rights_status(payload.rights_status),
            approval_status=normalize_approval_status(payload.approval_status),
            approval_note=payload.approval_note,
            rights_note=payload.rights_note,
            license_evidence_url=(
                str(payload.license_evidence_url) if payload.license_evidence_url is not None else None
            ),
            exception_reason=payload.exception_reason,
            is_exception=bool(payload.is_exception) if payload.is_exception is not None else False,
            usage_scope=payload.usage_scope,
            linked_entity_hint=payload.linked_entity_hint,
            last_checked_at=_now_utc(),
            credit=payload.credit,
            title=payload.title,
            tags=_coerce_tags(payload.tags),
            status="active",
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    else:
        changed = False
        if row.source_url is None:
            row.source_url = str(payload.source_url)
            changed = True
        if row.source_domain is None:
            row.source_domain = parse_source_domain(str(payload.source_url))
            changed = True
        if payload.source_page_url is not None and row.source_page_url is None:
            row.source_page_url = str(payload.source_page_url)
            changed = True
        if payload.source_type is not None and row.source_type is None:
            row.source_type = normalize_source_type(payload.source_type)
            changed = True
        if payload.rights_status is not None and row.rights_status is None:
            row.rights_status = normalize_rights_status(payload.rights_status)
            changed = True
        if payload.approval_status is not None and row.approval_status is None:
            row.approval_status = normalize_approval_status(payload.approval_status)
            changed = True
        if payload.title is not None and row.title is None:
            row.title = payload.title
            changed = True
        if payload.credit is not None and row.credit is None:
            row.credit = payload.credit
            changed = True
        if payload.tags:
            row.tags = _coerce_tags(payload.tags)
            changed = True
        if changed:
            db.add(row)
            db.commit()
            db.refresh(row)

    article.hero_image_url = row.storage_path
    article.hero_media_asset_id = row.id
    db.add(article)

    published = False
    if payload.publish_now:
        if not _article_locales_complete(article):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Article must include complete en/th title and body before publish",
            )
        if not _hero_rights_ok(article, db):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Hero image must have approved rights metadata before publish",
            )
        article.status = "published"
        article.published_at = _now_utc()
        published = True

    db.commit()
    db.refresh(article)

    return ContentHeroIngestResponse(
        article_id=article.id,
        article_slug=article.slug,
        hero_image_url=article.hero_image_url or row.storage_path,
        hero_media_asset_id=row.id,
        deduped=deduped,
        published=published,
    )
