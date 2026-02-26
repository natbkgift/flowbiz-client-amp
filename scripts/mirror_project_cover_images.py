"""Mirror project cover images into local media storage and rewrite import data.

Purpose:
  - Eliminate runtime hotlinks for project covers in ``data/import/projects.json``.
  - Download approved external cover URLs into local media path under our control.
  - Rewrite project ``cover_image_url`` to ``/media/project-covers/...``.
  - Record mirror metadata back into ``data/import/project_cover_sources.json``.

Default filesystem target:
  admin-app/public/media/project-covers/<project-slug>/cover_<hash>.<ext>

This path is served directly by Next.js in local dev and can be synced to the
VPS media root (e.g. /var/www/amppattaya/media/project-covers) for production.

Usage:
  python scripts/mirror_project_cover_images.py
  python scripts/mirror_project_cover_images.py --force
  python scripts/mirror_project_cover_images.py --write-report
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
IMPORT_DIR = REPO_ROOT / "data" / "import"
DEFAULT_PUBLIC_ROOT = REPO_ROOT / "admin-app" / "public"
DEFAULT_MEDIA_PREFIX = "/media"
DEFAULT_MEDIA_SUBDIR = "project-covers"
DEFAULT_REPORT_PATH = REPO_ROOT / "ops" / "logs" / "project_cover_mirror_report.json"

_CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
}
_ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}


def _read_json_list(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and isinstance(raw.get("data"), list):
        return raw["data"]
    return []


def _write_json_list(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _is_external_url(url: str | None) -> bool:
    if not url:
        return False
    s = str(url).strip()
    return s.startswith("http://") or s.startswith("https://")


def _is_local_media_path(url: str | None, media_prefix: str) -> bool:
    if not url:
        return False
    s = str(url).strip()
    prefix = "/" + media_prefix.strip("/")
    return s.startswith(prefix + "/") or s == prefix


def _slugify_part(value: str) -> str:
    out = []
    for ch in (value or "").strip().lower():
        if ch.isalnum():
            out.append(ch)
        elif ch in {"-", "_"}:
            out.append("-")
        else:
            out.append("-")
    cleaned = "".join(out).strip("-")
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned or "project"


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


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 128), b""):
            h.update(chunk)
    return h.hexdigest()


@dataclass
class MirrorResult:
    project_slug: str
    source_url: str | None
    local_url: str | None
    local_file: str | None
    ok: bool
    reused_existing: bool = False
    bytes_written: int = 0
    sha256: str | None = None
    content_type: str | None = None
    error: str | None = None


def _download_to_file(url: str, dest_path: Path, *, timeout: int) -> tuple[int, str | None]:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = dest_path.with_suffix(dest_path.suffix + ".tmp")
    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; AMPProjectCoverMirror/1.0; +https://amppattaya.com)",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
    )

    if tmp_path.exists():
        try:
            tmp_path.unlink()
        except OSError:
            pass

    bytes_written = 0
    content_type: str | None = None
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = int(getattr(resp, "status", 200))
            if not (200 <= status < 400):
                raise urllib.error.HTTPError(url, status, f"unexpected status {status}", hdrs=None, fp=None)

            content_type = str(resp.headers.get("Content-Type") or "").strip() or None
            with tmp_path.open("wb") as f:
                while True:
                    chunk = resp.read(1024 * 128)
                    if not chunk:
                        break
                    bytes_written += len(chunk)
                    f.write(chunk)

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


def _build_local_paths(
    *,
    public_root: Path,
    media_prefix: str,
    media_subdir: str,
    project_slug: str,
    source_url: str,
    content_type: str | None,
) -> tuple[Path, str]:
    prefix = "/" + media_prefix.strip("/")
    rel_dir = Path(prefix.strip("/")) / media_subdir.strip("/") / _slugify_part(project_slug)
    ext = _guess_ext(url=source_url, content_type=content_type)
    filename = f"cover_{_url_sha12(source_url)}{ext}"
    rel_file = rel_dir / filename
    abs_file = public_root / rel_file
    return abs_file, "/" + str(rel_file).replace("\\", "/")


def _mirror_one(
    *,
    project_slug: str,
    source_url: str,
    public_root: Path,
    media_prefix: str,
    media_subdir: str,
    timeout: int,
    force: bool,
) -> MirrorResult:
    # Probe content type first only if extension is ambiguous? Simpler: download once to temp named by guessed URL ext,
    # then rename if content type indicates different ext.
    provisional_ext = _guess_ext(url=source_url, content_type=None)
    rel_dir = Path(media_prefix.strip("/")) / media_subdir.strip("/") / _slugify_part(project_slug)
    provisional_name = f"cover_{_url_sha12(source_url)}{provisional_ext}"
    provisional_file = public_root / rel_dir / provisional_name

    if provisional_file.exists() and provisional_file.stat().st_size > 0 and not force:
        sha = _sha256_file(provisional_file)
        return MirrorResult(
            project_slug=project_slug,
            source_url=source_url,
            local_url="/" + str((rel_dir / provisional_name).as_posix()),
            local_file=str(provisional_file),
            ok=True,
            reused_existing=True,
            bytes_written=int(provisional_file.stat().st_size),
            sha256=sha,
        )

    try:
        bytes_written, content_type = _download_to_file(source_url, provisional_file, timeout=timeout)
        final_file, final_url = _build_local_paths(
            public_root=public_root,
            media_prefix=media_prefix,
            media_subdir=media_subdir,
            project_slug=project_slug,
            source_url=source_url,
            content_type=content_type,
        )
        if final_file != provisional_file:
            final_file.parent.mkdir(parents=True, exist_ok=True)
            # If the content type extension differs, rename into canonical filename.
            os.replace(provisional_file, final_file)
            # Clean stale provisional if something recreated it unexpectedly.
            try:
                if provisional_file.exists():
                    provisional_file.unlink()
            except OSError:
                pass
            target_file = final_file
        else:
            target_file = provisional_file
            final_url = "/" + str((rel_dir / provisional_name).as_posix())

        sha = _sha256_file(target_file)
        return MirrorResult(
            project_slug=project_slug,
            source_url=source_url,
            local_url=final_url,
            local_file=str(target_file),
            ok=True,
            bytes_written=bytes_written,
            sha256=sha,
            content_type=content_type,
        )
    except Exception as exc:  # noqa: BLE001
        return MirrorResult(
            project_slug=project_slug,
            source_url=source_url,
            local_url=None,
            local_file=None,
            ok=False,
            error=str(exc),
        )


def mirror_project_covers(
    *,
    import_dir: Path,
    public_root: Path,
    media_prefix: str,
    media_subdir: str,
    timeout: int,
    force: bool,
    origin_for_local_media: str,
) -> dict[str, Any]:
    projects_path = import_dir / "projects.json"
    sources_path = import_dir / "project_cover_sources.json"
    projects = _read_json_list(projects_path)
    sources = _read_json_list(sources_path)
    source_by_slug = {str(r.get("project_slug") or "").strip(): r for r in sources if str(r.get("project_slug") or "").strip()}

    prefix = "/" + media_prefix.strip("/")
    now_iso = datetime.now(timezone.utc).isoformat()

    results: list[dict[str, Any]] = []
    mirrored = 0
    mirrored_from_local_media = 0
    reused = 0
    failures = 0
    unchanged_local = 0
    rewritten_rows = 0

    for row in projects:
        slug = str(row.get("slug") or "").strip()
        if not slug:
            continue
        cover = str(row.get("cover_image_url") or "").strip() or None
        source_row = source_by_slug.get(slug)

        if _is_local_media_path(cover, media_prefix):
            local_rel = str(cover).lstrip("/")
            local_abs = public_root / local_rel
            exists = local_abs.exists() and local_abs.is_file() and local_abs.stat().st_size > 0
            is_in_project_covers = str(cover).startswith(prefix + "/" + media_subdir.strip("/") + "/")
            preferred_external_from_source = None
            if source_row is not None and bool(source_row.get("approved_for_seed")):
                candidate = str(source_row.get("cover_image_url") or "").strip() or None
                if _is_external_url(candidate):
                    preferred_external_from_source = candidate

            if exists and is_in_project_covers and not force:
                unchanged_local += 1
                if source_row is not None:
                    source_row["mirrored_local_path"] = cover
                    source_row["mirror_status"] = "already_local"
                    source_row["mirror_last_checked_at"] = now_iso
                    source_row["mirror_file_sha256"] = _sha256_file(local_abs)
                    source_row["mirror_file_size_bytes"] = int(local_abs.stat().st_size)
                results.append(
                    {
                        "project_slug": slug,
                        "status": "already_local",
                        "source_url": cover,
                        "local_url": cover,
                        "file_exists": True,
                    }
                )
                continue

            # If source map has an approved external source, prefer mirroring that into project-covers.
            if preferred_external_from_source:
                mirror_res = _mirror_one(
                    project_slug=slug,
                    source_url=preferred_external_from_source,
                    public_root=public_root,
                    media_prefix=media_prefix,
                    media_subdir=media_subdir,
                    timeout=timeout,
                    force=force,
                )
                if mirror_res.ok and mirror_res.local_url:
                    old_cover = cover
                    row["cover_image_url"] = mirror_res.local_url
                    if row["cover_image_url"] != old_cover:
                        rewritten_rows += 1
                    if mirror_res.reused_existing:
                        reused += 1
                    else:
                        mirrored += 1
                    if source_row is not None:
                        source_row["mirrored_local_path"] = mirror_res.local_url
                        source_row["mirror_status"] = (
                            "mirrored_ok_reused_from_source_map"
                            if mirror_res.reused_existing
                            else "mirrored_ok_from_source_map"
                        )
                        source_row["mirror_last_checked_at"] = now_iso
                        source_row["mirror_file_sha256"] = mirror_res.sha256
                        source_row["mirror_file_size_bytes"] = mirror_res.bytes_written
                        source_row["mirror_source_url"] = preferred_external_from_source
                        if mirror_res.content_type:
                            source_row["mirror_content_type"] = mirror_res.content_type
                    results.append(
                        {
                            "project_slug": slug,
                            "status": (
                                "mirrored_ok_reused_from_source_map"
                                if mirror_res.reused_existing
                                else "mirrored_ok_from_source_map"
                            ),
                            "source_url": preferred_external_from_source,
                            "local_url": mirror_res.local_url,
                            "bytes": mirror_res.bytes_written,
                            "sha256": mirror_res.sha256,
                            "content_type": mirror_res.content_type,
                            "prior_local_cover": cover,
                        }
                    )
                    continue
                failures += 1
                if source_row is not None:
                    source_row["mirror_status"] = "mirror_failed_from_source_map"
                    source_row["mirror_last_checked_at"] = now_iso
                    source_row["mirror_error"] = mirror_res.error
                results.append(
                    {
                        "project_slug": slug,
                        "status": "mirror_failed_from_source_map",
                        "source_url": preferred_external_from_source,
                        "local_url": cover,
                        "file_exists": bool(exists),
                        "error": mirror_res.error,
                    }
                )
                continue

            # If local path points outside project-covers (e.g. /media/rent/...) or file is missing,
            # mirror into project-covers so homepage project cards depend on a stable dedicated asset.
            if origin_for_local_media.strip():
                src = origin_for_local_media.rstrip("/") + str(cover)
                mirror_res = _mirror_one(
                    project_slug=slug,
                    source_url=src,
                    public_root=public_root,
                    media_prefix=media_prefix,
                    media_subdir=media_subdir,
                    timeout=timeout,
                    force=force,
                )
                if mirror_res.ok and mirror_res.local_url:
                    old_cover = cover
                    row["cover_image_url"] = mirror_res.local_url
                    if row["cover_image_url"] != old_cover:
                        rewritten_rows += 1
                    if mirror_res.reused_existing:
                        reused += 1
                    else:
                        mirrored += 1
                        mirrored_from_local_media += 1
                    if source_row is not None:
                        source_row["mirrored_local_path"] = mirror_res.local_url
                        source_row["mirror_status"] = (
                            "mirrored_from_local_media_reused"
                            if mirror_res.reused_existing
                            else "mirrored_from_local_media"
                        )
                        source_row["mirror_last_checked_at"] = now_iso
                        source_row["mirror_file_sha256"] = mirror_res.sha256
                        source_row["mirror_file_size_bytes"] = mirror_res.bytes_written
                        source_row["mirror_source_url"] = src
                        if mirror_res.content_type:
                            source_row["mirror_content_type"] = mirror_res.content_type
                    results.append(
                        {
                            "project_slug": slug,
                            "status": (
                                "mirrored_from_local_media_reused"
                                if mirror_res.reused_existing
                                else "mirrored_from_local_media"
                            ),
                            "source_url": src,
                            "local_url": mirror_res.local_url,
                            "bytes": mirror_res.bytes_written,
                            "sha256": mirror_res.sha256,
                            "content_type": mirror_res.content_type,
                            "prior_local_cover": cover,
                        }
                    )
                    continue
                # fall through to record failure if mirroring local media source failed
                failures += 1
                if source_row is not None:
                    source_row["mirror_status"] = "mirror_failed_from_local_media"
                    source_row["mirror_last_checked_at"] = now_iso
                    source_row["mirror_error"] = mirror_res.error
                results.append(
                    {
                        "project_slug": slug,
                        "status": "mirror_failed_from_local_media",
                        "source_url": src,
                        "local_url": cover,
                        "file_exists": bool(exists),
                        "error": mirror_res.error,
                    }
                )
                continue

            unchanged_local += 1
            results.append(
                {
                    "project_slug": slug,
                    "status": "already_local_unchecked",
                    "source_url": cover,
                    "local_url": cover,
                    "file_exists": bool(exists),
                }
            )
            continue

        if not _is_external_url(cover):
            results.append(
                {
                    "project_slug": slug,
                    "status": "skipped_non_external_cover",
                    "source_url": cover,
                    "local_url": None,
                }
            )
            continue

        mirror_res = _mirror_one(
            project_slug=slug,
            source_url=cover,
            public_root=public_root,
            media_prefix=media_prefix,
            media_subdir=media_subdir,
            timeout=timeout,
            force=force,
        )

        if mirror_res.ok and mirror_res.local_url:
            old_cover = cover
            row["cover_image_url"] = mirror_res.local_url
            if row["cover_image_url"] != old_cover:
                rewritten_rows += 1
            if mirror_res.reused_existing:
                reused += 1
            else:
                mirrored += 1
            if source_row is not None:
                source_row["mirrored_local_path"] = mirror_res.local_url
                source_row["mirror_status"] = "mirrored_ok_reused" if mirror_res.reused_existing else "mirrored_ok"
                source_row["mirror_last_checked_at"] = now_iso
                source_row["mirror_file_sha256"] = mirror_res.sha256
                source_row["mirror_file_size_bytes"] = mirror_res.bytes_written
                source_row["mirror_source_url"] = mirror_res.source_url
                if mirror_res.content_type:
                    source_row["mirror_content_type"] = mirror_res.content_type
            results.append(
                {
                    "project_slug": slug,
                    "status": "mirrored_ok_reused" if mirror_res.reused_existing else "mirrored_ok",
                    "source_url": mirror_res.source_url,
                    "local_url": mirror_res.local_url,
                    "bytes": mirror_res.bytes_written,
                    "sha256": mirror_res.sha256,
                    "content_type": mirror_res.content_type,
                }
            )
        else:
            failures += 1
            if source_row is not None:
                source_row["mirror_status"] = "mirror_failed"
                source_row["mirror_last_checked_at"] = now_iso
                source_row["mirror_error"] = mirror_res.error
            results.append(
                {
                    "project_slug": slug,
                    "status": "mirror_failed",
                    "source_url": mirror_res.source_url,
                    "error": mirror_res.error,
                }
            )

    _write_json_list(projects_path, projects)
    _write_json_list(sources_path, sources)

    external_remaining = [
        {
            "slug": str(r.get("slug") or "").strip(),
            "cover_image_url": str(r.get("cover_image_url") or "").strip(),
        }
        for r in projects
        if _is_external_url(str(r.get("cover_image_url") or "").strip() or None)
    ]
    local_missing_files = []
    for r in projects:
        slug = str(r.get("slug") or "").strip()
        cover = str(r.get("cover_image_url") or "").strip() or None
        if not cover or not _is_local_media_path(cover, media_prefix):
            continue
        if not cover.startswith(prefix + "/" + media_subdir.strip("/") + "/"):
            continue
        local_abs = public_root / cover.lstrip("/")
        if not (local_abs.exists() and local_abs.is_file() and local_abs.stat().st_size > 0):
            local_missing_files.append({"slug": slug, "cover_image_url": cover, "expected_file": str(local_abs)})

    return {
        "summary": {
            "projects_total": len(projects),
            "mirrored_new_count": mirrored,
            "mirrored_from_local_media_count": mirrored_from_local_media,
            "reused_existing_count": reused,
            "unchanged_local_count": unchanged_local,
            "rewritten_project_rows": rewritten_rows,
            "failures_count": failures,
            "external_remaining_count": len(external_remaining),
            "local_missing_files_count": len(local_missing_files),
            "ok": failures == 0 and not external_remaining and not local_missing_files,
        },
        "config": {
            "import_dir": str(import_dir),
            "public_root": str(public_root),
            "media_prefix": prefix,
            "media_subdir": media_subdir.strip("/"),
        },
        "results": results,
        "external_remaining": external_remaining,
        "local_missing_files": local_missing_files,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Mirror external project cover images into local /media paths.")
    parser.add_argument("--input-dir", default=str(IMPORT_DIR), help="Import JSON dir (default: %(default)s)")
    parser.add_argument("--public-root", default=str(DEFAULT_PUBLIC_ROOT), help="Frontend public root where /media is stored (default: %(default)s)")
    parser.add_argument("--media-prefix", default=DEFAULT_MEDIA_PREFIX, help="Public media URL prefix (default: %(default)s)")
    parser.add_argument("--media-subdir", default=DEFAULT_MEDIA_SUBDIR, help="Project cover subdir under media prefix (default: %(default)s)")
    parser.add_argument("--timeout", type=int, default=45, help="HTTP timeout seconds per image (default: %(default)s)")
    parser.add_argument("--force", action="store_true", help="Re-download even if mirrored file already exists")
    parser.add_argument(
        "--origin-for-local-media",
        default="https://amppattaya.com",
        help="Origin used to fetch existing /media/... covers when local file is unavailable (default: %(default)s)",
    )
    parser.add_argument(
        "--write-report",
        nargs="?",
        const=str(DEFAULT_REPORT_PATH),
        help="Write mirror report JSON (default when flag present without value: ops/logs/project_cover_mirror_report.json)",
    )
    args = parser.parse_args()

    report = mirror_project_covers(
        import_dir=Path(args.input_dir),
        public_root=Path(args.public_root),
        media_prefix=args.media_prefix,
        media_subdir=args.media_subdir,
        timeout=max(5, int(args.timeout)),
        force=bool(args.force),
        origin_for_local_media=str(args.origin_for_local_media or ""),
    )

    print(json.dumps(report, ensure_ascii=False, indent=2))

    if args.write_report:
        out_path = Path(args.write_report)
        if not out_path.is_absolute():
            out_path = REPO_ROOT / out_path
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"\nWROTE:{out_path}")

    return 0 if bool(report.get("summary", {}).get("ok")) else 1


if __name__ == "__main__":
    raise SystemExit(main())
