import csv
import hashlib
import io
import time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.params import File
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import CompanyInfo, Property, PropertyImportAudit, User
from packages.core.schemas.property_api import (
    CompanyInfoCreate,
    CompanyInfoItem,
    CompanyInfoUpdate,
    PropertyCreate,
    PropertyDetail,
    PropertyUpdate,
)
from packages.core.schemas.property_import import PropertyImportResult, PropertyImportRow

router = APIRouter(prefix="/admin", tags=["admin"])


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


class _DryRunRollbackError(Exception):
    pass


def _commit_or_conflict(db: Session, *, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc


def _summarize_errors(errors: list[str]) -> str | None:
    if not errors:
        return None
    return "\n".join(errors[:5])


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


@router.get("/properties/imports", response_model=PropertyImportAuditListResponse)
async def list_property_imports(
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
async def import_properties(
    file: UploadFile = File(...),
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyImportResult:
    t0 = time.perf_counter()
    errors: list[str] = []
    result: PropertyImportResult

    # get_current_admin performs DB reads and can start a transaction on this session.
    # We want a single, clean transaction boundary for the import.
    db.rollback()

    raw = await file.read(MAX_BYTES + 1)
    file_size_bytes = len(raw)
    file_sha256 = hashlib.sha256(raw).hexdigest()

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

    # SQLAlchemy sessions autobegin a new transaction on SELECT/refresh.
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
        text = raw.decode("utf-8-sig")
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

    reader = csv.DictReader(io.StringIO(text))
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
            errors=[
                "Invalid CSV header: expected " + ",".join(EXPECTED_HEADER),
            ],
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

    # Deterministic processing order
    rows_sorted = sorted(rows, key=lambda r: r.source_id)

    try:
        with db.begin():
            for r in rows_sorted:
                existing = db.scalar(select(Property).where(Property.source_id == r.source_id))

                payload_common = {
                    "source_id": r.source_id,
                    "title": r.title,
                    "type": r.type,
                    "price": r.price,
                    "bedrooms": r.bedrooms,
                    "bathrooms": r.bathrooms,
                    "size": r.size,
                    "address": r.address,
                    "city": r.city,
                    "slug": r.slug,
                    "status": r.status,
                }

                if existing is None:
                    payload_insert = {
                        **payload_common,
                        "description": None,
                        "images": None,
                    }
                    db.add(Property(**payload_insert))
                    inserted += 1
                else:
                    # Preserve non-CSV fields (do not wipe existing data)
                    # Only update fields present in CSV
                    for field, value in payload_common.items():
                        setattr(existing, field, value)
                    db.add(existing)
                    updated += 1

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
        # Transaction is rolled back on exception.
        # Ensure the session is usable and does not revert audit updates.
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


@router.post("/properties", response_model=PropertyDetail, status_code=status.HTTP_201_CREATED)
async def create_property(
    payload: PropertyCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    prop = Property(**payload.model_dump())
    db.add(prop)
    _commit_or_conflict(db, detail="A property with this slug already exists.")
    db.refresh(prop)
    return PropertyDetail.model_validate(prop)


@router.patch("/properties/{property_id}", response_model=PropertyDetail)
async def update_property(
    property_id: UUID,
    payload: PropertyUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyDetail:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)

    db.add(prop)
    _commit_or_conflict(db, detail="A property with this slug already exists.")
    db.refresh(prop)
    return PropertyDetail.model_validate(prop)


@router.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
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
async def create_company_info(
    payload: CompanyInfoCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CompanyInfoItem:
    info = CompanyInfo(**payload.model_dump())
    db.add(info)
    _commit_or_conflict(db, detail="Company info with this slug already exists.")
    db.refresh(info)
    return CompanyInfoItem.model_validate(info)


@router.patch("/company/{slug}", response_model=CompanyInfoItem)
async def update_company_info(
    slug: str,
    payload: CompanyInfoUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CompanyInfoItem:
    info = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == slug))
    if info is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company info not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(info, field, value)

    db.add(info)
    _commit_or_conflict(db, detail="Company info with this slug already exists.")
    db.refresh(info)
    return CompanyInfoItem.model_validate(info)
