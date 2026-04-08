from __future__ import annotations

import hashlib
import re
from datetime import UTC, datetime, timedelta
from urllib.parse import parse_qs, urlparse
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from packages.core.audit import write_audit_log
from packages.core.crm_contact_actions import build_contact_action_urls
from packages.core.crm_follow_up import CANONICAL_FOLLOW_UP_STATUSES
from packages.core.database import get_db
from packages.core.models import Booking, Inquiry, Property, Viewing
from packages.core.sales_automation import (
    build_advisor_summary_note,
    build_sales_automation_snapshot,
)
from packages.core.schemas.crm import (
    BookingItem,
    InquiryItem,
    SalesAutomationFollowUpStepItem,
    SalesAutomationItem,
    ViewingItem,
)

router = APIRouter(prefix="/v1", tags=["crm"])


class InquiryCreate(BaseModel):
    name: str
    property_id: UUID | None = None
    email: str | None = None
    phone: str | None = None
    message: str
    source_page: str | None = None
    intent: str = "general"
    budget_band: str | None = None
    timeline: str | None = None
    persona: str | None = None
    tags: list[str] | None = None
    locale: str | None = None
    lead_type: str | None = None
    offer_family: str | None = None
    inventory_source: str | None = None
    source_platform: str | None = None
    campaign_name: str | None = None
    call_requested: str | bool | None = None
    lead_score: int | None = None
    lead_tier: str | None = None


class ViewingCreate(BaseModel):
    inquiry_id: UUID
    scheduled_at: datetime
    notes: str | None = None


class BookingCreate(BaseModel):
    property_id: UUID | None = None
    inquiry_id: UUID | None = None
    start_at: datetime
    end_at: datetime | None = None
    duration_minutes: int | None = 60
    guests: int | None = None
    notes: str | None = None
    idempotency_key: str | None = None


def _hash_text(value: str | None) -> str | None:
    text = str(value or "").strip().lower()
    if not text:
        return None
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


_ALLOWED_LEAD_TYPES = {"buyer", "renter", "investor", "owner", "developer", "undecided"}
_ALLOWED_OFFER_FAMILIES = {
    "new_project",
    "resale",
    "rental",
    "discovery",
    "owner_service",
    "developer_partnership",
}
_ALLOWED_INVENTORY_SOURCES = {"developer_new", "owner_resale", "owner_rental", "unknown"}
_ALLOWED_SOURCE_PLATFORMS = {"fb", "ig", "wa", "google", "website", "other"}
_ALLOWED_LOCALES = {"th", "en"}
_ALLOWED_LEAD_TIERS = {"hot", "warm", "cool", "cold"}


def _normalize_token(value: str | None) -> str | None:
    text = str(value or "").strip().lower()
    if not text:
        return None
    text = re.sub(r"[\s\-]+", "_", text)
    text = re.sub(r"[^a-z0-9_]", "", text)
    return text or None


def _normalize_campaign_name(value: str | None) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    text = re.sub(r"\s+", "_", text)
    text = text.replace(":", "-")
    return text[:128]


def _normalize_call_requested(value: str | bool | None) -> str | None:
    if isinstance(value, bool):
        return "yes" if value else "no"
    text = _normalize_token(str(value or ""))
    if not text:
        return None
    if text in {"yes", "y", "true", "1"}:
        return "yes"
    if text in {"no", "n", "false", "0"}:
        return "no"
    return None


def _extract_tag_value(tags: list[str] | None, prefix: str) -> str | None:
    for raw in tags or []:
        text = str(raw or "").strip()
        if not text.startswith(prefix):
            continue
        value = text.split(":", 1)[1].strip()
        return value or None
    return None


def _normalize_source_page(value: str | None) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None

    parsed = urlparse(text)
    path = parsed.path or text
    query = parsed.query

    if not path.startswith("/"):
        path = f"/{path}"

    normalized = path
    if query:
        normalized = f"{normalized}?{query}"

    return normalized[:500]


def _source_query_params(source_page: str | None) -> dict[str, str]:
    normalized = _normalize_source_page(source_page)
    if not normalized:
        return {}

    query = parse_qs(urlparse(normalized).query)
    return {
        key: values[0]
        for key, values in query.items()
        if values and str(values[0] or "").strip()
    }


def _normalize_route_path(source_page: str | None) -> str | None:
    normalized = _normalize_source_page(source_page)
    if not normalized:
        return None

    path = urlparse(normalized).path or "/"
    path = re.sub(r"^/(en|th)(?=/|$)", "", path.lower())
    return path or "/"


def _infer_lead_source(source_page: str | None) -> str | None:
    route_path = _normalize_route_path(source_page)
    if not route_path:
        return None

    if route_path == "/":
        return "home_form"
    if route_path == "/contact":
        return "contact_form"
    if route_path == "/buy":
        return "buy_form"
    if route_path == "/rent":
        return "rent_form"
    if route_path == "/area-guide":
        return "area_guide_form"
    if route_path.startswith("/areas/"):
        return "area_detail_form"
    if route_path.startswith("/projects/"):
        return "project_detail_form"
    if route_path.startswith("/property/"):
        return "property_detail_form"
    if route_path.startswith("/blog/"):
        return "blog_form"

    segments = [segment for segment in route_path.split("/") if segment]
    if not segments:
        return None

    first_segment = _normalize_token(segments[0])
    return f"{first_segment}_form" if first_segment else None


def _infer_locale(source_page: str | None) -> str | None:
    normalized = _normalize_source_page(source_page)
    if not normalized:
        return None

    path = urlparse(normalized).path or "/"
    match = re.match(r"^/(en|th)(?=/|$)", path.lower())
    if not match:
        return None
    return match.group(1)


def _normalize_source_platform_hint(value: str | None) -> str | None:
    token = _normalize_token(value)
    if not token:
        return None
    if token in {"fb", "facebook", "meta"}:
        return "fb"
    if token in {"ig", "instagram"}:
        return "ig"
    if token in {"wa", "whatsapp"}:
        return "wa"
    if token in {"google", "google_ads", "gads", "adwords", "sem"}:
        return "google"
    if token in {"website", "web", "organic", "direct"}:
        return "website"
    return "other"


def _normalize_intent(value: str | None) -> str:
    token = _normalize_token(value)
    if token in {"project_availability_check", "project_investment_check"}:
        return "project_consultation"
    if token == "shortlist_review":
        return "project_compare"
    return token or "general"


def _infer_lead_type(payload: InquiryCreate) -> str:
    purpose = _normalize_token(_extract_tag_value(payload.tags, "purpose:"))
    user_intent = _normalize_token(_extract_tag_value(payload.tags, "user_intent:"))
    intent = _normalize_token(payload.intent)

    if purpose == "rent" or user_intent == "rent" or intent == "rent":
        return "renter"
    if purpose == "invest" or user_intent == "invest" or intent == "invest":
        return "investor"
    if purpose == "sell" or user_intent == "sell" or intent == "sell":
        return "owner"
    if purpose == "buy" or user_intent == "buy" or intent in {"buy", "project_consultation", "project_shortlist", "project_compare", "viewing"}:
        return "buyer"
    return "undecided"


def _infer_offer_family(payload: InquiryCreate, property_row: Property | None) -> str:
    if property_row is not None:
        if property_row.type == "new":
            return "new_project"
        if property_row.type == "resale":
            return "resale"
        if property_row.type == "rent":
            return "rental"

    purpose = _normalize_token(_extract_tag_value(payload.tags, "purpose:"))
    entity_type = _normalize_token(_extract_tag_value(payload.tags, "entity_type:"))
    source_route = _normalize_token(_extract_tag_value(payload.tags, "source_route:"))
    has_project_scope = bool(_extract_tag_value(payload.tags, "project:")) or bool(_extract_tag_value(payload.tags, "project_scope:"))

    if purpose == "rent":
        return "rental"
    if entity_type == "project" or source_route == "project" or has_project_scope:
        return "new_project"
    if entity_type in {"shortlist", "recommendation", "area", "route"} or source_route in {"compare", "shortlist", "contact", "shared", "area_guide"}:
        return "discovery"
    return "discovery"


def _infer_inventory_source(offer_family: str | None, property_row: Property | None) -> str:
    if property_row is not None:
        if property_row.type == "new":
            return "developer_new"
        if property_row.type == "resale":
            return "owner_resale"
        if property_row.type == "rent":
            return "owner_rental"

    normalized_offer_family = _normalize_token(offer_family)
    if normalized_offer_family == "new_project":
        return "developer_new"
    if normalized_offer_family == "resale":
        return "owner_resale"
    if normalized_offer_family == "rental":
        return "owner_rental"
    return "unknown"


def _enrich_inquiry_payload(payload: InquiryCreate, property_row: Property | None) -> InquiryCreate:
    payload.source_page = _normalize_source_page(payload.source_page)
    payload.intent = _normalize_intent(payload.intent)

    query_params = _source_query_params(payload.source_page)
    lead_source = _normalize_token(_extract_tag_value(payload.tags, "lead_source:")) or _infer_lead_source(payload.source_page)
    locale = _normalize_token(payload.locale) or _infer_locale(payload.source_page)
    lead_type = _normalize_token(payload.lead_type) or _infer_lead_type(payload)
    offer_family = _normalize_token(payload.offer_family) or _infer_offer_family(payload, property_row)
    inventory_source = _normalize_token(payload.inventory_source) or _infer_inventory_source(offer_family, property_row)
    source_platform = _normalize_source_platform_hint(payload.source_platform)
    if source_platform is None:
        source_platform = _normalize_source_platform_hint(
            query_params.get("utm_source") or query_params.get("source")
        ) or "website"
    campaign_name = payload.campaign_name or query_params.get("utm_campaign") or query_params.get("campaign")

    normalized_tags = list(payload.tags or [])
    if lead_source and not _extract_tag_value(normalized_tags, "lead_source:"):
        normalized_tags.append(f"lead_source:{lead_source}")

    payload.tags = normalized_tags or None
    payload.locale = locale if locale in _ALLOWED_LOCALES else payload.locale
    payload.lead_type = lead_type if lead_type in _ALLOWED_LEAD_TYPES else payload.lead_type
    payload.offer_family = offer_family if offer_family in _ALLOWED_OFFER_FAMILIES else payload.offer_family
    payload.inventory_source = inventory_source if inventory_source in _ALLOWED_INVENTORY_SOURCES else payload.inventory_source
    payload.source_platform = source_platform if source_platform in _ALLOWED_SOURCE_PLATFORMS else payload.source_platform
    payload.campaign_name = campaign_name

    return payload


def _append_tag(tag_list: list[str], seen: set[str], value: str | None) -> None:
    text = str(value or "").strip()
    if not text or text in seen:
        return
    seen.add(text)
    tag_list.append(text)


def _compose_inquiry_tags(payload: InquiryCreate) -> list[str]:
    tags: list[str] = []
    seen: set[str] = set()
    for raw in payload.tags or []:
        if isinstance(raw, str):
            _append_tag(tags, seen, raw.strip())

    locale = _normalize_token(payload.locale)
    lead_type = _normalize_token(payload.lead_type)
    offer_family = _normalize_token(payload.offer_family)
    inventory_source = _normalize_token(payload.inventory_source)
    source_platform = _normalize_token(payload.source_platform)
    campaign_name = _normalize_campaign_name(payload.campaign_name)
    call_requested = _normalize_call_requested(payload.call_requested)
    lead_tier = _normalize_token(payload.lead_tier)

    if locale in _ALLOWED_LOCALES:
        _append_tag(tags, seen, f"locale:{locale}")
    if lead_type in _ALLOWED_LEAD_TYPES:
        _append_tag(tags, seen, f"lead_type:{lead_type}")
    if offer_family in _ALLOWED_OFFER_FAMILIES:
        _append_tag(tags, seen, f"offer_family:{offer_family}")
    if inventory_source in _ALLOWED_INVENTORY_SOURCES:
        _append_tag(tags, seen, f"inventory_source:{inventory_source}")
    if source_platform in _ALLOWED_SOURCE_PLATFORMS:
        _append_tag(tags, seen, f"source_platform:{source_platform}")
    if campaign_name:
        _append_tag(tags, seen, f"campaign:{campaign_name}")
    if call_requested in {"yes", "no"}:
        _append_tag(tags, seen, f"call_requested:{call_requested}")
    if lead_tier in _ALLOWED_LEAD_TIERS:
        _append_tag(tags, seen, f"lead_tier:{lead_tier}")

    return tags


def _to_inquiry_item(inquiry: Inquiry, *, dedupe_hint: bool = False) -> InquiryItem:
    contact_actions = build_contact_action_urls(email=inquiry.email, phone=inquiry.phone)
    automation = build_sales_automation_snapshot(
        intent=inquiry.intent,
        source_page=inquiry.source_page,
        email=inquiry.email,
        phone=inquiry.phone,
        tags=inquiry.tags,
        lead_score=int(inquiry.score or 0),
    )
    return InquiryItem(
        id=inquiry.id,
        property_id=inquiry.property_id,
        advisor_user_id=inquiry.advisor_user_id,
        duplicate_of_inquiry_id=inquiry.duplicate_of_inquiry_id,
        name=inquiry.name,
        email=inquiry.email,
        phone=inquiry.phone,
        message=inquiry.message,
        source_page=inquiry.source_page,
        intent=inquiry.intent,
        purpose=inquiry.intent,
        score=inquiry.score,
        status=inquiry.status,
        persona=inquiry.persona,
        budget_band=inquiry.budget_band,
        timeline=inquiry.timeline,
        follow_up_status=inquiry.follow_up_status,
        follow_up_due_at=inquiry.follow_up_due_at,
        tags=inquiry.tags,
        whatsapp_url=contact_actions["whatsapp_url"],
        phone_url=contact_actions["phone_url"],
        email_url=contact_actions["email_url"],
        is_duplicate_hint=dedupe_hint or inquiry.duplicate_of_inquiry_id is not None,
        is_spam_hint=False,
        sales_automation=SalesAutomationItem(
            locale=automation.locale,
            intent=automation.intent,
            source=automation.source,
            buyer_fit=automation.buyer_fit,
            signal_level=automation.signal_level,
            projects=list(automation.projects),
            primary_project=automation.primary_project,
            response_channel=automation.response_channel,
            response_sla_seconds=automation.response_sla_seconds,
            auto_response_message=automation.auto_response_message,
            confirmation_title=automation.confirmation_title,
            confirmation_body=automation.confirmation_body,
            recommended_approach=automation.recommended_approach,
            suggested_first_reply=automation.suggested_first_reply,
            priority_label=automation.priority_label,
            priority_score=automation.priority_score,
            route_hint=automation.route_hint,
            next_follow_up_at=automation.next_follow_up_at,
            follow_up_status=automation.follow_up_status,
            follow_up_stage=automation.follow_up_stage,
            follow_up_plan=[
                SalesAutomationFollowUpStepItem(
                    stage=step.stage,
                    label=step.label,
                    message=step.message,
                    due_at=step.due_at,
                )
                for step in automation.follow_up_plan
            ],
            stop_conditions=list(automation.stop_conditions),
        ),
        created_at=inquiry.created_at,
        updated_at=inquiry.updated_at,
    )


def _to_booking_item(booking: Booking) -> BookingItem:
    return BookingItem(
        id=booking.id,
        property_id=booking.property_id,
        inquiry_id=booking.inquiry_id,
        start_at=booking.start_at,
        end_at=booking.end_at,
        guests=booking.guests,
        notes=booking.notes,
        status=booking.status,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


@router.post("/inquiries", response_model=InquiryItem, status_code=status.HTTP_201_CREATED)
def create_inquiry(
    payload: InquiryCreate,
    response: Response,
    db: Session = Depends(get_db),
) -> InquiryItem:
    property_row: Property | None = None
    if payload.property_id is not None:
        property_row = db.get(Property, payload.property_id)
        if property_row is None or property_row.status != "active":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    payload = _enrich_inquiry_payload(payload, property_row)

    now = datetime.now(UTC)
    dedupe_since = now - timedelta(minutes=10)

    dedupe = db.scalar(
        select(Inquiry)
        .where(
            and_(
                Inquiry.name == payload.name,
                Inquiry.message == payload.message,
                Inquiry.email == payload.email,
                Inquiry.phone == payload.phone,
                Inquiry.source_page == payload.source_page,
                Inquiry.created_at >= dedupe_since,
            )
        )
        .order_by(Inquiry.created_at.desc())
        .limit(1)
    )
    if dedupe is not None:
        response.headers["X-Inquiry-Deduped"] = "true"
        return _to_inquiry_item(dedupe, dedupe_hint=True)

    inquiry = Inquiry(
        intent=payload.intent or "general",
        property_id=payload.property_id,
        name=payload.name.strip(),
        email=(payload.email or "").strip() or None,
        phone=(payload.phone or "").strip() or None,
        message=payload.message.strip(),
        source_page=(payload.source_page or "").strip() or None,
        score=max(0, min(int(payload.lead_score or 0), 100)),
        status="new",
        budget_band=(payload.budget_band or "").strip() or None,
        timeline=(payload.timeline or "").strip() or None,
        follow_up_status=CANONICAL_FOLLOW_UP_STATUSES[0],
        persona=(payload.persona or "").strip() or None,
        submit_timestamp=now,
        first_touch_timestamp=now,
        email_hash=_hash_text(payload.email),
        phone_hash=_hash_text(payload.phone),
        tags=_compose_inquiry_tags(payload),
    )
    automation = build_sales_automation_snapshot(
        intent=inquiry.intent,
        source_page=inquiry.source_page,
        email=inquiry.email,
        phone=inquiry.phone,
        tags=inquiry.tags,
        lead_score=int(inquiry.score or 0),
        now=now,
    )
    inquiry.score = automation.priority_score
    inquiry.follow_up_status = automation.follow_up_status
    inquiry.follow_up_due_at = automation.next_follow_up_at
    inquiry.tags = list(dict.fromkeys([*(inquiry.tags or []), *automation.as_tags()]))
    db.add(inquiry)
    db.flush()
    write_audit_log(
        db,
        actor_user_id=None,
        entity_type="inquiry",
        entity_id=str(inquiry.id),
        action="note_add",
        diff={"note_id": f"auto-{inquiry.id}", "note": build_advisor_summary_note(automation)},
    )
    db.commit()
    db.refresh(inquiry)
    response.headers["X-Inquiry-Deduped"] = "false"
    return _to_inquiry_item(inquiry)


@router.post("/viewings", response_model=ViewingItem, status_code=status.HTTP_201_CREATED)
def create_viewing(payload: ViewingCreate, db: Session = Depends(get_db)) -> ViewingItem:
    inquiry = db.get(Inquiry, payload.inquiry_id)
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    viewing = Viewing(
        inquiry_id=payload.inquiry_id,
        scheduled_at=payload.scheduled_at,
        notes=payload.notes,
        status="scheduled",
    )
    db.add(viewing)
    db.commit()
    db.refresh(viewing)
    return ViewingItem.model_validate(viewing)


@router.post("/bookings", response_model=BookingItem, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)) -> BookingItem:
    inquiry: Inquiry | None = None
    if payload.inquiry_id is not None:
        inquiry = db.get(Inquiry, payload.inquiry_id)
        if inquiry is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    property_id = payload.property_id or (inquiry.property_id if inquiry is not None else None)
    if property_id is not None:
        prop = db.get(Property, property_id)
        if prop is None or prop.status != "active":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    if property_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="property_id is required",
        )

    start_at = payload.start_at
    duration = payload.duration_minutes if payload.duration_minutes is not None else 60
    if duration < 15 or duration > 720:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="duration_minutes must be between 15 and 720",
        )
    end_at = payload.end_at or (start_at + timedelta(minutes=duration))
    if end_at <= start_at:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end_at must be greater than start_at",
        )

    idempotency_key = str(payload.idempotency_key or "").strip() or None
    if idempotency_key:
        existing = db.scalar(
            select(Booking).where(Booking.idempotency_key == idempotency_key).limit(1)
        )
        if existing is not None:
            return _to_booking_item(existing)

    overlap = db.scalar(
        select(Booking)
        .where(
            and_(
                Booking.property_id == property_id,
                Booking.status.in_(["requested", "confirmed"]),
                Booking.start_at < end_at,
                Booking.end_at > start_at,
            )
        )
        .order_by(Booking.start_at.asc())
        .limit(1)
    )
    if overlap is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Requested slot overlaps an existing booking",
        )

    booking = Booking(
        property_id=property_id,
        inquiry_id=payload.inquiry_id,
        idempotency_key=idempotency_key,
        start_at=start_at,
        end_at=end_at,
        guests=payload.guests,
        notes=(payload.notes or "").strip() or None,
        status="requested",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _to_booking_item(booking)
