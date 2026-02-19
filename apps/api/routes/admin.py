from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import Lead, User
from packages.core.schemas.admin_api import LeadAdminItem, LeadStatusUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/leads", response_model=list[LeadAdminItem])
def list_leads(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[LeadAdminItem]:
    leads = db.scalars(select(Lead).order_by(desc(Lead.created_at))).all()
    return [LeadAdminItem.model_validate(lead) for lead in leads]


@router.get("/leads/{lead_id}", response_model=LeadAdminItem)
def get_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> LeadAdminItem:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    return LeadAdminItem.model_validate(lead)


@router.patch("/leads/{lead_id}", response_model=LeadAdminItem)
def update_lead_status(
    lead_id: UUID,
    payload: LeadStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> LeadAdminItem:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    lead.status = payload.status
    db.add(lead)
    db.commit()
    db.refresh(lead)

    return LeadAdminItem.model_validate(lead)
