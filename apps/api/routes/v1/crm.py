from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from packages.core.abuse import SlidingWindowRateLimiter
from packages.core.config import settings
from packages.core.database import get_db
from packages.core.models import Inquiry, Property, Viewing
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
