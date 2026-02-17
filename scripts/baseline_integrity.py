from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import re
import subprocess
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import urllib.request
import urllib.error


REPO_ROOT = Path(__file__).resolve().parents[1]
BASELINE_ROOT = REPO_ROOT / "docs" / "phase_reports" / "baseline"


PRUNE_DIRS = {
    ".git",
    ".next",
    ".venv",
    "node_modules",
    "dist",
    "build",
    "out",
    "coverage",
    "__pycache__",
    "secret-notuptogithub",
}


def _walk_pruned(root: Path) -> Iterable[tuple[Path, list[str], list[str]]]:
    """os.walk wrapper that prunes heavy/recursive dirs and avoids WinError path issues."""

    for dirpath, dirnames, filenames in os.walk(str(root), topdown=True):
        # Prune in-place (topdown=True required)
        dirnames[:] = [d for d in dirnames if d not in PRUNE_DIRS]
        yield Path(dirpath), dirnames, filenames


def _find_files_named(root: Path, *, name_predicate) -> list[Path]:
    found: list[Path] = []
    for dirpath, _dirnames, filenames in _walk_pruned(root):
        for fn in filenames:
            if name_predicate(fn):
                found.append(dirpath / fn)
    return found


def _iter_files_with_suffixes(root: Path, suffixes: tuple[str, ...]) -> Iterable[Path]:
    for dirpath, _dirnames, filenames in _walk_pruned(root):
        for fn in filenames:
            if fn.endswith(suffixes):
                yield dirpath / fn


def _run(cmd: list[str], *, cwd: Path = REPO_ROOT) -> str:
    completed = subprocess.run(
        cmd,
        cwd=str(cwd),
        capture_output=True,
        text=True,
        check=False,
    )
    stdout = completed.stdout or ""
    stderr = completed.stderr or ""
    if completed.returncode != 0:
        raise RuntimeError(
            f"Command failed ({completed.returncode}): {' '.join(cmd)}\n{stderr.strip()}"
        )
    return stdout


def _utc_stamp() -> str:
    return _dt.datetime.now(tz=_dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _write_bytes(path: Path, data: bytes) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return _sha256_bytes(data)


def _http_get(url: str, *, timeout_s: int = 20, user_agent: str = "AMP-BaselineIntegrity/1.0") -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": user_agent})
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            body = resp.read()
            headers = {k.lower(): v for k, v in resp.headers.items()}
            return {
                "url": url,
                "status": getattr(resp, "status", None),
                "headers": headers,
                "body": body,
            }
    except urllib.error.HTTPError as e:
        body = e.read() if hasattr(e, "read") else b""
        headers = {k.lower(): v for k, v in (e.headers.items() if e.headers else [])}
        return {"url": url, "status": e.code, "headers": headers, "body": body, "error": str(e)}
    except Exception as e:
        return {"url": url, "status": None, "headers": {}, "body": b"", "error": str(e)}


def _ssh_run(host_alias: str, remote_cmd: str, *, timeout_s: int = 120) -> dict[str, Any]:
    """Run a command on VPS via SSH.

    Returns stdout/stderr/exit_code. Does not raise by default.
    """

    cmd = [
        "ssh",
        "-o",
        "BatchMode=yes",
        host_alias,
        remote_cmd,
    ]
    completed = subprocess.run(
        cmd,
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        timeout=timeout_s,
        check=False,
    )
    return {
        "cmd": " ".join(cmd[:-1]) + " <remote_cmd>",
        "exit_code": completed.returncode,
        "stdout": completed.stdout or "",
        "stderr": completed.stderr or "",
    }


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _write_json(path: Path, payload: Any) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8")
    path.write_bytes(encoded)
    return _sha256_bytes(encoded)


def _read_text_safe(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")


def _rel(p: Path) -> str:
    try:
        return p.relative_to(REPO_ROOT).as_posix()
    except Exception:
        return p.as_posix()


def git_state() -> dict[str, Any]:
    head = _run(["git", "rev-parse", "HEAD"]).strip()
    branch = _run(["git", "rev-parse", "--abbrev-ref", "HEAD"]).strip()

    status_porcelain = _run(["git", "status", "--porcelain=v1"]).splitlines()
    diff_name_status = _run(["git", "diff", "--name-status", "origin/main...HEAD"]).splitlines()
    diff_stat = _run(["git", "diff", "--stat", "origin/main...HEAD"]).splitlines()

    return {
        "head": head,
        "branch": branch,
        "status_porcelain": status_porcelain,
        "diff_name_status_origin_main": diff_name_status,
        "diff_stat_origin_main": diff_stat,
    }


@dataclass(frozen=True)
class Route:
    surface: str
    method: str
    path: str
    source: str


def _is_next_special_segment(seg: str) -> bool:
    return (seg.startswith("(") and seg.endswith(")")) or seg.startswith("@")


def _next_app_route_from_file(app_dir: Path, file_path: Path) -> str:
    rel = file_path.relative_to(app_dir).as_posix()
    parts = rel.split("/")
    parts = parts[:-1]  # drop file name

    clean: list[str] = []
    for seg in parts:
        if seg in {"_components", "components"}:
            continue
        if _is_next_special_segment(seg):
            continue
        clean.append(seg)

    route = "/" + "/".join(clean)
    route = route.replace("/index", "")
    route = route.replace("//", "/")
    return "/" if route in {"", "//"} else route


def next_routes() -> list[Route]:
    routes: list[Route] = []

    for cfg in _find_files_named(REPO_ROOT, name_predicate=lambda n: n.startswith("next.config.")):
        next_root = cfg.parent
        app_dir = next_root / "app"
        pages_dir = next_root / "pages"

        if app_dir.is_dir():
            for file_path in app_dir.rglob("*"):
                if not file_path.is_file():
                    continue
                if file_path.name not in {"page.tsx", "page.jsx", "route.ts", "route.js"}:
                    continue

                route_path = _next_app_route_from_file(app_dir, file_path)
                method = "GET" if file_path.name.startswith("page") else "*"
                routes.append(
                    Route(
                        surface=f"next:{_rel(next_root)}",
                        method=method,
                        path=route_path,
                        source=_rel(file_path),
                    )
                )

        # Legacy pages/ router (best-effort)
        if pages_dir.is_dir():
            for file_path in list(pages_dir.rglob("*.js")) + list(pages_dir.rglob("*.jsx")):
                rel = file_path.relative_to(pages_dir).as_posix()
                if rel.startswith("api/"):
                    continue
                route_path = "/" + rel
                for ext in [".js", ".jsx", ".ts", ".tsx"]:
                    if route_path.endswith(ext):
                        route_path = route_path[: -len(ext)]
                route_path = route_path.replace("/index", "")
                routes.append(
                    Route(
                        surface=f"next:{_rel(next_root)}",
                        method="GET",
                        path=route_path or "/",
                        source=_rel(file_path),
                    )
                )
            for file_path in list(pages_dir.rglob("*.ts")) + list(pages_dir.rglob("*.tsx")):
                rel = file_path.relative_to(pages_dir).as_posix()
                if rel.startswith("api/"):
                    continue
                route_path = "/" + rel
                for ext in [".js", ".jsx", ".ts", ".tsx"]:
                    if route_path.endswith(ext):
                        route_path = route_path[: -len(ext)]
                route_path = route_path.replace("/index", "")
                routes.append(
                    Route(
                        surface=f"next:{_rel(next_root)}",
                        method="GET",
                        path=route_path or "/",
                        source=_rel(file_path),
                    )
                )

    uniq = {(r.surface, r.method, r.path, r.source): r for r in routes}
    return sorted(uniq.values(), key=lambda r: (r.surface, r.path, r.method, r.source))


FASTAPI_DECORATOR = re.compile(
    r"@\s*(?P<obj>router|app)\.(?P<method>get|post|put|delete|patch|options|head)\(\s*[\"'](?P<path>[^\"']+)[\"']",
    re.IGNORECASE,
)


def api_routes_fastapi() -> list[Route]:
    routes: list[Route] = []
    for base in [REPO_ROOT / "apps", REPO_ROOT / "src"]:
        if not base.exists():
            continue
        for py in base.rglob("*.py"):
            text = _read_text_safe(py)
            for match in FASTAPI_DECORATOR.finditer(text):
                routes.append(
                    Route(
                        surface="api:fastapi",
                        method=match.group("method").upper(),
                        path=match.group("path"),
                        source=_rel(py),
                    )
                )
    uniq = {(r.method, r.path, r.source): r for r in routes}
    return sorted(uniq.values(), key=lambda r: (r.path, r.method, r.source))


def db_schema_snapshot() -> dict[str, Any]:
    versions = REPO_ROOT / "alembic" / "versions"
    revisions: list[dict[str, Any]] = []
    if versions.is_dir():
        rev_re = re.compile(r"^revision\s*=\s*[\"']([^\"']+)[\"']", re.MULTILINE)
        down_re = re.compile(r"^down_revision\s*=\s*(.+)$", re.MULTILINE)
        for f in sorted(versions.glob("*.py")):
            text = _read_text_safe(f)
            rev = rev_re.search(text)
            down = down_re.search(text)
            revisions.append(
                {
                    "file": _rel(f),
                    "revision": rev.group(1) if rev else None,
                    "down_revision_raw": down.group(1).strip() if down else None,
                    "sha256": _sha256_bytes(text.encode("utf-8")),
                }
            )
    return {
        "alembic_ini_present": (REPO_ROOT / "alembic.ini").exists(),
        "alembic_versions_dir": _rel(versions) if versions.exists() else None,
        "revisions": revisions,
    }


META_TITLE = re.compile(r"<title>(?P<title>.*?)</title>", re.IGNORECASE | re.DOTALL)
META_NAME = re.compile(
    r"<meta\s+[^>]*name=[\"'](?P<name>[^\"']+)[\"'][^>]*content=[\"'](?P<content>[^\"']*)[\"'][^>]*>",
    re.IGNORECASE,
)
META_PROPERTY = re.compile(
    r"<meta\s+[^>]*property=[\"'](?P<property>[^\"']+)[\"'][^>]*content=[\"'](?P<content>[^\"']*)[\"'][^>]*>",
    re.IGNORECASE,
)
LINK_REL = re.compile(
    r"<link\s+[^>]*rel=[\"'](?P<rel>[^\"']+)[\"'][^>]*href=[\"'](?P<href>[^\"']*)[\"'][^>]*>",
    re.IGNORECASE,
)
JSON_LD = re.compile(
    r"<script\s+[^>]*type=[\"']application/ld\+json[\"'][^>]*>(?P<json>.*?)</script>",
    re.IGNORECASE | re.DOTALL,
)


def _extract_html_meta(html: str) -> dict[str, Any]:
    title_m = META_TITLE.search(html)
    meta_name = {m.group("name").lower(): m.group("content") for m in META_NAME.finditer(html)}
    meta_prop = {m.group("property").lower(): m.group("content") for m in META_PROPERTY.finditer(html)}
    links = {m.group("rel").lower(): m.group("href") for m in LINK_REL.finditer(html)}
    json_ld_payloads = [m.group("json").strip() for m in JSON_LD.finditer(html)]
    return {
        "title": title_m.group("title").strip() if title_m else None,
        "meta_name": meta_name,
        "meta_property": meta_prop,
        "links": links,
        "json_ld_sha256": [_sha256_bytes(p.encode("utf-8")) for p in json_ld_payloads],
        "json_ld_count": len(json_ld_payloads),
    }


def seo_and_structured_data_snapshot() -> dict[str, Any]:
    html_files: list[Path] = []
    for base in [REPO_ROOT / "demo-website", REPO_ROOT / "coming-soon"]:
        if base.exists():
            html_files.extend(sorted(base.rglob("*.html")))

    seo: dict[str, Any] = {"html": {}, "next_metadata_exports": []}
    structured: dict[str, Any] = {"html_json_ld": {}}

    for f in html_files:
        html = _read_text_safe(f)
        extracted = _extract_html_meta(html)
        seo["html"][_rel(f)] = {
            "title": extracted["title"],
            "description": extracted["meta_name"].get("description"),
            "robots": extracted["meta_name"].get("robots"),
            "canonical": extracted["links"].get("canonical"),
            "og_title": extracted["meta_property"].get("og:title"),
            "og_description": extracted["meta_property"].get("og:description"),
            "og_url": extracted["meta_property"].get("og:url"),
            "twitter_card": extracted["meta_name"].get("twitter:card"),
        }
        structured["html_json_ld"][_rel(f)] = {
            "count": extracted["json_ld_count"],
            "sha256": extracted["json_ld_sha256"],
        }

    for ts in _iter_files_with_suffixes(REPO_ROOT, (".ts", ".tsx")):
        text = _read_text_safe(ts)
        if re.search(r"\bexport\s+const\s+metadata\b", text):
            seo["next_metadata_exports"].append(_rel(ts))

    seo["next_metadata_exports"] = sorted(set(seo["next_metadata_exports"]))
    return {"seo": seo, "structured": structured}


def crm_payload_snapshot(api_routes: list[Route]) -> dict[str, Any]:
    crm_paths = [r for r in api_routes if re.search(r"crm|lead|webhook", r.path, re.IGNORECASE)]
    model_mentions: dict[str, list[str]] = {}

    for base in [REPO_ROOT / "apps", REPO_ROOT / "src"]:
        if not base.exists():
            continue
        for py in base.rglob("*.py"):
            text = _read_text_safe(py)
            hits = sorted(set(re.findall(r"\b(Lead|CRM|Webhook|Contact|Inquiry)\w*\b", text)))
            if hits:
                model_mentions[_rel(py)] = hits

    return {
        "crm_like_endpoints": [r.__dict__ for r in crm_paths],
        "model_mentions": model_mentions,
    }


def cache_key_map() -> dict[str, Any]:
    patterns = [
        re.compile(r"\bredis\b", re.IGNORECASE),
        re.compile(r"\bcache\b", re.IGNORECASE),
        re.compile(r"cache[-_ ]key", re.IGNORECASE),
        re.compile(r"\bttl\b", re.IGNORECASE),
        re.compile(r"Cache-Control", re.IGNORECASE),
    ]
    matches: dict[str, list[str]] = {}
    for path in _iter_files_with_suffixes(REPO_ROOT, (".py", ".ts", ".tsx")):
        text = _read_text_safe(path)
        found: set[str] = set()
        for pat in patterns:
            if pat.search(text):
                found.add(pat.pattern)
        if found:
            matches[_rel(path)] = sorted(found)
    return {"files": matches}


def regression_surface_map(*, routes: list[Route], api_routes: list[Route], db: dict[str, Any]) -> dict[str, Any]:
    return {
        "web_route_count": len([r for r in routes if r.method == "GET"]),
        "api_endpoint_count": len(api_routes),
        "alembic_revision_count": len(db.get("revisions", [])),
        "next_roots": sorted({r.surface for r in routes if r.surface.startswith("next:")}),
        "api_sources": sorted({r.source for r in api_routes}),
    }


def observability_readiness_snapshot() -> dict[str, Any]:
    """Repo-only best-effort: detect presence of common observability integrations.

    This does NOT validate runtime pipelines, alerts, or dashboards.
    """

    keywords = [
        "opentelemetry",
        "otel",
        "sentry",
        "datadog",
        "newrelic",
        "prometheus",
        "statsd",
        "pino",
        "winston",
        "structlog",
        "loguru",
    ]
    rx = re.compile(r"(" + "|".join(re.escape(k) for k in keywords) + r")", re.IGNORECASE)

    hits: dict[str, list[str]] = {}
    for path in _iter_files_with_suffixes(REPO_ROOT, (".py", ".ts", ".tsx", ".js", ".jsx")):
        text = _read_text_safe(path)
        found = sorted({m.group(1).lower() for m in rx.finditer(text)})
        if found:
            hits[_rel(path)] = found

    # Contract presence (docs) is a gate too.
    contract_docs = {
        "metrics_contract": (REPO_ROOT / "docs" / "governance" / "metrics.yaml").exists(),
        "observability_contract": (REPO_ROOT / "docs" / "governance" / "observability.md").exists(),
    }

    return {
        "repo_detection_only": True,
        "contracts_present": contract_docs,
        "integration_keyword_hits": hits,
        "runtime_validation": {
            "logs": "unknown",
            "traces": "unknown",
            "metrics_pipeline": "unknown",
            "alerts": "unknown",
            "dashboards": "unknown",
            "gate_pass": False,
        },
    }


def metric_baseline_state_snapshot() -> dict[str, Any]:
    """Repo-only placeholder: runtime baselines require staging/prod telemetry."""

    metrics_path = REPO_ROOT / "docs" / "governance" / "metrics.yaml"
    metrics_contract_sha = None
    if metrics_path.exists():
        metrics_contract_sha = _sha256_bytes(metrics_path.read_bytes())

    return {
        "repo_detection_only": True,
        "metrics_contract_sha256": metrics_contract_sha,
        "baseline_window_days": 14,
        "runtime_baseline": "unavailable_in_repo_context",
        "gate_pass": False,
    }


def _md_table(rows: Iterable[tuple[str, str]]) -> str:
    out = ["| Artifact | SHA256 |", "|---|---|"]
    for name, h in rows:
        out.append(f"| {name} | `{h}` |")
    return "\n".join(out)


def write_markdown_report(*, hashes: dict[str, str], git: dict[str, Any], regression: dict[str, Any]) -> None:
    report_path = BASELINE_ROOT / "BASELINE_INTEGRITY_REPORT.md"
    lines: list[str] = []
    lines.append("# BASELINE INTEGRITY REPORT")
    lines.append("")
    lines.append("## Git")
    lines.append(f"- head: `{git['head']}`")
    lines.append(f"- branch: `{git['branch']}`")
    lines.append(f"- status_porcelain_lines: `{len(git['status_porcelain'])}`")
    lines.append(f"- diff_vs_origin_main_lines: `{len(git['diff_name_status_origin_main'])}`")
    lines.append("")
    lines.append("## Snapshot Hashes")
    lines.append(_md_table(sorted(hashes.items())))
    lines.append("")
    lines.append("## Regression Surface")
    for k, v in sorted(regression.items()):
        lines.append(f"- {k}: `{v}`")
    lines.append("")
    lines.append("## Notes")
    lines.append("- This report is generated by scripts/baseline_integrity.py")
    lines.append("")
    report_path.write_text("\n".join(lines), encoding="utf-8")


def _openapi_to_routes(openapi: dict[str, Any]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    paths = openapi.get("paths") or {}
    for path, ops in paths.items():
        if not isinstance(ops, dict):
            continue
        for method, spec in ops.items():
            if method.lower() not in {"get", "post", "put", "delete", "patch", "options", "head"}:
                continue
            tags = spec.get("tags") if isinstance(spec, dict) else None
            out.append({"method": method.upper(), "path": path, "tags": ",".join(tags) if tags else ""})
    out.sort(key=lambda r: (r["path"], r["method"], r.get("tags") or ""))
    return out


def live_vps_snapshots(*, host_alias: str, deploy_path: str) -> dict[str, Any]:
    """Collect live snapshots from VPS (api openapi, db schema-only dump, compose ps, metrics probe)."""

    base_cmd = f"set -e; cd {deploy_path}"

    ps = _ssh_run(host_alias, base_cmd + "; docker compose -f docker-compose.yml -f docker-compose.prod.yml ps")

    openapi = _ssh_run(
        host_alias,
        base_cmd
        + "; curl -sS http://127.0.0.1:8001/openapi.json",
        timeout_s=120,
    )

    metrics = _ssh_run(
        host_alias,
        base_cmd
        + "; curl -sS -i http://127.0.0.1:8001/metrics | sed -n '1,20p'",
        timeout_s=60,
    )

    db_schema = _ssh_run(
        host_alias,
        base_cmd
        + "; DB=postgres; DB_NAME=$(docker compose exec -T $DB printenv POSTGRES_DB); "
        + "DB_USER=$(docker compose exec -T $DB printenv POSTGRES_USER); "
        + "docker compose exec -T $DB pg_dump -U $DB_USER --schema-only $DB_NAME",
        timeout_s=180,
    )

    obs_ready = _ssh_run(
        host_alias,
        base_cmd
        + "; "
        + "echo 'alertmanager_ready='; docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T alertmanager wget -qO- http://localhost:9093/-/ready || true; echo; "
        + "echo 'prometheus_ready='; docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T prometheus wget -qO- http://localhost:9090/-/ready || true; echo; "
        + "echo 'grafana_health='; curl -sS http://127.0.0.1:9001/api/health || true; echo",
        timeout_s=120,
    )

    return {
        "compose_ps": ps,
        "api_openapi": openapi,
        "api_metrics_probe": metrics,
        "db_schema_dump": db_schema,
        "observability_ready_probe": obs_ready,
    }


def live_public_seo_snapshots(*, base_url: str, paths: list[str]) -> dict[str, Any]:
    out: dict[str, Any] = {"base_url": base_url, "pages": {}}
    for p in paths:
        url = base_url.rstrip("/") + (p if p.startswith("/") else "/" + p)
        resp = _http_get(url)
        body = resp.pop("body")
        html = body.decode("utf-8", errors="replace")
        extracted = _extract_html_meta(html)
        out["pages"][p] = {
            "http": {k: v for k, v in resp.items() if k != "error"},
            "http_error": resp.get("error"),
            "meta": extracted,
            "cache_headers": {
                "cache-control": resp.get("headers", {}).get("cache-control"),
                "etag": resp.get("headers", {}).get("etag"),
                "vary": resp.get("headers", {}).get("vary"),
                "last-modified": resp.get("headers", {}).get("last-modified"),
            },
            "body_sha256": _sha256_bytes(body),
        }
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="AMP Baseline Integrity Engine (repo + optional live snapshots)")
    parser.add_argument("--out", default=None, help="Output directory (default: docs/phase_reports/baseline/<timestamp>)")
    parser.add_argument("--vps", default=None, help="SSH host alias for VPS, e.g. flowbiz-vps")
    parser.add_argument("--vps-path", default="/opt/flowbiz/clients/flowbiz-client-amp", help="Deploy path on VPS")
    parser.add_argument("--public-base", default="https://amppattaya.com", help="Public base URL")
    args = parser.parse_args()

    run_dir = Path(args.out) if args.out else (BASELINE_ROOT / _utc_stamp())
    run_dir.mkdir(parents=True, exist_ok=True)
    (BASELINE_ROOT / "LATEST.txt").write_text(run_dir.name, encoding="utf-8")

    git = git_state()
    git_hash = _write_json(run_dir / "git_state.json", git)

    web_routes = next_routes()
    routes_hash = _write_json(run_dir / "route_signature.json", [r.__dict__ for r in web_routes])

    api_repo = api_routes_fastapi()
    api_repo_hash = _write_json(run_dir / "api_contract_snapshot_repo.json", [r.__dict__ for r in api_repo])

    db_repo = db_schema_snapshot()
    db_repo_hash = _write_json(run_dir / "db_schema_snapshot_repo.json", db_repo)

    seo_struct_repo = seo_and_structured_data_snapshot()
    seo_repo_hash = _write_json(run_dir / "seo_metadata_snapshot_repo.json", seo_struct_repo["seo"])
    structured_repo_hash = _write_json(run_dir / "structured_data_snapshot_repo.json", seo_struct_repo["structured"])

    crm_repo = crm_payload_snapshot(api_repo)
    crm_repo_hash = _write_json(run_dir / "crm_payload_snapshot_repo.json", crm_repo)

    cache_repo = cache_key_map()
    cache_repo_hash = _write_json(run_dir / "cache_key_map_repo.json", cache_repo)

    observability_repo = observability_readiness_snapshot()
    observability_repo_hash = _write_json(run_dir / "observability_readiness_repo.json", observability_repo)

    metric_baseline_repo = metric_baseline_state_snapshot()
    metric_baseline_repo_hash = _write_json(run_dir / "metric_baseline_state_repo.json", metric_baseline_repo)

    live_hashes: dict[str, str] = {}
    live_regression_overrides: dict[str, Any] = {}

    if args.vps:
        live = live_vps_snapshots(host_alias=args.vps, deploy_path=args.vps_path)
        live_hashes["vps_compose_ps.json"] = _write_json(run_dir / "vps_compose_ps.json", live["compose_ps"])

        openapi_raw = live["api_openapi"]
        live_hashes["vps_api_openapi_raw.json"] = _write_json(run_dir / "vps_api_openapi_raw.json", openapi_raw)
        if openapi_raw.get("exit_code") == 0 and openapi_raw.get("stdout"):
            try:
                openapi = json.loads(openapi_raw["stdout"])
                live_hashes["api_openapi_live.json"] = _write_json(run_dir / "api_openapi_live.json", openapi)
                live_routes = _openapi_to_routes(openapi)
                live_hashes["api_contract_snapshot_live.json"] = _write_json(
                    run_dir / "api_contract_snapshot_live.json", live_routes
                )
                live_regression_overrides["api_endpoint_count_live"] = len(live_routes)
            except Exception as e:
                live_hashes["api_openapi_live_parse_error.json"] = _write_json(
                    run_dir / "api_openapi_live_parse_error.json", {"error": str(e)}
                )

        live_hashes["vps_api_metrics_probe.json"] = _write_json(
            run_dir / "vps_api_metrics_probe.json", live["api_metrics_probe"]
        )

        db_dump = live["db_schema_dump"]
        live_hashes["vps_db_schema_dump_raw.json"] = _write_json(run_dir / "vps_db_schema_dump_raw.json", db_dump)
        if db_dump.get("exit_code") == 0 and db_dump.get("stdout"):
            live_hashes["db_schema_dump.sql"] = _write_bytes(
                run_dir / "db_schema_dump.sql", db_dump["stdout"].encode("utf-8")
            )

        live_hashes["vps_observability_ready_probe.json"] = _write_json(
            run_dir / "vps_observability_ready_probe.json", live["observability_ready_probe"]
        )

    # Public SEO + structured data snapshot (from live HTML)
    # Choose a minimal, stable set of paths: home plus up to 5 static Next routes.
    static_paths: list[str] = ["/"]
    for r in web_routes:
        if r.method != "GET":
            continue
        if "[" in r.path or "]" in r.path:
            continue
        if r.path.startswith("/admin"):
            continue
        if r.path not in static_paths:
            static_paths.append(r.path)
        if len(static_paths) >= 6:
            break

    public = live_public_seo_snapshots(base_url=args.public_base, paths=static_paths)
    public_hash = _write_json(run_dir / "seo_metadata_snapshot_public.json", public)
    structured_public = {
        "pages": {
            p: {
                "json_ld_count": v.get("meta", {}).get("json_ld_count"),
                "json_ld_sha256": v.get("meta", {}).get("json_ld_sha256"),
                "body_sha256": v.get("body_sha256"),
            }
            for p, v in (public.get("pages") or {}).items()
        }
    }
    structured_public_hash = _write_json(
        run_dir / "structured_data_snapshot_public.json", structured_public
    )

    regression = regression_surface_map(routes=web_routes, api_routes=api_repo, db=db_repo)
    regression.update(live_regression_overrides)
    regression_hash = _write_json(run_dir / "regression_surface_map.json", regression)

    hashes = {
        # repo snapshots
        "git_state.json": git_hash,
        "route_signature.json": routes_hash,
        "api_contract_snapshot_repo.json": api_repo_hash,
        "db_schema_snapshot_repo.json": db_repo_hash,
        "seo_metadata_snapshot_repo.json": seo_repo_hash,
        "structured_data_snapshot_repo.json": structured_repo_hash,
        "crm_payload_snapshot_repo.json": crm_repo_hash,
        "cache_key_map_repo.json": cache_repo_hash,
        "observability_readiness_repo.json": observability_repo_hash,
        "metric_baseline_state_repo.json": metric_baseline_repo_hash,
        # public live snapshots
        "seo_metadata_snapshot_public.json": public_hash,
        "structured_data_snapshot_public.json": structured_public_hash,
        # regression
        "regression_surface_map.json": regression_hash,
    }
    hashes.update(live_hashes)

    # Write report into run_dir only (do not overwrite any tracked root report).
    report_path = run_dir / "BASELINE_INTEGRITY_REPORT.md"
    lines: list[str] = []
    lines.append("# BASELINE INTEGRITY REPORT")
    lines.append("")
    lines.append(f"- run_dir: `{_rel(run_dir)}`")
    lines.append(f"- generated_utc: `{run_dir.name}`")
    lines.append("")
    lines.append("## Git")
    lines.append(f"- head: `{git['head']}`")
    lines.append(f"- branch: `{git['branch']}`")
    lines.append(f"- status_porcelain_lines: `{len(git['status_porcelain'])}`")
    lines.append(f"- diff_vs_origin_main_lines: `{len(git['diff_name_status_origin_main'])}`")
    lines.append("")
    lines.append("## Snapshot Hashes")
    lines.append(_md_table(sorted(hashes.items())))
    lines.append("")
    lines.append("## Regression Surface")
    for k, v in sorted(regression.items()):
        lines.append(f"- {k}: `{v}`")
    lines.append("")
    lines.append("## Gate Notes")
    lines.append("- Observability/metrics runtime gates must be validated on VPS per docs/governance/observability.md and docs/governance/metrics.yaml")
    if args.vps:
        lines.append(f"- VPS live snapshots: attempted via ssh alias `{args.vps}`")
    else:
        lines.append("- VPS live snapshots: not attempted (no --vps provided)")
    report_path.write_text("\n".join(lines), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
