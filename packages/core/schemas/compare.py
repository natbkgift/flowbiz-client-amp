from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class CompareRequest(BaseModel):
    property_ids: list[UUID] = Field(min_length=1, max_length=4)


class CompareResponse(BaseModel):
    ordered_property_ids: list[UUID]
    items: list[dict]
