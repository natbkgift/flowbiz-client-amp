from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import Article, MediaAsset, User
from packages.core.media_storage import StoredMedia


def _admin_headers() -> dict[str, str]:
    email = f"admin-content-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _create_draft_article(*, slug: str) -> None:
    with SessionLocal() as db:
        row = Article(
            slug=slug,
            category="blog",
            status="draft",
            title={"en": "Title EN", "th": "Title TH"},
            excerpt={"en": "Excerpt EN", "th": "Excerpt TH"},
            body_md={"en": "Body EN", "th": "Body TH"},
            published_at=None,
        )
        db.add(row)
        db.commit()


def test_content_media_ingestion_publish_now_success(client: TestClient, monkeypatch) -> None:
    slug = f"blog-ingest-ok-{uuid4().hex[:8]}"
    _create_draft_article(slug=slug)

    def _fake_ingest(self, url: str) -> StoredMedia:  # noqa: ARG001
        return StoredMedia(
            storage_path="/media/library/content-ingested-ok.jpg",
            mime_type="image/jpeg",
            file_size_bytes=234,
            checksum_sha256=(str(uuid4()).replace("-", "") + str(uuid4()).replace("-", ""))[:64],
            width=1200,
            height=800,
            source_url=url,
        )

    monkeypatch.setattr("packages.core.media_storage.MediaStorageService.ingest_from_url", _fake_ingest)

    res = client.post(
        f"/admin/content/articles/{slug}/hero-image/ingest",
        headers=_admin_headers(),
        json={
            "source_url": "https://official.example/content-1.jpg",
            "source_page_url": "https://official.example/blog/source",
            "source_type": "official_project_website",
            "rights_status": "approved",
            "approval_status": "approved",
            "publish_now": True,
        },
    )

    assert res.status_code == 201, res.text
    payload = res.json()
    assert payload["published"] is True
    assert payload["hero_image_url"].startswith("/media/")

    with SessionLocal() as db:
        row = db.query(Article).filter(Article.slug == slug).one()
        assert row.status == "published"
        assert row.published_at is not None


def test_content_media_ingestion_publish_now_rejects_unapproved(client: TestClient, monkeypatch) -> None:
    slug = f"blog-ingest-reject-{uuid4().hex[:8]}"
    _create_draft_article(slug=slug)

    def _fake_ingest(self, url: str) -> StoredMedia:  # noqa: ARG001
        return StoredMedia(
            storage_path="/media/library/content-ingested-reject.jpg",
            mime_type="image/jpeg",
            file_size_bytes=345,
            checksum_sha256=(str(uuid4()).replace("-", "") + str(uuid4()).replace("-", ""))[:64],
            width=1200,
            height=800,
            source_url=url,
        )

    monkeypatch.setattr("packages.core.media_storage.MediaStorageService.ingest_from_url", _fake_ingest)

    res = client.post(
        f"/admin/content/articles/{slug}/hero-image/ingest",
        headers=_admin_headers(),
        json={
            "source_url": "https://official.example/content-2.jpg",
            "source_page_url": "https://official.example/blog/source",
            "source_type": "official_project_website",
            "rights_status": "pending_review",
            "approval_status": "pending",
            "publish_now": True,
        },
    )

    assert res.status_code == 422, res.text
