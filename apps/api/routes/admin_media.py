from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.media_integrity import run_scan
from packages.core.media_library import (
    compute_usage_map,
    read_sidecar,
    require_local_media_path,
    save_upload_as_media_asset,
    serialize_media_asset,
    update_media_file_in_place,
    write_sidecar,
)
from packages.core.models import MediaAsset, Project, Property, User

router = APIRouter(prefix="/admin/media", tags=["admin", "media"])


class MediaPatchPayload(BaseModel):
    title: str | None = None
    alt_en: str | None = None
    alt_th: str | None = None
    caption_en: str | None = None
    caption_th: str | None = None
    tags: list[str] | None = None
    source_url: str | None = None
    rights_status: str | None = None
    approval_status: str | None = None
    credit: str | None = None
    focal_x: float | None = None
    focal_y: float | None = None
    crop_hint: dict | None = None
    source_metadata: dict | None = None


class MediaGalleryPayload(BaseModel):
    cover_image: str | None = None
    images: list[str]


def _parse_json_field(raw: str | None, *, default: object) -> object:
    value = (raw or "").strip()
    if not value:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="invalid json form field",
        ) from exc


def _parse_decimal(raw: str | None) -> Decimal | None:
    value = (raw or "").strip()
    if not value:
        return None
    return Decimal(value)


def _metadata_from_form(
    *,
    title: str | None,
    alt_en: str | None,
    alt_th: str | None,
    caption_en: str | None,
    caption_th: str | None,
    tags: str | None,
    source_url: str | None,
    source_domain: str | None,
    rights_status: str | None,
    approval_status: str | None,
    rights_note: str | None,
    license_evidence_url: str | None,
    credit: str | None,
    focal_x: str | None,
    focal_y: str | None,
    crop_hint: str | None,
    source_metadata: str | None,
) -> dict:
    return {
        "title": title,
        "alt_en": alt_en,
        "alt_th": alt_th,
        "caption_en": caption_en,
        "caption_th": caption_th,
        "tags": _parse_json_field(tags, default=[]),
        "source_url": source_url,
        "source_domain": source_domain,
        "rights_status": rights_status,
        "approval_status": approval_status,
        "rights_note": rights_note,
        "license_evidence_url": license_evidence_url,
        "credit": credit,
        "focal_x": _parse_decimal(focal_x),
        "focal_y": _parse_decimal(focal_y),
        "crop_hint": _parse_json_field(crop_hint, default={}),
        "source_metadata": _parse_json_field(source_metadata, default={}),
    }


@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_media(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    alt_en: str | None = Form(default=None),
    alt_th: str | None = Form(default=None),
    caption_en: str | None = Form(default=None),
    caption_th: str | None = Form(default=None),
    tags: str | None = Form(default=None),
    source_url: str | None = Form(default=None),
    source_domain: str | None = Form(default=None),
    rights_status: str | None = Form(default=None),
    approval_status: str | None = Form(default=None),
    rights_note: str | None = Form(default=None),
    license_evidence_url: str | None = Form(default=None),
    credit: str | None = Form(default=None),
    focal_x: str | None = Form(default=None),
    focal_y: str | None = Form(default=None),
    crop_hint: str | None = Form(default=None),
    source_metadata: str | None = Form(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    metadata = _metadata_from_form(
        title=title,
        alt_en=alt_en,
        alt_th=alt_th,
        caption_en=caption_en,
        caption_th=caption_th,
        tags=tags,
        source_url=source_url,
        source_domain=source_domain,
        rights_status=rights_status,
        approval_status=approval_status,
        rights_note=rights_note,
        license_evidence_url=license_evidence_url,
        credit=credit,
        focal_x=focal_x,
        focal_y=focal_y,
        crop_hint=crop_hint,
        source_metadata=source_metadata,
    )
    media = save_upload_as_media_asset(db, upload=file, metadata=metadata)
    db.commit()
    db.refresh(media)
    return {"media": serialize_media_asset(media)}


@router.post("/upload-multi", status_code=status.HTTP_201_CREATED)
def upload_media_multi(
    files: list[UploadFile] = File(...),
    tags: str | None = Form(default=None),
    rights_status: str | None = Form(default=None),
    approval_status: str | None = Form(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    if not files:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="files is required"
        )

    metadata = {
        "tags": _parse_json_field(tags, default=[]),
        "rights_status": rights_status,
        "approval_status": approval_status,
    }
    out: list[dict] = []
    for file in files:
        media = save_upload_as_media_asset(db, upload=file, metadata=metadata)
        out.append(serialize_media_asset(media))
    db.commit()
    return {"items": out, "count": len(out)}


@router.get("")
def list_media(
    limit: int = Query(default=80, ge=1, le=200),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    query = select(MediaAsset)
    if q:
        pattern = f"%{q.strip()}%"
        query = query.where(
            MediaAsset.storage_path.ilike(pattern) | MediaAsset.title.ilike(pattern)
        )
    rows = db.scalars(
        query.order_by(desc(MediaAsset.updated_at), desc(MediaAsset.id)).limit(limit)
    ).all()
    return {"items": [serialize_media_asset(row) for row in rows]}


@router.get("/integrity-report")
def media_integrity_report(
    orphan_sample_limit: int = Query(default=20, ge=0, le=200),
    media_root: str | None = Query(default=None),
    media_prefix: str = Query(default="/media"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    root = Path(media_root).resolve() if media_root else None
    report = run_scan(
        db,
        media_root=root,
        media_public_prefix=media_prefix,
        orphan_sample_limit=orphan_sample_limit,
    )
    return report.to_dict()


@router.get("/{media_id}")
def get_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    media = db.get(MediaAsset, media_id)
    if media is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    payload = serialize_media_asset(media)
    payload["usage"] = compute_usage_map(db, media=media)
    return {"media": payload}


@router.patch("/{media_id}")
def patch_media(
    media_id: UUID,
    payload: MediaPatchPayload,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    media = db.get(MediaAsset, media_id)
    if media is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    data = payload.model_dump(exclude_unset=True)
    if "title" in data:
        media.title = data["title"]
    if "alt_en" in data:
        media.alt_text_en = data["alt_en"]
    if "alt_th" in data:
        media.alt_text_th = data["alt_th"]
    if "caption_en" in data:
        media.caption_en = data["caption_en"]
    if "caption_th" in data:
        media.caption_th = data["caption_th"]
    if "tags" in data:
        media.tags = data["tags"]
    if "source_url" in data:
        media.source_url = data["source_url"]
    if "rights_status" in data:
        media.rights_status = data["rights_status"]
    if "approval_status" in data:
        media.approval_status = data["approval_status"]
    if "credit" in data:
        media.credit = data["credit"]
    if "focal_x" in data:
        media.focal_x = Decimal(str(data["focal_x"])) if data["focal_x"] is not None else None
    if "focal_y" in data:
        media.focal_y = Decimal(str(data["focal_y"])) if data["focal_y"] is not None else None

    db.add(media)
    db.flush()

    sidecar = read_sidecar(media.id)
    if "crop_hint" in data:
        sidecar["crop_hint"] = data["crop_hint"]
    if "source_metadata" in data:
        sidecar["source_metadata"] = data["source_metadata"]
    write_sidecar(media.id, sidecar)

    db.commit()
    db.refresh(media)
    return {"media": serialize_media_asset(media)}


@router.post("/{media_id}/archive")
def archive_media(
    media_id: UUID,
    block_if_used: bool = Query(default=True),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    media = db.get(MediaAsset, media_id)
    if media is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    usage = compute_usage_map(db, media=media)
    if block_if_used and usage:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "media_in_use", "usage": usage},
        )
    media.status = "archived"
    db.add(media)
    db.commit()
    db.refresh(media)
    return {"media": serialize_media_asset(media), "usage": usage}


@router.post("/{media_id}/restore")
def restore_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    media = db.get(MediaAsset, media_id)
    if media is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    media.status = "active"
    db.add(media)
    db.commit()
    db.refresh(media)
    return {"media": serialize_media_asset(media)}


@router.post("/{media_id}/replace")
def replace_media(
    media_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    media = db.get(MediaAsset, media_id)
    if media is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    before_usage = compute_usage_map(db, media=media)
    media = update_media_file_in_place(db, media=media, upload=file)
    db.commit()
    db.refresh(media)
    after_usage = compute_usage_map(db, media=media)
    return {
        "media": serialize_media_asset(media),
        "preserved_references": len(before_usage) == len(after_usage),
        "usage": after_usage,
    }


@router.get("/{media_id}/usage")
def media_usage(
    media_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    media = db.get(MediaAsset, media_id)
    if media is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    usage = compute_usage_map(db, media=media)
    return {
        "media_id": str(media.id),
        "storage_path": media.storage_path,
        "usage": usage,
        "count": len(usage),
    }


@router.put("/properties/{property_id}/gallery")
def set_property_gallery(
    property_id: UUID,
    payload: MediaGalleryPayload,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    images = [require_local_media_path(path, field_name="images") for path in payload.images]
    cover = payload.cover_image
    if cover is not None:
        cover = require_local_media_path(cover, field_name="cover_image")
    if cover is None and images:
        cover = images[0]

    prop.local_images = images
    prop.images = images
    prop.cover_image = cover
    prop.cover_image_url = cover
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return {
        "property_id": str(prop.id),
        "cover_image": prop.cover_image,
        "cover_image_url": prop.cover_image_url,
        "images": prop.images or [],
    }


@router.put("/projects/{project_id}/gallery")
def set_project_gallery(
    project_id: UUID,
    payload: MediaGalleryPayload,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    images = [require_local_media_path(path, field_name="images") for path in payload.images]
    cover = payload.cover_image
    if cover is not None:
        cover = require_local_media_path(cover, field_name="cover_image")
    if cover is None and images:
        cover = images[0]

    project.images = images
    project.cover_image_url = cover
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "project_id": str(project.id),
        "cover_image_url": project.cover_image_url,
        "images": project.images or [],
    }
