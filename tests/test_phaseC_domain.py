def _login_token(client) -> str:
    resp = client.post(
        "/v1/auth/login",
        json={"email": "admin@local.dev", "password": "admin123"},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_domain_lists_empty_by_default(client):
    assert client.get("/v1/areas").status_code == 200
    assert client.get("/v1/developers").status_code == 200
    assert client.get("/v1/agents").status_code == 200


def test_admin_can_create_and_list_domain_entities(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    area = client.post(
        "/admin/areas",
        json={"name": "Pattaya", "slug": "pattaya", "city": "Pattaya", "status": "published"},
        headers=headers,
    )
    assert area.status_code == 201

    dev = client.post(
        "/admin/developers",
        json={
            "name": "DevCo",
            "slug": "devco",
            "website": "https://example.com",
            "status": "active",
        },
        headers=headers,
    )
    assert dev.status_code == 201

    agent = client.post(
        "/admin/agents",
        json={"name": "Agent A", "email": "a@example.com", "phone": "+66000000000"},
        headers=headers,
    )
    assert agent.status_code == 201

    assert client.get("/v1/areas").json()
    assert client.get("/v1/developers").json()
    assert client.get("/v1/agents").json()
