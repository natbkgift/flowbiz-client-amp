from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LeadAssignmentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    inquiry_id: UUID
    assigned_user_id: UUID | None
    assigned_by_user_id: UUID | None
    reason: str | None = None
    created_at: datetime


class LeadAssignRequest(BaseModel):
    assigned_user_id: UUID | None = None
    reason: str | None = Field(default=None, max_length=200)


class InquiryNoteCreate(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


class InquiryNoteUpdate(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


class InquiryTimelineEvent(BaseModel):
    id: UUID
    inquiry_id: UUID
    action: str
    actor_user_id: UUID | None = None
    note_id: str | None = None
    note: str | None = None
    diff: dict | None = None
    created_at: datetime
