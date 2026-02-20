from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class CheckResult:
    ok: bool
    notes: str


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_json(path: Path) -> dict[str, Any]:
    # Windows PowerShell's `Out-File -Encoding utf8` writes UTF-8 with BOM.
    # Accept both BOM and non-BOM JSON to keep the queue finalizer robust.
    return json.loads(path.read_text(encoding="utf-8-sig"))


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def _has_file(rel: str) -> bool:
    return (REPO_ROOT / rel).exists()


def check_bp11() -> CheckResult:
    robots_path = REPO_ROOT / "admin-app" / "app" / "robots.ts"
    meta_path = REPO_ROOT / "admin-app" / "app" / "_lib" / "i18n" / "metadata.ts"
    missing: list[str] = []

    if not robots_path.exists():
        missing.append("admin-app/app/robots.ts")
    if not meta_path.exists():
        missing.append("admin-app/app/_lib/i18n/metadata.ts")
    if missing:
        return CheckResult(False, f"missing files: {', '.join(missing)}")

    robots_text = robots_path.read_text(encoding="utf-8", errors="ignore")
    expected_disallows = [
        "'/_next/'",
        "'/404'",
        "'/500'",
        "'/preview/'",
        "'/draft/'",
        "'/*?bedrooms='",
        "'/*?bathrooms='",
        "'/*?price_min='",
        "'/*?price_max='",
        "'/*?sort='",
        "'/*?page='",
    ]
    missing_disallows = [d for d in expected_disallows if d not in robots_text]

    meta_text = meta_path.read_text(encoding="utf-8", errors="ignore")
    has_x_default = "'x-default'" in meta_text or '"x-default"' in meta_text

    notes: list[str] = []
    ok = True
    if missing_disallows:
        ok = False
        notes.append(f"robots.ts missing disallow entries: {', '.join(missing_disallows)}")
    if not has_x_default:
        ok = False
        notes.append("metadata.ts missing x-default hreflang")

    if ok:
        return CheckResult(True, "robots.ts disallow hardened + x-default hreflang present")
    return CheckResult(False, "; ".join(notes))


def check_bp08() -> CheckResult:
    # Minimal, deterministic checks for the known gaps noted in prior audits.
    condo = "admin-app/app/(site)/[locale]/buy/condo-pattaya/page.tsx"
    villa = "admin-app/app/(site)/[locale]/buy/villa-pattaya/page.tsx"
    guides_root = "admin-app/app/(site)/[locale]/guides"

    missing: list[str] = []
    if not _has_file(condo):
        missing.append(condo)
    if not _has_file(villa):
        missing.append(villa)

    guides_exists = (REPO_ROOT / guides_root).is_dir()
    if not guides_exists:
        missing.append(guides_root + "/")

    if missing:
        return CheckResult(False, "missing routes/content roots: " + ", ".join(missing))
    return CheckResult(True, "buy sub-routes + guides root present")


def check_bp07() -> CheckResult:
    # Minimal, deterministic checks for product template spec completeness.
    developer_root = REPO_ROOT / "admin-app" / "app" / "(site)" / "[locale]" / "developers"
    developer_slug = developer_root / "[slug]" / "page.tsx"

    if developer_slug.exists():
        return CheckResult(True, "developers/[slug]/page.tsx exists")

    if not developer_root.exists():
        return CheckResult(False, "developers/ route tree missing")
    return CheckResult(False, "developers/[slug]/page.tsx missing")


def finalize_queue(*, out_dir: Path) -> None:
    queue_path = out_dir / "queue.json"
    if not queue_path.exists():
        raise SystemExit(f"queue.json not found at {queue_path}")

    queue = _read_json(queue_path)
    items: list[dict[str, Any]] = list(queue.get("items") or [])

    bp11 = check_bp11()
    bp08 = check_bp08()
    bp07 = check_bp07()

    results_by_id: dict[str, tuple[str, str]] = {
        "BP-11": ("pass" if bp11.ok else "gap", bp11.notes),
        "BP-08": ("pass" if bp08.ok else "gap", bp08.notes),
        "BP-07": ("pass" if bp07.ok else "gap", bp07.notes),
    }

    for item in items:
        item_id = str(item.get("id") or "")
        item["status"] = "done"
        item.setdefault("result", "reviewed")

        if item_id in results_by_id:
            result, notes = results_by_id[item_id]
            item["result"] = result
            item["notes"] = notes

    queue["items"] = items
    queue["completed_at_utc"] = _utc_now_iso()
    _write_json(queue_path, queue)

    audit_summary = {
        "timestamp_utc": _utc_now_iso(),
        "queue_path": str(queue_path.relative_to(REPO_ROOT)),
        "bp07": {"ok": bp07.ok, "notes": bp07.notes},
        "bp08": {"ok": bp08.ok, "notes": bp08.notes},
        "bp11": {"ok": bp11.ok, "notes": bp11.notes},
    }
    _write_json(out_dir / "blueprint_audit.summary.json", audit_summary)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out-dir", default="output", help="Artifacts directory containing queue.json"
    )
    args = parser.parse_args()

    out_dir = (REPO_ROOT / args.out_dir).resolve()
    finalize_queue(out_dir=out_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
