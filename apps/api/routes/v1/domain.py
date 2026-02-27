from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Area, AreaStatistic, Developer

router = APIRouter(prefix="/v1", tags=["domain"])


def _safe_media_path(value: object | None) -> str | None:
    if not isinstance(value, str):
        return None
    candidate = value.strip()
    if not candidate or "://" in candidate:
        return None
    return candidate


@router.get("/areas")
def list_areas(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(
        select(Area)
        .where(Area.deleted_at.is_(None), Area.status == "published")
        .order_by(asc(Area.name))
    ).all()
    return [
        {
            "id": str(row.id),
            "slug": row.slug,
            "name": row.name,
            "city": row.city,
            "status": row.status,
            "hero_image_url": _safe_media_path(row.hero_image_url),
            "content": row.content,
        }
        for row in rows
    ]


@router.get("/areas/{slug}")
def get_area(slug: str, db: Session = Depends(get_db)) -> dict:
    row = db.scalar(
        select(Area).where(
            Area.deleted_at.is_(None),
            Area.status == "published",
            Area.slug == slug,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    return {
        "id": str(row.id),
        "slug": row.slug,
        "name": row.name,
        "city": row.city,
        "status": row.status,
        "hero_image_url": _safe_media_path(row.hero_image_url),
        "content": row.content,
        "map_center": row.map_center,
    }


@router.get("/areas/{slug}/statistics")
def get_area_statistics(slug: str, db: Session = Depends(get_db)) -> dict:
    area = db.scalar(
        select(Area).where(
            Area.deleted_at.is_(None),
            Area.status == "published",
            Area.slug == slug,
        )
    )
    if area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")

    stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == area.id))
    stats_payload = {
        "avg_price_sqm": float(stat.avg_price_sqm) if stat and stat.avg_price_sqm is not None else None,
        "avg_rent_monthly": float(stat.avg_rent_monthly) if stat and stat.avg_rent_monthly is not None else None,
        "avg_roi_percent": float(stat.avg_roi_percent) if stat and stat.avg_roi_percent is not None else None,
        "total_projects": stat.total_projects if stat else None,
        "total_units": stat.total_units if stat else None,
        "as_of_date": stat.as_of_date.isoformat() if stat and stat.as_of_date is not None else None,
    }
    return {"area_slug": slug, "statistics": stats_payload}


@router.get("/developers")
def list_developers(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(
        select(Developer)
        .where(Developer.deleted_at.is_(None), Developer.status == "active")
        .order_by(asc(Developer.name))
    ).all()
    return [
        {
            "id": str(row.id),
            "slug": row.slug,
            "name": row.name,
            "website": row.website,
            "summary": row.summary,
            "tier": row.tier,
            "logo_url": _safe_media_path(row.logo_url),
            "status": row.status,
        }
        for row in rows
    ]


@router.get("/developers/{slug}")
def get_developer(slug: str, db: Session = Depends(get_db)) -> dict:
    row = db.scalar(
        select(Developer).where(
            Developer.deleted_at.is_(None),
            Developer.status == "active",
            Developer.slug == slug,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")
    return {
        "id": str(row.id),
        "slug": row.slug,
        "name": row.name,
        "website": row.website,
        "summary": row.summary,
        "tier": row.tier,
        "logo_url": _safe_media_path(row.logo_url),
        "status": row.status,
    }


@router.get("/agents")
def list_agents() -> list[dict]:
    return []
