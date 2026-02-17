def test_create_analytics_event(client):
    resp = client.post(
        "/v1/analytics/events",
        json={"event_type": "page_view", "payload": {"path": "/demo"}},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["event_type"] == "page_view"
    assert data["payload"] == {"path": "/demo"}
    assert "id" in data
    assert "created_at" in data


def test_create_event_v2_requires_fields(client):
    resp = client.post(
        "/v1/events",
        json={"event_type": "page_view"},
    )
    assert resp.status_code == 422


def test_create_event_v2_success_and_rate_limit_headers(client):
    from packages.core.config import settings

    original_limit = getattr(settings, "events_rate_limit_per_minute", None)
    settings.events_rate_limit_per_minute = 2  # type: ignore[attr-defined]
    try:
        payload = {
            "event_type": "page_view",
            "page": "/en",
            "session_id": "sess_test_12345",
            "payload": {"k": "v"},
        }

        r1 = client.post("/v1/events", json=payload)
        assert r1.status_code == 201

        r2 = client.post("/v1/events", json=payload)
        assert r2.status_code == 201

        r3 = client.post("/v1/events", json=payload)
        assert r3.status_code == 429
        assert "Retry-After" in r3.headers
        assert "X-RateLimit-Remaining" in r3.headers
    finally:
        if original_limit is not None:
            settings.events_rate_limit_per_minute = original_limit  # type: ignore[attr-defined]
