from __future__ import annotations

import re

import pytest

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_no_hotlink_counts,
    find_fallback_candidate,
    get_html,
    get_project_detail,
    get_projects_list,
    require_runtime_enabled,
)


def _pick_primary_slug() -> str:
    projects = get_projects_list()
    return str(projects[0]["slug"])


def _pick_multi_image_slug() -> str | None:
    for project in get_projects_list():
        slug = str(project.get("slug") or "").strip()
        if not slug:
            continue
        detail = get_project_detail(slug)
        images = detail.get("images") or []
        image_count = len(images) if isinstance(images, list) else 0
        if image_count >= 2:
            return slug
    return None


def test_detail_en_th_smoke_has_main() -> None:
    require_runtime_enabled()
    slug = _pick_primary_slug()
    en_html = get_html(f"/en/projects/{slug}/")
    th_html = get_html(f"/th/projects/{slug}/")

    assert_has_main(en_html, path=f"/en/projects/{slug}/")
    assert_has_main(th_html, path=f"/th/projects/{slug}/")


def test_detail_api_identity_reflects_in_public_html() -> None:
    require_runtime_enabled()
    slug = _pick_primary_slug()
    detail = get_project_detail(slug)
    project_name = str(detail.get("name") or "").strip()
    assert project_name, "Expected project name from API detail"

    en_html = get_html(f"/en/projects/{slug}/")
    th_html = get_html(f"/th/projects/{slug}/")
    assert project_name in en_html
    assert project_name in th_html


def test_detail_fallback_candidate_shell_and_placeholder() -> None:
    require_runtime_enabled()
    projects = get_projects_list()
    slug = find_fallback_candidate(projects)
    if not slug:
        pytest.skip("No deterministic low-media fallback candidate found in current dataset")

    html = get_html(f"/en/projects/{slug}/")
    assert_has_main(html, path=f"/en/projects/{slug}/")
    assert "/images/project-overview.png" in html


def test_detail_internal_links_safe_and_no_broken_tokens() -> None:
    require_runtime_enabled()
    slug = _pick_primary_slug()
    html = get_html(f"/en/projects/{slug}/")

    assert "/en/areas/undefined" not in html
    assert "/en/areas/null" not in html
    assert "/en/developers/undefined" not in html
    assert "/en/developers/null" not in html

    assert (
        re.search(r'/en/areas/[^"\s]+', html)
        or re.search(r'/en/developers/[^"\s]+', html)
    ), "Expected at least one safe internal entity link (area or developer)"


def test_detail_no_hotlink_guard_en_th() -> None:
    require_runtime_enabled()
    slug = _pick_primary_slug()
    en_html = get_html(f"/en/projects/{slug}/")
    th_html = get_html(f"/th/projects/{slug}/")

    en_direct, en_encoded = extract_no_hotlink_counts(en_html)
    th_direct, th_encoded = extract_no_hotlink_counts(th_html)

    assert (en_direct, en_encoded) == (0, 0)
    assert (th_direct, th_encoded) == (0, 0)


def test_detail_gallery_accessibility_hints_present() -> None:
    require_runtime_enabled()
    slug = _pick_multi_image_slug()
    if not slug:
        pytest.skip("No multi-image project available for deterministic gallery controls assertion")

    html = get_html(f"/en/projects/{slug}/")

    assert 'aria-label="Image gallery"' in html
    assert 'aria-label="Previous image"' in html
    assert 'aria-label="Next image"' in html