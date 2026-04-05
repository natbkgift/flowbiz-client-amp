import os
import time as _time
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, asc, case, desc, func, or_, select
from sqlalchemy.orm import Session

from packages.core.cache import response_cache
from packages.core.database import get_db
from packages.core.models import Area, CompanyInfo, Project, Property, TeamMember, Testimonial
from packages.core.schemas.property_api import (
    CompanyInfoItem,
    CompanyListResponse,
    PaginationMeta,
    PropertyDetail,
    PropertyListItem,
    PropertyListResponse,
    PropertyStatus,
    PropertyType,
    SearchResponse,
    SearchResultItem,
    TeamMemberItem,
    TeamMemberListResponse,
    TestimonialItem,
    TestimonialListResponse,
)

router = APIRouter(prefix="/v1", tags=["properties", "company"])


_IMAGE_STORAGE_ROOT = Path("/opt/flowbiz/storage/property-images")
_PUBLIC_PREFIX = "/images"
_ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# In-memory cache for image listings — avoids disk I/O per property on every request.
# TTL-based: entries expire after _IMAGE_CACHE_TTL seconds.
_image_cache: dict[str, tuple[float, list[str]]] = {}
_IMAGE_CACHE_TTL = 60  # seconds


def _normalize_i18n_map(value: object | None) -> dict[str, str] | None:
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


def _resolve_text_for_locale(
    i18n_map: dict[str, str] | None, fallback: str | None, locale: str
) -> str | None:
    if i18n_map:
        primary = i18n_map.get(locale)
        if primary:
            return primary
        if i18n_map.get("en"):
            return i18n_map["en"]
        if i18n_map.get("th"):
            return i18n_map["th"]
    if fallback is None:
        return None
    value = str(fallback).strip()
    return value or None


def _list_local_images(property_id: UUID) -> list[str]:
    """Return public /images/... URLs by listing storage folder (cached)."""
    cache_key = str(property_id)
    now = _time.monotonic()

    cached = _image_cache.get(cache_key)
    if cached is not None:
        ts, imgs = cached
        if now - ts < _IMAGE_CACHE_TTL:
            return imgs

    folder = _IMAGE_STORAGE_ROOT / cache_key
    try:
        if not folder.is_dir():
            _image_cache[cache_key] = (now, [])
            return []
        names = sorted(os.listdir(folder))
    except OSError:
        _image_cache[cache_key] = (now, [])
        return []

    out: list[str] = []
    for name in names:
        p = folder / name
        if not p.is_file():
            continue
        if p.suffix.lower() not in _ALLOWED_EXTS:
            continue
        out.append(f"{_PUBLIC_PREFIX}/{property_id}/{name}")

    _image_cache[cache_key] = (now, out)
    return out


def _coerce_image_list(value: object | None) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        out: list[str] = []
        for v in value:
            if isinstance(v, str) and v.strip():
                out.append(v.strip())
        return out
    return []


def _merge_images(*lists: list[str]) -> list[str]:
    """Merge lists, keep order, dedupe, and drop unsafe hotlink URLs."""
    out: list[str] = []
    seen: set[str] = set()
    for lst in lists:
        for raw in lst:
            s = raw.strip()
            if not s:
                continue
            # Hard rule: public API should not emit external hotlinks.
            if "://" in s:
                continue
            if s in seen:
                continue
            seen.add(s)
            out.append(s)
    return out


def _extract_tags(features: object | None) -> list[str] | None:
    if not isinstance(features, dict):
        return None
    raw = features.get("tags")
    if not isinstance(raw, list):
        return None
    values: list[str] = []
    for item in raw:
        text = str(item).strip()
        if not text:
            continue
        if text in values:
            continue
        values.append(text)
    return values or None


def _extract_view_label(features: object | None) -> str | None:
    if not isinstance(features, dict):
        return None
    raw = features.get("view_label")
    if raw is None:
        return None
    value = str(raw).strip()
    return value or None


def _has_foreign_quota_indicator(features: object | None, ownership_notes: object | None) -> bool:
    tags = _extract_tags(features) or []
    for tag in tags:
        normalized = tag.strip().lower().replace("_", " ")
        if "foreign quota" in normalized:
            return True

    if ownership_notes is None:
        return False
    normalized_notes = str(ownership_notes).strip().lower()
    return "foreign" in normalized_notes and "quota" in normalized_notes


def _parse_uuid(value: str | None) -> UUID | None:
    if not value:
        return None
    try:
        return UUID(str(value).strip())
    except (TypeError, ValueError, AttributeError):
        return None


def _resolve_project_id(db: Session, project: str | None) -> UUID | None:
    if not project:
        return None
    stripped = project.strip()
    if not stripped:
        return None
    parsed = _parse_uuid(stripped)
    if parsed is not None:
        return parsed
    return db.scalar(select(Project.id).where(Project.slug == stripped))


def _resolve_area_id(db: Session, area: str | None) -> UUID | None:
    if not area:
        return None
    stripped = area.strip()
    if not stripped:
        return None
    parsed = _parse_uuid(stripped)
    if parsed is not None:
        return parsed
    return db.scalar(select(Area.id).where(Area.slug == stripped))


def _resolve_canonical_cover(
    *, cover_image_url: object | None, cover_image: object | None, merged: list[str]
) -> str | None:
    # Canonical precedence: cover_image_url > cover_image > first merged image.
    if isinstance(cover_image_url, str):
        candidate = cover_image_url.strip()
        if candidate and "://" not in candidate:
            return candidate

    if isinstance(cover_image, str):
        candidate = cover_image.strip()
        if candidate and "://" not in candidate:
            return candidate

    return merged[0] if merged else None


@router.get("/properties", response_model=PropertyListResponse, include_in_schema=False)
@router.get("/properties/", response_model=PropertyListResponse)
def list_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: PropertyType | None = None,
    search: str | None = None,
    sort: str | None = Query(default=None, pattern=r"^(price_asc|price_desc|newest|oldest)$"),
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    project_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
) -> PropertyListResponse:
    base_query: Select[tuple[Property]] = select(Property).where(
        Property.status == PropertyStatus.ACTIVE.value
    )

    if type is not None:
        base_query = base_query.where(Property.type == type)

    if project_id is not None:
        base_query = base_query.where(Property.project_id == project_id)

    if search:
        pattern = f"%{search.strip()}%"
        base_query = base_query.where(
            or_(
                Property.title.ilike(pattern),
                Property.city.ilike(pattern),
                Property.address.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0

    if sort == "price_asc":
        order_by = (asc(Property.price), desc(Property.id))
    elif sort == "price_desc":
        order_by = (desc(Property.price), desc(Property.id))
    elif sort == "oldest":
        order_by = (asc(Property.created_at), asc(Property.id))  # type: ignore[arg-type]
    else:
        order_by = (desc(Property.created_at), desc(Property.id))  # type: ignore[arg-type]

    items = db.scalars(base_query.order_by(*order_by).offset((page - 1) * limit).limit(limit)).all()

    data: list[PropertyListItem] = []
    for item in items:
        # Build response using DB fields first (images/local_images/cover_image/cover_image_url)
        # then fallback to storage folder listing.
        m = PropertyListItem.model_validate(item)
        title_i18n = _normalize_i18n_map(getattr(item, "title_i18n", None))
        description_i18n = _normalize_i18n_map(getattr(item, "description_i18n", None))

        stored_local = _coerce_image_list(getattr(item, "local_images", None))
        stored_images = _coerce_image_list(getattr(item, "images", None))
        disk_images = _list_local_images(m.id)
        merged = _merge_images(stored_local, stored_images, disk_images)

        m.cover_image = _resolve_canonical_cover(
            cover_image_url=getattr(item, "cover_image_url", None),
            cover_image=getattr(item, "cover_image", None),
            merged=merged,
        )

        # Keep both fields populated for legacy/front-end compatibility.
        m.images = merged
        m.local_images = merged
        m.cover_image_url = m.cover_image
        m.title_i18n = title_i18n
        m.description_i18n = description_i18n
        m.title = (
            _resolve_text_for_locale(title_i18n, getattr(item, "title", None), locale) or m.title
        )
        m.description = _resolve_text_for_locale(
            description_i18n,
            getattr(item, "description", None),
            locale,
        )
        m.tags = _extract_tags(getattr(item, "features", None))
        m.view_label = _extract_view_label(getattr(item, "features", None))
        m.size_sqm = getattr(item, "size_sqm", None) or getattr(item, "size", None)
        data.append(m)

    return PropertyListResponse(data=data, meta=PaginationMeta(page=page, limit=limit, total=total))


@router.get("/search", response_model=SearchResponse, include_in_schema=False)
@router.get("/search/", response_model=SearchResponse)
def search_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    location: str | None = None,
    area: str | None = None,
    project: str | None = None,
    price_min: Decimal | None = Query(default=None, ge=0),
    price_max: Decimal | None = Query(default=None, ge=0),
    bedrooms: int | None = Query(default=None, ge=0),
    bathrooms: int | None = Query(default=None, ge=0),
    size_min: Decimal | None = Query(default=None, ge=0),
    size_max: Decimal | None = Query(default=None, ge=0),
    view: str | None = None,
    property_type: str | None = None,
    sort: str = Query(
        default="recommended",
        pattern=r"^(recommended|price_low_to_high|price_high_to_low|size|latest)$",
    ),
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> SearchResponse:
    base_query: Select[tuple[Property]] = select(Property).where(
        Property.status == PropertyStatus.ACTIVE.value,
        Property.type.in_([PropertyType.NEW.value, PropertyType.RESALE.value]),
    )

    project_id = _resolve_project_id(db, project)
    if project and project_id is None:
        return SearchResponse(total=0, page=page, results=[])
    if project_id is not None:
        base_query = base_query.where(Property.project_id == project_id)

    area_id = _resolve_area_id(db, area)
    if area and area_id is None:
        return SearchResponse(total=0, page=page, results=[])
    if area_id is not None:
        base_query = base_query.where(Property.area_id == area_id)

    if price_min is not None:
        base_query = base_query.where(Property.price >= price_min)
    if price_max is not None:
        base_query = base_query.where(Property.price <= price_max)
    if bedrooms is not None:
        base_query = base_query.where(Property.bedrooms == bedrooms)
    if bathrooms is not None:
        base_query = base_query.where(Property.bathrooms == bathrooms)
    if size_min is not None:
        base_query = base_query.where(func.coalesce(Property.size_sqm, Property.size) >= size_min)
    if size_max is not None:
        base_query = base_query.where(func.coalesce(Property.size_sqm, Property.size) <= size_max)
    if view:
        base_query = base_query.where(Property.view == view.strip())
    if property_type:
        base_query = base_query.where(Property.property_type == property_type.strip())

    if location and location.strip():
        pattern = f"%{location.strip()}%"
        matching_project_ids = db.scalars(
            select(Project.id).where(or_(Project.slug.ilike(pattern), Project.name.ilike(pattern)))
        ).all()
        matching_area_ids = db.scalars(
            select(Area.id).where(
                or_(Area.slug.ilike(pattern), Area.name.ilike(pattern), Area.city.ilike(pattern))
            )
        ).all()
        location_filters = [Property.city.ilike(pattern), Property.address.ilike(pattern)]
        if matching_project_ids:
            location_filters.append(Property.project_id.in_(matching_project_ids))
        if matching_area_ids:
            location_filters.append(Property.area_id.in_(matching_area_ids))
        base_query = base_query.where(or_(*location_filters))

    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0

    size_expr = func.coalesce(Property.size_sqm, Property.size)
    if sort == "price_low_to_high":
        order_by = (asc(Property.price), desc(Property.id))
    elif sort == "price_high_to_low":
        order_by = (desc(Property.price), desc(Property.id))
    elif sort == "size":
        order_by = (desc(size_expr), desc(Property.id))
    elif sort == "latest":
        order_by = (desc(Property.created_at), desc(Property.id))  # type: ignore[arg-type]
    else:
        order_by = (
            desc(case((Property.project_id.is_not(None), 1), else_=0)),
            desc(
                case(
                    (Property.cover_image_url.is_not(None), 1),
                    (Property.cover_image.is_not(None), 1),
                    else_=0,
                )
            ),
            desc(case((size_expr.is_not(None), 1), else_=0)),
            desc(Property.created_at),  # type: ignore[arg-type]
            desc(Property.id),
        )

    items = db.scalars(base_query.order_by(*order_by).offset((page - 1) * limit).limit(limit)).all()

    project_ids = {item.project_id for item in items if item.project_id is not None}
    area_ids = {item.area_id for item in items if item.area_id is not None}
    project_names = (
        dict(db.execute(select(Project.id, Project.name).where(Project.id.in_(project_ids))).all())
        if project_ids
        else {}
    )
    area_names = (
        dict(db.execute(select(Area.id, Area.name).where(Area.id.in_(area_ids))).all())
        if area_ids
        else {}
    )

    results: list[SearchResultItem] = []
    for item in items:
        title_i18n = _normalize_i18n_map(getattr(item, "title_i18n", None))
        stored_local = _coerce_image_list(getattr(item, "local_images", None))
        stored_images = _coerce_image_list(getattr(item, "images", None))
        disk_images = _list_local_images(item.id)
        merged = _merge_images(stored_local, stored_images, disk_images)
        image = _resolve_canonical_cover(
            cover_image_url=getattr(item, "cover_image_url", None),
            cover_image=getattr(item, "cover_image", None),
            merged=merged,
        )
        results.append(
            SearchResultItem(
                id=item.slug or str(item.id),
                title=_resolve_text_for_locale(title_i18n, getattr(item, "title", None), locale)
                or item.title,
                project=project_names.get(item.project_id),
                location=area_names.get(item.area_id) or item.city,
                price=item.price,
                size=getattr(item, "size_sqm", None) or getattr(item, "size", None),
                bedrooms=item.bedrooms,
                bathrooms=item.bathrooms,
                image=image,
                foreign_quota=_has_foreign_quota_indicator(
                    getattr(item, "features", None), getattr(item, "ownership_notes", None)
                ),
            )
        )

    return SearchResponse(total=total, page=page, results=results)


@router.get("/properties/{property_id}", response_model=PropertyDetail, include_in_schema=False)
@router.get("/properties/{property_id}/", response_model=PropertyDetail)
def get_property(
    property_id: UUID,
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> PropertyDetail:
    prop = db.get(Property, property_id)
    if prop is None or prop.status != PropertyStatus.ACTIVE.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    m = PropertyDetail.model_validate(prop)
    stored_local = _coerce_image_list(getattr(prop, "local_images", None))
    stored_images = _coerce_image_list(getattr(prop, "images", None))
    disk_images = _list_local_images(m.id)
    merged = _merge_images(stored_local, stored_images, disk_images)

    m.cover_image = _resolve_canonical_cover(
        cover_image_url=getattr(prop, "cover_image_url", None),
        cover_image=getattr(prop, "cover_image", None),
        merged=merged,
    )

    m.images = merged
    m.local_images = merged
    m.cover_image_url = m.cover_image
    title_i18n = _normalize_i18n_map(getattr(prop, "title_i18n", None))
    description_i18n = _normalize_i18n_map(getattr(prop, "description_i18n", None))
    m.title_i18n = title_i18n
    m.description_i18n = description_i18n
    m.title = _resolve_text_for_locale(title_i18n, getattr(prop, "title", None), locale) or m.title
    m.description = _resolve_text_for_locale(
        description_i18n, getattr(prop, "description", None), locale
    )
    m.tags = _extract_tags(getattr(prop, "features", None))
    m.view_label = _extract_view_label(getattr(prop, "features", None))
    m.size_sqm = getattr(prop, "size_sqm", None) or getattr(prop, "size", None)
    return m


@router.get("/properties/slug/{slug}", response_model=PropertyDetail, include_in_schema=False)
@router.get("/properties/slug/{slug}/", response_model=PropertyDetail)
def get_property_by_slug(
    slug: str,
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> PropertyDetail:
    prop = db.scalar(select(Property).where(Property.slug == slug))
    if prop is None or prop.status != PropertyStatus.ACTIVE.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    m = PropertyDetail.model_validate(prop)
    stored_local = _coerce_image_list(getattr(prop, "local_images", None))
    stored_images = _coerce_image_list(getattr(prop, "images", None))
    disk_images = _list_local_images(m.id)
    merged = _merge_images(stored_local, stored_images, disk_images)

    m.cover_image = _resolve_canonical_cover(
        cover_image_url=getattr(prop, "cover_image_url", None),
        cover_image=getattr(prop, "cover_image", None),
        merged=merged,
    )

    m.images = merged
    m.local_images = merged
    m.cover_image_url = m.cover_image
    title_i18n = _normalize_i18n_map(getattr(prop, "title_i18n", None))
    description_i18n = _normalize_i18n_map(getattr(prop, "description_i18n", None))
    m.title_i18n = title_i18n
    m.description_i18n = description_i18n
    m.title = _resolve_text_for_locale(title_i18n, getattr(prop, "title", None), locale) or m.title
    m.description = _resolve_text_for_locale(
        description_i18n, getattr(prop, "description", None), locale
    )
    m.tags = _extract_tags(getattr(prop, "features", None))
    m.view_label = _extract_view_label(getattr(prop, "features", None))
    m.size_sqm = getattr(prop, "size_sqm", None) or getattr(prop, "size", None)
    return m


@router.get("/company", response_model=CompanyListResponse)
def list_company_info(
    db: Session = Depends(get_db),
) -> CompanyListResponse:
    cached = response_cache.get("company_list")
    if cached is not None:
        return cached
    items = db.scalars(
        select(CompanyInfo).order_by(asc(CompanyInfo.title), asc(CompanyInfo.id))
    ).all()
    result = CompanyListResponse(data=[CompanyInfoItem.model_validate(item) for item in items])
    response_cache.set("company_list", result, ttl=600)
    return result


@router.get("/company/{slug}", response_model=CompanyInfoItem)
def get_company_info(
    slug: str,
    db: Session = Depends(get_db),
) -> CompanyInfoItem:
    item = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == slug))
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company info not found")
    return CompanyInfoItem.model_validate(item)


@router.get("/team-members", response_model=TeamMemberListResponse)
def list_public_team_members(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> TeamMemberListResponse:
    rows = db.scalars(
        select(TeamMember)
        .where(TeamMember.deleted_at.is_(None), TeamMember.status == "active")
        .order_by(asc(TeamMember.display_order), asc(TeamMember.name))
        .limit(limit)
    ).all()
    return TeamMemberListResponse(data=[TeamMemberItem.model_validate(row) for row in rows])


@router.get("/testimonials", response_model=TestimonialListResponse)
def list_public_testimonials(
    limit: int = Query(default=50, ge=1, le=200),
    intent: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> TestimonialListResponse:
    query = select(Testimonial).where(
        Testimonial.deleted_at.is_(None),
        Testimonial.status == "published",
    )
    if intent and intent.strip():
        query = query.where(Testimonial.intent == intent.strip())

    rows = db.scalars(
        query.order_by(asc(Testimonial.display_order), desc(Testimonial.created_at)).limit(limit)
    ).all()
    return TestimonialListResponse(data=[TestimonialItem.model_validate(row) for row in rows])
