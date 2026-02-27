from __future__ import annotations

import pytest

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_links,
    extract_no_hotlink_counts,
    get_blog_sitemap_slugs,
    get_guides_sitemap_slugs,
    get_html,
    pick_blog_slug_from_listing,
    pick_guide_slug_from_listing,
    require_runtime_enabled,
)


def _pick_blog_slug() -> str | None:
    slug = pick_blog_slug_from_listing("en")
    if slug:
        return slug
    sitemap = get_blog_sitemap_slugs()
    if sitemap:
        return sitemap[0]
    return None


def _pick_guide_slug() -> str | None:
    slug = pick_guide_slug_from_listing("en")
    if slug:
        return slug
    sitemap = get_guides_sitemap_slugs()
    if sitemap:
        return sitemap[0]
    return None


def test_content_listing_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    for path in ["/en/blog/", "/th/blog/", "/en/guides/", "/th/guides/"]:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_content_detail_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    blog_slug = _pick_blog_slug()
    guide_slug = _pick_guide_slug()
    if not blog_slug or not guide_slug:
        pytest.skip("No published blog/guide slugs available in current runtime dataset")

    for path in [
        f"/en/blog/{blog_slug}/",
        f"/th/blog/{blog_slug}/",
        f"/en/guides/{guide_slug}/",
        f"/th/guides/{guide_slug}/",
    ]:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_content_slug_identity_reflects_sitemap_source() -> None:
    require_runtime_enabled()
    blog_sitemap = get_blog_sitemap_slugs()
    guide_sitemap = get_guides_sitemap_slugs()
    if not blog_sitemap or not guide_sitemap:
        pytest.skip("Sitemap currently has no content slugs")

    blog_slug = blog_sitemap[0]
    guide_slug = guide_sitemap[0]

    blog_html = get_html(f"/en/blog/{blog_slug}/")
    guide_html = get_html(f"/en/guides/{guide_slug}/")

    assert f"/en/blog/{blog_slug}" in blog_html
    assert f"/en/guides/{guide_slug}" in guide_html


def test_content_fallback_shell_when_optional_fields_missing() -> None:
    require_runtime_enabled()
    blog_slug = _pick_blog_slug()
    guide_slug = _pick_guide_slug()
    if not blog_slug or not guide_slug:
        pytest.skip("No published blog/guide slugs available in current runtime dataset")

    blog_html = get_html(f"/en/blog/{blog_slug}/")
    assert_has_main(blog_html, path=f"/en/blog/{blog_slug}/")
    assert ("TODO: add complete body content" in blog_html) or ("article-body" in blog_html)

    guide_html = get_html(f"/en/guides/{guide_slug}/")
    assert_has_main(guide_html, path=f"/en/guides/{guide_slug}/")
    assert ("TODO: add checklist in guide entity" in guide_html) or ("bullet-list" in guide_html)


def test_content_internal_links_are_safe() -> None:
    require_runtime_enabled()
    blog_slug = _pick_blog_slug()
    guide_slug = _pick_guide_slug()
    if not blog_slug or not guide_slug:
        pytest.skip("No published blog/guide slugs available in current runtime dataset")

    for path in [f"/en/blog/{blog_slug}/", f"/en/guides/{guide_slug}/"]:
        html = get_html(path)
        links = extract_links(html)

        forbidden = [
            "/blog/undefined", "/blog/null",
            "/guides/undefined", "/guides/null",
            "/projects/undefined", "/projects/null",
            "/areas/undefined", "/areas/null",
            "/property/undefined", "/property/null",
        ]
        for token in forbidden:
            assert token not in html

        assert links, f"Expected links on {path}"


def test_content_no_hotlink_guard_listing_and_detail_en_th() -> None:
    require_runtime_enabled()
    blog_slug = _pick_blog_slug()
    guide_slug = _pick_guide_slug()
    if not blog_slug or not guide_slug:
        pytest.skip("No published blog/guide slugs available in current runtime dataset")

    paths = [
        "/en/blog/",
        "/th/blog/",
        f"/en/blog/{blog_slug}/",
        f"/th/blog/{blog_slug}/",
        "/en/guides/",
        "/th/guides/",
        f"/en/guides/{guide_slug}/",
        f"/th/guides/{guide_slug}/",
    ]

    for path in paths:
        html = get_html(path)
        direct, encoded = extract_no_hotlink_counts(html)
        assert (direct, encoded) == (0, 0)


def test_content_website_links_safety_when_present() -> None:
    require_runtime_enabled()
    blog_slug = _pick_blog_slug()
    if not blog_slug:
        pytest.skip("No published blog slugs available in current runtime dataset")
    html = get_html(f"/en/blog/{blog_slug}/")

    if "target=\"_blank\"" not in html:
        pytest.skip("No external links rendered in current blog detail")

    assert 'rel="noopener noreferrer"' in html
