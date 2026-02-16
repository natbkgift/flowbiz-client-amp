from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Inquiry, Property, Viewing
from packages.core.schemas.crm import InquiryCreate, InquiryItem, ViewingCreate, ViewingItem

router = APIRouter(prefix="/v1", tags=["crm"])


@router.post("/inquiries", response_model=InquiryItem, status_code=status.HTTP_201_CREATED)
async def create_inquiry(payload: InquiryCreate, db: Session = Depends(get_db)) -> InquiryItem:
    if payload.property_id is not None:
        prop = db.get(Property, payload.property_id)
        if prop is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    inquiry = Inquiry(
        property_id=payload.property_id,
        name=payload.name,
        email=str(payload.email) if payload.email is not None else None,
        phone=(payload.phone.strip() if payload.phone else None),
        message=payload.message,
        source_page=payload.source_page,
        status="new",
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return InquiryItem.model_validate(inquiry)


@router.post("/viewings", response_model=ViewingItem, status_code=status.HTTP_201_CREATED)
async def schedule_viewing(payload: ViewingCreate, db: Session = Depends(get_db)) -> ViewingItem:
    inquiry = db.get(Inquiry, payload.inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    viewing = Viewing(
        inquiry_id=payload.inquiry_id,
        scheduled_at=payload.scheduled_at,
        status="scheduled",
        notes=payload.notes,
    )
    db.add(viewing)
    db.commit()
    db.refresh(viewing)
    return ViewingItem.model_validate(viewing)
