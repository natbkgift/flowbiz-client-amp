from datetime import UTC, datetime, timedelta
from uuid import uuid4

from packages.core.ai_optimization import build_ai_optimization_summary
from packages.core.database import SessionLocal, init_db
from packages.core.models import AnalyticsEvent, Inquiry


def _ai_event_payload(ai_session_id: str | None) -> dict:
    return {
        "payload": {
            "context": {"ai_session_id": ai_session_id} if ai_session_id else {},
        }
    }


def _unique_future_now(month: int, day: int, hour: int) -> datetime:
    minute_offset = int(uuid4().hex[:4], 16) % 720
    return datetime(2035, month, day, hour, 0, tzinfo=UTC) + timedelta(
        minutes=minute_offset
    )


def test_ai_chat_uses_session_memory_to_avoid_repeating_questions(client):
    response = client.post(
        "/v1/agents/sales_agent_v1/chat",
        json={
            "locale": "en",
            "page_context": {
                "locale": "en",
                "page_type": "shared",
                "source_page": "/en/contact",
                "source_route": "contact",
            },
            "lead_profile": {
                "intent": "invest",
                "buyer_type": "investor",
            },
            "session_memory": {
                "lead_profile": {
                    "intent": "invest",
                    "buyer_type": "investor",
                },
                "viewed_property_ids": [],
                "viewed_project_ids": [],
                "viewed_area_ids": [],
                "recent_paths": ["/en/contact"],
                "recent_actions": [],
                "asked_question_keys": ["budget_range"],
                "last_recommendation_slugs": [],
                "conversation_outcome": "active",
                "message_count": 1,
            },
            "message": "Still focused on Jomtien condos, but I need help with the next step.",
            "history": [],
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["next_question_key"] == "timeframe"
    assert body["session_memory"]["asked_question_keys"][0] == "timeframe"
    assert "budget_range" in body["session_memory"]["asked_question_keys"]
    assert body["lead_profile"]["preferred_area"] == "Jomtien"
    assert "budget range" not in body["reply"].lower()


def test_build_ai_optimization_summary_aliases_browser_sessions_to_ai_sessions():
    init_db()
    now = _unique_future_now(1, 15, 12)
    browser_session_id = f"web-{uuid4().hex[:8]}"
    ai_session_id = f"ai-{uuid4().hex[:8]}"

    with SessionLocal() as db:
        db.query(AnalyticsEvent).filter(
            AnalyticsEvent.created_at >= now - timedelta(days=2),
            AnalyticsEvent.created_at <= now + timedelta(days=2),
        ).delete(synchronize_session=False)
        db.query(Inquiry).filter(
            Inquiry.created_at >= now - timedelta(days=2),
            Inquiry.created_at <= now + timedelta(days=2),
        ).delete(synchronize_session=False)
        db.commit()

        db.add_all(
            [
                AnalyticsEvent(
                    event_type="ai_chat_open",
                    page="/en/property/azure-condo",
                    session_id=browser_session_id,
                    payload=_ai_event_payload(None),
                    created_at=now - timedelta(minutes=20),
                ),
                AnalyticsEvent(
                    event_type="ai_chat_message",
                    page="/en/property/azure-condo",
                    session_id=browser_session_id,
                    payload=_ai_event_payload(ai_session_id),
                    created_at=now - timedelta(minutes=18),
                ),
                AnalyticsEvent(
                    event_type="ai_recommendation_view",
                    page="/en/property/azure-condo",
                    session_id=browser_session_id,
                    payload=_ai_event_payload(ai_session_id),
                    created_at=now - timedelta(minutes=16),
                ),
                AnalyticsEvent(
                    event_type="ai_handoff_prompt",
                    page="/en/property/azure-condo",
                    session_id=browser_session_id,
                    payload=_ai_event_payload(ai_session_id),
                    created_at=now - timedelta(minutes=14),
                ),
                Inquiry(
                    intent="viewing",
                    name="Alex Buyer",
                    email="alex@example.com",
                    message="Book a viewing for me.",
                    source_page="/en/property/azure-condo",
                    session_id=ai_session_id,
                    status="viewing_scheduled",
                    follow_up_status="scheduled",
                    score=90,
                    tags=["lead_source:ai_widget", "lead_tier:hot"],
                    created_at=now - timedelta(minutes=10),
                ),
            ]
        )
        db.commit()

        summary = build_ai_optimization_summary(db, now=now, lookback_days=1)

    assert summary.funnel.conversations == 1
    assert summary.funnel.leads == 1
    assert summary.funnel.booked_viewings == 1
    assert summary.outcome_counts.converted == 1
    assert summary.chat_to_lead_rate == 100.0
    assert summary.lead_to_viewing_rate == 100.0
    assert summary.drop_off_stage == "healthy"


def test_build_ai_optimization_summary_tightens_tuning_when_recommendations_do_not_handoff():
    init_db()
    now = _unique_future_now(2, 20, 15)
    browser_session_id = f"web-{uuid4().hex[:8]}"
    ai_session_id = f"ai-{uuid4().hex[:8]}"

    with SessionLocal() as db:
        db.query(AnalyticsEvent).filter(
            AnalyticsEvent.created_at >= now - timedelta(days=2),
            AnalyticsEvent.created_at <= now + timedelta(days=2),
        ).delete(synchronize_session=False)
        db.query(Inquiry).filter(
            Inquiry.created_at >= now - timedelta(days=2),
            Inquiry.created_at <= now + timedelta(days=2),
        ).delete(synchronize_session=False)
        db.commit()

        db.add_all(
            [
                AnalyticsEvent(
                    event_type="ai_chat_message",
                    page="/en/project/azure-bay",
                    session_id=browser_session_id,
                    payload=_ai_event_payload(ai_session_id),
                    created_at=now - timedelta(minutes=12),
                ),
                AnalyticsEvent(
                    event_type="ai_recommendation_view",
                    page="/en/project/azure-bay",
                    session_id=browser_session_id,
                    payload=_ai_event_payload(ai_session_id),
                    created_at=now - timedelta(minutes=10),
                ),
            ]
        )
        db.commit()

        summary = build_ai_optimization_summary(db, now=now, lookback_days=1)

    assert summary.drop_off_stage == "recommendation_to_handoff"
    assert summary.tuning.cta_mode == "assertive"
    assert summary.tuning.recommendation_limit == 2
    assert summary.tuning.question_budget == 1


def test_ai_optimization_summary_endpoint_returns_contract(client):
    response = client.get("/v1/agents/sales_agent_v1/optimization-summary?lookback_days=30")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["lookback_days"] == 30
    assert set(body["funnel"]).issuperset({"conversations", "leads", "booked_viewings"})
    assert set(body["tuning"]).issuperset(
        {
            "cta_mode",
            "recommendation_limit",
            "question_budget",
            "force_cta_after_recommendation",
            "fallback_mode",
        }
    )
