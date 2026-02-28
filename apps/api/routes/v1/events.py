from __future__ import annotations

import hashlib
import json
import logging
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import AnalyticsEvent

router = APIRouter(prefix="/api/v1", tags=["events"])
logger = logging.getLogger("flowbiz.events")

_RESERVED_EVENT_FIELDS = {
    "event",
    "event_name",
    "schema_version",
    "event_id",
    "occurred_at",
    "locale",
    "path",
    "source",
    "actor",
    "context",
    "payload",
}

_EVENT_TAXONOMY_REQUIRED: dict[str, list[str]] = {
    "area_card_click": ["source.locale", "source.page", "payload.placement", "payload.area_slug"],
    "area_cta_click": ["source.locale", "source.page", "payload.placement", "payload.cta_id", "payload.area_slug"],
}


class EventIngestRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    event: str | None = None
    event_name: str | None = None
    schema_version: str | None = None
    event_id: str | None = None
    occurred_at: str | None = None
    locale: str | None = None
    path: str | None = None
    source: dict[str, Any] | None = None
    actor: dict[str, Any] | None = None
    context: dict[str, Any] | None = None
    payload: dict[str, Any] | None = None


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _normalize_event(payload: EventIngestRequest) -> dict[str, Any]:
    body = payload.model_dump(mode="json")
    event_name = str(body.get("event_name") or body.get("event") or "").strip()
    if not event_name:
        raise ValueError("event_name is required")
    source = body.get("source") if isinstance(body.get("source"), dict) else {}
    actor = body.get("actor") if isinstance(body.get("actor"), dict) else {}
    payload_body = body.get("payload") if isinstance(body.get("payload"), dict) else {}
    if not payload_body:
        payload_body = {
            key: value
            for key, value in body.items()
            if key not in _RESERVED_EVENT_FIELDS and value is not None
        }
    locale = str(body.get("locale") or source.get("locale") or "").strip() or None
    path = str(body.get("path") or source.get("page") or "").strip() or None
    event_id = str(body.get("event_id") or "").strip() or f"evt_{uuid4().hex}"
    anonymous_id = str(actor.get("anonymous_id") or "").strip()
    occurred_at = str(body.get("occurred_at") or "").strip() or datetime.now(UTC).isoformat()
    fingerprint = _sha256(json.dumps(payload_body, ensure_ascii=False, sort_keys=True))
    idempotency_key = _sha256(f"{event_name}|{anonymous_id}|{fingerprint}")
    return {
        "body": body,
        "event_name": event_name,
        "event_id": event_id,
        "schema_version": str(body.get("schema_version") or "1.0"),
        "locale": locale,
        "path": path,
        "occurred_at": occurred_at,
        "idempotency_key": idempotency_key,
        "payload": payload_body,
        "actor": actor,
    }


def _redacted_log_fields(normalized: dict[str, Any]) -> dict[str, Any]:
    payload = normalized.get("payload") or {}
    form = payload.get("form") if isinstance(payload.get("form"), dict) else {}
    email_hash = _sha256(str(form.get("email") or "").strip().lower()) if str(form.get("email") or "").strip() else None
    phone_hash = _sha256(str(form.get("whatsapp") or form.get("phone") or "").strip()) if str(form.get("whatsapp") or form.get("phone") or "").strip() else None
    return {
        "fields_present": payload.get("fields_present") if isinstance(payload.get("fields_present"), list) else [],
        "email_hash": email_hash,
        "phone_hash": phone_hash,
    }


def _dot_get(payload: dict[str, Any], key: str) -> Any:
    current: Any = payload
    for part in key.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _taxonomy_eval(normalized: dict[str, Any]) -> dict[str, Any]:
    event_name = str(normalized.get("event_name") or "").strip()
    required = _EVENT_TAXONOMY_REQUIRED.get(event_name) or []
    if not required:
        return {"event_name": event_name, "required": [], "missing": [], "valid": True}

    envelope = normalized.get("body") if isinstance(normalized.get("body"), dict) else {}
    missing: list[str] = []
    for key in required:
        value = _dot_get(envelope, key)
        if value is None:
            missing.append(key)
            continue
        if isinstance(value, str) and not value.strip():
            missing.append(key)
    return {
        "event_name": event_name,
        "required": required,
        "missing": missing,
        "valid": len(missing) == 0,
    }


@router.post("/events", status_code=status.HTTP_202_ACCEPTED)
def ingest_event(
    payload: EventIngestRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    normalized = _normalize_event(payload)
    taxonomy = _taxonomy_eval(normalized)
    logger.info(
        json.dumps(
            {
                "ts": datetime.now(UTC).isoformat(),
                "level": "INFO",
                "service": "api",
                "msg": "ingest_accepted",
                "event_id": normalized["event_id"],
                "event_name": normalized["event_name"],
                "idempotency_key": normalized["idempotency_key"],
                "taxonomy_valid": taxonomy["valid"],
                "taxonomy_missing": taxonomy["missing"],
                **_redacted_log_fields(normalized),
            },
            ensure_ascii=False,
        )
    )
    try:
        actor = normalized["actor"] if isinstance(normalized.get("actor"), dict) else {}
        source = normalized["body"].get("source") if isinstance(normalized["body"].get("source"), dict) else {}
        payload_body = normalized["payload"] if isinstance(normalized.get("payload"), dict) else {}
        row = AnalyticsEvent(
            event_type=normalized["event_name"],
            page=normalized.get("path"),
            session_id=str(actor.get("session_id") or "").strip() or None,
            user_agent=str(actor.get("user_agent") or request.headers.get("user-agent") or "").strip() or None,
            payload={
                "schema_version": normalized["schema_version"],
                "event_id": normalized["event_id"],
                "event_name": normalized["event_name"],
                "occurred_at": normalized["occurred_at"],
                "idempotency_key": normalized["idempotency_key"],
                "source": source,
                "actor": actor,
                "payload": payload_body,
                "taxonomy": taxonomy,
            },
        )
        db.add(row)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("event_persist_failed", extra={"event_name": normalized["event_name"]})

    return {
        "ok": True,
        "endpoint": "/api/v1/events",
        "event": normalized["event_name"],
        "event_name": normalized["event_name"],
        "event_id": normalized["event_id"],
        "schema_version": normalized["schema_version"],
        "idempotency_key": normalized["idempotency_key"],
        "locale": normalized["locale"],
        "path": normalized["path"],
        "occurred_at": normalized["occurred_at"],
        "received_at": datetime.now(UTC).isoformat(),
        "taxonomy_valid": taxonomy["valid"],
        "taxonomy_missing_fields": taxonomy["missing"],
    }
