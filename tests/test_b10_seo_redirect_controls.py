from sqlalchemy import delete

from packages.core.auth import hash_password
from packages.core.database import SessionLocal
from packages.core.models import RedirectRule, SeoPageOverride, User


def _ensure_admin_user() -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@local.dev").first()
        if user is None:
            user = User(email="admin@local.dev", password_hash=hash_password("admin123"), role="admin")
        else:
            user.password_hash = hash_password("admin123")
            user.role = "admin"
        db.add(user)
        db.commit()
    finally:
        db.close()


def _login_token(client) -> str:
    _ensure_admin_user()
    response = client.post("/v1/auth/login", json={"email": "admin@local.dev", "password": "admin123"})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_b10_seo_override_read_write_and_fallback(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    with SessionLocal() as db:
        db.execute(delete(SeoPageOverride))
        db.commit()

    created = client.put(
        "/admin/seo-overrides",
        headers=headers,
        json={
            "path": "/en/projects",
            "locale": "en",
            "title": "Projects Override",
            "description": "Override desc",
            "canonical": "https://amppattaya.com/en/projects/",
            "robots_index": True,
            "robots_follow": True,
            "schema_org_name": "AMP Pattaya",
            "schema_local_business_name": "AMP Agency",
            "schema_article_author": "AMP Editorial",
            "enabled": True,
        },
    )
    assert created.status_code == 200, created.text

    resolved = client.get("/v1/seo/resolve?path=/en/projects&locale=en")
    assert resolved.status_code == 200
    body = resolved.json()
    assert body["found"] is True
    assert body["title"] == "Projects Override"

    fallback = client.get("/v1/seo/resolve?path=/en/not-found&locale=en")
    assert fallback.status_code == 200
    assert fallback.json()["found"] is False


def test_b10_redirect_validation_and_resolution(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    with SessionLocal() as db:
        db.execute(delete(RedirectRule))
        db.commit()

    bad = client.post(
        "/admin/redirects",
        headers=headers,
        json={"old_path": "/self", "new_path": "/self", "status_code": 301, "enabled": True, "preserve_query": True},
    )
    assert bad.status_code == 422

    ok = client.post(
        "/admin/redirects",
        headers=headers,
        json={"old_path": "/old-projects", "new_path": "/en/projects", "status_code": 301, "enabled": True, "preserve_query": True},
    )
    assert ok.status_code == 201, ok.text

    resolved = client.get("/v1/redirects/resolve?path=/old-projects&query_string=utm_source=test")
    assert resolved.status_code == 200
    payload = resolved.json()
    assert payload["matched"] is True
    assert payload["status_code"] == 301
    assert "utm_source=test" in payload["location"]


def test_b10_redirect_loop_guard(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    with SessionLocal() as db:
        db.execute(delete(RedirectRule))
        db.commit()

    first = client.post(
        "/admin/redirects",
        headers=headers,
        json={"old_path": "/a", "new_path": "/b", "status_code": 301, "enabled": True, "preserve_query": True},
    )
    assert first.status_code == 201

    second = client.post(
        "/admin/redirects",
        headers=headers,
        json={"old_path": "/b", "new_path": "/a", "status_code": 301, "enabled": True, "preserve_query": True},
    )
    assert second.status_code == 422


def test_b10_broken_link_report(client):
    token = _login_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    report = client.get("/admin/broken-links/report", headers=headers)
    assert report.status_code == 200
    body = report.json()
    assert "summary" in body
    assert "issues" in body
    assert isinstance(body["issues"], list)
