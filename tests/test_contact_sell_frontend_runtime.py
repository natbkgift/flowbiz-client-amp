from __future__ import annotations

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_links,
    extract_no_hotlink_counts,
    get_html,
    require_runtime_enabled,
)


def test_contact_sell_routes_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    paths = [
        "/en/contact/",
        "/th/contact/",
        "/en/sell/",
        "/th/sell/",
        "/en/sell/list-property/",
        "/th/sell/list-property/",
        "/en/sell/valuation/",
        "/th/sell/valuation/",
        "/en/about/",
        "/th/about/",
    ]
    for path in paths:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_contact_sell_no_hotlink_guard_en_th() -> None:
    require_runtime_enabled()
    for path in [
        "/en/contact/",
        "/th/contact/",
        "/en/sell/",
        "/th/sell/",
        "/en/sell/list-property/",
        "/th/sell/list-property/",
        "/en/sell/valuation/",
        "/th/sell/valuation/",
        "/en/about/",
        "/th/about/",
    ]:
        html = get_html(path)
        direct, encoded = extract_no_hotlink_counts(html)
        assert (direct, encoded) == (0, 0)


def test_contact_sell_cta_tracking_integrity() -> None:
    require_runtime_enabled()

    contact_html = get_html("/en/contact/")
    assert 'data-amp-event-type="cta_click"' in contact_html

    sell_html = get_html("/en/sell/")
    assert 'data-amp-event-type="cta_click"' in sell_html


def test_contact_sell_internal_links_safe() -> None:
    require_runtime_enabled()
    for path in ["/en/contact/", "/en/sell/", "/en/sell/list-property/", "/en/sell/valuation/", "/en/about/"]:
        html = get_html(path)
        links = extract_links(html)
        assert links, f"Expected links on {path}"
        forbidden = [
            '/contact/undefined', '/contact/null',
            '/sell/undefined', '/sell/null',
            '/sell/list-property/undefined', '/sell/list-property/null',
            '/sell/valuation/undefined', '/sell/valuation/null',
            '/about/undefined', '/about/null',
        ]
        for token in forbidden:
            assert token not in html
