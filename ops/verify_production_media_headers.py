#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from packages.core.media_path_policy import DEFAULT_LOCAL_MEDIA_FALLBACK


@dataclass
class HeaderCheckResult:
    url: str
    ok: bool
    status: int | None
    content_type: str | None
    expected_content_type_prefix: str
    error: str | None = None


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify deployed media headers for .webp/.avif")
    parser.add_argument("--base-url", required=True, help="Base site URL, e.g. https://example.com")
    parser.add_argument(
        "--webp-path",
        default=DEFAULT_LOCAL_MEDIA_FALLBACK,
        help="Public .webp path to verify",
    )
    parser.add_argument(
        "--avif-path",
        default="/media/library/variants/sample-check.avif",
        help="Public .avif path to verify",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=15.0,
        help="Request timeout in seconds",
    )
    parser.add_argument(
        "--write",
        default="ops/logs/production_media_header_check.json",
        help="Write JSON report to this path",
    )
    parser.add_argument("--no-write", action="store_true", help="Do not write JSON report")
    parser.add_argument("--strict", action="store_true", help="Exit 1 if any check fails")
    return parser.parse_args(argv)


def _join_url(base_url: str, path: str) -> str:
    return base_url.rstrip("/") + "/" + path.lstrip("/")


def _fetch_headers(url: str, *, timeout: float) -> tuple[int, dict[str, str]]:
    request = Request(url, method="HEAD")
    with urlopen(request, timeout=timeout) as response:
        status = getattr(response, "status", None) or response.getcode()
        headers = {key.lower(): value for key, value in response.headers.items()}
        return int(status), headers


def _check(url: str, expected_prefix: str, *, timeout: float) -> HeaderCheckResult:
    try:
        status, headers = _fetch_headers(url, timeout=timeout)
        content_type = headers.get("content-type")
        ok = 200 <= status < 300 and str(content_type or "").lower().startswith(expected_prefix)
        return HeaderCheckResult(
            url=url,
            ok=ok,
            status=status,
            content_type=content_type,
            expected_content_type_prefix=expected_prefix,
            error=None if ok else "unexpected_status_or_content_type",
        )
    except HTTPError as exc:
        return HeaderCheckResult(
            url=url,
            ok=False,
            status=exc.code,
            content_type=exc.headers.get("content-type") if exc.headers else None,
            expected_content_type_prefix=expected_prefix,
            error=f"http_error:{exc.code}",
        )
    except URLError as exc:
        return HeaderCheckResult(
            url=url,
            ok=False,
            status=None,
            content_type=None,
            expected_content_type_prefix=expected_prefix,
            error=f"url_error:{exc.reason}",
        )
    except Exception as exc:  # defensive for ops usage
        return HeaderCheckResult(
            url=url,
            ok=False,
            status=None,
            content_type=None,
            expected_content_type_prefix=expected_prefix,
            error=str(exc),
        )


def _write_report(path_str: str, payload: dict[str, Any]) -> None:
    out = Path(path_str)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    checks = [
        _check(_join_url(args.base_url, args.webp_path), "image/webp", timeout=args.timeout),
        _check(_join_url(args.base_url, args.avif_path), "image/avif", timeout=args.timeout),
    ]
    payload = {
        "base_url": args.base_url,
        "checks": [asdict(item) for item in checks],
        "all_ok": all(item.ok for item in checks),
    }

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if not args.no_write:
        _write_report(args.write, payload)

    if args.strict and not payload["all_ok"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
