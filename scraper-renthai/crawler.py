from __future__ import annotations

import random
import urllib.parse

from utils import (
    FetchResult,
    Progress,
    RateLimiter,
    StopScrapeError,
    can_fetch,
    extract_links,
    fetch_url,
)

from config import ScraperConfig


class Crawler:
    def __init__(
        self,
        *,
        cfg: ScraperConfig,
        robots,
        progress: Progress,
    ) -> None:
        self.cfg = cfg
        self.robots = robots
        self.progress = progress
        self.rate = RateLimiter(max_per_second=cfg.max_requests_per_second)
        self.consecutive_403 = [0]

    def _ua(self) -> str:
        return random.choice(self.cfg.user_agents)

    def get(self, url: str) -> FetchResult:
        ua = self._ua()
        if not can_fetch(self.robots, ua, url):
            raise StopScrapeError(f"[STOP] robots.txt disallows: {url}")

        return fetch_url(
            url,
            user_agent=ua,
            timeout_seconds=15.0,
            max_retries=self.cfg.max_retries,
            rate_limiter=self.rate,
            min_delay=self.cfg.min_delay_seconds,
            max_delay=self.cfg.max_delay_seconds,
            progress=self.progress,
            consecutive_403=self.consecutive_403,
        )

    def iter_paginated(self, start_url: str, *, max_pages: int = 50) -> list[FetchResult]:
        seen: set[str] = set()
        results: list[FetchResult] = []

        url = start_url
        for _ in range(max_pages):
            if url in seen:
                break
            seen.add(url)

            r = self.get(url)
            results.append(r)

            links = extract_links(r.body, base_url=url)
            next_url = None
            for link in links:
                if link == url:
                    continue
                # Common WP pagination patterns.
                if "page/" in link and link.rstrip("/").startswith(url.rstrip("/") + "/page"):
                    next_url = link
                    break
                if "?paged=" in link and link.startswith(url.split("?")[0]):
                    next_url = link
                    break
            if not next_url:
                break
            url = next_url

        return results


def normalize_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    return parsed._replace(fragment="").geturl()
