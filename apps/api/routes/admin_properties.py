import csv
import io
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.params import File
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import CompanyInfo, Property, User
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


@router.post("/properties/import", response_model=PropertyImportResult)
async def import_properties(
    file: UploadFile = File(...),
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PropertyImportResult:
    errors: list[str] = []

    # get_current_admin performs DB reads and can start a transaction on this session.
    # We want a single, clean transaction boundary for the import.
    db.rollback()

    if file.content_type != "text/csv":
        return PropertyImportResult(
            inserted=0,
            updated=0,
            errors=["Invalid content-type: expected text/csv"],
            total_rows=0,
            dry_run=dry_run,
        )

    raw = await file.read()
    if len(raw) > MAX_BYTES:
        return PropertyImportResult(
            inserted=0,
            updated=0,
            errors=["File too large: max 5MB"],
            total_rows=0,
            dry_run=dry_run,
        )

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        return PropertyImportResult(
            inserted=0,
            updated=0,
            errors=["Invalid encoding: expected UTF-8"],
            total_rows=0,
            dry_run=dry_run,
        )

    reader = csv.DictReader(io.StringIO(text))
    header = reader.fieldnames
    if header is None:
        return PropertyImportResult(
            inserted=0,
            updated=0,
            errors=["Missing CSV header"],
            total_rows=0,
            dry_run=dry_run,
        )

    if list(header) != EXPECTED_HEADER:
        return PropertyImportResult(
            inserted=0,
            updated=0,
            errors=[
                "Invalid CSV header: expected " + ",".join(EXPECTED_HEADER),
            ],
            total_rows=0,
            dry_run=dry_run,
        )

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
        return PropertyImportResult(
            inserted=0,
            updated=0,
            errors=errors,
            total_rows=total_rows,
            dry_run=dry_run,
        )

    inserted = 0
    updated = 0

    # Deterministic processing order
    rows_sorted = sorted(rows, key=lambda r: r.source_id)

    try:
        with db.begin():
            for r in rows_sorted:
                existing = db.scalar(select(Property).where(Property.source_id == r.source_id))

                payload = {
                    "source_id": r.source_id,
                    "title": r.title,
                    "description": None,
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
                }

                if existing is None:
                    db.add(Property(**payload))
                    inserted += 1
                else:
                    for field, value in payload.items():
                        setattr(existing, field, value)
                    db.add(existing)
                    updated += 1

            db.flush()

            if dry_run:
                raise _DryRunRollbackError()

    except _DryRunRollbackError:
        return PropertyImportResult(
            inserted=inserted,
            updated=updated,
            errors=[],
            total_rows=total_rows,
            dry_run=True,
        )
    except Exception as exc:
        # Transaction is rolled back on exception.
        return PropertyImportResult(
            inserted=0,
            updated=0,
            errors=[f"Database error: {type(exc).__name__}"],
            total_rows=total_rows,
            dry_run=dry_run,
        )

    return PropertyImportResult(
        inserted=inserted,
        updated=updated,
        errors=[],
        total_rows=total_rows,
        dry_run=False,
    )


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
