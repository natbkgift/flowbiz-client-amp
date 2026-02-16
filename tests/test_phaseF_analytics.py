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
