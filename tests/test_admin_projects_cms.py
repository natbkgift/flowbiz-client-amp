from __future__ import annotations

from collections.abc import Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import MediaAsset, Project, User


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(Project).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
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
                file_size_bytes=1024,
                checksum_sha256=(str(uuid4()).replace("-", "") + str(uuid4()).replace("-", ""))[:64],
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


def test_admin_projects_create_blocks_rejected_or_restricted_media(client: TestClient) -> None:
    _add_media_asset(
        path="/media/library/restricted.jpg",
        rights_status="restricted",
        approval_status="approved",
    )
    headers = _make_admin_headers()

    res = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"project-{uuid4()}",
            "name": "Restricted Media Project",
            "status": "draft",
            "cover_image_url": "/media/library/restricted.jpg",
            "summary": {"en": "summary"},
        },
    )

    assert res.status_code == 422, res.text
    body = res.json()
    assert "media_governance_blocked" in str(body)


def test_admin_projects_create_allows_pending_with_warning(client: TestClient) -> None:
    _add_media_asset(
        path="/media/library/pending.jpg",
        rights_status="pending_review",
        approval_status="pending",
        is_exception=True,
    )
    headers = _make_admin_headers()

    res = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": f"project-{uuid4()}",
            "name": "Pending Media Project",
            "status": "draft",
            "cover_image_url": "/media/library/pending.jpg",
            "summary": {"en": "summary"},
        },
    )

    assert res.status_code == 201, res.text
    body = res.json()
    assert body["status"] == "draft"
    assert len(body["media_warnings"]) >= 1


def test_admin_projects_publish_blocks_invalid_media_paths(client: TestClient) -> None:
    headers = _make_admin_headers()
    slug = f"project-{uuid4()}"

    with SessionLocal() as db:
        db.add(
            Project(
                slug=slug,
                name="External Path Project",
                status="draft",
                summary={"en": "summary"},
                hero_image_url="https://bad.example/hero.jpg",
            )
        )
        db.commit()

    with SessionLocal() as db:
        row = db.query(Project).filter(Project.slug == slug).first()
        assert row is not None
        project_id = str(row.id)

    res = client.post(f"/admin/projects/{project_id}/publish", headers=headers)
    assert res.status_code == 422, res.text
    assert "media_governance_blocked" in str(res.json())


def test_admin_to_public_flow_reflects_published_project_with_local_media(
    client: TestClient,
) -> None:
    local_media_path = f"/media/library/{uuid4()}.jpg"
    _add_media_asset(
        path=local_media_path,
        rights_status="approved",
        approval_status="approved",
    )
    headers = _make_admin_headers()
    slug = f"project-{uuid4()}"

    create = client.post(
        "/admin/projects",
        headers=headers,
        json={
            "slug": slug,
            "name": "Integration Proof Project",
            "status": "draft",
            "cover_image_url": local_media_path,
            "summary": {"en": "summary"},
        },
    )
    assert create.status_code == 201, create.text
    project_id = create.json()["id"]

    patch = client.patch(
        f"/admin/projects/{project_id}",
        headers=headers,
        json={"name": "Integration Proof Project Updated"},
    )
    assert patch.status_code == 200, patch.text

    publish = client.post(f"/admin/projects/{project_id}/publish", headers=headers)
    assert publish.status_code == 200, publish.text

    public_list = client.get("/v1/projects")
    assert public_list.status_code == 200, public_list.text
    rows = public_list.json()["data"]
    row = next((item for item in rows if item["slug"] == slug), None)
    assert row is not None

    public_detail = client.get(f"/v1/projects/slug/{slug}")
    assert public_detail.status_code == 200, public_detail.text
    detail = public_detail.json()
    assert detail["cover_image_url"] == local_media_path
    assert detail["cover_image_url"].startswith("/media/")
