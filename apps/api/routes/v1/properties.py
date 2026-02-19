import os
import time as _time
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, asc, desc, func, or_, select
from sqlalchemy.orm import Session

from packages.core.cache import response_cache
from packages.core.database import get_db
from packages.core.models import CompanyInfo, Property
from packages.core.schemas.property_api import (
    CompanyInfoItem,
    CompanyListResponse,
    PaginationMeta,
    PropertyDetail,
    PropertyListItem,
    PropertyListResponse,
    PropertyStatus,
    PropertyType,
)

router = APIRouter(prefix="/v1", tags=["properties", "company"])


_IMAGE_STORAGE_ROOT = Path("/opt/flowbiz/storage/property-images")
_PUBLIC_PREFIX = "/images"
_ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# In-memory cache for image listings — avoids disk I/O per property on every request.
# TTL-based: entries expire after _IMAGE_CACHE_TTL seconds.
_image_cache: dict[str, tuple[float, list[str]]] = {}
_IMAGE_CACHE_TTL = 60  # seconds


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


@router.get("/properties", response_model=PropertyListResponse)
def list_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: PropertyType | None = None,
    search: str | None = None,
    sort: str | None = Query(default=None, pattern=r"^(price_asc|price_desc|newest|oldest)$"),
    db: Session = Depends(get_db),
) -> PropertyListResponse:
    base_query: Select[tuple[Property]] = select(Property).where(
        Property.status == PropertyStatus.ACTIVE.value
    )

    if type is not None:
        base_query = base_query.where(Property.type == type)

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
        order_by = (asc(Property.created_at), asc(Property.id))
    else:
        order_by = (desc(Property.created_at), desc(Property.id))

    items = db.scalars(base_query.order_by(*order_by).offset((page - 1) * limit).limit(limit)).all()

    data: list[PropertyListItem] = []
    for item in items:
        m = PropertyListItem.model_validate(item)
        imgs = _list_local_images(m.id)
        m.images = imgs
        m.local_images = imgs
        m.cover_image = imgs[0] if imgs else None
        data.append(m)

    return PropertyListResponse(data=data, meta=PaginationMeta(page=page, limit=limit, total=total))


@router.get("/properties/{property_id}", response_model=PropertyDetail)
def get_property(
    property_id: UUID,
    db: Session = Depends(get_db),
) -> PropertyDetail:
    prop = db.get(Property, property_id)
    if prop is None or prop.status != PropertyStatus.ACTIVE.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    m = PropertyDetail.model_validate(prop)
    imgs = _list_local_images(m.id)
    m.images = imgs
    m.local_images = imgs
    m.cover_image = imgs[0] if imgs else None
    return m


@router.get("/properties/slug/{slug}", response_model=PropertyDetail)
def get_property_by_slug(
    slug: str,
    db: Session = Depends(get_db),
) -> PropertyDetail:
    prop = db.scalar(select(Property).where(Property.slug == slug))
    if prop is None or prop.status != PropertyStatus.ACTIVE.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    m = PropertyDetail.model_validate(prop)
    imgs = _list_local_images(m.id)
    m.images = imgs
    m.local_images = imgs
    m.cover_image = imgs[0] if imgs else None
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
