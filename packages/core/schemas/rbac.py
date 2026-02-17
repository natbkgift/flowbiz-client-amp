from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RoleItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=64)


class PermissionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    key: str
    description: str | None = None
    created_at: datetime


class PermissionCreate(BaseModel):
    key: str = Field(min_length=3, max_length=128)
    description: str | None = Field(default=None, max_length=500)


class RolePermissionUpdate(BaseModel):
    permission_keys: list[str]
