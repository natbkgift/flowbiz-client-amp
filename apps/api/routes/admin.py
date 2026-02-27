from __future__ import annotations

import csv
import io
from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import String, asc, desc, func, or_, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.audit import write_audit_log
from packages.core.database import get_db
from packages.core.models import AuditLog, Lead, User
from packages.core.schemas.admin_api import (
    LeadAdminItem,
    LeadAssignRequest,
    LeadNoteCreate,
    LeadNoteUpdate,
    LeadStatusUpdate,
    LeadTimelineEvent,
)
from packages.core.schemas.pagination import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/admin", tags=["admin"])

_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "new": {"new", "contacted", "qualified", "lost"},
    "contacted": {"contacted", "qualified", "won", "lost"},
    "qualified": {"qualified", "won", "lost"},
    "won": {"won"},
    "lost": {"lost"},
}


def _is_spam_hint(lead: Lead) -> bool:
    email = (lead.email or "").lower()
    name = (lead.name or "").lower()
    return "mailinator" in email or "tempmail" in email or name.startswith("spam")


def _is_duplicate_hint(db: Session, lead: Lead) -> bool:
    if lead.email:
        email_count = db.scalar(
            select(func.count()).select_from(Lead).where(Lead.email == lead.email, Lead.id != lead.id)
        )
        if (email_count or 0) > 0:
            return True
    if lead.phone:
        phone_count = db.scalar(
            select(func.count()).select_from(Lead).where(Lead.phone == lead.phone, Lead.id != lead.id)
        )
        if (phone_count or 0) > 0:
            return True
    return False


def _to_lead_item(db: Session, lead: Lead) -> LeadAdminItem:
    return LeadAdminItem(
        id=lead.id,
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        score=lead.score,
        status=lead.status,
        source_page=lead.source_page,
        purpose=lead.purpose,
        owner_user_id=lead.owner_user_id,
        follow_up_due_at=lead.follow_up_due_at,
        is_duplicate_hint=_is_duplicate_hint(db, lead),
        is_spam_hint=_is_spam_hint(lead),
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


def _timeline_event(log: AuditLog, lead_id: UUID) -> LeadTimelineEvent:
    diff = log.diff if isinstance(log.diff, dict) else None
    note_id = str(diff.get("note_id")) if isinstance(diff, dict) and diff.get("note_id") else None
    note = str(diff.get("note")) if isinstance(diff, dict) and diff.get("note") else None
    return LeadTimelineEvent(
        id=log.id,
        lead_id=lead_id,
        action=log.action,
        actor_user_id=log.actor_user_id,
        note_id=note_id,
        note=note,
        diff=diff,
        created_at=log.created_at,
    )


@router.get("/leads", response_model=PaginatedResponse[LeadAdminItem])
def list_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(default=None, alias="status"),
    source_filter: str | None = Query(default=None, alias="source"),
    purpose_filter: str | None = Query(default=None, alias="purpose"),
    owner_user_id: UUID | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    query_text: str | None = Query(default=None, alias="q", min_length=1, max_length=200),
    sort: str = Query(default="newest"),
    order: str = Query(default="desc"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[LeadAdminItem]:
    if sort not in {"newest", "follow_up_due"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid sort")
    if order not in {"asc", "desc"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid order")

    base = select(Lead)
    if status_filter:
        base = base.where(Lead.status == status_filter)
    if source_filter:
        base = base.where(Lead.source_page.ilike(f"%{source_filter.strip()}%"))
    if purpose_filter:
        base = base.where(Lead.purpose == purpose_filter)
    if owner_user_id is not None:
        base = base.where(Lead.owner_user_id == owner_user_id)
    if date_from is not None:
        base = base.where(Lead.created_at >= date_from)
    if date_to is not None:
        base = base.where(Lead.created_at <= date_to)
    if query_text:
        like_pattern = f"%{query_text.strip()}%"
        base = base.where(
            or_(
                Lead.name.ilike(like_pattern),
                Lead.email.ilike(like_pattern),
                Lead.phone.ilike(like_pattern),
                Lead.source_page.ilike(like_pattern),
                func.cast(Lead.id, String).ilike(like_pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    if sort == "follow_up_due":
        sort_col = Lead.follow_up_due_at
    else:
        sort_col = Lead.created_at
    order_clause = asc(sort_col) if order == "asc" else desc(sort_col)
    rows = db.scalars(base.order_by(order_clause, desc(Lead.created_at)).offset((page - 1) * limit).limit(limit)).all()

    return PaginatedResponse(
        data=[_to_lead_item(db, lead) for lead in rows],
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
    return _to_lead_item(db, lead)


@router.patch("/leads/{lead_id}", response_model=LeadAdminItem)
def update_lead_status(
    lead_id: UUID,
    payload: LeadStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> LeadAdminItem:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    before = lead.status
    allowed = _STATUS_TRANSITIONS.get(before, {before})
    if payload.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition: {before} -> {payload.status}",
        )

    lead.status = payload.status
    if payload.status in {"contacted", "qualified"} and lead.follow_up_due_at is None:
        lead.follow_up_due_at = datetime.now(UTC)
    db.add(lead)

    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="lead",
        entity_id=str(lead.id),
        action="status_update",
        diff={"status": {"from": before, "to": payload.status}},
    )

    db.commit()
    db.refresh(lead)
    return _to_lead_item(db, lead)


@router.post("/leads/{lead_id}/assign", response_model=LeadAdminItem)
def assign_lead(
    lead_id: UUID,
    payload: LeadAssignRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> LeadAdminItem:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    before = lead.owner_user_id
    lead.owner_user_id = payload.owner_user_id
    db.add(lead)

    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="lead",
        entity_id=str(lead.id),
        action="assign_manual",
        diff={
            "owner_user_id": {
                "from": str(before) if before else None,
                "to": str(payload.owner_user_id) if payload.owner_user_id else None,
            },
            "reason": payload.reason or "manual",
        },
    )

    db.commit()
    db.refresh(lead)
    return _to_lead_item(db, lead)


@router.get("/leads/{lead_id}/timeline", response_model=PaginatedResponse[LeadTimelineEvent])
def list_lead_timeline(
    lead_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[LeadTimelineEvent]:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    base = select(AuditLog).where(AuditLog.entity_type == "lead", AuditLog.entity_id == str(lead_id))
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(base.order_by(desc(AuditLog.created_at)).offset((page - 1) * limit).limit(limit)).all()
    return PaginatedResponse(
        data=[_timeline_event(log, lead_id) for log in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.post("/leads/{lead_id}/notes", response_model=LeadTimelineEvent)
def add_lead_note(
    lead_id: UUID,
    payload: LeadNoteCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> LeadTimelineEvent:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    note_id = str(uuid4())
    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="lead",
        entity_id=str(lead.id),
        action="note_add",
        diff={"note_id": note_id, "note": payload.note.strip()},
    )
    db.commit()

    created = db.scalar(
        select(AuditLog)
        .where(AuditLog.entity_type == "lead", AuditLog.entity_id == str(lead.id), AuditLog.action == "note_add")
        .order_by(desc(AuditLog.created_at))
        .limit(1)
    )
    if created is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Note not saved")
    return _timeline_event(created, lead.id)


@router.patch("/leads/{lead_id}/notes/{note_id}", response_model=LeadTimelineEvent)
def update_lead_note(
    lead_id: UUID,
    note_id: str,
    payload: LeadNoteUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> LeadTimelineEvent:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    logs = db.scalars(
        select(AuditLog)
        .where(AuditLog.entity_type == "lead", AuditLog.entity_id == str(lead.id), AuditLog.action.in_(["note_add", "note_update"]))
        .order_by(desc(AuditLog.created_at))
    ).all()
    if not any(isinstance(item.diff, dict) and str(item.diff.get("note_id")) == note_id for item in logs):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="lead",
        entity_id=str(lead.id),
        action="note_update",
        diff={"note_id": note_id, "note": payload.note.strip()},
    )
    db.commit()

    updated = db.scalar(
        select(AuditLog)
        .where(AuditLog.entity_type == "lead", AuditLog.entity_id == str(lead.id), AuditLog.action == "note_update")
        .order_by(desc(AuditLog.created_at))
        .limit(1)
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Note not updated")
    return _timeline_event(updated, lead.id)


@router.get("/leads-export.csv")
def export_leads_csv(
    status_filter: str | None = Query(default=None, alias="status"),
    source_filter: str | None = Query(default=None, alias="source"),
    purpose_filter: str | None = Query(default=None, alias="purpose"),
    owner_user_id: UUID | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    query_text: str | None = Query(default=None, alias="q", min_length=1, max_length=200),
    sort: str = Query(default="newest"),
    order: str = Query(default="desc"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Response:
    listing = list_leads(
        page=1,
        limit=200,
        status_filter=status_filter,
        source_filter=source_filter,
        purpose_filter=purpose_filter,
        owner_user_id=owner_user_id,
        date_from=date_from,
        date_to=date_to,
        query_text=query_text,
        sort=sort,
        order=order,
        db=db,
        _admin=_admin,
    )

    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow([
        "id",
        "name",
        "email",
        "phone",
        "status",
        "score",
        "source_page",
        "purpose",
        "owner_user_id",
        "follow_up_due_at",
        "duplicate_hint",
        "spam_hint",
        "created_at",
    ])
    for row in listing.data:
        writer.writerow([
            str(row.id),
            row.name,
            row.email or "",
            row.phone or "",
            row.status,
            row.score,
            row.source_page or "",
            row.purpose or "",
            str(row.owner_user_id) if row.owner_user_id else "",
            row.follow_up_due_at.isoformat() if row.follow_up_due_at else "",
            "1" if row.is_duplicate_hint else "0",
            "1" if row.is_spam_hint else "0",
            row.created_at.isoformat(),
        ])

    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="leads-export.csv"'},
    )

