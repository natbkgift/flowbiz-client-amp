from __future__ import annotations

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_no_hotlink_counts,
    get_html,
    require_runtime_enabled,
)


def test_property_listing_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    paths = [
        "/en/buy/",
        "/th/buy/",
        "/en/rent/",
        "/th/rent/",
        "/en/investment/",
        "/th/investment/",
        "/en/marketplace/",
        "/th/marketplace/",
    ]
    for path in paths:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_property_listing_query_ui_reflects_sort_and_price_inputs() -> None:
    require_runtime_enabled()
    html = get_html("/en/buy/?sort=price_desc&min_price=1000000&max_price=9000000")

    assert 'option value="price_desc" selected' in html
    assert 'value="1000000"' in html
    assert 'value="9000000"' in html


def test_property_listing_invalid_query_falls_back_safely() -> None:
    require_runtime_enabled()
    html = get_html("/en/rent/?sort=invalid&page=-2&beds=abc")
    assert_has_main(html, path="/en/rent/?sort=invalid&page=-2&beds=abc")
    assert 'option value="newest" selected' in html


def test_property_listing_filter_controls_and_reset_present_th() -> None:
    require_runtime_enabled()
    html = get_html("/th/buy/?search=sea&sort=price_asc")

    assert "ตัวกรอง" in html
    assert "ล้าง" in html
    assert "ใช้ตัวกรอง" in html


def test_property_listing_no_hotlink_guard_multi_routes() -> None:
    require_runtime_enabled()
    for path in ["/en/buy/", "/en/rent/", "/en/investment/", "/en/marketplace/"]:
        html = get_html(path)
        direct, encoded = extract_no_hotlink_counts(html)
        assert (direct, encoded) == (0, 0)
