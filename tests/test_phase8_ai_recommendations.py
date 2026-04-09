from __future__ import annotations

from collections.abc import Generator
from uuid import uuid4

import pytest

from packages.core.database import SessionLocal, init_db
from packages.core.models import Area, Project, Property


@pytest.fixture(autouse=True)
def _cleanup_phase8_recommendation_fixture() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(Property).filter(Property.source_id.like("phase8-rec-%")).delete(
            synchronize_session=False
        )
        db.query(Project).filter(Project.slug.like("phase8-rec-%")).delete(
            synchronize_session=False
        )
        db.query(Area).filter(Area.slug.like("phase8-rec-%")).delete(synchronize_session=False)
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(Property).filter(Property.source_id.like("phase8-rec-%")).delete(
            synchronize_session=False
        )
        db.query(Project).filter(Project.slug.like("phase8-rec-%")).delete(
            synchronize_session=False
        )
        db.query(Area).filter(Area.slug.like("phase8-rec-%")).delete(synchronize_session=False)
        db.commit()


def _seed_phase8_recommendation_fixture() -> dict[str, str]:
    with SessionLocal() as db:
        jomtien = Area(
            slug=f"phase8-rec-area-{uuid4()}",
            name="Jomtien",
            city="Pattaya",
            status="published",
            summary={"en": "Phase 8 recommendation area"},
            cover_image_url="/media/library/phase8-rec-area.webp",
        )
        central = Area(
            slug=f"phase8-rec-area-{uuid4()}",
            name="Central Pattaya",
            city="Pattaya",
            status="published",
            summary={"en": "Phase 8 recommendation area"},
            cover_image_url="/media/library/phase8-rec-central.webp",
        )
        db.add_all([jomtien, central])
        db.flush()

        alpha = Project(
            slug=f"phase8-rec-project-{uuid4()}",
            name="Phase8 Alpha",
            status="published",
            area_id=jomtien.id,
            property_type="condo",
            cover_image_url="/media/library/phase8-rec-alpha.webp",
            summary={"en": "Phase 8 alpha project"},
        )
        beta = Project(
            slug=f"phase8-rec-project-{uuid4()}",
            name="Phase8 Beta",
            status="published",
            area_id=central.id,
            property_type="condo",
            cover_image_url="/media/library/phase8-rec-beta.webp",
            summary={"en": "Phase 8 beta project"},
        )
        db.add_all([alpha, beta])
        db.flush()

        alpha_buy = Property(
            source_id=f"phase8-rec-buy-{uuid4()}",
            slug=f"phase8-rec-buy-{uuid4()}",
            title="Phase8 Alpha Buy",
            title_i18n={"en": "Phase8 Alpha Buy EN"},
            type="resale",
            property_type="condo",
            status="active",
            price=5600000,
            bedrooms=2,
            bathrooms=2,
            size_sqm=58,
            floor=23,
            city="Pattaya",
            address="Phase8 Alpha Buy Address",
            area_id=jomtien.id,
            project_id=alpha.id,
            cover_image_url="/media/library/phase8-rec-alpha-buy.webp",
            features={"tags": ["sea view", "parking", "near beach"]},
        )
        alpha_invest = Property(
            source_id=f"phase8-rec-invest-{uuid4()}",
            slug=f"phase8-rec-invest-{uuid4()}",
            title="Phase8 Alpha Invest",
            title_i18n={"en": "Phase8 Alpha Invest EN"},
            type="new",
            property_type="condo",
            status="active",
            price=8900000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=44,
            floor=28,
            furnishing="fully_furnished",
            city="Pattaya",
            address="Phase8 Alpha Invest Address",
            area_id=jomtien.id,
            project_id=alpha.id,
            cover_image_url="/media/library/phase8-rec-alpha-invest.webp",
            features={"tags": ["furnished", "near beach"]},
        )
        beta_rent = Property(
            source_id=f"phase8-rec-rent-{uuid4()}",
            slug=f"phase8-rec-rent-{uuid4()}",
            title="Phase8 Beta Rent",
            title_i18n={"en": "Phase8 Beta Rent EN"},
            type="rent",
            property_type="condo",
            status="active",
            price=35000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=36,
            city="Pattaya",
            address="Phase8 Beta Rent Address",
            area_id=central.id,
            project_id=beta.id,
            cover_image_url="/media/library/phase8-rec-beta-rent.webp",
            features={"tags": ["parking"]},
        )
        db.add_all([alpha_buy, alpha_invest, beta_rent])
        db.flush()
        alpha_project_id = str(alpha.id)
        alpha_buy_id = str(alpha_buy.id)
        alpha_buy_slug = str(alpha_buy.slug or "")
        alpha_invest_slug = str(alpha_invest.slug or "")
        db.commit()

    return {
        "alpha_project_id": alpha_project_id,
        "alpha_buy_id": alpha_buy_id,
        "alpha_buy_slug": alpha_buy_slug,
        "alpha_invest_slug": alpha_invest_slug,
    }


def test_phase8_session_returns_project_context_recommendations(client) -> None:
    seeded = _seed_phase8_recommendation_fixture()

    response = client.post(
        "/v1/agents/sales_agent_v1/sessions",
        json={
            "locale": "en",
            "page_context": {
                "locale": "en",
                "page_type": "project",
                "source_page": "/en/projects/phase8-alpha",
                "source_route": "project",
                "entity_type": "project",
                "entity_id": seeded["alpha_project_id"],
                "entity_name": "Phase8 Alpha",
            },
            "lead_profile": {},
            "initial_message": "I want to invest around 6-10m in Jomtien within 3 months.",
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    preview = body["recommendation_preview"]
    assert preview is not None
    assert preview["strategy"] == "project_context"
    assert preview["items"][0]["slug"] == seeded["alpha_invest_slug"]
    assert preview["items"][0]["project"] == "Phase8 Alpha"
    assert any("project context" in reason.lower() for reason in preview["items"][0]["reasons"])


def test_phase8_chat_uses_smart_finder_answers_for_recommendations(client) -> None:
    seeded = _seed_phase8_recommendation_fixture()

    response = client.post(
        "/v1/agents/sales_agent_v1/chat",
        json={
            "locale": "en",
            "page_context": {
                "locale": "en",
                "page_type": "smart_finder",
                "source_page": "/en/smart-finder",
                "smart_finder_answers": {
                    "purpose": "invest",
                    "budget": "6m_10m",
                    "timeline": "3_6m",
                    "preferences": "furnished",
                },
            },
            "lead_profile": {},
            "message": "Show me the strongest options.",
            "history": [],
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    preview = body["recommendation_preview"]
    assert preview is not None
    assert preview["strategy"] == "smart_finder_context"
    assert preview["purpose"] == "invest"
    assert preview["items"][0]["slug"] == seeded["alpha_invest_slug"]
    assert any(
        "matches invest intent" in reason.lower() for reason in preview["items"][0]["reasons"]
    )
    assert any(
        action["type"] == "open_compare" and "ids=" in str(action.get("href") or "")
        for action in body["suggested_actions"]
    )


def test_phase8_chat_surfaces_compare_context_items_first(client) -> None:
    seeded = _seed_phase8_recommendation_fixture()

    response = client.post(
        "/v1/agents/sales_agent_v1/chat",
        json={
            "locale": "en",
            "page_context": {
                "locale": "en",
                "page_type": "compare",
                "source_page": "/en/compare",
                "source_route": "compare",
                "compare_property_ids": [
                    seeded["alpha_buy_id"],
                    seeded["alpha_invest_slug"],
                ],
            },
            "lead_profile": {
                "intent": "project_compare",
                "buyer_type": "investor",
                "budget_range": "6m_10m",
                "timeframe": "3_6m",
                "preferred_area": "Jomtien",
                "email": f"phase8-{uuid4().hex[:8]}@example.com",
            },
            "message": "Compare these two live options for ROI and downside.",
            "history": [],
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    preview = body["recommendation_preview"]
    assert preview is not None
    assert preview["strategy"] == "compare_context"
    first_two_slugs = {item["slug"] for item in preview["items"][:2]}
    assert first_two_slugs == {seeded["alpha_buy_slug"], seeded["alpha_invest_slug"]}
    assert all(item["source"] == "compare_context" for item in preview["items"][:2])
    assert any("compare context" in reason.lower() for reason in preview["items"][0]["reasons"])
