from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from packages.core.abuse import SlidingWindowRateLimiter
from packages.core.config import settings
from packages.core.database import get_db
from packages.core.models import AnalyticsEvent
from packages.core.schemas.analytics import (
    AnalyticsEventCreate,
    AnalyticsEventResponse,
    EventCreateV2,
)

router = APIRouter(prefix="/v1", tags=["analytics"])

_events_rate_limiter: SlidingWindowRateLimiter | None = None
_events_rate_limiter_limit: int | None = None


def _get_events_rate_limiter() -> SlidingWindowRateLimiter:
    global _events_rate_limiter
    global _events_rate_limiter_limit

    limit = max(1, int(settings.events_rate_limit_per_minute))
    if _events_rate_limiter is None or _events_rate_limiter_limit != limit:
        _events_rate_limiter = SlidingWindowRateLimiter(limit=limit, window_seconds=60)
        _events_rate_limiter_limit = limit
    return _events_rate_limiter


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    return (forwarded_for.split(",")[0].strip() if forwarded_for else None) or (
        request.client.host if request.client else "unknown"
    )


def _enforce_payload_size(payload: dict | None) -> None:
    if payload is None:
        return
    try:
        size = len(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    if size > int(settings.events_max_payload_bytes):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload too large",
        )


@router.post(
    "/analytics/events",
    response_model=AnalyticsEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    payload: AnalyticsEventCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AnalyticsEvent:
    rl = _get_events_rate_limiter().check(f"ip:{_client_ip(request)}")
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

    _enforce_payload_size(payload.payload)

    event = AnalyticsEvent(
        event_type=payload.event_type,
        page=payload.page,
        session_id=payload.session_id,
        user_agent=(payload.user_agent or request.headers.get("user-agent")),
        payload=payload.payload,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.post(
    "/events",
    response_model=AnalyticsEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event_v2(
    payload: EventCreateV2,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AnalyticsEvent:
    rl = _get_events_rate_limiter().check(f"ip:{_client_ip(request)}")
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

    _enforce_payload_size(payload.payload)

    event = AnalyticsEvent(
        event_type=payload.event_type,
        page=payload.page,
        session_id=payload.session_id,
        user_agent=request.headers.get("user-agent"),
        payload=payload.payload,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
