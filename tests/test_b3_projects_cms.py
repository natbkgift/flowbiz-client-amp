from __future__ import annotations

from collections.abc import Generator
from uuid import uuid4

import pytest

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import Area, Developer, HomeComposerConfig, MediaAsset, Project, User


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(HomeComposerConfig).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.query(Developer).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(HomeComposerConfig).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.query(Developer).delete()
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
    rights_status: str | None = "approved",
    approval_status: str | None = "approved",
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


def _seed_area_and_developer() -> tuple[str, str]:
    with SessionLocal() as db:
        area = Area(
            slug=f"area-{uuid4()}", name="Central Pattaya", city="Pattaya", status="published"
        )
        developer = Developer(slug=f"dev-{uuid4()}", name="FlowBiz Dev", status="active")
        db.add(area)
        db.add(developer)
        db.commit()
        return str(area.id), str(developer.id)


def _build_publishable_project_payload(
    *,
    slug: str,
    area_id: str | None = None,
    developer_id: str | None = None,
    starting_price: int = 3100000,
    cover_image_url: str | None = None,
    hero_image_url: str | None = None,
    images: list[str] | None = None,
    summary: dict | None = None,
    highlights: list[str] | None = None,
    amenities: list[str] | None = None,
    investment_snapshot: dict | None = None,
    location: dict | None = None,
) -> dict:
    return {
        "slug": slug,
        "name": "Publishable Project",
        "status": "draft",
        "property_type": "condo",
        "area_id": area_id,
        "developer_id": developer_id,
        "starting_price": starting_price,
        "cover_image_url": cover_image_url,
        "hero_image_url": hero_image_url,
        "images": images or [],
        "summary": summary or {"en": {"title": "Project Summary"}, "th": {"title": "สรุปโครงการ"}},
        "highlights": highlights or ["near_beach", "sea_view"],
        "amenities": amenities or ["pool", "gym"],
        "investment_snapshot": investment_snapshot or {"source": "Internal Desk", "updated_at": "2026-02-27"},
        "location": location or {"label": "Central Pattaya", "context": {"en": "Beachfront corridor"}},
    }


def test_b3_crud_publish_and_public_reflection(client) -> None:
    headers = _make_admin_headers()
    area_id, developer_id = _seed_area_and_developer()

    cover = f"/media/library/{uuid4()}.jpg"
    hero = f"/media/library/{uuid4()}.jpg"
    gallery = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=cover)
    _add_media_asset(path=hero)
    _add_media_asset(path=gallery)

    created = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-project-{uuid4()}",
            "name": "B3 Project A",
            "status": "draft",
            "property_type": "condo",
            "area_id": area_id,
            "developer_id": developer_id,
            "starting_price": 3100000,
            "cover_image_url": cover,
            "hero_image_url": hero,
            "images": [gallery],
            "summary": {"en": {"title": "Project A"}, "th": {"title": "โครงการ A"}},
            "description": {"en": {"body": "English body"}, "th": {"body": "เนื้อหาไทย"}},
            "badges": ["new_launch", "high_yield"],
            "highlights": ["near_beach", "sea_view"],
            "quick_facts": [{"label": "Units", "value": "320"}],
            "amenities": ["pool", "gym"],
            "investment_snapshot": {"source": "Internal Desk", "updated_at": "2026-02-27"},
            "trust_proof": [{"type": "award", "value": "Top Developer 2025"}],
            "source_notes": {"en": "internal memo", "th": "บันทึกภายใน"},
            "claims_updated_at": "2026-02-27T10:00:00Z",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    project = body["project"]
    project_id = project["id"]
    assert project["preview_url"].endswith(f"/projects/{project['slug']}")

    listed = client.get("/admin/projects", headers=headers)
    assert listed.status_code == 200, listed.text
    assert any(row["id"] == project_id for row in listed.json()["data"])

    fetched = client.get(f"/admin/projects/{project_id}", headers=headers)
    assert fetched.status_code == 200, fetched.text
    assert fetched.json()["id"] == project_id

    patched = client.patch(
        f"/admin/projects/{project_id}",
        headers=headers,
        json={
            "name": "B3 Project A Updated",
            "highlights": ["sea_view", "turnkey"],
            "quick_facts": [{"label": "Floors", "value": "45"}],
            "trust_proof": [{"type": "escrow", "value": "Tier-1 bank"}],
            "source_notes": {"en": "updated source", "th": "อัปเดตแหล่งข้อมูล"},
            "claims_updated_at": "2026-02-27T12:00:00Z",
        },
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["project"]["name"] == "B3 Project A Updated"

    published = client.post(f"/admin/projects/{project_id}/publish", headers=headers)
    assert published.status_code == 200, published.text

    public_list = client.get("/v1/projects")
    assert public_list.status_code == 200, public_list.text
    row = next(item for item in public_list.json()["data"] if item["id"] == project_id)
    assert row["name"] == "B3 Project A Updated"
    assert row["highlights"] == ["sea_view", "turnkey"]
    assert row["quick_facts"][0]["label"] == "Floors"

    by_id = client.get(f"/v1/projects/{project_id}")
    assert by_id.status_code == 200, by_id.text
    assert by_id.json()["project"]["id"] == project_id

    by_slug = client.get(f"/v1/projects/{project['slug']}")
    assert by_slug.status_code == 200, by_slug.text
    assert by_slug.json()["project"]["slug"] == project["slug"]

    composer = client.post(
        "/admin/home-composer",
        headers=headers,
        json={
            "page_key": "home",
            "locale": "en",
            "status": "published",
            "version": 1,
            "config": {"sections": [{"type": "project_cards", "project_ids": [project_id]}]},
        },
    )
    assert composer.status_code == 201, composer.text

    home = client.get("/v1/home-composer?page_key=home&locale=en")
    assert home.status_code == 200, home.text
    section = home.json()["config"]["sections"][0]
    assert project_id in section["project_ids"]

    candidates = client.get("/admin/home-composer/candidates/projects", headers=headers)
    assert candidates.status_code == 200, candidates.text
    candidate = next(item for item in candidates.json() if item["id"] == project_id)
    assert candidate["name"] == "B3 Project A Updated"


def test_b3_delete_is_soft_delete_and_hidden(client) -> None:
    headers = _make_admin_headers()

    created = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-delete-{uuid4()}",
            "name": "Delete Me",
            "status": "draft",
            "property_type": "condo",
        },
    )
    assert created.status_code == 201, created.text
    project_id = created.json()["project"]["id"]

    deleted = client.delete(f"/admin/projects/{project_id}", headers=headers)
    assert deleted.status_code == 200, deleted.text
    assert deleted.json()["deleted"] is True

    admin_get = client.get(f"/admin/projects/{project_id}", headers=headers)
    assert admin_get.status_code == 404, admin_get.text

    admin_list = client.get("/admin/projects", headers=headers)
    assert admin_list.status_code == 200, admin_list.text
    assert not any(row["id"] == project_id for row in admin_list.json()["data"])

    public_detail = client.get(f"/v1/projects/{project_id}")
    assert public_detail.status_code == 404, public_detail.text


def test_b3_slug_conflict_on_create_and_patch(client) -> None:
    headers = _make_admin_headers()
    slug = f"b3-slug-{uuid4()}"

    first = client.post(
        "/admin/projects",
        headers=headers,
        json={"slug": slug, "name": "P1", "status": "draft", "property_type": "condo"},
    )
    assert first.status_code == 201, first.text

    second = client.post(
        "/admin/projects",
        headers=headers,
        json={"slug": slug, "name": "P2", "status": "draft", "property_type": "condo"},
    )
    assert second.status_code == 409, second.text
    assert second.json()["detail"]["code"] == "project_slug_conflict"

    other = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-other-{uuid4()}",
            "name": "P3",
            "status": "draft",
            "property_type": "condo",
        },
    )
    assert other.status_code == 201, other.text
    other_id = other.json()["project"]["id"]

    patch_conflict = client.patch(
        f"/admin/projects/{other_id}", headers=headers, json={"slug": slug}
    )
    assert patch_conflict.status_code == 409, patch_conflict.text
    assert patch_conflict.json()["detail"]["code"] == "project_slug_conflict"


def test_b3_required_field_validation(client) -> None:
    headers = _make_admin_headers()

    missing_name = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-name-{uuid4()}",
            "name": "",
            "status": "draft",
            "property_type": "condo",
        },
    )
    assert missing_name.status_code == 422, missing_name.text

    missing_slug = client.post(
        "/admin/projects",
        headers=headers,
        json={"slug": "", "name": "Has Name", "status": "draft", "property_type": "condo"},
    )
    assert missing_slug.status_code == 422, missing_slug.text

    missing_status = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-status-{uuid4()}",
            "name": "Has Name",
            "status": "",
            "property_type": "condo",
        },
    )
    assert missing_status.status_code == 422, missing_status.text


def test_b3_publish_blocked_when_required_project_fields_are_missing(client) -> None:
    headers = _make_admin_headers()
    created = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-publish-missing-{uuid4()}",
            "name": "Missing Publish Fields",
            "status": "draft",
            "property_type": "condo",
        },
    )
    assert created.status_code == 201, created.text
    project_id = created.json()["project"]["id"]

    publish = client.post(f"/admin/projects/{project_id}/publish", headers=headers)
    assert publish.status_code == 422, publish.text
    detail = publish.json().get("detail") or {}
    assert detail.get("code") == "project_publish_requirements_missing"
    missing = detail.get("missing") or []
    assert "starting_price" in missing
    assert "hero_media" in missing
    assert "summary" in missing
    assert "highlights" in missing
    assert "location" in missing
    assert "facilities" in missing
    assert "investment_snapshot.source" in missing
    assert "investment_snapshot.updated_at" in missing


def test_b3_publish_accepts_cover_or_hero_when_one_local_primary_asset_exists(client) -> None:
    headers = _make_admin_headers()
    area_id, developer_id = _seed_area_and_developer()

    cover_only = f"/media/library/{uuid4()}.jpg"
    hero_only = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=cover_only)
    _add_media_asset(path=hero_only)

    cover_project = client.post(
        "/admin/projects",
        headers=headers,
        json=_build_publishable_project_payload(
            slug=f"b3-cover-only-{uuid4()}",
            area_id=area_id,
            developer_id=developer_id,
            cover_image_url=cover_only,
        ),
    )
    assert cover_project.status_code == 201, cover_project.text
    cover_project_id = cover_project.json()["project"]["id"]

    cover_publish = client.post(f"/admin/projects/{cover_project_id}/publish", headers=headers)
    assert cover_publish.status_code == 200, cover_publish.text

    hero_project = client.post(
        "/admin/projects",
        headers=headers,
        json=_build_publishable_project_payload(
            slug=f"b3-hero-only-{uuid4()}",
            area_id=area_id,
            developer_id=developer_id,
            hero_image_url=hero_only,
        ),
    )
    assert hero_project.status_code == 201, hero_project.text
    hero_project_id = hero_project.json()["project"]["id"]

    hero_publish = client.post(f"/admin/projects/{hero_project_id}/publish", headers=headers)
    assert hero_publish.status_code == 200, hero_publish.text


def test_b3_publish_blocks_zero_starting_price_even_with_other_ready_fields(client) -> None:
    headers = _make_admin_headers()
    area_id, developer_id = _seed_area_and_developer()

    cover = f"/media/library/{uuid4()}.jpg"
    hero = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=cover)
    _add_media_asset(path=hero)

    created = client.post(
        "/admin/projects",
        headers=headers,
        json=_build_publishable_project_payload(
            slug=f"b3-zero-price-{uuid4()}",
            area_id=area_id,
            developer_id=developer_id,
            starting_price=0,
            cover_image_url=cover,
            hero_image_url=hero,
        ),
    )
    assert created.status_code == 201, created.text

    project_id = created.json()["project"]["id"]
    publish = client.post(f"/admin/projects/{project_id}/publish", headers=headers)
    assert publish.status_code == 422, publish.text
    detail = publish.json().get("detail") or {}
    assert detail.get("code") == "project_publish_requirements_missing"
    assert "starting_price" in (detail.get("missing") or [])


def test_b3_publish_blocks_legacy_external_primary_media(client) -> None:
    headers = _make_admin_headers()

    with SessionLocal() as db:
        row = Project(
            slug=f"b3-legacy-external-{uuid4()}",
            name="Legacy External Media",
            status="draft",
            property_type="condo",
            starting_price=3100000,
            cover_image_url="https://cdn.example.com/legacy-cover.jpg",
            summary={"en": {"title": "Project Summary"}},
            highlights=["sea_view"],
            amenities=["pool"],
            investment_snapshot={"source": "Internal Desk", "updated_at": "2026-02-27"},
            location={"label": "Central Pattaya"},
        )
        db.add(row)
        db.commit()
        project_id = str(row.id)

    publish = client.post(f"/admin/projects/{project_id}/publish", headers=headers)
    assert publish.status_code == 422, publish.text
    detail = publish.json().get("detail") or {}
    assert detail.get("code") == "project_publish_requirements_missing"
    assert "hero_media" in (detail.get("missing") or [])


def test_b3_area_developer_fk_validation(client) -> None:
    headers = _make_admin_headers()

    bad_area = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-bad-area-{uuid4()}",
            "name": "Bad Area",
            "status": "draft",
            "property_type": "condo",
            "area_id": str(uuid4()),
        },
    )
    assert bad_area.status_code == 422, bad_area.text

    bad_developer = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-bad-dev-{uuid4()}",
            "name": "Bad Dev",
            "status": "draft",
            "property_type": "condo",
            "developer_id": str(uuid4()),
        },
    )
    assert bad_developer.status_code == 422, bad_developer.text


def test_b3_media_governance_local_path_validation(client) -> None:
    headers = _make_admin_headers()

    external_create = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-media-{uuid4()}",
            "name": "External Image",
            "status": "draft",
            "property_type": "condo",
            "cover_image_url": "https://cdn.example.com/cover.jpg",
        },
    )
    assert external_create.status_code == 422, external_create.text

    cover = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=cover)
    created = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-media-ok-{uuid4()}",
            "name": "Local Image",
            "status": "draft",
            "property_type": "condo",
            "cover_image_url": cover,
        },
    )
    assert created.status_code == 201, created.text
    project_id = created.json()["project"]["id"]

    external_patch = client.patch(
        f"/admin/projects/{project_id}",
        headers=headers,
        json={"hero_image_url": "https://cdn.example.com/hero.jpg"},
    )
    assert external_patch.status_code == 422, external_patch.text


def test_b3_en_th_translation_mapping_validation(client) -> None:
    headers = _make_admin_headers()

    bad_summary = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-locale-{uuid4()}",
            "name": "Bad Locale",
            "status": "draft",
            "property_type": "condo",
            "summary": {"jp": {"title": "NG"}},
        },
    )
    assert bad_summary.status_code == 422, bad_summary.text

    created = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b3-locale-ok-{uuid4()}",
            "name": "Good Locale",
            "status": "draft",
            "property_type": "condo",
            "summary": {"en": {"title": "OK"}, "th": {"title": "โอเค"}},
        },
    )
    assert created.status_code == 201, created.text
    project_id = created.json()["project"]["id"]

    bad_patch = client.patch(
        f"/admin/projects/{project_id}",
        headers=headers,
        json={"source_notes": {"fr": "not supported"}},
    )
    assert bad_patch.status_code == 422, bad_patch.text
