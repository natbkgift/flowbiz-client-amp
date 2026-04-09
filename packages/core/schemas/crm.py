from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SalesAutomationFollowUpStepItem(BaseModel):
    stage: str
    label: str
    message: str
    due_at: datetime | None = None


class SalesAutomationItem(BaseModel):
    locale: str
    intent: str
    source: str | None = None
    buyer_fit: str | None = None
    signal_level: str | None = None
    projects: list[str] = Field(default_factory=list)
    primary_project: str | None = None
    response_channel: str
    response_sla_seconds: int
    auto_response_message: str
    confirmation_title: str
    confirmation_body: str
    recommended_approach: str
    suggested_first_reply: str
    priority_label: str
    priority_score: int
    route_hint: str
    next_follow_up_at: datetime | None = None
    follow_up_status: str
    follow_up_stage: str
    follow_up_plan: list[SalesAutomationFollowUpStepItem] = Field(default_factory=list)
    stop_conditions: list[str] = Field(default_factory=list)


class InquiryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    property_id: UUID | None = None
    project_id: UUID | None = None
    area_id: UUID | None = None
    advisor_user_id: UUID | None = None
    duplicate_of_inquiry_id: UUID | None = None
    name: str
    email: str | None = None
    phone: str | None = None
    message: str
    nationality: str | None = None
    source_page: str | None = None
    session_id: str | None = None
    last_action: str | None = None
    last_event_id: str | None = None
    referrer: str | None = None
    device: str | None = None
    intent: str | None = None
    purpose: str | None = None
    score: int = 0
    status: str
    persona: str | None = None
    budget_band: str | None = None
    budget_range: str | None = None
    timeline: str | None = None
    follow_up_status: str | None = None
    follow_up_due_at: datetime | None = None
    tags: list[str] | None = None
    whatsapp_url: str | None = None
    phone_url: str | None = None
    email_url: str | None = None
    is_duplicate_hint: bool = False
    is_spam_hint: bool = False
    sales_automation: SalesAutomationItem | None = None
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
