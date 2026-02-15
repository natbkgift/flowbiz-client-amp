from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import Property, User


def test_list_properties_returns_200(client: TestClient) -> None:
    resp = client.get("/v1/properties")
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body
    assert "meta" in body


def test_list_properties_filter_type_returns_200(client: TestClient) -> None:
    resp = client.get("/v1/properties?type=new")
    assert resp.status_code == 200


def test_get_property_not_found_returns_404(client: TestClient) -> None:
    resp = client.get("/v1/properties/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


def test_list_company_returns_200(client: TestClient) -> None:
    resp = client.get("/v1/company")
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body


def test_get_company_not_found_returns_404(client: TestClient) -> None:
    resp = client.get("/v1/company/does-not-exist")
    assert resp.status_code == 404


def test_admin_routes_require_auth(client: TestClient) -> None:
    resp = client.post("/admin/properties", json={})
    assert resp.status_code in (401, 403)


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


def _admin_create_property(
    client: TestClient, *, title: str, slug: str, status: str = "active"
) -> dict:
    payload = {
        "source_id": f"src-{uuid4()}",
        "title": title,
        "description": None,
        "type": "new",
        "price": 1000000,
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


def _admin_create_company_info(client: TestClient, *, slug: str, title: str = "About") -> dict:
    payload = {
        "title": title,
        "slug": slug,
        "content": "<p>Hello</p>",
        "meta_title": None,
        "meta_description": None,
    }
    headers = _make_admin_headers()
    resp = client.post("/admin/company", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_public_list_excludes_inactive_properties(client: TestClient) -> None:
    token = str(uuid4())
    _admin_create_property(client, title=f"{token} Active", slug=f"{token}-a", status="active")
    _admin_create_property(client, title=f"{token} Inactive", slug=f"{token}-i", status="inactive")

    resp = client.get(f"/v1/properties?search={token}&sort=newest")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) == 1
    assert token in data[0]["title"]


def test_public_get_inactive_property_returns_404(client: TestClient) -> None:
    token = str(uuid4())
    created = _admin_create_property(
        client,
        title=f"{token} Inactive",
        slug=f"{token}-inactive",
        status="inactive",
    )
    resp = client.get(f"/v1/properties/{created['id']}")
    assert resp.status_code == 404


def test_admin_property_crud_happy_path(client: TestClient) -> None:
    token = str(uuid4())
    headers = _make_admin_headers()

    create_payload = {
        "source_id": f"src-{uuid4()}",
        "title": f"{token} Title",
        "description": "Desc",
        "type": "new",
        "price": 1234567.89,
        "bedrooms": 2,
        "bathrooms": 2,
        "size": 65,
        "address": "456 Test Road",
        "city": "Bangkok",
        "images": None,
        "status": "active",
        "slug": f"{token}-slug",
    }

    create_resp = client.post("/admin/properties", json=create_payload, headers=headers)
    assert create_resp.status_code == 201, create_resp.text
    prop = create_resp.json()

    patch_resp = client.patch(
        f"/admin/properties/{prop['id']}",
        json={"title": f"{token} Updated"},
        headers=headers,
    )
    assert patch_resp.status_code == 200, patch_resp.text
    assert patch_resp.json()["title"] == f"{token} Updated"

    delete_resp = client.delete(f"/admin/properties/{prop['id']}", headers=headers)
    assert delete_resp.status_code == 204, delete_resp.text

    public_get = client.get(f"/v1/properties/{prop['id']}")
    assert public_get.status_code == 404


def test_admin_duplicate_property_slug_returns_409(client: TestClient) -> None:
    token = str(uuid4())
    slug = f"dup-{token}"
    headers = _make_admin_headers()

    payload = {
        "source_id": f"src-{uuid4()}",
        "title": f"{token} One",
        "description": None,
        "type": "new",
        "price": 100,
        "bedrooms": None,
        "bathrooms": None,
        "size": None,
        "address": "A",
        "city": "C",
        "images": None,
        "status": "active",
        "slug": slug,
    }
    resp1 = client.post("/admin/properties", json=payload, headers=headers)
    assert resp1.status_code == 201, resp1.text

    payload2 = {**payload, "source_id": f"src-{uuid4()}", "title": f"{token} Two"}
    resp2 = client.post("/admin/properties", json=payload2, headers=headers)
    assert resp2.status_code == 409, resp2.text


def test_admin_duplicate_company_slug_returns_409(client: TestClient) -> None:
    token = str(uuid4())
    slug = f"company-{token}"
    headers = _make_admin_headers()

    payload = {
        "title": "About",
        "slug": slug,
        "content": "<p>Hello</p>",
        "meta_title": None,
        "meta_description": None,
    }
    resp1 = client.post("/admin/company", json=payload, headers=headers)
    assert resp1.status_code == 201, resp1.text

    resp2 = client.post("/admin/company", json=payload, headers=headers)
    assert resp2.status_code == 409, resp2.text


def test_list_properties_sort_and_pagination(client: TestClient) -> None:
    token = str(uuid4())
    _admin_create_property(client, title=f"{token} Low", slug=f"{token}-low", status="active")
    # Insert a second property with higher price directly for deterministic sorting.
    with SessionLocal() as db:
        db.add(
            Property(
                source_id=f"src-{uuid4()}",
                title=f"{token} High",
                description=None,
                type="new",
                price=Decimal("9999999.99"),
                bedrooms=None,
                bathrooms=None,
                size=None,
                address="789 Test Road",
                city="Pattaya",
                images=None,
                slug=f"{token}-high",
                status="active",
            )
        )
        db.commit()

    asc_resp = client.get(f"/v1/properties?search={token}&sort=price_asc&limit=20")
    assert asc_resp.status_code == 200
    asc_data = asc_resp.json()["data"]
    assert len(asc_data) == 2
    assert token in asc_data[0]["title"] and "Low" in asc_data[0]["title"]

    page1 = client.get(f"/v1/properties?search={token}&sort=price_asc&limit=1&page=1")
    assert page1.status_code == 200
    body1 = page1.json()
    assert body1["meta"]["total"] == 2
    assert len(body1["data"]) == 1


def test_company_created_at_present_in_response(client: TestClient) -> None:
    token = str(uuid4())
    item = _admin_create_company_info(client, slug=f"about-{token}")
    assert "created_at" in item
    assert "updated_at" in item
