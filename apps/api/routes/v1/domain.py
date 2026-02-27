from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
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


def _normalize_i18n_text_map(value: object | None) -> dict[str, str] | None:
    if not isinstance(value, dict):
        return None
    out: dict[str, str] = {}
    for locale in ("en", "th"):
        raw = value.get(locale)
        if raw is None:
            continue
        text = str(raw).strip()
        if text:
            out[locale] = text
    return out or None


def _resolve_locale_text(i18n_map: dict[str, str] | None, locale: str) -> str | None:
    if not i18n_map:
        return None
    primary = i18n_map.get(locale)
    if primary:
        return primary
    if i18n_map.get("en"):
        return i18n_map["en"]
    if i18n_map.get("th"):
        return i18n_map["th"]
    return None


def _serialize_stats(row: AreaStatistic | None) -> dict | None:
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


def _serialize_area(row: Area, stat: AreaStatistic | None, locale: str) -> dict:
    summary_map = _normalize_i18n_text_map(row.summary)
    return {
        "id": str(row.id),
        "slug": row.slug,
        "name": row.name,
        "city": row.city,
        "status": row.status,
        "cover_image_url": _safe_media_path(row.cover_image_url),
        "hero_image_url": _safe_media_path(row.hero_image_url),
        "summary": summary_map,
        "summary_text": _resolve_locale_text(summary_map, locale),
        "content": row.content,
        "source_note": row.source_note,
        "map_center": row.map_center,
        "statistics": _serialize_stats(stat),
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _serialize_developer(row: Developer, locale: str) -> dict:
    profile_map = _normalize_i18n_text_map(row.profile or row.summary)
    return {
        "id": str(row.id),
        "slug": row.slug,
        "name": row.name,
        "website": row.website,
        "profile": profile_map,
        "profile_text": _resolve_locale_text(profile_map, locale),
        "summary": row.summary,
        "source_note": row.source_note,
        "trust_proof": row.trust_proof,
        "tier": row.tier,
        "logo_url": _safe_media_path(row.logo_url),
        "cover_image_url": _safe_media_path(row.cover_image_url),
        "status": row.status,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@router.get("/areas")
def list_areas(
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> list[dict]:
    rows = db.scalars(
        select(Area)
        .where(Area.deleted_at.is_(None), Area.status == "published")
        .order_by(asc(Area.name))
    ).all()
    out: list[dict] = []
    for row in rows:
        stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == row.id))
        out.append(_serialize_area(row, stat, locale))
    return out


@router.get("/areas/{slug}")
def get_area(
    slug: str,
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> dict:
    row = db.scalar(
        select(Area).where(
            Area.deleted_at.is_(None),
            Area.status == "published",
            Area.slug == slug,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == row.id))
    return _serialize_area(row, stat, locale)


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
    stats_payload = _serialize_stats(stat) or {
        "avg_price_sqm": None,
        "avg_rent_monthly": None,
        "avg_roi_percent": None,
        "total_projects": None,
        "total_units": None,
        "as_of_date": None,
        "updated_at": None,
    }
    return {"area_slug": slug, "statistics": stats_payload}


@router.get("/developers")
def list_developers(
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> list[dict]:
    rows = db.scalars(
        select(Developer)
        .where(Developer.deleted_at.is_(None), Developer.status == "active")
        .order_by(asc(Developer.name))
    ).all()
    return [_serialize_developer(row, locale) for row in rows]


@router.get("/developers/{slug}")
def get_developer(
    slug: str,
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> dict:
    row = db.scalar(
        select(Developer).where(
            Developer.deleted_at.is_(None),
            Developer.status == "active",
            Developer.slug == slug,
        )
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")
    return _serialize_developer(row, locale)


@router.get("/agents")
def list_agents() -> list[dict]:
    return []
