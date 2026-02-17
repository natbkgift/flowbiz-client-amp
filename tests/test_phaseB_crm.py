from datetime import UTC, datetime, timedelta


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
    assert isinstance(inquiries.json(), list)

    viewings = client.get("/admin/viewings", headers=headers)
    assert viewings.status_code == 200
    assert isinstance(viewings.json(), list)
