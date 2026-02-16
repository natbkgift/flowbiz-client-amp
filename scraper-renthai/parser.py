from __future__ import annotations

import re
import urllib.parse

from utils import extract_json_ld, find_first_text

_price_re = re.compile(r"([0-9][0-9,]+(?:\.[0-9]+)?)")


def _parse_price(text: str | None) -> float | None:
    if not text:
        return None
    m = _price_re.search(text.replace("\xa0", " "))
    if not m:
        return None
    raw = m.group(1).replace(",", "")
    try:
        return float(raw)
    except ValueError:
        return None


def _parse_int(text: str | None) -> int | None:
    if not text:
        return None
    m = re.search(r"(\d+)", text)
    if not m:
        return None
    try:
        return int(m.group(1))
    except ValueError:
        return None


def _parse_float(text: str | None) -> float | None:
    if not text:
        return None
    m = re.search(r"(\d+(?:\.\d+)?)", text)
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def parse_unit_detail(url: str, html: bytes) -> dict:
    parsed = urllib.parse.urlparse(url)
    slug = parsed.path.rstrip("/").split("/")[-1]

    data: dict[str, object] = {
        "url": url,
        "slug": slug,
        "title": None,
        "price": None,
        "address": None,
        "city": None,
        "project_name": None,
        "bedrooms": None,
        "bathrooms": None,
        "size": None,
    }

    # Prefer page-level metadata first (Renthai JSON-LD is often Organization-only).
    og_title = find_first_text(html, [r"<meta property=\"og:title\" content=\"([^\"]+)\""])
    if og_title:
        data["title"] = og_title

    og_desc = find_first_text(
        html, [r"<meta property=\"og:description\" content=\"([^\"]+)\""]
    )
    if isinstance(og_desc, str):
        # Example:
        # "For rent Condo 1 beds. 39 sq.m., price: 25000 thb, location: The Riviera Monaco, ..."
        if data["price"] is None:
            m = re.search(r"price:\s*([0-9][0-9,]+(?:\.[0-9]+)?)\s*thb", og_desc, re.I)
            if m:
                data["price"] = _parse_price(m.group(1))

        if not data["address"]:
            m = re.search(r"location:\s*([^,]+)", og_desc, re.I)
            if m:
                loc = m.group(1).strip()
                if loc:
                    data["address"] = loc
                    data["project_name"] = loc

    # Strategy 1: JSON-LD (only use listing-like blocks; ignore Organization-only blocks)
    for block in extract_json_ld(html):
        t = block.get("@type")
        if isinstance(t, str) and t.lower() in {"organization", "realestateagent"}:
            continue

        name = block.get("name")
        if isinstance(name, str) and not data["title"]:
            data["title"] = name.strip()

        offers = block.get("offers")
        if isinstance(offers, dict):
            price = offers.get("price")
            if isinstance(price, (int, float)):
                data["price"] = float(price)
            elif isinstance(price, str) and data["price"] is None:
                data["price"] = _parse_price(price)

        addr = block.get("address")
        if isinstance(addr, dict):
            street = addr.get("streetAddress")
            city = addr.get("addressLocality")
            if isinstance(street, str) and not data["address"]:
                data["address"] = street.strip()
            if isinstance(city, str) and not data["city"]:
                data["city"] = city.strip()

    # Strategy 2: common HTML patterns
    if not data["title"]:
        data["title"] = find_first_text(html, [r"<meta property=\"og:title\" content=\"([^\"]+)\""])

    if data["price"] is None:
        data["price"] = _parse_price(
            find_first_text(html, [r"Price\s*</[^>]+>\s*<[^>]+>\s*([^<]+)"])  # best-effort
        )

    # Renthai detail pages often show rent price like: "฿ 25,000" under "For rent".
    if data["price"] is None:
        data["price"] = _parse_price(
            find_first_text(
                html,
                [
                    r"For\s+rent\s*</[^>]+>\s*<[^>]+>\s*([^<]+)",
                    r"฿\s*([0-9][0-9,]+)",
                ],
            )
        )

    if not data["address"]:
        data["address"] = find_first_text(html, [r"Address\s*</[^>]+>\s*<[^>]+>\s*([^<]+)"])

    if not data["city"]:
        data["city"] = find_first_text(html, [r"Pattaya|Jomtien|Na Jomtien|Bang Saray"])

    if not data["bedrooms"]:
        data["bedrooms"] = _parse_int(
            find_first_text(html, [r"Bedrooms?\s*</[^>]+>\s*<[^>]+>\s*([^<]+)"])
        )

    if not data["bathrooms"]:
        data["bathrooms"] = _parse_int(
            find_first_text(html, [r"Bathrooms?\s*</[^>]+>\s*<[^>]+>\s*([^<]+)"])
        )

    if not data["size"]:
        data["size"] = _parse_float(find_first_text(html, [r"(\d+(?:\.\d+)?)\s*m²"]))

    # project name is optional
    if not data["project_name"]:
        data["project_name"] = find_first_text(html, [r"Project\s*</[^>]+>\s*<[^>]+>\s*([^<]+)"])

    return data
