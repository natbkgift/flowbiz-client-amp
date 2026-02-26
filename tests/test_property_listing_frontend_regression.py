from __future__ import annotations

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_no_hotlink_counts,
    get_html,
    get_properties_list,
    find_structured_property_candidate,
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
    html = get_html("/en/buy/?sort=price_desc&min_price=1000000&max_price=9000000&beds=1&baths=1")

    assert 'option value="price_desc" selected' in html
    assert 'value="1000000"' in html
    assert 'value="9000000"' in html


def test_property_listing_invalid_query_falls_back_safely() -> None:
    require_runtime_enabled()
    html = get_html("/en/rent/?sort=invalid&page=-2&beds=abc&baths=abc")
    assert_has_main(html, path="/en/rent/?sort=invalid&page=-2&beds=abc&baths=abc")
    assert 'option value="newest" selected' in html


def test_property_listing_filter_controls_and_reset_present_th() -> None:
    require_runtime_enabled()
    html = get_html("/th/buy/?search=sea&sort=price_asc")

    assert "ตัวกรอง" in html
    assert "ล้าง" in html
    assert "ใช้ตัวกรอง" in html


def test_property_listing_route_intent_preset_integrity() -> None:
    require_runtime_enabled()
    buy_html = get_html("/en/buy/")
    rent_html = get_html("/en/rent/")
    investment_html = get_html("/en/investment/")
    marketplace_html = get_html("/en/marketplace/")

    assert "Installment Plans" in buy_html
    assert "How Renting Works in Pattaya" in rent_html
    assert "Curated Investment Opportunities" in investment_html
    assert "Property Marketplace Listings" in marketplace_html


def test_property_listing_pagination_preserves_query_state() -> None:
    require_runtime_enabled()
    html = get_html("/en/marketplace/?sort=price_desc&page=2")
    assert_has_main(html, path="/en/marketplace/?sort=price_desc&page=2")
    assert 'option value="price_desc" selected' in html


def test_property_listing_structured_card_fields_render() -> None:
    require_runtime_enabled()
    items = get_properties_list(limit=100, page=1)
    candidate = find_structured_property_candidate(items)
    if not candidate:
        raise AssertionError("Expected at least one property with structured fields in listing payload")

    query_title = str(candidate.get("title") or "").strip().split(" ")[0]
    assert query_title, "Expected candidate title token"
    html = get_html(f"/en/marketplace/?search={query_title}&sort=newest")

    has_fact_token = (
        ("Bedrooms" in html)
        or ("Bathrooms" in html)
        or ("m²" in html)
        or ("•" in html)
    )
    assert has_fact_token, "Expected structured fact/tag tokens on property cards"


def test_property_listing_clear_control_keeps_route_context() -> None:
    require_runtime_enabled()
    html = get_html("/en/rent/?search=condo&sort=price_asc&beds=1")
    assert "Clear" in html
    assert "How Renting Works in Pattaya" in html


def test_property_listing_no_hotlink_guard_multi_routes() -> None:
    require_runtime_enabled()
    for path in ["/en/buy/", "/th/buy/", "/en/rent/", "/th/rent/", "/en/investment/", "/th/investment/", "/en/marketplace/", "/th/marketplace/"]:
        html = get_html(path)
        direct, encoded = extract_no_hotlink_counts(html)
        assert (direct, encoded) == (0, 0)
