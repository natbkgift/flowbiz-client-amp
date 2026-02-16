from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AnalyticsEventCreate(BaseModel):
    event_type: str = Field(min_length=1, max_length=64)
    payload: dict | None = None


class AnalyticsEventResponse(BaseModel):
    id: UUID
    event_type: str
    payload: dict | None
    created_at: datetime
