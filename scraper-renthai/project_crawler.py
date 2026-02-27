from __future__ import annotations

import re
import urllib.parse

from crawler import Crawler, normalize_url
from utils import extract_links


def discover_project_urls(crawler: Crawler, start_url: str) -> list[str]:
    resp = crawler.get(start_url)
    links = extract_links(resp.body, base_url=start_url)

    projects: set[str] = set()
    for link in links:
        link = normalize_url(link)
        if "/en/projects/" in link and link.rstrip("/").startswith(
            "https://renthai.com/en/projects/"
        ):
            # Keep only detail pages /en/projects/{slug}/, not the listing.
            parts = link.rstrip("/").split("/")
            if len(parts) >= 6 and parts[-2] == "projects":
                continue
            if link.rstrip("/") == start_url.rstrip("/"):
                continue
            projects.add(link)

    return sorted(projects)


def discover_unit_urls_from_pages(crawler: Crawler, urls: list[str]) -> set[str]:
    def is_unit_detail(url: str) -> bool:
        if url.startswith("https://renthai.com/en/property/"):
            return True

        parsed = urllib.parse.urlparse(url)
        if parsed.netloc != "renthai.com":
            return False
        path = parsed.path.rstrip("/") + "/"
        # Observed patterns on listing pages:
        # - /en/condo-for-sale/3389/
        # - /en/villa-for-sale/3432/
        # - /en/house-for-sale/3471/
        # - /en/condo-for-rent/1234/
        return bool(re.match(r"^/en/[a-z-]+-for-(sale|rent)/\d+/$", path))

    out: set[str] = set()
    for u in urls:
        pages = crawler.iter_paginated(u)
        for p in pages:
            links = extract_links(p.body, base_url=p.url)
            for link in links:
                link = normalize_url(link)
                if is_unit_detail(link):
                    out.add(link)
    return out
