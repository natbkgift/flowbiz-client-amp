from __future__ import annotations

import base64
from collections.abc import Generator
from datetime import UTC, datetime
from uuid import uuid4

import pytest

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import Area, AreaStatistic, Article, Developer, MediaAsset, Project, Property, User

_PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6H9n8AAAAASUVORK5CYII="
)


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(AreaStatistic).delete()
        db.query(Article).delete()
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.query(Developer).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(AreaStatistic).delete()
        db.query(Article).delete()
        db.query(Property).delete()
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


def _create_media_asset(*, path: str, rights: str = "approved", approval: str = "approved") -> str:
    with SessionLocal() as db:
        row = MediaAsset(
            storage_path=path,
            kind="image",
            mime_type="image/png",
            file_size_bytes=len(_PNG_1X1),
            width=1,
            height=1,
            checksum_sha256=(uuid4().hex + uuid4().hex)[:64],
            rights_status=rights,
            approval_status=approval,
            status="active",
        )
        db.add(row)
        db.commit()
        return str(row.id)


def test_media_upload_single_and_multi(client) -> None:
    headers = _make_admin_headers()

    single = client.post(
        "/admin/media/upload",
        headers=headers,
        files={"file": ("unit.png", _PNG_1X1, "image/png")},
        data={
            "title": "Unit",
            "alt_en": "Unit alt",
            "alt_th": "ยูนิต",
            "tags": '["unit","hero"]',
            "rights_status": "approved",
            "approval_status": "approved",
        },
    )
    assert single.status_code == 201, single.text
    single_media = single.json()["media"]
    assert single_media["storage_path"].startswith("/media/library/")
    assert single_media["mime"] in {"image/png", "image/jpeg", "image/webp", "image/avif"}

    multi = client.post(
        "/admin/media/upload-multi",
        headers=headers,
        files=[
            ("files", ("gallery-a.png", _PNG_1X1, "image/png")),
            ("files", ("gallery-b.png", _PNG_1X1, "image/png")),
        ],
        data={"tags": '["gallery"]', "rights_status": "licensed", "approval_status": "approved"},
    )
    assert multi.status_code == 201, multi.text
    body = multi.json()
    assert body["count"] == 2
    assert all(item["storage_path"].startswith("/media/library/") for item in body["items"])


def test_media_upload_validation_type_and_size(client) -> None:
    headers = _make_admin_headers()

    bad_type = client.post(
        "/admin/media/upload",
        headers=headers,
        files={"file": ("invalid.txt", b"not-an-image", "text/plain")},
    )
    assert bad_type.status_code == 422, bad_type.text

    huge_payload = b"a" * (10 * 1024 * 1024 + 1)
    too_large = client.post(
        "/admin/media/upload",
        headers=headers,
        files={"file": ("too-large.jpg", huge_payload, "image/jpeg")},
    )
    assert too_large.status_code == 413, too_large.text


def test_media_patch_archive_restore_and_usage(client) -> None:
    headers = _make_admin_headers()
    created = client.post(
        "/admin/media/upload",
        headers=headers,
        files={"file": ("meta.png", _PNG_1X1, "image/png")},
        data={"rights_status": "approved", "approval_status": "approved"},
    )
    assert created.status_code == 201, created.text
    media_id = created.json()["media"]["id"]
    media_path = created.json()["media"]["storage_path"]

    with SessionLocal() as db:
        project = Project(
            slug=f"media-project-{uuid4()}",
            name="Media Project",
            status="published",
            property_type="condo",
            cover_image_url=media_path,
            hero_image_url=media_path,
            images=[media_path],
            summary={"en": {"title": "ok"}, "th": {"title": "ตกลง"}},
        )
        db.add(project)
        db.flush()

        prop = Property(
            source_id=f"SRC-{uuid4()}",
            slug=f"media-prop-{uuid4()}",
            title="Media Prop",
            type="new",
            property_type="condo",
            status="active",
            price=1000000,
            currency="THB",
            address="Pattaya",
            city="Pattaya",
            cover_image=media_path,
            cover_image_url=media_path,
            images=[media_path],
            local_images=[media_path],
        )
        db.add(prop)
        db.commit()

    patched = client.patch(
        f"/admin/media/{media_id}",
        headers=headers,
        json={
            "title": "New Title",
            "alt_en": "New Alt",
            "alt_th": "แอตใหม่",
            "caption_en": "Caption",
            "caption_th": "คำบรรยาย",
            "tags": ["updated"],
            "credit": "FlowBiz",
            "focal_x": 0.5,
            "focal_y": 0.5,
            "crop_hint": {"ratio": "16:9"},
        },
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["media"]["title"] == "New Title"
    assert patched.json()["media"]["crop_hint"]["ratio"] == "16:9"

    usage = client.get(f"/admin/media/{media_id}/usage", headers=headers)
    assert usage.status_code == 200, usage.text
    assert usage.json()["count"] >= 2

    blocked = client.post(f"/admin/media/{media_id}/archive", headers=headers)
    assert blocked.status_code == 422, blocked.text
    assert "media_in_use" in str(blocked.json())

    archived = client.post(f"/admin/media/{media_id}/archive?block_if_used=false", headers=headers)
    assert archived.status_code == 200, archived.text
    assert archived.json()["media"]["status"] == "archived"

    restored = client.post(f"/admin/media/{media_id}/restore", headers=headers)
    assert restored.status_code == 200, restored.text
    assert restored.json()["media"]["status"] == "active"


def test_media_replace_preserves_references(client) -> None:
    headers = _make_admin_headers()
    created = client.post(
        "/admin/media/upload",
        headers=headers,
        files={"file": ("replace-source.png", _PNG_1X1, "image/png")},
        data={"rights_status": "approved", "approval_status": "approved"},
    )
    assert created.status_code == 201, created.text
    media = created.json()["media"]

    with SessionLocal() as db:
        row = Project(
            slug=f"replace-project-{uuid4()}",
            name="Replace Project",
            status="published",
            property_type="condo",
            cover_image_url=media["storage_path"],
            images=[media["storage_path"]],
            summary={"en": {"title": "ok"}, "th": {"title": "ตกลง"}},
        )
        db.add(row)
        db.commit()

    replaced = client.post(
        f"/admin/media/{media['id']}/replace",
        headers=headers,
        files={"file": ("replace-new.png", _PNG_1X1, "image/png")},
    )
    assert replaced.status_code == 200, replaced.text
    body = replaced.json()
    assert body["preserved_references"] is True
    assert body["media"]["storage_path"] == media["storage_path"]
    assert body["usage"]


def test_entity_gallery_cover_and_reorder(client) -> None:
    headers = _make_admin_headers()
    path_a = f"/media/library/{uuid4()}.jpg"
    path_b = f"/media/library/{uuid4()}.jpg"
    _create_media_asset(path=path_a)
    _create_media_asset(path=path_b)

    with SessionLocal() as db:
        project = Project(
            slug=f"gallery-project-{uuid4()}",
            name="Gallery Project",
            status="draft",
            property_type="condo",
            summary={"en": {"title": "ok"}, "th": {"title": "ตกลง"}},
        )
        db.add(project)
        db.flush()
        project_id = str(project.id)

        prop = Property(
            source_id=f"SRC-{uuid4()}",
            slug=f"gallery-prop-{uuid4()}",
            title="Gallery Prop",
            type="new",
            property_type="condo",
            status="active",
            price=1500000,
            currency="THB",
            address="Pattaya",
            city="Pattaya",
        )
        db.add(prop)
        db.flush()
        property_id = str(prop.id)
        db.commit()

    prop_gallery = client.put(
        f"/admin/media/properties/{property_id}/gallery",
        headers=headers,
        json={"cover_image": path_b, "images": [path_b, path_a]},
    )
    assert prop_gallery.status_code == 200, prop_gallery.text
    assert prop_gallery.json()["cover_image"] == path_b
    assert prop_gallery.json()["images"] == [path_b, path_a]

    project_gallery = client.put(
        f"/admin/media/projects/{project_id}/gallery",
        headers=headers,
        json={"cover_image": path_a, "images": [path_a, path_b]},
    )
    assert project_gallery.status_code == 200, project_gallery.text
    assert project_gallery.json()["cover_image_url"] == path_a
    assert project_gallery.json()["images"] == [path_a, path_b]


def test_no_hotlink_block_admin_and_filter_public(client) -> None:
    headers = _make_admin_headers()

    blocked_admin = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"blocked-project-{uuid4()}",
            "name": "Blocked Project",
            "status": "draft",
            "property_type": "condo",
            "cover_image_url": "https://cdn.example.com/cover.jpg",
            "summary": {"en": {"title": "x"}, "th": {"title": "y"}},
        },
    )
    assert blocked_admin.status_code == 422, blocked_admin.text

    with SessionLocal() as db:
        project = Project(
            slug=f"public-hotlink-project-{uuid4()}",
            name="Public Hotlink Project",
            status="published",
            property_type="condo",
            cover_image_url="https://cdn.example.com/c.jpg",
            hero_image_url="https://cdn.example.com/h.jpg",
            images=["https://cdn.example.com/i.jpg", f"/media/library/{uuid4()}.jpg"],
            summary={"en": {"title": "ok"}, "th": {"title": "ตกลง"}},
        )
        db.add(project)

        area = Area(
            slug=f"area-{uuid4()}",
            name="Area A",
            city="Pattaya",
            status="published",
            hero_image_url="https://cdn.example.com/area.jpg",
        )
        db.add(area)

        dev = Developer(
            slug=f"dev-{uuid4()}",
            name="Dev A",
            status="active",
            logo_url="https://cdn.example.com/logo.jpg",
        )
        db.add(dev)

        media = MediaAsset(
            storage_path=f"/media/library/{uuid4()}.jpg",
            kind="image",
            mime_type="image/jpeg",
            file_size_bytes=100,
            checksum_sha256=(uuid4().hex + uuid4().hex)[:64],
            rights_status="approved",
            approval_status="approved",
            status="active",
        )
        db.add(media)
        db.flush()

        article = Article(
            slug=f"guide-{uuid4()}",
            category="guide",
            status="published",
            title={"en": "Guide", "th": "ไกด์"},
            excerpt={"en": "x", "th": "y"},
            body_md={"en": "body", "th": "เนื้อหา"},
            hero_image_url=media.storage_path,
            hero_media_asset_id=media.id,
            published_at=datetime.now(UTC),
        )
        db.add(article)
        db.commit()

    projects_resp = client.get("/v1/projects")
    assert projects_resp.status_code == 200, projects_resp.text
    rows = projects_resp.json()["data"]
    target = next(row for row in rows if row["name"] == "Public Hotlink Project")
    assert target["cover_image_url"] is None
    assert target["hero_image_url"] is None
    assert all("://" not in item for item in target["images"])

    areas_resp = client.get("/v1/areas")
    assert areas_resp.status_code == 200, areas_resp.text
    assert all(item["hero_image_url"] is None for item in areas_resp.json())

    dev_resp = client.get("/v1/developers")
    assert dev_resp.status_code == 200, dev_resp.text
    assert all(item["logo_url"] is None for item in dev_resp.json())

    guides_resp = client.get("/v1/content/guides/")
    assert guides_resp.status_code == 200, guides_resp.text
    assert guides_resp.json()
    assert all("://" not in (item.get("hero_image_url") or "") for item in guides_resp.json())