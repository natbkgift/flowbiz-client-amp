from __future__ import annotations

from uuid import UUID

from datetime import datetime, timezone

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
    MediaSourceRightsReportResponse,
    MediaSourceRightsUpdate,
    MediaAssetUpdate,
    MediaAssetUploadResponse,
)
from packages.core.source_rights_registry import (
    build_source_rights_report,
    normalize_approval_status,
    normalize_rights_status,
    normalize_source_type,
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


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


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
        source_page_url=str(payload.source_page_url) if payload.source_page_url is not None else None,
        source_domain=parse_source_domain(str(payload.source_url)),
        source_type=normalize_source_type(payload.source_type),
        rights_status=normalize_rights_status(payload.rights_status),
        approval_status=normalize_approval_status(payload.approval_status),
        approval_note=payload.approval_note,
        rights_note=payload.rights_note,
        license_evidence_url=(
            str(payload.license_evidence_url) if payload.license_evidence_url is not None else None
        ),
        exception_reason=payload.exception_reason,
        is_exception=bool(payload.is_exception) if payload.is_exception is not None else False,
        usage_scope=payload.usage_scope,
        linked_entity_hint=payload.linked_entity_hint,
        last_checked_at=_now_utc(),
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


@router.get("/media-assets/source-rights", response_model=MediaAssetListResponse)
def list_media_assets_source_rights(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=200),
    source_type: str | None = Query(default=None),
    rights_status: str | None = Query(default=None),
    approval_status: str | None = Query(default=None),
    source_domain: str | None = Query(default=None),
    is_exception: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetListResponse:
    query = select(MediaAsset)

    if source_type:
        query = query.where(MediaAsset.source_type == normalize_source_type(source_type))
    if rights_status:
        query = query.where(MediaAsset.rights_status == normalize_rights_status(rights_status))
    if approval_status:
        query = query.where(MediaAsset.approval_status == normalize_approval_status(approval_status))
    if source_domain:
        query = query.where(MediaAsset.source_domain == source_domain.strip().lower())
    if is_exception is not None:
        query = query.where(MediaAsset.is_exception.is_(is_exception))
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                MediaAsset.title.ilike(pattern),
                MediaAsset.storage_path.ilike(pattern),
                MediaAsset.source_url.ilike(pattern),
                MediaAsset.source_page_url.ilike(pattern),
                MediaAsset.credit.ilike(pattern),
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


@router.get("/media-assets/source-rights/report", response_model=MediaSourceRightsReportResponse)
def source_rights_report(
    pending_threshold: int = Query(default=5, ge=0, le=10000),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaSourceRightsReportResponse:
    report = build_source_rights_report(db, pending_threshold=pending_threshold)
    return MediaSourceRightsReportResponse(
        summary={
            "total_media_assets": report.summary.total_media_assets,
            "missing_source_metadata_count": report.summary.missing_source_metadata_count,
            "pending_approval_count": report.summary.pending_approval_count,
            "exception_count": report.summary.exception_count,
            "rejected_or_restricted_count": report.summary.rejected_or_restricted_count,
            "unknown_source_type_count": report.summary.unknown_source_type_count,
            "errors": report.summary.errors,
            "warnings": report.summary.warnings,
        },
        top_domains=report.top_domains,
    )


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
    if "source_page_url" in data:
        source_page_url = data.get("source_page_url")
        data["source_page_url"] = str(source_page_url) if source_page_url is not None else None
    if "source_type" in data:
        data["source_type"] = normalize_source_type(data.get("source_type"))
    if "rights_status" in data:
        data["rights_status"] = normalize_rights_status(data.get("rights_status"))
    if "approval_status" in data:
        data["approval_status"] = normalize_approval_status(data.get("approval_status"))
    if "license_evidence_url" in data:
        license_url = data.get("license_evidence_url")
        data["license_evidence_url"] = str(license_url) if license_url is not None else None

    for key, value in data.items():
        setattr(row, key, value)

    row.last_checked_at = _now_utc()
    if row.approval_status == "approved" and row.approved_at is None:
        row.approved_at = _now_utc()

    db.add(row)
    db.commit()
    db.refresh(row)
    return MediaAssetItem.model_validate(row)


@router.patch("/media-assets/{media_id}/source-rights", response_model=MediaAssetItem)
def patch_media_source_rights(
    media_id: UUID,
    payload: MediaSourceRightsUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> MediaAssetItem:
    row = db.get(MediaAsset, media_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found")

    data = payload.model_dump(exclude_unset=True)
    if "source_url" in data:
        source_url = data.get("source_url")
        data["source_url"] = str(source_url) if source_url is not None else None
        data["source_domain"] = parse_source_domain(data["source_url"])
    if "source_page_url" in data:
        source_page_url = data.get("source_page_url")
        data["source_page_url"] = str(source_page_url) if source_page_url is not None else None
    if "source_type" in data:
        data["source_type"] = normalize_source_type(data.get("source_type"))
    if "rights_status" in data:
        data["rights_status"] = normalize_rights_status(data.get("rights_status"))
    if "approval_status" in data:
        data["approval_status"] = normalize_approval_status(data.get("approval_status"))
    if "license_evidence_url" in data:
        license_url = data.get("license_evidence_url")
        data["license_evidence_url"] = str(license_url) if license_url is not None else None

    for key, value in data.items():
        setattr(row, key, value)

    row.last_checked_at = _now_utc()
    if row.approval_status == "approved" and row.approved_at is None:
        row.approved_at = _now_utc()

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


