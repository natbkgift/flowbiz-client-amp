from __future__ import annotations

import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from apps.api.routes.v1 import properties as property_routes
from packages.core.database import get_db
from packages.core.models import Area, Project, Property, Shortlist, ShortlistItem
from packages.core.schemas.property_api import (
    SharedShortlistDetail,
    SharedShortlistResponse,
    ShortlistDetail,
    ShortlistItemSaveRequest,
    ShortlistMutationResponse,
    ShortlistPropertyItem,
    ShortlistResponse,
    ShortlistShareRequest,
    ShortlistShareResponse,
)

router = APIRouter(prefix="/v1", tags=["shortlists"])


def _load_current_shortlist(db: Session, owner_type: str, owner_key: str) -> Shortlist | None:
    return db.scalar(
        select(Shortlist)
        .where(
            Shortlist.owner_type == owner_type,
            Shortlist.owner_key == owner_key,
            Shortlist.status == "active",
        )
        .order_by(desc(Shortlist.updated_at), desc(Shortlist.created_at), desc(Shortlist.id))
        .limit(1)
    )


def _load_shortlist_items(db: Session, shortlist_id: UUID) -> list[ShortlistItem]:
    return db.scalars(
        select(ShortlistItem)
        .where(ShortlistItem.shortlist_id == shortlist_id)
        .order_by(
            asc(ShortlistItem.position),
            asc(ShortlistItem.added_at),
            asc(ShortlistItem.id),
        )
    ).all()


def _serialize_shortlist_detail(
    db: Session,
    shortlist: Shortlist,
    *,
    locale: str,
) -> ShortlistDetail:
    shortlist_items = _load_shortlist_items(db, shortlist.id)
    property_ids = [item.property_id for item in shortlist_items]
    properties = (
        db.scalars(select(Property).where(Property.id.in_(property_ids))).all()
        if property_ids
        else []
    )
    properties_by_id = {property_row.id: property_row for property_row in properties}

    project_ids = {
        property_row.project_id
        for property_row in properties
        if property_row.project_id is not None
    }
    area_ids = {
        property_row.area_id for property_row in properties if property_row.area_id is not None
    }
    project_names = (
        dict(db.execute(select(Project.id, Project.name).where(Project.id.in_(project_ids))).all())
        if project_ids
        else {}
    )
    area_names = (
        dict(db.execute(select(Area.id, Area.name).where(Area.id.in_(area_ids))).all())
        if area_ids
        else {}
    )

    items: list[ShortlistPropertyItem] = []
    for shortlist_item in shortlist_items:
        property_row = properties_by_id.get(shortlist_item.property_id)
        if property_row is None:
            continue

        title_i18n = property_routes._normalize_i18n_map(getattr(property_row, "title_i18n", None))
        title = (
            property_routes._resolve_text_for_locale(
                title_i18n,
                getattr(property_row, "title", None),
                locale,
            )
            or property_row.title
        )
        stored_local = property_routes._coerce_image_list(
            getattr(property_row, "local_images", None)
        )
        stored_images = property_routes._coerce_image_list(getattr(property_row, "images", None))
        disk_images = property_routes._list_local_images(property_row.id)
        merged_images = property_routes._merge_images(stored_local, stored_images, disk_images)
        image = property_routes._resolve_canonical_cover(
            cover_image_url=getattr(property_row, "cover_image_url", None),
            cover_image=getattr(property_row, "cover_image", None),
            merged=merged_images,
        )

        items.append(
            ShortlistPropertyItem(
                property_id=property_row.id,
                slug=property_row.slug,
                title=title,
                project=project_names.get(property_row.project_id),
                location=area_names.get(property_row.area_id) or property_row.city,
                price=property_row.price,
                size=property_row.size_sqm or property_row.size,
                bedrooms=property_row.bedrooms,
                bathrooms=property_row.bathrooms,
                image=image,
                status=property_row.status,
                foreign_quota=property_routes._has_foreign_quota_indicator(
                    getattr(property_row, "features", None),
                    getattr(property_row, "ownership_notes", None),
                ),
                position=shortlist_item.position,
                added_at=shortlist_item.added_at,
                source_surface=shortlist_item.source_surface,
            )
        )

    return ShortlistDetail(
        id=shortlist.id,
        owner_type=shortlist.owner_type,
        owner_key=shortlist.owner_key,
        status=shortlist.status,
        title=shortlist.title,
        intent=shortlist.intent,
        share_mode=shortlist.share_mode,
        source_context=shortlist.source_context,
        created_at=shortlist.created_at,
        updated_at=shortlist.updated_at,
        last_viewed_at=shortlist.last_viewed_at,
        item_count=len(items),
        items=items,
    )


def _touch_shortlist(shortlist: Shortlist) -> None:
    shortlist.updated_at = datetime.now(timezone.utc)


def _apply_shortlist_metadata(
    shortlist: Shortlist,
    *,
    intent: str | None,
    title: str | None,
    source_context: dict | None,
) -> None:
    if intent is not None:
        shortlist.intent = intent.strip() or None
    if title is not None:
        shortlist.title = title.strip() or None
    if source_context is not None:
        shortlist.source_context = source_context


def _normalize_owner_key(owner_key: str) -> str:
    normalized = owner_key.strip()
    if normalized:
        return normalized
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="owner_key must not be blank",
    )


def _reindex_shortlist_items(items: list[ShortlistItem]) -> None:
    for index, shortlist_item in enumerate(items):
        shortlist_item.position = index


def _serialize_shared_shortlist_detail(
    db: Session,
    shortlist: Shortlist,
    *,
    locale: str,
) -> SharedShortlistDetail:
    detail = _serialize_shortlist_detail(db, shortlist, locale=locale)
    return SharedShortlistDetail(
        id=detail.id,
        title=detail.title,
        intent=detail.intent,
        share_mode=shortlist.share_mode,
        created_at=detail.created_at,
        updated_at=detail.updated_at,
        item_count=detail.item_count,
        items=detail.items,
    )


def _generate_share_token(db: Session) -> str:
    for _ in range(10):
        candidate = secrets.token_urlsafe(18)
        existing = db.scalar(
            select(Shortlist.id).where(Shortlist.share_token_ref == candidate).limit(1)
        )
        if existing is None:
            return candidate
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unable to generate shortlist share token",
    )


@router.get("/shortlists/current", response_model=ShortlistResponse)
def get_current_shortlist(
    owner_type: str = Query(pattern=r"^(session|user)$"),
    owner_key: str = Query(min_length=1, max_length=128),
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> ShortlistResponse:
    normalized_owner_key = _normalize_owner_key(owner_key)
    shortlist = _load_current_shortlist(db, owner_type=owner_type, owner_key=normalized_owner_key)
    if shortlist is None:
        return ShortlistResponse(shortlist=None)

    return ShortlistResponse(shortlist=_serialize_shortlist_detail(db, shortlist, locale=locale))


@router.post("/shortlists/current/items", response_model=ShortlistMutationResponse)
def save_shortlist_item(
    payload: ShortlistItemSaveRequest,
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> ShortlistMutationResponse:
    normalized_owner_key = _normalize_owner_key(payload.owner_key)
    property_row = db.get(Property, payload.property_id)
    if property_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    shortlist = _load_current_shortlist(
        db,
        owner_type=payload.owner_type,
        owner_key=normalized_owner_key,
    )
    if shortlist is None:
        shortlist = Shortlist(
            owner_type=payload.owner_type,
            owner_key=normalized_owner_key,
            status="active",
        )
        db.add(shortlist)
        db.flush()

    _apply_shortlist_metadata(
        shortlist,
        intent=payload.intent,
        title=payload.title,
        source_context=payload.source_context,
    )

    existing_item = db.scalar(
        select(ShortlistItem)
        .where(
            ShortlistItem.shortlist_id == shortlist.id,
            ShortlistItem.property_id == payload.property_id,
        )
        .limit(1)
    )
    if existing_item is None:
        current_max_position = db.scalar(
            select(func.max(ShortlistItem.position)).where(
                ShortlistItem.shortlist_id == shortlist.id
            )
        )
        db.add(
            ShortlistItem(
                shortlist_id=shortlist.id,
                property_id=payload.property_id,
                position=(current_max_position or -1) + 1,
                source_surface=payload.source_surface,
            )
        )
        action = "saved"
    else:
        if payload.source_surface is not None:
            existing_item.source_surface = payload.source_surface
        action = "already_saved"

    _touch_shortlist(shortlist)
    db.commit()
    db.refresh(shortlist)

    return ShortlistMutationResponse(
        action=action,
        shortlist=_serialize_shortlist_detail(db, shortlist, locale=locale),
    )


@router.delete(
    "/shortlists/current/items/{property_id}",
    response_model=ShortlistMutationResponse,
)
def remove_shortlist_item(
    property_id: UUID,
    owner_type: str = Query(pattern=r"^(session|user)$"),
    owner_key: str = Query(min_length=1, max_length=128),
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> ShortlistMutationResponse:
    normalized_owner_key = _normalize_owner_key(owner_key)
    shortlist = _load_current_shortlist(db, owner_type=owner_type, owner_key=normalized_owner_key)
    if shortlist is None:
        return ShortlistMutationResponse(action="not_found", shortlist=None)

    shortlist_item = db.scalar(
        select(ShortlistItem)
        .where(
            ShortlistItem.shortlist_id == shortlist.id,
            ShortlistItem.property_id == property_id,
        )
        .limit(1)
    )
    if shortlist_item is None:
        return ShortlistMutationResponse(
            action="not_found",
            shortlist=_serialize_shortlist_detail(db, shortlist, locale=locale),
        )

    db.delete(shortlist_item)
    db.flush()

    remaining_items = _load_shortlist_items(db, shortlist.id)
    _reindex_shortlist_items(remaining_items)
    _touch_shortlist(shortlist)
    db.commit()
    db.refresh(shortlist)

    return ShortlistMutationResponse(
        action="removed",
        shortlist=_serialize_shortlist_detail(db, shortlist, locale=locale),
    )


@router.post("/shortlists/current/share", response_model=ShortlistShareResponse)
def share_current_shortlist(
    payload: ShortlistShareRequest,
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> ShortlistShareResponse:
    normalized_owner_key = _normalize_owner_key(payload.owner_key)
    shortlist = _load_current_shortlist(
        db,
        owner_type=payload.owner_type,
        owner_key=normalized_owner_key,
    )
    if shortlist is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shortlist not found")

    shortlist_items = _load_shortlist_items(db, shortlist.id)
    if not shortlist_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shortlist is empty")

    if shortlist.share_token_ref is None:
        shortlist.share_token_ref = _generate_share_token(db)
        action = "shared"
    else:
        action = "already_shared"

    shortlist.share_mode = payload.share_mode
    _touch_shortlist(shortlist)
    db.commit()
    db.refresh(shortlist)

    share_token = str(shortlist.share_token_ref)
    return ShortlistShareResponse(
        action=action,
        share_token=share_token,
        share_mode=str(shortlist.share_mode or payload.share_mode),
        share_url=f"/v1/shortlists/shared/{share_token}",
        shortlist=_serialize_shared_shortlist_detail(db, shortlist, locale=locale),
    )


@router.get("/shortlists/shared/{share_token}", response_model=SharedShortlistResponse)
def get_shared_shortlist(
    share_token: str,
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> SharedShortlistResponse:
    shortlist = db.scalar(
        select(Shortlist)
        .where(
            Shortlist.share_token_ref == share_token,
            Shortlist.share_mode == "public_read",
            Shortlist.status == "active",
        )
        .limit(1)
    )
    if shortlist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared shortlist not found",
        )

    return SharedShortlistResponse(
        shortlist=_serialize_shared_shortlist_detail(db, shortlist, locale=locale)
    )
