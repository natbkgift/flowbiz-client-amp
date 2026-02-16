from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import Inquiry, User, Viewing
from packages.core.schemas.crm import (
    InquiryItem,
    InquiryStatusUpdate,
    ViewingItem,
    ViewingUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/inquiries", response_model=list[InquiryItem])
async def list_inquiries(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[InquiryItem]:
    inquiries = db.scalars(select(Inquiry).order_by(desc(Inquiry.created_at)).limit(200)).all()
    return [InquiryItem.model_validate(i) for i in inquiries]


@router.patch("/inquiries/{inquiry_id}", response_model=InquiryItem)
async def update_inquiry_status(
    inquiry_id: UUID,
    payload: InquiryStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> InquiryItem:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    inquiry.status = payload.status
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return InquiryItem.model_validate(inquiry)


@router.get("/viewings", response_model=list[ViewingItem])
async def list_viewings(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[ViewingItem]:
    viewings = db.scalars(select(Viewing).order_by(desc(Viewing.scheduled_at)).limit(200)).all()
    return [ViewingItem.model_validate(v) for v in viewings]


@router.patch("/viewings/{viewing_id}", response_model=ViewingItem)
async def update_viewing(
    viewing_id: UUID,
    payload: ViewingUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ViewingItem:
    viewing = db.get(Viewing, viewing_id)
    if viewing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viewing not found")

    if payload.scheduled_at is not None:
        viewing.scheduled_at = payload.scheduled_at
    if payload.status is not None:
        viewing.status = payload.status
    if payload.notes is not None:
        viewing.notes = payload.notes

    db.add(viewing)
    db.commit()
    db.refresh(viewing)
    return ViewingItem.model_validate(viewing)
