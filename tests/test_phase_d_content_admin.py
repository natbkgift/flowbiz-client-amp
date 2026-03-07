from __future__ import annotations

import json
from collections.abc import Generator
from uuid import uuid4

import pytest
from sqlalchemy import select

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import Article, CompanyInfo, ContentTaxonomy, ContentVideo, User


def _make_admin_headers() -> dict[str, str]:
    email = f"phase-d-admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _cleanup_phase_d_entities() -> None:
    with SessionLocal() as db:
        db.query(ContentVideo).delete()
        db.query(ContentTaxonomy).delete()
        db.query(Article).delete()
        db.query(CompanyInfo).filter(CompanyInfo.slug == "site-layout").delete()
        db.query(User).filter(User.email.like("phase-d-admin-%")).delete()
        db.commit()


def _assert_200(resp) -> None:
    assert resp.status_code == 200, resp.text


def _assert_201(resp) -> None:
    assert resp.status_code == 201, resp.text


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    _cleanup_phase_d_entities()
    yield
    _cleanup_phase_d_entities()


def test_phase_d_article_full_crud_publish_flow(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-blog-{uuid4()}"

    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"en": "Phase D blog", "th": "บล็อกเฟส D"},
            "excerpt": {"en": "excerpt", "th": "สรุป"},
            "body_md": {"en": "Body EN", "th": "Body TH"},
            "tags": {"en": ["investment"], "th": ["การลงทุน"]},
            "topics": {"en": ["market-update"], "th": ["อัปเดตตลาด"]},
        },
    )
    _assert_201(created)
    assert created.json()["article"]["slug"] == slug

    listed = client.get("/admin/content/articles?category=blog&limit=20", headers=headers)
    _assert_200(listed)
    assert any(row["slug"] == slug for row in listed.json()["data"])

    detail = client.get(f"/admin/content/articles/{slug}", headers=headers)
    _assert_200(detail)
    assert detail.json()["article"]["title"]["en"] == "Phase D blog"

    new_slug = f"{slug}-updated"
    patched = client.patch(
        f"/admin/content/articles/{slug}",
        headers=headers,
        json={"slug": new_slug, "status": "published"},
    )
    _assert_200(patched)
    assert patched.json()["article"]["slug"] == new_slug
    assert patched.json()["article"]["status"] == "published"

    unpublished = client.post(f"/admin/content/articles/{new_slug}/unpublish", headers=headers)
    _assert_200(unpublished)
    assert unpublished.json()["article"]["status"] == "draft"

    deleted = client.delete(f"/admin/content/articles/{new_slug}", headers=headers)
    _assert_200(deleted)
    assert deleted.json()["deleted"] is True

    missing = client.get(f"/admin/content/articles/{new_slug}", headers=headers)
    assert missing.status_code == 404, missing.text


def test_phase_d_article_publish_warns_when_th_translation_is_incomplete(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-blog-missing-locale-{uuid4()}"

    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"en": "Only EN title"},
            "body_md": {"en": "Only EN body"},
        },
    )
    _assert_201(created)

    publish = client.post(f"/admin/content/articles/{slug}/publish", headers=headers)
    _assert_200(publish)
    checklist = publish.json()["publish_checklist"]
    assert checklist["blocking"] == []
    assert "title.th is recommended" in checklist["warnings"]
    assert "body_md.th is recommended" in checklist["warnings"]
    assert publish.json()["article"]["status"] == "published"


def test_phase_d_article_publish_blocks_missing_required_en_locale(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-blog-missing-en-locale-{uuid4()}"

    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"th": "เฉพาะหัวข้อ TH"},
            "body_md": {"th": "เฉพาะเนื้อหา TH"},
        },
    )
    _assert_201(created)

    publish = client.post(f"/admin/content/articles/{slug}/publish", headers=headers)
    assert publish.status_code == 422, publish.text
    detail = publish.json()["detail"]
    assert detail["message"] == "Publish checklist failed"
    assert "title.en is required" in detail["blocking"]
    assert "body_md.en is required" in detail["blocking"]


def test_phase_d_article_publish_supports_guide_category_contract(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-guide-{uuid4()}"

    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "guide",
            "status": "draft",
            "title": {"en": "Guide EN", "th": "ไกด์ TH"},
            "body_md": {"en": "Guide body EN", "th": "เนื้อหาไกด์ TH"},
        },
    )
    _assert_201(created)

    published = client.post(f"/admin/content/articles/{slug}/publish", headers=headers)
    _assert_200(published)
    response_body = published.json()
    assert response_body["article"]["category"] == "guide"
    assert response_body["publish_checklist"]["blocking"] == []
    assert response_body["publish_checklist"]["warnings"] == [
        "hero media is recommended before publish"
    ]


def test_phase_d_article_create_rejects_invalid_category(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-invalid-category-{uuid4()}"

    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "news",
            "status": "draft",
            "title": {"en": "Invalid category"},
            "body_md": {"en": "Body"},
        },
    )
    assert created.status_code == 422, created.text
    assert created.json()["detail"] == "category must be one of: blog, guide"


def test_phase_d_article_patch_rejects_invalid_category(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-category-patch-{uuid4()}"

    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"en": "Patch category"},
            "body_md": {"en": "Body"},
        },
    )
    _assert_201(created)

    patched = client.patch(
        f"/admin/content/articles/{slug}",
        headers=headers,
        json={"category": "news"},
    )
    assert patched.status_code == 422, patched.text
    assert patched.json()["detail"] == "category must be one of: blog, guide"


def test_phase_d_taxonomy_full_crud(client) -> None:
    headers = _make_admin_headers()

    created = client.post(
        "/admin/content/taxonomies",
        headers=headers,
        json={
            "kind": "topic",
            "slug": "phase-d-topic",
            "label": {"en": "Phase D Topic", "th": "หัวข้อเฟส D"},
            "status": "active",
        },
    )
    _assert_201(created)
    taxonomy_id = created.json()["taxonomy"]["id"]

    listed = client.get("/admin/content/taxonomies?kind=topic", headers=headers)
    _assert_200(listed)
    assert any(row["id"] == taxonomy_id for row in listed.json()["data"])

    patched = client.patch(
        f"/admin/content/taxonomies/{taxonomy_id}",
        headers=headers,
        json={"status": "draft", "display_order": 3},
    )
    _assert_200(patched)
    assert patched.json()["taxonomy"]["status"] == "draft"
    assert patched.json()["taxonomy"]["display_order"] == 3

    published = client.post(f"/admin/content/taxonomies/{taxonomy_id}/publish", headers=headers)
    _assert_200(published)
    assert published.json()["taxonomy"]["status"] == "active"

    deleted = client.delete(f"/admin/content/taxonomies/{taxonomy_id}", headers=headers)
    _assert_200(deleted)
    assert deleted.json()["deleted"] is True

    missing = client.get(f"/admin/content/taxonomies/{taxonomy_id}", headers=headers)
    assert missing.status_code == 404, missing.text


def test_phase_d_taxonomy_rejects_duplicate_kind_slug(client) -> None:
    headers = _make_admin_headers()
    payload = {
        "kind": "topic",
        "slug": "phase-d-duplicate-topic",
        "label": {"en": "Original", "th": "ต้นฉบับ"},
        "status": "active",
    }
    first = client.post("/admin/content/taxonomies", headers=headers, json=payload)
    _assert_201(first)

    duplicate = client.post("/admin/content/taxonomies", headers=headers, json=payload)
    assert duplicate.status_code == 409, duplicate.text
    assert duplicate.json()["detail"] == "Taxonomy already exists"


def test_phase_d_taxonomy_rejects_invalid_slug_and_kind(client) -> None:
    headers = _make_admin_headers()

    invalid_slug = client.post(
        "/admin/content/taxonomies",
        headers=headers,
        json={
            "kind": "topic",
            "slug": "invalid/slug",
            "label": {"en": "Invalid slug"},
        },
    )
    assert invalid_slug.status_code == 422, invalid_slug.text
    assert invalid_slug.json()["detail"] == "slug must be lowercase letters, numbers, and hyphen only"

    spaced_slug = client.post(
        "/admin/content/taxonomies",
        headers=headers,
        json={
            "kind": "topic",
            "slug": "market update",
            "label": {"en": "Spaced slug"},
        },
    )
    assert spaced_slug.status_code == 422, spaced_slug.text
    assert spaced_slug.json()["detail"] == "slug must be lowercase letters, numbers, and hyphen only"

    invalid_kind = client.post(
        "/admin/content/taxonomies",
        headers=headers,
        json={
            "kind": "topic@v1",
            "slug": "valid-slug",
            "label": {"en": "Invalid kind"},
        },
    )
    assert invalid_kind.status_code == 422, invalid_kind.text
    assert (
        invalid_kind.json()["detail"]
        == "kind must use lowercase letters, numbers, hyphen, and underscore"
    )

    spaced_kind = client.post(
        "/admin/content/taxonomies",
        headers=headers,
        json={
            "kind": "property type",
            "slug": "valid-slug",
            "label": {"en": "Spaced kind"},
        },
    )
    assert spaced_kind.status_code == 422, spaced_kind.text
    assert (
        spaced_kind.json()["detail"]
        == "kind must use lowercase letters, numbers, hyphen, and underscore"
    )


def test_phase_d_video_full_crud(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-video-{uuid4()}"

    created = client.post(
        "/admin/content/videos",
        headers=headers,
        json={
            "slug": slug,
            "status": "draft",
            "title": {"en": "Phase D video", "th": "วิดีโอเฟส D"},
            "caption": {"en": "Caption EN", "th": "คำบรรยาย TH"},
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "thumbnail_path": "/media/library/videos/thumb.webp",
        },
    )
    _assert_201(created)
    assert created.json()["video"]["youtube_id"] == "dQw4w9WgXcQ"

    listed = client.get("/admin/content/videos?limit=20", headers=headers)
    _assert_200(listed)
    assert any(row["slug"] == slug for row in listed.json()["data"])

    patched = client.patch(
        f"/admin/content/videos/{slug}",
        headers=headers,
        json={"status": "published", "display_order": 2},
    )
    _assert_200(patched)
    assert patched.json()["video"]["status"] == "published"
    assert patched.json()["video"]["display_order"] == 2

    unpublished = client.post(f"/admin/content/videos/{slug}/unpublish", headers=headers)
    _assert_200(unpublished)
    assert unpublished.json()["video"]["status"] == "draft"

    deleted = client.delete(f"/admin/content/videos/{slug}", headers=headers)
    _assert_200(deleted)
    assert deleted.json()["deleted"] is True

    missing = client.get(f"/admin/content/videos/{slug}", headers=headers)
    assert missing.status_code == 404, missing.text


def test_phase_d_logo_endpoint_updates_site_layout_record(client) -> None:
    headers = _make_admin_headers()
    put_resp = client.put(
        "/admin/content/logo",
        headers=headers,
        json={
            "storage_path": "/media/library/logo/amp-logo.webp",
            "alt": {"en": "AMP logo", "th": "โลโก้ AMP"},
        },
    )
    _assert_200(put_resp)
    body = put_resp.json()["logo"]
    assert body["storage_path"] == "/media/library/logo/amp-logo.webp"

    get_resp = client.get("/admin/content/logo", headers=headers)
    _assert_200(get_resp)
    assert get_resp.json()["logo"]["storage_path"] == "/media/library/logo/amp-logo.webp"

    with SessionLocal() as db:
        row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "site-layout"))
        assert row is not None
        parsed = json.loads(row.content)
    assert parsed["header"]["logo"]["storage_path"] == "/media/library/logo/amp-logo.webp"
