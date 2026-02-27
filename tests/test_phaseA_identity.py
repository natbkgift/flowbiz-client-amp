def test_auth_me_returns_identity(client):
    login = client.post(
        "/v1/auth/login",
        json={"email": "admin@local.dev", "password": "admin123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "admin@local.dev"
    assert "admin" in data["roles"]


def test_refresh_rotation_invalidates_old_token(client):
    login = client.post(
        "/v1/auth/login-with-refresh",
        json={"email": "admin@local.dev", "password": "admin123"},
    )
    assert login.status_code == 200
    pair = login.json()
    assert "access_token" in pair
    assert "refresh_token" in pair

    refresh1 = pair["refresh_token"]

    rotated = client.post("/v1/auth/refresh", json={"refresh_token": refresh1})
    assert rotated.status_code == 200
    pair2 = rotated.json()
    assert pair2["refresh_token"] != refresh1

    # Old token should now be invalid.
    reuse = client.post("/v1/auth/refresh", json={"refresh_token": refresh1})
    assert reuse.status_code == 401

    # New token should work.
    ok = client.post("/v1/auth/refresh", json={"refresh_token": pair2["refresh_token"]})
    assert ok.status_code == 200
