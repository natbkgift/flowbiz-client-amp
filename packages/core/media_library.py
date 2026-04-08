from __future__ import annotations

import hashlib
import json
import mimetypes
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.media_path_policy import (
    MEDIA_PUBLIC_PREFIX,
    is_library_media_path,
    media_variant_prefix,
)
from packages.core.media_path_policy import (
    is_local_media_path as is_local_media_path_policy,
)
from packages.core.models import Area, Article, Developer, MediaAsset, Project, Property

try:
    from PIL import Image
except Exception:  # pragma: no cover - optional dependency
    Image = None


MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
}
ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

MEDIA_ROOT = Path("storage/media/library")
MEDIA_SIDECARE_ROOT = MEDIA_ROOT / ".meta"
MEDIA_VARIANT_ROOT = MEDIA_ROOT / "variants"


@dataclass
class MediaInspection:
    mime_type: str
    width: int | None
    height: int | None
    checksum_sha256: str
    size_bytes: int


def ensure_media_dirs() -> None:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    MEDIA_SIDECARE_ROOT.mkdir(parents=True, exist_ok=True)
    MEDIA_VARIANT_ROOT.mkdir(parents=True, exist_ok=True)


def is_local_media_path(path: str | None) -> bool:
    return is_local_media_path_policy(path)


def require_local_media_path(path: str | None, *, field_name: str) -> str:
    value = str(path or "").strip()
    if is_library_media_path(value):
        return value
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=f"{field_name} must be local /media/library/ path",
    )


def _guess_mime(path: Path, file_mime: str | None) -> str:
    if file_mime and file_mime in ALLOWED_MIME_TYPES:
        return file_mime
    guessed, _ = mimetypes.guess_type(path.name)
    if guessed:
        return guessed
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if path.suffix.lower() == ".png":
        return "image/png"
    if path.suffix.lower() == ".webp":
        return "image/webp"
    if path.suffix.lower() == ".avif":
        return "image/avif"
    return "application/octet-stream"


def inspect_image_bytes(payload: bytes, *, filename: str, file_mime: str | None) -> MediaInspection:
    if len(payload) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"file too large: max {MAX_IMAGE_SIZE_BYTES} bytes",
        )

    suffix = Path(filename or "upload.bin").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"unsupported image extension: {suffix or 'unknown'}",
        )

    width: int | None = None
    height: int | None = None
    if Image is not None:
        try:
            from io import BytesIO

            with Image.open(BytesIO(payload)) as img:
                width, height = img.size
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="invalid image payload",
            ) from exc

    checksum = hashlib.sha256(payload).hexdigest()
    mime_type = _guess_mime(Path(filename), file_mime)
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"unsupported mime type: {mime_type}",
        )

    return MediaInspection(
        mime_type=mime_type,
        width=width,
        height=height,
        checksum_sha256=checksum,
        size_bytes=len(payload),
    )


def _source_domain(source_url: str | None) -> str | None:
    if not source_url:
        return None
    try:
        parsed = urlparse(source_url)
        return parsed.netloc or None
    except Exception:
        return None


def _variant_file_path(media_id: UUID, suffix: str) -> Path:
    return MEDIA_VARIANT_ROOT / f"{media_id}{suffix}"


def _variant_public_path(media_id: UUID, suffix: str) -> str:
    return f"{media_variant_prefix()}/{media_id}{suffix}"


def _serialize_decimal(value: Decimal | None) -> float | None:
    if value is None:
        return None
    return float(value)


def _sidecar_path(media_id: UUID) -> Path:
    return MEDIA_SIDECARE_ROOT / f"{media_id}.json"


def read_sidecar(media_id: UUID) -> dict[str, Any]:
    path = _sidecar_path(media_id)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def write_sidecar(media_id: UUID, payload: dict[str, Any]) -> None:
    path = _sidecar_path(media_id)
    data = {
        "updated_at": datetime.now(UTC).isoformat(),
        **payload,
    }
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _create_variants(media_id: UUID, original_file: Path) -> dict[str, Any]:
    result = {
        "webp": {"available": False, "path": None, "error": None},
        "avif": {"available": False, "path": None, "error": None},
    }
    if Image is None:
        result["webp"]["error"] = "pillow_unavailable"
        result["avif"]["error"] = "pillow_unavailable"
        return result

    try:
        with Image.open(original_file) as img:
            webp_file = _variant_file_path(media_id, ".webp")
            img.save(webp_file, format="WEBP", quality=85)
            result["webp"] = {
                "available": True,
                "path": _variant_public_path(media_id, ".webp"),
                "error": None,
            }
    except Exception as exc:
        result["webp"]["error"] = f"webp_failed:{exc.__class__.__name__}"

    try:
        with Image.open(original_file) as img:
            avif_file = _variant_file_path(media_id, ".avif")
            img.save(avif_file, format="AVIF", quality=80)
            result["avif"] = {
                "available": True,
                "path": _variant_public_path(media_id, ".avif"),
                "error": None,
            }
    except Exception as exc:
        result["avif"]["error"] = f"avif_unavailable:{exc.__class__.__name__}"

    return result


def _public_media_path(relative: Path) -> str:
    return f"{MEDIA_PUBLIC_PREFIX}/{relative.as_posix()}"


def _disk_path_from_public(path: str) -> Path:
    normalized = require_local_media_path(path, field_name="storage_path")
    relative = normalized.removeprefix("/media/")
    return Path("storage") / relative


def save_upload_as_media_asset(
    db: Session,
    *,
    upload: UploadFile,
    metadata: dict[str, Any],
) -> MediaAsset:
    ensure_media_dirs()
    payload = upload.file.read()
    inspection = inspect_image_bytes(
        payload, filename=upload.filename or "upload.bin", file_mime=upload.content_type
    )

    media_id = uuid4()
    suffix = Path(upload.filename or "upload.bin").suffix.lower() or ".bin"
    if suffix == ".jpeg":
        suffix = ".jpg"
    relative_path = Path("library") / f"{media_id}{suffix}"
    disk_path = Path("storage") / relative_path
    disk_path.parent.mkdir(parents=True, exist_ok=True)
    disk_path.write_bytes(payload)

    source_url = str(metadata.get("source_url") or "").strip() or None
    source_domain = str(metadata.get("source_domain") or "").strip() or _source_domain(source_url)

    media = MediaAsset(
        id=media_id,
        storage_path=_public_media_path(relative_path),
        kind="image",
        mime_type=inspection.mime_type,
        file_size_bytes=inspection.size_bytes,
        width=inspection.width,
        height=inspection.height,
        checksum_sha256=inspection.checksum_sha256,
        title=str(metadata.get("title") or "").strip() or None,
        alt_text_en=str(metadata.get("alt_en") or "").strip() or None,
        alt_text_th=str(metadata.get("alt_th") or "").strip() or None,
        caption_en=str(metadata.get("caption_en") or "").strip() or None,
        caption_th=str(metadata.get("caption_th") or "").strip() or None,
        tags=metadata.get("tags") if isinstance(metadata.get("tags"), list) else None,
        source_url=source_url,
        source_page_url=str(metadata.get("source_page_url") or "").strip() or None,
        source_domain=source_domain,
        source_type=str(metadata.get("source_type") or "").strip() or None,
        rights_status=str(metadata.get("rights_status") or "").strip() or None,
        approval_status=str(metadata.get("approval_status") or "").strip() or None,
        rights_note=str(metadata.get("rights_note") or "").strip() or None,
        license_evidence_url=str(metadata.get("license_evidence_url") or "").strip() or None,
        credit=str(metadata.get("credit") or "").strip() or None,
        focal_x=metadata.get("focal_x"),
        focal_y=metadata.get("focal_y"),
        status="active",
    )

    db.add(media)
    db.flush()

    variants = _create_variants(media.id, disk_path)
    write_sidecar(
        media.id,
        {
            "crop_hint": metadata.get("crop_hint"),
            "variants": variants,
            "source_metadata": metadata.get("source_metadata")
            if isinstance(metadata.get("source_metadata"), dict)
            else {},
            "avif_available": bool(variants["avif"]["available"]),
        },
    )

    return media


def update_media_file_in_place(db: Session, *, media: MediaAsset, upload: UploadFile) -> MediaAsset:
    ensure_media_dirs()
    payload = upload.file.read()
    inspection = inspect_image_bytes(
        payload, filename=upload.filename or "upload.bin", file_mime=upload.content_type
    )

    disk_path = _disk_path_from_public(media.storage_path)
    disk_path.parent.mkdir(parents=True, exist_ok=True)
    disk_path.write_bytes(payload)

    media.mime_type = inspection.mime_type
    media.file_size_bytes = inspection.size_bytes
    media.width = inspection.width
    media.height = inspection.height
    media.checksum_sha256 = inspection.checksum_sha256
    db.add(media)
    db.flush()

    sidecar = read_sidecar(media.id)
    variants = _create_variants(media.id, disk_path)
    sidecar["variants"] = variants
    sidecar["avif_available"] = bool(variants["avif"]["available"])
    write_sidecar(media.id, sidecar)
    return media


def serialize_media_asset(asset: MediaAsset) -> dict[str, Any]:
    sidecar = read_sidecar(asset.id)
    variants = sidecar.get("variants") if isinstance(sidecar.get("variants"), dict) else {}
    return {
        "id": str(asset.id),
        "storage_path": asset.storage_path,
        "preview_url": asset.storage_path,
        "kind": asset.kind,
        "mime": asset.mime_type,
        "file_size_bytes": asset.file_size_bytes,
        "width": asset.width,
        "height": asset.height,
        "checksum_sha256": asset.checksum_sha256,
        "title": asset.title,
        "alt_en": asset.alt_text_en,
        "alt_th": asset.alt_text_th,
        "caption_en": asset.caption_en,
        "caption_th": asset.caption_th,
        "tags": asset.tags or [],
        "source_url": asset.source_url,
        "source_domain": asset.source_domain,
        "rights_status": asset.rights_status,
        "approval_status": asset.approval_status,
        "credit": asset.credit,
        "focal": {"x": _serialize_decimal(asset.focal_x), "y": _serialize_decimal(asset.focal_y)},
        "crop_hint": sidecar.get("crop_hint"),
        "variants": variants,
        "avif_available": bool(sidecar.get("avif_available", False)),
        "status": asset.status,
        "created_at": asset.created_at.isoformat() if asset.created_at else None,
        "updated_at": asset.updated_at.isoformat() if asset.updated_at else None,
    }


def compute_usage_map(db: Session, *, media: MediaAsset) -> list[dict[str, str]]:
    path = media.storage_path
    usage: list[dict[str, str]] = []

    for row in db.scalars(select(Property)).all():
        images = row.images or []
        local_images = row.local_images or []
        if (
            row.cover_image == path
            or row.cover_image_url == path
            or path in images
            or path in local_images
        ):
            usage.append(
                {
                    "entity": "property",
                    "id": str(row.id),
                    "slug": str(row.slug or ""),
                    "field": "media",
                }
            )

    for row in db.scalars(select(Project)).all():
        if row.cover_image_url == path or row.hero_image_url == path or path in (row.images or []):
            usage.append(
                {"entity": "project", "id": str(row.id), "slug": row.slug, "field": "media"}
            )

    for row in db.scalars(select(Area)).all():
        if row.hero_image_url == path:
            usage.append(
                {"entity": "area", "id": str(row.id), "slug": row.slug, "field": "hero_image_url"}
            )

    for row in db.scalars(select(Developer)).all():
        if row.logo_url == path:
            usage.append(
                {"entity": "developer", "id": str(row.id), "slug": row.slug, "field": "logo_url"}
            )

    for row in db.scalars(select(Article)).all():
        if row.hero_image_url == path or (
            row.hero_media_asset_id and row.hero_media_asset_id == media.id
        ):
            usage.append(
                {
                    "entity": "article",
                    "id": str(row.id),
                    "slug": row.slug,
                    "field": "hero_image_url",
                }
            )

    return usage
