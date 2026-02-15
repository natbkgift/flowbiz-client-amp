from fastapi.testclient import TestClient


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
