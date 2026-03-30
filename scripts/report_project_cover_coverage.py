"""B13 report for project cover coverage and local-media integrity.

Usage:
    python scripts/report_project_cover_coverage.py
    python scripts/report_project_cover_coverage.py --strict --write ops/logs/b13_project_cover_report.json
"""

from __future__ import annotations

import argparse
import json
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
IMPORT_DIR = REPO_ROOT / "data" / "import"
DEFAULT_WRITE = REPO_ROOT / "ops" / "logs" / "project_cover_coverage.json"
DEFAULT_PUBLIC_ROOT = REPO_ROOT / "admin-app" / "public"

FEATURED_PRIORITY = [
    "the-riviera-jomtien",
    "the-riviera-monaco",
    "copacabana-beach-jomtien",
    "arcadia-millennium-tower",
    "city-garden-pratumnak",
    "wongamat-tower",
    "dusit-grand-condo-view",
    "grand-solaire",
]


def _read_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and isinstance(raw.get("data"), list):
        return raw["data"]
    return []


def _is_real_cover(url: str | None) -> bool:
    if not url:
        return False
    u = str(url).strip().lower()
    if not u:
        return False
    if "placeholder" in u or "default-image" in u:
        return False
    if u.startswith("/images/"):
        return False
    if "/images/" in u and (
        u.startswith("https://amppattaya.com/")
        or u.startswith("https://www.amppattaya.com/")
        or u.startswith("http://127.0.0.1:")
        or u.startswith("http://localhost:")
    ):
        return False
    return u.startswith("http://") or u.startswith("https://") or "/media/" in u


def _is_external_cover(url: str | None) -> bool:
    if not url:
        return False
    u = str(url).strip().lower()
    return u.startswith("http://") or u.startswith("https://")


def _is_local_cover(url: str | None) -> bool:
    if not url:
        return False
    return str(url).strip().startswith("/media/")


def _local_media_file_info(url: str | None, *, public_root: Path) -> dict[str, Any] | None:
    if not url or not str(url).startswith("/media/"):
        return None
    p = public_root / str(url).lstrip("/")
    exists = p.exists() and p.is_file()
    size = int(p.stat().st_size) if exists else 0
    return {
        "path": str(p),
        "exists": bool(exists and size > 0),
        "size_bytes": size,
    }


def generate_report(
    import_dir: Path = IMPORT_DIR, *, public_root: Path = DEFAULT_PUBLIC_ROOT
) -> dict[str, Any]:
    projects = _read_json(import_dir / "projects.json")
    sources = _read_json(import_dir / "project_cover_sources.json")
    source_by_slug = {str(r.get("project_slug") or "").strip(): r for r in sources}

    project_rows = []
    for row in projects:
        slug = str(row.get("slug") or "").strip()
        cover = str(row.get("cover_image_url") or "").strip() or None
        real = _is_real_cover(cover)
        source_row = source_by_slug.get(slug, {})
        project_rows.append(
            {
                "slug": slug,
                "name": str(row.get("name") or "").strip(),
                "cover_image_url": cover,
                "is_real_cover": real,
                "is_external_cover": _is_external_cover(cover),
                "local_media_file": _local_media_file_info(cover, public_root=public_root),
                "source_type": source_row.get("source_type"),
                "source_page_url": source_row.get("source_page_url"),
                "rights_status": source_row.get("rights_status"),
            }
        )

    total = len(project_rows)
    real_count = sum(1 for r in project_rows if r["is_real_cover"])
    external_count = sum(1 for r in project_rows if r["is_external_cover"])
    local_media_count = sum(1 for r in project_rows if _is_local_cover(r.get("cover_image_url")))
    local_media_missing_count = sum(
        1
        for r in project_rows
        if isinstance(r.get("local_media_file"), dict)
        and not bool(r["local_media_file"].get("exists"))
    )
    no_cover_count = sum(1 for r in project_rows if not str(r.get("cover_image_url") or "").strip())
    featured = sorted(
        project_rows,
        key=lambda r: FEATURED_PRIORITY.index(r["slug"]) if r["slug"] in FEATURED_PRIORITY else 999,
    )[:6]
    featured_real_count = sum(1 for r in featured if r["is_real_cover"])

    by_source_type: dict[str, int] = {}
    for row in project_rows:
        if not row["is_real_cover"]:
            continue
        key = str(row.get("source_type") or "untracked")
        by_source_type[key] = by_source_type.get(key, 0) + 1

    external_rows = [r for r in project_rows if r["is_external_cover"]]
    broken_rows = [
        r
        for r in project_rows
        if isinstance(r.get("local_media_file"), dict)
        and not bool(r["local_media_file"].get("exists"))
    ]

    return {
        "summary": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "projects_total": total,
            "projects_real_cover_count": real_count,
            "projects_real_cover_pct": round((real_count / total * 100) if total else 0.0, 2),
            "projects_external_cover_count": external_count,
            "projects_external_cover_pct": round(
                (external_count / total * 100) if total else 0.0, 2
            ),
            "projects_local_media_cover_count": local_media_count,
            "projects_local_media_missing_file_count": local_media_missing_count,
            "projects_missing_cover_count": no_cover_count,
            "featured_home_cards_count": len(featured),
            "featured_home_real_cover_count": featured_real_count,
            "featured_home_real_cover_pct": round(
                (featured_real_count / len(featured) * 100) if featured else 0.0, 2
            ),
            "dataset_empty": total == 0,
        },
        "by_source_type": dict(sorted(by_source_type.items(), key=lambda kv: kv[0])),
        "missing_real_cover_slugs": [r["slug"] for r in project_rows if not r["is_real_cover"]],
        "external_cover_rows": external_rows,
        "broken_local_media_rows": broken_rows,
        "projects": project_rows,
        "featured_home_preview": featured,
    }


def _print_human_summary(report: dict[str, Any]) -> None:
    summary = report.get("summary", {})
    print(
        "B13 Coverage Summary | "
        f"projects={summary.get('projects_total', 0)} "
        f"real_cover_pct={summary.get('projects_real_cover_pct', 0)} "
        f"local_media_pct={round((summary.get('projects_local_media_cover_count', 0) / max(1, summary.get('projects_total', 0))) * 100, 2)} "
        f"external={summary.get('projects_external_cover_count', 0)} "
        f"broken={summary.get('projects_local_media_missing_file_count', 0)}"
    )


def _exit_code_for_policy(report: dict[str, Any], *, strict: bool, fail_on_warn: bool) -> int:
    summary = report.get("summary", {})
    errors = int(summary.get("projects_external_cover_count", 0)) + int(
        summary.get("projects_local_media_missing_file_count", 0)
    )
    warnings = int(summary.get("projects_missing_cover_count", 0))
    if fail_on_warn and (errors > 0 or warnings > 0):
        return 2
    if strict and errors > 0:
        return 1
    return 0


def _write_report_with_fallback(path: Path, report: dict[str, Any]) -> None:
    payload = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    targets = [path]
    fallback = Path(tempfile.gettempdir()) / path.name
    if fallback not in targets:
        targets.append(fallback)

    last_error: Exception | None = None
    for target in targets:
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(payload, encoding="utf-8")
            if target == path:
                print(f"\nWROTE:{target}")
            else:
                print(f"\nWRITE-FALLBACK:{target} (requested {path})")
            return
        except OSError as exc:
            last_error = exc

    print(f"\nWRITE-SKIPPED:{path} ({last_error})")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Report real-cover coverage for project seed data."
    )
    parser.add_argument(
        "--input-dir", default=str(IMPORT_DIR), help="Import JSON directory (default: %(default)s)"
    )
    parser.add_argument(
        "--public-root",
        default=str(DEFAULT_PUBLIC_ROOT),
        help="Frontend public root for local /media file existence checks (default: %(default)s)",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero when external covers or broken local media refs exist",
    )
    parser.add_argument(
        "--fail-on-warn",
        action="store_true",
        dest="fail_on_warn",
        help="Exit non-zero on warnings as well (currently: missing cover rows)",
    )
    parser.add_argument("--quiet", action="store_true", help="Suppress human-readable summary")
    parser.add_argument(
        "--no-write", action="store_true", dest="no_write", help="Do not write JSON report"
    )
    parser.add_argument(
        "--write",
        nargs="?",
        const=str(DEFAULT_WRITE),
        help="Write JSON report to path (default when flag present without value: ops/logs/project_cover_coverage.json)",
    )
    args = parser.parse_args()

    report = generate_report(Path(args.input_dir), public_root=Path(args.public_root))
    print(json.dumps(report, ensure_ascii=False, indent=2))

    if not args.quiet:
        _print_human_summary(report)

    if args.write and not args.no_write:
        out_path = Path(args.write)
        if not out_path.is_absolute():
            out_path = REPO_ROOT / out_path
        _write_report_with_fallback(out_path, report)

    return _exit_code_for_policy(
        report, strict=bool(args.strict), fail_on_warn=bool(args.fail_on_warn)
    )


if __name__ == "__main__":
    raise SystemExit(main())
