from __future__ import annotations

import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from packages.core.abuse import SlidingWindowRateLimiter
from packages.core.audit import write_audit_log
from packages.core.config import settings
from packages.core.crm_scoring import score_inquiry
from packages.core.database import get_db
from packages.core.models import Inquiry, LeadAssignment, Property, Role, User, UserRole, Viewing
from packages.core.pii import normalize_email, normalize_phone, sha256_hex
from packages.core.schemas.crm import InquiryCreate, InquiryItem, ViewingCreate, ViewingItem

logger = logging.getLogger(__name__)

_inquiry_rate_limiter: SlidingWindowRateLimiter | None = None
_inquiry_rate_limiter_limit: int | None = None


def _get_inquiry_rate_limiter() -> SlidingWindowRateLimiter:
    global _inquiry_rate_limiter
    global _inquiry_rate_limiter_limit

    limit = max(1, int(settings.inquiries_rate_limit_per_minute))
    if _inquiry_rate_limiter is None or _inquiry_rate_limiter_limit != limit:
        _inquiry_rate_limiter = SlidingWindowRateLimiter(limit=limit, window_seconds=60)
        _inquiry_rate_limiter_limit = limit
    return _inquiry_rate_limiter


router = APIRouter(prefix="/v1", tags=["crm"])


def _choose_round_robin_advisor(db: Session) -> User | None:
    advisor_ids: set[UUID] = set(db.scalars(select(User.id).where(User.role == "advisor")).all())

    rbac_ids: list[UUID] = db.scalars(
        select(UserRole.user_id)
        .join(Role, Role.id == UserRole.role_id)
        .where(Role.name == "advisor")
    ).all()
    advisor_ids.update(rbac_ids)

    if not advisor_ids:
        return None

    last_by_user: dict[UUID, datetime] = {}
    rows = db.execute(
        select(
            LeadAssignment.assigned_user_id,
            func.max(LeadAssignment.created_at),
        )
        .where(LeadAssignment.assigned_user_id.is_not(None))
        .group_by(LeadAssignment.assigned_user_id)
    ).all()
    for assigned_user_id, last_at in rows:
        if assigned_user_id is None or last_at is None:
            continue
        last_by_user[assigned_user_id] = last_at

    # Least-recently-assigned wins; users with no history get priority.
    min_dt = datetime.min.replace(tzinfo=UTC)
    chosen_id = sorted(advisor_ids, key=lambda uid: (last_by_user.get(uid, min_dt), str(uid)))[0]
    return db.get(User, chosen_id)


@router.post("/inquiries", response_model=InquiryItem, status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    payload: InquiryCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> InquiryItem:
    # Lightweight abuse mitigation (best-effort, in-memory).
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = (forwarded_for.split(",")[0].strip() if forwarded_for else None) or (
        request.client.host if request.client else "unknown"
    )
    rl = _get_inquiry_rate_limiter().check(f"ip:{client_ip}")
    response.headers["X-RateLimit-Remaining"] = str(rl.remaining)
    if not rl.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests",
            headers={
                "Retry-After": str(rl.retry_after_seconds),
                "X-RateLimit-Remaining": str(rl.remaining),
            },
        )

    # Honeypot: bots often fill hidden fields.
    if payload.website is not None and payload.website.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid submission")

    if payload.property_id is not None:
        prop = db.get(Property, payload.property_id)
        if prop is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    email_value = str(payload.email) if payload.email is not None else None
    phone_value = payload.phone.strip() if payload.phone else None

    email_hash = (
        sha256_hex(normalize_email(email_value), pepper=settings.pii_hash_pepper)
        if email_value
        else None
    )
    phone_hash = (
        sha256_hex(normalize_phone(phone_value), pepper=settings.pii_hash_pepper)
        if phone_value
        else None
    )

    duplicate_of: Inquiry | None = None
    dup_filters = []
    if email_hash:
        dup_filters.append(Inquiry.email_hash == email_hash)
    if phone_hash:
        dup_filters.append(Inquiry.phone_hash == phone_hash)
    if dup_filters:
        duplicate_of = db.scalar(
            select(Inquiry).where(or_(*dup_filters)).order_by(Inquiry.created_at.desc())
        )

    inquiry = Inquiry(
        property_id=payload.property_id,
        name=payload.name,
        email=email_value,
        phone=phone_value,
        message=payload.message,
        source_page=payload.source_page,
        email_hash=email_hash,
        phone_hash=phone_hash,
        utm_source=payload.utm_source,
        utm_medium=payload.utm_medium,
        utm_campaign=payload.utm_campaign,
        utm_content=payload.utm_content,
        referrer=payload.referrer,
        device=payload.device,
        first_touch_timestamp=payload.first_touch_timestamp,
        submit_timestamp=payload.submit_timestamp,
        persona=payload.persona,
        budget_band=payload.budget_band,
        timeline=payload.timeline,
        score=score_inquiry(
            persona=payload.persona,
            budget_band=payload.budget_band,
            timeline=payload.timeline,
        ),
        status="lost" if duplicate_of is not None else "new",
        duplicate_of_inquiry_id=duplicate_of.id if duplicate_of is not None else None,
    )
    db.add(inquiry)
    db.flush()  # allocate inquiry.id before audit log

    write_audit_log(
        db,
        actor_user_id=None,
        entity_type="inquiry",
        entity_id=str(inquiry.id),
        action="create",
        diff={
            "status": inquiry.status,
            "property_id": str(inquiry.property_id) if inquiry.property_id else None,
            "duplicate_of": str(duplicate_of.id) if duplicate_of is not None else None,
        },
        user_agent=request.headers.get("user-agent"),
    )

    if inquiry.status != "lost" and bool(settings.crm_auto_assign_enabled):
        advisor = _choose_round_robin_advisor(db)
        if advisor is not None:
            inquiry.advisor_user_id = advisor.id
            db.add(
                LeadAssignment(
                    inquiry_id=inquiry.id,
                    assigned_user_id=advisor.id,
                    assigned_by_user_id=None,
                    reason="auto_round_robin",
                )
            )
            write_audit_log(
                db,
                actor_user_id=None,
                entity_type="inquiry",
                entity_id=str(inquiry.id),
                action="assign",
                diff={"assigned_user_id": str(advisor.id), "reason": "auto_round_robin"},
                user_agent=request.headers.get("user-agent"),
            )

    db.commit()
    db.refresh(inquiry)

    logger.info(
        "inquiry_created",
        extra={
            "inquiry_id": str(inquiry.id),
            "property_id": str(inquiry.property_id) if inquiry.property_id else None,
            "client_ip": client_ip,
            "has_email": bool(inquiry.email),
            "has_phone": bool(inquiry.phone),
        },
    )
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
