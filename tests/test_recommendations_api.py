from __future__ import annotations

import hashlib
import json
from uuid import uuid4

from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import User


def _hash_json(obj: object) -> str:
    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    password = "test-pass"

    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password(password), role="admin"))
        db.commit()

    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _admin_create_property(
    client: TestClient, *, title: str, slug: str, status: str = "active", price: int = 1000000, type_: str = "new"
) -> dict:
    payload = {
        "source_id": f"src-{uuid4()}",
        "title": title,
        "description": None,
        "type": type_,
        "price": price,
        "bedrooms": 1,
        "bathrooms": 1,
        "size": 35.5,
        "address": "123 Test Road",
        "city": "Pattaya",
        "images": ["https://example.test/a.jpg"],
        "status": status,
        "slug": slug,
    }
    headers = _make_admin_headers()
    resp = client.post("/admin/properties", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_recommendations_are_deterministic_and_emit_query_hash(client: TestClient) -> None:
    token = str(uuid4())
    _admin_create_property(
        client,
        title=f"{token} A",
        slug=f"{token}-a",
        status="active",
        price=2_900_000,
        type_="new",
    )
    _admin_create_property(
        client,
        title=f"{token} B",
        slug=f"{token}-b",
        status="active",
        price=4_200_000,
        type_="resale",
    )

    url = (
        "/v1/recommendations"
        f"?limit=5&intent=sale_new&budget_min=2000000&budget_max=5000000&property_type=new"
    )

    r1 = client.get(url)
    assert r1.status_code == 200, r1.text
    r2 = client.get(url)
    assert r2.status_code == 200, r2.text

    assert r1.headers.get("X-Recommendation-Version") == "v1"
    assert r1.headers.get("X-Recommendation-Query-Hash")
    assert r2.headers.get("X-Recommendation-Query-Hash") == r1.headers.get(
        "X-Recommendation-Query-Hash"
    )

    assert _hash_json(r1.json()) == _hash_json(r2.json())
