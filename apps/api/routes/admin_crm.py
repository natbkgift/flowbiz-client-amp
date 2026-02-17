from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.audit import write_audit_log
from packages.core.database import get_db
from packages.core.models import Inquiry, LeadAssignment, User, Viewing
from packages.core.schemas.crm import (
    InquiryItem,
    InquiryStatusUpdate,
    ViewingItem,
    ViewingUpdate,
)
from packages.core.schemas.crm_admin import LeadAssignmentItem, LeadAssignRequest

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/inquiries", response_model=list[InquiryItem])
async def list_inquiries(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[InquiryItem]:
    inquiries = db.scalars(select(Inquiry).order_by(desc(Inquiry.created_at)).limit(200)).all()
    return [InquiryItem.model_validate(i) for i in inquiries]


@router.get("/inquiries/{inquiry_id}", response_model=InquiryItem)
async def get_inquiry(
    inquiry_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> InquiryItem:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    return InquiryItem.model_validate(inquiry)


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

    before = inquiry.status
    inquiry.status = payload.status
    db.add(inquiry)

    write_audit_log(
        db,
        actor_user_id=_admin.id,
        entity_type="inquiry",
        entity_id=str(inquiry.id),
        action="status_update",
        diff={"status": {"from": before, "to": payload.status}},
    )

    db.commit()
    db.refresh(inquiry)
    return InquiryItem.model_validate(inquiry)


@router.get("/inquiries/{inquiry_id}/assignments", response_model=list[LeadAssignmentItem])
async def list_inquiry_assignments(
    inquiry_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[LeadAssignmentItem]:
    rows = db.scalars(
        select(LeadAssignment)
        .where(LeadAssignment.inquiry_id == inquiry_id)
        .order_by(desc(LeadAssignment.created_at))
        .limit(200)
    ).all()
    return [LeadAssignmentItem.model_validate(r) for r in rows]


@router.post("/inquiries/{inquiry_id}/assign", response_model=InquiryItem)
async def assign_inquiry(
    inquiry_id: UUID,
    payload: LeadAssignRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> InquiryItem:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    before = inquiry.advisor_user_id
    inquiry.advisor_user_id = payload.assigned_user_id
    db.add(inquiry)
    db.add(
        LeadAssignment(
            inquiry_id=inquiry.id,
            assigned_user_id=payload.assigned_user_id,
            assigned_by_user_id=admin.id,
            reason=payload.reason or "manual",
        )
    )
    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="inquiry",
        entity_id=str(inquiry.id),
        action="assign_manual",
        diff={
            "advisor_user_id": {
                "from": str(before) if before else None,
                "to": str(payload.assigned_user_id) if payload.assigned_user_id else None,
            },
            "reason": payload.reason or "manual",
        },
    )
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
