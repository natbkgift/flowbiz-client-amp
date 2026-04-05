from __future__ import annotations

import re
from datetime import date
from urllib.parse import urlparse
from uuid import uuid4

from packages.core.database import SessionLocal
from packages.core.models import Area, AreaStatistic, Project, Property

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


def test_a7_area_guide_listing_routes_tracking_and_metrics_guard(client) -> None:
    slug_verified = f"a7-area-verified-{uuid4()}"
    slug_unverified = f"a7-area-unverified-{uuid4()}"

    with SessionLocal() as db:
        area_verified = Area(
            slug=slug_verified,
            name="A7 Verified Area",
            status="published",
            summary={"en": "Verified area summary"},
            source_note="Internal market desk",
            cover_image_url=_LOCAL_WEBP,
            content={
                "en": {
                    "metrics_update_cadence": "Monthly",
                },
                "th": {
                    "metrics_update_cadence": "รายเดือน",
                },
            },
        )
        area_unverified = Area(
            slug=slug_unverified,
            name="A7 Unverified Area",
            status="published",
            summary={"en": "Unverified area summary"},
            cover_image_url="https://bad-cdn.example/area.jpg",
        )
        db.add_all([area_verified, area_unverified])
        db.flush()

        db.add(
            AreaStatistic(
                area_id=area_verified.id,
                avg_price_sqm=123456,
                avg_roi_percent=6.4,
                total_projects=7,
                as_of_date=date(2026, 2, 27),
            )
        )
        db.add(
            AreaStatistic(
                area_id=area_unverified.id,
                avg_price_sqm=987654,
                avg_roi_percent=9.9,
                total_projects=99,
                as_of_date=date(2026, 2, 27),
            )
        )
        db.add(
            Project(
                slug=f"a7-project-{uuid4()}",
                name="A7 Linked Project",
                status="published",
                area_id=area_verified.id,
                property_type="condo",
                cover_image_url=_LOCAL_WEBP,
                summary={"en": "A7 project summary"},
            )
        )
        db.commit()

    response = client.get("/en/area-guide")
    assert response.status_code == 200, response.text
    html = response.text

    assert client.get("/th/area-guide").status_code == 200
    assert client.get("/en/areas").status_code == 200
    assert re.search(r'href="/en/areas/[^"]+"', html)
    assert re.search(r'href="/en/projects\?area=[^"]+"', html)
    assert re.search(r'href="/en/contact\?intent=consultation&area=[^"]+"', html)
    assert 'data-event="area_card_click"' in html
    assert 'data-event="area_cta_click"' in html
    assert 'aria-label="Breadcrumb"' in html
    assert "Metrics pending verified source note and update timestamp." in html
    assert "987,654" not in html
    assert "9.9%" not in html
    assert "bad-cdn.example" not in html
    assert _RUNTIME_FALLBACK in html
    assert 'id="area-guide-loading"' in html
    assert 'id="area-guide-runtime-error"' in html

    host = "testserver"
    for value in [
        *_extract_attrs(html, "src"),
        *_extract_attrs(html, "srcset"),
        *_extract_attrs(html, "poster"),
    ]:
        for candidate in [part.strip().split()[0] for part in value.split(",") if part.strip()]:
            assert _is_allowed_media(candidate, host=host), (
                f"Disallowed media URL in A7 area-guide HTML: {candidate}"
            )


def test_a7_area_detail_sections_tracking_and_internal_links(client) -> None:
    area_slug = f"a7-detail-area-{uuid4()}"
    project_slug = f"a7-detail-project-{uuid4()}"
    property_slug = f"a7-detail-property-{uuid4()}"

    with SessionLocal() as db:
        area = Area(
            slug=area_slug,
            name="A7 Detail Area",
            status="published",
            summary={"en": "A7 detail summary"},
            source_note="Internal desk weekly update",
            map_center={"lat": 12.9345, "lng": 100.8821},
            cover_image_url=_LOCAL_WEBP,
            content={
                "en": {
                    "why_live_invest": "Strong rental demand with balanced owner-occupier activity.",
                    "transport": "15 minutes to major highway access points.",
                    "lifestyle": "Nearby cafés, hospitals, and shopping centers.",
                    "beach_proximity": "Beach access within 10-15 minutes by car.",
                    "metrics_update_cadence": "Monthly",
                },
                "th": {
                    "why_live_invest": "ดีมานด์เช่าสูงและมีดีมานด์อยู่อาศัยจริง",
                    "transport": "เดินทางเชื่อมถนนหลักได้ในประมาณ 15 นาที",
                    "lifestyle": "ใกล้คาเฟ่ โรงพยาบาล และศูนย์การค้า",
                    "beach_proximity": "ถึงหาดได้ภายในประมาณ 10-15 นาที",
                    "metrics_update_cadence": "รายเดือน",
                },
            },
        )
        db.add(area)
        db.flush()

        db.add(
            AreaStatistic(
                area_id=area.id,
                avg_price_sqm=654321,
                avg_rent_monthly=32000,
                avg_roi_percent=6.8,
                total_projects=11,
                total_units=2500,
                as_of_date=date(2026, 2, 26),
            )
        )
        db.add(
            Project(
                slug=project_slug,
                name="A7 Detail Project",
                status="published",
                area_id=area.id,
                property_type="condo",
                starting_price=7200000,
                cover_image_url=_LOCAL_WEBP,
                summary={"en": "A7 detail project summary"},
            )
        )
        db.add(
            Property(
                source_id=f"a7-source-{uuid4()}",
                slug=property_slug,
                title="A7 Detail Property",
                type="resale",
                property_type="condo",
                status="active",
                price=4900000,
                address="A7 Address",
                city="Pattaya",
                area_id=area.id,
                cover_image_url=_LOCAL_WEBP,
                bedrooms=2,
                bathrooms=2,
                size_sqm=58,
            )
        )
        db.commit()

    response = client.get(f"/en/areas/{area_slug}")
    assert response.status_code == 200, response.text
    html = response.text
    assert client.get(f"/en/area-guide/{area_slug}").status_code == 200

    for section_id in [
        "area-breadcrumb",
        "area-overview",
        "area-why-live-invest",
        "area-stats",
        "area-featured-projects",
        "area-featured-properties",
        "area-proximity",
        "area-cta",
    ]:
        assert section_id in html

    assert html.count("<h1") == 1
    assert "Why live or invest here" in html
    assert "Internal desk weekly update" in html
    assert "THB 654,321" in html
    assert "Update cadence" in html
    assert "Monthly" in html
    assert "A7 Detail Project" in html
    assert "A7 Detail Property" in html
    assert f'href="/en/projects/{project_slug}"' in html
    assert f'href="/en/property/{property_slug}"' in html
    assert 'href="/en/area-guide"' in html
    assert 'data-event="area_cta_click"' in html
    assert f"area={area_slug}" in html
    assert "Transport, lifestyle, and beach proximity" in html
    assert "Beach access within 10-15 minutes by car." in html


def test_a7_area_detail_source_less_metrics_show_pending(client) -> None:
    area_slug = f"a7-no-source-area-{uuid4()}"
    with SessionLocal() as db:
        area = Area(
            slug=area_slug,
            name="A7 No Source Area",
            status="published",
            summary={"en": "A7 no-source summary"},
            cover_image_url=_LOCAL_WEBP,
        )
        db.add(area)
        db.flush()
        db.add(
            AreaStatistic(
                area_id=area.id,
                avg_price_sqm=777777,
                avg_roi_percent=8.1,
                total_projects=45,
                total_units=9000,
                as_of_date=date(2026, 2, 25),
            )
        )
        db.commit()

    response = client.get(f"/en/areas/{area_slug}")
    assert response.status_code == 200, response.text
    html = response.text

    assert "Statistics are pending verified source note and update timestamp." in html
    assert "Publish source note and updated timestamp before showing hard metric claims." in html
    assert "TODO:" not in html
    assert "777,777" not in html
    assert "8.1%" not in html
    assert "No published projects are linked to this area yet." in html
    assert "No active properties are linked to this area yet." in html


def test_a7_area_listing_and_detail_keep_page_owned_cta_hierarchy(client) -> None:
    area_slug = f"a7-hierarchy-area-{uuid4()}"
    project_slug = f"a7-hierarchy-project-{uuid4()}"
    property_slug = f"a7-hierarchy-property-{uuid4()}"

    with SessionLocal() as db:
        area = Area(
            slug=area_slug,
            name="A7 Hierarchy Area",
            status="published",
            summary={"en": "A7 hierarchy summary"},
            source_note="Internal desk weekly update",
            map_center={"lat": 12.9345, "lng": 100.8821},
            cover_image_url=_LOCAL_WEBP,
            content={
                "en": {
                    "why_live_invest": "Balanced owner-occupier and rental demand.",
                    "transport": "Quick highway access.",
                    "lifestyle": "Nearby daily conveniences.",
                    "beach_proximity": "Beach access within 10-15 minutes by car.",
                    "metrics_update_cadence": "Monthly",
                }
            },
        )
        db.add(area)
        db.flush()
        db.add(
            AreaStatistic(
                area_id=area.id,
                avg_price_sqm=654321,
                avg_rent_monthly=32000,
                avg_roi_percent=6.8,
                total_projects=11,
                total_units=2500,
                as_of_date=date(2026, 2, 26),
            )
        )
        db.add(
            Project(
                slug=project_slug,
                name="A7 Hierarchy Project",
                status="published",
                area_id=area.id,
                property_type="condo",
                cover_image_url=_LOCAL_WEBP,
                summary={"en": "A7 hierarchy project summary"},
            )
        )
        db.add(
            Property(
                source_id=f"a7-hierarchy-source-{uuid4()}",
                slug=property_slug,
                title="A7 Hierarchy Property",
                type="resale",
                property_type="condo",
                status="active",
                price=4900000,
                address="A7 Hierarchy Address",
                city="Pattaya",
                area_id=area.id,
                cover_image_url=_LOCAL_WEBP,
                bedrooms=2,
                bathrooms=2,
                size_sqm=58,
            )
        )
        db.commit()

    listing_response = client.get("/en/areas")
    assert listing_response.status_code == 200, listing_response.text
    listing_html = listing_response.text
    assert 'id="area-guide-overview"' in listing_html
    assert 'id="area-guide-listing"' in listing_html
    assert listing_html.index('id="area-guide-overview"') < listing_html.index(
        'id="area-guide-listing"'
    )
    area_matches = re.findall(r'href="(/en/areas/[^"]+)"', listing_html)
    project_matches = re.findall(r'href="(/en/projects\?area=[^"]+)"', listing_html)
    consult_matches = re.findall(
        r'href="(/en/contact\?intent=consultation&area=[^"]+)"',
        listing_html,
    )
    assert area_matches
    assert project_matches
    assert consult_matches
    assert (
        listing_html.index(area_matches[0])
        < listing_html.index(project_matches[0])
        < listing_html.index(consult_matches[0])
    )
    assert "https://wa.me/" not in listing_html
    assert "https://line.me/" not in listing_html

    detail_response = client.get(f"/en/areas/{area_slug}")
    assert detail_response.status_code == 200, detail_response.text
    detail_html = detail_response.text
    detail_projects_href = "/en/projects"

    overview_index = detail_html.index('id="area-overview"')
    why_index = detail_html.index('id="area-why-live-invest"')
    stats_index = detail_html.index('id="area-stats"')
    featured_projects_index = detail_html.index('id="area-featured-projects"')
    featured_properties_index = detail_html.index('id="area-featured-properties"')
    proximity_index = detail_html.index('id="area-proximity"')
    cta_index = detail_html.index('id="area-cta"')
    consult_match = re.search(rf'/en/contact\?[^"]*area={area_slug}', detail_html)
    assert consult_match is not None
    consult_index = detail_html.index(consult_match.group(0))
    projects_index = detail_html.rindex(detail_projects_href)
    assert (
        overview_index
        < why_index
        < stats_index
        < featured_projects_index
        < featured_properties_index
        < proximity_index
        < cta_index
    )
    assert cta_index < consult_index < projects_index
    assert f"/en/projects/{project_slug}" in detail_html
    assert f"/en/property/{property_slug}" in detail_html
    assert "https://wa.me/" not in detail_html
    assert "https://line.me/" not in detail_html
