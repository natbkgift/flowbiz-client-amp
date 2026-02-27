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
