from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class MeResponse(BaseModel):
    email: EmailStr
    roles: list[str]


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20)
