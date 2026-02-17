from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

InquiryStatus = Literal["new", "contacted", "qualified", "closed", "lost"]

InquiryPersona = Literal[
    "investor",
    "expat",
    "lifestyle_buyer",
    "developer",
    "seller",
    "co_agent",
]

InquiryBudgetBand = Literal[
    "lt_2m",
    "2m_5m",
    "5m_10m",
    "10m_20m",
    "gt_20m",
]

InquiryTimeline = Literal[
    "immediate",
    "1_3mo",
    "3_6mo",
    "6_12mo",
    "gt_12mo",
]


class InquiryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    property_id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    message: str = Field(min_length=1, max_length=2000)
    source_page: str | None = Field(default=None, max_length=500)
    # Honeypot field: real users should never fill this.
    website: str | None = Field(default=None, max_length=200)

    utm_source: str | None = Field(default=None, max_length=200)
    utm_medium: str | None = Field(default=None, max_length=200)
    utm_campaign: str | None = Field(default=None, max_length=200)
    utm_content: str | None = Field(default=None, max_length=200)
    referrer: str | None = Field(default=None, max_length=500)
    device: str | None = Field(default=None, max_length=80)
    first_touch_timestamp: datetime | None = None
    submit_timestamp: datetime | None = None

    # Optional structured CRM fields (V3)
    persona: InquiryPersona | None = None
    budget_band: InquiryBudgetBand | None = None
    timeline: InquiryTimeline | None = None

    @model_validator(mode="after")
    def _require_contact(self) -> "InquiryCreate":
        if self.email is None and (self.phone is None or not self.phone.strip()):
            raise ValueError("Either email or phone is required")
        return self


class InquiryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    property_id: UUID | None
    advisor_user_id: UUID | None = None
    duplicate_of_inquiry_id: UUID | None = None
    name: str
    email: str | None
    phone: str | None
    message: str
    source_page: str | None
    score: int | None = None
    status: str
    persona: str | None = None
    budget_band: str | None = None
    timeline: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class InquiryStatusUpdate(BaseModel):
    status: InquiryStatus


class ViewingCreate(BaseModel):
    inquiry_id: UUID
    scheduled_at: datetime
    notes: str | None = Field(default=None, max_length=500)


class ViewingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    inquiry_id: UUID
    scheduled_at: datetime
    status: str
    notes: str | None
    created_at: datetime


class ViewingUpdate(BaseModel):
    scheduled_at: datetime | None = None
    status: str | None = Field(default=None, max_length=32)
    notes: str | None = Field(default=None, max_length=500)
