from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import AuditLog, Booking, Property
from packages.core.schemas.booking import AvailabilityResponse, BookingCreateRequest, BookingItem

router = APIRouter(prefix="/v1", tags=["booking"])


def _validate_range(start_at: datetime, end_at: datetime) -> None:
    if end_at <= start_at:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_at must be after start_at",
        )


def _overlap_filter(*, start_at: datetime, end_at: datetime):
    # Overlap if start < existing_end and end > existing_start.
    return and_(Booking.start_at < end_at, Booking.end_at > start_at)


@router.get("/availability", response_model=AvailabilityResponse)
def get_availability(
    property_id: UUID,
    start_at: datetime,
    end_at: datetime,
    db: Session = Depends(get_db),
) -> AvailabilityResponse:
    _validate_range(start_at, end_at)

    # Confirm property exists if provided; keeps behavior explicit.
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    # We only need a boolean + count. Compute count deterministically.
    conflict_count = db.scalars(
        select(Booking.id)
        .where(
            Booking.property_id == property_id,
            Booking.status.in_(["requested", "confirmed"]),
            _overlap_filter(start_at=start_at, end_at=end_at),
        )
        .order_by(Booking.start_at.asc(), Booking.id.asc())
    ).all()

    return AvailabilityResponse(
        property_id=property_id,
        start_at=start_at,
        end_at=end_at,
        available=len(conflict_count) == 0,
        conflicts=len(conflict_count),
    )


@router.post("/bookings", response_model=BookingItem, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateRequest,
    response: Response,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
) -> BookingItem:
    _validate_range(payload.start_at, payload.end_at)

    if payload.property_id is not None:
        prop = db.get(Property, payload.property_id)
        if prop is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    if idempotency_key:
        existing = db.scalar(select(Booking).where(Booking.idempotency_key == idempotency_key))
        if existing is not None:
            response.headers["X-Booking-Idempotent"] = "true"
            return BookingItem.model_validate(existing)

    # Minimal availability guard: do not allow overlapping bookings for same property.
    # Use FOR UPDATE to acquire row-level locks, preventing TOCTOU race between
    # the overlap check and insert in concurrent requests.
    if payload.property_id is not None:
        overlap = db.scalar(
            select(Booking)
            .where(
                Booking.property_id == payload.property_id,
                Booking.status.in_(["requested", "confirmed"]),
                _overlap_filter(start_at=payload.start_at, end_at=payload.end_at),
            )
            .order_by(Booking.start_at.asc(), Booking.id.asc())
            .limit(1)
            .with_for_update()
        )
        if overlap is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Time range unavailable",
            )

    row = Booking(
        property_id=payload.property_id,
        inquiry_id=payload.inquiry_id,
        idempotency_key=idempotency_key,
        start_at=payload.start_at,
        end_at=payload.end_at,
        guests=payload.guests,
        notes=payload.notes,
        status="requested",
    )
    db.add(row)

    # Best-effort CRM sync marker: audit log on inquiry if provided.
    if payload.inquiry_id is not None:
        db.add(
            AuditLog(
                actor_user_id=None,
                entity_type="inquiry",
                entity_id=str(payload.inquiry_id),
                action="booking_requested",
                diff={
                    "property_id": str(payload.property_id) if payload.property_id else None,
                    "start_at": payload.start_at.isoformat(),
                    "end_at": payload.end_at.isoformat(),
                },
                user_agent=None,
            )
        )

    db.commit()
    db.refresh(row)
    response.headers["X-Booking-Idempotent"] = "false"
    return BookingItem.model_validate(row)


@router.get("/bookings/{booking_id}", response_model=BookingItem)
def get_booking(booking_id: UUID, db: Session = Depends(get_db)) -> BookingItem:
    row = db.get(Booking, booking_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return BookingItem.model_validate(row)

