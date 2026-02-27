from __future__ import annotations

import pytest

from tests._frontend_runtime_helpers import (
    assert_has_main,
    extract_no_hotlink_counts,
    get_html,
    get_json,
    require_runtime_enabled,
)


def _pick_two_project_ids() -> tuple[str, str]:
    payload = get_json("/api/v1/projects/?limit=120&page=1")
    projects = payload.get("data") if isinstance(payload, dict) else []
    if not isinstance(projects, list):
        projects = []
    ids: list[str] = []
    for project in projects:
        project_id = str(project.get("id") or "").strip()
        if not project_id or project_id in ids:
            continue
        ids.append(project_id)
        if len(ids) == 2:
            break
    if len(ids) < 2:
        pytest.skip("Runtime dataset has fewer than 2 projects; skipping compare-id-dependent checks.")
    return ids[0], ids[1]


def test_smartfinder_compare_routes_smoke_en_th_has_main() -> None:
    require_runtime_enabled()
    for path in [
        "/en/smart-finder/",
        "/th/smart-finder/",
        "/en/compare/",
        "/th/compare/",
    ]:
        html = get_html(path)
        assert_has_main(html, path=path)


def test_smartfinder_quota_step_has_submit_tracking_marker() -> None:
    require_runtime_enabled()
    path = (
        "/en/smart-finder/?step=quota&purpose=invest&budget=3-5m"
        "&timeline=3-6m&risk_tolerance=medium"
    )
    html = get_html(path)
    assert 'data-amp-event-type="smart_finder_submit"' in html


def test_smartfinder_results_has_cta_tracking_or_graceful_empty() -> None:
    require_runtime_enabled()
    path = (
        "/en/smart-finder/?step=results&purpose=invest&budget=3-5m"
        "&timeline=3-6m&risk_tolerance=medium&foreign_quota=unsure"
    )
    html = get_html(path)

    has_result_cta = 'data-amp-event-type="smart_finder_result_cta_click"' in html
    has_graceful_empty = "No projects found" in html or "Go to Projects" in html
    assert has_result_cta or has_graceful_empty


def test_compare_valid_ids_and_invalid_ids_fallback_states() -> None:
    require_runtime_enabled()
    id1, id2 = _pick_two_project_ids()

    html_valid = get_html(f"/en/compare/?ids={id1},{id2}")
    assert_has_main(html_valid, path=f"/en/compare/?ids={id1},{id2}")
    assert 'data-amp-event-type="compare_cta_click"' in html_valid

    html_invalid = get_html("/en/compare/?ids=__missing_a__,__missing_b__")
    assert_has_main(html_invalid, path="/en/compare/?ids=__missing_a__,__missing_b__")
    assert "Some projects not found" in html_invalid
    assert 'data-amp-event-type="compare_cta_click"' in html_invalid


def test_smartfinder_compare_no_hotlink_guard() -> None:
    require_runtime_enabled()
    id1, id2 = _pick_two_project_ids()

    paths = [
        "/en/smart-finder/",
        (
            "/en/smart-finder/?step=results&purpose=invest&budget=3-5m"
            "&timeline=3-6m&risk_tolerance=medium&foreign_quota=unsure"
        ),
        f"/en/compare/?ids={id1},{id2}",
        "/en/compare/?ids=__missing_a__,__missing_b__",
    ]

    for path in paths:
        html = get_html(path)
        direct, encoded = extract_no_hotlink_counts(html)
        assert (direct, encoded) == (0, 0)
