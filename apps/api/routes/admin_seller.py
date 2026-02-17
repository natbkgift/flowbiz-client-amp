from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import Property, SellerSubmission, User
from packages.core.schemas.property_api import PropertyStatus, PropertyType
from packages.core.schemas.seller import SellerStatusUpdate, SellerSubmissionItem

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/seller-submissions", response_model=list[SellerSubmissionItem])
async def list_submissions(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[SellerSubmissionItem]:
    rows = db.scalars(
        select(SellerSubmission).order_by(desc(SellerSubmission.created_at)).limit(200)
    ).all()
    return [SellerSubmissionItem.model_validate(r) for r in rows]


@router.patch("/seller-submissions/{submission_id}", response_model=SellerSubmissionItem)
async def update_submission(
    submission_id: UUID,
    payload: SellerStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> SellerSubmissionItem:
    row = db.get(SellerSubmission, submission_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    row.status = payload.status
    db.add(row)
    db.commit()
    db.refresh(row)
    return SellerSubmissionItem.model_validate(row)


@router.post("/seller-submissions/{submission_id}/approve", status_code=status.HTTP_201_CREATED)
async def approve_submission(
    submission_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(SellerSubmission, submission_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    # Convert to a draft/inactive property listing.
    source_id = f"seller:{row.id}"
    existing = db.scalar(select(Property).where(Property.source_id == source_id))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Property already created")

    prop = Property(
        source_id=source_id,
        title=row.location or f"Seller Listing {row.id}",
        description=row.notes,
        type=PropertyType.RESALE.value,
        price=row.asking_price or 0,
        bedrooms=None,
        bathrooms=None,
        size=None,
        address=row.location or "Pattaya",
        city="Pattaya",
        images=None,
        local_images=None,
        cover_image=None,
        slug=None,
        status=PropertyStatus.INACTIVE.value,
    )
    row.status = "approved"
    db.add(prop)
    db.add(row)
    db.commit()
    db.refresh(prop)

    return {"property_id": str(prop.id)}
