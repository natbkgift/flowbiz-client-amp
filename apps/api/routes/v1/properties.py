from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, asc, desc, func, or_, select
from sqlalchemy.orm import Session

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


@router.get("/properties", response_model=PropertyListResponse)
async def list_properties(
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

    return PropertyListResponse(
        data=[PropertyListItem.model_validate(item) for item in items],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.get("/properties/{property_id}", response_model=PropertyDetail)
async def get_property(
    property_id: UUID,
    db: Session = Depends(get_db),
) -> PropertyDetail:
    prop = db.get(Property, property_id)
    if prop is None or prop.status != PropertyStatus.ACTIVE.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return PropertyDetail.model_validate(prop)


@router.get("/properties/slug/{slug}", response_model=PropertyDetail)
async def get_property_by_slug(
    slug: str,
    db: Session = Depends(get_db),
) -> PropertyDetail:
    prop = db.scalar(select(Property).where(Property.slug == slug))
    if prop is None or prop.status != PropertyStatus.ACTIVE.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return PropertyDetail.model_validate(prop)


@router.get("/company", response_model=CompanyListResponse)
async def list_company_info(
    db: Session = Depends(get_db),
) -> CompanyListResponse:
    items = db.scalars(
        select(CompanyInfo).order_by(asc(CompanyInfo.title), asc(CompanyInfo.id))
    ).all()
    return CompanyListResponse(data=[CompanyInfoItem.model_validate(item) for item in items])


@router.get("/company/{slug}", response_model=CompanyInfoItem)
async def get_company_info(
    slug: str,
    db: Session = Depends(get_db),
) -> CompanyInfoItem:
    item = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == slug))
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company info not found")
    return CompanyInfoItem.model_validate(item)
