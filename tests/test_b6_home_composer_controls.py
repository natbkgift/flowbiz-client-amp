from __future__ import annotations

from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

import pytest

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import HomeComposerConfig, Project, Property, User


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(HomeComposerConfig).delete()
        db.query(Project).delete()
        db.query(Property).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
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

    preview = client.get("/admin/home-composer/preview/draft?page_key=home&locale=th", headers=headers)
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
