from __future__ import annotations

import re
from urllib.parse import urlparse
from uuid import uuid4

from packages.core.database import SessionLocal
from packages.core.models import Area, Developer, Project, Property

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


def _seed_a5_fixture() -> dict[str, str]:
    with SessionLocal() as db:
        db.query(Property).filter(Property.source_id.like("a5-%")).delete(synchronize_session=False)
        db.query(Project).filter(Project.slug.like("a5-project-%")).delete(
            synchronize_session=False
        )
        db.query(Developer).filter(Developer.slug.like("a5-dev-%")).delete(
            synchronize_session=False
        )
        db.query(Area).filter(Area.slug.like("a5-area-%")).delete(synchronize_session=False)
        db.commit()

        area_1 = Area(
            slug=f"a5-area-1-{uuid4()}",
            name="ZZ A5 Central",
            city="Pattaya",
            status="published",
            summary={"en": "A5 area 1"},
            cover_image_url=_LOCAL_WEBP,
        )
        area_2 = Area(
            slug=f"a5-area-2-{uuid4()}",
            name="ZZ A5 Jomtien",
            city="Pattaya",
            status="published",
            summary={"en": "A5 area 2"},
            cover_image_url=_LOCAL_WEBP,
        )
        dev = Developer(
            slug=f"a5-dev-{uuid4()}",
            name="A5 Developer",
            status="active",
            cover_image_url=_LOCAL_WEBP,
        )
        db.add_all([area_1, area_2, dev])
        db.flush()

        project_1 = Project(
            slug=f"a5-project-1-{uuid4()}",
            name="A5 Project One",
            status="published",
            area_id=area_1.id,
            developer_id=dev.id,
            property_type="condo",
            starting_price=4500000,
            cover_image_url=_LOCAL_WEBP,
            summary={"en": "A5 project one summary"},
            investment_snapshot={
                "source": "Internal Desk",
                "updated_at": "2026-02-20",
                "gross_yield_percent": 6.2,
            },
        )
        project_2 = Project(
            slug=f"a5-project-2-{uuid4()}",
            name="A5 Project Two",
            status="published",
            area_id=area_2.id,
            developer_id=dev.id,
            property_type="condo",
            starting_price=3000000,
            cover_image_url=_LOCAL_WEBP,
            summary={"en": "A5 project two summary"},
        )
        db.add_all([project_1, project_2])
        db.flush()

        buy_high = Property(
            source_id=f"a5-buy-high-{uuid4()}",
            slug=f"a5-buy-high-{uuid4()}",
            title="A5 Buy High",
            title_i18n={"en": "A5 Buy High EN", "th": "A5 ซื้อสูง TH"},
            type="resale",
            property_type="condo",
            status="active",
            price=6200000,
            bedrooms=2,
            bathrooms=2,
            size_sqm=58,
            city="Pattaya",
            address="A5 Address 1",
            area_id=area_1.id,
            project_id=project_1.id,
            developer_id=dev.id,
            cover_image_url=_LOCAL_WEBP,
            features={"tags": ["sea view", "foreign quota"]},
        )
        buy_low = Property(
            source_id=f"a5-buy-low-{uuid4()}",
            slug=f"a5-buy-low-{uuid4()}",
            title="A5 Buy Low",
            title_i18n={"en": "A5 Buy Low EN"},
            type="new",
            property_type="condo",
            status="active",
            price=3200000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=35,
            city="Pattaya",
            address="A5 Address 2",
            area_id=area_2.id,
            project_id=project_2.id,
            developer_id=dev.id,
            cover_image_url=_LOCAL_WEBP,
        )
        rent_unit = Property(
            source_id=f"a5-rent-{uuid4()}",
            slug=f"a5-rent-{uuid4()}",
            title="A5 Rent Unit",
            type="rent",
            property_type="condo",
            status="active",
            price=28000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=33,
            city="Pattaya",
            address="A5 Address 3",
            area_id=area_1.id,
            project_id=project_1.id,
            developer_id=dev.id,
            cover_image_url=_LOCAL_WEBP,
        )
        hotlink_cover = Property(
            source_id=f"a5-hotlink-{uuid4()}",
            slug=f"a5-hotlink-{uuid4()}",
            title="A5 Hotlink Cover",
            type="resale",
            property_type="villa",
            status="active",
            price=12500000,
            bedrooms=3,
            bathrooms=3,
            size_sqm=220,
            city="Pattaya",
            address="A5 Address 4",
            area_id=area_1.id,
            project_id=project_1.id,
            developer_id=dev.id,
            cover_image_url="https://bad-cdn.example/hotlink.jpg",
            images=["https://bad-cdn.example/another.jpg"],
        )
        db.add_all([buy_high, buy_low, rent_unit, hotlink_cover])
        project_1_slug = project_1.slug
        db.commit()

    return {
        "project_1_slug": project_1_slug,
        "buy_high_title": "A5 Buy High EN",
        "buy_low_title": "A5 Buy Low EN",
        "rent_title": "A5 Rent Unit",
    }


def test_a5_listing_routes_exist_and_intent_copy(client) -> None:
    seeded = _seed_a5_fixture()
    checks = {
        "/en/buy": "Buy Listings",
        "/en/rent": "Rent Listings",
        "/en/investment": "Investment Listings",
        "/en/marketplace": "Marketplace Listings",
        "/th/buy": "รายการสำหรับซื้อ",
        "/th/rent": "รายการสำหรับเช่า",
        "/th/investment": "รายการเพื่อการลงทุน",
        "/th/marketplace": "รายการใน Marketplace",
    }
    for path, expected in checks.items():
        response = client.get(path)
        assert response.status_code == 200, response.text
        assert expected in response.text
        assert 'data-copy-pack-id="a5-listing-v1-2026-02-28"' in response.text
        assert 'id="listing-rule-note"' in response.text
    th_buy = client.get("/th/buy")
    assert "A5 Buy Low EN" in th_buy.text
    assert 'lang="th"' in th_buy.text
    assert seeded["rent_title"] not in th_buy.text

    investment = client.get("/en/investment")
    assert investment.status_code == 200, investment.text
    assert seeded["buy_high_title"] in investment.text
    assert seeded["buy_low_title"] not in investment.text
    assert seeded["rent_title"] not in investment.text


def test_a5_filter_sort_and_pagination(client) -> None:
    seeded = _seed_a5_fixture()
    filtered = client.get(
        f"/en/buy?project={seeded['project_1_slug']}&price_min=4000000&beds=2&baths=2&property_type=condo&sort=price_desc"
    )
    assert filtered.status_code == 200, filtered.text
    html = filtered.text
    assert seeded["buy_high_title"] in html
    assert seeded["buy_low_title"] not in html
    assert 'name="price_min"' in html
    assert 'name="price_max"' in html
    assert 'name="beds"' in html
    assert 'name="baths"' in html
    assert 'name="area"' in html
    assert 'name="project"' in html
    assert 'name="property_type"' in html
    assert 'name="sort"' in html

    page_1 = client.get("/en/marketplace?limit=1&page=1&sort=newest")
    assert page_1.status_code == 200, page_1.text
    assert 'id="pagination-next"' in page_1.text
    assert "page=2" in page_1.text

    page_2 = client.get("/en/marketplace?limit=1&page=2&sort=newest")
    assert page_2.status_code == 200, page_2.text
    assert 'id="pagination-prev"' in page_2.text
    assert "page=1" in page_2.text


def test_a5_card_cta_tracking_states_and_no_hotlink(client) -> None:
    _seed_a5_fixture()
    response = client.get("/en/marketplace?limit=12&sort=price_desc")
    assert response.status_code == 200, response.text
    html = response.text

    assert 'class="price">THB ' in html
    assert "listing-links" in html
    assert 'class="tag">' in html
    assert 'href="/en/contact?intent=consultation' in html
    assert 'href="/en/smart-finder?intent=' in html
    assert "listing_filter_change" in html
    assert "listing_sort_change" in html
    assert 'data-event="listing_card_click"' in html
    assert 'data-event="listing_cta_click"' in html
    assert "event_name:eventName" in html
    assert "source:sourceBody" in html
    assert "payload:payloadBody" in html

    assert 'id="listing-loading"' in html
    assert 'id="listing-skeleton"' in html
    assert 'id="listing-error-runtime"' in html
    assert ".filter-grid{display:grid;gap:12px;grid-template-columns:1fr}" in html
    large_grid_hook = (
        "@media (min-width:1920px){.listing-grid,.listing-skeleton-grid{"
        "grid-template-columns:repeat(4,minmax(0,1fr))}}"
    )
    assert large_grid_hook in html

    empty = client.get("/en/buy?price_min=999999999999")
    assert empty.status_code == 200, empty.text
    assert 'id="listing-empty"' in empty.text

    invalid = client.get("/en/buy?price_min=abc&page=0&sort=invalid&area=missing")
    assert invalid.status_code == 200, invalid.text
    assert "Some query parameters were invalid." in invalid.text
    assert "bad-cdn.example" not in html
    assert "A5 Hotlink Cover" not in html

    host = "testserver"
    for value in [
        *_extract_attrs(html, "src"),
        *_extract_attrs(html, "srcset"),
        *_extract_attrs(html, "poster"),
    ]:
        for candidate in [part.strip().split()[0] for part in value.split(",") if part.strip()]:
            assert _is_allowed_media(
                candidate,
                host=host,
            ), f"Disallowed media URL in A5 runtime HTML: {candidate}"
