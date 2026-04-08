from __future__ import annotations

import json
from collections.abc import Generator
from uuid import uuid4

import pytest
from sqlalchemy import desc, select

from apps.api.dependencies.auth import ADMIN_PERMISSION_READ, ADMIN_PERMISSION_WRITE
from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import (
    Article,
    AuditLog,
    CompanyInfo,
    ContentTaxonomy,
    ContentVideo,
    Permission,
    Role,
    RolePermission,
    User,
    UserRole,
)


def _make_admin_headers() -> dict[str, str]:
    email = f"phase-d-admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _make_editor_headers_with_permissions(permission_keys: list[str]) -> dict[str, str]:
    email = f"phase-d-editor-{uuid4()}@example.test"
    with SessionLocal() as db:
        user = User(email=email, password_hash=hash_password("pw"), role="editor")
        db.add(user)
        db.flush()
        role = Role(name=f"phase-d-editor-role-{uuid4()}")
        db.add(role)
        db.flush()
        db.add(UserRole(user_id=user.id, role_id=role.id))
        for key in permission_keys:
            permission = db.scalar(select(Permission).where(Permission.key == key))
            if permission is None:
                permission = Permission(key=key, description=f"seed {key}")
                db.add(permission)
                db.flush()
            db.add(RolePermission(role_id=role.id, permission_id=permission.id))
        db.commit()
    token = create_access_token(subject=email, role="editor")
    return {"Authorization": f"Bearer {token}"}


def _cleanup_phase_d_entities() -> None:
    with SessionLocal() as db:
        db.query(RolePermission).delete()
        db.query(UserRole).delete()
        db.query(Permission).delete()
        db.query(Role).delete()
        db.query(ContentVideo).delete()
        db.query(ContentTaxonomy).delete()
        db.query(Article).delete()
        db.query(CompanyInfo).filter(CompanyInfo.slug == "site-layout").delete()
        db.query(User).filter(User.email.like("phase-d-admin-%")).delete()
        db.query(User).filter(User.email.like("phase-d-editor-%")).delete()
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
        json={"slug": new_slug, "status": "in_review"},
    )
    _assert_200(patched)
    assert patched.json()["article"]["slug"] == new_slug
    assert patched.json()["article"]["status"] == "in_review"

    approved = client.patch(
        f"/admin/content/articles/{new_slug}",
        headers=headers,
        json={"status": "approved"},
    )
    _assert_200(approved)
    assert approved.json()["article"]["status"] == "approved"

    published = client.post(f"/admin/content/articles/{new_slug}/publish", headers=headers)
    _assert_200(published)
    assert published.json()["article"]["status"] == "published"

    unpublished = client.post(f"/admin/content/articles/{new_slug}/unpublish", headers=headers)
    _assert_200(unpublished)
    assert unpublished.json()["article"]["status"] == "archived"

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

    in_review = client.patch(
        f"/admin/content/articles/{slug}",
        headers=headers,
        json={"status": "in_review"},
    )
    _assert_200(in_review)
    approved = client.patch(
        f"/admin/content/articles/{slug}",
        headers=headers,
        json={"status": "approved"},
    )
    _assert_200(approved)

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

    in_review = client.patch(
        f"/admin/content/articles/{slug}",
        headers=headers,
        json={"status": "in_review"},
    )
    _assert_200(in_review)
    approved = client.patch(
        f"/admin/content/articles/{slug}",
        headers=headers,
        json={"status": "approved"},
    )
    _assert_200(approved)

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


def test_phase_d_article_status_transition_rejects_invalid_transition(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-status-invalid-{uuid4()}"
    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"en": "Status invalid"},
            "body_md": {"en": "Body"},
        },
    )
    _assert_201(created)

    patched = client.patch(
        f"/admin/content/articles/{slug}",
        headers=headers,
        json={"status": "published"},
    )
    assert patched.status_code == 400, patched.text
    assert patched.json()["detail"] == "Invalid transition: draft -> published"


def test_phase_d_article_patch_to_published_enforces_publish_checklist(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-patch-publish-checklist-{uuid4()}"
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

    _assert_200(
        client.patch(
            f"/admin/content/articles/{slug}", headers=headers, json={"status": "in_review"}
        )
    )
    _assert_200(
        client.patch(
            f"/admin/content/articles/{slug}", headers=headers, json={"status": "approved"}
        )
    )

    publish_via_patch = client.patch(
        f"/admin/content/articles/{slug}",
        headers=headers,
        json={"status": "published"},
    )
    assert publish_via_patch.status_code == 422, publish_via_patch.text
    detail = publish_via_patch.json()["detail"]
    assert detail["message"] == "Publish checklist failed"
    assert "title.en is required" in detail["blocking"]
    assert "body_md.en is required" in detail["blocking"]

    current = client.get(f"/admin/content/articles/{slug}", headers=headers)
    _assert_200(current)
    assert current.json()["article"]["status"] == "approved"


def test_phase_d_article_delete_allows_cleanup_from_draft_state(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-delete-draft-{uuid4()}"
    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"en": "Delete draft"},
            "body_md": {"en": "Body"},
        },
    )
    _assert_201(created)

    deleted = client.delete(f"/admin/content/articles/{slug}", headers=headers)
    _assert_200(deleted)
    assert deleted.json()["deleted"] is True

    missing = client.get(f"/admin/content/articles/{slug}", headers=headers)
    assert missing.status_code == 404, missing.text


def test_phase_d_article_status_transition_audit_log_records_all_transitions(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-status-audit-{uuid4()}"
    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"en": "Status audit"},
            "body_md": {"en": "Body"},
        },
    )
    _assert_201(created)

    article_id = created.json()["article"]["id"]
    _assert_200(
        client.patch(
            f"/admin/content/articles/{slug}", headers=headers, json={"status": "in_review"}
        )
    )
    _assert_200(
        client.patch(
            f"/admin/content/articles/{slug}", headers=headers, json={"status": "approved"}
        )
    )
    _assert_200(client.post(f"/admin/content/articles/{slug}/publish", headers=headers))
    _assert_200(client.post(f"/admin/content/articles/{slug}/unpublish", headers=headers))

    with SessionLocal() as db:
        logs = db.scalars(
            select(AuditLog)
            .where(
                AuditLog.entity_type == "article",
                AuditLog.entity_id == article_id,
                AuditLog.action == "status_transition",
            )
            .order_by(AuditLog.created_at.asc())
        ).all()

    assert [entry.diff.get("status", {}).get("from") for entry in logs] == [
        "draft",
        "in_review",
        "approved",
        "published",
    ]
    assert [entry.diff.get("status", {}).get("to") for entry in logs] == [
        "in_review",
        "approved",
        "published",
        "archived",
    ]


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
    assert (
        invalid_slug.json()["detail"] == "slug must be lowercase letters, numbers, and hyphen only"
    )

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
    assert (
        spaced_slug.json()["detail"] == "slug must be lowercase letters, numbers, and hyphen only"
    )

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


def test_phase_d_video_publish_blocks_missing_required_en_title(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-video-missing-en-{uuid4()}"

    created = client.post(
        "/admin/content/videos",
        headers=headers,
        json={
            "slug": slug,
            "status": "draft",
            "title": {"th": "วิดีโอไม่มี EN"},
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
    )
    _assert_201(created)

    published = client.post(f"/admin/content/videos/{slug}/publish", headers=headers)
    assert published.status_code == 422, published.text
    detail = published.json()["detail"]
    assert detail["message"] == "Publish checklist failed"
    assert "title.en is required" in detail["blocking"]
    assert "thumbnail_path is recommended before publish" in detail["warnings"]


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


def test_phase_d_company_site_layout_falls_back_and_patch_materializes_record(client) -> None:
    headers = _make_admin_headers()

    get_resp = client.get("/admin/company/site-layout", headers=headers)
    _assert_200(get_resp)
    payload = get_resp.json()
    assert payload["slug"] == "site-layout"
    parsed = json.loads(payload["content"])
    assert parsed["header"]["primary_links"][0]["href"] == "/invest"

    patch_resp = client.patch(
        "/admin/company/site-layout",
        headers=headers,
        json={
            "title": "Site Layout CMS",
            "content": json.dumps({"header": {"primary_links": []}, "footer": {"quick_links": []}}),
        },
    )
    _assert_200(patch_resp)

    with SessionLocal() as db:
        row = db.scalar(select(CompanyInfo).where(CompanyInfo.slug == "site-layout"))
        assert row is not None
        assert row.title == "Site Layout CMS"


def test_phase_d_article_revision_history_diff_and_restore(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-revision-{uuid4()}"
    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"en": "Revision title v1", "th": "หัวข้อ v1"},
            "excerpt": {"en": "excerpt v1", "th": "สรุป v1"},
            "body_md": {"en": "Body v1", "th": "เนื้อหา v1"},
        },
    )
    _assert_201(created)
    article_id = created.json()["article"]["id"]

    _assert_200(
        client.patch(
            f"/admin/content/articles/{slug}",
            headers=headers,
            json={
                "title": {"en": "Revision title v2", "th": "หัวข้อ v2"},
                "body_md": {"en": "Body v2", "th": "เนื้อหา v2"},
            },
        )
    )
    _assert_200(
        client.patch(
            f"/admin/content/articles/{slug}",
            headers=headers,
            json={
                "title": {"en": "Revision title v3", "th": "หัวข้อ v3"},
                "body_md": {"en": "Body v3", "th": "เนื้อหา v3"},
            },
        )
    )

    revisions = client.get(f"/admin/content/articles/{slug}/revisions?limit=10", headers=headers)
    _assert_200(revisions)
    revision_rows = revisions.json()["data"]
    assert len(revision_rows) >= 3
    target_index = next(
        (
            index
            for index, row in enumerate(revision_rows)
            if row.get("event") == "update" and index + 1 < len(revision_rows)
        ),
        None,
    )
    assert target_index is not None
    target_revision_id = revision_rows[target_index]["revision_id"]
    expected_base_revision_id = revision_rows[target_index + 1]["revision_id"]
    create_revision = next((row for row in revision_rows if row.get("event") == "create"), None)
    assert create_revision is not None
    oldest_revision_id = create_revision["revision_id"]

    diff = client.get(
        f"/admin/content/articles/{slug}/revisions/{target_revision_id}/diff",
        headers=headers,
    )
    _assert_200(diff)
    assert diff.json()["base_revision"]["revision_id"] == expected_base_revision_id
    assert diff.json()["summary"]["changed_fields"] > 0
    title_change = next(
        (change for change in diff.json()["changes"] if change["path"] == "title.en"), None
    )
    assert title_change is not None
    assert title_change["before"] != title_change["after"]

    restored = client.post(
        f"/admin/content/articles/{slug}/revisions/{oldest_revision_id}/restore",
        headers=headers,
    )
    _assert_200(restored)
    assert restored.json()["restored_revision_id"] == oldest_revision_id
    assert restored.json()["article"]["title"]["en"] == "Revision title v1"
    assert restored.json()["article"]["body_md"]["en"] == "Body v1"

    with SessionLocal() as db:
        restore_logs = db.scalars(
            select(AuditLog).where(
                AuditLog.entity_type == "article",
                AuditLog.entity_id == article_id,
                AuditLog.action == "revision_restore",
            )
        ).all()
    assert len(restore_logs) == 1


def test_phase_d_article_restore_rejects_external_hero_image_url(client) -> None:
    headers = _make_admin_headers()
    slug = f"phase-d-revision-media-{uuid4()}"
    created = client.post(
        "/admin/content/articles",
        headers=headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"en": "Revision media title", "th": "หัวข้อ media"},
            "body_md": {"en": "Body", "th": "เนื้อหา"},
        },
    )
    _assert_201(created)
    article_id = created.json()["article"]["id"]

    with SessionLocal() as db:
        revision = db.scalar(
            select(AuditLog)
            .where(
                AuditLog.entity_type == "article",
                AuditLog.entity_id == article_id,
                AuditLog.action == "revision_snapshot",
            )
            .order_by(desc(AuditLog.created_at), desc(AuditLog.id))
            .limit(1)
        )
        assert revision is not None
        payload = dict(revision.diff) if isinstance(revision.diff, dict) else {}
        snapshot = (
            dict(payload.get("snapshot")) if isinstance(payload.get("snapshot"), dict) else {}
        )
        snapshot["hero_image_url"] = "https://cdn.example.test/hero.jpg"
        payload["snapshot"] = snapshot
        revision.diff = payload
        db.add(revision)
        db.commit()
        revision_id = str(revision.id)

    restored = client.post(
        f"/admin/content/articles/{slug}/revisions/{revision_id}/restore",
        headers=headers,
    )
    assert restored.status_code == 422, restored.text
    assert restored.json()["detail"] == "hero_image_url must be local /media/library/ path"


def test_phase_d_article_restore_requires_admin_role(client) -> None:
    admin_headers = _make_admin_headers()
    editor_headers = _make_editor_headers_with_permissions(
        [ADMIN_PERMISSION_READ, ADMIN_PERMISSION_WRITE]
    )
    slug = f"phase-d-revision-role-{uuid4()}"
    created = client.post(
        "/admin/content/articles",
        headers=admin_headers,
        json={
            "slug": slug,
            "category": "blog",
            "status": "draft",
            "title": {"en": "Role restricted restore", "th": "จำกัด role"},
            "body_md": {"en": "Body", "th": "เนื้อหา"},
        },
    )
    _assert_201(created)

    revisions = client.get(
        f"/admin/content/articles/{slug}/revisions?limit=1", headers=admin_headers
    )
    _assert_200(revisions)
    revision_id = revisions.json()["data"][0]["revision_id"]

    denied = client.post(
        f"/admin/content/articles/{slug}/revisions/{revision_id}/restore",
        headers=editor_headers,
    )
    assert denied.status_code == 403, denied.text
    assert denied.json()["detail"] == "Restore requires admin role"
