from __future__ import annotations

import hashlib
import json
import os
import random
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from dataclasses import dataclass
from html import unescape


class StopScrapeError(Exception):
    pass


@dataclass
class FetchResult:
    url: str
    status: int
    headers: dict[str, str]
    body: bytes
    content_type: str


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def is_cloudflare_challenge(body: bytes) -> bool:
    text = body[:200_000].decode("utf-8", errors="ignore").lower()
    needles = [
        "attention required",
        "cloudflare",
        "cf-challenge",
        "challenge-platform",
        "just a moment",
    ]
    return any(n in text for n in needles)


def extract_links(html_bytes: bytes, *, base_url: str) -> set[str]:
    html = html_bytes.decode("utf-8", errors="ignore")
    # Cheap but effective for WP sites.
    hrefs = set(re.findall(r'href=["\']([^"\']+)["\']', html, flags=re.IGNORECASE))
    out: set[str] = set()
    for href in hrefs:
        href = unescape(href.strip())
        if not href or href.startswith("#"):
            continue
        abs_url = urllib.parse.urljoin(base_url, href)
        out.add(abs_url)
    return out


class RateLimiter:
    def __init__(self, *, max_per_second: float) -> None:
        self._min_interval = 1.0 / max_per_second if max_per_second > 0 else 0.0
        self._next_ok = 0.0

    def wait(self) -> None:
        now = time.monotonic()
        if now < self._next_ok:
            time.sleep(self._next_ok - now)
        self._next_ok = time.monotonic() + self._min_interval


class Progress:
    def __init__(self, *, log_every: int) -> None:
        self.total_requests = 0
        self.log_every = log_every

    def bump(self) -> None:
        self.total_requests += 1
        if self.total_requests % self.log_every == 0:
            print(f"[PROGRESS] crawled {self.total_requests} requests")


def load_robots_txt(base_site: str) -> urllib.robotparser.RobotFileParser:
    rp = urllib.robotparser.RobotFileParser()
    robots_url = urllib.parse.urljoin(base_site, "/robots.txt")
    rp.set_url(robots_url)
    try:
        rp.read()
    except urllib.error.URLError:
        # Fail-safe: if robots cannot be fetched, treat as disallow-all.
        rp.parse(["User-agent: *", "Disallow: /"])
    return rp


def can_fetch(rp: urllib.robotparser.RobotFileParser, user_agent: str, url: str) -> bool:
    try:
        return rp.can_fetch(user_agent, url)
    except Exception:
        return False


def fetch_url(
    url: str,
    *,
    user_agent: str,
    timeout_seconds: float,
    max_retries: int,
    rate_limiter: RateLimiter,
    min_delay: float,
    max_delay: float,
    progress: Progress,
    consecutive_403: list[int],
) -> FetchResult:
    last_exc: Exception | None = None

    for attempt in range(1, max_retries + 1):
        rate_limiter.wait()
        time.sleep(random.uniform(min_delay, max_delay))

        req = urllib.request.Request(
            url,
            method="GET",
            headers={
                "User-Agent": user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "close",
            },
        )

        progress.bump()

        try:
            with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
                status = int(getattr(resp, "status", 200))
                headers = {k.lower(): v for k, v in resp.headers.items()}
                body = resp.read()

            ct = headers.get("content-type", "")

            if status == 429:
                raise StopScrapeError("[STOP] rate-limit detected (429)")

            if status == 403:
                consecutive_403[0] += 1
                if consecutive_403[0] >= 3:
                    raise StopScrapeError("[STOP] consecutive 403 >= 3")
            elif status == 200:
                consecutive_403[0] = 0

            if is_cloudflare_challenge(body):
                raise StopScrapeError("[STOP] Cloudflare challenge detected")

            return FetchResult(url=url, status=status, headers=headers, body=body, content_type=ct)

        except StopScrapeError:
            raise
        except urllib.error.HTTPError as exc:
            last_exc = exc
            if exc.code == 429:
                raise StopScrapeError("[STOP] rate-limit detected (429)") from exc
            if exc.code == 403:
                consecutive_403[0] += 1
                if consecutive_403[0] >= 3:
                    raise StopScrapeError("[STOP] consecutive 403 >= 3") from exc
            # Retry on 5xx only.
            if 500 <= exc.code < 600 and attempt < max_retries:
                continue
            raise
        except Exception as exc:
            last_exc = exc
            if attempt < max_retries:
                continue
            raise

    raise RuntimeError(f"fetch failed unexpectedly: {last_exc}")


def extract_json_ld(html_bytes: bytes) -> list[dict]:
    html = html_bytes.decode("utf-8", errors="ignore")
    blocks = re.findall(
        r"<script[^>]+type=\"application/ld\+json\"[^>]*>(.*?)</script>",
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    out: list[dict] = []
    for b in blocks:
        b = b.strip()
        if not b:
            continue
        try:
            data = json.loads(b)
        except Exception:
            continue
        if isinstance(data, dict):
            out.append(data)
        elif isinstance(data, list):
            out.extend([x for x in data if isinstance(x, dict)])
    return out


def find_first_text(html_bytes: bytes, patterns: list[str]) -> str | None:
    html = html_bytes.decode("utf-8", errors="ignore")
    for p in patterns:
        m = re.search(p, html, flags=re.IGNORECASE)
        if m:
            return unescape(m.group(1)).strip()
    return None
