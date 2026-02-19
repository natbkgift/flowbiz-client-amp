from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Property
from packages.core.schemas.compare import CompareRequest

router = APIRouter(prefix="/v1", tags=["compare"])


def _sorted_unique(ids: list[UUID]) -> list[UUID]:
    # Deterministic ordering: sort by UUID string.
    return sorted(set(ids), key=lambda x: str(x))


@router.post("/compare")
def compare_properties(
    payload: CompareRequest,
    db: Session = Depends(get_db),
) -> dict:
    ordered = _sorted_unique(payload.property_ids)
    if len(ordered) > 4:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Max 4 properties",
        )

    props = db.scalars(select(Property).where(Property.id.in_(ordered))).all()
    by_id = {p.id: p for p in props}

    missing = [pid for pid in ordered if pid not in by_id]
    if missing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    # No N+1: one DB query above; response is deterministic based on ordered list.
    items = []
    for pid in ordered:
        p = by_id[pid]
        items.append(
            {
                "id": str(p.id),
                "source_id": p.source_id,
                "title": p.title,
                "type": p.type,
                "price": str(p.price),
                "address": p.address,
                "city": p.city,
                "slug": p.slug,
                "status": p.status,
            }
        )

    return {"ordered_property_ids": [str(x) for x in ordered], "items": items}
