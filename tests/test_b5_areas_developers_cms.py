from __future__ import annotations

from collections.abc import Generator
from uuid import UUID, uuid4

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


def _add_media_asset(path: str) -> None:
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
                rights_status="approved",
                approval_status="approved",
                is_exception=False,
                status="active",
            )
        )
        db.commit()


def test_b5_areas_cms_crud_publish_reflect_and_i18n_fallback(client) -> None:
    headers = _make_admin_headers()
    cover = f"/media/library/{uuid4()}.jpg"
    hero = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(cover)
    _add_media_asset(hero)

    slug = f"b5-area-{uuid4()}"
    created = client.post(
        "/admin/areas",
        headers=headers,
        json={
            "name": "B5 Area",
            "slug": slug,
            "city": "Pattaya",
            "status": "draft",
            "cover_image_url": cover,
            "hero_image_url": hero,
            "summary": {"en": "Area summary EN"},
            "source_note": "source: internal area desk",
            "content": {
                "en": {
                    "why_live_invest": "Strong demand from renters and end-users.",
                    "transport": "Near city routes and public transport.",
                    "lifestyle": "Close to shopping and healthcare.",
                    "beach_proximity": "Short drive to the beach.",
                    "metrics_update_cadence": "Monthly",
                },
                "th": {
                    "why_live_invest": "มีดีมานด์จากผู้เช่าและผู้ซื้ออยู่อาศัยจริง",
                    "transport": "ใกล้เส้นทางเข้าเมืองและขนส่งสาธารณะ",
                    "lifestyle": "ใกล้แหล่งช้อปปิ้งและโรงพยาบาล",
                    "beach_proximity": "ขับรถไปหาดได้ไม่นาน",
                    "metrics_update_cadence": "รายเดือน",
                },
            },
        },
    )
    assert created.status_code == 201, created.text
    area = created.json()["area"]
    area_id = area["id"]
    assert area["preview_url"].endswith(f"/areas/{slug}")
    assert area["updated_at"]

    duplicate = client.post(
        "/admin/areas",
        headers=headers,
        json={"name": "Dup", "slug": slug, "city": "Pattaya"},
    )
    assert duplicate.status_code == 409, duplicate.text
    assert duplicate.json()["detail"]["code"] == "area_slug_conflict"

    admin_list = client.get("/admin/areas", headers=headers)
    assert admin_list.status_code == 200, admin_list.text
    assert any(row["id"] == area_id for row in admin_list.json()["data"])

    admin_get = client.get(f"/admin/areas/{area_id}", headers=headers)
    assert admin_get.status_code == 200, admin_get.text
    assert admin_get.json()["id"] == area_id

    patched = client.patch(
        f"/admin/areas/{area_id}",
        headers=headers,
        json={
            "summary": {"en": "Area summary EN", "th": "สรุปโซน"},
            "source_note": "source: updated",
            "content": {
                "en": {
                    "why_live_invest": "Updated EN why-live-invest",
                    "transport": "Updated EN transport",
                    "lifestyle": "Updated EN lifestyle",
                    "beach_proximity": "Updated EN beach proximity",
                    "metrics_update_cadence": "Monthly",
                },
                "th": {
                    "why_live_invest": "อัปเดตเหตุผลการอยู่อาศัย/ลงทุน",
                    "transport": "อัปเดตข้อมูลการเดินทาง",
                    "lifestyle": "อัปเดตข้อมูลไลฟ์สไตล์",
                    "beach_proximity": "อัปเดตข้อมูลระยะหาด",
                    "metrics_update_cadence": "รายเดือน",
                },
            },
        },
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["area"]["summary"]["th"] == "สรุปโซน"

    stat = client.put(
        f"/admin/areas/{area_id}/statistics",
        headers=headers,
        json={
            "avg_price_sqm": 123456,
            "avg_rent_monthly": 28000,
            "avg_roi_percent": 7.2,
            "total_projects": 9,
            "total_units": 2200,
            "as_of_date": "2026-02-27",
        },
    )
    assert stat.status_code == 200, stat.text
    assert stat.json()["statistics"]["total_projects"] == 9

    published = client.post(f"/admin/areas/{area_id}/publish", headers=headers)
    assert published.status_code == 200, published.text

    public_list = client.get("/v1/areas?locale=th")
    assert public_list.status_code == 200, public_list.text
    row = next(item for item in public_list.json() if item["id"] == area_id)
    assert row["summary_text"] == "สรุปโซน"
    assert row["statistics"]["total_units"] == 2200

    public_detail = client.get(f"/v1/areas/{slug}?locale=th")
    assert public_detail.status_code == 200, public_detail.text
    assert public_detail.json()["summary_text"] == "สรุปโซน"

    unpublished = client.post(f"/admin/areas/{area_id}/unpublish", headers=headers)
    assert unpublished.status_code == 200, unpublished.text

    hidden = client.get(f"/v1/areas/{slug}")
    assert hidden.status_code == 404, hidden.text

    deleted = client.delete(f"/admin/areas/{area_id}", headers=headers)
    assert deleted.status_code == 200, deleted.text
    assert deleted.json()["deleted"] is True


def test_b5_developers_cms_crud_publish_reflect_and_validation(client) -> None:
    headers = _make_admin_headers()
    logo = f"/media/library/{uuid4()}.jpg"
    cover = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(logo)
    _add_media_asset(cover)

    slug = f"b5-dev-{uuid4()}"
    created = client.post(
        "/admin/developers",
        headers=headers,
        json={
            "name": "B5 Developer",
            "slug": slug,
            "status": "inactive",
            "logo_url": logo,
            "cover_image_url": cover,
            "website": "https://developer.example.test",
            "profile": {"en": "Trusted developer"},
            "trust_proof": {
                "licenses": ["EEC-1234"],
                "approval_status": "approved",
                "legal_approved": True,
            },
            "source_note": "source: annual filing",
        },
    )
    assert created.status_code == 201, created.text
    developer = created.json()["developer"]
    developer_id = developer["id"]
    assert developer["preview_url"].endswith(f"/developers/{slug}")
    assert developer["updated_at"]

    external_path = client.post(
        "/admin/developers",
        headers=headers,
        json={
            "name": "External Logo",
            "slug": f"ext-{uuid4()}",
            "logo_url": "https://cdn.example.com/logo.jpg",
        },
    )
    assert external_path.status_code == 422, external_path.text

    duplicate = client.post(
        "/admin/developers",
        headers=headers,
        json={"name": "Dup", "slug": slug},
    )
    assert duplicate.status_code == 409, duplicate.text
    assert duplicate.json()["detail"]["code"] == "developer_slug_conflict"

    patched = client.patch(
        f"/admin/developers/{developer_id}",
        headers=headers,
        json={
            "profile": {"en": "Trusted developer", "th": "ผู้พัฒนาที่น่าเชื่อถือ"},
            "trust_proof": {
                "licenses": ["EEC-1234"],
                "approval_status": "approved",
                "legal_approved": True,
            },
        },
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["developer"]["profile"]["th"] == "ผู้พัฒนาที่น่าเชื่อถือ"

    with SessionLocal() as db:
        area = Area(slug=f"b5-dev-area-{uuid4()}", name="B5 Dev Area", status="published")
        db.add(area)
        db.flush()
        db.add(
            Project(
                slug=f"b5-dev-project-{uuid4()}",
                name="B5 Developer Linked Project",
                status="published",
                property_type="condo",
                area_id=area.id,
                developer_id=UUID(developer_id),
                summary={"en": "Linked project for developer publish readiness"},
                cover_image_url=cover,
            )
        )
        db.commit()

    published = client.post(f"/admin/developers/{developer_id}/publish", headers=headers)
    assert published.status_code == 200, published.text

    public_detail = client.get(f"/v1/developers/{slug}?locale=th")
    assert public_detail.status_code == 200, public_detail.text
    assert public_detail.json()["profile_text"] == "ผู้พัฒนาที่น่าเชื่อถือ"

    unpublished = client.post(f"/admin/developers/{developer_id}/unpublish", headers=headers)
    assert unpublished.status_code == 200, unpublished.text

    hidden = client.get(f"/v1/developers/{slug}")
    assert hidden.status_code == 404, hidden.text

    deleted = client.delete(f"/admin/developers/{developer_id}", headers=headers)
    assert deleted.status_code == 200, deleted.text
    assert deleted.json()["deleted"] is True


def test_b5_projects_link_area_developer_reflection_is_structured(client) -> None:
    headers = _make_admin_headers()
    cover = f"/media/library/{uuid4()}.jpg"
    hero = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(cover)
    _add_media_asset(hero)

    with SessionLocal() as db:
        area = Area(slug=f"b5-area-link-{uuid4()}", name="Linked Area", status="published")
        developer = Developer(slug=f"b5-dev-link-{uuid4()}", name="Linked Dev", status="active")
        db.add(area)
        db.add(developer)
        db.commit()
        area_id = str(area.id)
        developer_id = str(developer.id)
        area_slug = area.slug
        developer_slug = developer.slug

    created = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b5-project-{uuid4()}",
            "name": "B5 Linked Project",
            "status": "draft",
            "property_type": "condo",
            "area_id": area_id,
            "developer_id": developer_id,
        },
    )
    assert created.status_code == 201, created.text
    project = created.json()["project"]
    project_id = project["id"]
    assert project["area"]["id"] == area_id
    assert project["area"]["slug"] == area_slug
    assert project["developer"]["id"] == developer_id
    assert project["developer"]["slug"] == developer_slug

    prepared = client.patch(
        f"/admin/projects/{project_id}",
        headers=headers,
        json={
            "starting_price": 4200000,
            "cover_image_url": cover,
            "hero_image_url": hero,
            "summary": {"en": {"title": "Linked project summary"}},
            "highlights": ["linked_area", "linked_developer"],
            "amenities": ["pool"],
            "investment_snapshot": {"source": "Internal Desk", "updated_at": "2026-03-01"},
        },
    )
    assert prepared.status_code == 200, prepared.text

    published = client.post(f"/admin/projects/{project_id}/publish", headers=headers)
    assert published.status_code == 200, published.text

    public_detail = client.get(f"/v1/projects/{project_id}")
    assert public_detail.status_code == 200, public_detail.text
    body = public_detail.json()["project"]
    assert body["area"]["id"] == area_id
    assert body["area"]["slug"] == area_slug
    assert body["developer"]["id"] == developer_id
    assert body["developer"]["slug"] == developer_slug

    public_list = client.get("/v1/projects")
    assert public_list.status_code == 200, public_list.text
    row = next(item for item in public_list.json()["data"] if item["id"] == project_id)
    assert row["area"]["id"] == area_id
    assert row["developer"]["id"] == developer_id

    bad_area = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"b5-bad-area-{uuid4()}",
            "name": "Bad Link",
            "status": "draft",
            "property_type": "condo",
            "area_id": str(uuid4()),
        },
    )
    assert bad_area.status_code == 422, bad_area.text
