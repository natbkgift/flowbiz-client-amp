from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from packages.core.models import AuditLog


def write_audit_log(
    db: Session,
    *,
    actor_user_id: UUID | None,
    entity_type: str,
    entity_id: str,
    action: str,
    diff: dict | None = None,
    user_agent: str | None = None,
    created_at: datetime | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor_user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            diff=diff,
            user_agent=user_agent,
            created_at=created_at,  # may be None; DB default applies
        )
    )
