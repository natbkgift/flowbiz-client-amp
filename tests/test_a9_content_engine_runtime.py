from __future__ import annotations

import re
from collections.abc import Generator
from datetime import UTC, datetime
from urllib.parse import urlparse
from uuid import uuid4

import pytest

from packages.core.database import SessionLocal, init_db
from packages.core.models import Article, User

_LOCAL_WEBP = "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp"


def _extract_attrs(html: str, attr: str) -> list[str]:
    return [m.group(1) for m in re.finditer(rf'{attr}="([^"]+)"', html, flags=re.IGNORECASE)]


def _is_allowed_media(url: str, *, host: str) -> bool:
    value = str(url or "").strip()
    if not value:
        return True
    if value.startswith("data:"):
        return True
    if value.startswith("/"):
        return not value.startswith("//")
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"}:
        return False
    return (parsed.hostname or "").lower() in {
        host.lower(),
        "localhost",
        "127.0.0.1",
        "flowbiz.com",
        "www.flowbiz.com",
    }


@pytest.fixture(autouse=True)
def _cleanup_articles() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(Article).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(Article).delete()
        db.query(User).delete()
        db.commit()


def _seed_a9_articles() -> dict[str, str]:
    with SessionLocal() as db:
        author_email = f"author-{uuid4()}@example.test"
        author = User(
            email=author_email,
            password_hash="hashed",
            role="admin",
        )
        db.add(author)
        db.flush()

        blog_slug = "sample-blog-a9"
        guide_slug = "sample-guide-a9"
        invest_slug = "investment-yield-basics-a9"
        non_invest_slug = "rental-contract-checklist-a9"
        keyword_only_non_invest_slug = "investment-title-rental-topic-a9"
        related_blog_slug = "sample-blog-related-a9"

        blog_body = (
            "## Market context\n"
            "Practical and verified overview for buyers.\n\n"
            "## Ownership steps\n"
            "- Verify title deed\n"
            "- Confirm transfer fee\n\n"
            "### Legal checklist\n"
            "1. Reservation agreement\n"
            "2. Sale and purchase contract\n\n"
            "## Internal links\n"
            "See [Guides](/en/guides) for more."
        )
        blog_body_th = (
            "## ภาพรวมตลาด\n"
            "ข้อมูลจากระบบที่เผยแพร่แล้ว\n\n"
            "## ขั้นตอนถือครอง\n"
            "- ตรวจสอบเอกสารสิทธิ์\n"
            "- ตรวจสอบค่าใช้จ่ายโอน\n\n"
            "### เช็กลิสต์กฎหมาย\n"
            "1. สัญญาจอง\n"
            "2. สัญญาจะซื้อจะขาย"
        )

        db.add_all(
            [
                Article(
                    slug=blog_slug,
                    category="blog",
                    status="published",
                    author_user_id=author.id,
                    title={"en": "Pattaya Buyer Flow", "th": "เส้นทางผู้ซื้อพัทยา"},
                    excerpt={
                        "en": "Understand each verified step before you commit.",
                        "th": "เข้าใจทุกขั้นตอนก่อนตัดสินใจ",
                    },
                    body_md={
                        "en": blog_body,
                        "th": blog_body_th,
                        "tags": ["ownership", "legal", "fees"],
                        "author_profile": {
                            "name": {"en": "Pawat M. Phothisarn", "th": "Pawat M. Phothisarn"},
                            "role": {"en": "Managing Director", "th": "กรรมการผู้จัดการ"},
                        },
                    },
                    hero_image_url=_LOCAL_WEBP,
                    published_at=datetime(2026, 2, 27, 8, 30, tzinfo=UTC),
                ),
                Article(
                    slug=related_blog_slug,
                    category="blog",
                    status="published",
                    title={"en": "Closing Cost Breakdown", "th": "สรุปค่าใช้จ่ายวันโอน"},
                    excerpt={"en": "Map fees before transfer day.", "th": "วางแผนค่าใช้จ่ายก่อนวันโอน"},
                    body_md={
                        "en": "## Fees\nPublished fee checklist.",
                        "th": "## ค่าธรรมเนียม\nเช็กลิสต์ค่าธรรมเนียม",
                    },
                    hero_image_url=_LOCAL_WEBP,
                    published_at=datetime(2026, 2, 26, 8, 30, tzinfo=UTC),
                ),
                Article(
                    slug=guide_slug,
                    category="guide",
                    status="published",
                    title={"en": "Relocation Setup Guide", "th": "คู่มือย้ายถิ่นฐาน"},
                    excerpt={"en": "A practical setup checklist.", "th": "เช็กลิสต์การตั้งถิ่นฐาน"},
                    body_md={
                        "en": "## Setup\nPublished guide body.",
                        "th": "## การตั้งค่า\nเนื้อหาไกด์ที่เผยแพร่",
                    },
                    hero_image_url=_LOCAL_WEBP,
                    published_at=datetime(2026, 2, 25, 8, 30, tzinfo=UTC),
                ),
                Article(
                    slug=invest_slug,
                    category="guide",
                    status="published",
                    title={"en": "Investment Yield Basics", "th": "พื้นฐานผลตอบแทนการลงทุน"},
                    excerpt={
                        "en": "Yield and risk framing for first-pass screening.",
                        "th": "กรอบผลตอบแทนและความเสี่ยง",
                    },
                    body_md={
                        "en": "## Yield\nUse verified assumptions.",
                        "th": "## ผลตอบแทน\nใช้สมมติฐานที่ตรวจสอบแล้ว",
                        "tags": {"en": ["investment", "yield"], "th": ["การลงทุน", "ผลตอบแทน"]},
                        "topics": {"en": ["investment-guide"], "th": ["คู่มือลงทุน"]},
                    },
                    hero_image_url=_LOCAL_WEBP,
                    published_at=datetime(2026, 2, 24, 8, 30, tzinfo=UTC),
                ),
                Article(
                    slug=non_invest_slug,
                    category="guide",
                    status="published",
                    title={"en": "Rental Contract Checklist", "th": "เช็กลิสต์สัญญาเช่า"},
                    excerpt={
                        "en": "Tenant checklist for rental contracts.",
                        "th": "คู่มือผู้เช่าสำหรับสัญญาเช่า",
                    },
                    body_md={"en": "## Contracts\nReview clauses.", "th": "## สัญญา\nตรวจสอบเงื่อนไข"},
                    hero_image_url=_LOCAL_WEBP,
                    published_at=datetime(2026, 2, 23, 8, 30, tzinfo=UTC),
                ),
                Article(
                    slug=keyword_only_non_invest_slug,
                    category="guide",
                    status="published",
                    title={
                        "en": "Investment title but rental topic",
                        "th": "ชื่อมีคำว่า ลงทุน แต่หัวข้อเช่า",
                    },
                    excerpt={
                        "en": "Keyword should not override taxonomy.",
                        "th": "ต้องใช้ taxonomy เป็นหลัก",
                    },
                    body_md={
                        "en": "## Rental process\nTenant checklist body.",
                        "th": "## กระบวนการเช่า\nเนื้อหาเช็กลิสต์ผู้เช่า",
                        "tags": {"en": ["rental", "contracts"], "th": ["เช่า", "สัญญา"]},
                        "topics": {"en": ["rental-guide"], "th": ["คู่มือเช่า"]},
                    },
                    hero_image_url=_LOCAL_WEBP,
                    published_at=datetime(2026, 2, 22, 8, 30, tzinfo=UTC),
                ),
            ]
        )
        db.commit()
    return {
        "blog_slug": blog_slug,
        "guide_slug": guide_slug,
        "invest_slug": invest_slug,
        "non_invest_slug": non_invest_slug,
        "keyword_only_non_invest_slug": keyword_only_non_invest_slug,
        "author_email": author_email,
    }


def test_a9_listing_routes_exist(client) -> None:
    _seed_a9_articles()
    for route in [
        "/en/blog",
        "/th/blog",
        "/en/guides",
        "/th/guides",
        "/en/invest/guides",
        "/th/invest/guides",
        "/blog",
        "/guides",
        "/invest/guides",
    ]:
        response = client.get(route)
        assert response.status_code == 200, (route, response.text)


def test_a9_listing_has_cards_metadata_tags_tracking_and_states(client) -> None:
    seeded = _seed_a9_articles()
    response = client.get("/en/blog")
    assert response.status_code == 200, response.text
    html = response.text

    assert "Pattaya Buyer Flow" in html
    assert "Published: Feb 27, 2026" in html
    assert "Updated:" in html
    assert "ownership" in html
    assert 'data-event="article_click"' in html
    assert 'data-event="content_cta_click"' in html
    assert "content_scroll_depth" in html
    assert 'id="content-loading"' in html
    assert 'id="content-error"' in html
    assert "state-empty" in html
    assert '<link rel="canonical"' in html
    assert seeded["blog_slug"] in html

    for value in [
        *_extract_attrs(html, "src"),
        *_extract_attrs(html, "srcset"),
        *_extract_attrs(html, "poster"),
    ]:
        for candidate in [part.strip().split()[0] for part in value.split(",") if part.strip()]:
            assert _is_allowed_media(candidate, host="testserver"), (
                f"Disallowed media URL: {candidate}"
            )


def test_a9_invest_guides_filters_investment_topics(client) -> None:
    seeded = _seed_a9_articles()
    response = client.get("/en/invest/guides")
    assert response.status_code == 200, response.text
    html = response.text
    assert "Investment Yield Basics" in html
    assert seeded["invest_slug"] in html
    assert seeded["non_invest_slug"] not in html
    assert seeded["keyword_only_non_invest_slug"] not in html


def test_a9_detail_has_seo_toc_related_cta_and_tracking(client) -> None:
    seeded = _seed_a9_articles()
    response = client.get(f"/en/blog/{seeded['blog_slug']}")
    assert response.status_code == 200, response.text
    html = response.text

    assert html.count("<h1") == 1
    assert 'id="article-hero"' in html
    assert 'id="article-body"' in html
    assert 'id="article-related"' in html
    assert 'id="article-toc"' in html
    assert 'data-event="content_cta_click"' in html
    assert 'data-event="article_click"' in html
    assert "content_scroll_depth" in html
    assert '<link rel="canonical"' in html
    assert 'type="application/ld+json" data-schema-hook="article-detail"' in html
    assert '"@type": "Article"' in html
    assert "Author:" in html
    assert "Author: Pawat M. Phothisarn" in html
    assert seeded["author_email"] not in html
    assert "Published: Feb 27, 2026" in html
    assert "Updated:" in html
    assert "Table of contents" in html
    assert "/en/contact?intent=consultation&article=" in html

    for value in [
        *_extract_attrs(html, "src"),
        *_extract_attrs(html, "srcset"),
        *_extract_attrs(html, "poster"),
    ]:
        for candidate in [part.strip().split()[0] for part in value.split(",") if part.strip()]:
            assert _is_allowed_media(candidate, host="testserver"), (
                f"Disallowed media URL: {candidate}"
            )


def test_a9_detail_route_is_category_scoped(client) -> None:
    seeded = _seed_a9_articles()
    wrong_category = client.get(f"/en/blog/{seeded['guide_slug']}")
    assert wrong_category.status_code == 404
    right_category = client.get(f"/en/guides/{seeded['guide_slug']}")
    assert right_category.status_code == 200, right_category.text


def test_a9_locale_safe_dates_for_thai_listing(client) -> None:
    _seed_a9_articles()
    response = client.get("/th/blog")
    assert response.status_code == 200, response.text
    html = response.text
    assert "27 ก.พ. 2026" in html
    assert "2026-02-27" not in html


def test_a9_empty_state_has_publish_safe_fallback(client) -> None:
    response = client.get("/en/blog")
    assert response.status_code == 200, response.text
    html = response.text
    assert "No published content yet." in html
    assert "TODO:" not in html
    assert 'id="content-empty"' in html
