"""Mirror missing import media assets into local frontend public storage.

Purpose:
  - Download missing `/media/...` assets referenced by `data/import/*.json`.
  - Rewrite import JSON rows to stable local `/media/import-assets/...` paths.
  - Keep project/unit galleries working in local frontend/public runtime.

Usage:
  python scripts/mirror_import_media_assets.py
  python scripts/mirror_import_media_assets.py --dry-run
  python scripts/mirror_import_media_assets.py --force --write-report
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
IMPORT_DIR = REPO_ROOT / "data" / "import"
DEFAULT_PUBLIC_ROOT = REPO_ROOT / "admin-app" / "public"
DEFAULT_MEDIA_PREFIX = "/media"
DEFAULT_MEDIA_SUBDIR = "import-assets"
DEFAULT_ORIGIN = "https://amppattaya.com"
DEFAULT_REPORT_PATH = REPO_ROOT / "ops" / "logs" / "import_media_asset_mirror_report.json"

_CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
}
_ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}

_DATASETS = (
    {
        "name": "projects",
        "filename": "projects.json",
        "single_fields": ("cover_image_url", "hero_image_url"),
        "list_fields": ("images",),
        "row_id_fields": ("slug", "name"),
    },
    {
        "name": "units_buy",
        "filename": "units_buy.json",
        "single_fields": ("cover_image_url", "cover_image"),
        "list_fields": ("images", "local_images"),
        "row_id_fields": ("slug", "source_id", "title"),
    },
    {
        "name": "units_rent",
        "filename": "units_rent.json",
        "single_fields": ("cover_image_url", "cover_image"),
        "list_fields": ("images", "local_images"),
        "row_id_fields": ("slug", "source_id", "title"),
    },
)


def _read_json_list(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return [row for row in raw if isinstance(row, dict)]
    if isinstance(raw, dict) and isinstance(raw.get("data"), list):
        return [row for row in raw["data"] if isinstance(row, dict)]
    return []


def _write_json_list(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _is_external_url(value: str | None) -> bool:
    if not value:
        return False
    text = str(value).strip()
    return text.startswith("http://") or text.startswith("https://")


def _is_local_media_path(value: str | None, media_prefix: str) -> bool:
    if not value:
        return False
    text = str(value).strip()
    prefix = "/" + media_prefix.strip("/")
    return text.startswith(prefix + "/") or text == prefix


def _slugify_part(value: str) -> str:
    chars: list[str] = []
    for ch in str(value or "").strip().lower():
        if ch.isalnum():
            chars.append(ch)
        elif ch in {"-", "_"}:
            chars.append("-")
        else:
            chars.append("-")
    out = "".join(chars).strip("-")
    while "--" in out:
        out = out.replace("--", "-")
    return out or "row"


def _url_sha12(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:12]


def _guess_ext(*, url: str, content_type: str | None) -> str:
    ctype = (content_type or "").split(";")[0].strip().lower()
    if ctype in _CONTENT_TYPE_EXT:
        return _CONTENT_TYPE_EXT[ctype]
    parsed = urllib.parse.urlparse(url)
    ext = Path(parsed.path).suffix.lower()
    if ext in _ALLOWED_EXTS:
        return ".jpg" if ext == ".jpeg" else ext
    guessed, _ = mimetypes.guess_type(parsed.path)
    if guessed and guessed.lower() in _CONTENT_TYPE_EXT:
        return _CONTENT_TYPE_EXT[guessed.lower()]
    return ".jpg"


def _download_to_file(url: str, dest_path: Path, *, timeout: int) -> tuple[int, str | None]:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = dest_path.with_suffix(dest_path.suffix + ".tmp")
    if tmp_path.exists():
        try:
            tmp_path.unlink()
        except OSError:
            pass

    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; FlowBizImportMediaMirror/1.0)",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
    )

    bytes_written = 0
    content_type: str | None = None
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = int(getattr(resp, "status", 200))
            if not (200 <= status < 400):
                raise urllib.error.HTTPError(
                    url, status, f"unexpected status {status}", hdrs=None, fp=None
                )
            content_type = str(resp.headers.get("Content-Type") or "").strip() or None
            with tmp_path.open("wb") as fh:
                while True:
                    chunk = resp.read(1024 * 128)
                    if not chunk:
                        break
                    bytes_written += len(chunk)
                    fh.write(chunk)
        if bytes_written <= 0:
            raise ValueError("empty response body")
        os.replace(tmp_path, dest_path)
        return bytes_written, content_type
    except Exception:
        try:
            if tmp_path.exists():
                tmp_path.unlink()
        except OSError:
            pass
        raise


def _build_local_path(
    *,
    public_root: Path,
    media_prefix: str,
    media_subdir: str,
    dataset_name: str,
    row_key: str,
    source_url: str,
    content_type: str | None,
) -> tuple[Path, str]:
    prefix = "/" + media_prefix.strip("/")
    rel_dir = (
        Path(prefix.strip("/"))
        / media_subdir.strip("/")
        / _slugify_part(dataset_name)
        / _slugify_part(row_key)
    )
    ext = _guess_ext(url=source_url, content_type=content_type)
    filename = f"asset_{_url_sha12(source_url)}{ext}"
    rel_file = rel_dir / filename
    return public_root / rel_file, "/" + rel_file.as_posix()


@dataclass
class RewriteResult:
    value: str
    changed: bool
    mirrored: bool
    reused: bool
    failure: str | None = None


def _mirror_value(
    *,
    dataset_name: str,
    row_key: str,
    value: str,
    public_root: Path,
    media_prefix: str,
    media_subdir: str,
    origin_for_local_media: str,
    timeout: int,
    force: bool,
    write_changes: bool,
) -> RewriteResult:
    raw = str(value or "").strip()
    if not raw:
        return RewriteResult(value=raw, changed=False, mirrored=False, reused=False)

    if _is_external_url(raw):
        source_url = raw
    elif _is_local_media_path(raw, media_prefix):
        local_abs = public_root / raw.lstrip("/")
        if local_abs.exists() and local_abs.is_file() and local_abs.stat().st_size > 0:
            return RewriteResult(value=raw, changed=False, mirrored=False, reused=True)
        source_url = origin_for_local_media.rstrip("/") + raw
    else:
        return RewriteResult(value=raw, changed=False, mirrored=False, reused=False)

    provisional_file, provisional_url = _build_local_path(
        public_root=public_root,
        media_prefix=media_prefix,
        media_subdir=media_subdir,
        dataset_name=dataset_name,
        row_key=row_key,
        source_url=source_url,
        content_type=None,
    )

    if provisional_file.exists() and provisional_file.stat().st_size > 0 and not force:
        return RewriteResult(value=provisional_url, changed=provisional_url != raw, mirrored=False, reused=True)

    if not write_changes:
        return RewriteResult(value=provisional_url, changed=provisional_url != raw, mirrored=True, reused=False)

    try:
        bytes_written, content_type = _download_to_file(source_url, provisional_file, timeout=timeout)
        final_file, final_url = _build_local_path(
            public_root=public_root,
            media_prefix=media_prefix,
            media_subdir=media_subdir,
            dataset_name=dataset_name,
            row_key=row_key,
            source_url=source_url,
            content_type=content_type,
        )
        if final_file != provisional_file:
            final_file.parent.mkdir(parents=True, exist_ok=True)
            os.replace(provisional_file, final_file)
            try:
                if provisional_file.exists():
                    provisional_file.unlink()
            except OSError:
                pass
            target_url = final_url
        else:
            target_url = provisional_url
        return RewriteResult(
            value=target_url,
            changed=target_url != raw,
            mirrored=bytes_written > 0,
            reused=False,
        )
    except Exception as exc:  # noqa: BLE001
        return RewriteResult(
            value=raw,
            changed=False,
            mirrored=False,
            reused=False,
            failure=str(exc),
        )


def mirror_import_media_assets(
    *,
    import_dir: Path,
    public_root: Path,
    media_prefix: str,
    media_subdir: str,
    origin_for_local_media: str,
    timeout: int,
    force: bool,
    write_changes: bool,
) -> dict[str, Any]:
    summary = {
        "datasets_total": len(_DATASETS),
        "rows_total": 0,
        "fields_rewritten": 0,
        "mirrored_new_count": 0,
        "reused_existing_count": 0,
        "failures_count": 0,
        "write_changes": bool(write_changes),
    }
    dataset_reports: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []

    for config in _DATASETS:
        path = import_dir / str(config["filename"])
        rows = _read_json_list(path)
        summary["rows_total"] += len(rows)
        dataset_rewritten = 0
        dataset_mirrored = 0
        dataset_reused = 0
        dataset_failures = 0

        for row in rows:
            row_key = next(
                (
                    str(row.get(field) or "").strip()
                    for field in config["row_id_fields"]
                    if str(row.get(field) or "").strip()
                ),
                "row",
            )

            for field in config["single_fields"]:
                value = row.get(field)
                if not isinstance(value, str):
                    continue
                res = _mirror_value(
                    dataset_name=str(config["name"]),
                    row_key=row_key,
                    value=value,
                    public_root=public_root,
                    media_prefix=media_prefix,
                    media_subdir=media_subdir,
                    origin_for_local_media=origin_for_local_media,
                    timeout=timeout,
                    force=force,
                    write_changes=write_changes,
                )
                row[field] = res.value
                if res.changed:
                    dataset_rewritten += 1
                if res.mirrored:
                    dataset_mirrored += 1
                if res.reused:
                    dataset_reused += 1
                if res.failure:
                    dataset_failures += 1
                    failures.append(
                        {
                            "dataset": config["name"],
                            "row_key": row_key,
                            "field": field,
                            "value": value,
                            "error": res.failure,
                        }
                    )

            for field in config["list_fields"]:
                values = row.get(field)
                if not isinstance(values, list):
                    continue
                rewritten_values: list[Any] = []
                seen: set[str] = set()
                field_changed = False
                for item in values:
                    if not isinstance(item, str):
                        rewritten_values.append(item)
                        continue
                    res = _mirror_value(
                        dataset_name=str(config["name"]),
                        row_key=row_key,
                        value=item,
                        public_root=public_root,
                        media_prefix=media_prefix,
                        media_subdir=media_subdir,
                        origin_for_local_media=origin_for_local_media,
                        timeout=timeout,
                        force=force,
                        write_changes=write_changes,
                    )
                    normalized = str(res.value or "").strip()
                    if normalized and normalized not in seen:
                        rewritten_values.append(normalized)
                        seen.add(normalized)
                    field_changed = field_changed or res.changed
                    if res.mirrored:
                        dataset_mirrored += 1
                    if res.reused:
                        dataset_reused += 1
                    if res.failure:
                        dataset_failures += 1
                        failures.append(
                            {
                                "dataset": config["name"],
                                "row_key": row_key,
                                "field": field,
                                "value": item,
                                "error": res.failure,
                            }
                        )
                row[field] = rewritten_values
                if field_changed:
                    dataset_rewritten += 1

            if str(config["name"]).startswith("units_"):
                primary_media = None
                for field in ("cover_image_url", "cover_image"):
                    value = row.get(field)
                    if isinstance(value, str) and value.strip():
                        primary_media = value.strip()
                        break
                if primary_media is None:
                    for field in ("local_images", "images"):
                        values = row.get(field)
                        if isinstance(values, list):
                            primary_media = next(
                                (
                                    str(item).strip()
                                    for item in values
                                    if isinstance(item, str) and str(item).strip()
                                ),
                                None,
                            )
                        if primary_media:
                            break
                if primary_media:
                    row["cover_image_url"] = primary_media
                    row["cover_image"] = primary_media

        if write_changes and rows:
            _write_json_list(path, rows)

        dataset_reports.append(
            {
                "dataset": config["name"],
                "filename": config["filename"],
                "rows": len(rows),
                "fields_rewritten": dataset_rewritten,
                "mirrored_new_count": dataset_mirrored,
                "reused_existing_count": dataset_reused,
                "failures_count": dataset_failures,
            }
        )
        summary["fields_rewritten"] += dataset_rewritten
        summary["mirrored_new_count"] += dataset_mirrored
        summary["reused_existing_count"] += dataset_reused
        summary["failures_count"] += dataset_failures

    summary["ok"] = summary["failures_count"] == 0
    return {
        "summary": summary,
        "config": {
            "import_dir": str(import_dir),
            "public_root": str(public_root),
            "media_prefix": media_prefix,
            "media_subdir": media_subdir,
            "origin_for_local_media": origin_for_local_media,
        },
        "datasets": dataset_reports,
        "failures": failures,
    }


def _exit_code_for_report(report: dict[str, Any]) -> int:
    failures = int(report.get("summary", {}).get("failures_count", 0))
    return 0 if failures == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Mirror missing import media assets into local frontend public storage."
    )
    parser.add_argument("--input-dir", default=str(IMPORT_DIR), help="Import JSON dir")
    parser.add_argument("--public-root", default=str(DEFAULT_PUBLIC_ROOT), help="Frontend public root")
    parser.add_argument("--media-prefix", default=DEFAULT_MEDIA_PREFIX, help="Public media URL prefix")
    parser.add_argument("--media-subdir", default=DEFAULT_MEDIA_SUBDIR, help="Subdirectory under media prefix")
    parser.add_argument(
        "--origin-for-local-media",
        default=DEFAULT_ORIGIN,
        help="Origin used to fetch missing /media/... assets",
    )
    parser.add_argument("--timeout", type=int, default=45, help="HTTP timeout seconds")
    parser.add_argument("--force", action="store_true", help="Re-download even if mirrored file exists")
    parser.add_argument("--dry-run", action="store_true", help="Report planned rewrites without writing files")
    parser.add_argument(
        "--write-report",
        nargs="?",
        const=str(DEFAULT_REPORT_PATH),
        help="Write report JSON (default when flag present without value: ops/logs/import_media_asset_mirror_report.json)",
    )
    args = parser.parse_args()

    report = mirror_import_media_assets(
        import_dir=Path(args.input_dir),
        public_root=Path(args.public_root),
        media_prefix=args.media_prefix,
        media_subdir=args.media_subdir,
        origin_for_local_media=str(args.origin_for_local_media or "").rstrip("/"),
        timeout=max(5, int(args.timeout)),
        force=bool(args.force),
        write_changes=not bool(args.dry_run),
    )

    print(json.dumps(report, ensure_ascii=False, indent=2))

    if args.write_report:
        out_path = Path(args.write_report)
        if not out_path.is_absolute():
            out_path = REPO_ROOT / out_path
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"\nWROTE:{out_path}")

    return _exit_code_for_report(report)


if __name__ == "__main__":
    raise SystemExit(main())
