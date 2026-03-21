from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Area, AreaStatistic, Developer, Project

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


def _isoformat_datetime(value) -> str | None:
    return value.isoformat() if value is not None else None


def _coerce_positive_price(value: object | None) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number <= 0:
        return None
    return number


def _max_datetime(*values):
    candidates = [value for value in values if value is not None]
    if not candidates:
        return None
    return max(candidates)


def _build_developer_project_lookup(db: Session, developer_ids: list) -> dict:
    if not developer_ids:
        return {}

    project_rows = db.execute(
        select(
            Project.developer_id,
            Project.area_id,
            Project.starting_price,
            Project.updated_at,
        ).where(
            Project.deleted_at.is_(None),
            Project.status == "published",
            Project.developer_id.in_(developer_ids),
        )
    ).all()

    area_ids = {row.area_id for row in project_rows if row.area_id is not None}
    area_lookup = {
        row.id: {"slug": row.slug, "name": row.name}
        for row in db.execute(
            select(Area.id, Area.slug, Area.name).where(
                Area.deleted_at.is_(None),
                Area.id.in_(area_ids),
            )
        ).all()
    } if area_ids else {}

    summary_lookup: dict = {}

    for row in project_rows:
        if row.developer_id is None:
            continue

        current = summary_lookup.setdefault(
            row.developer_id,
            {
                "project_count": 0,
                "area_counts": defaultdict(int),
                "min_price": None,
                "max_price": None,
                "project_updated_at": None,
            },
        )

        current["project_count"] += 1
        current["project_updated_at"] = _max_datetime(current["project_updated_at"], row.updated_at)

        area = area_lookup.get(row.area_id)
        if area is not None:
            current["area_counts"][(area["slug"], area["name"])] += 1

        price = _coerce_positive_price(row.starting_price)
        if price is not None:
            current["min_price"] = price if current["min_price"] is None else min(current["min_price"], price)
            current["max_price"] = price if current["max_price"] is None else max(current["max_price"], price)

    out: dict = {}
    for developer_id, current in summary_lookup.items():
        sorted_areas = sorted(
            current["area_counts"].items(),
            key=lambda item: (-item[1], item[0][1]),
        )
        primary_areas = [
            {"slug": slug, "name": name, "project_count": project_count}
            for (slug, name), project_count in sorted_areas[:3]
        ]
        price_range = None
        if current["min_price"] is not None:
            price_range = {
                "min": current["min_price"],
                "max": current["max_price"],
                "currency": "THB",
            }

        out[developer_id] = {
            "project_count": current["project_count"],
            "primary_areas": primary_areas,
            "price_range": price_range,
            "has_active_projects": current["project_count"] > 0,
            "project_updated_at": current["project_updated_at"],
        }

    return out


def _serialize_stats(row: AreaStatistic | None) -> dict | None:
    if row is None:
        return None
    return {
        "avg_price_sqm": float(row.avg_price_sqm) if row.avg_price_sqm is not None else None,
        "avg_rent_monthly": float(row.avg_rent_monthly)
        if row.avg_rent_monthly is not None
        else None,
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


def _serialize_developer(row: Developer, locale: str, project_summary: dict | None = None) -> dict:
    profile_map = _normalize_i18n_text_map(row.profile or row.summary)
    description = _resolve_locale_text(profile_map, locale)
    project_count = int(project_summary.get("project_count", 0)) if project_summary else 0
    primary_areas = project_summary.get("primary_areas", []) if project_summary else []
    price_range = project_summary.get("price_range") if project_summary else None
    has_active_projects = bool(project_summary.get("has_active_projects")) if project_summary else False
    last_updated = _max_datetime(row.updated_at, project_summary.get("project_updated_at") if project_summary else None)
    return {
        "id": str(row.id),
        "slug": row.slug,
        "name": row.name,
        "description": description,
        "website": row.website,
        "project_count": project_count,
        "primary_areas": primary_areas,
        "price_range": price_range,
        "has_active_projects": has_active_projects,
        "last_updated": _isoformat_datetime(last_updated),
        "profile": profile_map,
        "profile_text": description,
        "summary": row.summary,
        "source_note": row.source_note,
        "trust_proof": row.trust_proof,
        "tier": row.tier,
        "logo_url": _safe_media_path(row.logo_url),
        "cover_image_url": _safe_media_path(row.cover_image_url),
        "status": row.status,
        "updated_at": _isoformat_datetime(row.updated_at),
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


@router.get("/developers", include_in_schema=False)
@router.get("/developers/")
def list_developers(
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> list[dict]:
    rows = db.scalars(
        select(Developer)
        .where(Developer.deleted_at.is_(None), Developer.status == "active")
        .order_by(asc(Developer.name))
    ).all()
    project_lookup = _build_developer_project_lookup(db, [row.id for row in rows])
    return [_serialize_developer(row, locale, project_lookup.get(row.id)) for row in rows]


@router.get("/developers/{slug}", include_in_schema=False)
@router.get("/developers/{slug}/")
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
    project_lookup = _build_developer_project_lookup(db, [row.id])
    return _serialize_developer(row, locale, project_lookup.get(row.id))


@router.get("/agents")
def list_agents() -> list[dict]:
    return []
