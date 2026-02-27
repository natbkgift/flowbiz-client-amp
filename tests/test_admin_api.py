from sqlalchemy import select

from packages.core.auth import hash_password
from packages.core.database import SessionLocal
from packages.core.models import User


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


def _login_token(client) -> str:
    _ensure_admin_user()
    response = client.post(
        "/v1/auth/login",
        json={"email": "admin@local.dev", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _create_lead(client) -> str:
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


def test_admin_list_and_update_lead(client):
    token = _login_token(client)
    lead_id = _create_lead(client)
    headers = {"Authorization": f"Bearer {token}"}

    list_response = client.get("/admin/leads", headers=headers)
    assert list_response.status_code == 200
    assert any(item["id"] == lead_id for item in list_response.json()["data"])

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


def test_admin_lead_workflow_timeline_and_export(client):
    token = _login_token(client)
    lead_id = _create_lead(client)
    headers = {"Authorization": f"Bearer {token}"}

    listing = client.get("/admin/leads?page=1&limit=10&status=new&sort=newest&order=desc", headers=headers)
    assert listing.status_code == 200
    body = listing.json()
    assert body["meta"]["page"] == 1
    assert body["meta"]["limit"] == 10
    assert isinstance(body["data"], list)

    status_updated = client.patch(
        f"/admin/leads/{lead_id}",
        json={"status": "contacted"},
        headers=headers,
    )
    assert status_updated.status_code == 200

    assigned = client.post(
        f"/admin/leads/{lead_id}/assign",
        json={"owner_user_id": None, "reason": "manual"},
        headers=headers,
    )
    assert assigned.status_code == 200

    added = client.post(
        f"/admin/leads/{lead_id}/notes",
        json={"note": "first note"},
        headers=headers,
    )
    assert added.status_code == 200
    note_id = added.json()["note_id"]

    edited = client.patch(
        f"/admin/leads/{lead_id}/notes/{note_id}",
        json={"note": "edited note"},
        headers=headers,
    )
    assert edited.status_code == 200
    assert edited.json()["note"] == "edited note"

    timeline = client.get(f"/admin/leads/{lead_id}/timeline?limit=20", headers=headers)
    assert timeline.status_code == 200
    actions = [item["action"] for item in timeline.json()["data"]]
    assert "status_update" in actions
    assert "assign_manual" in actions
    assert "note_add" in actions
    assert "note_update" in actions

    exported = client.get("/admin/leads-export.csv?status=contacted", headers=headers)
    assert exported.status_code == 200
    assert exported.headers["content-type"].startswith("text/csv")
    csv_text = exported.text
    assert "id,name,email,phone,status,score,source_page,purpose,owner_user_id,follow_up_due_at,duplicate_hint,spam_hint,created_at" in csv_text
    assert "password" not in csv_text.lower()
