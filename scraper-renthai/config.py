from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ScraperConfig:
    api_base: str
    admin_token: str

    max_workers: int = 1
    min_delay_seconds: float = 2.0
    max_delay_seconds: float = 3.5
    max_requests_per_second: float = 1.0
    max_retries: int = 3

    stop_consecutive_403: int = 3

    log_every_n_requests: int = 50

    base_site: str = "https://renthai.com"
    start_projects_pattaya: str = "https://renthai.com/en/projects/pattaya/"
    start_sale: str = "https://renthai.com/en/property-for-sale/"
    start_rent: str = "https://renthai.com/en/property-for-rent/"

    user_agents: tuple[str, ...] = (
        (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/121.0 Safari/537.36"
        ),
        (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) "
            "Version/17.0 Safari/605.1.15"
        ),
        (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/121.0 Safari/537.36"
        ),
    )


def load_config() -> ScraperConfig:
    api_base = os.getenv("API_BASE", "https://amppattaya.com/api").rstrip("/")
    admin_token = os.getenv("ADMIN_TOKEN", "").strip()
    if not admin_token:
        raise SystemExit("Missing ADMIN_TOKEN env var")

    return ScraperConfig(api_base=api_base, admin_token=admin_token)
