from __future__ import annotations

from collections.abc import Generator
from uuid import uuid4

import pytest

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import Area, AreaStatistic, Developer, MediaAsset, Project, User


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(AreaStatistic).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.query(Developer).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(AreaStatistic).delete()
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


def test_flow_a_publish_reflects_public_lists(client) -> None:
    headers = _make_admin_headers()
    hero = f"/media/library/{uuid4()}.jpg"
    logo = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=hero, rights_status="approved", approval_status="approved")
    _add_media_asset(path=logo, rights_status="approved", approval_status="approved")

    created_area = client.post(
        "/admin/areas",
        headers=headers,
        json={
            "name": "Jomtien North",
            "slug": f"jomtien-north-{uuid4()}",
            "city": "Pattaya",
            "status": "draft",
            "hero_image_url": hero,
            "source_note": "internal desk",
            "content": {
                "en": {
                    "why_live_invest": "Family-friendly demand and active renter pool.",
                    "transport": "Connected to city routes and key roads.",
                    "lifestyle": "Nearby retail and daily convenience anchors.",
                    "beach_proximity": "Beach reachable in under 15 minutes.",
                    "metrics_update_cadence": "Monthly",
                },
                "th": {
                    "why_live_invest": "เหมาะกับครอบครัวและมีดีมานด์ผู้เช่าต่อเนื่อง",
                    "transport": "เชื่อมเส้นทางหลักเข้าเมืองได้สะดวก",
                    "lifestyle": "ใกล้ศูนย์การค้าและสิ่งอำนวยความสะดวกประจำวัน",
                    "beach_proximity": "เดินทางถึงหาดได้ภายในประมาณ 15 นาที",
                    "metrics_update_cadence": "รายเดือน",
                },
            },
        },
    )
    assert created_area.status_code == 201, created_area.text
    area_id = created_area.json()["area"]["id"]
    area_slug = created_area.json()["area"]["slug"]

    created_developer = client.post(
        "/admin/developers",
        headers=headers,
        json={
            "name": "Sunrise Dev",
            "slug": f"sunrise-{uuid4()}",
            "status": "inactive",
            "logo_url": logo,
            "profile": {"en": "Sunrise Dev profile"},
            "trust_proof": {
                "licenses": ["EEC-2026-001"],
                "approval_status": "approved",
                "legal_approved": True,
            },
            "source_note": "source: legal reviewed developer dossier",
        },
    )
    assert created_developer.status_code == 201, created_developer.text
    developer_id = created_developer.json()["developer"]["id"]
    developer_slug = created_developer.json()["developer"]["slug"]

    upsert_stat = client.put(
        f"/admin/areas/{area_id}/statistics",
        headers=headers,
        json={
            "avg_price_sqm": 118000,
            "avg_rent_monthly": 29000,
            "avg_roi_percent": 6.2,
            "total_projects": 8,
            "total_units": 2100,
            "as_of_date": "2026-02-28",
        },
    )
    assert upsert_stat.status_code == 200, upsert_stat.text

    publish_area = client.post(f"/admin/areas/{area_id}/publish", headers=headers)
    assert publish_area.status_code == 200, publish_area.text

    linked_project = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"sunrise-link-{uuid4()}",
            "name": "Sunrise Linked Project",
            "status": "published",
            "property_type": "condo",
            "area_id": area_id,
            "developer_id": developer_id,
            "summary": {"en": "Linked project for developer publish readiness"},
        },
    )
    assert linked_project.status_code == 201, linked_project.text

    publish_developer = client.post(f"/admin/developers/{developer_id}/publish", headers=headers)
    assert publish_developer.status_code == 200, publish_developer.text

    public_areas = client.get("/v1/areas")
    assert public_areas.status_code == 200, public_areas.text
    assert any(item["slug"] == area_slug for item in public_areas.json())

    public_developers = client.get("/v1/developers")
    assert public_developers.status_code == 200, public_developers.text
    assert any(item["slug"] == developer_slug for item in public_developers.json())

    area_detail = client.get(f"/v1/areas/{area_slug}")
    assert area_detail.status_code == 200, area_detail.text

    developer_detail = client.get(f"/v1/developers/{developer_slug}")
    assert developer_detail.status_code == 200, developer_detail.text


def test_flow_b_statistics_and_summary_reflect_public_endpoints(client) -> None:
    headers = _make_admin_headers()
    hero = f"/media/library/{uuid4()}.jpg"
    logo = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=hero, rights_status="approved", approval_status="approved")
    _add_media_asset(path=logo, rights_status="approved", approval_status="approved")

    created_area = client.post(
        "/admin/areas",
        headers=headers,
        json={
            "name": "Pratumnak Heights",
            "slug": f"pratumnak-{uuid4()}",
            "status": "draft",
            "hero_image_url": hero,
            "source_note": "internal market desk",
            "content": {
                "en": {
                    "title": "Pratumnak",
                    "why_live_invest": "Strong owner-occupier + rental mix.",
                    "transport": "Fast road links to city center.",
                    "lifestyle": "Close to dining and wellness clusters.",
                    "beach_proximity": "Easy access to nearby beaches.",
                    "metrics_update_cadence": "Monthly",
                },
                "th": {
                    "title": "พระตำหนัก",
                    "why_live_invest": "มีดีมานด์ทั้งอยู่อาศัยจริงและปล่อยเช่า",
                    "transport": "เชื่อมเข้าเมืองได้สะดวก",
                    "lifestyle": "ใกล้ร้านอาหารและแหล่งสุขภาพ",
                    "beach_proximity": "เข้าถึงชายหาดใกล้เคียงได้ง่าย",
                    "metrics_update_cadence": "รายเดือน",
                },
            },
        },
    )
    assert created_area.status_code == 201, created_area.text
    area_id = created_area.json()["area"]["id"]
    area_slug = created_area.json()["area"]["slug"]

    upsert_stat = client.put(
        f"/admin/areas/{area_id}/statistics",
        headers=headers,
        json={
            "avg_price_sqm": 125000,
            "avg_rent_monthly": 32000,
            "avg_roi_percent": 6.8,
            "total_projects": 14,
            "total_units": 5200,
            "as_of_date": "2026-02-25",
        },
    )
    assert upsert_stat.status_code == 200, upsert_stat.text

    publish_area = client.post(f"/admin/areas/{area_id}/publish", headers=headers)
    assert publish_area.status_code == 200, publish_area.text

    stat_public = client.get(f"/v1/areas/{area_slug}/statistics")
    assert stat_public.status_code == 200, stat_public.text
    body = stat_public.json()
    assert body["statistics"]["total_projects"] == 14
    assert float(body["statistics"]["avg_price_sqm"]) == 125000

    created_developer = client.post(
        "/admin/developers",
        headers=headers,
        json={
            "name": "Laguna Group",
            "slug": f"laguna-{uuid4()}",
            "status": "inactive",
            "logo_url": logo,
            "profile": {"en": "Reliable premium builder", "th": "ผู้พัฒนาคุณภาพ"},
            "summary": {"en": "Reliable premium builder", "th": "ผู้พัฒนาคุณภาพ"},
            "trust_proof": {
                "licenses": ["LG-LEGAL-2026"],
                "approval_status": "approved",
                "legal_approved": True,
            },
            "source_note": "source: legal-reviewed profile pack",
        },
    )
    assert created_developer.status_code == 201, created_developer.text
    developer_id = created_developer.json()["developer"]["id"]
    developer_slug = created_developer.json()["developer"]["slug"]

    linked_project = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"laguna-link-{uuid4()}",
            "name": "Laguna Linked Project",
            "status": "published",
            "property_type": "condo",
            "area_id": area_id,
            "developer_id": developer_id,
            "summary": {"en": "Linked project for developer publish readiness"},
        },
    )
    assert linked_project.status_code == 201, linked_project.text

    publish_developer = client.post(f"/admin/developers/{developer_id}/publish", headers=headers)
    assert publish_developer.status_code == 200, publish_developer.text

    dev_public = client.get(f"/v1/developers/{developer_slug}")
    assert dev_public.status_code == 200, dev_public.text
    summary = dev_public.json().get("summary") or {}
    assert summary.get("en") == "Reliable premium builder"


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

    blocked = client.post(
        "/admin/areas",
        headers=headers,
        json={
            "name": "Blocked Area",
            "slug": f"blocked-{uuid4()}",
            "status": "draft",
            "hero_image_url": restricted,
        },
    )
    assert blocked.status_code == 422, blocked.text
    assert "media_governance_blocked" in str(blocked.json())

    warned = client.post(
        "/admin/developers",
        headers=headers,
        json={
            "name": "Warn Dev",
            "slug": f"warn-dev-{uuid4()}",
            "status": "inactive",
            "logo_url": pending,
        },
    )
    assert warned.status_code == 201, warned.text
    assert len(warned.json().get("media_warnings", [])) >= 1

    external = client.post(
        "/admin/developers",
        headers=headers,
        json={
            "name": "External Asset Dev",
            "slug": f"ext-dev-{uuid4()}",
            "status": "inactive",
            "logo_url": "https://cdn.example.com/logo.jpg",
        },
    )
    assert external.status_code == 422, external.text


def test_domain_defaults_are_aligned_when_status_omitted(client) -> None:
    headers = _make_admin_headers()
    hero = f"/media/library/{uuid4()}.jpg"
    logo = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=hero, rights_status="approved", approval_status="approved")
    _add_media_asset(path=logo, rights_status="approved", approval_status="approved")

    area_resp = client.post(
        "/admin/areas",
        headers=headers,
        json={
            "name": "Default Area",
            "slug": f"default-area-{uuid4()}",
            "hero_image_url": hero,
        },
    )
    assert area_resp.status_code == 201, area_resp.text
    assert area_resp.json()["area"]["status"] == "draft"

    developer_resp = client.post(
        "/admin/developers",
        headers=headers,
        json={
            "name": "Default Dev",
            "slug": f"default-dev-{uuid4()}",
            "logo_url": logo,
        },
    )
    assert developer_resp.status_code == 201, developer_resp.text
    assert developer_resp.json()["developer"]["status"] == "inactive"


def test_area_publish_blocked_when_required_area_guide_fields_are_missing(client) -> None:
    headers = _make_admin_headers()
    hero = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=hero, rights_status="approved", approval_status="approved")

    created_area = client.post(
        "/admin/areas",
        headers=headers,
        json={
            "name": "Incomplete Area",
            "slug": f"incomplete-{uuid4()}",
            "status": "draft",
            "hero_image_url": hero,
        },
    )
    assert created_area.status_code == 201, created_area.text
    area_id = created_area.json()["area"]["id"]

    readiness = client.get(f"/admin/areas/{area_id}/publish-readiness", headers=headers)
    assert readiness.status_code == 200, readiness.text
    readiness_body = readiness.json()
    assert readiness_body["ready"] is False
    assert "source_note" in readiness_body["missing"]
    assert "statistics" in readiness_body["missing"]
    assert "content.en.why_live_invest" in readiness_body["missing"]

    publish = client.post(f"/admin/areas/{area_id}/publish", headers=headers)
    assert publish.status_code == 422, publish.text
    detail = publish.json().get("detail") or {}
    assert detail.get("code") == "area_publish_requirements_missing"
    missing = detail.get("missing") or []
    assert "source_note" in missing
    assert "statistics" in missing
    assert "content.en.why_live_invest" in missing


def test_developer_publish_blocked_when_required_content_or_linkage_is_missing(client) -> None:
    headers = _make_admin_headers()
    logo = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=logo, rights_status="approved", approval_status="approved")

    created_developer = client.post(
        "/admin/developers",
        headers=headers,
        json={
            "name": "Incomplete Developer",
            "slug": f"incomplete-dev-{uuid4()}",
            "status": "inactive",
            "logo_url": logo,
            # Intentionally missing profile/trust/source_note and no linked published projects.
        },
    )
    assert created_developer.status_code == 201, created_developer.text
    developer_id = created_developer.json()["developer"]["id"]

    readiness = client.get(f"/admin/developers/{developer_id}/publish-readiness", headers=headers)
    assert readiness.status_code == 200, readiness.text
    readiness_body = readiness.json()
    assert readiness_body["ready"] is False
    assert "profile" in readiness_body["missing"]
    assert "trust_proof" in readiness_body["missing"]
    assert "trust_proof.approval" in readiness_body["missing"]
    assert "projects.published" in readiness_body["missing"]
    assert "areas.linked_from_published_projects" in readiness_body["missing"]

    publish = client.post(f"/admin/developers/{developer_id}/publish", headers=headers)
    assert publish.status_code == 422, publish.text
    detail = publish.json().get("detail") or {}
    assert detail.get("code") == "developer_publish_requirements_missing"
