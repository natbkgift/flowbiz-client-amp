from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

EventType = Literal[
    "page_view",
    "path_entry_click",
    "cta_click",
    "featured_click",
    "form_start",
    "form_submit",
    "form_error",
    "form_success",
    "experiment_exposure",
    "experiment_outcome",
    "segment_entry_click",
    "scroll_depth",
    "smart_finder_step_progress",
    "smart_finder_submit",
    "smart_finder_result_cta_click",
    "compare_item_added",
    "compare_item_removed",
    "compare_cta_click",
]


class AnalyticsEventCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_type: EventType
    page: str | None = Field(default=None, max_length=500)
    payload: dict | None = None
    session_id: str | None = Field(default=None, max_length=64)
    user_agent: str | None = Field(default=None, max_length=300)


class EventCreateV2(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_type: EventType
    page: str = Field(min_length=1, max_length=500)
    session_id: str = Field(min_length=8, max_length=64)
    payload: dict | None = None


class AnalyticsEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_type: str
    page: str | None = None
    session_id: str | None = None
    user_agent: str | None = None
    payload: dict | None
    created_at: datetime
