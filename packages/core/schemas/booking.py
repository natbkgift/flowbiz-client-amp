from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class BookingCreateRequest(BaseModel):
    property_id: UUID | None = None
    inquiry_id: UUID | None = None
    start_at: datetime
    end_at: datetime
    guests: int | None = Field(default=None, ge=1, le=20)
    notes: str | None = Field(default=None, max_length=500)


class BookingItem(BaseModel):
    id: UUID
    property_id: UUID | None = None
    inquiry_id: UUID | None = None
    idempotency_key: str | None = None
    start_at: datetime
    end_at: datetime
    guests: int | None = None
    notes: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class AvailabilityResponse(BaseModel):
    property_id: UUID
    start_at: datetime
    end_at: datetime
    available: bool
    conflicts: int
