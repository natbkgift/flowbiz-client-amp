from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MediaAssetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    storage_path: str
    kind: str
    mime_type: str
    file_size_bytes: int
    title: str | None = None
    source_domain: str | None = None
    rights_status: str | None = None
    approval_status: str | None = None
    is_exception: bool = False
    status: str
    created_at: datetime
    updated_at: datetime

