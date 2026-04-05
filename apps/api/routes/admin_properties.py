import csv
import hashlib
import json
import io
import threading
import time
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.params import File
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, or_, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.media_library import require_local_media_path
from packages.core.models import (
    Area,
    CompanyInfo,
    Developer,
    MediaAsset,
    Project,
    Property,
    PropertyImportAudit,
    TeamMember,
    Testimonial,
    User,
)
from packages.core.project_media_governance import evaluate_project_media_governance
from packages.core.property_type import validate_property_fields
from packages.core.seo_controls import upsert_slug_redirects
from packages.core.schemas.media_library import MediaAssetItem
from packages.core.schemas.property_api import (
    CompanyInfoCreate,
    CompanyInfoItem,
    CompanyListResponse,
    CompanyInfoUpdate,
    PaginationMeta,
    PropertyAdminListResponse,
    PropertyBulkTagsRequest,
    PropertyBulkUpdateRequest,
    PropertyBulkStatusRequest,
    PropertyBulkStatusResponse,
    PropertyCreate,
    PropertyDetail,
    PropertyListItem,
    PropertyListResponse,
    PropertyPublishResponse,
    PropertyStatus,
    PropertyUpdate,
    TeamMemberCreate,
    TeamMemberItem,
    TeamMemberListResponse,
    TeamMemberUpdate,
    TestimonialCreate,
    TestimonialItem,
    TestimonialListResponse,
    TestimonialUpdate,
)
from packages.core.schemas.property_import import PropertyImportResult, PropertyImportRow

router = APIRouter(prefix="/admin", tags=["admin"])

_SITE_LAYOUT_CMS_SLUG = "site-layout"
_SITE_LAYOUT_CMS_TITLE = "Site Layout CMS"
_SITE_LAYOUT_CMS_META_DESCRIPTION = "Header/Footer CMS source of truth"
_SITE_LAYOUT_CMS_FALLBACK_CONTENT = json.dumps(
    {
        "header": {
            "primary_links": [
                {"href": "/invest", "label": {"en": "Invest", "th": "ลงทุน"}, "enabled": True},
                {"href": "/buy", "label": {"en": "Buy", "th": "ซื้อ"}, "enabled": True},
                {
                    "href": "/projects",
                    "label": {"en": "Projects", "th": "โครงการ"},
                    "enabled": True,
                },
                {
                    "href": "/area-guide",
                    "label": {"en": "Area Guide", "th": "ทำเล"},
                    "enabled": True,
                },
            ],
            "contact_cta": {
                "href": "/contact",
                "label": {"en": "Contact", "th": "ติดต่อ"},
                "enabled": True,
            },
        },
        "footer": {
            "quick_links": [
                {"href": "/invest", "label": {"en": "Invest", "th": "ลงทุน"}, "enabled": True},
                {"href": "/buy", "label": {"en": "Buy", "th": "ซื้อ"}, "enabled": True},
                {
                    "href": "/projects",
                    "label": {"en": "Projects", "th": "โครงการ"},
                    "enabled": True,
                },
            ],
            "legal_links": [
                {
                    "href": "/privacy",
                    "label": {"en": "Privacy Policy", "th": "นโยบายความเป็นส่วนตัว"},
                    "enabled": True,
                },
                {
                    "href": "/terms",
                    "label": {"en": "Terms of Service", "th": "ข้อกำหนดการใช้บริการ"},
                    "enabled": True,
                },
            ],
            "contact": {
                "email": "info@amppattaya.com",
                "facebook_url": "https://facebook.com/flowbiz",
                "facebook_label": {
                    "en": "facebook.com/flowbiz",
                    "th": "facebook.com/flowbiz",
                },
            },
        },
    },
    ensure_ascii=False,
    indent=2,
)


EXPECTED_HEADER = [
    "source_id",
    "title",
    "type",
    "price",
    "address",
    "city",
    "status",
    "bedrooms",
    "bathrooms",
    "size",
    "slug",
]

MAX_BYTES = 5 * 1024 * 1024
MAX_ROWS = 5000


_IMPORT_LOCK = threading.Lock()


class _DryRunRollbackError(Exception):
    pass


def _commit_or_conflict(db: Session, *, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc


def _site_layout_company_info_fallback() -> CompanyInfoItem:
    now = datetime.now(timezone.utc)
    return CompanyInfoItem(
        id=UUID("00000000-0000-0000-0000-000000000000"),
        title=_SITE_LAYOUT_CMS_TITLE,
        slug=_SITE_LAYOUT_CMS_SLUG,
        content=_SITE_LAYOUT_CMS_FALLBACK_CONTENT,
        meta_title=_SITE_LAYOUT_CMS_TITLE,
        meta_description=_SITE_LAYOUT_CMS_META_DESCRIPTION,
        created_at=now,
        updated_at=now,
    )


def _materialize_site_layout_company_info(payload: CompanyInfoUpdate | None = None) -> CompanyInfo:
    return CompanyInfo(
        title=(payload.title if payload and payload.title is not None else _SITE_LAYOUT_CMS_TITLE),
        slug=_SITE_LAYOUT_CMS_SLUG,
        content=(
            payload.content
            if payload and payload.content is not None
            else _SITE_LAYOUT_CMS_FALLBACK_CONTENT
        ),
        meta_title=(
            payload.meta_title
            if payload and payload.meta_title is not None
            else _SITE_LAYOUT_CMS_TITLE
        ),
        meta_description=(
            payload.meta_description
            if payload and payload.meta_description is not None
            else _SITE_LAYOUT_CMS_META_DESCRIPTION
        ),
    )


def _summarize_errors(errors: list[str]) -> str | None:
    if not errors:
        return None
    return "\n".join(errors[:5])


def _acquire_import_lock(db: Session) -> str:
    dialect = getattr(getattr(db, "bind", None), "dialect", None)
    name = getattr(dialect, "name", "")
    if name == "postgresql":
        db.execute(text("SELECT pg_advisory_lock(987654321);"))
        return "postgresql"

    _IMPORT_LOCK.acquire()
    return "threading"


def _release_import_lock(db: Session, mode: str | None) -> None:
    if mode is None:
        return

    if mode == "postgresql":
        db.execute(text("SELECT pg_advisory_unlock(987654321);"))
        return

    _IMPORT_LOCK.release()


def _iter_chunks(items: list[str], *, size: int) -> list[list[str]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


class PropertyImportAuditItem(BaseModel):
    id: UUID
    admin_email: str
    filename: str
    rows_total: int
    rows_created: int
    rows_updated: int
    status: str
    duration_ms: int
    created_at: str


class PropertyImportAuditListResponse(BaseModel):
    items: list[PropertyImportAuditItem]
    total: int


class PropertyMediaSyncItem(BaseModel):
    source_id: str
    local_images: list[str]
    cover_image: str | None = None
    source_meta: dict | None = None


class PropertyMediaSyncRequest(BaseModel):
    items: list[PropertyMediaSyncItem]


class PropertyMediaSyncResponse(BaseModel):
    updated: int
    missing: int
    warnings: int = 0


class PropertyCoverIngestRequest(BaseModel):
    storage_path: str
    source_url: str | None = None
    source_page_url: str | None = None
    source_domain: str | None = None
    source_type: str | None = None
    rights_status: str | None = None
    approval_status: str | None = None
    rights_note: str | None = None
    license_evidence_url: str | None = None
    append_to_gallery: bool = True
    publish_now: bool = False


class PropertyMediaGovernanceWarning(BaseModel):
    level: str
    path: str
    detail: str


def _coerce_string_list(value: list[str] | None) -> list[str]:
    if not value:
        return []
    out: list[str] = []
    for raw in value:
        item = str(raw).strip()
        if not item:
            continue
        if item in out:
            continue
        out.append(item)
    return out


def _normalize_tags(value: list[str] | None) -> list[str] | None:
    values = _coerce_string_list(value)
    if not values:
        return None
    return values


def _normalize_i18n_map(value: dict | None, *, field_name: str) -> dict[str, str] | None:
    if value is None:
        return None
    if not isinstance(value, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"{field_name} must be an object",
        )

    allowed = {"en", "th"}
    keys = set(value.keys())
    if not keys.issubset(allowed):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"{field_name} supports only en/th keys",
        )

    out: dict[str, str] = {}
    for locale in ("en", "th"):
        raw = value.get(locale)
        if raw is None:
            continue
        text = str(raw).strip()
        if text:
            out[locale] = text

    return out or None


def _resolve_i18n_text(i18n_map: dict[str, str] | None, legacy_value: str | None) -> str | None:
    if i18n_map:
        if i18n_map.get("en"):
            return i18n_map["en"]
        if i18n_map.get("th"):
            return i18n_map["th"]
    if legacy_value is None:
        return None
    value = str(legacy_value).strip()
    return value or None


def _extract_tags(features: dict | None) -> list[str] | None:
    if not isinstance(features, dict):
        return None
    tags = features.get("tags")
    if not isinstance(tags, list):
        return None
    return _normalize_tags([str(item) for item in tags])


def _extract_view_label(features: dict | None) -> str | None:
    if not isinstance(features, dict):
        return None
    value = features.get("view_label")
    if value is None:
        return None
    text_value = str(value).strip()
    return text_value or None


def _normalize_cover_fields(
    *, cover_image: str | None, cover_image_url: str | None
) -> tuple[str | None, str | None]:
    legacy_cover = (cover_image or "").strip() or None
    canonical_cover = (cover_image_url or "").strip() or None

    if canonical_cover is None:
        canonical_cover = legacy_cover
    if legacy_cover is None:
        legacy_cover = canonical_cover

    return legacy_cover, canonical_cover


def _apply_canonical_legacy_alignment(prop: Property) -> None:
    # Canonical precedence contract:
    # - cover_image_url > cover_image
    # - size_sqm > size
    # - floor > floor_number
    legacy_cover, canonical_cover = _normalize_cover_fields(
        cover_image=prop.cover_image,
        cover_image_url=prop.cover_image_url,
    )
    prop.cover_image = legacy_cover
    prop.cover_image_url = canonical_cover

    if prop.size_sqm is None and prop.size is not None:
        prop.size_sqm = prop.size
    if prop.size is None and prop.size_sqm is not None:
        prop.size = prop.size_sqm

    if prop.floor is None and prop.floor_number is not None:
        prop.floor = prop.floor_number
    if prop.floor_number is None and prop.floor is not None:
        prop.floor_number = prop.floor


def _is_local_media_path(value: str) -> bool:
    return value.startswith("/media/") and "://" not in value


def _validate_local_media_path(value: str, *, field_name: str) -> None:
    if _is_local_media_path(value):
        return
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=f"{field_name} must be local /media/ path",
    )


def _validate_relations_exist(
    db: Session,
    *,
    project_id: UUID | None,
    area_id: UUID | None,
    developer_id: UUID | None,
) -> None:
    if project_id is not None and db.get(Project, project_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="project_id not found"
        )
    if area_id is not None and db.get(Area, area_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="area_id not found"
        )
    if developer_id is not None and db.get(Developer, developer_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="developer_id not found"
        )


def _collect_property_media_paths(
    *,
    cover_image: str | None,
    cover_image_url: str | None,
    local_images: list[str] | None,
    images: list[str] | None,
) -> list[str]:
    candidates: list[str] = []
    for path in [
        cover_image,
        cover_image_url,
        *(_coerce_string_list(local_images)),
        *(_coerce_string_list(images)),
    ]:
        item = str(path or "").strip()
        if not item:
            continue
        if item in candidates:
            continue
        candidates.append(item)
    return candidates


def _media_governance_warnings(
    db: Session,
    *,
    cover_image: str | None,
    cover_image_url: str | None,
    local_images: list[str] | None,
    images: list[str] | None,
) -> list[PropertyMediaGovernanceWarning]:
    paths = _collect_property_media_paths(
        cover_image=cover_image,
        cover_image_url=cover_image_url,
        local_images=local_images,
        images=images,
    )
    paths = [path for path in paths if _is_local_media_path(path)]
    if not paths:
        return []
    governance = evaluate_project_media_governance(db, paths=paths)
    return [PropertyMediaGovernanceWarning(**item.to_dict()) for item in governance.warnings]


def _validate_property_media_governance(
    db: Session,
    *,
    cover_image: str | None,
    cover_image_url: str | None,
    local_images: list[str] | None,
    images: list[str] | None,
) -> list[PropertyMediaGovernanceWarning]:
    local_images_clean = _coerce_string_list(local_images)
    images_clean = [path for path in _coerce_string_list(images) if _is_local_media_path(path)]

    if cover_image is not None:
        cover_image = cover_image.strip() or None
    if cover_image_url is not None:
        cover_image_url = cover_image_url.strip() or None

    if cover_image is not None:
        _validate_local_media_path(cover_image, field_name="cover_image")
    if cover_image_url is not None:
        _validate_local_media_path(cover_image_url, field_name="cover_image_url")
    for item in local_images_clean:
        _validate_local_media_path(item, field_name="local_images")

    governance = evaluate_project_media_governance(
        db,
        paths=_collect_property_media_paths(
            cover_image=cover_image,
            cover_image_url=cover_image_url,
            local_images=local_images_clean,
            images=images_clean,
        ),
    )
    if governance.errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "property_media_governance_blocked",
                "errors": [item.to_dict() for item in governance.errors],
            },
        )

    return [PropertyMediaGovernanceWarning(**item.to_dict()) for item in governance.warnings]


def _listing_quality_gate_errors(
    *,
    cover_image: str | None,
    cover_image_url: str | None,
    address: str | None,
    city: str | None,
    area_id: UUID | None,
    project_id: UUID | None,
) -> list[str]:
    errors: list[str] = []
    has_local_cover = any(
        _is_local_media_path(str(path or "").strip()) for path in [cover_image_url, cover_image]
    )
    if not has_local_cover:
        errors.append("cover media is required and must use local /media path")

    has_location_context = bool(
        area_id or project_id or str(city or "").strip() or str(address or "").strip()
    )
    if not has_location_context:
        errors.append("location context is required (Area, Project, City, or Address)")
    return errors


def _serialize_property_detail(
    db: Session,
    prop: Property,
    *,
    warnings_override: list[PropertyMediaGovernanceWarning] | None = None,
) -> PropertyDetail:
    payload = PropertyDetail.model_validate(prop).model_dump()
    payload["cover_image"] = prop.cover_image or prop.cover_image_url
    payload["cover_image_url"] = prop.cover_image_url or prop.cover_image
    payload["local_images"] = _coerce_string_list(prop.local_images)
    payload["images"] = _coerce_string_list(prop.images)
    payload["size_sqm"] = prop.size_sqm or prop.size
    payload["view_label"] = _extract_view_label(prop.features)
    payload["tags"] = _extract_tags(prop.features)
    payload["media_warnings"] = [
        warning.model_dump()
        for warning in (
            warnings_override
            if warnings_override is not None
            else _media_governance_warnings(
                db,
                cover_image=prop.cover_image,
                cover_image_url=prop.cover_image_url,
                local_images=prop.local_images,
                images=prop.images,
            )
        )
    ]
    return PropertyDetail.model_validate(payload)


@router.get("/properties/imports", response_model=PropertyImportAuditListResponse)
def list_property_imports(
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    status_filter: str | None = Query(None, alias="status"),
    dry_run: bool | None = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyImportAuditListResponse:
    base = select(PropertyImportAudit)

    if status_filter is not None:
        base = base.where(PropertyImportAudit.status == status_filter)
    if dry_run is not None:
        base = base.where(PropertyImportAudit.dry_run == dry_run)

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0

    offset = (page - 1) * limit
    audits = list(
        db.scalars(
            base.order_by(PropertyImportAudit.created_at.desc(), PropertyImportAudit.id.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )

    items = [
        PropertyImportAuditItem(
            id=a.id,
            admin_email=a.admin_email,
            filename=a.filename,
            rows_total=a.rows_total,
            rows_created=a.rows_created,
            rows_updated=a.rows_updated,
            status=str(a.status),
            duration_ms=a.duration_ms,
            created_at=a.created_at.isoformat(),
        )
        for a in audits
    ]

    return PropertyImportAuditListResponse(items=items, total=total)


@router.post("/properties/import", response_model=PropertyImportResult)
def import_properties(
    file: UploadFile = File(...),
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyImportResult:
    t0 = time.perf_counter()
    errors: list[str] = []
    lock_mode: str | None = None

    # get_current_admin performs DB reads and can start a transaction on this session.
    # We want a single, clean transaction boundary for the import.
    db.rollback()

    lock_mode = _acquire_import_lock(db)
    try:
        raw = file.file.read(MAX_BYTES + 1)
        file_size_bytes = len(raw)
        file_sha256 = hashlib.sha256(raw).hexdigest()

        existing_success = db.scalar(
            select(PropertyImportAudit.id).where(
                PropertyImportAudit.file_sha256 == file_sha256,
                PropertyImportAudit.status == "success",
            )
        )
        if existing_success is not None:
            conflict = PropertyImportResult(
                inserted=0,
                updated=0,
                errors=["File already imported successfully"],
                total_rows=0,
                dry_run=dry_run,
            )
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content=conflict.model_dump(),
            )

        audit = PropertyImportAudit(
            admin_email=_admin.email,
            filename=file.filename or "unknown",
            file_sha256=file_sha256,
            file_size_bytes=file_size_bytes,
            rows_total=0,
            rows_created=0,
            rows_updated=0,
            rows_errors=0,
            dry_run=dry_run,
            status="pending",
            duration_ms=0,
            error_summary=None,
        )

        # Audit record must be committed even if the import fails.
        db.add(audit)
        db.commit()

        # Ensure a clean transaction boundary for the import.
        db.rollback()

        if file.content_type != "text/csv":
            result = PropertyImportResult(
                inserted=0,
                updated=0,
                errors=["Invalid content-type: expected text/csv"],
                total_rows=0,
                dry_run=dry_run,
            )
            audit.status = "partial"
            audit.rows_errors = len(result.errors)
            audit.error_summary = _summarize_errors(result.errors)
            audit.duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            db.add(audit)
            db.commit()
            return result

        if file_size_bytes > MAX_BYTES:
            result = PropertyImportResult(
                inserted=0,
                updated=0,
                errors=["File exceeds maximum size limit"],
                total_rows=0,
                dry_run=dry_run,
            )
            audit.status = "partial"
            audit.rows_errors = len(result.errors)
            audit.error_summary = _summarize_errors(result.errors)
            audit.duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            db.add(audit)
            db.commit()
            return result

        try:
            text_payload = raw.decode("utf-8-sig")
        except UnicodeDecodeError:
            result = PropertyImportResult(
                inserted=0,
                updated=0,
                errors=["Invalid encoding: expected UTF-8"],
                total_rows=0,
                dry_run=dry_run,
            )
            audit.status = "partial"
            audit.rows_errors = len(result.errors)
            audit.error_summary = _summarize_errors(result.errors)
            audit.duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            db.add(audit)
            db.commit()
            return result

        reader = csv.DictReader(io.StringIO(text_payload))
        header = reader.fieldnames
        if header is None:
            result = PropertyImportResult(
                inserted=0,
                updated=0,
                errors=["Missing CSV header"],
                total_rows=0,
                dry_run=dry_run,
            )
            audit.status = "partial"
            audit.rows_errors = len(result.errors)
            audit.error_summary = _summarize_errors(result.errors)
            audit.duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            db.add(audit)
            db.commit()
            return result

        if list(header) != EXPECTED_HEADER:
            result = PropertyImportResult(
                inserted=0,
                updated=0,
                errors=["Invalid CSV header: expected " + ",".join(EXPECTED_HEADER)],
                total_rows=0,
                dry_run=dry_run,
            )
            audit.status = "partial"
            audit.rows_errors = len(result.errors)
            audit.error_summary = _summarize_errors(result.errors)
            audit.duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            db.add(audit)
            db.commit()
            return result

        rows: list[PropertyImportRow] = []
        seen_source_ids: set[str] = set()

        for row_index, raw_row in enumerate(reader, start=2):
            normalized: dict[str, object] = {}
            for key in EXPECTED_HEADER:
                value = raw_row.get(key, "")
                if value is None:
                    value = ""
                if isinstance(value, str):
                    value = value.strip()
                normalized[key] = value

            source_id = str(normalized.get("source_id") or "").strip()
            if source_id in seen_source_ids:
                errors.append(f"Row {row_index}: Duplicate source_id in CSV")
            else:
                if source_id:
                    seen_source_ids.add(source_id)

            # Optional fields: treat empty string as None
            for opt in ("bedrooms", "bathrooms", "size", "slug"):
                if normalized.get(opt) == "":
                    normalized[opt] = None

            # status: default active when blank
            if normalized.get("status") in (None, ""):
                normalized["status"] = "active"

            try:
                rows.append(PropertyImportRow.model_validate(normalized))
            except Exception as exc:  # validation error (pydantic)
                errors.append(f"Row {row_index}: {exc}")

            if len(rows) > MAX_ROWS:
                errors.append("Row limit exceeded: max 5000")
                break

        total_rows = len(rows)
        if errors:
            result = PropertyImportResult(
                inserted=0,
                updated=0,
                errors=errors,
                total_rows=total_rows,
                dry_run=dry_run,
            )
            audit.status = "partial"
            audit.rows_total = result.total_rows
            audit.rows_errors = len(result.errors)
            audit.error_summary = _summarize_errors(result.errors)
            audit.duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            db.add(audit)
            db.commit()
            return result

        inserted = 0
        updated = 0

        rows_sorted = sorted(rows, key=lambda r: r.source_id)

        dialect = getattr(getattr(db, "bind", None), "dialect", None)
        dialect_name = getattr(dialect, "name", "")

        try:
            with db.begin():
                source_ids = [r.source_id for r in rows_sorted]
                existing_source_ids: set[str] = set()

                if source_ids:
                    # SQLite has a low default max bound parameter limit; chunk deterministically.
                    chunk_size = 900 if dialect_name == "sqlite" else 5000
                    for chunk in _iter_chunks(source_ids, size=chunk_size):
                        existing_source_ids.update(
                            set(
                                db.scalars(
                                    select(Property.source_id).where(Property.source_id.in_(chunk))
                                ).all()
                            )
                        )

                for r in rows_sorted:
                    will_update = r.source_id in existing_source_ids
                    synced_at = datetime.now(timezone.utc)
                    import_meta = {
                        "source": "csv_import",
                        "filename": file.filename or "unknown",
                        "file_sha256": file_sha256,
                    }

                    values = {
                        "source_id": r.source_id,
                        "title": r.title,
                        "description": None,
                        "title_i18n": None,
                        "description_i18n": None,
                        "type": r.type,
                        "price": r.price,
                        "bedrooms": r.bedrooms,
                        "bathrooms": r.bathrooms,
                        "size": r.size,
                        "address": r.address,
                        "city": r.city,
                        "images": None,
                        "slug": r.slug,
                        "status": r.status,
                        "last_synced_at": synced_at,
                        "source_meta": import_meta,
                    }

                    set_ = {
                        "title": r.title,
                        "type": r.type,
                        "price": r.price,
                        "address": r.address,
                        "city": r.city,
                        "status": r.status,
                        "bedrooms": r.bedrooms,
                        "bathrooms": r.bathrooms,
                        "size": r.size,
                        "slug": r.slug,
                        "last_synced_at": synced_at,
                        "source_meta": import_meta,
                    }

                    if dialect_name == "postgresql":
                        stmt = pg_insert(Property).values(**values)
                        stmt = stmt.on_conflict_do_update(
                            index_elements=[Property.source_id],
                            set_=set_,
                        )
                    elif dialect_name == "sqlite":
                        stmt = sqlite_insert(Property).values(**values)
                        stmt = stmt.on_conflict_do_update(
                            index_elements=["source_id"],
                            set_=set_,
                        )
                    else:
                        raise RuntimeError("Unsupported database dialect for import")

                    db.execute(stmt)

                    if will_update:
                        updated += 1
                    else:
                        inserted += 1

                db.flush()

                if dry_run:
                    raise _DryRunRollbackError()
        except _DryRunRollbackError:
            result = PropertyImportResult(
                inserted=inserted,
                updated=updated,
                errors=[],
                total_rows=total_rows,
                dry_run=True,
            )
            audit.status = "success"
            audit.rows_total = result.total_rows
            audit.rows_created = result.inserted
            audit.rows_updated = result.updated
            audit.rows_errors = 0
            audit.error_summary = None
            audit.duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            db.add(audit)
            db.commit()
            return result
        except Exception as exc:
            db.rollback()
            result = PropertyImportResult(
                inserted=0,
                updated=0,
                errors=[f"Database error: {type(exc).__name__}"],
                total_rows=total_rows,
                dry_run=dry_run,
            )
            audit.status = "failed"
            audit.rows_total = result.total_rows
            audit.rows_created = 0
            audit.rows_updated = 0
            audit.rows_errors = len(result.errors)
            audit.error_summary = _summarize_errors(result.errors)
            audit.duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
            db.add(audit)
            db.commit()
            return result

        result = PropertyImportResult(
            inserted=inserted,
            updated=updated,
            errors=[],
            total_rows=total_rows,
            dry_run=False,
        )

        audit.status = "success"
        audit.rows_total = result.total_rows
        audit.rows_created = result.inserted
        audit.rows_updated = result.updated
        audit.rows_errors = 0
        audit.error_summary = None
        audit.duration_ms = max(1, int((time.perf_counter() - t0) * 1000))
        db.add(audit)
        db.commit()

        return result
    finally:
        _release_import_lock(db, lock_mode)


@router.get("/properties", response_model=PropertyAdminListResponse)
def admin_list_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    search: str | None = Query(default=None),
    status_filter: PropertyStatus | None = Query(default=None, alias="status"),
    listing_type: str | None = Query(default=None, alias="type"),
    project_id: UUID | None = Query(default=None),
    area_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyAdminListResponse:
    query = select(Property)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Property.title.ilike(pattern),
                Property.slug.ilike(pattern),
                Property.source_id.ilike(pattern),
                Property.address.ilike(pattern),
            )
        )
    if status_filter is not None:
        query = query.where(Property.status == status_filter.value)
    if listing_type:
        query = query.where(Property.type == listing_type)
    if project_id is not None:
        query = query.where(Property.project_id == project_id)
    if area_id is not None:
        query = query.where(Property.area_id == area_id)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(desc(Property.updated_at), desc(Property.id))
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return PropertyAdminListResponse(
        data=[_serialize_property_detail(db, row) for row in rows],
        meta=PaginationMeta(page=page, limit=limit, total=int(total)),
    )


@router.get("/properties/{property_id}", response_model=PropertyDetail)
def admin_get_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return _serialize_property_detail(db, prop)


@router.get("/properties/by/{identifier}", response_model=PropertyDetail)
def admin_get_property_by_identifier(
    identifier: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    prop = db.scalar(
        select(Property).where(or_(Property.source_id == identifier, Property.slug == identifier))
    )
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return _serialize_property_detail(db, prop)


@router.get("/properties/media-candidates", response_model=list[MediaAssetItem])
def list_property_media_candidates(
    search: str | None = Query(default=None),
    limit: int = Query(default=60, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[MediaAssetItem]:
    query = select(MediaAsset).where(MediaAsset.kind == "image", MediaAsset.status == "active")
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                MediaAsset.storage_path.ilike(pattern),
                MediaAsset.title.ilike(pattern),
                MediaAsset.source_domain.ilike(pattern),
            )
        )
    rows = db.scalars(
        query.order_by(desc(MediaAsset.created_at), desc(MediaAsset.id)).limit(limit)
    ).all()
    return [MediaAssetItem.model_validate(row) for row in rows]


@router.post("/properties/media", response_model=PropertyMediaSyncResponse)
def sync_property_media(
    payload: PropertyMediaSyncRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyMediaSyncResponse:
    updated = 0
    missing = 0
    warnings = 0

    for item in payload.items:
        media_warnings = _validate_property_media_governance(
            db,
            cover_image=item.cover_image,
            cover_image_url=item.cover_image,
            local_images=item.local_images,
            images=item.local_images,
        )
        warnings += len(media_warnings)

        prop = db.scalar(select(Property).where(Property.source_id == item.source_id))
        if prop is None:
            missing += 1
            continue

        cleaned_local_images = _coerce_string_list(item.local_images)
        prop.local_images = cleaned_local_images
        prop.cover_image = item.cover_image or (
            cleaned_local_images[0] if cleaned_local_images else None
        )
        prop.cover_image_url = prop.cover_image
        prop.last_synced_at = datetime.now(timezone.utc)

        source_meta = dict(prop.source_meta or {})
        source_meta["media_sync"] = {
            "source_id": item.source_id,
            "synced_at": prop.last_synced_at.isoformat(),
        }
        if item.source_meta is not None:
            source_meta["provided"] = item.source_meta
        prop.source_meta = source_meta

        # Backward compatibility for existing clients.
        prop.images = cleaned_local_images

        db.add(prop)
        updated += 1

    db.commit()
    return PropertyMediaSyncResponse(updated=updated, missing=missing, warnings=warnings)


@router.post("/properties/{property_id}/cover-image/ingest", response_model=PropertyDetail)
def ingest_property_cover_image(
    property_id: UUID,
    payload: PropertyCoverIngestRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    normalized_path = require_local_media_path(payload.storage_path, field_name="storage_path")
    media = db.scalar(select(MediaAsset).where(MediaAsset.storage_path == normalized_path))
    if media is None:
        checksum = hashlib.sha256(
            f"{property_id}:{time.time_ns()}:{normalized_path}".encode("utf-8")
        ).hexdigest()
        media = MediaAsset(
            storage_path=normalized_path,
            kind="image",
            mime_type="image/jpeg",
            file_size_bytes=1,
            checksum_sha256=checksum,
            source_url=payload.source_url,
            source_page_url=payload.source_page_url,
            source_domain=payload.source_domain,
            source_type=payload.source_type,
            rights_status=payload.rights_status,
            approval_status=payload.approval_status,
            rights_note=payload.rights_note,
            license_evidence_url=payload.license_evidence_url,
            status="active",
        )
        db.add(media)
        db.flush()
    else:
        if payload.source_url is not None:
            media.source_url = payload.source_url
        if payload.source_page_url is not None:
            media.source_page_url = payload.source_page_url
        if payload.source_domain is not None:
            media.source_domain = payload.source_domain
        if payload.source_type is not None:
            media.source_type = payload.source_type
        if payload.rights_status is not None:
            media.rights_status = payload.rights_status
        if payload.approval_status is not None:
            media.approval_status = payload.approval_status
        if payload.rights_note is not None:
            media.rights_note = payload.rights_note
        if payload.license_evidence_url is not None:
            media.license_evidence_url = payload.license_evidence_url

    local_images = _coerce_string_list(prop.local_images)
    if payload.append_to_gallery:
        local_images = [
            normalized_path,
            *[path for path in local_images if path != normalized_path],
        ]
    else:
        if not local_images:
            local_images = [normalized_path]
    prop.local_images = local_images
    prop.images = [path for path in _coerce_string_list(local_images) if _is_local_media_path(path)]
    prop.cover_image = normalized_path
    prop.cover_image_url = normalized_path
    prop.last_synced_at = datetime.now(timezone.utc)

    source_meta = dict(prop.source_meta or {})
    ingest_meta = source_meta.get("ingest") if isinstance(source_meta.get("ingest"), dict) else {}
    ingest_meta = dict(ingest_meta)
    ingest_meta["storage_path"] = normalized_path
    ingest_meta["media_asset_id"] = str(media.id)
    ingest_meta["ingested_at"] = prop.last_synced_at.isoformat()
    for key, value in {
        "source_url": payload.source_url,
        "source_page_url": payload.source_page_url,
        "source_domain": payload.source_domain,
        "source_type": payload.source_type,
        "rights_status": payload.rights_status,
        "approval_status": payload.approval_status,
        "rights_note": payload.rights_note,
        "license_evidence_url": payload.license_evidence_url,
    }.items():
        if value is not None:
            ingest_meta[key] = value
            source_meta[key] = value
    if payload.source_url:
        source_meta["source_url"] = payload.source_url
        source_meta["source"] = payload.source_domain or payload.source_url
    if payload.source_domain:
        source_meta["source_domain"] = payload.source_domain
        source_meta["source"] = payload.source_domain
    if payload.rights_status is not None:
        source_meta["rights_status"] = payload.rights_status
    source_meta["ingest"] = ingest_meta
    source_meta["last_checked_at"] = prop.last_synced_at.isoformat()
    prop.source_meta = source_meta

    if payload.publish_now:
        prop.status = PropertyStatus.ACTIVE.value

    warnings = _validate_property_media_governance(
        db,
        cover_image=prop.cover_image,
        cover_image_url=prop.cover_image_url,
        local_images=prop.local_images,
        images=prop.images,
    )
    _apply_canonical_legacy_alignment(prop)
    db.add(prop)
    db.add(media)
    db.commit()
    db.refresh(prop)
    return _serialize_property_detail(db, prop, warnings_override=warnings)


@router.post("/properties", response_model=PropertyDetail, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    title_i18n = _normalize_i18n_map(payload.title_i18n, field_name="title_i18n")
    description_i18n = _normalize_i18n_map(payload.description_i18n, field_name="description_i18n")
    resolved_title = _resolve_i18n_text(title_i18n, payload.title)
    resolved_description = _resolve_i18n_text(description_i18n, payload.description)
    if not resolved_title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="title is required"
        )

    _validate_relations_exist(
        db,
        project_id=payload.project_id,
        area_id=payload.area_id,
        developer_id=payload.developer_id,
    )

    warnings = _validate_property_media_governance(
        db,
        cover_image=payload.cover_image,
        cover_image_url=payload.cover_image_url,
        local_images=payload.local_images,
        images=payload.images,
    )

    tags = _normalize_tags(payload.tags)
    features = dict(payload.features or {})
    if tags is not None:
        features["tags"] = tags
    if payload.view_label is not None:
        features["view_label"] = payload.view_label

    normalized_cover_image, normalized_cover_image_url = _normalize_cover_fields(
        cover_image=payload.cover_image,
        cover_image_url=payload.cover_image_url,
    )
    next_status = payload.status.value if hasattr(payload.status, "value") else str(payload.status)
    if next_status == PropertyStatus.ACTIVE.value:
        validation_errors = validate_property_fields(
            property_type=payload.property_type,
            transaction_type=payload.type,
            price=float(payload.price) if isinstance(payload.price, Decimal) else payload.price,
            price_period=payload.price_period,
            bedrooms=payload.bedrooms,
            bathrooms=payload.bathrooms,
            size_sqm=payload.size_sqm if payload.size_sqm is not None else payload.size,
            features=features or None,
        )
        validation_errors.extend(
            _listing_quality_gate_errors(
                cover_image=normalized_cover_image,
                cover_image_url=normalized_cover_image_url,
                address=payload.address,
                city=payload.city,
                area_id=payload.area_id,
                project_id=payload.project_id,
            )
        )
        if validation_errors:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={
                    "code": "property_structured_validation_failed",
                    "errors": validation_errors,
                },
            )

    prop = Property(
        source_id=payload.source_id,
        slug=payload.slug,
        title=resolved_title,
        description=resolved_description,
        title_i18n=title_i18n,
        description_i18n=description_i18n,
        type=payload.type.value if hasattr(payload.type, "value") else str(payload.type),
        property_type=payload.property_type,
        status=next_status,
        price=payload.price,
        currency=payload.currency,
        price_period=payload.price_period,
        bedrooms=payload.bedrooms,
        bathrooms=payload.bathrooms,
        size=payload.size or payload.size_sqm,
        size_sqm=payload.size_sqm or payload.size,
        floor=payload.floor,
        floor_number=payload.floor,
        floors=payload.floors,
        furnishing=payload.furnishing,
        view=payload.view,
        address=payload.address,
        city=payload.city,
        area_id=payload.area_id,
        project_id=payload.project_id,
        developer_id=payload.developer_id,
        cover_image=normalized_cover_image,
        cover_image_url=normalized_cover_image_url,
        local_images=_coerce_string_list(payload.local_images),
        images=[path for path in _coerce_string_list(payload.images) if _is_local_media_path(path)],
        features=features or None,
        source_meta=payload.source_meta,
        last_synced_at=payload.last_synced_at,
    )
    _apply_canonical_legacy_alignment(prop)
    db.add(prop)
    _commit_or_conflict(db, detail="A property with this slug already exists.")
    db.refresh(prop)
    return _serialize_property_detail(db, prop, warnings_override=warnings)


@router.patch("/properties/{property_id}", response_model=PropertyDetail)
def update_property(
    property_id: UUID,
    payload: PropertyUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    old_slug = str(prop.slug or "").strip()

    data = payload.model_dump(exclude_unset=True)

    if "title_i18n" in data:
        data["title_i18n"] = _normalize_i18n_map(data.get("title_i18n"), field_name="title_i18n")
    if "description_i18n" in data:
        data["description_i18n"] = _normalize_i18n_map(
            data.get("description_i18n"),
            field_name="description_i18n",
        )

    _validate_relations_exist(
        db,
        project_id=data.get("project_id", prop.project_id),
        area_id=data.get("area_id", prop.area_id),
        developer_id=data.get("developer_id", prop.developer_id),
    )

    warnings = _validate_property_media_governance(
        db,
        cover_image=data.get("cover_image", prop.cover_image),
        cover_image_url=data.get("cover_image_url", prop.cover_image_url),
        local_images=data.get("local_images", prop.local_images),
        images=data.get("images", prop.images),
    )
    next_status_raw = data.get("status", prop.status)
    next_status = (
        next_status_raw.value if hasattr(next_status_raw, "value") else str(next_status_raw)
    )
    if next_status == PropertyStatus.ACTIVE.value:
        validation_errors = validate_property_fields(
            property_type=data.get("property_type", prop.property_type),
            transaction_type=data.get("type", prop.type),
            price=data.get(
                "price", float(prop.price) if isinstance(prop.price, Decimal) else prop.price
            ),
            price_period=data.get("price_period", prop.price_period),
            bedrooms=data.get("bedrooms", prop.bedrooms),
            bathrooms=data.get("bathrooms", prop.bathrooms),
            size_sqm=(
                data.get("size_sqm")
                if data.get("size_sqm") is not None
                else data.get("size")
                if data.get("size") is not None
                else float(prop.size_sqm or prop.size)
                if (prop.size_sqm or prop.size)
                else None
            ),
            features=prop.features,
        )
        validation_errors.extend(
            _listing_quality_gate_errors(
                cover_image=data.get("cover_image", prop.cover_image),
                cover_image_url=data.get("cover_image_url", prop.cover_image_url),
                address=data.get("address", prop.address),
                city=data.get("city", prop.city),
                area_id=data.get("area_id", prop.area_id),
                project_id=data.get("project_id", prop.project_id),
            )
        )
        if validation_errors:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={
                    "code": "property_structured_validation_failed",
                    "errors": validation_errors,
                },
            )

    if "tags" in data:
        features = dict(prop.features or {})
        tags = _normalize_tags(data.get("tags"))
        if tags is None:
            features.pop("tags", None)
        else:
            features["tags"] = tags
        prop.features = features or None

    if "view_label" in data:
        features = dict(prop.features or {})
        view_label = data.get("view_label")
        if view_label is None:
            features.pop("view_label", None)
        else:
            features["view_label"] = str(view_label).strip()
        prop.features = features or None

    if "title_i18n" in data or "title" in data:
        prop.title = (
            _resolve_i18n_text(
                data.get("title_i18n", prop.title_i18n),
                data.get("title", prop.title),
            )
            or prop.title
        )

    if "description_i18n" in data or "description" in data:
        prop.description = _resolve_i18n_text(
            data.get("description_i18n", prop.description_i18n),
            data.get("description", prop.description),
        )

    for field, value in data.items():
        if field in {"tags", "view_label"}:
            continue
        if field == "images" and value is not None:
            value = [path for path in _coerce_string_list(value) if _is_local_media_path(path)]
        if field == "local_images" and value is not None:
            value = _coerce_string_list(value)
        setattr(prop, field, value)

    _apply_canonical_legacy_alignment(prop)
    if "slug" in data and data["slug"] is not None:
        upsert_slug_redirects(
            db,
            entity="property",
            old_slug=old_slug,
            new_slug=str(prop.slug or "").strip(),
        )

    db.add(prop)
    _commit_or_conflict(db, detail="A property with this slug already exists.")
    db.refresh(prop)
    return _serialize_property_detail(db, prop, warnings_override=warnings)


@router.post("/properties/{property_id}/publish", response_model=PropertyPublishResponse)
def publish_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyPublishResponse:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    warnings = _validate_property_media_governance(
        db,
        cover_image=prop.cover_image,
        cover_image_url=prop.cover_image_url,
        local_images=prop.local_images,
        images=prop.images,
    )

    validation_errors = validate_property_fields(
        property_type=prop.property_type,
        transaction_type=prop.type,
        price=float(prop.price) if isinstance(prop.price, Decimal) else prop.price,
        price_period=prop.price_period,
        bedrooms=prop.bedrooms,
        bathrooms=prop.bathrooms,
        size_sqm=float(prop.size_sqm or prop.size) if (prop.size_sqm or prop.size) else None,
        features=prop.features,
    )
    validation_errors.extend(
        _listing_quality_gate_errors(
            cover_image=prop.cover_image,
            cover_image_url=prop.cover_image_url,
            address=prop.address,
            city=prop.city,
            area_id=prop.area_id,
            project_id=prop.project_id,
        )
    )
    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "property_structured_validation_failed", "errors": validation_errors},
        )

    _apply_canonical_legacy_alignment(prop)

    prop.status = PropertyStatus.ACTIVE.value
    db.add(prop)
    db.commit()
    db.refresh(prop)

    return PropertyPublishResponse(
        property=_serialize_property_detail(db, prop, warnings_override=warnings),
        published=True,
    )


@router.post("/properties/{property_id}/unpublish", response_model=PropertyDetail)
def unpublish_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    prop.status = PropertyStatus.INACTIVE.value
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return _serialize_property_detail(db, prop)


@router.post("/properties/bulk/status", response_model=PropertyBulkStatusResponse)
def bulk_update_property_status(
    payload: PropertyBulkStatusRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyBulkStatusResponse:
    if not payload.property_ids:
        return PropertyBulkStatusResponse(updated=0)

    rows = db.scalars(select(Property).where(Property.id.in_(payload.property_ids))).all()
    row_map = {row.id: row for row in rows}

    if payload.status == PropertyStatus.ACTIVE:
        for property_id in payload.property_ids:
            row = row_map.get(property_id)
            if row is None:
                continue
            _validate_property_media_governance(
                db,
                cover_image=row.cover_image,
                cover_image_url=row.cover_image_url,
                local_images=row.local_images,
                images=row.images,
            )
            validation_errors = validate_property_fields(
                property_type=row.property_type,
                transaction_type=row.type,
                price=float(row.price) if isinstance(row.price, Decimal) else row.price,
                price_period=row.price_period,
                bedrooms=row.bedrooms,
                bathrooms=row.bathrooms,
                size_sqm=float(row.size_sqm or row.size) if (row.size_sqm or row.size) else None,
                features=row.features,
            )
            validation_errors.extend(
                _listing_quality_gate_errors(
                    cover_image=row.cover_image,
                    cover_image_url=row.cover_image_url,
                    address=row.address,
                    city=row.city,
                    area_id=row.area_id,
                    project_id=row.project_id,
                )
            )
            if validation_errors:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail={
                        "code": "property_structured_validation_failed",
                        "errors": validation_errors,
                    },
                )

    updated = 0
    for property_id in payload.property_ids:
        row = row_map.get(property_id)
        if row is None:
            continue
        row.status = payload.status.value
        db.add(row)
        updated += 1

    db.commit()
    return PropertyBulkStatusResponse(updated=updated)


@router.post("/properties/bulk/tags", response_model=PropertyBulkStatusResponse)
def bulk_update_property_tags(
    payload: PropertyBulkTagsRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyBulkStatusResponse:
    if not payload.property_ids:
        return PropertyBulkStatusResponse(updated=0)

    operation = str(payload.operation).strip().lower()
    if operation not in {"add", "remove", "set"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="operation must be one of add/remove/set",
        )

    incoming_tags = _normalize_tags(payload.tags) or []
    rows = db.scalars(select(Property).where(Property.id.in_(payload.property_ids))).all()
    row_map = {row.id: row for row in rows}

    updated = 0
    for property_id in payload.property_ids:
        row = row_map.get(property_id)
        if row is None:
            continue

        features = dict(row.features or {})
        existing = _extract_tags(features) or []

        if operation == "set":
            next_tags = incoming_tags
        elif operation == "add":
            next_tags = list(existing)
            for tag in incoming_tags:
                if tag not in next_tags:
                    next_tags.append(tag)
        else:
            remove_set = set(incoming_tags)
            next_tags = [tag for tag in existing if tag not in remove_set]

        if next_tags:
            features["tags"] = next_tags
        else:
            features.pop("tags", None)

        row.features = features or None
        db.add(row)
        updated += 1

    db.commit()
    return PropertyBulkStatusResponse(updated=updated)


@router.post("/properties/bulk/update", response_model=PropertyBulkStatusResponse)
def bulk_update_properties(
    payload: PropertyBulkUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyBulkStatusResponse:
    if not payload.property_ids:
        return PropertyBulkStatusResponse(updated=0)

    data = payload.fields.model_dump(exclude_unset=True)
    if not data:
        return PropertyBulkStatusResponse(updated=0)

    allowed_fields = {
        "status",
        "type",
        "property_type",
        "price",
        "currency",
        "price_period",
        "bedrooms",
        "bathrooms",
        "size",
        "size_sqm",
        "view",
        "address",
        "city",
        "project_id",
        "area_id",
        "developer_id",
        "cover_image",
        "cover_image_url",
        "local_images",
        "images",
        "tags",
        "view_label",
        "title",
        "title_i18n",
        "description",
        "description_i18n",
        "source_meta",
        "last_synced_at",
    }
    disallowed = sorted(field for field in data if field not in allowed_fields)
    if disallowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"bulk update fields not allowed: {', '.join(disallowed)}",
        )

    if "title_i18n" in data:
        data["title_i18n"] = _normalize_i18n_map(data.get("title_i18n"), field_name="title_i18n")
    if "description_i18n" in data:
        data["description_i18n"] = _normalize_i18n_map(
            data.get("description_i18n"),
            field_name="description_i18n",
        )

    rows = db.scalars(select(Property).where(Property.id.in_(payload.property_ids))).all()
    row_map = {row.id: row for row in rows}

    updated = 0
    for property_id in payload.property_ids:
        row = row_map.get(property_id)
        if row is None:
            continue

        _validate_relations_exist(
            db,
            project_id=data.get("project_id", row.project_id),
            area_id=data.get("area_id", row.area_id),
            developer_id=data.get("developer_id", row.developer_id),
        )

        _validate_property_media_governance(
            db,
            cover_image=data.get("cover_image", row.cover_image),
            cover_image_url=data.get("cover_image_url", row.cover_image_url),
            local_images=data.get("local_images", row.local_images),
            images=data.get("images", row.images),
        )

        next_status = data.get("status", row.status)
        if next_status == PropertyStatus.ACTIVE.value:
            validation_errors = validate_property_fields(
                property_type=data.get("property_type", row.property_type),
                transaction_type=data.get("type", row.type),
                price=data.get(
                    "price", float(row.price) if isinstance(row.price, Decimal) else row.price
                ),
                price_period=data.get("price_period", row.price_period),
                bedrooms=data.get("bedrooms", row.bedrooms),
                bathrooms=data.get("bathrooms", row.bathrooms),
                size_sqm=(
                    data.get("size_sqm")
                    if data.get("size_sqm") is not None
                    else data.get("size")
                    if data.get("size") is not None
                    else float(row.size_sqm or row.size)
                    if (row.size_sqm or row.size)
                    else None
                ),
                features=data.get("features", row.features),
            )
            validation_errors.extend(
                _listing_quality_gate_errors(
                    cover_image=data.get("cover_image", row.cover_image),
                    cover_image_url=data.get("cover_image_url", row.cover_image_url),
                    address=data.get("address", row.address),
                    city=data.get("city", row.city),
                    area_id=data.get("area_id", row.area_id),
                    project_id=data.get("project_id", row.project_id),
                )
            )
            if validation_errors:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail={
                        "code": "property_structured_validation_failed",
                        "errors": validation_errors,
                    },
                )

        if "tags" in data:
            features = dict(row.features or {})
            tags = _normalize_tags(data.get("tags"))
            if tags is None:
                features.pop("tags", None)
            else:
                features["tags"] = tags
            row.features = features or None

        if "view_label" in data:
            features = dict(row.features or {})
            view_label = data.get("view_label")
            if view_label is None:
                features.pop("view_label", None)
            else:
                features["view_label"] = str(view_label).strip()
            row.features = features or None

        if "title_i18n" in data or "title" in data:
            row.title = (
                _resolve_i18n_text(
                    data.get("title_i18n", row.title_i18n),
                    data.get("title", row.title),
                )
                or row.title
            )

        if "description_i18n" in data or "description" in data:
            row.description = _resolve_i18n_text(
                data.get("description_i18n", row.description_i18n),
                data.get("description", row.description),
            )

        for field, value in data.items():
            if field in {"tags", "view_label"}:
                continue
            if field == "images" and value is not None:
                value = [path for path in _coerce_string_list(value) if _is_local_media_path(path)]
            if field == "local_images" and value is not None:
                value = _coerce_string_list(value)
            setattr(row, field, value)

        _apply_canonical_legacy_alignment(row)
        db.add(row)
        updated += 1

    _commit_or_conflict(db, detail="A property with this slug already exists.")
    return PropertyBulkStatusResponse(updated=updated)


@router.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    db.delete(prop)
    db.commit()


@router.post("/company", response_model=CompanyInfoItem, status_code=status.HTTP_201_CREATED)
def create_company_info(
    payload: CompanyInfoCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CompanyInfoItem:
    info = CompanyInfo(**payload.model_dump())
    db.add(info)
    _commit_or_conflict(db, detail="Company info with this slug already exists.")
    db.refresh(info)
    return CompanyInfoItem.model_validate(info)


@router.get("/company", response_model=CompanyListResponse)
def list_company_info(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CompanyListResponse:
    rows = db.scalars(select(CompanyInfo).order_by(CompanyInfo.slug.asc())).all()
    items = [CompanyInfoItem.model_validate(row) for row in rows]
    if all(item.slug != _SITE_LAYOUT_CMS_SLUG for item in items):
        items.append(_site_layout_company_info_fallback())
        items.sort(key=lambda item: item.slug)
    return CompanyListResponse(data=items)


@router.get("/company/{slug}", response_model=CompanyInfoItem)
def get_company_info(
    slug: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CompanyInfoItem:
    row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == slug))
    if row is None:
        if slug == _SITE_LAYOUT_CMS_SLUG:
            return _site_layout_company_info_fallback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company info not found")
    return CompanyInfoItem.model_validate(row)


@router.patch("/company/{slug}", response_model=CompanyInfoItem)
def update_company_info(
    slug: str,
    payload: CompanyInfoUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CompanyInfoItem:
    info = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == slug))
    if info is None:
        if slug != _SITE_LAYOUT_CMS_SLUG:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Company info not found"
            )
        info = _materialize_site_layout_company_info(payload)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(info, field, value)

    db.add(info)
    _commit_or_conflict(db, detail="Company info with this slug already exists.")
    db.refresh(info)
    return CompanyInfoItem.model_validate(info)


@router.get("/team-members", response_model=TeamMemberListResponse)
def list_team_members(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TeamMemberListResponse:
    rows = db.scalars(
        select(TeamMember)
        .where(TeamMember.deleted_at.is_(None))
        .order_by(TeamMember.display_order.asc(), TeamMember.name.asc())
    ).all()
    return TeamMemberListResponse(data=[TeamMemberItem.model_validate(row) for row in rows])


@router.post("/team-members", response_model=TeamMemberItem, status_code=status.HTTP_201_CREATED)
def create_team_member(
    payload: TeamMemberCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TeamMemberItem:
    data = payload.model_dump()
    photo_url = data.get("photo_url")
    if photo_url is not None:
        data["photo_url"] = require_local_media_path(photo_url, field_name="photo_url")
    row = TeamMember(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return TeamMemberItem.model_validate(row)


@router.get("/team-members/{member_id}", response_model=TeamMemberItem)
def get_team_member(
    member_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TeamMemberItem:
    row = db.get(TeamMember, member_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    return TeamMemberItem.model_validate(row)


@router.patch("/team-members/{member_id}", response_model=TeamMemberItem)
def update_team_member(
    member_id: UUID,
    payload: TeamMemberUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TeamMemberItem:
    row = db.get(TeamMember, member_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")

    updates = payload.model_dump(exclude_unset=True)
    if "photo_url" in updates and updates["photo_url"] is not None:
        updates["photo_url"] = require_local_media_path(
            updates["photo_url"], field_name="photo_url"
        )
    for field, value in updates.items():
        setattr(row, field, value)

    db.add(row)
    db.commit()
    db.refresh(row)
    return TeamMemberItem.model_validate(row)


@router.post("/team-members/{member_id}/publish", response_model=TeamMemberItem)
def publish_team_member(
    member_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TeamMemberItem:
    row = db.get(TeamMember, member_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    row.status = "active"
    db.add(row)
    db.commit()
    db.refresh(row)
    return TeamMemberItem.model_validate(row)


@router.post("/team-members/{member_id}/unpublish", response_model=TeamMemberItem)
def unpublish_team_member(
    member_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TeamMemberItem:
    row = db.get(TeamMember, member_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    row.status = "draft"
    db.add(row)
    db.commit()
    db.refresh(row)
    return TeamMemberItem.model_validate(row)


@router.delete("/team-members/{member_id}")
def delete_team_member(
    member_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(TeamMember, member_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")
    row.deleted_at = datetime.now(timezone.utc)
    db.add(row)
    db.commit()
    return {"deleted": True}


@router.get("/testimonials", response_model=TestimonialListResponse)
def list_testimonials(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TestimonialListResponse:
    rows = db.scalars(
        select(Testimonial)
        .where(Testimonial.deleted_at.is_(None))
        .order_by(Testimonial.display_order.asc(), Testimonial.created_at.desc())
    ).all()
    return TestimonialListResponse(data=[TestimonialItem.model_validate(row) for row in rows])


@router.post("/testimonials", response_model=TestimonialItem, status_code=status.HTTP_201_CREATED)
def create_testimonial(
    payload: TestimonialCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TestimonialItem:
    row = Testimonial(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return TestimonialItem.model_validate(row)


@router.get("/testimonials/{testimonial_id}", response_model=TestimonialItem)
def get_testimonial(
    testimonial_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TestimonialItem:
    row = db.get(Testimonial, testimonial_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")
    return TestimonialItem.model_validate(row)


@router.patch("/testimonials/{testimonial_id}", response_model=TestimonialItem)
def update_testimonial(
    testimonial_id: UUID,
    payload: TestimonialUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TestimonialItem:
    row = db.get(Testimonial, testimonial_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(row, field, value)

    db.add(row)
    db.commit()
    db.refresh(row)
    return TestimonialItem.model_validate(row)


@router.post("/testimonials/{testimonial_id}/publish", response_model=TestimonialItem)
def publish_testimonial(
    testimonial_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TestimonialItem:
    row = db.get(Testimonial, testimonial_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")
    row.status = "published"
    db.add(row)
    db.commit()
    db.refresh(row)
    return TestimonialItem.model_validate(row)


@router.post("/testimonials/{testimonial_id}/unpublish", response_model=TestimonialItem)
def unpublish_testimonial(
    testimonial_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TestimonialItem:
    row = db.get(Testimonial, testimonial_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")
    row.status = "draft"
    db.add(row)
    db.commit()
    db.refresh(row)
    return TestimonialItem.model_validate(row)


@router.delete("/testimonials/{testimonial_id}")
def delete_testimonial(
    testimonial_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(Testimonial, testimonial_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonial not found")
    row.deleted_at = datetime.now(timezone.utc)
    db.add(row)
    db.commit()
    return {"deleted": True}
