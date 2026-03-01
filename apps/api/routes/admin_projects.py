from __future__ import annotations

import os
from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.media_library import require_local_media_path
from packages.core.models import Area, Developer, MediaAsset, Project, User
from packages.core.project_media_governance import evaluate_project_media_governance
from packages.core.seo_controls import upsert_slug_redirects

router = APIRouter(prefix="/admin", tags=["admin"])


class ProjectCreate(BaseModel):
    slug: str
    name: str
    status: str = "draft"
    area_id: UUID | None = None
    developer_id: UUID | None = None
    property_type: str = "condo"
    delivery_date: date | None = None
    starting_price: Decimal | None = None
    cover_image_url: str | None = None
    hero_image_url: str | None = None
    images: list[str] = Field(default_factory=list)
    summary: dict = Field(default_factory=dict)
    description: dict | None = None
    badges: list = Field(default_factory=list)
    highlights: list = Field(default_factory=list)
    quick_facts: list = Field(default_factory=list)
    amenities: list | None = None
    trust_proof: list = Field(default_factory=list)
    source_notes: dict = Field(default_factory=dict)
    claims_updated_at: datetime | None = None
    investment_snapshot: dict | None = None
    location: dict | None = None
    unit_count: int | None = None
    floors: int | None = None
    year_built: int | None = None
    is_featured: bool = False

    @field_validator("slug", "name", "status", "property_type")
    @classmethod
    def _required_non_blank(cls, value: str) -> str:
        cleaned = str(value or "").strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned

    @field_validator("summary", "description", "source_notes")
    @classmethod
    def _validate_locale_map(cls, value: dict | None) -> dict | None:
        return _validate_en_th_map(value)


class ProjectPatch(BaseModel):
    slug: str | None = None
    name: str | None = None
    status: str | None = None
    area_id: UUID | None = None
    property_type: str | None = None
    developer_id: UUID | None = None
    delivery_date: date | None = None
    starting_price: Decimal | None = None
    cover_image_url: str | None = None
    hero_image_url: str | None = None
    images: list[str] | None = None
    summary: dict | None = None
    description: dict | None = None
    badges: list | None = None
    highlights: list | None = None
    quick_facts: list | None = None
    amenities: list | None = None
    trust_proof: list | None = None
    source_notes: dict | None = None
    claims_updated_at: datetime | None = None
    investment_snapshot: dict | None = None
    location: dict | None = None
    unit_count: int | None = None
    floors: int | None = None
    year_built: int | None = None
    is_featured: bool | None = None

    @field_validator("slug", "name", "status", "property_type")
    @classmethod
    def _optional_non_blank(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned

    @field_validator("summary", "description", "source_notes")
    @classmethod
    def _optional_locale_map(cls, value: dict | None) -> dict | None:
        return _validate_en_th_map(value)


def _validate_en_th_map(value: dict | None) -> dict | None:
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ValueError("must be an object with en/th keys")
    if not value:
        return value
    invalid = sorted([key for key in value if key not in {"en", "th"}])
    if invalid:
        raise ValueError(f"unsupported locale keys: {', '.join(invalid)}")
    return value


def _preview_url_for_slug(slug: str) -> str:
    base = (
        os.getenv("FLOWBIZ_PUBLIC_BASE_URL")
        or os.getenv("FLOWBIZ_SITE_BASE_URL")
        or os.getenv("FLOWBIZ_FRONTEND_BASE_URL")
        or ""
    ).strip()
    if not base:
        return f"/projects/{slug}"
    return f"{base.rstrip('/')}/projects/{slug}"


def _validate_relations(db: Session, *, area_id: UUID | None, developer_id: UUID | None) -> None:
    if area_id is not None:
        area = db.get(Area, area_id)
        if area is None or area.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="area_id not found"
            )
    if developer_id is not None:
        developer = db.get(Developer, developer_id)
        if developer is None or developer.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="developer_id not found"
            )


def _assert_slug_available(
    db: Session, *, slug: str, exclude_project_id: UUID | None = None
) -> None:
    row = db.scalar(select(Project).where(Project.slug == slug).limit(1))
    if row is None:
        return
    if exclude_project_id is not None and row.id == exclude_project_id:
        return
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={"code": "project_slug_conflict", "message": "slug already exists", "field": "slug"},
    )


def _serialize(row: Project, db: Session) -> dict:
    area_payload = None
    if row.area_id is not None:
        area_row = db.get(Area, row.area_id)
        if area_row is not None and area_row.deleted_at is None:
            area_payload = {"id": str(area_row.id), "slug": area_row.slug, "name": area_row.name}
        else:
            area_payload = {"id": str(row.area_id), "slug": None, "name": None}

    developer_payload = None
    if row.developer_id is not None:
        developer_row = db.get(Developer, row.developer_id)
        if developer_row is not None and developer_row.deleted_at is None:
            developer_payload = {
                "id": str(developer_row.id),
                "slug": developer_row.slug,
                "name": developer_row.name,
            }
        else:
            developer_payload = {"id": str(row.developer_id), "slug": None, "name": None}
    return {
        "id": str(row.id),
        "slug": row.slug,
        "preview_url": _preview_url_for_slug(row.slug),
        "name": row.name,
        "status": row.status,
        "area_id": str(row.area_id) if row.area_id else None,
        "developer_id": str(row.developer_id) if row.developer_id else None,
        "area": area_payload,
        "developer": developer_payload,
        "property_type": row.property_type,
        "delivery_date": row.delivery_date.isoformat() if row.delivery_date else None,
        "starting_price": float(row.starting_price) if row.starting_price is not None else None,
        "cover_image_url": row.cover_image_url,
        "hero_image_url": row.hero_image_url,
        "images": row.images or [],
        "summary": row.summary or {},
        "description": row.description,
        "badges": row.badges or [],
        "highlights": row.highlights or [],
        "quick_facts": row.quick_facts or [],
        "amenities": row.amenities,
        "trust_proof": row.trust_proof or [],
        "source_notes": row.source_notes or {},
        "claims_updated_at": row.claims_updated_at.isoformat() if row.claims_updated_at else None,
        "investment_snapshot": row.investment_snapshot,
        "location": row.location,
        "unit_count": row.unit_count,
        "floors": row.floors,
        "year_built": row.year_built,
        "is_featured": bool(row.is_featured),
    }


def _validate_media_governance(db: Session, paths: list[str]) -> list[dict]:
    result = evaluate_project_media_governance(db, paths=paths)
    if result.errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "media_governance_blocked",
                "errors": [item.to_dict() for item in result.errors],
            },
        )
    return [item.to_dict() for item in result.warnings]


@router.get("/projects")
def admin_list_projects(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    rows = db.scalars(
        select(Project)
        .where(Project.deleted_at.is_(None))
        .order_by(desc(Project.updated_at))
        .limit(limit)
    ).all()
    return {"data": [_serialize(row, db) for row in rows]}


@router.get("/projects/{project_id}")
def admin_get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(Project, project_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _serialize(row, db)


@router.post("/projects", status_code=status.HTTP_201_CREATED)
def admin_create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    _assert_slug_available(db, slug=payload.slug)
    _validate_relations(db, area_id=payload.area_id, developer_id=payload.developer_id)

    if payload.cover_image_url is not None:
        payload.cover_image_url = require_local_media_path(
            payload.cover_image_url, field_name="cover_image_url"
        )
    if payload.hero_image_url is not None:
        payload.hero_image_url = require_local_media_path(
            payload.hero_image_url, field_name="hero_image_url"
        )
    payload.images = [
        require_local_media_path(path, field_name="images") for path in (payload.images or [])
    ]

    paths = [
        p for p in [payload.cover_image_url, payload.hero_image_url, *(payload.images or [])] if p
    ]
    warnings = _validate_media_governance(db, paths)

    row = Project(**payload.model_dump())
    db.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "project_slug_conflict",
                "message": "slug already exists",
                "field": "slug",
            },
        ) from exc
    db.refresh(row)
    return {"project": _serialize(row, db), "media_warnings": warnings}


@router.patch("/projects/{project_id}")
def admin_patch_project(
    project_id: UUID,
    payload: ProjectPatch,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(Project, project_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    old_slug = str(row.slug or "").strip()

    updates = payload.model_dump(exclude_unset=True)
    if "slug" in updates and updates["slug"] is not None:
        _assert_slug_available(db, slug=updates["slug"], exclude_project_id=row.id)
    _validate_relations(
        db,
        area_id=updates.get("area_id", row.area_id),
        developer_id=updates.get("developer_id", row.developer_id),
    )
    if "cover_image_url" in updates and updates["cover_image_url"] is not None:
        updates["cover_image_url"] = require_local_media_path(
            updates["cover_image_url"], field_name="cover_image_url"
        )
    if "hero_image_url" in updates and updates["hero_image_url"] is not None:
        updates["hero_image_url"] = require_local_media_path(
            updates["hero_image_url"], field_name="hero_image_url"
        )
    if "images" in updates and updates["images"] is not None:
        updates["images"] = [
            require_local_media_path(path, field_name="images") for path in updates["images"]
        ]

    merged_paths = [
        updates.get("cover_image_url", row.cover_image_url),
        updates.get("hero_image_url", row.hero_image_url),
        *(updates.get("images", row.images or []) or []),
    ]
    warnings = _validate_media_governance(db, [p for p in merged_paths if p])

    for field, value in updates.items():
        setattr(row, field, value)
    if "slug" in updates and updates["slug"] is not None:
        upsert_slug_redirects(
            db,
            entity="project",
            old_slug=old_slug,
            new_slug=str(row.slug or "").strip(),
        )
    db.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "project_slug_conflict",
                "message": "slug already exists",
                "field": "slug",
            },
        ) from exc
    db.refresh(row)
    return {"project": _serialize(row, db), "media_warnings": warnings}


@router.post("/projects/{project_id}/publish")
def admin_publish_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(Project, project_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    row.status = "published"
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"project": _serialize(row, db), "published": True}


@router.delete("/projects/{project_id}")
def admin_delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(Project, project_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    row.deleted_at = datetime.now(UTC)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"deleted": True, "project": _serialize(row, db)}


@router.get("/projects/media-candidates")
def list_project_media_candidates(
    limit: int = Query(default=60, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[dict]:
    rows = db.scalars(
        select(MediaAsset)
        .where(MediaAsset.kind == "image", MediaAsset.status == "active")
        .order_by(desc(MediaAsset.created_at))
        .limit(limit)
    ).all()
    return [
        {
            "id": str(row.id),
            "storage_path": row.storage_path,
            "approval_status": row.approval_status,
            "rights_status": row.rights_status,
        }
        for row in rows
    ]
