from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LeadAssignRequest(BaseModel):
    assigned_user_id: UUID
    reason: str | None = None


class LeadAssignmentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    inquiry_id: UUID
    assigned_user_id: UUID | None = None
    assigned_by_user_id: UUID | None = None
    reason: str | None = None
    created_at: datetime


class InquiryTimelineEvent(BaseModel):
    id: UUID
    inquiry_id: UUID
    action: str
    actor_user_id: UUID | None = None
    note_id: str | None = None
    note: str | None = None
    diff: dict | None = None
    created_at: datetime


class InquiryNoteCreate(BaseModel):
    note: str


class InquiryNoteUpdate(BaseModel):
    note: str
