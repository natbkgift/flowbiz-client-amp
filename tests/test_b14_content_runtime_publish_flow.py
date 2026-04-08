from __future__ import annotations

import json
from collections.abc import Generator
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import select

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import (
    Article,
    CompanyInfo,
    TeamMember,
    Testimonial as TestimonialModel,
    User,
)
from scripts.seed_company_team_testimonials import seed_content


TestimonialModel.__test__ = False


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(Article).delete()
        db.query(TestimonialModel).delete()
        db.query(TeamMember).delete()
        db.query(CompanyInfo).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(Article).delete()
        db.query(TestimonialModel).delete()
        db.query(TeamMember).delete()
        db.query(CompanyInfo).delete()
        db.query(User).delete()
        db.commit()


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def test_b14_admin_content_publish_flow_reflects_about_page(client) -> None:
    headers = _make_admin_headers()

    company_created = client.post(
        "/admin/company",
        headers=headers,
        json={
            "title": "About FlowBiz",
            "slug": "about",
            "content": "Published company overview from CMS",
            "meta_description": "Published about metadata",
        },
    )
    assert company_created.status_code == 201, company_created.text

    company_list = client.get("/admin/company", headers=headers)
    assert company_list.status_code == 200, company_list.text
    assert any(item["slug"] == "about" for item in company_list.json()["data"])

    team_created = client.post(
        "/admin/team-members",
        headers=headers,
        json={
            "name": "Mali Advisor",
            "role_title": "Senior Advisor",
            "bio": {"en": "Published team bio"},
            "status": "draft",
        },
    )
    assert team_created.status_code == 201, team_created.text
    team_id = team_created.json()["id"]

    testimonial_created = client.post(
        "/admin/testimonials",
        headers=headers,
        json={
            "status": "draft",
            "persona": "investor",
            "intent": "invest",
            "quote": "Published testimonial quote",
            "attribution_name": "Verified Investor",
        },
    )
    assert testimonial_created.status_code == 201, testimonial_created.text
    testimonial_id = testimonial_created.json()["id"]

    about_before = client.get("/en/about")
    assert about_before.status_code == 200, about_before.text
    assert "Mali Advisor" not in about_before.text
    assert "Published testimonial quote" not in about_before.text
    public_team_before = client.get("/v1/team-members")
    assert public_team_before.status_code == 200, public_team_before.text
    assert public_team_before.json()["data"] == []
    public_testimonials_before = client.get("/v1/testimonials?intent=invest")
    assert public_testimonials_before.status_code == 200, public_testimonials_before.text
    assert public_testimonials_before.json()["data"] == []

    publish_team = client.post(f"/admin/team-members/{team_id}/publish", headers=headers)
    assert publish_team.status_code == 200, publish_team.text
    publish_testimonial = client.post(
        f"/admin/testimonials/{testimonial_id}/publish", headers=headers
    )
    assert publish_testimonial.status_code == 200, publish_testimonial.text

    about_after = client.get("/en/about")
    assert about_after.status_code == 200, about_after.text
    assert "Published company overview from CMS" in about_after.text
    assert "Mali Advisor" in about_after.text
    assert "Published testimonial quote" in about_after.text
    public_team_after = client.get("/v1/team-members")
    assert public_team_after.status_code == 200, public_team_after.text
    assert any(item["id"] == team_id for item in public_team_after.json()["data"])
    public_testimonials_after = client.get("/v1/testimonials?intent=invest")
    assert public_testimonials_after.status_code == 200, public_testimonials_after.text
    assert any(item["id"] == testimonial_id for item in public_testimonials_after.json()["data"])

    unpublish_team = client.post(f"/admin/team-members/{team_id}/unpublish", headers=headers)
    assert unpublish_team.status_code == 200, unpublish_team.text
    unpublish_testimonial = client.post(
        f"/admin/testimonials/{testimonial_id}/unpublish", headers=headers
    )
    assert unpublish_testimonial.status_code == 200, unpublish_testimonial.text

    about_unpublished = client.get("/en/about")
    assert about_unpublished.status_code == 200, about_unpublished.text
    assert "Mali Advisor" not in about_unpublished.text
    assert "Published testimonial quote" not in about_unpublished.text
    public_team_unpublished = client.get("/v1/team-members")
    assert public_team_unpublished.status_code == 200, public_team_unpublished.text
    assert not any(item["id"] == team_id for item in public_team_unpublished.json()["data"])
    public_testimonials_unpublished = client.get("/v1/testimonials?intent=invest")
    assert public_testimonials_unpublished.status_code == 200, public_testimonials_unpublished.text
    assert not any(
        item["id"] == testimonial_id for item in public_testimonials_unpublished.json()["data"]
    )


def test_b14_team_member_publish_blocks_missing_bio(client) -> None:
    headers = _make_admin_headers()

    created = client.post(
        "/admin/team-members",
        headers=headers,
        json={
            "name": "No Bio Advisor",
            "role_title": "Advisor",
            "status": "draft",
        },
    )
    assert created.status_code == 201, created.text
    member_id = created.json()["id"]

    published = client.post(f"/admin/team-members/{member_id}/publish", headers=headers)
    assert published.status_code == 422, published.text
    assert published.json()["detail"] == {
        "code": "team_member_publish_requirements_missing",
        "errors": ["bio is required"],
    }


def test_b14_testimonial_publish_blocks_missing_attribution(client) -> None:
    headers = _make_admin_headers()

    created = client.post(
        "/admin/testimonials",
        headers=headers,
        json={
            "status": "draft",
            "persona": "investor",
            "intent": "invest",
            "quote": "Needs attribution before publish",
        },
    )
    assert created.status_code == 201, created.text
    testimonial_id = created.json()["id"]

    published = client.post(
        f"/admin/testimonials/{testimonial_id}/publish",
        headers=headers,
    )
    assert published.status_code == 422, published.text
    assert published.json()["detail"] == {
        "code": "testimonial_publish_requirements_missing",
        "errors": ["attribution_name is required"],
    }


def test_b14_seed_content_upserts_company_team_testimonials(tmp_path: Path) -> None:
    input_dir = tmp_path / "import"
    input_dir.mkdir(parents=True, exist_ok=True)

    (input_dir / "company_info.json").write_text(
        json.dumps(
            [
                {
                    "slug": "about",
                    "title": "About",
                    "content": "Seeded about",
                    "meta_description": "Seeded meta",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (input_dir / "team_members.json").write_text(
        json.dumps(
            [
                {
                    "name": "Seed Team",
                    "role_title": "Advisor",
                    "bio": {"en": "Seed bio"},
                    "status": "active",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (input_dir / "testimonials.json").write_text(
        json.dumps(
            [
                {
                    "status": "published",
                    "persona": "buyer",
                    "intent": "buy",
                    "quote": "Seed quote",
                    "attribution_name": "Seed Client",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (input_dir / "articles.json").write_text(
        json.dumps(
            [
                {
                    "slug": "assetmp-company-overview",
                    "category": "guide",
                    "status": "published",
                    "title": {"en": "AssetMP company overview"},
                    "excerpt": {"en": "Sourced from approved company-owned website assetmp.net."},
                    "body_md": {
                        "en": "Multilingual support and end-to-end service across Thailand."
                    },
                    "hero_image_url": "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp",
                    "tags": {"en": ["investment", "yield"], "th": ["การลงทุน", "ผลตอบแทน"]},
                    "topics": {"en": ["investment-guide"], "th": ["คู่มือลงทุน"]},
                    "author_name": {"en": "Pawat M. Phothisarn"},
                    "author_role": {"en": "Managing Director"},
                    "author_bio": {"en": "Approved author profile"},
                    "source_url": "https://www.assetmp.net/",
                    "source_domain": "assetmp.net",
                    "source_rights": "company-owned first-party content",
                    "published_at": "2026-02-20T08:30:00Z",
                    "updated_at": "2026-02-27T09:45:00Z",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    dry_run = seed_content(input_dir=input_dir, dry_run=True)
    assert dry_run["company_info"]["created"] == 1
    assert dry_run["team_members"]["created"] == 1
    assert dry_run["testimonials"]["created"] == 1
    assert dry_run["articles"]["created"] == 1

    applied = seed_content(input_dir=input_dir, dry_run=False)
    assert applied["company_info"]["created"] == 1
    assert applied["team_members"]["created"] == 1
    assert applied["testimonials"]["created"] == 1
    assert applied["articles"]["created"] == 1

    rerun = seed_content(input_dir=input_dir, dry_run=False)
    assert rerun["company_info"]["updated"] == 1
    assert rerun["team_members"]["updated"] == 1
    assert rerun["testimonials"]["updated"] == 1
    assert rerun["articles"]["updated"] == 1

    with SessionLocal() as db:
        article = db.scalar(select(Article).where(Article.slug == "assetmp-company-overview"))
        assert article is not None
        assert isinstance(article.body_md, dict)
        assert article.body_md.get("tags")
        assert article.body_md.get("topics")
        author_profile = article.body_md.get("author_profile")
        assert isinstance(author_profile, dict)
        assert isinstance(author_profile.get("name"), dict)
        source_meta = article.body_md.get("source_meta")
        assert isinstance(source_meta, dict)
        assert source_meta.get("domain") == "assetmp.net"
        assert article.published_at is not None


def test_b14_seed_rejects_external_article_hero_image_url(tmp_path: Path) -> None:
    input_dir = tmp_path / "import"
    input_dir.mkdir(parents=True, exist_ok=True)
    (input_dir / "articles.json").write_text(
        json.dumps(
            [
                {
                    "slug": "assetmp-bad-media",
                    "category": "guide",
                    "title": {"en": "Bad media"},
                    "body_md": {"en": "Body"},
                    "hero_image_url": "https://www.assetmp.net/mv/images/partner/arom.webp",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match=r"articles\[1\] invalid hero_image_url"):
        seed_content(input_dir=input_dir, dry_run=True)


def test_b14_seed_rejects_external_team_photo_url(tmp_path: Path) -> None:
    input_dir = tmp_path / "import"
    input_dir.mkdir(parents=True, exist_ok=True)
    (input_dir / "team_members.json").write_text(
        json.dumps(
            [
                {
                    "name": "Unsafe Team",
                    "role_title": "Advisor",
                    "photo_url": "https://cdn.example.com/team.jpg",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match=r"team_members\[1\] invalid photo_url"):
        seed_content(input_dir=input_dir, dry_run=True)


def test_b14_seed_accepts_local_team_photo_url(tmp_path: Path) -> None:
    input_dir = tmp_path / "import"
    input_dir.mkdir(parents=True, exist_ok=True)
    (input_dir / "team_members.json").write_text(
        json.dumps(
            [
                {
                    "name": "Safe Team",
                    "role_title": "Advisor",
                    "photo_url": "/media/library/safe-team.jpg",
                    "status": "active",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    dry_run = seed_content(input_dir=input_dir, dry_run=True)
    assert dry_run["team_members"]["created"] == 1


def test_b14_seeded_company_and_article_are_visible_on_runtime(client, tmp_path: Path) -> None:
    input_dir = tmp_path / "import"
    input_dir.mkdir(parents=True, exist_ok=True)

    (input_dir / "company_info.json").write_text(
        json.dumps(
            [
                {
                    "slug": "about",
                    "title": "About AMP",
                    "content": "The only real estate company you'll ever need",
                    "meta_description": "Seeded from approved company-owned source",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (input_dir / "articles.json").write_text(
        json.dumps(
            [
                {
                    "slug": "assetmp-seeded-insight",
                    "category": "guide",
                    "status": "published",
                    "title": {"en": "AssetMP seeded insight"},
                    "excerpt": {"en": "exclusive listings across Thailand"},
                    "body_md": {
                        "en": "multilingual support and complete service from start to finish"
                    },
                    "hero_image_url": "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp",
                }
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    applied = seed_content(input_dir=input_dir, dry_run=False)
    assert applied["company_info"]["created"] == 1
    assert applied["articles"]["created"] == 1

    about = client.get("/en/about")
    assert about.status_code == 200, about.text
    assert (
        "The only real estate company you'll ever need" in about.text
        or "The only real estate company you&#x27;ll ever need" in about.text
    )

    insights = client.get("/en/insights")
    assert insights.status_code == 200, insights.text
    assert "AssetMP seeded insight" in insights.text


def test_b14_admin_article_editorial_metadata_drives_runtime_filter_and_author(client) -> None:
    headers = _make_admin_headers()
    local_hero = "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp"
    slug = "admin-invest-guide-metadata"

    with SessionLocal() as db:
        db.add(
            Article(
                slug=slug,
                category="guide",
                status="published",
                title={"en": "Investment title keyword only", "th": "ชื่อมีคำว่าลงทุน"},
                excerpt={"en": "Before taxonomy update", "th": "ก่อนอัปเดต taxonomy"},
                body_md={
                    "en": "## Body\nInitial body.",
                    "th": "## เนื้อหา\nเนื้อหาเริ่มต้น",
                    "tags": {"en": ["rental"], "th": ["เช่า"]},
                    "topics": {"en": ["rental-guide"], "th": ["คู่มือเช่า"]},
                },
                hero_image_url=local_hero,
            )
        )
        db.commit()

    before = client.get("/en/invest/guides")
    assert before.status_code == 200, before.text
    assert slug not in before.text

    editorial = client.patch(
        f"/admin/content/articles/{slug}/editorial",
        headers=headers,
        json={
            "tags": {"en": ["investment", "yield"], "th": ["การลงทุน", "ผลตอบแทน"]},
            "topics": {"en": ["investment-guide"], "th": ["คู่มือลงทุน"]},
            "author_name": {"en": "Pawat M. Phothisarn", "th": "Pawat M. Phothisarn"},
            "author_role": {"en": "Managing Director", "th": "กรรมการผู้จัดการ"},
            "author_bio": {"en": "Approved author profile"},
            "source_domain": "assetmp.net",
            "source_url": "https://www.assetmp.net/",
            "source_rights": "company-owned first-party content",
            "published_at": "2026-02-27T10:00:00Z",
        },
    )
    assert editorial.status_code == 200, editorial.text
    body = editorial.json()["article"]
    assert body["body_md"]["tags"]["en"] == ["investment", "yield"]
    assert body["body_md"]["author_profile"]["name"]["en"] == "Pawat M. Phothisarn"

    after = client.get("/en/invest/guides")
    assert after.status_code == 200, after.text
    assert slug in after.text

    detail = client.get(f"/en/guides/{slug}")
    assert detail.status_code == 200, detail.text
    assert "Author: Pawat M. Phothisarn" in detail.text


def test_b14_repo_import_seed_files_are_safe_and_runtime_ready() -> None:
    summary = seed_content(input_dir=Path("data/import"), dry_run=True)
    assert summary["company_info"]["created"] >= 7
    assert summary["team_members"]["created"] >= 5
    assert summary["testimonials"]["created"] >= 5
    assert summary["articles"]["created"] >= 3


def test_b14_seed_sync_prunes_stale_team_and_testimonials(tmp_path: Path) -> None:
    input_dir = tmp_path / "import"
    input_dir.mkdir(parents=True, exist_ok=True)
    (input_dir / "company_info.json").write_text("[]", encoding="utf-8")
    (input_dir / "team_members.json").write_text(
        json.dumps(
            [{"name": "Current Team", "role_title": "Advisor", "status": "active"}],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (input_dir / "testimonials.json").write_text("[]", encoding="utf-8")
    (input_dir / "articles.json").write_text("[]", encoding="utf-8")

    with SessionLocal() as db:
        db.add(TeamMember(name="Stale Team", role_title="Advisor", status="active"))
        db.add(
            TestimonialModel(
                status="published",
                persona="buyer",
                intent="buy",
                quote="Old quote",
                attribution_name="Old client",
            )
        )
        db.commit()

    summary = seed_content(
        input_dir=input_dir,
        dry_run=False,
        sync_entities={"team_members", "testimonials"},
    )
    assert summary["team_members"]["removed"] == 1
    assert summary["testimonials"]["removed"] == 1

    with SessionLocal() as db:
        team_names = {row.name for row in db.query(TeamMember).all()}
        testimonial_quotes = {row.quote for row in db.query(TestimonialModel).all()}
    assert team_names == {"Current Team"}
    assert testimonial_quotes == set()
