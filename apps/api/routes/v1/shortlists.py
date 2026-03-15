from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import asc, desc, select
from sqlalchemy.orm import Session

from apps.api.routes.v1 import properties as property_routes
from packages.core.database import get_db
from packages.core.models import Area, Project, Property, Shortlist, ShortlistItem
from packages.core.schemas.property_api import (
    ShortlistDetail,
    ShortlistPropertyItem,
    ShortlistResponse,
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


@router.get("/shortlists/current", response_model=ShortlistResponse)
def get_current_shortlist(
    owner_type: str = Query(pattern=r"^(session|user)$"),
    owner_key: str = Query(min_length=1, max_length=128),
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
    db: Session = Depends(get_db),
) -> ShortlistResponse:
    normalized_owner_key = owner_key.strip()
    shortlist = _load_current_shortlist(db, owner_type=owner_type, owner_key=normalized_owner_key)
    if shortlist is None:
        return ShortlistResponse(shortlist=None)

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

    return ShortlistResponse(
        shortlist=ShortlistDetail(
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
    )
