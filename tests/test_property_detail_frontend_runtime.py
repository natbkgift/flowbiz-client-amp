from __future__ import annotations

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_no_hotlink_counts,
    get_html,
    get_properties_list,
    require_runtime_enabled,
)


def _pick_property_slug() -> str:
    items = get_properties_list(limit=60, page=1)
    for item in items:
        slug = str(item.get("slug") or "").strip()
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


def test_property_detail_keeps_internal_navigation_blocks() -> None:
    require_runtime_enabled()
    slug = _pick_property_slug()
    html = get_html(f"/en/property/{slug}")

    assert "Next steps" in html
    has_buy_link = ('href="/en/buy"' in html) or ('href="/en/buy/"' in html)
    has_contact_link = ('href="/en/contact"' in html) or ('href="/en/contact/"' in html)
    assert has_buy_link
    assert has_contact_link


def test_property_detail_no_hotlink_guard_en_th() -> None:
    require_runtime_enabled()
    slug = _pick_property_slug()

    for path in [f"/en/property/{slug}", f"/th/property/{slug}"]:
        html = get_html(path)
        direct, encoded = extract_no_hotlink_counts(html)
        assert (direct, encoded) == (0, 0)
