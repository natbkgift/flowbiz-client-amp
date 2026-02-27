from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import Area, AreaStatistic, Developer, User
from packages.core.project_media_governance import evaluate_project_media_governance

router = APIRouter(prefix="/admin", tags=["admin"])


def _validate_local_media_path(path: str, *, field_name: str) -> str:
    value = str(path or "").strip()
    if value.startswith("/media/") and "://" not in value:
        return value
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=f"{field_name} must be local /media/ path",
    )


def _govern_media_or_422(db: Session, *, path: str) -> list[dict]:
    result = evaluate_project_media_governance(db, paths=[path])
    if result.errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "media_governance_blocked",
                "errors": [row.to_dict() for row in result.errors],
            },
        )
    return [row.to_dict() for row in result.warnings]


class AreaCreate(BaseModel):
    name: str
    slug: str
    city: str = "Pattaya"
    status: str = "draft"
    hero_image_url: str | None = None
    content: dict | None = None
    map_center: dict | None = None


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
    summary: dict | None = None
    tier: str | None = None
    logo_url: str | None = None
    status: str = "inactive"


@router.post("/areas", status_code=status.HTTP_201_CREATED)
def create_area(
    payload: AreaCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    warnings: list[dict] = []
    hero_path = None
    if payload.hero_image_url is not None:
        hero_path = _validate_local_media_path(payload.hero_image_url, field_name="hero_image_url")
        warnings = _govern_media_or_422(db, path=hero_path)

    area = Area(
        name=payload.name,
        slug=payload.slug,
        city=payload.city,
        status=(payload.status or "draft"),
        hero_image_url=hero_path,
        content=payload.content,
        map_center=payload.map_center,
    )
    db.add(area)
    db.commit()
    db.refresh(area)

    return {
        "area": {
            "id": str(area.id),
            "slug": area.slug,
            "name": area.name,
            "city": area.city,
            "status": area.status,
            "hero_image_url": area.hero_image_url,
            "content": area.content,
        },
        "media_warnings": warnings,
    }


@router.post("/areas/{area_id}/publish")
def publish_area(
    area_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    area = db.get(Area, area_id)
    if area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    area.status = "published"
    db.add(area)
    db.commit()
    db.refresh(area)
    return {"area": {"id": str(area.id), "status": area.status}}


@router.put("/areas/{area_id}/statistics")
def upsert_area_statistics(
    area_id: UUID,
    payload: AreaStatisticUpsert,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    area = db.get(Area, area_id)
    if area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")

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
    return {
        "statistics": {
            "area_id": str(area_id),
            "avg_price_sqm": float(row.avg_price_sqm) if row.avg_price_sqm is not None else None,
            "avg_rent_monthly": float(row.avg_rent_monthly) if row.avg_rent_monthly is not None else None,
            "avg_roi_percent": float(row.avg_roi_percent) if row.avg_roi_percent is not None else None,
            "total_projects": row.total_projects,
            "total_units": row.total_units,
            "as_of_date": row.as_of_date.isoformat() if row.as_of_date is not None else None,
        }
    }


@router.post("/developers", status_code=status.HTTP_201_CREATED)
def create_developer(
    payload: DeveloperCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    warnings: list[dict] = []
    logo_path = None
    if payload.logo_url is not None:
        logo_path = _validate_local_media_path(payload.logo_url, field_name="logo_url")
        warnings = _govern_media_or_422(db, path=logo_path)

    row = Developer(
        name=payload.name,
        slug=payload.slug,
        website=payload.website,
        summary=payload.summary,
        tier=payload.tier,
        logo_url=logo_path,
        status=(payload.status or "inactive"),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "developer": {
            "id": str(row.id),
            "slug": row.slug,
            "name": row.name,
            "status": row.status,
            "logo_url": row.logo_url,
            "summary": row.summary,
        },
        "media_warnings": warnings,
    }


@router.post("/developers/{developer_id}/publish")
def publish_developer(
    developer_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    row = db.get(Developer, developer_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")
    row.status = "active"
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"developer": {"id": str(row.id), "status": row.status}}
