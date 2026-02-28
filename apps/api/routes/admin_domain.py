from __future__ import annotations

import os
from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.media_library import require_local_media_path
from packages.core.models import Area, AreaStatistic, Developer, Project, User
from packages.core.project_media_governance import evaluate_project_media_governance

router = APIRouter(prefix="/admin", tags=["admin"])

_AREA_CONTENT_REQUIRED_KEYS = [
    "why_live_invest",
    "transport",
    "lifestyle",
    "beach_proximity",
    "metrics_update_cadence",
]
_AREA_REQUIRED_LOCALES = ["en", "th"]
_DEVELOPER_REQUIRED_LOCALES = ["en", "th"]
_TRUST_APPROVED_VALUES = {"approved", "verified", "legal_approved", "content_approved"}


def _govern_media_or_422(db: Session, *, paths: list[str]) -> list[dict]:
    result = evaluate_project_media_governance(db, paths=paths)
    if result.errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "media_governance_blocked",
                "errors": [row.to_dict() for row in result.errors],
            },
        )
    return [row.to_dict() for row in result.warnings]


def _validate_locale_map(value: dict | None) -> dict | None:
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ValueError("must be an object with en/th keys")
    invalid = sorted([key for key in value if key not in {"en", "th"}])
    if invalid:
        raise ValueError(f"unsupported locale keys: {', '.join(invalid)}")
    return value


def _localized_content_text(value: object, locale: str) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return " ".join(value.split())
    if isinstance(value, dict):
        localized = str(value.get(locale) or "").strip()
        if localized:
            return localized
        for key in ["text", "body", "summary", "description", "value", "label", "title"]:
            if key in value:
                text = _localized_content_text(value.get(key), locale)
                if text:
                    return text
        for nested in value.values():
            text = _localized_content_text(nested, locale)
            if text:
                return text
        return ""
    if isinstance(value, list):
        texts = [_localized_content_text(item, locale) for item in value]
        return " ".join(text for text in texts if text).strip()
    return " ".join(str(value).split())


def _area_content_key_text(content: dict | None, locale: str, key: str) -> str:
    if not isinstance(content, dict):
        return ""
    locale_payload = content.get(locale) if isinstance(content.get(locale), dict) else None
    if locale_payload is not None and key in locale_payload:
        return _localized_content_text(locale_payload.get(key), locale)
    # Backward compatibility fallback if key exists at root content map.
    if key in content:
        return _localized_content_text(content.get(key), locale)
    return ""


def _collect_area_publish_missing(db: Session, area: Area) -> list[str]:
    missing: list[str] = []

    source_note = str(area.source_note or "").strip()
    if not source_note:
        missing.append("source_note")

    content = area.content if isinstance(area.content, dict) else {}
    for locale in _AREA_REQUIRED_LOCALES:
        for key in _AREA_CONTENT_REQUIRED_KEYS:
            if not _area_content_key_text(content, locale, key):
                missing.append(f"content.{locale}.{key}")

    stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == area.id))
    if stat is None:
        missing.append("statistics")
        return missing

    metrics_present = any(
        value is not None
        for value in [
            stat.avg_price_sqm,
            stat.avg_rent_monthly,
            stat.avg_roi_percent,
            stat.total_projects,
            stat.total_units,
        ]
    )
    if not metrics_present:
        missing.append("statistics.metric_values")
    if stat.as_of_date is None:
        missing.append("statistics.as_of_date")
    if stat.updated_at is None:
        missing.append("statistics.updated_at")
    return missing


def _enforce_area_publish_requirements(db: Session, area: Area) -> None:
    missing = _collect_area_publish_missing(db, area)
    if not missing:
        return
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail={
            "code": "area_publish_requirements_missing",
            "message": (
                "Area publish is blocked: missing required area guide content, "
                "metrics source metadata, or stats freshness."
            ),
            "missing": sorted(set(missing)),
            "required_locales": _AREA_REQUIRED_LOCALES,
            "required_content_keys": _AREA_CONTENT_REQUIRED_KEYS,
        },
    )


def _developer_profile_payload(developer: Developer) -> dict | None:
    if isinstance(developer.profile, dict):
        return developer.profile
    if isinstance(developer.summary, dict):
        return developer.summary
    return None


def _developer_profile_locales(payload: dict | None) -> list[str]:
    if not isinstance(payload, dict):
        return []
    locales: list[str] = []
    for locale in _DEVELOPER_REQUIRED_LOCALES:
        if _localized_content_text(payload.get(locale), locale):
            locales.append(locale)
    if locales:
        return locales
    # Backward-compat: accept non-locale nested payload if text exists.
    for locale in _DEVELOPER_REQUIRED_LOCALES:
        if _localized_content_text(payload, locale):
            return [locale]
    return []


def _trust_proof_has_content(value: object) -> bool:
    return bool(_localized_content_text(value, "en") or _localized_content_text(value, "th"))


def _trust_proof_has_approval(value: object) -> bool:
    def walk(node: object) -> bool:
        if isinstance(node, dict):
            for key in ["legal_approved", "content_approved", "verified", "approved", "is_approved"]:
                flag = node.get(key)
                if isinstance(flag, bool) and flag:
                    return True
            for key in ["approval_status", "legal_status", "content_status", "verification_status", "status"]:
                raw = str(node.get(key) or "").strip().lower()
                if raw in _TRUST_APPROVED_VALUES:
                    return True
            return any(walk(item) for item in node.values())
        if isinstance(node, list):
            return any(walk(item) for item in node)
        return False

    return walk(value)


def _developer_publish_linkage(db: Session, developer_id: UUID) -> tuple[int, list[str], int, list[str]]:
    published_project_rows = db.execute(
        select(Project.slug)
        .where(
            Project.deleted_at.is_(None),
            Project.status == "published",
            Project.developer_id == developer_id,
        )
        .order_by(Project.slug.asc())
    ).all()
    published_project_slugs = [str(slug) for (slug,) in published_project_rows if str(slug or "").strip()]
    linked_area_rows = db.execute(
        select(Area.slug)
        .select_from(Project)
        .join(Area, Area.id == Project.area_id)
        .where(
            Project.deleted_at.is_(None),
            Project.status == "published",
            Project.developer_id == developer_id,
            Area.deleted_at.is_(None),
            Area.status == "published",
        )
        .group_by(Area.id, Area.slug)
        .order_by(Area.slug.asc())
    ).all()
    linked_area_slugs = [str(slug) for (slug,) in linked_area_rows if str(slug or "").strip()]
    linked_project_count = int(
        db.scalar(
            select(func.count(Project.id))
            .select_from(Project)
            .join(Area, Area.id == Project.area_id)
            .where(
                Project.deleted_at.is_(None),
                Project.status == "published",
                Project.developer_id == developer_id,
                Area.deleted_at.is_(None),
                Area.status == "published",
            )
        )
        or 0
    )
    return len(published_project_slugs), published_project_slugs, linked_project_count, linked_area_slugs


def _developer_publish_readiness(db: Session, developer: Developer) -> dict:
    missing: list[str] = []

    profile_payload = _developer_profile_payload(developer)
    profile_locales = _developer_profile_locales(profile_payload)
    if not profile_locales:
        missing.append("profile")

    source_note = str(developer.source_note or "").strip()
    if not source_note:
        missing.append("source_note")

    trust = developer.trust_proof
    trust_has_content = _trust_proof_has_content(trust)
    trust_has_approval = _trust_proof_has_approval(trust)
    if not trust_has_content:
        missing.append("trust_proof")
    if not trust_has_approval:
        missing.append("trust_proof.approval")

    published_project_count, published_project_slugs, linked_project_count, linked_area_slugs = _developer_publish_linkage(
        db, developer.id
    )
    if published_project_count <= 0:
        missing.append("projects.published")
    if linked_project_count <= 0:
        missing.append("areas.linked_from_published_projects")

    return {
        "ready": len(missing) == 0,
        "missing": sorted(set(missing)),
        "required_locales": _DEVELOPER_REQUIRED_LOCALES,
        "profile_locales_available": profile_locales,
        "source_note_present": bool(source_note),
        "trust_proof_content_present": trust_has_content,
        "trust_proof_approval_detected": trust_has_approval,
        "published_project_count": published_project_count,
        "published_project_slugs": published_project_slugs,
        "linked_published_project_count": linked_project_count,
        "linked_published_area_count": len(linked_area_slugs),
        "linked_area_slugs": linked_area_slugs,
    }


def _enforce_developer_publish_requirements(db: Session, developer: Developer) -> dict:
    readiness = _developer_publish_readiness(db, developer)
    if readiness["ready"]:
        return readiness
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail={
            "code": "developer_publish_requirements_missing",
            "message": (
                "Developer publish is blocked: missing approved profile/trust proof content "
                "or missing published project-to-area linkage."
            ),
            **readiness,
        },
    )


def _public_base() -> str:
    return (
        os.getenv("FLOWBIZ_PUBLIC_BASE_URL")
        or os.getenv("FLOWBIZ_SITE_BASE_URL")
        or os.getenv("FLOWBIZ_FRONTEND_BASE_URL")
        or ""
    ).strip()


def _preview_url(section: str, slug: str) -> str:
    base = _public_base()
    if not base:
        return f"/{section}/{slug}"
    return f"{base.rstrip('/')}/{section}/{slug}"


class AreaCreate(BaseModel):
    name: str
    slug: str
    city: str = "Pattaya"
    status: str = "draft"
    cover_image_url: str | None = None
    hero_image_url: str | None = None
    summary: dict | None = None
    content: dict | None = None
    source_note: str | None = None
    map_center: dict | None = None

    @field_validator("name", "slug")
    @classmethod
    def _required_non_blank(cls, value: str) -> str:
        cleaned = str(value or "").strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned

    @field_validator("summary", "content")
    @classmethod
    def _validate_i18n_payload(cls, value: dict | None) -> dict | None:
        return _validate_locale_map(value)


class AreaPatch(BaseModel):
    name: str | None = None
    slug: str | None = None
    city: str | None = None
    status: str | None = None
    cover_image_url: str | None = None
    hero_image_url: str | None = None
    summary: dict | None = None
    content: dict | None = None
    source_note: str | None = None
    map_center: dict | None = None

    @field_validator("name", "slug", "city", "status")
    @classmethod
    def _optional_non_blank(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned

    @field_validator("summary", "content")
    @classmethod
    def _validate_i18n_payload(cls, value: dict | None) -> dict | None:
        return _validate_locale_map(value)


class AreaStatisticUpsert(BaseModel):
    avg_price_sqm: Decimal | float | None = None
    avg_rent_monthly: Decimal | float | None = None
    avg_roi_percent: Decimal | float | None = None
    total_projects: int | None = None
    total_units: int | None = None
    as_of_date: date | None = None


class DeveloperCreate(BaseModel):
    name: str
    slug: str
    website: str | None = None
    profile: dict | None = None
    summary: dict | None = None
    trust_proof: dict | None = None
    tier: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    source_note: str | None = None
    status: str = "inactive"

    @field_validator("name", "slug")
    @classmethod
    def _required_non_blank(cls, value: str) -> str:
        cleaned = str(value or "").strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned

    @field_validator("profile", "summary")
    @classmethod
    def _validate_i18n_payload(cls, value: dict | None) -> dict | None:
        return _validate_locale_map(value)


class DeveloperPatch(BaseModel):
    name: str | None = None
    slug: str | None = None
    website: str | None = None
    profile: dict | None = None
    summary: dict | None = None
    trust_proof: dict | None = None
    tier: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    source_note: str | None = None
    status: str | None = None

    @field_validator("name", "slug", "website", "tier", "status")
    @classmethod
    def _optional_non_blank(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned

    @field_validator("profile", "summary")
    @classmethod
    def _validate_i18n_payload(cls, value: dict | None) -> dict | None:
        return _validate_locale_map(value)


def _assert_area_slug_available(db: Session, *, slug: str, exclude_area_id: UUID | None = None) -> None:
    row = db.scalar(select(Area).where(Area.slug == slug).limit(1))
    if row is None:
        return
    if exclude_area_id is not None and row.id == exclude_area_id:
        return
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={"code": "area_slug_conflict", "message": "slug already exists", "field": "slug"},
    )


def _assert_developer_slug_available(
    db: Session,
    *,
    slug: str,
    exclude_developer_id: UUID | None = None,
) -> None:
    row = db.scalar(select(Developer).where(Developer.slug == slug).limit(1))
    if row is None:
        return
    if exclude_developer_id is not None and row.id == exclude_developer_id:
        return
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={"code": "developer_slug_conflict", "message": "slug already exists", "field": "slug"},
    )


def _serialize_stat(row: AreaStatistic | None) -> dict | None:
    if row is None:
        return None
    return {
        "avg_price_sqm": float(row.avg_price_sqm) if row.avg_price_sqm is not None else None,
        "avg_rent_monthly": float(row.avg_rent_monthly) if row.avg_rent_monthly is not None else None,
        "avg_roi_percent": float(row.avg_roi_percent) if row.avg_roi_percent is not None else None,
        "total_projects": row.total_projects,
        "total_units": row.total_units,
        "as_of_date": row.as_of_date.isoformat() if row.as_of_date is not None else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _serialize_area(db: Session, row: Area) -> dict:
    stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == row.id))
    return {
        "id": str(row.id),
        "slug": row.slug,
        "preview_url": _preview_url("areas", row.slug),
        "name": row.name,
        "city": row.city,
        "status": row.status,
        "cover_image_url": row.cover_image_url,
        "hero_image_url": row.hero_image_url,
        "summary": row.summary,
        "content": row.content,
        "source_note": row.source_note,
        "map_center": row.map_center,
        "statistics": _serialize_stat(stat),
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _serialize_developer(row: Developer) -> dict:
    return {
        "id": str(row.id),
        "slug": row.slug,
        "preview_url": _preview_url("developers", row.slug),
        "name": row.name,
        "website": row.website,
        "profile": row.profile or row.summary,
        "summary": row.summary,
        "trust_proof": row.trust_proof,
        "tier": row.tier,
        "logo_url": row.logo_url,
        "cover_image_url": row.cover_image_url,
        "source_note": row.source_note,
        "status": row.status,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _area_or_404(db: Session, area_id: UUID) -> Area:
    area = db.get(Area, area_id)
    if area is None or area.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    return area


def _developer_or_404(db: Session, developer_id: UUID) -> Developer:
    row = db.get(Developer, developer_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")
    return row


@router.get("/areas")
def admin_list_areas(
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    rows = db.scalars(
        select(Area).where(Area.deleted_at.is_(None)).order_by(desc(Area.updated_at)).limit(limit)
    ).all()
    return {"data": [_serialize_area(db, row) for row in rows]}


@router.get("/areas/{area_id}")
def admin_get_area(
    area_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = _area_or_404(db, area_id)
    return _serialize_area(db, row)


@router.post("/areas", status_code=status.HTTP_201_CREATED)
def create_area(
    payload: AreaCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    _assert_area_slug_available(db, slug=payload.slug)

    warnings: list[dict] = []
    hero_path = None
    cover_path = None
    paths: list[str] = []
    if payload.hero_image_url is not None:
        hero_path = require_local_media_path(payload.hero_image_url, field_name="hero_image_url")
        paths.append(hero_path)
    if payload.cover_image_url is not None:
        cover_path = require_local_media_path(payload.cover_image_url, field_name="cover_image_url")
        paths.append(cover_path)
    if paths:
        warnings = _govern_media_or_422(db, paths=paths)

    area = Area(
        name=payload.name,
        slug=payload.slug,
        city=payload.city,
        status=(payload.status or "draft"),
        cover_image_url=cover_path,
        hero_image_url=hero_path,
        summary=payload.summary,
        content=payload.content,
        source_note=payload.source_note,
        map_center=payload.map_center,
    )
    db.add(area)
    try:
        db.flush()
        if area.status == "published":
            _enforce_area_publish_requirements(db, area)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "area_slug_conflict", "message": "slug already exists", "field": "slug"},
        ) from exc
    db.refresh(area)

    return {"area": _serialize_area(db, area), "media_warnings": warnings}


@router.patch("/areas/{area_id}")
def admin_patch_area(
    area_id: UUID,
    payload: AreaPatch,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = _area_or_404(db, area_id)
    updates = payload.model_dump(exclude_unset=True)
    if "slug" in updates and updates["slug"] is not None:
        _assert_area_slug_available(db, slug=updates["slug"], exclude_area_id=row.id)

    if "hero_image_url" in updates and updates["hero_image_url"] is not None:
        updates["hero_image_url"] = require_local_media_path(updates["hero_image_url"], field_name="hero_image_url")
    if "cover_image_url" in updates and updates["cover_image_url"] is not None:
        updates["cover_image_url"] = require_local_media_path(updates["cover_image_url"], field_name="cover_image_url")

    merged_paths = [
        updates.get("cover_image_url", row.cover_image_url),
        updates.get("hero_image_url", row.hero_image_url),
    ]
    warnings = _govern_media_or_422(db, paths=[path for path in merged_paths if path]) if merged_paths else []

    for field, value in updates.items():
        setattr(row, field, value)
    db.add(row)
    try:
        db.flush()
        if row.status == "published":
            _enforce_area_publish_requirements(db, row)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "area_slug_conflict", "message": "slug already exists", "field": "slug"},
        ) from exc
    db.refresh(row)
    return {"area": _serialize_area(db, row), "media_warnings": warnings}


@router.post("/areas/{area_id}/publish")
def publish_area(
    area_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    area = _area_or_404(db, area_id)
    area.status = "published"
    db.add(area)
    db.flush()
    _enforce_area_publish_requirements(db, area)
    db.commit()
    db.refresh(area)
    return {"area": _serialize_area(db, area), "published": True}


@router.post("/areas/{area_id}/unpublish")
def unpublish_area(
    area_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    area = _area_or_404(db, area_id)
    area.status = "draft"
    db.add(area)
    db.commit()
    db.refresh(area)
    return {"area": _serialize_area(db, area), "published": False}


@router.delete("/areas/{area_id}")
def admin_delete_area(
    area_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = _area_or_404(db, area_id)
    from datetime import UTC, datetime

    row.deleted_at = datetime.now(UTC)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"deleted": True, "area": _serialize_area(db, row)}


@router.put("/areas/{area_id}/statistics")
def upsert_area_statistics(
    area_id: UUID,
    payload: AreaStatisticUpsert,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    _area_or_404(db, area_id)

    row = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == area_id))
    if row is None:
        row = AreaStatistic(area_id=area_id)

    values = payload.model_dump(exclude_unset=True)
    for field, value in values.items():
        setattr(row, field, value)

    # Keep legacy mirrors in sync for compatibility.
    if payload.avg_price_sqm is not None:
        row.avg_price = payload.avg_price_sqm
    if payload.avg_rent_monthly is not None:
        row.avg_rent = payload.avg_rent_monthly
    if payload.avg_roi_percent is not None:
        row.roi_percent = payload.avg_roi_percent

    db.add(row)
    db.commit()
    db.refresh(row)
    return {"statistics": {"area_id": str(area_id), **(_serialize_stat(row) or {})}}


@router.get("/developers")
def admin_list_developers(
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    rows = db.scalars(
        select(Developer).where(Developer.deleted_at.is_(None)).order_by(desc(Developer.updated_at)).limit(limit)
    ).all()
    return {"data": [_serialize_developer(row) for row in rows]}


@router.get("/developers/{developer_id}")
def admin_get_developer(
    developer_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = _developer_or_404(db, developer_id)
    return _serialize_developer(row)


@router.get("/developers/{developer_id}/publish-readiness")
def admin_get_developer_publish_readiness(
    developer_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = _developer_or_404(db, developer_id)
    return {"developer_id": str(row.id), "slug": row.slug, **_developer_publish_readiness(db, row)}


@router.post("/developers", status_code=status.HTTP_201_CREATED)
def create_developer(
    payload: DeveloperCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    _assert_developer_slug_available(db, slug=payload.slug)

    warnings: list[dict] = []
    logo_path = None
    cover_path = None
    paths: list[str] = []
    if payload.logo_url is not None:
        logo_path = require_local_media_path(payload.logo_url, field_name="logo_url")
        paths.append(logo_path)
    if payload.cover_image_url is not None:
        cover_path = require_local_media_path(payload.cover_image_url, field_name="cover_image_url")
        paths.append(cover_path)
    if paths:
        warnings = _govern_media_or_422(db, paths=paths)

    row = Developer(
        name=payload.name,
        slug=payload.slug,
        website=payload.website,
        profile=payload.profile,
        summary=payload.summary,
        trust_proof=payload.trust_proof,
        tier=payload.tier,
        logo_url=logo_path,
        cover_image_url=cover_path,
        source_note=payload.source_note,
        status=(payload.status or "inactive"),
    )
    db.add(row)
    try:
        db.flush()
        if row.status == "active":
            _enforce_developer_publish_requirements(db, row)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "developer_slug_conflict", "message": "slug already exists", "field": "slug"},
        ) from exc
    db.refresh(row)
    return {"developer": _serialize_developer(row), "media_warnings": warnings}


@router.patch("/developers/{developer_id}")
def admin_patch_developer(
    developer_id: UUID,
    payload: DeveloperPatch,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = _developer_or_404(db, developer_id)
    updates = payload.model_dump(exclude_unset=True)
    if "slug" in updates and updates["slug"] is not None:
        _assert_developer_slug_available(db, slug=updates["slug"], exclude_developer_id=row.id)

    if "logo_url" in updates and updates["logo_url"] is not None:
        updates["logo_url"] = require_local_media_path(updates["logo_url"], field_name="logo_url")
    if "cover_image_url" in updates and updates["cover_image_url"] is not None:
        updates["cover_image_url"] = require_local_media_path(updates["cover_image_url"], field_name="cover_image_url")

    merged_paths = [
        updates.get("logo_url", row.logo_url),
        updates.get("cover_image_url", row.cover_image_url),
    ]
    warnings = _govern_media_or_422(db, paths=[path for path in merged_paths if path]) if merged_paths else []

    for field, value in updates.items():
        setattr(row, field, value)
    db.add(row)
    try:
        db.flush()
        if row.status == "active":
            _enforce_developer_publish_requirements(db, row)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "developer_slug_conflict", "message": "slug already exists", "field": "slug"},
        ) from exc
    db.refresh(row)
    return {"developer": _serialize_developer(row), "media_warnings": warnings}


@router.post("/developers/{developer_id}/publish")
def publish_developer(
    developer_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    row = _developer_or_404(db, developer_id)
    row.status = "active"
    db.add(row)
    try:
        db.flush()
        readiness = _enforce_developer_publish_requirements(db, row)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    db.refresh(row)
    return {"developer": _serialize_developer(row), "published": True, "publish_readiness": readiness}


@router.post("/developers/{developer_id}/unpublish")
def unpublish_developer(
    developer_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    row = _developer_or_404(db, developer_id)
    row.status = "inactive"
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"developer": _serialize_developer(row), "published": False}


@router.delete("/developers/{developer_id}")
def admin_delete_developer(
    developer_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = _developer_or_404(db, developer_id)
    from datetime import UTC, datetime

    row.deleted_at = datetime.now(UTC)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"deleted": True, "developer": _serialize_developer(row)}
