from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import AnalyticsEvent
from packages.core.schemas.analytics import AnalyticsEventCreate, AnalyticsEventResponse

router = APIRouter(prefix="/v1", tags=["analytics"])


@router.post(
    "/analytics/events",
    response_model=AnalyticsEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    payload: AnalyticsEventCreate,
    db: Session = Depends(get_db),
) -> AnalyticsEvent:
    event = AnalyticsEvent(event_type=payload.event_type, payload=payload.payload)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
