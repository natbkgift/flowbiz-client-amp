from __future__ import annotations

import pytest

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_links,
    extract_no_hotlink_counts,
    get_developer_detail,
    get_developers_list,
    get_html,
    pick_developer_with_website_slug,
    pick_developer_without_optional_profile_slug,
    pick_primary_developer_slug,
    require_runtime_enabled,
)


def _pick_developer_slug() -> str:
    developers = get_developers_list()
    slug = pick_primary_developer_slug(developers)
    if slug:
        return slug
    raise AssertionError("Expected at least one developer slug from /api/v1/developers/")


def test_developers_listing_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    for path in ["/en/developers/", "/th/developers/"]:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_developer_detail_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    slug = _pick_developer_slug()
    for path in [f"/en/developers/{slug}/", f"/th/developers/{slug}/"]:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_developer_identity_reflects_api_slug() -> None:
    require_runtime_enabled()
    slug = _pick_developer_slug()
    detail = get_developer_detail(slug)
    html = get_html(f"/en/developers/{slug}/")

    assert (detail.get("developer") or {}).get("slug") == slug
    assert f"/en/developers/{slug}" in html


def test_developer_internal_links_are_safe_and_contextual() -> None:
    require_runtime_enabled()
    slug = _pick_developer_slug()
    html = get_html(f"/en/developers/{slug}/")
    links = extract_links(html)

    forbidden = [
        "/projects/undefined", "/projects/null",
        "/areas/undefined", "/areas/null",
        "/property/undefined", "/property/null",
        "/developers/undefined", "/developers/null",
    ]
    for token in forbidden:
        assert token not in html

    assert any("/en/projects" in href for href in links)
    assert any("/en/contact" in href for href in links)


def test_developers_no_hotlink_guard_listing_and_detail() -> None:
    require_runtime_enabled()
    slug = _pick_developer_slug()
    paths = [
        "/en/developers/",
        "/th/developers/",
        f"/en/developers/{slug}/",
        f"/th/developers/{slug}/",
    ]

    for path in paths:
        html = get_html(path)
        direct, encoded = extract_no_hotlink_counts(html)
        assert (direct, encoded) == (0, 0)


def test_developer_fallback_rendering_for_missing_optional_fields() -> None:
    require_runtime_enabled()
    developers = get_developers_list()
    slug = pick_developer_without_optional_profile_slug(developers)
    if not slug:
        pytest.skip("No developer candidate with missing optional fields in current dataset")

    html = get_html(f"/en/developers/{slug}/")
    assert "TODO: add summary in developers entity" in html
    assert "Developer logo not available yet" in html


def test_developer_website_link_safety_when_available() -> None:
    require_runtime_enabled()
    developers = get_developers_list()
    slug = pick_developer_with_website_slug(developers)
    if not slug:
        pytest.skip("No developer with website in current dataset")

    html = get_html(f"/en/developers/{slug}/")
    assert "Developer Website" in html
    assert ('rel="noopener noreferrer"' in html) or ('rel=\"noopener noreferrer\"' in html)
    assert ('href="https://' in html) or ('href="http://' in html)
