from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import Select, asc, desc, func, or_, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.finder import FinderRankingVersion, canonical_query_hash, resolve_property_type
from packages.core.models import FinderIntent, Property
from packages.core.schemas.finder import FinderSearchRequest
from packages.core.schemas.property_api import (
    PaginationMeta,
    PropertyListItem,
    PropertyListResponse,
    PropertyStatus,
)

router = APIRouter(prefix="/v1", tags=["finder"])


@router.post("/finder/search", response_model=PropertyListResponse)
async def finder_search(
    payload: FinderSearchRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> PropertyListResponse:
    normalized_property_type = resolve_property_type(
        intent=payload.intent,
        property_type=payload.property_type,
    )

    normalized_query = {
        "page": payload.page,
        "limit": payload.limit,
        "intent": payload.intent.value if payload.intent else None,
        "property_type": normalized_property_type.value if normalized_property_type else None,
        "search": (payload.search or "").strip() or None,
        "sort": payload.sort,
        "ranking_version": FinderRankingVersion.V1.value,
    }
    query_hash = canonical_query_hash(normalized_query)

    response.headers["X-Finder-Ranking-Version"] = FinderRankingVersion.V1.value
    response.headers["X-Finder-Query-Hash"] = query_hash

    base_query: Select[tuple[Property]] = select(Property).where(
        Property.status == PropertyStatus.ACTIVE.value
    )
    if normalized_property_type is not None:
        base_query = base_query.where(Property.type == normalized_property_type)

    if normalized_query["search"]:
        pattern = f"%{normalized_query['search']}%"
        base_query = base_query.where(
            or_(
                Property.title.ilike(pattern),
                Property.city.ilike(pattern),
                Property.address.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0

    sort = payload.sort
    if sort == "price_asc":
        order_by = (asc(Property.price), desc(Property.id))
    elif sort == "price_desc":
        order_by = (desc(Property.price), desc(Property.id))
    elif sort == "oldest":
        order_by = (asc(Property.created_at), asc(Property.id))
    else:
        order_by = (desc(Property.created_at), desc(Property.id))

    rows = db.scalars(
        base_query.order_by(*order_by)
        .offset((payload.page - 1) * payload.limit)
        .limit(payload.limit)
    ).all()

    # Phase 2: intent log (table is additive). Fail closed only on DB errors.
    try:
        intent_row = FinderIntent(
            id=uuid4(),
            session_id=payload.session_id,
            intent=payload.intent.value if payload.intent else None,
            query_hash=query_hash,
            request={**normalized_query, "session_id": payload.session_id},
        )
        db.add(intent_row)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log finder intent",
        )

    return PropertyListResponse(
        data=[PropertyListItem.model_validate(r) for r in rows],
        meta=PaginationMeta(page=payload.page, limit=payload.limit, total=total),
    )
