from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import User


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    password = "test-pass"

    with SessionLocal() as db:
        db.add(
            User(
                email=email,
                password_hash=hash_password(password),
                role="admin",
            )
        )
        db.commit()

    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def test_project_evaluation_not_found_returns_404(client: TestClient) -> None:
    resp = client.get("/v1/projects/00000000-0000-0000-0000-000000000000/evaluation")
    assert resp.status_code == 404


def test_project_evaluation_returns_200_for_published_project(client: TestClient) -> None:
    token = str(uuid4())
    headers = _make_admin_headers()

    create_resp = client.post(
        "/v1/projects",
        headers=headers,
        json={
            "slug": f"proj-{token}",
            "name": f"Project {token}",
            "cover_image_url": None,
            "developer_id": None,
            "area_id": None,
            "status": "published",
        },
    )
    assert create_resp.status_code == 201, create_resp.text
    project_id = create_resp.json()["id"]

    r1 = client.get(f"/v1/projects/{project_id}/evaluation")
    assert r1.status_code == 200, r1.text
    body = r1.json()
    assert body["evaluation_version"] == "v1"
    assert body["project"]["id"] == project_id
    assert isinstance(body["badges"], list)

    r2 = client.get(f"/v1/projects/{project_id}/evaluation")
    assert r2.status_code == 200
    assert r2.json() == body
