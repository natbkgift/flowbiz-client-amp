from __future__ import annotations

from collections.abc import Generator
from io import BytesIO
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import MediaAsset, Property, PropertyImportAudit, User


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(PropertyImportAudit).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(PropertyImportAudit).delete()
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
                status="active",
            )
        )
        db.commit()


def _create_property(client: TestClient, headers: dict[str, str], *, suffix: str = "") -> dict:
    cover = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(cover)
    resp = client.post(
        "/admin/properties",
        headers=headers,
        json={
            "source_id": f"b4-src-{suffix or uuid4()}",
            "slug": f"b4-{suffix or uuid4()}",
            "title": "Legacy title",
            "title_i18n": {"en": "Ocean Condo", "th": "คอนโดวิวทะเล"},
            "description": "Legacy description",
            "description_i18n": {"en": "English desc", "th": "คำอธิบายไทย"},
            "type": "new",
            "property_type": "condo",
            "status": "inactive",
            "price": 3200000,
            "currency": "THB",
            "bedrooms": 1,
            "bathrooms": 1,
            "size_sqm": 36,
            "address": "Pattaya Sai 2",
            "city": "Pattaya",
            "cover_image": cover,
            "local_images": [cover],
            "source_meta": {"source": "seed"},
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_i18n_fallback_and_public_locale_resolution(client: TestClient) -> None:
    headers = _make_admin_headers()
    created = _create_property(client, headers, suffix="i18n")

    patch = client.patch(
        f"/admin/properties/{created['id']}",
        headers=headers,
        json={"title_i18n": {"th": "เฉพาะไทย"}, "description_i18n": {"th": "คำอธิบายไทยอย่างเดียว"}},
    )
    assert patch.status_code == 200, patch.text
    patched = patch.json()
    assert patched["title"] == "เฉพาะไทย"

    publish = client.post(f"/admin/properties/{created['id']}/publish", headers=headers)
    assert publish.status_code == 200, publish.text

    detail_th = client.get(f"/v1/properties/{created['id']}?locale=th")
    assert detail_th.status_code == 200, detail_th.text
    assert detail_th.json()["title"] == "เฉพาะไทย"

    detail_en = client.get(f"/v1/properties/{created['id']}?locale=en")
    assert detail_en.status_code == 200, detail_en.text
    assert detail_en.json()["title"] == "เฉพาะไทย"

    listing = client.get("/v1/properties?locale=th")
    assert listing.status_code == 200, listing.text
    row = next(item for item in listing.json()["data"] if item["id"] == created["id"])
    assert row["title_i18n"]["th"] == "เฉพาะไทย"


def test_bulk_tags_add_remove_set(client: TestClient) -> None:
    headers = _make_admin_headers()
    a = _create_property(client, headers, suffix="tags-a")
    b = _create_property(client, headers, suffix="tags-b")

    add_resp = client.post(
        "/admin/properties/bulk/tags",
        headers=headers,
        json={"property_ids": [a["id"], b["id"]], "operation": "add", "tags": ["sea_view", "corner"]},
    )
    assert add_resp.status_code == 200, add_resp.text
    assert add_resp.json()["updated"] == 2

    remove_resp = client.post(
        "/admin/properties/bulk/tags",
        headers=headers,
        json={"property_ids": [a["id"]], "operation": "remove", "tags": ["corner"]},
    )
    assert remove_resp.status_code == 200, remove_resp.text

    set_resp = client.post(
        "/admin/properties/bulk/tags",
        headers=headers,
        json={"property_ids": [a["id"], b["id"]], "operation": "set", "tags": ["high_yield"]},
    )
    assert set_resp.status_code == 200, set_resp.text

    detail = client.get(f"/admin/properties/{a['id']}", headers=headers)
    assert detail.status_code == 200, detail.text
    assert detail.json()["tags"] == ["high_yield"]


def test_bulk_update_validates_and_updates_structured_fields(client: TestClient) -> None:
    headers = _make_admin_headers()
    a = _create_property(client, headers, suffix="bulk-update")

    invalid_fk = client.post(
        "/admin/properties/bulk/update",
        headers=headers,
        json={"property_ids": [a["id"]], "fields": {"project_id": str(uuid4())}},
    )
    assert invalid_fk.status_code == 422, invalid_fk.text

    invalid_media = client.post(
        "/admin/properties/bulk/update",
        headers=headers,
        json={"property_ids": [a["id"]], "fields": {"cover_image": "https://cdn.example.com/hotlink.jpg"}},
    )
    assert invalid_media.status_code == 422, invalid_media.text

    ok = client.post(
        "/admin/properties/bulk/update",
        headers=headers,
        json={
            "property_ids": [a["id"]],
            "fields": {
                "status": "active",
                "view": "sea",
                "city": "Bang Lamung",
                "tags": ["high_yield", "sea_view"],
                "title_i18n": {"en": "Updated EN", "th": "อัปเดตไทย"},
            },
        },
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()["updated"] == 1

    detail = client.get(f"/admin/properties/{a['id']}", headers=headers)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["status"] == "active"
    assert body["view"] == "sea"
    assert body["city"] == "Bang Lamung"
    assert body["tags"] == ["high_yield", "sea_view"]
    assert body["title"] == "Updated EN"


def test_source_tracking_sets_last_synced_at_for_sync_and_import(client: TestClient) -> None:
    headers = _make_admin_headers()
    created = _create_property(client, headers, suffix="sync")

    sync_cover = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(sync_cover)
    sync = client.post(
        "/admin/properties/media",
        headers=headers,
        json={
            "items": [
                {
                    "source_id": created["source_id"],
                    "local_images": [sync_cover],
                    "cover_image": sync_cover,
                    "source_meta": {"upstream": "amp-feed"},
                }
            ]
        },
    )
    assert sync.status_code == 200, sync.text

    after_sync = client.get(f"/admin/properties/{created['id']}", headers=headers)
    assert after_sync.status_code == 200, after_sync.text
    body = after_sync.json()
    assert body["last_synced_at"] is not None
    assert body["source_meta"]["media_sync"]["source_id"] == created["source_id"]

    csv_content = (
        "source_id,title,type,price,address,city,status,bedrooms,bathrooms,size,slug\n"
        "import-b4-1,Import Unit,new,5500000,Import Addr,Pattaya,active,1,1,40,import-b4-1\n"
    )
    import_resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("b4.csv", BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert import_resp.status_code == 200, import_resp.text
    assert import_resp.json()["updated"] + import_resp.json()["inserted"] == 1

    imported = client.get("/admin/properties/by/import-b4-1", headers=headers)
    assert imported.status_code == 200, imported.text
    imported_body = imported.json()
    assert imported_body["last_synced_at"] is not None
    assert imported_body["source_meta"]["source"] == "csv_import"


def test_admin_edits_reflect_public_structured_list_and_detail(client: TestClient) -> None:
    headers = _make_admin_headers()
    created = _create_property(client, headers, suffix="reflect")

    patch = client.patch(
        f"/admin/properties/{created['id']}",
        headers=headers,
        json={
            "bedrooms": 2,
            "bathrooms": 2,
            "size_sqm": 52,
            "view": "sea",
            "tags": ["sea_view", "corner"],
            "title_i18n": {"en": "Reflected EN", "th": "สะท้อนไทย"},
        },
    )
    assert patch.status_code == 200, patch.text

    publish = client.post(f"/admin/properties/{created['id']}/publish", headers=headers)
    assert publish.status_code == 200, publish.text

    listing = client.get("/v1/properties?locale=en")
    assert listing.status_code == 200, listing.text
    row = next(item for item in listing.json()["data"] if item["id"] == created["id"])
    assert row["title"] == "Reflected EN"
    assert row["bedrooms"] == 2
    assert row["bathrooms"] == 2
    assert row["view"] == "sea"
    assert row["tags"] == ["sea_view", "corner"]

    detail = client.get(f"/v1/properties/slug/{created['slug']}?locale=th")
    assert detail.status_code == 200, detail.text
    assert detail.json()["title"] == "สะท้อนไทย"
