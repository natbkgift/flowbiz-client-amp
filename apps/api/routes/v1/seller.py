from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from packages.core.abuse import SlidingWindowRateLimiter
from packages.core.config import settings
from packages.core.database import get_db
from packages.core.models import SellerSubmission
from packages.core.schemas.seller import SellerSubmissionCreate, SellerSubmissionItem

router = APIRouter(prefix="/v1/sell", tags=["sell"])

_sell_rate_limiter: SlidingWindowRateLimiter | None = None
_sell_rate_limiter_limit: int | None = None


def _get_sell_rate_limiter() -> SlidingWindowRateLimiter:
    global _sell_rate_limiter
    global _sell_rate_limiter_limit

    limit = max(1, int(settings.inquiries_rate_limit_per_minute))
    if _sell_rate_limiter is None or _sell_rate_limiter_limit != limit:
        _sell_rate_limiter = SlidingWindowRateLimiter(limit=limit, window_seconds=60)
        _sell_rate_limiter_limit = limit
    return _sell_rate_limiter


@router.post(
    "/submit",
    response_model=SellerSubmissionItem,
    status_code=status.HTTP_201_CREATED,
)
async def submit(
    payload: SellerSubmissionCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> SellerSubmissionItem:
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = (forwarded_for.split(",")[0].strip() if forwarded_for else None) or (
        request.client.host if request.client else "unknown"
    )
    rl = _get_sell_rate_limiter().check(f"ip_sell:{client_ip}")
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

    if payload.website is not None and payload.website.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid submission")

    row = SellerSubmission(
        name=payload.name,
        email=str(payload.email) if payload.email is not None else None,
        phone=payload.phone.strip() if payload.phone else None,
        property_type=payload.property_type,
        location=payload.location,
        asking_price=payload.asking_price,
        notes=payload.notes,
        status="pending",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return SellerSubmissionItem.model_validate(row)
