from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from packages.core.database import SessionLocal
from packages.core.models import Article, MediaAsset


def _create_media_asset(*, storage_path: str, approval: str = "approved", rights: str = "approved"):
    with SessionLocal() as db:
        row = MediaAsset(
            storage_path=storage_path,
            kind="image",
            mime_type="image/jpeg",
            file_size_bytes=123,
            checksum_sha256=(str(uuid4()).replace("-", "") + str(uuid4()).replace("-", ""))[:64],
            source_url="https://official.example/asset.jpg",
            source_domain="official.example",
            source_type="official",
            rights_status=rights,
            approval_status=approval,
            status="active",
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row.id


def _create_article(
    *,
    slug: str,
    category: str,
    status: str,
    media_id: str | None = None,
    hero_image_url: str | None = None,
    body_en: str = "English content",
    body_th: str = "Thai content",
) -> None:
    with SessionLocal() as db:
        row = Article(
            slug=slug,
            category=category,
            status=status,
            title={"en": f"{slug} EN", "th": f"{slug} TH"},
            excerpt={"en": "excerpt en", "th": "excerpt th"},
            body_md={"en": body_en, "th": body_th},
            hero_image_url=hero_image_url,
            hero_media_asset_id=media_id,
            published_at=datetime.now(timezone.utc),
        )
        db.add(row)
        db.commit()


def test_content_public_api_blog_and_guides(client: TestClient) -> None:
    suffix = uuid4().hex[:8]
    slug_public = f"blog-public-ok-{suffix}"
    slug_hidden = f"blog-not-public-{suffix}"
    slug_guide = f"guide-public-ok-{suffix}"

    media_id = _create_media_asset(storage_path="/media/library/content-blog-1.jpg")
    _create_article(
        slug=slug_public,
        category="blog",
        status="published",
        media_id=media_id,
        hero_image_url="/media/library/content-blog-1.jpg",
    )

    bad_media_id = _create_media_asset(
        storage_path="/media/library/content-blog-bad.jpg",
        approval="pending",
        rights="pending_review",
    )
    _create_article(
        slug=slug_hidden,
        category="blog",
        status="published",
        media_id=bad_media_id,
        hero_image_url="/media/library/content-blog-bad.jpg",
    )

    _create_article(
        slug=slug_guide,
        category="guide",
        status="published",
        media_id=None,
        hero_image_url=None,
        body_en="Guide EN\n\nChecklist",
        body_th="Guide TH\n\nChecklist",
    )

    blog_list = client.get("/v1/content/blog-posts/")
    assert blog_list.status_code == 200, blog_list.text
    blog_slugs = [row["slug"] for row in blog_list.json()]
    assert slug_public in blog_slugs
    assert slug_hidden not in blog_slugs

    blog_detail_ok = client.get(f"/v1/content/blog-posts/{slug_public}/")
    assert blog_detail_ok.status_code == 200, blog_detail_ok.text
    assert blog_detail_ok.json()["slug"] == slug_public

    blog_detail_hidden = client.get(f"/v1/content/blog-posts/{slug_hidden}/")
    assert blog_detail_hidden.status_code == 404

    guide_list = client.get("/v1/content/guides/")
    assert guide_list.status_code == 200, guide_list.text
    assert any(row["slug"] == slug_guide for row in guide_list.json())

    guide_detail = client.get(f"/v1/content/guides/{slug_guide}/")
    assert guide_detail.status_code == 200, guide_detail.text
    assert guide_detail.json()["slug"] == slug_guide
