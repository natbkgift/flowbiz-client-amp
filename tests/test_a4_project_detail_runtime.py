from __future__ import annotations

import re
from datetime import UTC, datetime
from urllib.parse import urlparse
from uuid import uuid4

from packages.core.database import SessionLocal
from packages.core.models import Area, Developer, Project, Property

_LOCAL_WEBP = "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp"
_RUNTIME_FALLBACK = "/media/library/variants/05032d16-54ae-45f4-bb89-3ae1fc2fa52f.webp"


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


def _seed_a4_detail_fixture() -> dict[str, str]:
    with SessionLocal() as db:
        area = Area(
            slug=f"a4-area-{uuid4()}",
            name="A4 Area",
            city="Pattaya",
            status="published",
            summary={"en": "A4 area summary", "th": "สรุปทำเล A4"},
            map_center={"lat": 12.9281, "lng": 100.8771},
            cover_image_url=_LOCAL_WEBP,
        )
        developer = Developer(
            slug=f"a4-dev-{uuid4()}",
            name="A4 Developer",
            status="active",
            profile={"en": "A4 developer profile", "th": "โปรไฟล์ผู้พัฒนา A4"},
            cover_image_url=_LOCAL_WEBP,
        )
        db.add_all([area, developer])
        db.flush()

        main_project = Project(
            slug=f"a4-project-main-{uuid4()}",
            name="A4 Main Project",
            status="published",
            area_id=area.id,
            developer_id=developer.id,
            property_type="condo",
            starting_price=6200000,
            hero_image_url=_LOCAL_WEBP,
            cover_image_url=_LOCAL_WEBP,
            images=[_LOCAL_WEBP, "https://bad-cdn.example/project.jpg"],
            summary={"en": "A4 EN summary"},
            description={"en": "A4 EN description", "th": "คำอธิบาย A4"},
            quick_facts=["Near beach", "Foreign quota", "Ready transfer"],
            highlights=["Sea view", "High floor"],
            amenities=["Pool", "Gym", "Parking"],
            location={
                "lat": 12.9281,
                "lng": 100.8771,
                "context": {"en": "Near beach road", "th": "ใกล้ถนนเลียบหาด"},
            },
            investment_snapshot={
                "source": "Internal desk",
                "updated_at": "2026-02-20",
                "gross_yield_percent": 6.1,
            },
            source_notes={
                "faq": [
                    {
                        "question": {"en": "Can foreigners buy units here?"},
                        "answer": {"en": "Yes, under standard quota rules."},
                    }
                ],
            },
            claims_updated_at=datetime.now(UTC),
        )

        related_project = Project(
            slug=f"a4-project-related-{uuid4()}",
            name="A4 Related Project",
            status="published",
            area_id=area.id,
            developer_id=developer.id,
            property_type="condo",
            starting_price=4800000,
            cover_image_url=_LOCAL_WEBP,
            summary={"en": "Related project summary"},
        )
        no_media_project = Project(
            slug=f"a4-project-no-media-{uuid4()}",
            name="A4 No Media Project",
            status="published",
            area_id=area.id,
            developer_id=developer.id,
            property_type="condo",
            summary={"en": "No media summary"},
            cover_image_url="https://bad-cdn.example/cover.jpg",
            hero_image_url="https://bad-cdn.example/hero.jpg",
            images=[],
        )

        db.add_all([main_project, related_project, no_media_project])
        db.flush()

        buy_unit = Property(
            source_id=f"a4-buy-{uuid4()}",
            slug=f"a4-buy-unit-{uuid4()}",
            title="A4 Buy Unit",
            type="resale",
            property_type="condo",
            status="active",
            price=4500000,
            address="123 Pattaya Rd",
            city="Pattaya",
            project_id=main_project.id,
            area_id=area.id,
            developer_id=developer.id,
            cover_image_url=_LOCAL_WEBP,
            bedrooms=1,
            bathrooms=1,
            size_sqm=45,
        )
        rent_unit = Property(
            source_id=f"a4-rent-{uuid4()}",
            slug=f"a4-rent-unit-{uuid4()}",
            title="A4 Rent Unit",
            type="rent",
            property_type="condo",
            status="active",
            price=25000,
            address="456 Pattaya Rd",
            city="Pattaya",
            project_id=main_project.id,
            area_id=area.id,
            developer_id=developer.id,
            cover_image_url=_LOCAL_WEBP,
            bedrooms=1,
            bathrooms=1,
            size_sqm=38,
        )
        related_property = Property(
            source_id=f"a4-related-{uuid4()}",
            slug=f"a4-related-unit-{uuid4()}",
            title="A4 Related Unit",
            type="new",
            property_type="condo",
            status="active",
            price=5100000,
            address="789 Pattaya Rd",
            city="Pattaya",
            project_id=related_project.id,
            area_id=area.id,
            developer_id=developer.id,
            cover_image_url=_LOCAL_WEBP,
            bedrooms=2,
            bathrooms=2,
            size_sqm=62,
        )
        db.add_all([buy_unit, rent_unit, related_property])
        main_project_slug = main_project.slug
        related_project_slug = related_project.slug
        no_media_project_slug = no_media_project.slug
        area_slug = area.slug
        developer_slug = developer.slug
        buy_unit_slug = buy_unit.slug or str(buy_unit.id)
        rent_unit_slug = rent_unit.slug or str(rent_unit.id)
        db.commit()

    return {
        "main_project_slug": main_project_slug,
        "related_project_slug": related_project_slug,
        "no_media_project_slug": no_media_project_slug,
        "area_slug": area_slug,
        "developer_slug": developer_slug,
        "buy_unit_slug": buy_unit_slug,
        "rent_unit_slug": rent_unit_slug,
    }


def test_a4_project_detail_sections_ctas_and_internal_links(client) -> None:
    seeded = _seed_a4_detail_fixture()

    response = client.get(f"/en/projects/{seeded['main_project_slug']}")
    assert response.status_code == 200, response.text
    html = response.text

    for section_id in [
        "project-hero",
        "project-gallery",
        "project-summary",
        "project-facts",
        "project-location",
        "project-investment",
        "project-availability",
        "project-related",
    ]:
        assert section_id in html

    assert "Request Consultation" in html
    assert "Book Viewing" in html
    assert 'data-schema-hook="project-detail"' in html
    assert 'data-schema-hook="project-faq"' in html

    assert f"/en/areas/{seeded['area_slug']}" in html
    assert f"/en/developers/{seeded['developer_slug']}" in html
    assert f"/en/projects/{seeded['related_project_slug']}" in html
    assert f"/en/property/{seeded['buy_unit_slug']}" in html
    assert f"/en/property/{seeded['rent_unit_slug']}" in html

    for path in [
        f"/en/areas/{seeded['area_slug']}",
        f"/en/developers/{seeded['developer_slug']}",
        f"/en/projects/{seeded['related_project_slug']}",
        f"/en/property/{seeded['buy_unit_slug']}",
        f"/en/property/{seeded['rent_unit_slug']}",
    ]:
        check = client.get(path)
        assert check.status_code == 200, f"dead internal link: {path}"

    default_list = client.get("/projects")
    assert default_list.status_code == 200, default_list.text

    default_detail = client.get(f"/projects/{seeded['main_project_slug']}")
    assert default_detail.status_code == 200, default_detail.text
    assert 'lang="en"' in default_detail.text


def test_a4_project_detail_th_fallback_and_gallery_hotlink_guard(client) -> None:
    seeded = _seed_a4_detail_fixture()

    th_response = client.get(f"/th/projects/{seeded['main_project_slug']}")
    assert th_response.status_code == 200, th_response.text
    th_html = th_response.text
    assert 'lang="th"' in th_html
    # Summary has only EN in seeded data, TH page must still render fallback text.
    assert "A4 EN summary" in th_html
    assert "<h2>แกลเลอรี</h2>" in th_html
    assert "จองนัดเข้าชม" in th_html

    no_media_response = client.get(f"/en/projects/{seeded['no_media_project_slug']}")
    assert no_media_response.status_code == 200, no_media_response.text
    no_media_html = no_media_response.text
    assert _RUNTIME_FALLBACK in no_media_html
    assert 'data-gallery-note="true"' in no_media_html
    assert "bad-cdn.example" not in no_media_html

    host = "testserver"
    for value in [
        *_extract_attrs(no_media_html, "src"),
        *_extract_attrs(no_media_html, "srcset"),
        *_extract_attrs(no_media_html, "poster"),
    ]:
        for candidate in [part.strip().split()[0] for part in value.split(",") if part.strip()]:
            assert _is_allowed_media(candidate, host=host), (
                f"Disallowed media URL in A4 runtime HTML: {candidate}"
            )
