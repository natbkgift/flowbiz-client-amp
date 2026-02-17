from __future__ import annotations

import hashlib
import json
import re
import subprocess
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "docs" / "phase_reports" / "baseline"


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


def _md_table(rows: Iterable[tuple[str, str]]) -> str:
    out = ["| Artifact | SHA256 |", "|---|---|"]
    for name, h in rows:
        out.append(f"| {name} | `{h}` |")
    return "\n".join(out)


def write_markdown_report(*, hashes: dict[str, str], git: dict[str, Any], regression: dict[str, Any]) -> None:
    report_path = OUT_DIR / "BASELINE_INTEGRITY_REPORT.md"
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
    lines.append("- Repo-only snapshot (no live staging/production access, no DB connection).")
    lines.append("- Production deploy gate requiring runtime logs/traces/alerts must be validated in target environment.")
    lines.append("")
    report_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    git = git_state()
    git_hash = _write_json(OUT_DIR / "git_state.json", git)

    web_routes = next_routes()
    routes_hash = _write_json(OUT_DIR / "route_signature.json", [r.__dict__ for r in web_routes])

    api = api_routes_fastapi()
    api_hash = _write_json(OUT_DIR / "api_contract_snapshot.json", [r.__dict__ for r in api])

    db = db_schema_snapshot()
    db_hash = _write_json(OUT_DIR / "db_schema_snapshot.json", db)

    seo_struct = seo_and_structured_data_snapshot()
    seo_hash = _write_json(OUT_DIR / "seo_metadata_snapshot.json", seo_struct["seo"])
    structured_hash = _write_json(
        OUT_DIR / "structured_data_snapshot.json", seo_struct["structured"]
    )

    crm = crm_payload_snapshot(api)
    crm_hash = _write_json(OUT_DIR / "crm_payload_snapshot.json", crm)

    cache = cache_key_map()
    cache_hash = _write_json(OUT_DIR / "cache_key_map.json", cache)

    regression = regression_surface_map(routes=web_routes, api_routes=api, db=db)
    regression_hash = _write_json(OUT_DIR / "regression_surface_map.json", regression)

    hashes = {
        "git_state.json": git_hash,
        "route_signature.json": routes_hash,
        "api_contract_snapshot.json": api_hash,
        "db_schema_snapshot.json": db_hash,
        "seo_metadata_snapshot.json": seo_hash,
        "structured_data_snapshot.json": structured_hash,
        "crm_payload_snapshot.json": crm_hash,
        "cache_key_map.json": cache_hash,
        "regression_surface_map.json": regression_hash,
    }

    write_markdown_report(hashes=hashes, git=git, regression=regression)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
