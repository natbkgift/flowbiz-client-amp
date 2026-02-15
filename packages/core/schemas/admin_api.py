from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LeadAdminItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str | None
    phone: str | None
    score: int
    status: str
    created_at: datetime


class LeadStatusUpdate(BaseModel):
    status: str
