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
