from __future__ import annotations

from collections.abc import Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import MediaAsset, Property, User


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(Property).delete()
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


def _create_property(client: TestClient, headers: dict[str, str], *, slug: str, cover: str) -> dict:
    resp = client.post(
        "/admin/properties",
        headers=headers,
        json={
            "source_id": f"src-{uuid4()}",
            "slug": slug,
            "title": "B4 Property",
            "type": "new",
            "property_type": "condo",
            "status": "inactive",
            "price": 1234567,
            "currency": "THB",
            "bedrooms": 1,
            "bathrooms": 1,
            "size_sqm": 35,
            "address": "Test Address",
            "city": "Pattaya",
            "cover_image": cover,
            "local_images": [cover],
            "tags": ["high_yield", "sea_view"],
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_flow_a_create_publish_reflects_public_list(client: TestClient) -> None:
    headers = _make_admin_headers()
    local_cover = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=local_cover, rights_status="approved", approval_status="approved")

    created = _create_property(client, headers, slug=f"flow-a-{uuid4()}", cover=local_cover)
    property_id = created["id"]

    publish = client.post(f"/admin/properties/{property_id}/publish", headers=headers)
    assert publish.status_code == 200, publish.text

    listed = client.get("/v1/properties")
    assert listed.status_code == 200, listed.text
    rows = listed.json()["data"]
    row = next((item for item in rows if item["id"] == property_id), None)
    assert row is not None
    assert str(row["cover_image"]).startswith("/media/")


def test_flow_b_structured_stats_and_tags_reflect_public_detail(client: TestClient) -> None:
    headers = _make_admin_headers()
    local_cover = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=local_cover, rights_status="approved", approval_status="approved")

    created = _create_property(client, headers, slug=f"flow-b-{uuid4()}", cover=local_cover)
    property_id = created["id"]

    patch = client.patch(
        f"/admin/properties/{property_id}",
        headers=headers,
        json={
            "bedrooms": 2,
            "bathrooms": 2,
            "size_sqm": 48,
            "view": "sea",
            "view_label": "Sea View",
            "tags": ["sea_view", "pet_friendly"],
        },
    )
    assert patch.status_code == 200, patch.text

    publish = client.post(f"/admin/properties/{property_id}/publish", headers=headers)
    assert publish.status_code == 200, publish.text

    detail = client.get(f"/v1/properties/{property_id}")
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["bedrooms"] == 2
    assert body["bathrooms"] == 2
    assert float(body["size_sqm"]) == 48
    assert body["view"] == "sea"
    assert body["view_label"] == "Sea View"
    assert "sea_view" in (body.get("tags") or [])


def test_flow_c_restricted_blocked_pending_warning(client: TestClient) -> None:
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
        "/admin/properties",
        headers=headers,
        json={
            "source_id": f"src-{uuid4()}",
            "slug": f"flow-c-blocked-{uuid4()}",
            "title": "Blocked Property",
            "type": "new",
            "property_type": "condo",
            "status": "inactive",
            "price": 888888,
            "currency": "THB",
            "bedrooms": 1,
            "bathrooms": 1,
            "size_sqm": 35,
            "address": "Blocked",
            "city": "Pattaya",
            "cover_image": restricted,
            "local_images": [restricted],
        },
    )
    assert blocked.status_code == 422, blocked.text
    assert "property_media_governance_blocked" in str(blocked.json())

    allowed = _create_property(client, headers, slug=f"flow-c-pending-{uuid4()}", cover=pending)
    assert len(allowed.get("media_warnings", [])) >= 1


def test_publish_unpublish_and_bulk_status(client: TestClient) -> None:
    headers = _make_admin_headers()
    cover = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=cover, rights_status="approved", approval_status="approved")

    a = _create_property(client, headers, slug=f"bulk-a-{uuid4()}", cover=cover)
    b = _create_property(client, headers, slug=f"bulk-b-{uuid4()}", cover=cover)

    unpublish = client.post(f"/admin/properties/{a['id']}/unpublish", headers=headers)
    assert unpublish.status_code == 200, unpublish.text

    bulk = client.post(
        "/admin/properties/bulk/status",
        headers=headers,
        json={"property_ids": [a["id"], b["id"]], "status": "active"},
    )
    assert bulk.status_code == 200, bulk.text
    assert bulk.json()["updated"] == 2


def test_property_canonical_fields_precede_legacy_without_breaking_compat(
    client: TestClient,
) -> None:
    headers = _make_admin_headers()
    legacy_cover = f"/media/library/{uuid4()}.jpg"
    canonical_cover = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=legacy_cover, rights_status="approved", approval_status="approved")
    _add_media_asset(path=canonical_cover, rights_status="approved", approval_status="approved")

    created = client.post(
        "/admin/properties",
        headers=headers,
        json={
            "source_id": f"src-{uuid4()}",
            "slug": f"canon-{uuid4()}",
            "title": "Canonical Priority",
            "type": "new",
            "property_type": "condo",
            "status": "inactive",
            "price": 2500000,
            "currency": "THB",
            "size": 33,
            "floor": 8,
            "address": "Canonical Addr",
            "city": "Pattaya",
            "cover_image": legacy_cover,
            "cover_image_url": canonical_cover,
            "local_images": [legacy_cover, canonical_cover],
        },
    )
    assert created.status_code == 201, created.text
    property_id = created.json()["id"]

    detail = client.get(f"/admin/properties/{property_id}", headers=headers)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["cover_image_url"] == canonical_cover
    assert body["cover_image"] == legacy_cover
    assert float(body["size_sqm"]) == 33


def test_property_cover_ingest_updates_local_media_and_source_rights_metadata(
    client: TestClient,
) -> None:
    headers = _make_admin_headers()
    original_cover = f"/media/library/{uuid4()}.jpg"
    new_cover = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(path=original_cover, rights_status="approved", approval_status="approved")

    created = _create_property(client, headers, slug=f"ingest-{uuid4()}", cover=original_cover)
    property_id = created["id"]

    ingest = client.post(
        f"/admin/properties/{property_id}/cover-image/ingest",
        headers=headers,
        json={
            "storage_path": new_cover,
            "source_url": "https://example.test/property-source",
            "source_page_url": "https://example.test/property-page",
            "source_domain": "example.test",
            "source_type": "official",
            "rights_status": "approved",
            "approval_status": "approved",
            "rights_note": "approved by legal",
            "license_evidence_url": "https://example.test/license.pdf",
            "append_to_gallery": True,
            "publish_now": True,
        },
    )
    assert ingest.status_code == 200, ingest.text
    body = ingest.json()
    assert body["status"] == "active"
    assert body["cover_image"] == new_cover
    assert body["cover_image_url"] == new_cover
    assert body["local_images"][0] == new_cover
    assert body["source_meta"]["source_url"] == "https://example.test/property-source"
    assert body["source_meta"]["source_domain"] == "example.test"
    assert body["source_meta"]["rights_status"] == "approved"
    assert body["source_meta"]["ingest"]["storage_path"] == new_cover

    with SessionLocal() as db:
        media = db.query(MediaAsset).filter(MediaAsset.storage_path == new_cover).first()
        assert media is not None
        assert media.source_url == "https://example.test/property-source"
        assert media.source_page_url == "https://example.test/property-page"
        assert media.source_domain == "example.test"
        assert media.source_type == "official"
        assert media.rights_status == "approved"
        assert media.approval_status == "approved"
        assert media.rights_note == "approved by legal"
        assert media.license_evidence_url == "https://example.test/license.pdf"
