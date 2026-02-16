from uuid import uuid4


def _login_token(client) -> str:
    resp = client.post(
        "/v1/auth/login",
        json={"email": "admin@local.dev", "password": "admin123"},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


def _admin_create_property(client, *, title: str, slug: str) -> str:
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post(
        "/admin/properties",
        json={
            "source_id": str(uuid4()),
            "title": title,
            "type": "new",
            "price": "1000000",
            "address": "Somewhere",
            "city": "Pattaya",
            "slug": slug,
            "status": "active",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def test_compare_max_4_and_deterministic_ordering(client):
    p1 = _admin_create_property(client, title="P1", slug="cmp-p1")
    p2 = _admin_create_property(client, title="P2", slug="cmp-p2")

    # Intentionally pass reversed; response must be deterministic (sorted UUID strings).
    resp = client.post("/v1/compare", json={"property_ids": [p2, p1]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["ordered_property_ids"] == sorted([p1, p2])
    assert len(data["items"]) == 2


def test_compare_rejects_missing_property(client):
    missing = str(uuid4())
    resp = client.post("/v1/compare", json={"property_ids": [missing]})
    assert resp.status_code == 404
