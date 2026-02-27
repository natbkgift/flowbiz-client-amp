from __future__ import annotations

from collections.abc import Generator
from decimal import Decimal
from uuid import uuid4

import pytest

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.home_composer import default_home_composer_config
from packages.core.models import HomeComposerConfig, MediaAsset, Project, Property, User


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(HomeComposerConfig).delete()
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(HomeComposerConfig).delete()
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _add_media_asset(
    *,
    path: str,
    rights_status: str | None,
    approval_status: str | None,
    is_exception: bool = False,
) -> None:
    with SessionLocal() as db:
        db.add(
            MediaAsset(
                storage_path=path,
                kind="image",
                mime_type="image/jpeg",
                file_size_bytes=100,
                checksum_sha256=(uuid4().hex + uuid4().hex)[:64],
                source_url="https://example.test/source.jpg",
                source_domain="example.test",
                source_type="official",
                rights_status=rights_status,
                approval_status=approval_status,
                is_exception=is_exception,
                status="active",
            )
        )
        db.commit()


def _base_config(*, locale: str = "en") -> dict:
    config = default_home_composer_config(locale=locale)
    config["hero"].update(
        {
            "heading": "Find your place in Pattaya",
            "subheading": "Trusted local advisors",
            "primary_cta_label": "Talk to advisor",
            "primary_cta_url": "/contact",
            "secondary_cta_label": "Browse projects",
            "secondary_cta_url": "/projects",
        }
    )
    return config


def _create_draft(client, headers: dict[str, str], *, locale: str = "en", config: dict | None = None) -> str:
    response = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": locale,
            "config": config or _base_config(locale=locale),
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_flow_a_publish_reflects_public_payload(client) -> None:
    headers = _make_admin_headers()
    draft_id = _create_draft(client, headers, config=_base_config(locale="en"))

    published = client.post(f"/admin/home-composer/{draft_id}/publish", headers=headers)
    assert published.status_code == 200, published.text

    public = client.get("/v1/home-composer", params={"page_key": "home", "locale": "en"})
    assert public.status_code == 200, public.text
    payload = public.json()
    assert payload["page_key"] == "home"
    assert payload["locale"] == "en"
    assert payload["config"]["hero"]["heading"] == "Find your place in Pattaya"
    assert payload["config"]["hero"]["primary_cta_label"] == "Talk to advisor"


def test_flow_b_manual_featured_selections_reflect_in_public_config(client) -> None:
    headers = _make_admin_headers()

    with SessionLocal() as db:
        project = Project(
            slug=f"project-{uuid4().hex[:8]}",
            name="Manual Highlight Project",
            status="published",
            property_type="condo",
            starting_price=Decimal("3900000"),
            summary={"en": "Great value", "th": "คุ้มค่า"},
        )
        property_item = Property(
            source_id=f"SRC-{uuid4().hex[:10]}",
            slug=f"property-{uuid4().hex[:8]}",
            title="Manual Highlight Unit",
            type="new",
            property_type="condo",
            status="active",
            price=Decimal("4200000"),
            currency="THB",
            address="Pattaya",
            city="Pattaya",
        )
        db.add(project)
        db.add(property_item)
        db.commit()
        db.refresh(project)
        db.refresh(property_item)
        project_id = str(project.id)
        project_slug = project.slug
        property_id = str(property_item.id)
        property_source_id = property_item.source_id

    config = _base_config(locale="en")
    config["featured_projects"].update(
        {
            "mode": "manual",
            "selected_project_ids": [project_id],
            "selected_project_slugs": [project_slug],
        }
    )
    config["featured_properties"].update(
        {
            "mode": "manual",
            "selected_property_ids": [property_id],
            "selected_source_ids": [property_source_id],
        }
    )

    draft_id = _create_draft(client, headers, config=config)

    publish_resp = client.post(f"/admin/home-composer/{draft_id}/publish", headers=headers)
    assert publish_resp.status_code == 200, publish_resp.text

    public = client.get("/v1/home-composer", params={"page_key": "home", "locale": "en"})
    assert public.status_code == 200, public.text
    out = public.json()["config"]
    assert out["featured_projects"]["mode"] == "manual"
    assert out["featured_projects"]["selected_project_ids"] == [project_id]
    assert out["featured_projects"]["selected_project_slugs"] == [project_slug]
    assert out["featured_properties"]["mode"] == "manual"
    assert out["featured_properties"]["selected_property_ids"] == [property_id]
    assert out["featured_properties"]["selected_source_ids"] == [property_source_id]


def test_flow_c_governance_block_and_warning(client) -> None:
    headers = _make_admin_headers()

    restricted = f"/media/library/{uuid4()}.jpg"
    pending = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=restricted, rights_status="restricted", approval_status="approved")
    _add_media_asset(
        path=pending,
        rights_status="pending_review",
        approval_status="pending",
        is_exception=True,
    )

    draft_id = _create_draft(client, headers, config=_base_config(locale="en"))

    blocked = client.patch(
        f"/admin/home-composer/{draft_id}",
        headers=headers,
        json={"config": {"hero": {"hero_image": restricted}}},
    )
    assert blocked.status_code == 422, blocked.text
    assert "media blocked:" in str(blocked.json())

    warned = client.patch(
        f"/admin/home-composer/{draft_id}",
        headers=headers,
        json={
            "config": {
                "hero": {
                    "heading": "Find your place in Pattaya",
                    "primary_cta_label": "Talk to advisor",
                    "primary_cta_url": "/contact",
                    "hero_image": pending,
                }
            }
        },
    )
    assert warned.status_code == 200, warned.text
    body = warned.json()
    assert len(body["validation"].get("media_warnings") or []) >= 1


def test_public_home_composer_missing_published_returns_404(client) -> None:
    response = client.get("/v1/home-composer", params={"page_key": "home", "locale": "th"})
    assert response.status_code == 404, response.text
