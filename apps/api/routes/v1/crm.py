from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Inquiry, Viewing
from packages.core.schemas.crm import InquiryItem, ViewingItem

router = APIRouter(prefix="/v1", tags=["crm"])


class InquiryCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    message: str
    source_page: str | None = None
    intent: str = "general"


class ViewingCreate(BaseModel):
    inquiry_id: UUID
    scheduled_at: datetime
    notes: str | None = None


def _hash_text(value: str | None) -> str | None:
    text = str(value or "").strip().lower()
    if not text:
        return None
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _to_inquiry_item(inquiry: Inquiry, *, dedupe_hint: bool = False) -> InquiryItem:
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
        score=inquiry.score,
        status=inquiry.status,
        persona=inquiry.persona,
        budget_band=inquiry.budget_band,
        timeline=inquiry.timeline,
        is_duplicate_hint=dedupe_hint or inquiry.duplicate_of_inquiry_id is not None,
        is_spam_hint=False,
        created_at=inquiry.created_at,
        updated_at=inquiry.updated_at,
    )


@router.post("/inquiries", response_model=InquiryItem, status_code=status.HTTP_201_CREATED)
def create_inquiry(
    payload: InquiryCreate,
    response: Response,
    db: Session = Depends(get_db),
) -> InquiryItem:
    now = datetime.now(UTC)
    dedupe_since = now - timedelta(minutes=10)

    dedupe = db.scalar(
        select(Inquiry)
        .where(
            and_(
                Inquiry.name == payload.name,
                Inquiry.message == payload.message,
                Inquiry.email == payload.email,
                Inquiry.phone == payload.phone,
                Inquiry.source_page == payload.source_page,
                Inquiry.created_at >= dedupe_since,
            )
        )
        .order_by(Inquiry.created_at.desc())
        .limit(1)
    )
    if dedupe is not None:
        response.headers["X-Inquiry-Deduped"] = "true"
        return _to_inquiry_item(dedupe, dedupe_hint=True)

    inquiry = Inquiry(
        intent=payload.intent or "general",
        name=payload.name.strip(),
        email=(payload.email or "").strip() or None,
        phone=(payload.phone or "").strip() or None,
        message=payload.message.strip(),
        source_page=(payload.source_page or "").strip() or None,
        score=0,
        status="new",
        submit_timestamp=now,
        first_touch_timestamp=now,
        email_hash=_hash_text(payload.email),
        phone_hash=_hash_text(payload.phone),
        tags=[],
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    response.headers["X-Inquiry-Deduped"] = "false"
    return _to_inquiry_item(inquiry)


@router.post("/viewings", response_model=ViewingItem, status_code=status.HTTP_201_CREATED)
def create_viewing(payload: ViewingCreate, db: Session = Depends(get_db)) -> ViewingItem:
    inquiry = db.get(Inquiry, payload.inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    viewing = Viewing(
        inquiry_id=payload.inquiry_id,
        scheduled_at=payload.scheduled_at,
        notes=payload.notes,
        status="scheduled",
    )
    db.add(viewing)
    db.commit()
    db.refresh(viewing)
    return ViewingItem.model_validate(viewing)
