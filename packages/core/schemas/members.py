from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class MemberMeResponse(BaseModel):
    member_type: str
    created_at: datetime
    updated_at: datetime
