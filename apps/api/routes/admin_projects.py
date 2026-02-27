from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import MediaAsset, Project, User
from packages.core.project_media_governance import evaluate_project_media_governance

router = APIRouter(prefix="/admin", tags=["admin"])


class ProjectCreate(BaseModel):
    slug: str
    name: str
    status: str = "draft"
    property_type: str = "condo"
    delivery_date: date | None = None
    starting_price: Decimal | None = None
    cover_image_url: str | None = None
    hero_image_url: str | None = None
    images: list[str] = Field(default_factory=list)
    summary: dict = Field(default_factory=dict)
    description: dict | None = None
    amenities: list | None = None
    investment_snapshot: dict | None = None
    location: dict | None = None
    unit_count: int | None = None
    floors: int | None = None
    year_built: int | None = None
    is_featured: bool = False


class ProjectPatch(BaseModel):
    name: str | None = None
    status: str | None = None
    property_type: str | None = None
    delivery_date: date | None = None
    starting_price: Decimal | None = None
    cover_image_url: str | None = None
    hero_image_url: str | None = None
    images: list[str] | None = None
    summary: dict | None = None
    description: dict | None = None
    amenities: list | None = None
    investment_snapshot: dict | None = None
    location: dict | None = None
    unit_count: int | None = None
    floors: int | None = None
    year_built: int | None = None
    is_featured: bool | None = None


def _serialize(row: Project) -> dict:
    return {
        "id": str(row.id),
        "slug": row.slug,
        "name": row.name,
        "status": row.status,
        "property_type": row.property_type,
        "delivery_date": row.delivery_date.isoformat() if row.delivery_date else None,
        "starting_price": float(row.starting_price) if row.starting_price is not None else None,
        "cover_image_url": row.cover_image_url,
        "hero_image_url": row.hero_image_url,
        "images": row.images or [],
        "summary": row.summary or {},
        "description": row.description,
        "amenities": row.amenities,
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
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "media_governance_blocked", "errors": [item.to_dict() for item in result.errors]},
        )
    return [item.to_dict() for item in result.warnings]


@router.get("/projects")
def admin_list_projects(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    rows = db.scalars(select(Project).order_by(desc(Project.updated_at)).limit(limit)).all()
    return {"data": [_serialize(row) for row in rows]}


@router.get("/projects/{project_id}")
def admin_get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(Project, project_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _serialize(row)


@router.post("/projects", status_code=status.HTTP_201_CREATED)
def admin_create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    paths = [p for p in [payload.cover_image_url, payload.hero_image_url, *(payload.images or [])] if p]
    warnings = _validate_media_governance(db, paths)

    row = Project(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"project": _serialize(row), "media_warnings": warnings}


@router.patch("/projects/{project_id}")
def admin_patch_project(
    project_id: UUID,
    payload: ProjectPatch,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(Project, project_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    updates = payload.model_dump(exclude_unset=True)
    merged_paths = [
        updates.get("cover_image_url", row.cover_image_url),
        updates.get("hero_image_url", row.hero_image_url),
        *(updates.get("images", row.images or []) or []),
    ]
    warnings = _validate_media_governance(db, [p for p in merged_paths if p])

    for field, value in updates.items():
        setattr(row, field, value)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"project": _serialize(row), "media_warnings": warnings}


@router.post("/projects/{project_id}/publish")
def admin_publish_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(Project, project_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    row.status = "published"
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"project": _serialize(row), "published": True}


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
