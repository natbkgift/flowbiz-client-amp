from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import Lead, User
from packages.core.schemas.admin_api import LeadAdminItem, LeadStatusUpdate
from packages.core.schemas.pagination import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/leads", response_model=PaginatedResponse[LeadAdminItem])
def list_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[LeadAdminItem]:
    base = select(Lead)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(desc(Lead.created_at)).offset((page - 1) * limit).limit(limit)
    ).all()
    return PaginatedResponse(
        data=[LeadAdminItem.model_validate(lead) for lead in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


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
