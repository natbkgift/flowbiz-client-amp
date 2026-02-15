from fastapi.testclient import TestClient
from sqlalchemy import select

from apps.api.main import app
from packages.core.auth import hash_password
from packages.core.database import SessionLocal
from packages.core.models import User

client = TestClient(app)


def _ensure_admin_user() -> None:
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == "admin@local.dev"))
        if user is None:
            db.add(
                User(
                    email="admin@local.dev",
                    password_hash=hash_password("admin123"),
                    role="admin",
                )
            )
        else:
            user.password_hash = hash_password("admin123")
            user.role = "admin"
            db.add(user)
        db.commit()
    finally:
        db.close()


def _login_token() -> str:
    _ensure_admin_user()
    response = client.post(
        "/v1/auth/login",
        json={"email": "admin@local.dev", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _create_lead() -> str:
    response = client.post(
        "/v1/phase1/score",
        json={
            "source_page": "/buy-condo-pattaya",
            "purpose": "buy_live",
            "budget_range": "2m_5m",
            "timeline": "1_3mo",
            "in_thailand": "yes_elsewhere",
            "first_name": "AdminTest",
            "preferred_channel": "email",
            "contact_value": "admintest@example.com",
            "country": "UK",
        },
    )
    assert response.status_code == 200
    return response.json()["lead_id"]


def test_admin_list_and_update_lead():
    token = _login_token()
    lead_id = _create_lead()
    headers = {"Authorization": f"Bearer {token}"}

    list_response = client.get("/admin/leads", headers=headers)
    assert list_response.status_code == 200
    assert any(item["id"] == lead_id for item in list_response.json())

    detail_response = client.get(f"/admin/leads/{lead_id}", headers=headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["id"] == lead_id

    update_response = client.patch(
        f"/admin/leads/{lead_id}",
        json={"status": "contacted"},
        headers=headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "contacted"
