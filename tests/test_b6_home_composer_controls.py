from __future__ import annotations

from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

import pytest

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import AnalyticsEvent, HomeComposerConfig, Project, Property, User


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(AnalyticsEvent).delete()
        db.query(HomeComposerConfig).delete()
        db.query(Project).delete()
        db.query(Property).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(AnalyticsEvent).delete()
        db.query(HomeComposerConfig).delete()
        db.query(Project).delete()
        db.query(Property).delete()
        db.query(User).delete()
        db.commit()


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _seed_project(*, status: str = "published", name: str = "Project") -> str:
    with SessionLocal() as db:
        row = Project(
            slug=f"project-{uuid4()}",
            name=name,
            status=status,
            property_type="condo",
            summary={"en": "summary"},
            cover_image_url=f"/media/library/{uuid4()}.jpg",
            is_featured=True,
        )
        db.add(row)
        db.commit()
        return str(row.id)


def _seed_property(*, status: str = "active", title: str = "Property") -> str:
    with SessionLocal() as db:
        row = Property(
            source_id=f"src-{uuid4()}",
            slug=f"property-{uuid4()}",
            title=title,
            type="new",
            status=status,
            price=Decimal("2500000"),
            address="Pattaya",
            city="Pattaya",
            cover_image_url=f"/media/library/{uuid4()}.jpg",
        )
        db.add(row)
        db.commit()
        return str(row.id)


def test_b6_create_patch_publish_unpublish_and_preview(client) -> None:
    headers = _make_admin_headers()

    created = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "draft",
            "version": 1,
            "config": {
                "hero": {
                    "headline": {"en": "Headline EN", "th": "หัวข้อ TH"},
                    "subheadline": {"en": "Sub EN", "th": "ซับ TH"},
                    "cta": {"text": {"en": "Explore", "th": "สำรวจ"}, "href": "/projects"},
                    "media_path": "/media/library/hero-b6.jpg",
                }
            },
        },
    )
    assert created.status_code == 201, created.text
    composer_id = created.json()["id"]

    preview = client.get(
        "/admin/home-composer/preview/draft?page_key=home&locale=th", headers=headers
    )
    assert preview.status_code == 200, preview.text
    assert preview.json()["resolved_locale"] == "en"
    assert preview.json()["source"] == "draft"

    patched = client.patch(
        f"/admin/home-composer/{composer_id}",
        headers=headers,
        json={
            "config": {
                "hero": {
                    "cta": {"href": "/contact"},
                }
            }
        },
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["config"]["hero"]["cta"]["href"] == "/contact"
    assert patched.json()["config"]["hero"]["headline"]["en"] == "Headline EN"

    published = client.post(f"/admin/home-composer/{composer_id}/publish", headers=headers)
    assert published.status_code == 200, published.text

    public_published = client.get("/v1/home-composer?page_key=home&locale=en")
    assert public_published.status_code == 200, public_published.text
    assert public_published.json()["source"] == "published"

    unpublished = client.post(f"/admin/home-composer/{composer_id}/unpublish", headers=headers)
    assert unpublished.status_code == 200, unpublished.text

    public_default = client.get("/v1/home-composer?page_key=home&locale=en")
    assert public_default.status_code == 200, public_default.text
    assert public_default.json()["source"] == "safe_default"


def test_b6_safe_default_locale_fallback_and_section_ordering(client) -> None:
    headers = _make_admin_headers()

    no_published = client.get("/v1/home-composer?page_key=home&locale=en")
    assert no_published.status_code == 200, no_published.text
    assert no_published.json()["source"] == "safe_default"

    created = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "published",
            "version": 2,
            "config": {
                "sections": [
                    {"key": "reviews", "enabled": False, "order": 10},
                    {"key": "hero", "enabled": True, "order": 1},
                    {"key": "featured_projects", "enabled": True, "order": 2},
                ]
            },
        },
    )
    assert created.status_code == 201, created.text

    th_public = client.get("/v1/home-composer?page_key=home&locale=th")
    assert th_public.status_code == 200, th_public.text
    data = th_public.json()
    assert data["resolved_locale"] == "en"

    sections = data["config"]["sections"]
    orders = [row["order"] for row in sections]
    assert orders == sorted(orders)
    assert any(row["key"] == "reviews" and row["enabled"] is False for row in sections)

    invalid_locale = client.get("/v1/home-composer?page_key=home&locale=jp")
    assert invalid_locale.status_code == 422, invalid_locale.text


def test_b6_featured_and_investment_manual_with_auto_fallback_and_content_blocks(client) -> None:
    headers = _make_admin_headers()

    p1 = _seed_project(name="P1")
    p2 = _seed_project(name="P2")
    unit1 = _seed_property(title="U1")
    unit2 = _seed_property(title="U2")

    response = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "published",
            "version": 5,
            "config": {
                "featured": {
                    "strategy": "manual",
                    "manual_project_ids": [p1, str(uuid4())],
                    "limit": 2,
                },
                "investment_picks": {
                    "strategy": "manual",
                    "manual_property_ids": [unit1, str(uuid4())],
                    "limit": 2,
                },
                "trust_blocks": [
                    {
                        "key": "licensed",
                        "title": {"en": "Licensed Team", "th": "ทีมมีใบอนุญาต"},
                        "body": {"en": "Verified process", "th": "กระบวนการตรวจสอบ"},
                        "icon_path": "/media/library/trust-1.png",
                        "updated_at": datetime(2026, 2, 27, tzinfo=UTC).isoformat(),
                    }
                ],
                "proof_assets": [
                    {
                        "key": "proof-1",
                        "label": {"en": "Proof", "th": "หลักฐาน"},
                        "media_path": "/media/library/proof-1.jpg",
                        "updated_at": datetime(2026, 2, 27, tzinfo=UTC).isoformat(),
                    }
                ],
                "reviews": {"source": "manual", "source_ids": ["r-1", "r-2"]},
                "video": {"source": "manual", "video_paths": ["/media/library/video-1.mp4"]},
            },
        },
    )
    assert response.status_code == 201, response.text

    public_home = client.get("/v1/home-composer?page_key=home&locale=en")
    assert public_home.status_code == 200, public_home.text
    payload = public_home.json()

    featured_ids = [row["id"] for row in payload["resolved"]["featured_projects"]]
    assert len(featured_ids) == 2
    assert p1 in featured_ids
    assert p2 in featured_ids

    investment_ids = [row["id"] for row in payload["resolved"]["investment_picks"]]
    assert len(investment_ids) == 2
    assert unit1 in investment_ids
    assert unit2 in investment_ids

    assert payload["resolved"]["trust_blocks"][0]["key"] == "licensed"
    assert payload["resolved"]["proof_assets"][0]["media_path"].startswith("/media/")
    assert payload["resolved"]["reviews"]["source"] == "manual"
    assert payload["resolved"]["video"]["video_paths"][0].startswith("/media/")


def test_b6_validation_rules_and_malformed_payloads(client) -> None:
    headers = _make_admin_headers()

    invalid_locale = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "jp",
            "status": "draft",
            "config": {},
        },
    )
    assert invalid_locale.status_code == 422, invalid_locale.text

    invalid_strategy = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "draft",
            "config": {"featured": {"strategy": "bad_value"}},
        },
    )
    assert invalid_strategy.status_code == 422, invalid_strategy.text

    duplicate_key = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "draft",
            "config": {
                "sections": [
                    {"key": "hero", "enabled": True, "order": 0},
                    {"key": "hero", "enabled": True, "order": 1},
                ]
            },
        },
    )
    assert duplicate_key.status_code == 422, duplicate_key.text

    duplicate_order = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "draft",
            "config": {
                "sections": [
                    {"key": "hero", "enabled": True, "order": 1},
                    {"key": "featured_projects", "enabled": True, "order": 1},
                ]
            },
        },
    )
    assert duplicate_order.status_code == 422, duplicate_order.text

    invalid_cta_href = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "draft",
            "config": {
                "hero": {
                    "cta": {
                        "text": {"en": "Click", "th": "คลิก"},
                        "href": "https://evil.test/path",
                    }
                }
            },
        },
    )
    assert invalid_cta_href.status_code == 422, invalid_cta_href.text

    invalid_media_path = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "draft",
            "config": {
                "proof_assets": [
                    {
                        "key": "proof",
                        "label": {"en": "Proof", "th": "หลักฐาน"},
                        "media_path": "https://external.test/proof.jpg",
                    }
                ]
            },
        },
    )
    assert invalid_media_path.status_code == 422, invalid_media_path.text


def test_b6_backward_compatibility_with_legacy_payload(client) -> None:
    headers = _make_admin_headers()
    project_id = _seed_project(name="Legacy Project")
    property_id = _seed_property(title="Legacy Unit")

    created = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "published",
            "version": 3,
            "config": {
                "sections": [{"type": "project_cards", "project_ids": [project_id], "order": 0}],
                "hero": {
                    "headline": "Legacy Headline",
                    "subheadline": "Legacy Subheadline",
                    "cta": {"label": "See projects", "href": "/projects"},
                },
                "featured_projects": {
                    "strategy": "manual",
                    "project_ids": [project_id],
                    "limit": 2,
                },
                "investment": {
                    "strategy": "manual",
                    "property_ids": [property_id],
                    "limit": 2,
                },
            },
        },
    )
    assert created.status_code == 201, created.text

    public_home = client.get("/v1/home-composer?page_key=home&locale=en")
    assert public_home.status_code == 200, public_home.text

    payload = public_home.json()
    first_section = payload["config"]["sections"][0]
    assert first_section["key"] == "featured_projects"
    assert project_id in first_section["project_ids"]
    assert payload["resolved"]["hero"]["headline"] == "Legacy Headline"
    assert payload["resolved"]["featured_projects"][0]["id"] == project_id


def test_b6_additive_contract_fields_and_media_allowlist(client) -> None:
    headers = _make_admin_headers()

    created = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "published",
            "version": 7,
            "config": {
                "hero_secondary_cta": {
                    "text": {"en": "Browse Curated Projects", "th": "ดูโครงการคัดสรร"},
                    "href": "/projects",
                },
                "path_selector": {
                    "cards": [
                        {
                            "key": "invest",
                            "fit": {"en": "For yield-focused investors"},
                            "outcome": {"en": "Get vetted picks + risk notes"},
                            "href": "/investment?intent=invest",
                        },
                        {
                            "key": "buy",
                            "fit": {"en": "For end-buyers moving to Pattaya"},
                            "outcome": {"en": "Receive shortlist + legal steps"},
                            "href": "/projects?intent=buy",
                        },
                        {
                            "key": "rent",
                            "fit": {"en": "For lifestyle renters and expats"},
                            "outcome": {"en": "Compare ready-to-move options"},
                            "href": "/rent?intent=rent",
                        },
                        {
                            "key": "sell",
                            "fit": {"en": "For owners preparing an exit"},
                            "outcome": {"en": "Get pricing and go-to-market plan"},
                            "href": "/sell?intent=sell",
                        },
                    ]
                },
                "trust_micro_strip": [
                    {"key": "media", "text": {"en": "Local-only media"}},
                    {"key": "sla", "text": {"en": "Reply within 1 business day"}},
                ],
                "video_items": [
                    {
                        "key": "v1",
                        "video_path": "/media/library/videos/video-1.mp4",
                        "thumbnail_path": "https://flowbiz.com/media/library/videos/thumb-1.webp",
                        "poster_path": "/media/library/videos/poster-1.webp",
                    }
                ],
                "consultation": {
                    "promise_copy": {
                        "en": "Tell us your budget and timeline—we’ll send a curated shortlist and floor plans within 1 business day."
                    },
                    "trust_note": {"en": "No spam • Reply within 1 business day"},
                    "submit_text": {"en": "Request Consultation"},
                },
            },
        },
    )
    assert created.status_code == 201, created.text

    public_home = client.get("/v1/home-composer?page_key=home&locale=en")
    assert public_home.status_code == 200, public_home.text
    payload = public_home.json()["resolved"]

    assert payload["hero_secondary_cta"]["text"] == "Browse Curated Projects"
    assert payload["hero_secondary_cta"]["href"] == "/projects"
    assert [item["key"] for item in payload["path_selector"]["cards"]] == [
        "invest",
        "buy",
        "rent",
        "sell",
    ]
    assert payload["trust_micro_strip"][0]["text"] == "Local-only media"
    assert (
        payload["video_items"][0]["thumbnail_path"]
        == "https://flowbiz.com/media/library/videos/thumb-1.webp"
    )
    assert payload["consultation"]["submit_text"] == "Request Consultation"

    invalid_external = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "draft",
            "config": {
                "video_items": [
                    {
                        "key": "bad",
                        "thumbnail_path": "https://evil.test/video-thumb.webp",
                    }
                ]
            },
        },
    )
    assert invalid_external.status_code == 422, invalid_external.text


def test_b6_public_home_blueprint_fields_roundtrip(client) -> None:
    headers = _make_admin_headers()

    response = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "published",
            "version": 9,
            "config": {
                "enabled_sections": [
                    "hero",
                    "trust_micro_strip",
                    "path_selector",
                    "featured_projects",
                    "featured_properties",
                    "why_pattaya",
                    "proof_trust",
                    "market_insights",
                    "reviews",
                    "videos",
                    "team_cta",
                    "bottom_cta",
                ],
                "section_order": [
                    "hero",
                    "trust_micro_strip",
                    "path_selector",
                    "featured_projects",
                    "featured_properties",
                    "why_pattaya",
                    "proof_trust",
                    "market_insights",
                    "reviews",
                    "videos",
                    "team_cta",
                    "bottom_cta",
                ],
                "hero": {
                    "eyebrow": "Advisory-first brief",
                    "heading": "Curated Pattaya opportunities",
                    "subheading": "Verified supply, clear next steps.",
                    "primary_cta_label": "Talk to AMP",
                    "primary_cta_url": "/contact",
                    "secondary_cta_label": "Browse deals",
                    "secondary_cta_url": "/projects",
                    "hero_image": "/media/library/home/hero-runtime.webp",
                },
                "path_selector": {
                    "enabled": True,
                    "heading": "Choose the right path",
                    "subcopy": "Start from your goal, not listing volume.",
                    "paths": [
                        {
                            "key": "invest",
                            "label": "Invest",
                            "description": "Compare yield and downside before touring.",
                            "url": "/invest",
                        },
                        {
                            "key": "buy",
                            "label": "Buy",
                            "description": "Clarify quota, fees, and next steps.",
                            "url": "/buy",
                        },
                    ],
                },
                "trust_micro_strip": [
                    {"key": "local-team", "text": {"en": "Local Pattaya team"}},
                    {"key": "verified", "text": {"en": "Verified inventory only"}},
                ],
                "proof_trust": {
                    "heading": "Advisory proof",
                    "subcopy": "Signals, process, and trust in one place.",
                    "primary_cta_label": "Meet the team",
                    "primary_cta_url": "/about",
                    "secondary_cta_label": "How we work",
                    "secondary_cta_url": "/about#how-we-work",
                },
                "team_cta": {
                    "eyebrow": "Local advisory team",
                    "heading": "Work with specialists, not a listing dump",
                    "subheading": "We curate the shortlist around your brief.",
                    "trust_note": "Built around goals, budget, and timeline.",
                },
                "bottom_cta": {
                    "heading": "Ready for a shortlist?",
                    "subheading": "Share your budget and intent.",
                    "trust_note": "Reply within one business day.",
                    "form_heading": "Request private consultation",
                    "form_body": "Tell us your target budget and timing.",
                },
            },
        },
    )
    assert response.status_code == 201, response.text

    public_home = client.get("/v1/home-composer?page_key=home&locale=en")
    assert public_home.status_code == 200, public_home.text
    config = public_home.json()["config"]

    assert config["section_order"][1] == "trust_micro_strip"
    assert config["hero"]["eyebrow"] == "Advisory-first brief"
    assert config["hero"]["heading"] == "Curated Pattaya opportunities"
    assert config["path_selector"]["heading"] == "Choose the right path"
    assert (
        config["path_selector"]["paths"][0]["description"]
        == "Compare yield and downside before touring."
    )
    assert config["trust_micro_strip"][0]["text"]["en"] == "Local Pattaya team"
    assert config["proof_trust"]["primary_cta_label"] == "Meet the team"
    assert config["team_cta"]["trust_note"] == "Built around goals, budget, and timeline."
    assert config["bottom_cta"]["form_heading"] == "Request private consultation"


def test_b6_events_endpoint_lock(client) -> None:
    response = client.post(
        "/v1/events",
        json={
            "event": "home_hero_primary_click",
            "label": "Request Consultation",
            "locale": "en",
            "path": "/en",
        },
    )
    assert response.status_code == 202, response.text
    payload = response.json()
    assert payload["ok"] is True
    assert payload["endpoint"] == "/api/v1/events"
    assert payload["event"] == "home_hero_primary_click"


def test_b6_events_endpoint_backfills_legacy_flattened_payload_metadata(client) -> None:
    first = client.post(
        "/v1/events",
        json={
            "event": "home_browse_projects_click",
            "locale": "en",
            "path": "/en",
            "placement": "featured_footer",
            "cta_id": "hero_secondary",
            "card_id": "project-alpha",
            "card_slug": "project-alpha",
        },
    )
    second = client.post(
        "/v1/events",
        json={
            "event": "home_browse_projects_click",
            "locale": "en",
            "path": "/en",
            "placement": "featured_footer",
            "cta_id": "hero_secondary",
            "card_id": "project-beta",
            "card_slug": "project-beta",
        },
    )
    assert first.status_code == 202, first.text
    assert second.status_code == 202, second.text
    first_payload = first.json()
    second_payload = second.json()
    assert first_payload["path"] == "/en"
    assert second_payload["path"] == "/en"
    assert first_payload["idempotency_key"] != second_payload["idempotency_key"]


def test_b6_events_endpoint_accepts_spec_envelope(client) -> None:
    response = client.post(
        "/v1/events",
        json={
            "schema_version": "1.0",
            "event_id": "evt_test_123",
            "event_name": "home_form_submit",
            "occurred_at": "2026-02-28T15:04:05.123Z",
            "source": {
                "app": "amppattaya-web",
                "env": "prod",
                "page": "/en",
                "locale": "en",
                "placement": "footer_form",
            },
            "actor": {
                "anonymous_id": "anon_test",
                "session_id": "sess_test",
                "user_agent": "pytest",
            },
            "context": {"referrer": "https://www.google.com/"},
            "payload": {
                "intent": "invest",
                "fields_present": ["name", "email", "budget_range", "purpose", "timeline"],
                "form": {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "whatsapp": "+31612345678",
                    "budget_range": "4-6M THB",
                    "purpose": "invest",
                    "timeline": "1-3 months",
                },
            },
        },
    )
    assert response.status_code == 202, response.text
    payload = response.json()
    assert payload["ok"] is True
    assert payload["endpoint"] == "/api/v1/events"
    assert payload["event"] == "home_form_submit"
    assert payload["event_name"] == "home_form_submit"
    assert payload["event_id"] == "evt_test_123"
    assert payload["schema_version"] == "1.0"
    assert payload["locale"] == "en"
    assert payload["path"] == "/en"
    assert len(payload["idempotency_key"]) == 64


def test_b6_events_endpoint_persists_area_taxonomy_payload(client) -> None:
    response = client.post(
        "/v1/events",
        json={
            "event_name": "area_cta_click",
            "source": {
                "app": "flowbiz-public-runtime",
                "page": "/en/area-guide/jomtien",
                "locale": "en",
                "placement": "area_detail_footer",
            },
            "actor": {"session_id": "sess-area", "user_agent": "pytest"},
            "payload": {
                "placement": "area_detail_footer",
                "cta_id": "area_consult",
                "area_slug": "jomtien",
            },
        },
    )
    assert response.status_code == 202, response.text
    body = response.json()
    assert body["taxonomy_valid"] is True
    assert body["taxonomy_missing_fields"] == []

    with SessionLocal() as db:
        row = db.query(AnalyticsEvent).filter(AnalyticsEvent.event_type == "area_cta_click").first()
        assert row is not None
        payload = row.payload or {}
        assert payload.get("event_name") == "area_cta_click"
        assert (payload.get("source") or {}).get("locale") == "en"
        assert (payload.get("payload") or {}).get("area_slug") == "jomtien"
        taxonomy = payload.get("taxonomy") or {}
        assert taxonomy.get("valid") is True
