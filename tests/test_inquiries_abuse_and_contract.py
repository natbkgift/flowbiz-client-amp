from __future__ import annotations

from fastapi.testclient import TestClient

from packages.core.config import settings


def test_inquiries_requires_email_or_phone(client: TestClient) -> None:
    res = client.post(
        "/v1/inquiries",
        json={
            "name": "Test User",
            "message": "Hello",
            "source_page": "https://example.com",
        },
    )
    assert res.status_code == 422


def test_inquiries_honeypot_blocks(client: TestClient) -> None:
    res = client.post(
        "/v1/inquiries",
        json={
            "name": "Bot",
            "email": "bot@example.com",
            "message": "spam",
            "website": "https://spam.example",
        },
    )
    assert res.status_code == 400


def test_inquiries_rate_limit_429(client: TestClient) -> None:
    original_limit = getattr(settings, "inquiries_rate_limit_per_minute", None)

    # Force a low limit for deterministic testing.
    settings.inquiries_rate_limit_per_minute = 2  # type: ignore[attr-defined]

    try:
        payload = {
            "name": "Rate",
            "email": "rate@example.com",
            "message": "Hello",
        }

        r1 = client.post("/v1/inquiries", json=payload)
        assert r1.status_code in (201, 200)

        r2 = client.post("/v1/inquiries", json=payload)
        assert r2.status_code in (201, 200)

        r3 = client.post("/v1/inquiries", json=payload)
        assert r3.status_code == 429
    finally:
        if original_limit is not None:
            settings.inquiries_rate_limit_per_minute = original_limit  # type: ignore[attr-defined]
