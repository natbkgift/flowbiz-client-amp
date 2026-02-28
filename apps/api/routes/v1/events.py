from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/api/v1", tags=["events"])


class EventIngestRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    event: str = Field(min_length=1)
    locale: str | None = None
    path: str | None = None


@router.post("/events", status_code=status.HTTP_202_ACCEPTED)
def ingest_event(payload: EventIngestRequest) -> dict[str, Any]:
    body = payload.model_dump(mode="json")
    return {
        "ok": True,
        "endpoint": "/api/v1/events",
        "event": body.get("event"),
        "locale": body.get("locale"),
        "path": body.get("path"),
        "received_at": datetime.now(UTC).isoformat(),
    }
