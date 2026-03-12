from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from typing import Any
from urllib.parse import parse_qs, urlparse
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.audit import write_audit_log
from packages.core.database import get_db
from packages.core.media_library import require_local_media_path
from packages.core.models import (
    Article,
    AuditLog,
    CompanyInfo,
    ContentTaxonomy,
    ContentVideo,
    MediaAsset,
    User,
)
from packages.core.seo_controls import upsert_slug_redirects

router = APIRouter(prefix="/admin", tags=["admin"])

_SITE_LAYOUT_CMS_SLUG = "site-layout"
_ARTICLE_STATUSES = {"draft", "in_review", "approved", "published", "archived"}
_ARTICLE_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"draft", "in_review"},
    "in_review": {"in_review", "approved"},
    "approved": {"approved", "published"},
    "published": {"published", "archived"},
    "archived": {"archived"},
}
_ARTICLE_ALLOWED_CATEGORIES = {"blog", "guide"}
_ARTICLE_PUBLISH_BLOCKING_LOCALES = ("en",)
_ARTICLE_PUBLISH_WARNING_LOCALES = ("th",)
_TAXONOMY_STATUSES = {"draft", "active", "archived"}
_VIDEO_STATUSES = {"draft", "published", "archived"}
_YOUTUBE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")
_TAXONOMY_KIND_PATTERN = re.compile(r"^[a-z0-9]+(?:[-_][a-z0-9]+)*$")
_TAXONOMY_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_ARTICLE_REVISION_ACTION = "revision_snapshot"


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int


class HeroImageIngestRequest(BaseModel):
    storage_path: str
    source_url: str | None = None
    source_domain: str | None = None
    rights_status: str | None = None
    approval_status: str | None = None
    publish_now: bool = False


class ArticleEditorialUpdateRequest(BaseModel):
    slug: str | None = None
    category: str | None = None
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
    hero_image_url: str | None = None
    hero_media_asset_id: UUID | None = None
    published_at: datetime | None = None
    updated_at: datetime | None = None
    status: str | None = None


class ArticleCreateRequest(BaseModel):
    slug: str
    category: str = "blog"
    status: str = "draft"
    title: dict[str, str] | str
    excerpt: dict[str, str] | str | None = None
    body_md: dict[str, str] | str
    tags: Any = None
    topics: Any = None
    author_name: dict[str, str] | str | None = None
    author_role: dict[str, str] | str | None = None
    author_bio: dict[str, str] | str | None = None
    source_url: str | None = None
    source_domain: str | None = None
    source_rights: str | None = None
    hero_image_url: str | None = None
    hero_media_asset_id: UUID | None = None
    published_at: datetime | None = None


class TaxonomyCreateRequest(BaseModel):
    kind: str
    slug: str
    label: dict[str, str] | str
    description: dict[str, str] | str | None = None
    status: str = "active"
    display_order: int = 0


class TaxonomyUpdateRequest(BaseModel):
    kind: str | None = None
    slug: str | None = None
    label: dict[str, str] | str | None = None
    description: dict[str, str] | str | None = None
    status: str | None = None
    display_order: int | None = None


class VideoCreateRequest(BaseModel):
    slug: str
    status: str = "draft"
    title: dict[str, str] | str
    caption: dict[str, str] | str | None = None
    youtube_url: str | None = None
    youtube_id: str | None = None
    thumbnail_path: str | None = None
    video_path: str | None = None
    tags: Any = None
    topics: Any = None
    source_url: str | None = None
    source_domain: str | None = None
    verification_status: str | None = None
    display_order: int = 0
    published_at: datetime | None = None


class VideoUpdateRequest(BaseModel):
    slug: str | None = None
    status: str | None = None
    title: dict[str, str] | str | None = None
    caption: dict[str, str] | str | None = None
    youtube_url: str | None = None
    youtube_id: str | None = None
    thumbnail_path: str | None = None
    video_path: str | None = None
    tags: Any = None
    topics: Any = None
    source_url: str | None = None
    source_domain: str | None = None
    verification_status: str | None = None
    display_order: int | None = None
    published_at: datetime | None = None


class LogoUpdateRequest(BaseModel):
    storage_path: str
    alt: dict[str, str] | str | None = None


def _to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _coerce_required_text(value: str | None, *, field_name: str) -> str:
    text = str(value or "").strip()
    if text:
        return text
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"{field_name} must not be empty",
    )


def _coerce_optional_text(value: str | None) -> str | None:
    text = str(value or "").strip()
    return text or None


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


def _normalize_status(value: str | None, *, allowed: set[str], field_name: str) -> str:
    text = str(value or "").strip().lower()
    if text in allowed:
        return text
    allowed_text = ", ".join(sorted(allowed))
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"{field_name} must be one of: {allowed_text}",
    )


def _resolve_article_hero_media(
    *,
    db: Session,
    hero_image_url: str | None,
    hero_media_asset_id: UUID | None,
) -> tuple[str | None, UUID | None]:
    resolved_path = None
    resolved_media_id = None

    if hero_image_url is not None:
        resolved_path = require_local_media_path(hero_image_url, field_name="hero_image_url")

    if hero_media_asset_id is not None:
        media = db.get(MediaAsset, hero_media_asset_id)
        if media is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="hero_media_asset_id not found",
            )
        resolved_media_id = media.id
        if resolved_path is None:
            resolved_path = media.storage_path

    if resolved_path is not None and resolved_media_id is None:
        media = db.scalar(select(MediaAsset).where(MediaAsset.storage_path == resolved_path))
        if media is not None:
            resolved_media_id = media.id

    return resolved_path, resolved_media_id


def _apply_article_body_metadata(
    *,
    body_payload: dict[str, Any],
    updates: set[str],
    payload: Any,
) -> None:
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
            source_url = _coerce_optional_text(payload.source_url)
            if source_url:
                source_meta["url"] = source_url
            else:
                source_meta.pop("url", None)
        if "source_domain" in updates:
            source_domain = _coerce_optional_text(payload.source_domain)
            if source_domain:
                source_meta["domain"] = source_domain
            else:
                source_meta.pop("domain", None)
        if "source_rights" in updates:
            source_rights = _coerce_optional_text(payload.source_rights)
            if source_rights:
                source_meta["rights"] = source_rights
            else:
                source_meta.pop("rights", None)
        if source_meta:
            body_payload["source_meta"] = source_meta
        else:
            body_payload.pop("source_meta", None)


def _serialize_article(article: Article) -> dict[str, Any]:
    body_payload = _article_payload(article)
    return {
        "id": str(article.id),
        "slug": article.slug,
        "category": article.category,
        "status": article.status,
        "title": article.title,
        "excerpt": article.excerpt,
        "body_md": article.body_md,
        "tags": body_payload.get("tags"),
        "topics": body_payload.get("topics"),
        "hero_image_url": article.hero_image_url,
        "hero_media_asset_id": str(article.hero_media_asset_id)
        if article.hero_media_asset_id
        else None,
        "published_at": article.published_at.isoformat() if article.published_at else None,
        "updated_at": article.updated_at.isoformat() if article.updated_at else None,
        "created_at": article.created_at.isoformat() if article.created_at else None,
    }


def _article_response(article: Article) -> dict[str, dict[str, Any]]:
    return {"article": _serialize_article(article)}


def _article_revision_snapshot(article: Article) -> dict[str, Any]:
    return _serialize_article(article)


def _article_revision_log_query(article_id: str):
    return (
        select(AuditLog)
        .where(
            AuditLog.entity_type == "article",
            AuditLog.entity_id == article_id,
            AuditLog.action == _ARTICLE_REVISION_ACTION,
        )
        .order_by(desc(AuditLog.created_at), desc(AuditLog.id))
    )


def _article_revision_snapshot_from_log(row: AuditLog | None) -> dict[str, Any] | None:
    if row is None or not isinstance(row.diff, dict):
        return None
    snapshot = row.diff.get("snapshot")
    if not isinstance(snapshot, dict):
        return None
    return snapshot


def _flatten_for_diff(value: Any, *, prefix: str = "") -> dict[str, Any]:
    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for key in sorted(value.keys()):
            path = f"{prefix}.{key}" if prefix else str(key)
            out.update(_flatten_for_diff(value[key], prefix=path))
        return out
    if isinstance(value, list):
        list_out: dict[str, Any] = {}
        for index, item in enumerate(value):
            path = f"{prefix}[{index}]"
            list_out.update(_flatten_for_diff(item, prefix=path))
        return list_out
    return {prefix or "value": value}


def _compute_revision_changes(
    before: dict[str, Any], after: dict[str, Any]
) -> list[dict[str, Any]]:
    before_flat = _flatten_for_diff(before)
    after_flat = _flatten_for_diff(after)
    all_paths = sorted(set(before_flat.keys()) | set(after_flat.keys()))
    changes: list[dict[str, Any]] = []
    for path in all_paths:
        before_value = before_flat.get(path)
        after_value = after_flat.get(path)
        if before_value == after_value:
            continue
        changes.append({"path": path, "before": before_value, "after": after_value})
    return changes


def _serialize_revision_entry(row: AuditLog) -> dict[str, Any]:
    payload = row.diff if isinstance(row.diff, dict) else {}
    changes = payload.get("changes")
    return {
        "revision_id": str(row.id),
        "event": payload.get("event"),
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "actor_user_id": str(row.actor_user_id) if row.actor_user_id else None,
        "changes": changes if isinstance(changes, list) else [],
    }


def _record_article_revision_audit(
    *,
    db: Session,
    admin: User,
    article: Article,
    event: str,
    previous_snapshot: dict[str, Any] | None = None,
) -> None:
    article_id = str(article.id)
    previous = previous_snapshot
    if previous is None:
        latest_row = db.scalar(_article_revision_log_query(article_id).limit(1))
        previous = _article_revision_snapshot_from_log(latest_row)
    current_snapshot = _article_revision_snapshot(article)
    diff = {
        "event": event,
        "snapshot": current_snapshot,
        "changes": _compute_revision_changes(previous or {}, current_snapshot),
    }
    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="article",
        entity_id=article_id,
        action=_ARTICLE_REVISION_ACTION,
        diff=diff,
    )


def _article_revision_by_id_or_404(db: Session, *, article_id: str, revision_id: UUID) -> AuditLog:
    row = db.scalar(
        select(AuditLog).where(
            AuditLog.id == revision_id,
            AuditLog.entity_type == "article",
            AuditLog.entity_id == article_id,
            AuditLog.action == _ARTICLE_REVISION_ACTION,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision not found")
    return row


def _previous_article_revision(
    db: Session, *, article_id: str, target: AuditLog
) -> AuditLog | None:
    page_size = 200
    offset = 0
    while True:
        page = db.scalars(
            _article_revision_log_query(article_id).offset(offset).limit(page_size)
        ).all()
        if not page:
            return None
        for index, row in enumerate(page):
            if row.id != target.id:
                continue
            if index + 1 < len(page):
                return page[index + 1]
            return db.scalar(
                _article_revision_log_query(article_id).offset(offset + index + 1).limit(1)
            )
        offset += len(page)


def _coerce_article_slug(value: str | None) -> str:
    return _coerce_required_text(value, field_name="slug")


def _coerce_slug(value: str | None, *, field_name: str = "slug") -> str:
    text = _coerce_required_text(value, field_name=field_name).lower().replace(" ", "-")
    return text


def _coerce_taxonomy_kind(value: str | None, *, field_name: str = "kind") -> str:
    text = _coerce_required_text(value, field_name=field_name).lower()
    if not _TAXONOMY_KIND_PATTERN.fullmatch(text):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must use lowercase letters, numbers, hyphen, and underscore",
        )
    return text


def _coerce_taxonomy_slug(value: str | None, *, field_name: str = "slug") -> str:
    text = _coerce_required_text(value, field_name=field_name).lower()
    if not _TAXONOMY_SLUG_PATTERN.fullmatch(text):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must be lowercase letters, numbers, and hyphen only",
        )
    return text


def _coerce_category(value: str | None) -> str:
    category = _coerce_required_text(value, field_name="category").lower()
    if category not in _ARTICLE_ALLOWED_CATEGORIES:
        allowed_text = ", ".join(sorted(_ARTICLE_ALLOWED_CATEGORIES))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"category must be one of: {allowed_text}",
        )
    return category


def _localized_value(value: Any, locale: str) -> str:
    if not isinstance(value, dict):
        return ""
    return str(value.get(locale) or "").strip()


def _article_publish_checklist(article: Article) -> dict[str, list[str]]:
    blocking: list[str] = []
    warnings: list[str] = []

    for locale in _ARTICLE_PUBLISH_BLOCKING_LOCALES:
        if not _localized_value(article.title, locale):
            blocking.append(f"title.{locale} is required")
        body_value = _localized_value(article.body_md, locale)
        if not body_value:
            blocking.append(f"body_md.{locale} is required")

    for locale in _ARTICLE_PUBLISH_WARNING_LOCALES:
        if not _localized_value(article.title, locale):
            warnings.append(f"title.{locale} is recommended")
        body_value = _localized_value(article.body_md, locale)
        if not body_value:
            warnings.append(f"body_md.{locale} is recommended")

    category = str(article.category or "").strip().lower()
    if category not in _ARTICLE_ALLOWED_CATEGORIES:
        blocking.append("category must be one of: blog, guide")

    status_value = str(article.status or "").strip().lower()
    if status_value != "approved":
        blocking.append("status must be approved before publish")

    has_media = bool(str(article.hero_image_url or "").strip() or article.hero_media_asset_id)
    if not has_media:
        warnings.append("hero media is recommended before publish")

    return {"blocking": blocking, "warnings": warnings}


def _ensure_article_publishable(article: Article) -> dict[str, list[str]]:
    checklist = _article_publish_checklist(article)
    if checklist["blocking"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Publish checklist failed",
                "blocking": checklist["blocking"],
                "warnings": checklist["warnings"],
            },
        )
    return checklist


def _article_by_slug_or_404(db: Session, slug: str) -> Article:
    article = db.scalar(select(Article).where(Article.slug == slug, Article.deleted_at.is_(None)))
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


def _validate_article_transition(*, before: str, after: str) -> None:
    allowed = _ARTICLE_STATUS_TRANSITIONS.get(before, {before})
    if after not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition: {before} -> {after}",
        )


def _record_article_transition_audit(
    *, db: Session, admin: User, article: Article, before: str, after: str
) -> None:
    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="article",
        entity_id=str(article.id),
        action="status_transition",
        diff={"status": {"from": before, "to": after}},
    )


def _apply_article_updates(
    article: Article, payload: Any, updates: set[str], db: Session, admin: User
) -> None:
    old_slug = str(article.slug or "").strip()
    old_category = str(article.category or "").strip().lower()

    if "title" in updates:
        article.title = _coerce_localized_text(payload.title, field_name="title")
    if "excerpt" in updates:
        article.excerpt = _coerce_optional_localized_text(payload.excerpt, field_name="excerpt")

    body_payload = _article_payload(article)
    if "body_md" in updates:
        localized_body = _coerce_localized_text(payload.body_md, field_name="body_md")
        for key, value in localized_body.items():
            body_payload[key] = value
    _apply_article_body_metadata(body_payload=body_payload, updates=updates, payload=payload)
    article.body_md = body_payload

    if "category" in updates:
        article.category = _coerce_category(payload.category)

    if "slug" in updates:
        new_slug = _coerce_article_slug(payload.slug)
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

    if "hero_image_url" in updates or "hero_media_asset_id" in updates:
        path_input = (
            payload.hero_image_url if "hero_image_url" in updates else article.hero_image_url
        )
        media_input = (
            payload.hero_media_asset_id
            if "hero_media_asset_id" in updates
            else article.hero_media_asset_id
        )

        if "hero_image_url" in updates and payload.hero_image_url is None:
            path_input = None
            if "hero_media_asset_id" not in updates:
                media_input = None

        resolved_path, resolved_media_id = _resolve_article_hero_media(
            db=db,
            hero_image_url=path_input,
            hero_media_asset_id=media_input,
        )
        article.hero_image_url = resolved_path
        article.hero_media_asset_id = resolved_media_id

    if "status" in updates:
        before_status = str(article.status or "").strip().lower()
        next_status = _normalize_status(
            payload.status,
            allowed=_ARTICLE_STATUSES,
            field_name="status",
        )
        _validate_article_transition(before=before_status, after=next_status)
        if next_status == "published" and before_status != next_status:
            _ensure_article_publishable(article)
        article.status = next_status
        if before_status != next_status:
            _record_article_transition_audit(
                db=db,
                admin=admin,
                article=article,
                before=before_status,
                after=next_status,
            )
    if "published_at" in updates:
        article.published_at = _to_utc(payload.published_at) if payload.published_at else None
    if "updated_at" in updates and payload.updated_at is not None:
        article.updated_at = _to_utc(payload.updated_at)

    if article.status == "published" and article.published_at is None:
        article.published_at = datetime.now(UTC)

    if "slug" in updates and article.slug != old_slug:
        redirect_entity = "blog" if old_category == "blog" else "guide"
        upsert_slug_redirects(
            db,
            entity=redirect_entity,
            old_slug=old_slug,
            new_slug=str(article.slug or "").strip(),
        )


def _commit_or_conflict(db: Session, *, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc


@router.get("/content/articles")
def list_articles(
    category: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    query = select(Article).where(Article.deleted_at.is_(None))
    if category:
        query = query.where(Article.category == category.strip().lower())
    if status_filter:
        query = query.where(Article.status == status_filter.strip().lower())

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(desc(Article.updated_at), desc(Article.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return {
        "data": [_serialize_article(row) for row in rows],
        "meta": PaginationMeta(page=page, limit=limit, total=total).model_dump(),
    }


@router.get("/content/articles/{slug}")
def get_article(
    slug: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    article = _article_by_slug_or_404(db, slug)
    return _article_response(article)


@router.post("/content/articles", status_code=status.HTTP_201_CREATED)
def create_article(
    payload: ArticleCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    slug = _coerce_article_slug(payload.slug)
    conflict = db.scalar(select(Article).where(Article.slug == slug, Article.deleted_at.is_(None)))
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Article slug already exists"
        )

    resolved_hero_path, resolved_hero_media = _resolve_article_hero_media(
        db=db,
        hero_image_url=payload.hero_image_url,
        hero_media_asset_id=payload.hero_media_asset_id,
    )

    initial_status = _normalize_status(
        payload.status, allowed=_ARTICLE_STATUSES, field_name="status"
    )
    _validate_article_transition(before="draft", after=initial_status)

    article = Article(
        slug=slug,
        category=_coerce_category(payload.category),
        status=initial_status,
        title=_coerce_localized_text(payload.title, field_name="title"),
        excerpt=_coerce_optional_localized_text(payload.excerpt, field_name="excerpt"),
        body_md={},
        hero_image_url=resolved_hero_path,
        hero_media_asset_id=resolved_hero_media,
        published_at=_to_utc(payload.published_at) if payload.published_at else None,
    )

    body_payload = {}
    localized_body = _coerce_localized_text(payload.body_md, field_name="body_md")
    for key, value in localized_body.items():
        body_payload[key] = value

    create_updates = set(payload.model_dump().keys())
    _apply_article_body_metadata(body_payload=body_payload, updates=create_updates, payload=payload)
    article.body_md = body_payload

    if article.status == "published" and article.published_at is None:
        article.published_at = datetime.now(UTC)

    db.add(article)
    db.flush()
    _record_article_revision_audit(
        db=db,
        admin=admin,
        article=article,
        event="create",
        previous_snapshot={},
    )
    _commit_or_conflict(db, detail="Article slug already exists")
    db.refresh(article)
    return _article_response(article)


@router.patch("/content/articles/{slug}")
def patch_article(
    slug: str,
    payload: ArticleEditorialUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    article = _article_by_slug_or_404(db, slug)
    updates = set(payload.model_dump(exclude_unset=True).keys())
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No editable fields provided",
        )

    _apply_article_updates(article, payload, updates, db, admin)
    db.add(article)
    _record_article_revision_audit(db=db, admin=admin, article=article, event="update")
    _commit_or_conflict(db, detail="Article slug already exists")
    db.refresh(article)
    return _article_response(article)


@router.post("/content/articles/{slug}/publish")
def publish_article(
    slug: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    article = _article_by_slug_or_404(db, slug)
    checklist = _ensure_article_publishable(article)
    before_status = str(article.status or "").strip().lower()
    _validate_article_transition(before=before_status, after="published")
    article.status = "published"
    if before_status != article.status:
        _record_article_transition_audit(
            db=db,
            admin=admin,
            article=article,
            before=before_status,
            after=article.status,
        )
    if article.published_at is None:
        article.published_at = datetime.now(UTC)
    db.add(article)
    _record_article_revision_audit(db=db, admin=admin, article=article, event="publish")
    db.commit()
    db.refresh(article)
    return {**_article_response(article), "publish_checklist": checklist}


@router.post("/content/articles/{slug}/unpublish")
def unpublish_article(
    slug: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    article = _article_by_slug_or_404(db, slug)
    before_status = str(article.status or "").strip().lower()
    _validate_article_transition(before=before_status, after="archived")
    article.status = "archived"
    if before_status != article.status:
        _record_article_transition_audit(
            db=db,
            admin=admin,
            article=article,
            before=before_status,
            after=article.status,
        )
    db.add(article)
    _record_article_revision_audit(db=db, admin=admin, article=article, event="unpublish")
    db.commit()
    db.refresh(article)
    return _article_response(article)


@router.delete("/content/articles/{slug}")
def delete_article(
    slug: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict[str, bool]:
    article = _article_by_slug_or_404(db, slug)
    article.deleted_at = datetime.now(UTC)
    before_status = str(article.status or "").strip().lower()
    article.status = "archived"
    if before_status != article.status:
        _record_article_transition_audit(
            db=db,
            admin=admin,
            article=article,
            before=before_status,
            after=article.status,
        )
    db.add(article)
    _record_article_revision_audit(db=db, admin=admin, article=article, event="delete")
    db.commit()
    return {"deleted": True}


@router.get("/content/articles/{slug}/revisions")
def list_article_revisions(
    slug: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    article = _article_by_slug_or_404(db, slug)
    rows = db.scalars(_article_revision_log_query(str(article.id)).limit(limit)).all()
    return {"data": [_serialize_revision_entry(row) for row in rows]}


@router.get("/content/articles/{slug}/revisions/{revision_id}/diff")
def get_article_revision_diff(
    slug: str,
    revision_id: UUID,
    base_revision_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    article = _article_by_slug_or_404(db, slug)
    article_id = str(article.id)
    target = _article_revision_by_id_or_404(db, article_id=article_id, revision_id=revision_id)
    target_snapshot = _article_revision_snapshot_from_log(target) or {}

    base_revision: AuditLog | None = None
    if base_revision_id is not None:
        base_revision = _article_revision_by_id_or_404(
            db, article_id=article_id, revision_id=base_revision_id
        )
    else:
        base_revision = _previous_article_revision(db, article_id=article_id, target=target)
    base_snapshot = _article_revision_snapshot_from_log(base_revision) or {}

    changes = _compute_revision_changes(base_snapshot, target_snapshot)
    return {
        "revision": _serialize_revision_entry(target),
        "base_revision": _serialize_revision_entry(base_revision) if base_revision else None,
        "changes": changes,
        "summary": {"changed_fields": len(changes)},
    }


def _parse_revision_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text:
        return None
    normalized = text.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Revision datetime must be a valid ISO 8601 datetime string",
        ) from exc
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _parse_revision_uuid(value: Any, *, field_name: str) -> UUID | None:
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text:
        return None
    try:
        return UUID(text)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Revision {field_name} must be a valid UUID format",
        ) from exc


@router.post("/content/articles/{slug}/revisions/{revision_id}/restore")
def restore_article_revision(
    slug: str,
    revision_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    if admin.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Restore requires admin role"
        )

    article = _article_by_slug_or_404(db, slug)
    revision = _article_revision_by_id_or_404(
        db, article_id=str(article.id), revision_id=revision_id
    )
    snapshot = _article_revision_snapshot_from_log(revision)
    if snapshot is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Revision snapshot unavailable"
        )

    previous_snapshot = _article_revision_snapshot(article)
    previous_status = _normalize_status(
        article.status, allowed=_ARTICLE_STATUSES, field_name="status"
    )

    snapshot_slug = _coerce_article_slug(snapshot.get("slug"))
    if snapshot_slug != article.slug:
        conflict = db.scalar(
            select(Article).where(
                Article.slug == snapshot_slug,
                Article.deleted_at.is_(None),
                Article.id != article.id,
            )
        )
        if conflict is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Article slug already exists",
            )
    article.slug = snapshot_slug
    article.category = _coerce_category(snapshot.get("category"))
    article.status = _normalize_status(
        snapshot.get("status"), allowed=_ARTICLE_STATUSES, field_name="status"
    )

    title_snapshot = snapshot.get("title")
    if not isinstance(title_snapshot, dict):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Revision title snapshot unavailable"
        )
    body_snapshot = snapshot.get("body_md")
    if not isinstance(body_snapshot, dict):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Revision body snapshot unavailable"
        )

    article.title = dict(title_snapshot)
    article.excerpt = (
        dict(snapshot.get("excerpt")) if isinstance(snapshot.get("excerpt"), dict) else None
    )
    article.body_md = dict(body_snapshot)
    restored_hero_image_url = _coerce_optional_text(snapshot.get("hero_image_url"))
    if restored_hero_image_url is not None:
        restored_hero_image_url = require_local_media_path(
            restored_hero_image_url,
            field_name="hero_image_url",
        )
    article.hero_image_url = restored_hero_image_url
    article.hero_media_asset_id = _parse_revision_uuid(
        snapshot.get("hero_media_asset_id"),
        field_name="hero_media_asset_id",
    )
    article.published_at = _parse_revision_datetime(snapshot.get("published_at"))

    if previous_status != article.status:
        _record_article_transition_audit(
            db=db,
            admin=admin,
            article=article,
            before=previous_status,
            after=article.status,
        )
    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="article",
        entity_id=str(article.id),
        action="revision_restore",
        diff={"restored_revision_id": str(revision.id)},
    )
    _record_article_revision_audit(
        db=db,
        admin=admin,
        article=article,
        event="restore",
        previous_snapshot=previous_snapshot,
    )
    db.add(article)
    _commit_or_conflict(db, detail="Article slug already exists")
    db.refresh(article)
    return {**_article_response(article), "restored_revision_id": str(revision.id)}


@router.post("/content/articles/{slug}/hero-image/ingest")
def ingest_article_hero_image(
    slug: str,
    payload: HeroImageIngestRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    article = _article_by_slug_or_404(db, slug)

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
        before_status = str(article.status or "").strip().lower()
        _validate_article_transition(before=before_status, after="published")
        article.status = "published"
        if before_status != article.status:
            _record_article_transition_audit(
                db=db,
                admin=admin,
                article=article,
                before=before_status,
                after=article.status,
            )
        if article.published_at is None:
            article.published_at = datetime.now(UTC)
    db.add(article)
    _record_article_revision_audit(db=db, admin=admin, article=article, event="hero_ingest")
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
    admin: User = Depends(get_current_admin),
) -> dict:
    article = _article_by_slug_or_404(db, slug)
    updates = set(payload.model_dump(exclude_unset=True).keys())
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No editable fields provided"
        )

    _apply_article_updates(article, payload, updates, db, admin)
    db.add(article)
    _record_article_revision_audit(db=db, admin=admin, article=article, event="editorial_update")
    _commit_or_conflict(db, detail="Article slug already exists")
    db.refresh(article)
    return _article_response(article)


def _serialize_taxonomy(row: ContentTaxonomy) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "kind": row.kind,
        "slug": row.slug,
        "label": row.label_i18n,
        "description": row.description_i18n,
        "status": row.status,
        "display_order": row.display_order,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _taxonomy_by_id_or_404(db: Session, taxonomy_id: UUID) -> ContentTaxonomy:
    row = db.get(ContentTaxonomy, taxonomy_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Taxonomy not found")
    return row


@router.get("/content/taxonomies")
def list_taxonomies(
    kind: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    query = select(ContentTaxonomy).where(ContentTaxonomy.deleted_at.is_(None))
    if kind:
        query = query.where(ContentTaxonomy.kind == kind.strip().lower())
    if status_filter:
        query = query.where(ContentTaxonomy.status == status_filter.strip().lower())

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(
            ContentTaxonomy.kind.asc(),
            ContentTaxonomy.display_order.asc(),
            ContentTaxonomy.slug.asc(),
        )
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return {
        "data": [_serialize_taxonomy(row) for row in rows],
        "meta": PaginationMeta(page=page, limit=limit, total=total).model_dump(),
    }


@router.post("/content/taxonomies", status_code=status.HTTP_201_CREATED)
def create_taxonomy(
    payload: TaxonomyCreateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    kind = _coerce_taxonomy_kind(payload.kind, field_name="kind")
    slug = _coerce_taxonomy_slug(payload.slug, field_name="slug")

    existing = db.scalar(
        select(ContentTaxonomy).where(
            ContentTaxonomy.deleted_at.is_(None),
            ContentTaxonomy.kind == kind,
            ContentTaxonomy.slug == slug,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Taxonomy already exists")

    row = ContentTaxonomy(
        kind=kind,
        slug=slug,
        label_i18n=_coerce_localized_text(payload.label, field_name="label"),
        description_i18n=_coerce_optional_localized_text(
            payload.description, field_name="description"
        ),
        status=_normalize_status(payload.status, allowed=_TAXONOMY_STATUSES, field_name="status"),
        display_order=int(payload.display_order),
    )
    db.add(row)
    _commit_or_conflict(db, detail="Taxonomy already exists")
    db.refresh(row)
    return {"taxonomy": _serialize_taxonomy(row)}


@router.get("/content/taxonomies/{taxonomy_id}")
def get_taxonomy(
    taxonomy_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = _taxonomy_by_id_or_404(db, taxonomy_id)
    return {"taxonomy": _serialize_taxonomy(row)}


@router.patch("/content/taxonomies/{taxonomy_id}")
def patch_taxonomy(
    taxonomy_id: UUID,
    payload: TaxonomyUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = _taxonomy_by_id_or_404(db, taxonomy_id)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No editable fields provided",
        )

    next_kind = row.kind
    next_slug = row.slug
    if "kind" in updates:
        next_kind = _coerce_taxonomy_kind(payload.kind, field_name="kind")
    if "slug" in updates:
        next_slug = _coerce_taxonomy_slug(payload.slug, field_name="slug")

    if next_kind != row.kind or next_slug != row.slug:
        conflict = db.scalar(
            select(ContentTaxonomy).where(
                ContentTaxonomy.deleted_at.is_(None),
                ContentTaxonomy.kind == next_kind,
                ContentTaxonomy.slug == next_slug,
                ContentTaxonomy.id != row.id,
            )
        )
        if conflict is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Taxonomy already exists"
            )

    if "kind" in updates:
        row.kind = next_kind
    if "slug" in updates:
        row.slug = next_slug
    if "label" in updates:
        row.label_i18n = _coerce_localized_text(payload.label, field_name="label")
    if "description" in updates:
        row.description_i18n = _coerce_optional_localized_text(
            payload.description,
            field_name="description",
        )
    if "status" in updates:
        row.status = _normalize_status(
            payload.status,
            allowed=_TAXONOMY_STATUSES,
            field_name="status",
        )
    if "display_order" in updates and payload.display_order is not None:
        row.display_order = int(payload.display_order)

    db.add(row)
    _commit_or_conflict(db, detail="Taxonomy already exists")
    db.refresh(row)
    return {"taxonomy": _serialize_taxonomy(row)}


@router.post("/content/taxonomies/{taxonomy_id}/publish")
def publish_taxonomy(
    taxonomy_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = _taxonomy_by_id_or_404(db, taxonomy_id)
    row.status = "active"
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"taxonomy": _serialize_taxonomy(row)}


@router.post("/content/taxonomies/{taxonomy_id}/unpublish")
def unpublish_taxonomy(
    taxonomy_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = _taxonomy_by_id_or_404(db, taxonomy_id)
    row.status = "draft"
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"taxonomy": _serialize_taxonomy(row)}


@router.delete("/content/taxonomies/{taxonomy_id}")
def delete_taxonomy(
    taxonomy_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, bool]:
    row = _taxonomy_by_id_or_404(db, taxonomy_id)
    row.deleted_at = datetime.now(UTC)
    row.status = "archived"
    db.add(row)
    db.commit()
    return {"deleted": True}


def _coerce_youtube_id(youtube_url: str | None, youtube_id: str | None) -> str | None:
    if youtube_id is not None:
        candidate = str(youtube_id).strip()
        if not candidate:
            return None
        if not _YOUTUBE_ID_PATTERN.fullmatch(candidate):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="youtube_id must be 11-char YouTube ID",
            )
        return candidate

    if youtube_url is None:
        return None

    url = str(youtube_url).strip()
    if not url:
        return None

    parsed = urlparse(url)
    host = parsed.netloc.lower()
    candidate = None

    if host.endswith("youtu.be"):
        path_parts = [part for part in parsed.path.split("/") if part]
        if path_parts:
            candidate = path_parts[0]
    elif "youtube.com" in host:
        query = parse_qs(parsed.query)
        candidate = (query.get("v") or [None])[0]
        if not candidate:
            parts = [part for part in parsed.path.split("/") if part]
            if len(parts) >= 2 and parts[0] in {"embed", "shorts", "live"}:
                candidate = parts[1]

    if candidate is None:
        return None

    candidate = str(candidate).strip()
    if not _YOUTUBE_ID_PATTERN.fullmatch(candidate):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to parse youtube_id from youtube_url",
        )
    return candidate


def _coerce_optional_local_media_path(value: str | None, *, field_name: str) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return require_local_media_path(text, field_name=field_name)


def _serialize_video(row: ContentVideo) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "slug": row.slug,
        "status": row.status,
        "title": row.title,
        "caption": row.caption,
        "youtube_url": row.youtube_url,
        "youtube_id": row.youtube_id,
        "thumbnail_path": row.thumbnail_path,
        "video_path": row.video_path,
        "tags": row.tags,
        "topics": row.topics,
        "source_url": row.source_url,
        "source_domain": row.source_domain,
        "verification_status": row.verification_status,
        "display_order": row.display_order,
        "published_at": row.published_at.isoformat() if row.published_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def _video_by_slug_or_404(db: Session, slug: str) -> ContentVideo:
    row = db.scalar(
        select(ContentVideo).where(ContentVideo.slug == slug, ContentVideo.deleted_at.is_(None))
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    return row


@router.get("/content/videos")
def list_videos(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    query = select(ContentVideo).where(ContentVideo.deleted_at.is_(None))
    if status_filter:
        query = query.where(ContentVideo.status == status_filter.strip().lower())

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(ContentVideo.display_order.asc(), desc(ContentVideo.updated_at))
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return {
        "data": [_serialize_video(row) for row in rows],
        "meta": PaginationMeta(page=page, limit=limit, total=total).model_dump(),
    }


@router.post("/content/videos", status_code=status.HTTP_201_CREATED)
def create_video(
    payload: VideoCreateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    slug = _coerce_slug(payload.slug, field_name="slug")
    conflict = db.scalar(
        select(ContentVideo).where(ContentVideo.slug == slug, ContentVideo.deleted_at.is_(None))
    )
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Video slug already exists"
        )

    thumbnail_path = _coerce_optional_local_media_path(
        payload.thumbnail_path, field_name="thumbnail_path"
    )
    video_path = _coerce_optional_local_media_path(payload.video_path, field_name="video_path")
    youtube_url = _coerce_optional_text(payload.youtube_url)
    youtube_id = _coerce_youtube_id(youtube_url, payload.youtube_id)

    if youtube_url is None and youtube_id is None and video_path is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide at least one of youtube_url, youtube_id, or video_path",
        )

    row = ContentVideo(
        slug=slug,
        status=_normalize_status(payload.status, allowed=_VIDEO_STATUSES, field_name="status"),
        title=_coerce_localized_text(payload.title, field_name="title"),
        caption=_coerce_optional_localized_text(payload.caption, field_name="caption"),
        youtube_url=youtube_url,
        youtube_id=youtube_id,
        thumbnail_path=thumbnail_path,
        video_path=video_path,
        tags=_coerce_taxonomy(payload.tags) if payload.tags is not None else None,
        topics=_coerce_taxonomy(payload.topics) if payload.topics is not None else None,
        source_url=_coerce_optional_text(payload.source_url),
        source_domain=_coerce_optional_text(payload.source_domain),
        verification_status=_coerce_optional_text(payload.verification_status),
        display_order=int(payload.display_order),
        published_at=_to_utc(payload.published_at) if payload.published_at else None,
    )

    if row.status == "published" and row.published_at is None:
        row.published_at = datetime.now(UTC)

    db.add(row)
    _commit_or_conflict(db, detail="Video slug already exists")
    db.refresh(row)
    return {"video": _serialize_video(row)}


@router.get("/content/videos/{slug}")
def get_video(
    slug: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = _video_by_slug_or_404(db, slug)
    return {"video": _serialize_video(row)}


@router.patch("/content/videos/{slug}")
def patch_video(
    slug: str,
    payload: VideoUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = _video_by_slug_or_404(db, slug)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No editable fields provided",
        )

    if "slug" in updates:
        new_slug = _coerce_slug(payload.slug, field_name="slug")
        conflict = db.scalar(
            select(ContentVideo).where(
                ContentVideo.slug == new_slug,
                ContentVideo.deleted_at.is_(None),
                ContentVideo.id != row.id,
            )
        )
        if conflict is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Video slug already exists"
            )
        row.slug = new_slug

    if "status" in updates:
        row.status = _normalize_status(payload.status, allowed=_VIDEO_STATUSES, field_name="status")
    if "title" in updates:
        row.title = _coerce_localized_text(payload.title, field_name="title")
    if "caption" in updates:
        row.caption = _coerce_optional_localized_text(payload.caption, field_name="caption")
    if "youtube_url" in updates:
        row.youtube_url = _coerce_optional_text(payload.youtube_url)
    if "youtube_id" in updates or "youtube_url" in updates:
        row.youtube_id = _coerce_youtube_id(
            row.youtube_url,
            payload.youtube_id if "youtube_id" in updates else row.youtube_id,
        )
    if "thumbnail_path" in updates:
        row.thumbnail_path = _coerce_optional_local_media_path(
            payload.thumbnail_path,
            field_name="thumbnail_path",
        )
    if "video_path" in updates:
        row.video_path = _coerce_optional_local_media_path(
            payload.video_path, field_name="video_path"
        )
    if "tags" in updates:
        row.tags = _coerce_taxonomy(payload.tags) if payload.tags is not None else None
    if "topics" in updates:
        row.topics = _coerce_taxonomy(payload.topics) if payload.topics is not None else None
    if "source_url" in updates:
        row.source_url = _coerce_optional_text(payload.source_url)
    if "source_domain" in updates:
        row.source_domain = _coerce_optional_text(payload.source_domain)
    if "verification_status" in updates:
        row.verification_status = _coerce_optional_text(payload.verification_status)
    if "display_order" in updates and payload.display_order is not None:
        row.display_order = int(payload.display_order)
    if "published_at" in updates:
        row.published_at = _to_utc(payload.published_at) if payload.published_at else None

    if row.status == "published" and row.published_at is None:
        row.published_at = datetime.now(UTC)

    db.add(row)
    _commit_or_conflict(db, detail="Video slug already exists")
    db.refresh(row)
    return {"video": _serialize_video(row)}


@router.post("/content/videos/{slug}/publish")
def publish_video(
    slug: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = _video_by_slug_or_404(db, slug)
    row.status = "published"
    if row.published_at is None:
        row.published_at = datetime.now(UTC)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"video": _serialize_video(row)}


@router.post("/content/videos/{slug}/unpublish")
def unpublish_video(
    slug: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = _video_by_slug_or_404(db, slug)
    row.status = "draft"
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"video": _serialize_video(row)}


@router.delete("/content/videos/{slug}")
def delete_video(
    slug: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, bool]:
    row = _video_by_slug_or_404(db, slug)
    row.deleted_at = datetime.now(UTC)
    row.status = "archived"
    db.add(row)
    db.commit()
    return {"deleted": True}


def _load_layout_doc(row: CompanyInfo | None) -> dict[str, Any]:
    if row is None:
        return {}
    text = str(row.content or "").strip()
    if not text:
        return {}
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


@router.get("/content/logo")
def get_logo(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == _SITE_LAYOUT_CMS_SLUG))
    doc = _load_layout_doc(row)
    header = doc.get("header") if isinstance(doc.get("header"), dict) else {}
    logo = header.get("logo") if isinstance(header.get("logo"), dict) else {}

    storage_path = logo.get("storage_path") if isinstance(logo.get("storage_path"), str) else None
    alt = logo.get("alt") if isinstance(logo.get("alt"), (dict, str)) else None

    return {
        "logo": {
            "storage_path": storage_path,
            "alt": alt,
            "updated_at": row.updated_at.isoformat() if row else None,
        }
    }


@router.put("/content/logo")
def put_logo(
    payload: LogoUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    storage_path = require_local_media_path(payload.storage_path, field_name="storage_path")
    alt = (
        _coerce_optional_localized_text(payload.alt, field_name="alt")
        if payload.alt is not None
        else None
    )

    row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == _SITE_LAYOUT_CMS_SLUG))
    if row is None:
        row = CompanyInfo(
            title="Site Layout CMS",
            slug=_SITE_LAYOUT_CMS_SLUG,
            content="{}",
            meta_description="Header/Footer CMS source of truth",
        )

    doc = _load_layout_doc(row)
    header = doc.get("header") if isinstance(doc.get("header"), dict) else {}
    header["logo"] = {
        "storage_path": storage_path,
        "alt": alt or {"en": "AMP Pattaya", "th": "AMP Pattaya"},
    }
    doc["header"] = header

    row.content = json.dumps(doc, ensure_ascii=False, indent=2)
    if not row.meta_description:
        row.meta_description = "Header/Footer CMS source of truth"

    db.add(row)
    _commit_or_conflict(db, detail="Unable to update logo config")
    db.refresh(row)

    return {
        "logo": {
            "storage_path": storage_path,
            "alt": alt or {"en": "AMP Pattaya", "th": "AMP Pattaya"},
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }
    }
