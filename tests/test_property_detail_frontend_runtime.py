from __future__ import annotations

import pytest

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_links,
    extract_no_hotlink_counts,
    get_html,
    get_property_detail,
    get_properties_list,
    pick_low_media_property_slug,
    pick_multi_image_property_slug,
    pick_primary_property_slug,
    pick_related_links_property_slug,
    pick_structured_property_slug,
    require_runtime_enabled,
)


def _pick_property_slug() -> str:
    items = get_properties_list(limit=60, page=1)
    slug = pick_primary_property_slug(items)
    if slug:
        return slug
    raise AssertionError("Expected at least one property slug in listing payload")


def test_property_detail_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    slug = _pick_property_slug()

    for path in [f"/en/property/{slug}", f"/th/property/{slug}"]:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_property_detail_has_core_cta_and_schema_blocks() -> None:
    require_runtime_enabled()
    slug = _pick_property_slug()
    html = get_html(f"/en/property/{slug}")

    assert "LINE Chat" in html
    assert "Interested in this property?" in html
    assert "RealEstateListing" in html
    assert '"@type":"Product"' in html


def test_property_detail_api_identity_reflects_canonical_slug() -> None:
    require_runtime_enabled()
    slug = _pick_property_slug()
    detail = get_property_detail(slug)
    html = get_html(f"/en/property/{slug}")

    assert detail.get("slug") == slug
    assert f'/en/property/{slug}' in html


def test_property_detail_structured_facts_guard_when_payload_has_fields() -> None:
    require_runtime_enabled()
    items = get_properties_list(limit=100, page=1)
    slug = pick_structured_property_slug(items)
    if not slug:
        raise AssertionError("Expected at least one structured property candidate")

    detail = get_property_detail(slug)
    html = get_html(f"/en/property/{slug}")

    checks: list[bool] = []
    if detail.get("bedrooms") is not None:
        checks.append("Bedrooms" in html)
    if detail.get("bathrooms") is not None:
        checks.append("Bathrooms" in html)
    if detail.get("size_sqm") is not None or detail.get("size") is not None:
        checks.append("Sqm" in html)
    if detail.get("view") or detail.get("view_label"):
        checks.append("View" in html)
    if detail.get("tags"):
        checks.append("Property tags" in html)

    assert checks and any(checks), "Expected at least one structured facts token rendered for structured payload"


def test_property_detail_fallback_media_candidate_renders_shell() -> None:
    require_runtime_enabled()
    items = get_properties_list(limit=100, page=1)
    slug = pick_low_media_property_slug(items)
    if not slug:
        pytest.skip("No low-media candidate in current dataset")

    html = get_html(f"/en/property/{slug}")
    assert_has_main(html, path=f"/en/property/{slug}")
    has_gallery_shell = ("gallery-main" in html) or ("No images available" in html)
    assert has_gallery_shell


def test_property_detail_keeps_internal_navigation_blocks() -> None:
    require_runtime_enabled()
    slug = _pick_property_slug()
    html = get_html(f"/en/property/{slug}")

    assert "Next steps" in html
    has_buy_link = ('href="/en/buy"' in html) or ('href="/en/buy/"' in html)
    has_contact_link = ('href="/en/contact"' in html) or ('href="/en/contact/"' in html)
    assert has_buy_link
    assert has_contact_link


def test_property_detail_internal_links_are_safe_and_contextual_when_related() -> None:
    require_runtime_enabled()
    items = get_properties_list(limit=100, page=1)
    slug = pick_related_links_property_slug(items) or _pick_property_slug()
    html = get_html(f"/en/property/{slug}")
    links = extract_links(html)

    forbidden = [
        "/projects/undefined", "/projects/null",
        "/areas/undefined", "/areas/null",
        "/developers/undefined", "/developers/null",
    ]
    for token in forbidden:
        assert token not in html

    detail = get_property_detail(slug)
    has_relation = bool(detail.get("project_id") or detail.get("area_id") or detail.get("developer_id"))
    safe_relation_link = any(
        ("/projects/" in href) or ("/areas/" in href) or ("/developers/" in href)
        for href in links
    )
    if has_relation:
        assert safe_relation_link


def test_property_detail_primary_cta_links_are_not_broken() -> None:
    require_runtime_enabled()
    slug = _pick_property_slug()
    html = get_html(f"/en/property/{slug}")

    assert "LINE Chat" in html
    assert "href=\"https://" in html or "href=\"http://" in html
    assert ('href="/en/contact"' in html) or ('href="/en/contact/"' in html)


def test_property_detail_no_hotlink_guard_en_th() -> None:
    require_runtime_enabled()
    slug = _pick_property_slug()

    for path in [f"/en/property/{slug}", f"/th/property/{slug}"]:
        html = get_html(path)
        direct, encoded = extract_no_hotlink_counts(html)
        assert (direct, encoded) == (0, 0)


def test_property_detail_gallery_controls_when_multi_image_candidate() -> None:
    require_runtime_enabled()
    items = get_properties_list(limit=100, page=1)
    slug = pick_multi_image_property_slug(items)
    if not slug:
        pytest.skip("No multi-image candidate in current dataset")

    html = get_html(f"/en/property/{slug}")
    assert "Image gallery" in html
    assert "Previous image" in html
    assert "Next image" in html
