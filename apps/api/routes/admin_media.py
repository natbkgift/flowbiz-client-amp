from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import String, cast, desc, func, or_, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.media_integrity import run_scan
from packages.core.media_storage import MediaStorageService, parse_source_domain
from packages.core.models import MediaAsset, Property, User
from packages.core.schemas.media_library import (
    MediaAssetAssignPropertyRequest,
    MediaAssetAssignResponse,
    MediaAssetIngestRequest,
    MediaAssetItem,
    MediaAssetListResponse,
    MediaAssetUpdate,
    MediaAssetUploadResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _coerce_tags(tags: list[str] | None) -> list[str] | None:
    if tags is None:
        return None
    out: list[str] = []
    for tag in tags:
        value = str(tag).strip()
        if not value:
            continue
        if value not in out:
            out.append(value)
    return out or None


@router.post("/media-assets/upload", response_model=MediaAssetUploadResponse, status_code=201)
def upload_media_asset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetUploadResponse:
    service = MediaStorageService()
    stored = service.store_upload(file)

    existing = db.scalar(
        select(MediaAsset).where(MediaAsset.checksum_sha256 == stored.checksum_sha256)
    )
    if existing is not None:
        return MediaAssetUploadResponse(item=MediaAssetItem.model_validate(existing), deduped=True)

    row = MediaAsset(
        storage_path=stored.storage_path,
        kind="image",
        mime_type=stored.mime_type,
        file_size_bytes=stored.file_size_bytes,
        width=stored.width,
        height=stored.height,
        checksum_sha256=stored.checksum_sha256,
        source_url=None,
        source_domain=None,
        source_type=None,
        rights_status=None,
        status="active",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return MediaAssetUploadResponse(item=MediaAssetItem.model_validate(row), deduped=False)


@router.post("/media-assets/ingest-url", response_model=MediaAssetUploadResponse, status_code=201)
def ingest_media_asset_from_url(
    payload: MediaAssetIngestRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetUploadResponse:
    service = MediaStorageService()
    stored = service.ingest_from_url(str(payload.source_url))

    existing = db.scalar(
        select(MediaAsset).where(MediaAsset.checksum_sha256 == stored.checksum_sha256)
    )
    if existing is not None:
        changed = False
        if existing.source_url is None:
            existing.source_url = str(payload.source_url)
            changed = True
        if existing.source_domain is None:
            existing.source_domain = parse_source_domain(str(payload.source_url))
            changed = True
        if payload.rights_status is not None and existing.rights_status is None:
            existing.rights_status = payload.rights_status
            changed = True
        if payload.credit is not None and existing.credit is None:
            existing.credit = payload.credit
            changed = True
        if payload.source_type is not None and existing.source_type is None:
            existing.source_type = payload.source_type
            changed = True
        if payload.title is not None and existing.title is None:
            existing.title = payload.title
            changed = True
        if payload.tags:
            existing.tags = _coerce_tags(payload.tags)
            changed = True
        if changed:
            db.add(existing)
            db.commit()
            db.refresh(existing)
        return MediaAssetUploadResponse(item=MediaAssetItem.model_validate(existing), deduped=True)

    row = MediaAsset(
        storage_path=stored.storage_path,
        kind="image",
        mime_type=stored.mime_type,
        file_size_bytes=stored.file_size_bytes,
        width=stored.width,
        height=stored.height,
        checksum_sha256=stored.checksum_sha256,
        source_url=str(payload.source_url),
        source_domain=parse_source_domain(str(payload.source_url)),
        source_type=payload.source_type,
        rights_status=payload.rights_status,
        credit=payload.credit,
        title=payload.title,
        tags=_coerce_tags(payload.tags),
        status="active",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return MediaAssetUploadResponse(item=MediaAssetItem.model_validate(row), deduped=False)


@router.get("/media-assets", response_model=MediaAssetListResponse)
def list_media_assets(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=200),
    status_filter: str | None = Query(default=None, alias="status"),
    tag: str | None = Query(default=None),
    source_domain: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetListResponse:
    query = select(MediaAsset)

    if status_filter:
        query = query.where(MediaAsset.status == status_filter)
    if source_domain:
        query = query.where(MediaAsset.source_domain == source_domain)
    if tag:
        pattern = f'%"{tag.strip()}"%'
        query = query.where(cast(MediaAsset.tags, String).ilike(pattern))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                MediaAsset.title.ilike(pattern),
                MediaAsset.storage_path.ilike(pattern),
                MediaAsset.source_url.ilike(pattern),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(desc(MediaAsset.created_at), desc(MediaAsset.id))
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return MediaAssetListResponse(
        data=[MediaAssetItem.model_validate(row) for row in rows],
        meta={"page": page, "limit": limit, "total": int(total)},
    )


# ---------------------------------------------------------------------------
# B2: Media Integrity Report (on-demand scan) — must be before {media_id} route
# ---------------------------------------------------------------------------


@router.get("/media-assets/integrity-report")
def get_media_integrity_report(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Run a full media integrity scan and return the JSON report.

    Read-only — never writes to the database.
    This endpoint is intentionally synchronous because the scan is bounded
    by the number of media assets and entity records (no unbounded IO loops).
    """
    report = run_scan(db)
    return report.to_dict()


@router.get("/media-assets/{media_id}", response_model=MediaAssetItem)
def get_media_asset(
    media_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetItem:
    row = db.get(MediaAsset, media_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")
    return MediaAssetItem.model_validate(row)


@router.patch("/media-assets/{media_id}", response_model=MediaAssetItem)
def update_media_asset(
    media_id: UUID,
    payload: MediaAssetUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetItem:
    row = db.get(MediaAsset, media_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")

    data = payload.model_dump(exclude_unset=True)
    if "tags" in data:
        data["tags"] = _coerce_tags(data["tags"])
    if "source_url" in data:
        source_url = data.get("source_url")
        data["source_url"] = str(source_url) if source_url is not None else None
        data["source_domain"] = parse_source_domain(data["source_url"])

    for key, value in data.items():
        setattr(row, key, value)

    db.add(row)
    db.commit()
    db.refresh(row)
    return MediaAssetItem.model_validate(row)


@router.post("/media-assets/{media_id}/archive", response_model=MediaAssetItem)
def archive_media_asset(
    media_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetItem:
    row = db.get(MediaAsset, media_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")
    row.status = "archived"
    db.add(row)
    db.commit()
    db.refresh(row)
    return MediaAssetItem.model_validate(row)


@router.post("/media-assets/{media_id}/restore", response_model=MediaAssetItem)
def restore_media_asset(
    media_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetItem:
    row = db.get(MediaAsset, media_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")
    row.status = "active"
    db.add(row)
    db.commit()
    db.refresh(row)
    return MediaAssetItem.model_validate(row)


@router.post("/media-assets/{media_id}/assign/property", response_model=MediaAssetAssignResponse)
def assign_media_to_property(
    media_id: UUID,
    payload: MediaAssetAssignPropertyRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetAssignResponse:
    row = db.get(MediaAsset, media_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")
    if row.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Media asset is archived")
    if "://" in row.storage_path or not row.storage_path.startswith("/media/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Media asset path must be local /media/ path",
        )

    prop = db.scalar(select(Property).where(Property.source_id == payload.property_source_id))
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property source_id not found")

    existing_local = [
        p.strip()
        for p in (prop.local_images or [])
        if isinstance(p, str) and p.strip() and p.strip().startswith("/media/")
    ]

    if payload.append_to_local_images and row.storage_path not in existing_local:
        existing_local.append(row.storage_path)

    prop.local_images = existing_local
    prop.images = existing_local
    if payload.set_as_cover:
        prop.cover_image = row.storage_path

    db.add(prop)
    db.commit()
    db.refresh(prop)

    return MediaAssetAssignResponse(
        property_id=prop.id,
        property_source_id=prop.source_id,
        assigned_path=row.storage_path,
        cover_image=prop.cover_image,
        local_images=prop.local_images,
    )


