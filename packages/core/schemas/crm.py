from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class InquiryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    property_id: UUID | None = None
    advisor_user_id: UUID | None = None
    duplicate_of_inquiry_id: UUID | None = None
    name: str
    email: str | None = None
    phone: str | None = None
    message: str
    source_page: str | None = None
    score: int = 0
    status: str
    persona: str | None = None
    budget_band: str | None = None
    timeline: str | None = None
    is_duplicate_hint: bool = False
    is_spam_hint: bool = False
    created_at: datetime
    updated_at: datetime


class InquiryStatusUpdate(BaseModel):
    status: str


class ViewingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    inquiry_id: UUID
    scheduled_at: datetime
    status: str
    notes: str | None = None
    created_at: datetime


class ViewingUpdate(BaseModel):
    scheduled_at: datetime | None = None
    status: str | None = None
    notes: str | None = None


class BookingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    property_id: UUID | None = None
    inquiry_id: UUID | None = None
    start_at: datetime
    end_at: datetime
    guests: int | None = None
    notes: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
