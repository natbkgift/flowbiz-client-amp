from __future__ import annotations

import os
import re
import urllib.error
import urllib.parse
import urllib.request

from utils import ensure_dir, sha256_hex

_IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp")


def extract_image_urls(html_bytes: bytes, *, base_url: str) -> list[str]:
    html = html_bytes.decode("utf-8", errors="ignore")

    # Collect from common attributes.
    candidates = re.findall(
        r'(?:src|data-src|data-lazy-src|data-original)=["\']([^"\']+)["\']',
        html,
        flags=re.IGNORECASE,
    )

    out: list[str] = []
    seen: set[str] = set()

    for raw in candidates:
        raw = (raw or "").strip()
        if not raw or raw.startswith("data:"):
            continue

        abs_url = urllib.parse.urljoin(base_url, raw)
        parsed = urllib.parse.urlparse(abs_url)
        if parsed.scheme not in {"http", "https"}:
            continue

        path_lower = (parsed.path or "").lower()
        if not path_lower.endswith(_IMAGE_EXTS):
            continue

        if abs_url in seen:
            continue
        seen.add(abs_url)
        out.append(abs_url)

    # Deterministic ordering
    return sorted(out)


def _url_basename(url: str) -> str:
    path = urllib.parse.urlparse(url).path
    return path.rstrip("/").split("/")[-1]


def normalize_wm_url(url: str) -> str:
    """If basename starts with wm_, try the non-wm URL first (if it exists)."""
    base = _url_basename(url)
    if not base.lower().startswith("wm_"):
        return url

    non_wm = url.replace("/" + base, "/" + base[3:])
    if _url_exists(non_wm):
        return non_wm
    return url


def _url_exists(url: str) -> bool:
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = int(getattr(resp, "status", 200))
            return 200 <= status < 400
    except Exception:
        # Some origins/CDNs reject HEAD; do a tiny GET probe.
        try:
            req = urllib.request.Request(
                url,
                method="GET",
                headers={"Range": "bytes=0-0"},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                status = int(getattr(resp, "status", 200))
                return 200 <= status < 400
        except Exception:
            return False


def deterministic_filename(url: str, *, index: int) -> str:
    parsed = urllib.parse.urlparse(url)
    ext = os.path.splitext(parsed.path)[1].lower()
    if ext not in _IMAGE_EXTS:
        ext = ".jpg"

    digest = sha256_hex(url.encode("utf-8"))[:12]
    return f"{index:02d}_{digest}{ext}"


def download_images(
    image_urls: list[str],
    *,
    media_root: str,
    media_prefix: str,
    category: str,
    slug: str,
) -> tuple[list[str], str | None]:
    """Download images to local media path and return URL paths for DB."""

    if not image_urls:
        return [], None

    category = category.strip("/")
    slug = slug.strip("/")
    media_root = media_root.rstrip("/")
    media_prefix = "/" + media_prefix.strip("/")

    dest_dir = os.path.join(media_root, category, slug)
    ensure_dir(dest_dir)

    local_paths: list[str] = []

    for idx, original_url in enumerate(image_urls, start=1):
        url = normalize_wm_url(original_url)
        filename = deterministic_filename(url, index=idx)
        dest_path = os.path.join(dest_dir, filename)

        # Skip if already present (idempotent).
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
            local_paths.append(f"{media_prefix}/{category}/{slug}/{filename}")
            continue

        tmp_path = dest_path + ".tmp"

        try:
            req = urllib.request.Request(
                url,
                method="GET",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                with open(tmp_path, "wb") as f:
                    while True:
                        chunk = resp.read(1024 * 128)
                        if not chunk:
                            break
                        f.write(chunk)

            if os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 0:
                os.replace(tmp_path, dest_path)
                local_paths.append(f"{media_prefix}/{category}/{slug}/{filename}")
            else:
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
            # Best-effort: skip broken image.
            continue

    cover = local_paths[0] if local_paths else None
    return local_paths, cover
