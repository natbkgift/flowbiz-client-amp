#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${FLOWBIZ_PROD_BASE_URL:-https://amppattaya.com}"
OUTPUT_PATH="${FLOWBIZ_PROD_SMOKE_REPORT:-ops/deploy-smoke-report.json}"
EXPECTED_BUILD_SHA="${EXPECTED_BUILD_SHA:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) BASE_URL="$2"; shift 2 ;;
    --output) OUTPUT_PATH="$2"; shift 2 ;;
    --expected-build-sha) EXPECTED_BUILD_SHA="$2"; shift 2 ;;
    --history-mode) shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$(dirname "$OUTPUT_PATH")"

python3 - <<'PY' "$BASE_URL" "$OUTPUT_PATH" "$EXPECTED_BUILD_SHA"
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from html import unescape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

base_url = sys.argv[1].rstrip("/")
output_path = Path(sys.argv[2])
expected_build_sha = sys.argv[3]
checks: list[dict[str, object]] = []
failures: list[str] = []


def fetch(
    path: str,
    *,
    method: str = "GET",
    body: str | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, str, str]:
    url = urljoin(base_url + "/", path.lstrip("/"))
    curl_bin = shutil.which("curl") or shutil.which("curl.exe")
    request_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0 Safari/537.36",
        "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    }
    if headers:
        request_headers.update(headers)
    if curl_bin:
        marker = "__FLOWBIZ_STATUS__"
        command = [
            curl_bin,
            "--silent",
            "--show-error",
            "--location",
            "--write-out",
            f"\n{marker}:%{{http_code}}",
            "-A",
            request_headers["User-Agent"],
        ]
        for name, value in request_headers.items():
            if name == "User-Agent":
                continue
            command.extend(["-H", f"{name}: {value}"])
        if method.upper() != "GET":
            command.extend(["-X", method.upper()])
        if body is not None:
            command.extend(["--data-raw", body])
        command.append(url)
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        payload = completed.stdout or ""
        if marker in payload:
            body, _, status_text = payload.rpartition(f"\n{marker}:")
            try:
                status = int(status_text.strip())
            except ValueError:
                status = 0
            return status, body, url

    request = Request(
        url,
        method=method.upper(),
        headers=request_headers,
        data=body.encode("utf-8") if body is not None else None,
    )
    try:
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8", errors="replace")
            return int(response.status), body, url
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return int(exc.code), body, url
    except (URLError, TimeoutError, OSError):
        return 0, "", url


def record(name: str, ok: bool, detail: dict[str, object]) -> None:
    checks.append({"name": name, "ok": ok, **detail})
    if not ok:
        failures.append(name)


def has_no_blank_sections(html: str) -> bool:
    return re.search(r"<section\b[^>]*>\s*</section>", html, re.I) is None


def expect_status(
    path: str,
    expected: int,
    name: str,
    *,
    method: str = "GET",
    body: str | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, str, str]:
    status, body_text, url = fetch(path, method=method, body=body, headers=headers)
    record(
        name,
        status == expected,
        {"path": path, "url": url, "status": status, "expected": expected, "method": method.upper()},
    )
    return status, body_text, url


home_status, home_html, _ = expect_status("/en", 200, "route_home")
if home_status == 200:
    hero_primary_link = re.search(r'href="([^"]*source=home_hero_primary[^"]*)"', home_html, re.I)
    hero_secondary_link = re.search(r'href="([^"]*source=home_hero_secondary[^"]*)"', home_html, re.I)
    record(
        "home_cta_contract",
        bool(
            hero_primary_link
            and hero_secondary_link
            and "/en/projects" in hero_primary_link.group(1)
            and "/en/contact" in hero_secondary_link.group(1)
        ),
        {
            "projects_href": hero_primary_link.group(1) if hero_primary_link else None,
            "consultation_href": hero_secondary_link.group(1) if hero_secondary_link else None,
        },
    )
    record("home_non_blank_sections", has_no_blank_sections(home_html), {"path": "/en"})

shortlist_status, shortlist_html, _ = expect_status("/en/shortlist", 200, "route_shortlist")
if shortlist_status == 200:
    record(
        "shortlist_surface_contract",
        'shortlist-review-surface' in shortlist_html and 'Browse shortlist-ready listings' in shortlist_html,
        {"path": "/en/shortlist"},
    )
    record("shortlist_non_blank_sections", has_no_blank_sections(shortlist_html), {"path": "/en/shortlist"})

calc_status, calc_html, _ = expect_status("/en/buying-cost-estimator", 200, "route_buying_cost_estimator")
if calc_status == 200:
    contact_cta = re.search(r'href="([^"]*/en/contact[^"]*)"', calc_html, re.I)
    compare_cta = re.search(r'href="([^"]*/en/compare[^"]*)"', calc_html, re.I)
    record(
        "calculator_cta_contract",
        bool(contact_cta),
        {
            "compare_href": compare_cta.group(1) if compare_cta else None,
            "contact_href": contact_cta.group(1) if contact_cta else None,
        },
    )

projects_status, projects_html, _ = expect_status("/en/projects", 200, "route_projects")
project_detail_path = None
if projects_status == 200:
    record(
        "projects_inventory_cta",
        'Browse shortlist-ready listings' in projects_html and '/en/buy' in projects_html,
        {"path": "/en/projects"},
    )
    match = re.search(r'href="(/en/projects/[^"#?]+)"', projects_html, re.I)
    if match and match.group(1) != '/en/projects':
        project_detail_path = unescape(match.group(1))

if project_detail_path:
    project_status, project_html, _ = expect_status(project_detail_path, 200, "route_project_detail")
    if project_status == 200:
        record(
            "project_detail_contract",
            all(marker in project_html for marker in [
                'id="project_consultation_primary"',
                'id="project_compare_secondary"',
                'id="project-brief-section"',
                'id="project-decision-lens"',
                'id="project-related-reads"',
                'id="project-advisor-brief"',
            ]),
            {"path": project_detail_path},
        )
        record("project_detail_non_blank_sections", has_no_blank_sections(project_html), {"path": project_detail_path})
else:
    record("route_project_detail", False, {"path": None, "reason": "No project detail link discovered from /en/projects"})

version_status, version_body, _ = expect_status("/api/platform/version", 200, "api_platform_version")
build_sha = ""
if version_status == 200:
    try:
        version_payload = json.loads(version_body)
    except json.JSONDecodeError:
        version_payload = {}
    build_sha = str(version_payload.get("build_sha") or "")
    record(
        "api_platform_version_payload",
        bool(version_payload.get("ok")) and bool(build_sha),
        {"build_sha": build_sha, "deploy_status": version_payload.get("deploy_status")},
    )
    if expected_build_sha:
        record(
            "api_platform_version_expected_sha",
            build_sha.startswith(expected_build_sha) or expected_build_sha.startswith(build_sha),
            {"build_sha": build_sha, "expected_build_sha": expected_build_sha},
        )

events_status, events_body, _ = expect_status(
    "/api/v1/events",
    202,
    "api_v1_events",
    method="POST",
    headers={"Content-Type": "application/json"},
    body=json.dumps(
        {
            "event_name": "prod_smoke_event",
            "source": {"app": "prod-smoke", "page": "/en", "locale": "en"},
            "payload": {"placement": "prod_smoke"},
        }
    ),
)
if events_status == 202:
    try:
        events_payload = json.loads(events_body)
    except json.JSONDecodeError:
        events_payload = {}
    record(
        "api_v1_events_payload",
        bool(events_payload.get("ok")) and str(events_payload.get("endpoint") or "") == "/api/v1/events",
        {"endpoint": events_payload.get("endpoint"), "event_name": events_payload.get("event_name")},
    )

history_path = "/api/platform/deploy-history?limit=3"
history_status, history_body, history_url = fetch(history_path)
record(
    "api_platform_deploy_history",
    history_status == 200,
    {
        "path": history_path,
        "url": history_url,
        "status": history_status,
        "expected": 200,
    },
)
if history_status == 200:
    try:
        history_payload = json.loads(history_body)
    except json.JSONDecodeError:
        history_payload = {}
    record(
        "api_platform_deploy_history_payload",
        bool(history_payload.get("ok"))
        and isinstance(history_payload.get("items"), list)
        and isinstance(history_payload.get("count"), int),
        {
            "status": history_status,
            "count": history_payload.get("count"),
            "history_dir": history_payload.get("history_dir"),
        },
    )
else:
    record(
        "api_platform_deploy_history_payload",
        False,
        {"status": history_status},
    )

payload = {
    "base_url": base_url,
    "expected_build_sha": expected_build_sha or None,
    "ok": not failures,
    "failed_checks": failures,
    "checks": checks,
}
output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
raise SystemExit(0 if not failures else 1)
PY
