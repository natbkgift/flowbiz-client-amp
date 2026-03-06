from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import func, select

from apps.api.routes.admin_crm import _spam_filter_clause
from packages.core.database import SessionLocal
from packages.core.models import Inquiry, Property


def _login_token(client) -> str:
    resp = client.post(
        "/v1/auth/login",
        json={"email": "admin@local.dev", "password": "admin123"},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_create_inquiry_and_schedule_viewing(client):
    inquiry_resp = client.post(
        "/v1/inquiries",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "message": "I want to know more.",
            "source_page": "/buy-condo-pattaya",
        },
    )
    assert inquiry_resp.status_code == 201
    inquiry = inquiry_resp.json()
    assert inquiry["status"] == "new"

    scheduled_at = (datetime.now(UTC) + timedelta(days=1)).isoformat()
    viewing_resp = client.post(
        "/v1/viewings",
        json={
            "inquiry_id": inquiry["id"],
            "scheduled_at": scheduled_at,
            "notes": "Morning slot",
        },
    )
    assert viewing_resp.status_code == 201
    viewing = viewing_resp.json()
    assert viewing["status"] == "scheduled"


def test_create_booking_flow_with_property_context_and_overlap_guard(client):
    unique_key = uuid4().hex
    with SessionLocal() as db:
        prop = Property(
            source_id=f"crm-booking-{uuid4()}",
            slug=f"crm-booking-{uuid4()}",
            title="CRM Booking Property",
            type="new",
            property_type="condo",
            status="active",
            price=3200000,
            address="CRM Booking Address",
            city="Pattaya",
        )
        db.add(prop)
        db.commit()
        db.refresh(prop)
        property_id = str(prop.id)

    inquiry_resp = client.post(
        "/v1/inquiries",
        json={
            "name": "Booking User",
            "email": f"booking-{unique_key}@example.com",
            "message": f"Please schedule viewing {unique_key}",
            "source_page": f"/en/property/{unique_key}",
            "property_id": property_id,
            "intent": "viewing",
        },
    )
    assert inquiry_resp.status_code == 201, inquiry_resp.text
    inquiry_id = inquiry_resp.json()["id"]

    start_at = (datetime.now(UTC) + timedelta(days=1)).replace(microsecond=0).isoformat()
    booking_resp = client.post(
        "/v1/bookings",
        json={
            "property_id": property_id,
            "inquiry_id": inquiry_id,
            "start_at": start_at,
            "duration_minutes": 60,
            "guests": 2,
            "notes": "Morning slot",
            "idempotency_key": f"booking-{inquiry_id}",
        },
    )
    assert booking_resp.status_code == 201, booking_resp.text
    booking = booking_resp.json()
    assert booking["status"] == "requested"
    assert booking["property_id"] == property_id
    assert booking["inquiry_id"] == inquiry_id

    idempotent_resp = client.post(
        "/v1/bookings",
        json={
            "property_id": property_id,
            "inquiry_id": inquiry_id,
            "start_at": start_at,
            "duration_minutes": 60,
            "idempotency_key": f"booking-{inquiry_id}",
        },
    )
    assert idempotent_resp.status_code == 201, idempotent_resp.text
    assert idempotent_resp.json()["id"] == booking["id"]

    overlap_resp = client.post(
        "/v1/bookings",
        json={
            "property_id": property_id,
            "inquiry_id": inquiry_id,
            "start_at": start_at,
            "duration_minutes": 30,
            "idempotency_key": f"overlap-{inquiry_id}",
        },
    )
    assert overlap_resp.status_code == 409, overlap_resp.text


def test_inquiry_retry_is_deduped_not_lost(client):
    payload = {
        "name": "Retry User",
        "email": "retry@example.com",
        "message": "Please contact me.",
        "source_page": "/en",
    }

    r1 = client.post("/v1/inquiries", json=payload)
    assert r1.status_code == 201
    body1 = r1.json()
    assert body1["status"] == "new"

    r2 = client.post("/v1/inquiries", json=payload)
    assert r2.status_code == 201
    assert r2.headers.get("X-Inquiry-Deduped") in ("true", "false")
    body2 = r2.json()

    # Rapid identical retries should not create a new inquiry that is marked lost.
    # (If deduped, the id is the same; if not deduped for any reason, status must still be safe.)
    assert body2["status"] != "lost"
    if r2.headers.get("X-Inquiry-Deduped") == "true":
        assert body2["id"] == body1["id"]


def test_admin_can_list_inquiries_and_viewings(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure at least one inquiry exists
    _ = client.post(
        "/v1/inquiries",
        json={
            "name": "Admin Check",
            "phone": "+66000000000",
            "message": "Request call",
        },
    )

    inquiries = client.get("/admin/inquiries", headers=headers)
    assert inquiries.status_code == 200
    assert isinstance(inquiries.json()["data"], list)

    viewings = client.get("/admin/viewings", headers=headers)
    assert viewings.status_code == 200
    assert isinstance(viewings.json(), list)


def test_admin_inquiry_filters_and_pagination(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    today = datetime.now(UTC).date().isoformat()

    _ = client.post(
        "/v1/inquiries",
        json={
            "name": "Filter New",
            "email": "filter-new@example.com",
            "message": "Need info",
            "source_page": "/en",
        },
    )
    old = client.post(
        "/v1/inquiries",
        json={
            "name": "Filter Closed",
            "email": "filter-closed@example.com",
            "message": "Need callback",
            "source_page": "/th",
            "intent": "general",
        },
    )
    assert old.status_code == 201
    old_id = old.json()["id"]

    patched = client.patch(
        f"/admin/inquiries/{old_id}",
        json={"status": "contacted"},
        headers=headers,
    )
    assert patched.status_code == 200

    follow_up = client.patch(
        f"/admin/inquiries/{old_id}/follow-up",
        json={
            "follow_up_status": "scheduled",
            "follow_up_due_at": "2030-01-15T10:00:00+00:00",
        },
        headers=headers,
    )
    assert follow_up.status_code == 200
    assert follow_up.json()["follow_up_status"] == "scheduled"

    filtered = client.get(
        "/admin/inquiries?status=contacted&page=1&limit=1&sort=created_at&order=desc",
        headers=headers,
    )
    assert filtered.status_code == 200
    body = filtered.json()
    assert body["meta"]["page"] == 1
    assert body["meta"]["limit"] == 1
    assert body["meta"]["total"] >= 1
    assert len(body["data"]) <= 1
    assert body["data"][0]["status"] == "contacted"

    source_purpose_filtered = client.get(
        (
            f"/admin/inquiries?source=/th&purpose=general&follow_up_status=scheduled"
            f"&date_from={today}&date_to={today}"
        ),
        headers=headers,
    )
    assert source_purpose_filtered.status_code == 200, source_purpose_filtered.text
    source_body = source_purpose_filtered.json()
    source_ids = {item["id"] for item in source_body["data"]}
    assert old_id in source_ids

    invalid_range = client.get(
        "/admin/inquiries?date_from=2030-01-02&date_to=2030-01-01",
        headers=headers,
    )
    assert invalid_range.status_code == 422

    invalid_follow_up_filter = client.get(
        "/admin/inquiries?follow_up_status=invalid_status",
        headers=headers,
    )
    assert invalid_follow_up_filter.status_code == 422


def test_admin_note_and_timeline_flow(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/v1/inquiries",
        json={
            "name": "Timeline User",
            "email": "timeline@example.com",
            "message": "Timeline message",
            "source_page": "/en",
        },
    )
    assert created.status_code == 201
    inquiry_id = created.json()["id"]

    status_updated = client.patch(
        f"/admin/inquiries/{inquiry_id}",
        json={"status": "contacted"},
        headers=headers,
    )
    assert status_updated.status_code == 200

    added = client.post(
        f"/admin/inquiries/{inquiry_id}/notes",
        json={"note": "first note"},
        headers=headers,
    )
    assert added.status_code == 200
    note_id = added.json()["note_id"]
    assert note_id

    edited = client.patch(
        f"/admin/inquiries/{inquiry_id}/notes/{note_id}",
        json={"note": "edited note"},
        headers=headers,
    )
    assert edited.status_code == 200
    assert edited.json()["note"] == "edited note"

    follow_up = client.patch(
        f"/admin/inquiries/{inquiry_id}/follow-up",
        json={"follow_up_status": "completed"},
        headers=headers,
    )
    assert follow_up.status_code == 200
    assert follow_up.json()["follow_up_status"] == "completed"

    timeline = client.get(f"/admin/inquiries/{inquiry_id}/timeline?limit=20", headers=headers)
    assert timeline.status_code == 200
    actions = [event["action"] for event in timeline.json()["data"]]
    assert "status_update" in actions
    assert "note_add" in actions
    assert "note_update" in actions
    assert "follow_up_update" in actions


def test_admin_csv_export_has_safe_fields(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/v1/inquiries",
        json={
            "name": "Csv User",
            "email": "csv@example.com",
            "message": "Sensitive body should not be exported",
            "source_page": "/en/export",
        },
    )
    assert created.status_code == 201

    exported = client.get("/admin/inquiries-export.csv", headers=headers)
    assert exported.status_code == 200
    assert exported.headers["content-type"].startswith("text/csv")
    csv_text = exported.text
    assert (
        "id,name,email,phone,intent,purpose,status,follow_up_status,follow_up_due_at,score,"
        "advisor_user_id,source_page,duplicate_hint,spam_hint,created_at" in csv_text
    )
    assert "Sensitive body should not be exported" not in csv_text


def test_create_inquiry_accepts_budget_band_and_timeline(client):
    inquiry_resp = client.post(
        "/v1/inquiries",
        json={
            "name": "Budget User",
            "email": "budget@example.com",
            "message": "Need shortlist",
            "source_page": "/en",
            "intent": "invest",
            "budget_band": "3m_6m",
            "timeline": "3_6m",
            "persona": "investor",
            "tags": ["home_form"],
        },
    )
    assert inquiry_resp.status_code == 201
    inquiry = inquiry_resp.json()
    assert inquiry["budget_band"] == "3m_6m"
    assert inquiry["timeline"] == "3_6m"
    assert inquiry["intent"] == "invest"
    assert inquiry["purpose"] == "invest"
    assert inquiry["follow_up_status"] == "pending"


def test_inquiry_legacy_payload_and_additive_payload_are_both_supported(client):
    legacy = client.post(
        "/v1/inquiries",
        json={
            "name": "Legacy User",
            "email": "legacy@example.com",
            "message": "Legacy payload",
            "source_page": "/en",
        },
    )
    assert legacy.status_code == 201, legacy.text
    legacy_body = legacy.json()
    assert legacy_body["budget_band"] is None
    assert legacy_body["timeline"] is None

    additive = client.post(
        "/v1/inquiries",
        json={
            "name": "Additive User",
            "email": "additive@example.com",
            "message": "Additive payload",
            "source_page": "/th",
            "budget_band": "6m_10m",
            "timeline": "0_3m",
            "persona": "investor",
            "tags": ["home_form", "a2_runtime"],
        },
    )
    assert additive.status_code == 201, additive.text
    additive_body = additive.json()
    assert additive_body["budget_band"] == "6m_10m"
    assert additive_body["timeline"] == "0_3m"


def test_inquiry_additive_marketing_fields_are_normalized_into_tags(client):
    unique = uuid4().hex
    created = client.post(
        "/v1/inquiries",
        json={
            "name": "Marketing Additive User",
            "email": f"marketing-{unique}@example.com",
            "message": f"Marketing payload {unique}",
            "source_page": "/en/campaign",
            "intent": "invest",
            "tags": ["home_form"],
            "locale": "EN",
            "lead_type": "Buyer",
            "offer_family": "new project",
            "inventory_source": "developer-new",
            "source_platform": "IG",
            "campaign_name": "AMP META EN NEW PROJECT INVEST",
            "call_requested": False,
        },
    )
    assert created.status_code == 201, created.text
    inquiry_id = created.json()["id"]

    with SessionLocal() as db:
        row = db.get(Inquiry, UUID(inquiry_id))
        assert row is not None
        tags = set(row.tags or [])

    assert "home_form" in tags
    assert "locale:en" in tags
    assert "lead_type:buyer" in tags
    assert "offer_family:new_project" in tags
    assert "inventory_source:developer_new" in tags
    assert "source_platform:ig" in tags
    assert "campaign:AMP_META_EN_NEW_PROJECT_INVEST" in tags
    assert "call_requested:no" in tags


def test_admin_inquiry_is_spam_filter_has_deterministic_total(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    spam_resp = client.post(
        "/v1/inquiries",
        json={
            "name": "Spam Marker",
            "email": "spam-marker@example.com",
            "message": "one",
            "source_page": "/en",
        },
    )
    clean_resp = client.post(
        "/v1/inquiries",
        json={
            "name": "Clean Marker",
            "email": "clean-marker@example.com",
            "message": "two",
            "source_page": "/th",
        },
    )
    assert spam_resp.status_code == 201
    assert clean_resp.status_code == 201

    spam_id = spam_resp.json()["id"]
    clean_id = clean_resp.json()["id"]

    with SessionLocal() as db:
        spam_row = db.get(Inquiry, UUID(spam_id))
        clean_row = db.get(Inquiry, UUID(clean_id))
        assert spam_row is not None
        assert clean_row is not None
        spam_row.tags = ["spam"]
        clean_row.tags = ["normal"]
        db.add(spam_row)
        db.add(clean_row)
        db.commit()

    spam_filtered = client.get(
        "/admin/inquiries?is_spam=true&page=1&limit=50",
        headers=headers,
    )
    assert spam_filtered.status_code == 200
    spam_body = spam_filtered.json()
    spam_ids = {item["id"] for item in spam_body["data"]}
    with SessionLocal() as db:
        expected_spam_total = db.scalar(
            select(func.count()).select_from(Inquiry).where(_spam_filter_clause(is_spam=True))
        )
    assert spam_body["meta"]["total"] == expected_spam_total
    assert spam_id in spam_ids
    assert clean_id not in spam_ids

    clean_filtered = client.get(
        "/admin/inquiries?is_spam=false&page=1&limit=50",
        headers=headers,
    )
    assert clean_filtered.status_code == 200
    clean_body = clean_filtered.json()
    clean_ids = {item["id"] for item in clean_body["data"]}
    with SessionLocal() as db:
        expected_clean_total = db.scalar(
            select(func.count()).select_from(Inquiry).where(_spam_filter_clause(is_spam=False))
        )
    assert clean_body["meta"]["total"] == expected_clean_total
    assert len(clean_body["data"]) == min(50, expected_clean_total)
    assert clean_id in clean_ids
    assert spam_id not in clean_ids


def test_admin_contact_actions_and_follow_up_due_date(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/v1/inquiries",
        json={
            "name": "Contact Action User",
            "email": "quick-actions@example.com",
            "phone": "+66 80 123 4567",
            "message": "Contact me quickly",
            "source_page": "/en/contact",
            "intent": "buy",
        },
    )
    assert created.status_code == 201
    inquiry_id = created.json()["id"]

    detail = client.get(f"/admin/inquiries/{inquiry_id}", headers=headers)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["email_url"] == "mailto:quick-actions@example.com"
    assert body["phone_url"] == "tel:+66801234567"
    assert body["whatsapp_url"] == "https://wa.me/66801234567"

    follow_up = client.patch(
        f"/admin/inquiries/{inquiry_id}/follow-up",
        json={"follow_up_due_at": "2031-05-20T09:30:00+00:00"},
        headers=headers,
    )
    assert follow_up.status_code == 200, follow_up.text
    assert follow_up.json()["follow_up_due_at"].startswith("2031-05-20T09:30:00")

    local_contact = client.post(
        "/v1/inquiries",
        json={
            "name": "Local Phone User",
            "email": None,
            "phone": "080 123 4567",
            "message": "Local number without country code",
            "source_page": "/en/contact",
            "intent": "rent",
        },
    )
    assert local_contact.status_code == 201
    local_id = local_contact.json()["id"]
    local_detail = client.get(f"/admin/inquiries/{local_id}", headers=headers)
    assert local_detail.status_code == 200
    local_body = local_detail.json()
    assert local_body["phone_url"] == "tel:0801234567"
    assert local_body["whatsapp_url"] == "https://wa.me/66801234567"

    invalid_follow_up = client.patch(
        f"/admin/inquiries/{inquiry_id}/follow-up",
        json={"follow_up_status": "later"},
        headers=headers,
    )
    assert invalid_follow_up.status_code == 422
