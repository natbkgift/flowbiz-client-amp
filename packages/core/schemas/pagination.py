"""Shared pagination response models for list endpoints."""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int = Field(..., ge=1, description="Current page number")
    limit: int = Field(..., ge=1, le=200, description="Items per page")
    total: int = Field(..., ge=0, description="Total matching items")


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]  # type: ignore[valid-type]
    meta: PaginationMeta
