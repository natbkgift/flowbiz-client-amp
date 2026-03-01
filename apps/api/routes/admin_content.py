from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.media_library import require_local_media_path
from packages.core.models import Article, MediaAsset, User
from packages.core.seo_controls import upsert_slug_redirects

router = APIRouter(prefix="/admin", tags=["admin"])


class HeroImageIngestRequest(BaseModel):
    storage_path: str
    source_url: str | None = None
    source_domain: str | None = None
    rights_status: str | None = None
    approval_status: str | None = None
    publish_now: bool = False


class ArticleEditorialUpdateRequest(BaseModel):
    slug: str | None = None
    title: dict[str, str] | str | None = None
    excerpt: dict[str, str] | str | None = None
    body_md: dict[str, str] | str | None = None
    tags: Any = None
    topics: Any = None
    author_name: dict[str, str] | str | None = None
    author_role: dict[str, str] | str | None = None
    author_bio: dict[str, str] | str | None = None
    source_url: str | None = None
    source_domain: str | None = None
    source_rights: str | None = None
    published_at: datetime | None = None
    updated_at: datetime | None = None
    status: str | None = None


def _to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _coerce_localized_text(
    value: dict[str, str] | str | None, *, field_name: str
) -> dict[str, str]:
    if isinstance(value, str):
        text = value.strip()
        if text:
            return {"en": text}
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must not be empty",
        )
    if isinstance(value, dict):
        out: dict[str, str] = {}
        for key in ["en", "th"]:
            text = str(value.get(key) or "").strip()
            if text:
                out[key] = text
        if out:
            return out
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"{field_name} must include at least one localized value",
    )


def _coerce_optional_localized_text(
    value: dict[str, str] | str | None, *, field_name: str
) -> dict[str, str] | None:
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        return {"en": text} if text else None
    if isinstance(value, dict):
        out: dict[str, str] = {}
        for key in ["en", "th"]:
            text = str(value.get(key) or "").strip()
            if text:
                out[key] = text
        return out or None
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"{field_name} must be localized text",
    )


def _coerce_taxonomy_list(value: Any) -> list[str]:
    if isinstance(value, list):
        values = [str(item).strip() for item in value if str(item).strip()]
    elif isinstance(value, str):
        values = [part.strip() for part in value.split(",") if part.strip()]
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="taxonomy must be list, comma-separated string, or localized object",
        )
    out: list[str] = []
    seen: set[str] = set()
    for item in values:
        normalized = item.casefold()
        if normalized in seen:
            continue
        seen.add(normalized)
        out.append(item)
    return out


def _coerce_taxonomy(value: Any) -> list[str] | dict[str, list[str]] | None:
    if value is None:
        return None
    if isinstance(value, dict):
        localized: dict[str, list[str]] = {}
        for key in ["en", "th"]:
            raw = value.get(key)
            if raw is None:
                continue
            localized_values = _coerce_taxonomy_list(raw)
            if localized_values:
                localized[key] = localized_values
        return localized or {}
    return _coerce_taxonomy_list(value)


def _article_payload(article: Article) -> dict[str, Any]:
    if isinstance(article.body_md, dict):
        return dict(article.body_md)
    return {}


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
            "hero_media_asset_id": str(article.hero_media_asset_id)
            if article.hero_media_asset_id
            else None,
        }
    }


@router.patch("/content/articles/{slug}/editorial")
def update_article_editorial(
    slug: str,
    payload: ArticleEditorialUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    article = db.scalar(select(Article).where(Article.slug == slug, Article.deleted_at.is_(None)))
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    old_slug = str(article.slug or "").strip()
    category = str(article.category or "").strip().lower()

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No editable fields provided"
        )

    if "title" in updates:
        article.title = _coerce_localized_text(payload.title, field_name="title")
    if "excerpt" in updates:
        article.excerpt = _coerce_optional_localized_text(payload.excerpt, field_name="excerpt")

    body_payload = _article_payload(article)
    if "body_md" in updates:
        localized_body = _coerce_localized_text(payload.body_md, field_name="body_md")
        for key, value in localized_body.items():
            body_payload[key] = value

    if "tags" in updates:
        taxonomy = _coerce_taxonomy(payload.tags)
        if taxonomy:
            body_payload["tags"] = taxonomy
        else:
            body_payload.pop("tags", None)
    if "topics" in updates:
        taxonomy = _coerce_taxonomy(payload.topics)
        if taxonomy:
            body_payload["topics"] = taxonomy
        else:
            body_payload.pop("topics", None)

    if any(key in updates for key in {"author_name", "author_role", "author_bio"}):
        author_profile = (
            dict(body_payload.get("author_profile"))
            if isinstance(body_payload.get("author_profile"), dict)
            else {}
        )
        if "author_name" in updates:
            author_name = _coerce_optional_localized_text(
                payload.author_name, field_name="author_name"
            )
            if author_name:
                author_profile["name"] = author_name
            else:
                author_profile.pop("name", None)
        if "author_role" in updates:
            author_role = _coerce_optional_localized_text(
                payload.author_role, field_name="author_role"
            )
            if author_role:
                author_profile["role"] = author_role
            else:
                author_profile.pop("role", None)
        if "author_bio" in updates:
            author_bio = _coerce_optional_localized_text(
                payload.author_bio, field_name="author_bio"
            )
            if author_bio:
                author_profile["bio"] = author_bio
            else:
                author_profile.pop("bio", None)
        if author_profile:
            body_payload["author_profile"] = author_profile
        else:
            body_payload.pop("author_profile", None)

    if any(key in updates for key in {"source_url", "source_domain", "source_rights"}):
        source_meta = (
            dict(body_payload.get("source_meta"))
            if isinstance(body_payload.get("source_meta"), dict)
            else {}
        )
        if "source_url" in updates:
            source_url = str(payload.source_url or "").strip()
            if source_url:
                source_meta["url"] = source_url
            else:
                source_meta.pop("url", None)
        if "source_domain" in updates:
            source_domain = str(payload.source_domain or "").strip()
            if source_domain:
                source_meta["domain"] = source_domain
            else:
                source_meta.pop("domain", None)
        if "source_rights" in updates:
            source_rights = str(payload.source_rights or "").strip()
            if source_rights:
                source_meta["rights"] = source_rights
            else:
                source_meta.pop("rights", None)
        if source_meta:
            body_payload["source_meta"] = source_meta
        else:
            body_payload.pop("source_meta", None)

    article.body_md = body_payload

    if "slug" in updates:
        new_slug = str(payload.slug or "").strip()
        if not new_slug:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="slug must not be empty",
            )
        conflict = db.scalar(
            select(Article).where(
                Article.slug == new_slug,
                Article.deleted_at.is_(None),
                Article.id != article.id,
            )
        )
        if conflict is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Article slug already exists",
            )
        article.slug = new_slug

    if "status" in updates:
        status_text = str(payload.status or "").strip().lower()
        if status_text not in {"draft", "published", "archived"}:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="status must be one of: draft, published, archived",
            )
        article.status = status_text
    if "published_at" in updates:
        article.published_at = _to_utc(payload.published_at) if payload.published_at else None
    if "updated_at" in updates and payload.updated_at is not None:
        article.updated_at = _to_utc(payload.updated_at)

    if "slug" in updates:
        redirect_entity = "blog" if category == "blog" else "guide"
        upsert_slug_redirects(
            db,
            entity=redirect_entity,
            old_slug=old_slug,
            new_slug=str(article.slug or "").strip(),
        )

    db.add(article)
    db.commit()
    db.refresh(article)

    return {
        "article": {
            "id": str(article.id),
            "slug": article.slug,
            "status": article.status,
            "title": article.title,
            "excerpt": article.excerpt,
            "body_md": article.body_md,
            "published_at": article.published_at.isoformat() if article.published_at else None,
            "updated_at": article.updated_at.isoformat() if article.updated_at else None,
        }
    }
