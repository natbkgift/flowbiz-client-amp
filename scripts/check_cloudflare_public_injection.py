#!/usr/bin/env python3
"""Check public pages for Cloudflare client-side injection markers.

Usage:
  python scripts/check_cloudflare_public_injection.py
  python scripts/check_cloudflare_public_injection.py https://amppattaya.com/ https://amppattaya.com/th
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_URLS = [
    "https://amppattaya.com/",
    "https://amppattaya.com/en",
    "https://amppattaya.com/th",
    "https://amppattaya.com/en/projects",
    "https://amppattaya.com/th/projects",
]

PATTERNS = {
    "cloudflare_insights": re.compile(r"static\.cloudflareinsights\.com|beacon\.min\.js", re.I),
    "email_obfuscation": re.compile(r"/cdn-cgi/scripts/.+?/cloudflare-static/email-decode\.min\.js", re.I),
}


@dataclass
class CheckResult:
    url: str
    status: int | None
    final_url: str | None
    has_insights: bool
    has_email_decode: bool
    error: str | None = None


def fetch(url: str) -> CheckResult:
    request = Request(
        url,
        headers={
            "User-Agent": "AMP Pattaya runtime verifier/1.0",
            "Accept-Language": "th,en;q=0.8",
        },
    )
    try:
        with urlopen(request, timeout=20) as response:
            html = response.read().decode("utf-8", errors="replace")
            return CheckResult(
                url=url,
                status=getattr(response, "status", None),
                final_url=getattr(response, "url", None),
                has_insights=bool(PATTERNS["cloudflare_insights"].search(html)),
                has_email_decode=bool(PATTERNS["email_obfuscation"].search(html)),
            )
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return CheckResult(
            url=url,
            status=exc.code,
            final_url=exc.geturl(),
            has_insights=bool(PATTERNS["cloudflare_insights"].search(body)),
            has_email_decode=bool(PATTERNS["email_obfuscation"].search(body)),
            error=f"HTTP {exc.code}",
        )
    except URLError as exc:
        return CheckResult(
            url=url,
            status=None,
            final_url=None,
            has_insights=False,
            has_email_decode=False,
            error=str(exc.reason),
        )


def render(results: Iterable[CheckResult]) -> int:
    failed = False
    print("Cloudflare public injection check")
    print("=" * 34)
    for item in results:
        status = item.status if item.status is not None else "-"
        final_url = item.final_url or "-"
        insights = "YES" if item.has_insights else "no"
        email_decode = "YES" if item.has_email_decode else "no"
        error = item.error or "-"
        print(f"URL: {item.url}")
        print(f"  status: {status}")
        print(f"  final:  {final_url}")
        print(f"  insights marker:     {insights}")
        print(f"  email decode marker: {email_decode}")
        print(f"  error: {error}")
        if item.has_insights or item.has_email_decode or item.error:
            failed = True
    print("=" * 34)
    print("PASS" if not failed else "FAIL")
    return 1 if failed else 0


def main(argv: list[str]) -> int:
    urls = argv[1:] or DEFAULT_URLS
    results = [fetch(url) for url in urls]
    return render(results)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
