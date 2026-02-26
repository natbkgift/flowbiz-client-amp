from __future__ import annotations

import re

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_no_hotlink_counts,
    find_fallback_candidate,
    get_html,
    get_project_detail,
    get_projects_list,
    html_contains_query_param_link,
    require_runtime_enabled,
)


def test_listing_en_th_smoke_has_main() -> None:
    require_runtime_enabled()
    en_html = get_html("/en/projects/")
    th_html = get_html("/th/projects/")
    assert_has_main(en_html, path="/en/projects/")
    assert_has_main(th_html, path="/th/projects/")


def test_listing_invalid_query_falls_back_safely() -> None:
    require_runtime_enabled()
    html = get_html("/en/projects/?sort=invalid&page=-9")
    assert_has_main(html, path="/en/projects/?sort=invalid&page=-9")
    assert 'option value="newest" selected' in html


def test_listing_query_ui_reflects_selected_controls() -> None:
    require_runtime_enabled()
    projects = get_projects_list()
    first_slug = str(projects[0]["slug"])
    detail = get_project_detail(first_slug)
    area_id = detail.get("area_id")
    developer_id = detail.get("developer_id")
    status = detail.get("status")

    assert area_id and developer_id and status, "Expected area_id/developer_id/status on selected project detail"

    html = get_html(
        f"/en/projects/?search=grand&sort=price-desc&area={area_id}&developer={developer_id}&status={status}&page=2"
    )

    assert 'option value="price-desc" selected' in html
    assert f'option value="{area_id}" selected' in html
    assert f'option value="{developer_id}" selected' in html
    assert f'option value="{status}" selected' in html


def test_listing_pagination_links_preserve_filters() -> None:
    require_runtime_enabled()
    html = get_html("/en/projects/?sort=price-asc&page=2")

    assert html_contains_query_param_link(html, key="sort", value="price-asc")


def test_listing_reset_controls_present() -> None:
    require_runtime_enabled()
    html = get_html("/th/projects/?search=a&sort=price-desc")
    assert "ล้างทั้งหมด" in html
    assert "ใช้ตัวกรอง" in html


def test_listing_no_hotlink_guard_en_th() -> None:
    require_runtime_enabled()
    en_html = get_html("/en/projects/")
    th_html = get_html("/th/projects/")

    en_direct, en_encoded = extract_no_hotlink_counts(en_html)
    th_direct, th_encoded = extract_no_hotlink_counts(th_html)

    assert (en_direct, en_encoded) == (0, 0)
    assert (th_direct, th_encoded) == (0, 0)