from fastapi.testclient import TestClient

from apps.api.main import app

client = TestClient(app)


def test_phase1_score_endpoint():
    response = client.post(
        "/v1/phase1/score",
        json={
            "source_page": "/buy-condo-pattaya",
            "purpose": "buy_live",
            "budget_range": "2m_5m",
            "timeline": "1_3mo",
            "in_thailand": "yes_elsewhere",
            "first_name": "John",
            "preferred_channel": "email",
            "contact_value": "john@example.com",
            "country": "UK",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "lead_id" in data
    assert data["lead_id"]
    assert "lead_score" in data
    assert data["lead_temp"] in {"cold", "warm", "hot", "fire"}
    assert data["scoring_version"] == "1.0.0"


def test_phase1_next_state_endpoint():
    response = client.post(
        "/v1/phase1/chat/next-state",
        json={
            "state": "1_purpose",
            "purpose": "buy_live",
            "chat_started": True,
            "chat_completed": False,
        },
    )
    assert response.status_code == 200
    assert response.json()["next_state"] == "2a_buyer"


def test_phase1_classification_endpoint():
    response = client.post(
        "/v1/phase1/chat/classify",
        json={"target": "purpose", "text": "I want rental for 6 months"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["target"] == "purpose"
    assert data["value"] == "rent"
