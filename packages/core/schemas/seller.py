from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SellerSubmissionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)

    property_type: str | None = Field(default=None, max_length=32)
    location: str | None = Field(default=None, max_length=200)
    asking_price: Decimal | None = None
    notes: str | None = Field(default=None, max_length=2000)

    # Honeypot field: bots often fill hidden inputs.
    website: str | None = Field(default=None, max_length=200)


class SellerSubmissionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str | None
    phone: str | None
    property_type: str | None
    location: str | None
    asking_price: Decimal | None
    notes: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class SellerStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=32)
