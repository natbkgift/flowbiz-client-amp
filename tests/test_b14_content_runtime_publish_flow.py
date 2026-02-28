from __future__ import annotations

import json
from collections.abc import Generator
from pathlib import Path
from uuid import uuid4

import pytest

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import Article, CompanyInfo, TeamMember, Testimonial as TestimonialModel, User
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

    publish_team = client.post(f"/admin/team-members/{team_id}/publish", headers=headers)
    assert publish_team.status_code == 200, publish_team.text
    publish_testimonial = client.post(f"/admin/testimonials/{testimonial_id}/publish", headers=headers)
    assert publish_testimonial.status_code == 200, publish_testimonial.text

    about_after = client.get("/en/about")
    assert about_after.status_code == 200, about_after.text
    assert "Published company overview from CMS" in about_after.text
    assert "Mali Advisor" in about_after.text
    assert "Published testimonial quote" in about_after.text

    unpublish_team = client.post(f"/admin/team-members/{team_id}/unpublish", headers=headers)
    assert unpublish_team.status_code == 200, unpublish_team.text
    unpublish_testimonial = client.post(f"/admin/testimonials/{testimonial_id}/unpublish", headers=headers)
    assert unpublish_testimonial.status_code == 200, unpublish_testimonial.text

    about_unpublished = client.get("/en/about")
    assert about_unpublished.status_code == 200, about_unpublished.text
    assert "Mali Advisor" not in about_unpublished.text
    assert "Published testimonial quote" not in about_unpublished.text


def test_b14_seed_content_upserts_company_team_testimonials(tmp_path: Path) -> None:
    input_dir = tmp_path / "import"
    input_dir.mkdir(parents=True, exist_ok=True)

    (input_dir / "company_info.json").write_text(
        json.dumps(
            [{"slug": "about", "title": "About", "content": "Seeded about", "meta_description": "Seeded meta"}],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (input_dir / "team_members.json").write_text(
        json.dumps(
            [{"name": "Seed Team", "role_title": "Advisor", "bio": {"en": "Seed bio"}, "status": "active"}],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (input_dir / "testimonials.json").write_text(
        json.dumps(
            [{"status": "published", "persona": "buyer", "intent": "buy", "quote": "Seed quote", "attribution_name": "Seed Client"}],
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
                    "body_md": {"en": "Multilingual support and end-to-end service across Thailand."},
                    "hero_image_url": "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp",
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
            [{"name": "Unsafe Team", "role_title": "Advisor", "photo_url": "https://cdn.example.com/team.jpg"}],
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
            [{"name": "Safe Team", "role_title": "Advisor", "photo_url": "/media/library/safe-team.jpg", "status": "active"}],
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
                    "body_md": {"en": "multilingual support and complete service from start to finish"},
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


def test_b14_repo_import_seed_files_are_safe_and_runtime_ready() -> None:
    summary = seed_content(input_dir=Path("data/import"), dry_run=True)
    assert summary["company_info"]["created"] >= 7
    assert summary["team_members"]["created"] >= 5
    assert summary["testimonials"]["created"] == 0
    assert summary["articles"]["created"] >= 3


def test_b14_seed_sync_prunes_stale_team_and_testimonials(tmp_path: Path) -> None:
    input_dir = tmp_path / "import"
    input_dir.mkdir(parents=True, exist_ok=True)
    (input_dir / "company_info.json").write_text("[]", encoding="utf-8")
    (input_dir / "team_members.json").write_text(
        json.dumps([{"name": "Current Team", "role_title": "Advisor", "status": "active"}], ensure_ascii=False),
        encoding="utf-8",
    )
    (input_dir / "testimonials.json").write_text("[]", encoding="utf-8")
    (input_dir / "articles.json").write_text("[]", encoding="utf-8")

    with SessionLocal() as db:
        db.add(TeamMember(name="Stale Team", role_title="Advisor", status="active"))
        db.add(TestimonialModel(status="published", persona="buyer", intent="buy", quote="Old quote", attribution_name="Old client"))
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
