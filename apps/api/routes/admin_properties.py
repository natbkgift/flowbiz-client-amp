from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import CompanyInfo, Property, User
from packages.core.schemas.property_api import (
    CompanyInfoCreate,
    CompanyInfoItem,
    CompanyInfoUpdate,
    PropertyCreate,
    PropertyDetail,
    PropertyUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _commit_or_conflict(db: Session, *, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc


@router.post("/properties", response_model=PropertyDetail, status_code=status.HTTP_201_CREATED)
async def create_property(
    payload: PropertyCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    prop = Property(**payload.model_dump())
    db.add(prop)
    _commit_or_conflict(db, detail="A property with this slug already exists.")
    db.refresh(prop)
    return PropertyDetail.model_validate(prop)


@router.patch("/properties/{property_id}", response_model=PropertyDetail)
async def update_property(
    property_id: UUID,
    payload: PropertyUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)

    db.add(prop)
    _commit_or_conflict(db, detail="A property with this slug already exists.")
    db.refresh(prop)
    return PropertyDetail.model_validate(prop)


@router.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    db.delete(prop)
    db.commit()


@router.post("/company", response_model=CompanyInfoItem, status_code=status.HTTP_201_CREATED)
async def create_company_info(
    payload: CompanyInfoCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CompanyInfoItem:
    info = CompanyInfo(**payload.model_dump())
    db.add(info)
    _commit_or_conflict(db, detail="Company info with this slug already exists.")
    db.refresh(info)
    return CompanyInfoItem.model_validate(info)


@router.patch("/company/{slug}", response_model=CompanyInfoItem)
async def update_company_info(
    slug: str,
    payload: CompanyInfoUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CompanyInfoItem:
    info = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == slug))
    if info is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company info not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(info, field, value)

    db.add(info)
    _commit_or_conflict(db, detail="Company info with this slug already exists.")
    db.refresh(info)
    return CompanyInfoItem.model_validate(info)
