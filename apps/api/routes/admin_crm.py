from __future__ import annotations

import csv
import io
from datetime import date, datetime, time
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import String, and_, asc, desc, func, not_, or_, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.audit import write_audit_log
from packages.core.crm_contact_actions import build_contact_action_urls
from packages.core.crm_follow_up import normalize_follow_up_status
from packages.core.database import get_db
from packages.core.models import AuditLog, Inquiry, LeadAssignment, User, Viewing
from packages.core.schemas.crm import InquiryItem, InquiryStatusUpdate, ViewingItem, ViewingUpdate
from packages.core.schemas.crm_admin import (
    InquiryFollowUpUpdate,
    InquiryNoteCreate,
    InquiryNoteUpdate,
    InquiryTimelineEvent,
    LeadAssignmentItem,
    LeadAssignRequest,
)
from packages.core.schemas.pagination import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/admin", tags=["admin"])

_VALID_LIST_SORTS = {"created_at", "score", "status"}
_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "new": {"new", "contacted", "lost"},
    "contacted": {"contacted", "qualified", "closed", "lost"},
    "qualified": {"qualified", "closed", "lost"},
    "closed": {"closed"},
    "lost": {"lost"},
}


def _is_spam_hint(inquiry: Inquiry) -> bool:
    tags = inquiry.tags or []
    lowered = {str(tag).lower() for tag in tags}
    return any(tag in lowered for tag in {"spam", "honeypot", "rate_limited"})


def _spam_filter_clause(*, is_spam: bool):
    # Cross-dialect: tags are JSON/JSONB; cast to text and match normalized markers.
    tags_text = func.lower(func.coalesce(func.cast(Inquiry.tags, String), ""))
    marker_match = or_(
        tags_text.like('%"spam"%'),
        tags_text.like('%"honeypot"%'),
        tags_text.like('%"rate_limited"%'),
    )
    return marker_match if is_spam else and_(not_(marker_match))


def _to_inquiry_item(inquiry: Inquiry) -> InquiryItem:
    contact_actions = build_contact_action_urls(email=inquiry.email, phone=inquiry.phone)
    return InquiryItem(
        id=inquiry.id,
        property_id=inquiry.property_id,
        advisor_user_id=inquiry.advisor_user_id,
        duplicate_of_inquiry_id=inquiry.duplicate_of_inquiry_id,
        name=inquiry.name,
        email=inquiry.email,
        phone=inquiry.phone,
        message=inquiry.message,
        source_page=inquiry.source_page,
        intent=inquiry.intent,
        purpose=inquiry.intent,
        score=inquiry.score,
        status=inquiry.status,
        persona=inquiry.persona,
        budget_band=inquiry.budget_band,
        timeline=inquiry.timeline,
        follow_up_status=inquiry.follow_up_status,
        follow_up_due_at=inquiry.follow_up_due_at,
        whatsapp_url=contact_actions["whatsapp_url"],
        phone_url=contact_actions["phone_url"],
        email_url=contact_actions["email_url"],
        is_duplicate_hint=inquiry.duplicate_of_inquiry_id is not None,
        is_spam_hint=_is_spam_hint(inquiry),
        created_at=inquiry.created_at,
        updated_at=inquiry.updated_at,
    )


def _build_timeline_event(log: AuditLog, inquiry_id: UUID) -> InquiryTimelineEvent:
    diff = log.diff if isinstance(log.diff, dict) else None
    note_id: str | None = None
    note: str | None = None
    if diff:
        raw_note_id = diff.get("note_id")
        note_id = str(raw_note_id) if raw_note_id else None
        raw_note = diff.get("note")
        note = str(raw_note) if raw_note else None
    return InquiryTimelineEvent(
        id=log.id,
        inquiry_id=inquiry_id,
        action=log.action,
        actor_user_id=log.actor_user_id,
        note_id=note_id,
        note=note,
        diff=diff,
        created_at=log.created_at,
    )


@router.get("/inquiries", response_model=PaginatedResponse[InquiryItem])
def list_inquiries(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(default=None, alias="status"),
    source_filter: str | None = Query(default=None, alias="source"),
    purpose_filter: str | None = Query(default=None, alias="purpose"),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    follow_up_status: str | None = Query(default=None),
    advisor_user_id: UUID | None = Query(default=None),
    query_text: str | None = Query(default=None, alias="q", min_length=1, max_length=200),
    has_duplicates: bool | None = Query(default=None),
    is_spam: bool | None = Query(default=None),
    sort: str = Query(default="created_at"),
    order: str = Query(default="desc"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[InquiryItem]:
    if sort not in _VALID_LIST_SORTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid sort"
        )
    if order not in {"asc", "desc"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid order"
        )
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid date range"
        )

    base = select(Inquiry)
    if status_filter:
        base = base.where(Inquiry.status == status_filter)
    if source_filter:
        like_pattern = f"%{source_filter.strip()}%"
        base = base.where(Inquiry.source_page.ilike(like_pattern))
    if purpose_filter:
        base = base.where(func.lower(Inquiry.intent) == purpose_filter.strip().lower())
    if date_from is not None:
        base = base.where(Inquiry.created_at >= datetime.combine(date_from, time.min))
    if date_to is not None:
        base = base.where(Inquiry.created_at <= datetime.combine(date_to, time.max))
    if follow_up_status:
        normalized_input = follow_up_status.strip().lower()
        if normalized_input == "none":
            base = base.where(
                or_(Inquiry.follow_up_status.is_(None), Inquiry.follow_up_status == "")
            )
        else:
            try:
                normalized_follow_up = normalize_follow_up_status(follow_up_status)
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=str(exc),
                ) from exc
            base = base.where(func.lower(Inquiry.follow_up_status) == normalized_follow_up)
    if advisor_user_id is not None:
        base = base.where(Inquiry.advisor_user_id == advisor_user_id)
    if has_duplicates is not None:
        base = (
            base.where(Inquiry.duplicate_of_inquiry_id.is_not(None))
            if has_duplicates
            else base.where(Inquiry.duplicate_of_inquiry_id.is_(None))
        )
    if query_text:
        like_pattern = f"%{query_text.strip()}%"
        base = base.where(
            or_(
                Inquiry.name.ilike(like_pattern),
                Inquiry.email.ilike(like_pattern),
                Inquiry.phone.ilike(like_pattern),
                Inquiry.message.ilike(like_pattern),
                Inquiry.source_page.ilike(like_pattern),
                Inquiry.intent.ilike(like_pattern),
                func.cast(Inquiry.id, String).ilike(like_pattern),
            )
        )
    if is_spam is not None:
        base = base.where(_spam_filter_clause(is_spam=is_spam))

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    sort_column = {
        "created_at": Inquiry.created_at,
        "score": Inquiry.score,
        "status": Inquiry.status,
    }[sort]
    order_clause = asc(sort_column) if order == "asc" else desc(sort_column)
    rows = db.scalars(
        base.order_by(order_clause, desc(Inquiry.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return PaginatedResponse(
        data=[_to_inquiry_item(i) for i in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.get("/inquiries/{inquiry_id}", response_model=InquiryItem)
def get_inquiry(
    inquiry_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> InquiryItem:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    return _to_inquiry_item(inquiry)


@router.patch("/inquiries/{inquiry_id}", response_model=InquiryItem)
def update_inquiry_status(
    inquiry_id: UUID,
    payload: InquiryStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> InquiryItem:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    before = inquiry.status
    allowed = _STATUS_TRANSITIONS.get(before, {before})
    if payload.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition: {before} -> {payload.status}",
        )

    inquiry.status = payload.status
    db.add(inquiry)

    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="inquiry",
        entity_id=str(inquiry.id),
        action="status_update",
        diff={"status": {"from": before, "to": payload.status}},
    )

    db.commit()
    db.refresh(inquiry)
    return _to_inquiry_item(inquiry)


@router.patch("/inquiries/{inquiry_id}/follow-up", response_model=InquiryItem)
def update_inquiry_follow_up(
    inquiry_id: UUID,
    payload: InquiryFollowUpUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> InquiryItem:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    if not payload.model_fields_set:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="At least one follow-up field is required",
        )

    diff: dict[str, dict[str, str | None]] = {}
    if "follow_up_status" in payload.model_fields_set:
        raw_status = str(payload.follow_up_status or "").strip()
        if not raw_status:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="follow_up_status cannot be empty",
            )
        try:
            status_value = normalize_follow_up_status(raw_status)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=str(exc),
            ) from exc
        diff["follow_up_status"] = {
            "from": str(inquiry.follow_up_status or "").strip() or None,
            "to": status_value,
        }
        inquiry.follow_up_status = status_value

    if "follow_up_due_at" in payload.model_fields_set:
        before_due = inquiry.follow_up_due_at.isoformat() if inquiry.follow_up_due_at else None
        after_due = payload.follow_up_due_at
        diff["follow_up_due_at"] = {
            "from": before_due,
            "to": after_due.isoformat() if after_due else None,
        }
        inquiry.follow_up_due_at = after_due

    if not diff:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="No follow-up changes provided",
        )

    db.add(inquiry)
    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="inquiry",
        entity_id=str(inquiry.id),
        action="follow_up_update",
        diff=diff,
    )
    db.commit()
    db.refresh(inquiry)
    return _to_inquiry_item(inquiry)


@router.get("/inquiries/{inquiry_id}/assignments")
def list_inquiry_assignments(
    inquiry_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[LeadAssignmentItem]:
    base = select(LeadAssignment).where(LeadAssignment.inquiry_id == inquiry_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(desc(LeadAssignment.created_at)).offset((page - 1) * limit).limit(limit)
    ).all()
    return PaginatedResponse(
        data=[LeadAssignmentItem.model_validate(r) for r in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.post("/inquiries/{inquiry_id}/assign", response_model=InquiryItem)
def assign_inquiry(
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
    return _to_inquiry_item(inquiry)


@router.get(
    "/inquiries/{inquiry_id}/timeline", response_model=PaginatedResponse[InquiryTimelineEvent]
)
def list_inquiry_timeline(
    inquiry_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[InquiryTimelineEvent]:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    base = select(AuditLog).where(
        AuditLog.entity_type == "inquiry",
        AuditLog.entity_id == str(inquiry_id),
    )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(desc(AuditLog.created_at)).offset((page - 1) * limit).limit(limit)
    ).all()
    events = [_build_timeline_event(log, inquiry_id) for log in rows]
    return PaginatedResponse(
        data=events,
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.post("/inquiries/{inquiry_id}/notes", response_model=InquiryTimelineEvent)
def append_inquiry_note(
    inquiry_id: UUID,
    payload: InquiryNoteCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> InquiryTimelineEvent:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    note_id = str(uuid4())
    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="inquiry",
        entity_id=str(inquiry.id),
        action="note_add",
        diff={"note_id": note_id, "note": payload.note.strip()},
    )
    db.commit()

    created = db.scalar(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "inquiry",
            AuditLog.entity_id == str(inquiry_id),
            AuditLog.action == "note_add",
        )
        .order_by(desc(AuditLog.created_at))
        .limit(1)
    )
    if created is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Note not saved"
        )
    return _build_timeline_event(created, inquiry_id)


@router.patch("/inquiries/{inquiry_id}/notes/{note_id}", response_model=InquiryTimelineEvent)
def update_inquiry_note(
    inquiry_id: UUID,
    note_id: str,
    payload: InquiryNoteUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> InquiryTimelineEvent:
    inquiry = db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    logs = db.scalars(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "inquiry",
            AuditLog.entity_id == str(inquiry_id),
            AuditLog.action.in_(["note_add", "note_update"]),
        )
        .order_by(desc(AuditLog.created_at))
    ).all()
    if not any(
        isinstance(log.diff, dict) and str(log.diff.get("note_id")) == note_id for log in logs
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="inquiry",
        entity_id=str(inquiry.id),
        action="note_update",
        diff={"note_id": note_id, "note": payload.note.strip()},
    )
    db.commit()

    updated = db.scalar(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "inquiry",
            AuditLog.entity_id == str(inquiry_id),
            AuditLog.action == "note_update",
        )
        .order_by(desc(AuditLog.created_at))
        .limit(1)
    )
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Note not updated"
        )
    return _build_timeline_event(updated, inquiry_id)


@router.get("/inquiries-export.csv")
def export_inquiries_csv(
    status_filter: str | None = Query(default=None, alias="status"),
    source_filter: str | None = Query(default=None, alias="source"),
    purpose_filter: str | None = Query(default=None, alias="purpose"),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    follow_up_status: str | None = Query(default=None),
    advisor_user_id: UUID | None = Query(default=None),
    query_text: str | None = Query(default=None, alias="q", min_length=1, max_length=200),
    has_duplicates: bool | None = Query(default=None),
    is_spam: bool | None = Query(default=None),
    sort: str = Query(default="created_at"),
    order: str = Query(default="desc"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Response:
    result = list_inquiries(
        page=1,
        limit=200,
        status_filter=status_filter,
        source_filter=source_filter,
        purpose_filter=purpose_filter,
        date_from=date_from,
        date_to=date_to,
        follow_up_status=follow_up_status,
        advisor_user_id=advisor_user_id,
        query_text=query_text,
        has_duplicates=has_duplicates,
        is_spam=is_spam,
        sort=sort,
        order=order,
        db=db,
        _admin=_admin,
    )

    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(
        [
            "id",
            "name",
            "email",
            "phone",
            "intent",
            "purpose",
            "status",
            "follow_up_status",
            "follow_up_due_at",
            "score",
            "advisor_user_id",
            "source_page",
            "duplicate_hint",
            "spam_hint",
            "created_at",
        ]
    )
    for row in result.data:
        writer.writerow(
            [
                str(row.id),
                row.name,
                row.email or "",
                row.phone or "",
                row.intent or "",
                row.purpose or "",
                row.status,
                row.follow_up_status or "",
                row.follow_up_due_at.isoformat() if row.follow_up_due_at else "",
                row.score if row.score is not None else 0,
                str(row.advisor_user_id) if row.advisor_user_id else "",
                row.source_page or "",
                "1" if row.is_duplicate_hint else "0",
                "1" if row.is_spam_hint else "0",
                row.created_at.isoformat(),
            ]
        )

    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="inquiries-export.csv"'},
    )


@router.get("/viewings", response_model=list[ViewingItem])
def list_viewings(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[ViewingItem]:
    viewings = db.scalars(select(Viewing).order_by(desc(Viewing.scheduled_at))).all()
    return [ViewingItem.model_validate(v) for v in viewings]


@router.patch("/viewings/{viewing_id}", response_model=ViewingItem)
def update_viewing(
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
