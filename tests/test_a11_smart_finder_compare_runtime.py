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
    if value in {"'", '"'}:
        return True
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


def _seed_a11_fixture() -> dict[str, str]:
    with SessionLocal() as db:
        db.query(Property).filter(Property.source_id.like("a11-%")).delete(
            synchronize_session=False
        )
        db.query(Project).filter(Project.slug.like("a11-project-%")).delete(
            synchronize_session=False
        )
        db.query(Developer).filter(Developer.slug.like("a11-dev-%")).delete(
            synchronize_session=False
        )
        db.query(Area).filter(Area.slug.like("a11-area-%")).delete(synchronize_session=False)
        db.commit()

        area = Area(
            slug=f"a11-area-{uuid4()}",
            name="A11 Area",
            city="Pattaya",
            status="published",
            summary={"en": "A11 area summary"},
            cover_image_url=_LOCAL_WEBP,
        )
        dev = Developer(
            slug=f"a11-dev-{uuid4()}",
            name="A11 Developer",
            status="active",
            cover_image_url=_LOCAL_WEBP,
        )
        db.add_all([area, dev])
        db.flush()

        project = Project(
            slug=f"a11-project-{uuid4()}",
            name="A11 Project",
            status="published",
            area_id=area.id,
            developer_id=dev.id,
            property_type="condo",
            cover_image_url=_LOCAL_WEBP,
            summary={"en": "A11 project summary"},
        )
        db.add(project)
        db.flush()

        buy_property = Property(
            source_id=f"a11-buy-{uuid4()}",
            slug=f"a11-buy-{uuid4()}",
            title="A11 Buy Primary",
            title_i18n={"en": "A11 Buy Primary EN"},
            type="resale",
            property_type="condo",
            status="active",
            price=5600000,
            bedrooms=2,
            bathrooms=2,
            size_sqm=58,
            floor=23,
            city="Pattaya",
            address="A11 Buy Address",
            area_id=area.id,
            project_id=project.id,
            developer_id=dev.id,
            cover_image_url=_LOCAL_WEBP,
            features={"tags": ["sea view", "parking", "near beach"], "amenities": ["Pool"]},
            source_meta={"source": "Internal Desk", "rights_status": "licensed"},
        )
        rent_incomplete = Property(
            source_id=f"a11-rent-{uuid4()}",
            slug=f"a11-rent-{uuid4()}",
            title="A11 Rent Incomplete",
            type="rent",
            property_type="condo",
            status="active",
            price=28000,
            bedrooms=None,
            bathrooms=None,
            size_sqm=None,
            city="Pattaya",
            address="A11 Rent Address",
            area_id=area.id,
            project_id=project.id,
            developer_id=dev.id,
            cover_image_url="https://bad-cdn.example/a11-rent-hotlink.jpg",
            local_images=[_LOCAL_WEBP],
            source_meta={},
        )
        invest_property = Property(
            source_id=f"a11-invest-{uuid4()}",
            slug=f"a11-invest-{uuid4()}",
            title="A11 Invest Candidate",
            type="new",
            property_type="condo",
            status="active",
            price=8900000,
            bedrooms=1,
            bathrooms=1,
            size_sqm=44,
            city="Pattaya",
            address="A11 Invest Address",
            area_id=area.id,
            project_id=project.id,
            developer_id=dev.id,
            cover_image_url=_LOCAL_WEBP,
            features={"tags": ["furnished"]},
            source_meta={"source_domain": "flowbiz.com"},
        )
        db.add_all([buy_property, rent_incomplete, invest_property])
        buy_slug = str(buy_property.slug or "")
        rent_slug = str(rent_incomplete.slug or "")
        invest_slug = str(invest_property.slug or "")
        db.commit()

    return {
        "buy_slug": buy_slug,
        "rent_slug": rent_slug,
        "invest_slug": invest_slug,
    }


def test_a11_smart_finder_guided_steps_summary_fallback_and_tracking(client) -> None:
    _seed_a11_fixture()
    response = client.get("/en/smart-finder?intent=buy")
    assert response.status_code == 200, response.text
    html = response.text

    assert 'id="finder-stepper"' in html
    assert "Step 1: Budget" in html
    assert "Step 2: Purpose" in html
    assert "Step 3: Timeline" in html
    assert "Step 4: Preferences" in html
    assert 'id="finder-budget"' in html
    assert 'id="finder-timeline"' in html
    assert 'name="purpose"' in html
    assert 'name="preferences"' in html
    assert 'name="matching_mode"' in html
    assert "Weighted shortlist" in html
    assert "Strict match" in html
    assert "ownership fit" in html
    assert 'id="finder-back"' in html
    assert 'id="finder-next"' in html
    assert 'id="finder-submit"' in html
    assert 'id="finder-summary"' in html
    assert 'id="finder-results"' in html
    assert 'id="finder-empty"' in html
    assert 'id="finder-loading"' in html
    assert 'id="finder-error"' in html

    assert "finder_step_progress" in html
    assert "finder_shortlist_generated" in html
    assert "finder_no_matches" in html
    assert "matching_mode" in html
    assert "Match score" in html
    assert 'data-event="finder_consultation_cta_click"' in html
    assert 'data-event="finder_compare_cta_click"' in html

    assert "A11 Buy Primary EN" in html
    assert "bad-cdn.example" not in html

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
            ), f"Disallowed media URL in A11 Smart Finder runtime HTML: {candidate}"


def test_a11_compare_routes_render_table_mobile_collapse_and_tracking(client) -> None:
    seeded = _seed_a11_fixture()
    compare_response = client.get(f"/en/compare?ids={seeded['buy_slug']},{seeded['invest_slug']}")
    assert compare_response.status_code == 200, compare_response.text
    html = compare_response.text

    assert 'id="compare-table"' in html
    assert "Comparison table (desktop)" in html
    assert "Collapsed rows (mobile)" in html
    assert "compare-row-collapse" in html
    assert "position:sticky" in html
    assert 'id="compare-loading"' in html
    assert 'id="compare-error"' in html
    assert "compare_usage" in html
    assert 'data-event="compare_consultation_cta_click"' in html
    assert "/en/contact?intent=consultation&source=compare" in html
    assert "A11 Buy Primary EN" in html
    assert "A11 Invest Candidate" in html
    assert "bad-cdn.example" not in html

    th_response = client.get(f"/th/compare?ids={seeded['buy_slug']},{seeded['rent_slug']}")
    assert th_response.status_code == 200, th_response.text
    th_html = th_response.text
    assert 'lang="th"' in th_html
    assert "ตารางเปรียบเทียบ" in th_html
    assert "แถวแบบยุบได้" in th_html

    default_response = client.get("/compare")
    assert default_response.status_code == 200, default_response.text
    assert 'lang="en"' in default_response.text


def test_a11_compare_empty_and_incomplete_data_fallback(client) -> None:
    seeded = _seed_a11_fixture()

    empty_response = client.get("/en/compare?ids=missing-slug-1,missing-slug-2")
    assert empty_response.status_code == 200, empty_response.text
    empty_html = empty_response.text
    assert 'id="compare-empty"' in empty_html
    assert "Select at least 2 active listings" in empty_html
    assert "TODO:" not in empty_html

    incomplete_response = client.get(f"/en/compare?ids={seeded['buy_slug']},{seeded['rent_slug']}")
    assert incomplete_response.status_code == 200, incomplete_response.text
    incomplete_html = incomplete_response.text
    assert 'id="compare-table"' in incomplete_html
    assert "pending_review" in incomplete_html
    assert "flowbiz.com" in incomplete_html
    assert ">-<" in incomplete_html


def test_a11_smart_finder_and_compare_keep_page_owned_cta_hierarchy(client) -> None:
    seeded = _seed_a11_fixture()

    finder_response = client.get("/en/smart-finder?intent=buy")
    assert finder_response.status_code == 200, finder_response.text
    finder_html = finder_response.text

    assert 'id="finder-summary"' in finder_html
    assert 'id="finder-shortlist-cta"' in finder_html
    assert 'id="finder-compare-cta"' in finder_html
    assert 'id="finder-results"' in finder_html
    assert '/en/contact?intent=consultation&source=smart-finder' in finder_html
    assert 'data-event="finder_consultation_cta_click"' in finder_html
    assert 'data-event="finder_compare_cta_click"' in finder_html

    summary_index = finder_html.index('id="finder-summary"')
    consultation_index = finder_html.index('id="finder-shortlist-cta"')
    compare_index = finder_html.index('id="finder-compare-cta"')
    results_index = finder_html.index('id="finder-results"')
    assert summary_index < consultation_index < compare_index < results_index

    assert 'https://wa.me/' not in finder_html
    assert 'https://line.me/' not in finder_html

    compare_response = client.get(
        f"/en/compare?ids={seeded['buy_slug']},{seeded['invest_slug']}"
    )
    assert compare_response.status_code == 200, compare_response.text
    compare_html = compare_response.text

    assert 'id="compare_consultation_hero"' in compare_html
    assert 'id="compare_open_smart_finder"' in compare_html
    assert 'id="compare-table"' in compare_html
    assert 'id="compare_consultation_footer"' in compare_html
    assert 'id="compare_adjust_set"' in compare_html
    assert '/en/contact?intent=consultation&source=compare' in compare_html
    assert '/en/smart-finder' in compare_html

    hero_index = compare_html.index('id="compare_consultation_hero"')
    finder_index = compare_html.index('id="compare_open_smart_finder"')
    table_index = compare_html.index('id="compare-table"')
    footer_index = compare_html.index('id="compare_consultation_footer"')
    adjust_index = compare_html.index('id="compare_adjust_set"')
    assert hero_index < finder_index < table_index < footer_index < adjust_index

    assert 'https://wa.me/' not in compare_html
    assert 'https://line.me/' not in compare_html


def test_a11_keyboard_and_accessibility_baseline(client) -> None:
    _seed_a11_fixture()
    finder = client.get("/en/smart-finder")
    assert finder.status_code == 200, finder.text
    finder_html = finder.text

    assert ":focus-visible" in finder_html
    assert 'for="finder-budget"' in finder_html
    assert 'for="finder-timeline"' in finder_html
    assert "<legend>" in finder_html
    assert 'role="status" aria-live="polite"' in finder_html
    assert "<button" in finder_html

    compare = client.get("/en/compare")
    assert compare.status_code == 200, compare.text
    compare_html = compare.text
    assert ":focus-visible" in compare_html
    assert "<details" in compare_html
    assert "<summary>" in compare_html
    assert 'scope="row"' in compare_html
