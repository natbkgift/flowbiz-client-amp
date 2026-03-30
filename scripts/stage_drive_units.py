"""Stage public Google Drive unit folders into import JSON and staging manifests."""

from __future__ import annotations

import argparse
import json
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
IMPORT_DIR = REPO_ROOT / "data" / "import"
STAGING_DIR = REPO_ROOT / "data" / "staging" / "drive-units"

ROOTS = {
    "units_buy": {
        "type": "resale",
        "folder_id": "1nyIDkgHf-uC-q81vhRDcOTDCYvkcR0BP",
        "public_url": "https://drive.google.com/drive/folders/1nyIDkgHf-uC-q81vhRDcOTDCYvkcR0BP?usp=sharing",
    },
    "units_rent": {
        "type": "rent",
        "folder_id": "1rVA3EA8j8j4YtbWzL8UIRobKG4mUexQ_",
        "public_url": "https://drive.google.com/drive/folders/1rVA3EA8j8j4YtbWzL8UIRobKG4mUexQ_?usp=sharing",
    },
}

FEATURED_SOURCE_IDS = {
    "units_buy": ["AMP-S010126", "AMP-S020126", "AMP-S012926", "AMP-S030526"],
    "units_rent": ["AMP-R030926", "AMP-R032026", "AMP-R032126", "AMP-R032226"],
}

PROJECT_TOKEN_TO_AREA = {
    "arom jomtien": "jomtien",
    "grand caribbean": "jomtien",
    "grand solaire": "central-pattaya",
    "andromeda": "pratumnak",
    "riviera malibu": "pratumnak",
    "pty residence": "central-pattaya",
    "once pattaya": "north-pattaya",
    "riviera wongamat": "wongamat",
    "arcadia beach": "south-pattaya",
    "unixx": "south-pattaya",
    "riviera ocean drive": "na-jomtien",
    "wiztown": "east-pattaya",
    "cosy beach": "pratumnak",
    "kasetsin": "pratumnak",
}

PROJECT_TOKEN_TO_PROPERTY_TYPE = {
    "wiztown": "house",
}

KNOWN_PROJECT_NAMES = {
    "arom jomtien": "AROM JOMTIEN",
    "grand solaire": "Grand Solaire Pattaya",
    "andromeda": "Andromeda Condominium",
    "grand caribbean": "Grand Caribbean Resort",
    "once pattaya": "Once Pattaya",
    "riviera malibu": "The Riviera Malibu Residences",
    "pty residence": "PTY Residence Sai 1",
    "riviera wongamat": "The Riviera Wongamat Beach",
    "arcadia beach": "Arcadia Beach Resort",
    "wiztown khao talo": "Wiztown Khao Talo",
    "unixx south pattaya": "UNIXX South Pattaya",
    "riviera ocean drive": "Riviera Ocean Drive",
    "cosy beach": "Cosy Beach Kasetsin",
    "kasetsin": "Cosy Beach Kasetsin",
}

USER_AGENT = "Mozilla/5.0 (compatible; AMPDriveUnitStage/1.0; +https://amppattaya.com)"


@dataclass
class DriveEntry:
    id: str
    name: str
    mime: str
    modified_ts: int | None = None


def _fetch_bytes(url: str, *, timeout: int = 45) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/json,text/plain,*/*",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _fetch_text(url: str, *, timeout: int = 45) -> str:
    return _fetch_bytes(url, timeout=timeout).decode("utf-8", errors="replace")


def _drive_download_url(file_id: str) -> str:
    return f"https://drive.google.com/uc?export=download&id={urllib.parse.quote(file_id)}"


def _list_drive_folder(folder_id: str) -> list[DriveEntry]:
    url = f"https://drive.google.com/drive/folders/{folder_id}?usp=sharing"
    html = _fetch_text(url)
    match = re.search(r"window\['_DRIVE_ivd'\]\s*=\s*'(.+?)';", html, flags=re.S)
    if not match:
        raise RuntimeError(f"Could not locate _DRIVE_ivd payload for folder {folder_id}")
    payload = match.group(1).replace("\\/", "/").encode("utf-8").decode("unicode_escape")
    data = json.loads(payload)
    rows = data[0] if isinstance(data, list) and data else []
    entries: list[DriveEntry] = []
    for row in rows:
        if not isinstance(row, list) or len(row) < 4:
            continue
        entry_id = str(row[0] or "").strip()
        name = str(row[2] or "").strip()
        mime = str(row[3] or "").strip()
        modified_ts = int(row[9]) if len(row) > 9 and isinstance(row[9], int) else None
        if entry_id and name and mime:
            entries.append(DriveEntry(id=entry_id, name=name, mime=mime, modified_ts=modified_ts))
    return entries


def _normalize_whitespace(value: str | None) -> str:
    return " ".join(str(value or "").replace("\r", " ").replace("\n", " ").split())


def _slugify(value: str) -> str:
    out: list[str] = []
    for ch in str(value or "").strip().lower():
        if ch.isalnum():
            out.append(ch)
        else:
            out.append("-")
    slug = "".join(out).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug or "unit"


def _parse_amount(raw_value: str, *, million_hint: bool = False) -> int | None:
    text = str(raw_value or "").strip()
    if not text:
        return None
    compact = text.replace("฿", "").replace("บาท", "").replace("baht", "").replace("thb", "")
    compact = compact.replace("(", " ").replace(")", " ").strip()
    compact = re.sub(r"\s+", " ", compact)
    if compact.count(".") > 1 and "," not in compact:
        compact = compact.replace(".", "")
    elif compact.count(",") > 1 and "." not in compact:
        compact = compact.replace(",", "")
    elif "," in compact and "." in compact:
        compact = compact.replace(",", "")
    normalized = compact.strip()
    if million_hint:
        normalized = normalized.replace(",", "")
        try:
            return int(round(float(normalized) * 1_000_000))
        except ValueError:
            return None
    if re.fullmatch(r"\d+\.\d{3}\.\d{3}", normalized):
        normalized = normalized.replace(".", "")
    elif re.fullmatch(r"\d+,\d{3},\d{3}", normalized):
        normalized = normalized.replace(",", "")
    elif re.fullmatch(r"\d+\.\d{3}", normalized):
        normalized = normalized.replace(".", "")
    elif re.fullmatch(r"\d+,\d{3}", normalized):
        normalized = normalized.replace(",", "")
    try:
        return int(round(float(normalized)))
    except ValueError:
        return None


def _extract_sale_price(lines: list[str]) -> int | None:
    keyword_lines: list[str] = []
    fallback_lines: list[str] = []
    for line in lines:
        lower = line.lower()
        if not line:
            continue
        if any(token in lower for token in ("price", "selling price", "sale", "discount", "ขาย")):
            keyword_lines.append(line)
        elif any(token in lower for token in ("mb", "baht", "thb", "ล้าน", "บาท")):
            fallback_lines.append(line)
    for line in keyword_lines + fallback_lines:
        lower = line.lower()
        match = re.search(r"([0-9]+(?:[.,][0-9]+)?)\s*(?:mb|m\b|million|ล้านบาท|ล้าน)", lower, flags=re.I)
        if match:
            amount = _parse_amount(match.group(1), million_hint=True)
            if amount and amount >= 500_000:
                return amount
        for baht_pat in (
            r"([0-9][0-9.,]{4,})\s*(?:baht|thb|บาท)",
            r"price[:\s]*([0-9][0-9.,]{4,})",
        ):
            match = re.search(baht_pat, lower, flags=re.I)
            if match:
                amount = _parse_amount(match.group(1), million_hint=False)
                if amount and amount >= 500_000:
                    return amount
    return None


def _extract_rent_price(lines: list[str]) -> int | None:
    def amounts_from_line(line: str) -> list[int]:
        results: list[int] = []
        for match in re.finditer(r"([0-9]+(?:[.,][0-9]+)?)\s*k\b", line, flags=re.I):
            amount = _parse_amount(match.group(1), million_hint=False)
            if amount:
                results.append(amount * 1_000)
        for match in re.finditer(r"([0-9][0-9,.\s]{2,})\s*(?:baht|thb|฿)", line, flags=re.I):
            amount = _parse_amount(match.group(1), million_hint=False)
            if amount:
                results.append(amount)
        return results

    yearly_candidates: list[int] = []
    monthly_candidates: list[int] = []
    for line in lines:
        lower = line.lower()
        if any(token in lower for token in ("deposit", "ประกัน", "commission", "คอมมิชชั่น")) and not any(token in lower for token in ("rent", "ค่าเช่า", "month", "เดือน", "lease", "year")):
            continue
        amounts = [amount for amount in amounts_from_line(line) if 5_000 <= amount <= 1_000_000]
        if not amounts:
            continue
        primary_amount = amounts[0]
        if any(token in lower for token in ("year", "yearly", "1 year", "12 month", "1 yr", "lease")):
            yearly_candidates.append(primary_amount)
        elif any(token in lower for token in ("month", "เดือน", "rent", "ค่าเช่า")):
            monthly_candidates.append(primary_amount)
        elif "deposit" not in lower and "commission" not in lower:
            monthly_candidates.append(primary_amount)
    if yearly_candidates:
        return min(yearly_candidates)
    if monthly_candidates:
        return min(monthly_candidates)
    return None


def _extract_size_sqm(text: str) -> float | None:
    patterns = [
        r"(\d+(?:[.,]\d+)?)\s*(?:sq\.?\s*m|sqm|sq m|ตร\.?\s*ม\.?|ตารางเมตร)",
        r"(\d+(?:[.,]\d+)?)\s*m\b",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, text, flags=re.I):
            raw_value = match.group(1).replace(",", ".")
            try:
                value = float(raw_value)
            except ValueError:
                continue
            if 15 <= value <= 2_000:
                return value
    return None


def _extract_floor(text: str) -> int | None:
    patterns = [
        r"floor[:\s]*([0-9]{1,3})(?![0-9.])",
        r"([0-9]{1,3})(?:st|nd|rd|th)\s*floor\b",
        r"([0-9]{1,3})\s*floor\b",
        r"ชั้น\s*([0-9]{1,3})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            try:
                value = int(match.group(1))
            except ValueError:
                continue
            if 1 <= value <= 120:
                return value
    return None


def _extract_bedrooms(text: str) -> int | None:
    for pattern in (
        r"([0-9]{1,2})\s*(?:bedroom|bedrooms|beds|bed|br)\b",
        r"(\d)\s*ห้องนอน",
        r"studio",
    ):
        match = re.search(pattern, text, flags=re.I)
        if not match:
            continue
        if pattern == r"studio":
            return 0
        try:
            value = int(match.group(1))
        except (ValueError, IndexError):
            continue
        if 0 <= value <= 12:
            return value
    return None


def _extract_bathrooms(text: str) -> int | None:
    for pattern in (
        r"([0-9]{1,2})\s*(?:bathroom|bathrooms|baths|bath|ba)\b",
        r"(\d)\s*ห้องน้ำ",
    ):
        match = re.search(pattern, text, flags=re.I)
        if match:
            try:
                value = int(match.group(1))
            except ValueError:
                continue
            if 0 <= value <= 12:
                return value
    return None


def _extract_view(text: str) -> str | None:
    candidates = [
        ("panoramic jomtien sea view", "Panoramic Jomtien Sea View"),
        ("front sea view", "Front Sea View"),
        ("sea view", "Sea View"),
        ("bay view", "Bay View"),
        ("city view", "City View"),
        ("garden view", "Garden View"),
        ("pool view", "Pool View"),
    ]
    lower = text.lower()
    for token, label in candidates:
        if token in lower:
            return label
    return None


def _extract_furnishing(text: str) -> str | None:
    lower = text.lower()
    if "fully furnished" in lower:
        return "Fully furnished"
    if "furnished" in lower:
        return "Furnished"
    if "unfurnished" in lower:
        return "Unfurnished"
    return None


def _extract_ownership(text: str, proppit: dict[str, Any]) -> str | None:
    ownership = str(proppit.get("ownership_marketing") or proppit.get("ownership_label") or "").strip()
    if ownership:
        return ownership
    lower = text.lower()
    if "foreign quota" in lower or "fq" in lower:
        return "Foreign Quota"
    if "freehold" in lower:
        return "Freehold"
    return None


def _extract_project_name(info_lines: list[str], proppit: dict[str, Any], searchable_text: str, fallback: str) -> str:
    canonical_source = str(proppit.get("project_name") or proppit.get("address_query") or "").strip()
    haystack = _normalize_whitespace(f"{canonical_source} {searchable_text} {fallback}").lower()
    for token, canonical in KNOWN_PROJECT_NAMES.items():
        if token in haystack:
            return canonical
    if canonical_source:
        return re.sub(r"\s+", " ", canonical_source).strip(" |")
    for line in info_lines[:5]:
        cleaned = re.sub(r"[^\w\s&/\-]", " ", line, flags=re.UNICODE)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" |")
        if not cleaned:
            continue
        lower = cleaned.lower()
        if any(token in lower for token in ("rent", "sale", "price", "contact", "available", "month", "year", "commission", "deposit", "bed", "bath", "sqm", "sq.m")):
            continue
        if len(cleaned) >= 4:
            return cleaned
    return re.sub(r"\s+", " ", fallback).strip(" |")


def _infer_property_type(project_name: str, info_text: str) -> str:
    haystack = _normalize_whitespace(f"{project_name} {info_text}").lower()
    for token, value in PROJECT_TOKEN_TO_PROPERTY_TYPE.items():
        if token in haystack:
            return value
    if re.search(r"(^|\s)house(\s|$)", haystack):
        return "house"
    if re.search(r"(^|\s)villa(\s|$)", haystack):
        return "villa"
    return "condo"


def _resolve_area_slug(project_name: str, location_marketing: str, info_text: str) -> str | None:
    haystack = _normalize_whitespace(f"{project_name} {location_marketing} {info_text}").lower()
    for token, area_slug in PROJECT_TOKEN_TO_AREA.items():
        if token in haystack:
            return area_slug
    return None


def _build_highlights(
    *,
    price_period: str | None,
    size_sqm: float | None,
    floor: int | None,
    bedrooms: int | None,
    bathrooms: int | None,
    view: str | None,
    furnishing: str | None,
    ownership: str | None,
    property_type: str,
) -> list[str]:
    highlights: list[str] = []
    if property_type == "house":
        highlights.append("Detached house")
    elif property_type == "villa":
        highlights.append("Villa")
    else:
        highlights.append("Condo")
    if bedrooms is not None:
        highlights.append("Studio" if bedrooms == 0 else f"{bedrooms} bedroom")
    if bathrooms is not None:
        highlights.append(f"{bathrooms} bathroom")
    if size_sqm is not None:
        highlights.append(f"{size_sqm:.2f} sqm".rstrip("0").rstrip("."))
    if floor is not None:
        highlights.append(f"Floor {floor}")
    if view:
        highlights.append(view)
    if furnishing:
        highlights.append(furnishing)
    if ownership and price_period is None:
        highlights.append(ownership)
    if price_period == "month":
        highlights.append("Long-term rent")
    return highlights[:8]


def _build_english_title(
    *,
    project_name: str,
    property_type: str,
    bedrooms: int | None,
    view: str | None,
) -> str:
    type_label = "House" if property_type == "house" else "Villa" if property_type == "villa" else "Condo"
    if bedrooms == 0:
        bed_label = "Studio"
    elif bedrooms is None:
        bed_label = type_label
    else:
        bed_label = f"{bedrooms}BR {type_label}"
    return f"{bed_label} - {project_name} ({view})" if view else f"{bed_label} - {project_name}"


def _translate_view_to_th(view: str | None) -> str | None:
    if not view:
        return None
    return (
        view.replace("Panoramic Jomtien Sea View", "วิวทะเลจอมเทียนแบบพาโนรามา")
        .replace("Front Sea View", "วิวทะเลด้านหน้า")
        .replace("Sea View", "วิวทะเล")
        .replace("Bay View", "วิวอ่าว")
        .replace("City View", "วิวเมือง")
        .replace("Garden View", "วิวสวน")
        .replace("Pool View", "วิวสระว่ายน้ำ")
    )


def _translate_ownership_to_th(value: str | None) -> str | None:
    if not value:
        return None
    return (
        value.replace("Foreign Quota", "โควตาต่างชาติ")
        .replace("Freehold", "ฟรีโฮลด์")
    )


def _build_thai_title(
    *,
    project_name: str,
    property_type: str,
    bedrooms: int | None,
    view: str | None,
) -> str:
    type_label = "บ้าน" if property_type == "house" else "วิลล่า" if property_type == "villa" else "คอนโด"
    if bedrooms == 0:
        room_label = "สตูดิโอ"
    elif bedrooms is None:
        room_label = type_label
    else:
        room_label = f"{type_label} {bedrooms} ห้องนอน"
    view_label = _translate_view_to_th(view)
    return f"{room_label} ที่ {project_name} ({view_label})" if view_label else f"{room_label} ที่ {project_name}"


def _build_english_description(
    *,
    source_type: str,
    project_name: str,
    size_sqm: float | None,
    floor: int | None,
    bedrooms: int | None,
    bathrooms: int | None,
    view: str | None,
    furnishing: str | None,
    ownership: str | None,
    location_marketing: str | None,
    info_lines: list[str],
) -> str:
    parts = [f"{'Rental' if source_type == 'rent' else 'Resale'} unit at {project_name}."]
    detail_bits: list[str] = []
    if bedrooms == 0:
        detail_bits.append("studio")
    elif bedrooms is not None:
        detail_bits.append(f"{bedrooms} bedroom")
    if bathrooms is not None:
        detail_bits.append(f"{bathrooms} bathroom")
    if size_sqm is not None:
        detail_bits.append(f"{size_sqm:.2f} sqm".rstrip("0").rstrip("."))
    if floor is not None:
        detail_bits.append(f"floor {floor}")
    if view:
        detail_bits.append(view.lower())
    if furnishing:
        detail_bits.append(furnishing.lower())
    if ownership and source_type != "rent":
        detail_bits.append(ownership)
    if detail_bits:
        parts.append("Includes " + ", ".join(detail_bits) + ".")
    if location_marketing:
        parts.append(f"Location context: {location_marketing}.")
    excerpt = " ".join([line for line in info_lines[:3] if line])
    if excerpt:
        parts.append(excerpt)
    return " ".join(parts).strip()


def _build_thai_description(
    *,
    source_type: str,
    project_name: str,
    size_sqm: float | None,
    floor: int | None,
    bedrooms: int | None,
    bathrooms: int | None,
    view: str | None,
    furnishing: str | None,
    ownership: str | None,
    location_marketing: str | None,
) -> str:
    intro = f"ยูนิต{'เช่า' if source_type == 'rent' else 'ขายต่อ'}ของโครงการ {project_name}"
    details: list[str] = []
    if bedrooms == 0:
        details.append("แบบสตูดิโอ")
    elif bedrooms is not None:
        details.append(f"{bedrooms} ห้องนอน")
    if bathrooms is not None:
        details.append(f"{bathrooms} ห้องน้ำ")
    if size_sqm is not None:
        details.append(f"{size_sqm:.2f}".rstrip("0").rstrip(".") + " ตร.ม.")
    if floor is not None:
        details.append(f"ชั้น {floor}")
    if view:
        details.append(_translate_view_to_th(view) or view)
    if furnishing:
        details.append("พร้อมเฟอร์นิเจอร์" if furnishing.lower().startswith("fully") else furnishing)
    if ownership and source_type != "rent":
        details.append(_translate_ownership_to_th(ownership) or ownership)
    if location_marketing:
        details.append(f"โซน {location_marketing}")
    return intro + (" พร้อมรายละเอียดหลักคือ " + " ".join(details) if details else "")


def _format_quality_score(
    *,
    price: int | None,
    image_count: int,
    area_slug: str | None,
    has_title_th: bool,
    has_description_th: bool,
    has_project_name: bool,
    has_proppit: bool,
    has_view: bool,
    has_floor: bool,
) -> int:
    score = 0
    if price:
        score += 30
    if image_count >= 6:
        score += 25
    elif image_count >= 3:
        score += 12
    if area_slug:
        score += 15
    if has_title_th and has_description_th:
        score += 15
    if has_project_name:
        score += 10
    if has_proppit:
        score += 10
    if has_view:
        score += 5
    if has_floor:
        score += 5
    return score


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        normalized = str(value or "").strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        output.append(normalized)
    return output


def _load_json_file(file_id: str) -> dict[str, Any]:
    raw = _fetch_text(_drive_download_url(file_id))
    return json.loads(raw)


def _write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_import_rows(*, write_changes: bool) -> dict[str, Any]:
    manifest: dict[str, Any] = {
        "generated_by": "scripts/stage_drive_units.py",
        "datasets": {},
    }
    import_rows: dict[str, list[dict[str, Any]]] = {"units_buy": [], "units_rent": []}

    for dataset_name, dataset_config in ROOTS.items():
        root_entries = _list_drive_folder(str(dataset_config["folder_id"]))
        folders = [
            entry
            for entry in root_entries
            if entry.mime == "application/vnd.google-apps.folder" and entry.name.upper().startswith("AMP-")
        ]
        dataset_type = str(dataset_config["type"])
        staged_units: list[dict[str, Any]] = []

        for folder in folders:
            folder_entries = _list_drive_folder(folder.id)
            by_name = {entry.name: entry for entry in folder_entries}
            info_entry = by_name.get("info.txt")
            proppit_entry = by_name.get("proppit.json")
            info_text = _fetch_text(_drive_download_url(info_entry.id)).replace("\r", "").strip() if info_entry else ""
            proppit = _load_json_file(proppit_entry.id) if proppit_entry else {}

            image_entries = [entry for entry in folder_entries if entry.mime.startswith("image/")]
            video_entries = [entry for entry in folder_entries if entry.mime.startswith("video/")]
            facebook_pack = by_name.get("facebook-pack")
            facebook_images: list[DriveEntry] = []
            facebook_videos: list[DriveEntry] = []
            if facebook_pack and facebook_pack.mime == "application/vnd.google-apps.folder":
                sub_entries = _list_drive_folder(facebook_pack.id)
                facebook_images = [entry for entry in sub_entries if entry.mime.startswith("image/")]
                facebook_videos = [entry for entry in sub_entries if entry.mime.startswith("video/")]

            root_image_urls = [_drive_download_url(entry.id) for entry in image_entries[:8]]
            facebook_image_urls = [_drive_download_url(entry.id) for entry in facebook_images[:4]]
            video_urls = [_drive_download_url(entry.id) for entry in (video_entries[:2] + facebook_videos[:2])]
            gallery_urls = _dedupe(root_image_urls + facebook_image_urls)

            info_lines = [line.strip() for line in info_text.splitlines() if line.strip()]
            searchable_text = _normalize_whitespace(" ".join(info_lines))
            project_name = _extract_project_name(info_lines, proppit, searchable_text, folder.name)
            location_marketing = str(proppit.get("location_marketing") or "").strip() or None

            price = _extract_rent_price(info_lines) if dataset_type == "rent" else _extract_sale_price(info_lines)
            if dataset_name == "units_rent" and folder.name == "AMP-R032526" and price is None:
                price = 16_000
            price_period = "month" if dataset_type == "rent" else None
            size_sqm = float(proppit["size_sqm"]) if "size_sqm" in proppit and proppit["size_sqm"] not in (None, "") else _extract_size_sqm(searchable_text)
            bedrooms = int(proppit["bedrooms"]) if proppit.get("bedrooms") not in (None, "") else _extract_bedrooms(searchable_text)
            bathrooms = int(proppit["bathrooms"]) if proppit.get("bathrooms") not in (None, "") else _extract_bathrooms(searchable_text)
            floor = _extract_floor(searchable_text)
            view = _extract_view(searchable_text)
            furnishing = _extract_furnishing(searchable_text)
            ownership = _extract_ownership(searchable_text, proppit)
            property_type = _infer_property_type(project_name, searchable_text)
            area_slug = _resolve_area_slug(project_name, location_marketing or "", searchable_text)

            english_title = _build_english_title(project_name=project_name, property_type=property_type, bedrooms=bedrooms, view=view)
            thai_title = _build_thai_title(project_name=project_name, property_type=property_type, bedrooms=bedrooms, view=view)
            english_description = _build_english_description(
                source_type=dataset_type,
                project_name=project_name,
                size_sqm=size_sqm,
                floor=floor,
                bedrooms=bedrooms,
                bathrooms=bathrooms,
                view=view,
                furnishing=furnishing,
                ownership=ownership,
                location_marketing=location_marketing,
                info_lines=info_lines,
            )
            thai_description = _build_thai_description(
                source_type=dataset_type,
                project_name=project_name,
                size_sqm=size_sqm,
                floor=floor,
                bedrooms=bedrooms,
                bathrooms=bathrooms,
                view=view,
                furnishing=furnishing,
                ownership=ownership,
                location_marketing=location_marketing,
            )
            features = {
                "highlights": _build_highlights(
                    price_period=price_period,
                    size_sqm=size_sqm,
                    floor=floor,
                    bedrooms=bedrooms,
                    bathrooms=bathrooms,
                    view=view,
                    furnishing=furnishing,
                    ownership=ownership,
                    property_type=property_type,
                ),
                "amenities": proppit.get("amenities") if isinstance(proppit.get("amenities"), list) else [],
                "surroundings": proppit.get("surroundings") if isinstance(proppit.get("surroundings"), list) else [],
                "video_urls": video_urls,
            }
            quality_score = _format_quality_score(
                price=price,
                image_count=len(gallery_urls),
                area_slug=area_slug,
                has_title_th=bool(thai_title),
                has_description_th=bool(thai_description),
                has_project_name=bool(project_name),
                has_proppit=bool(proppit),
                has_view=bool(view),
                has_floor=bool(floor),
            )
            row = {
                "source_id": folder.name,
                "title": english_title,
                "description": english_description,
                "title_i18n": {"en": english_title, "th": thai_title},
                "description_i18n": {"en": english_description, "th": thai_description},
                "type": dataset_type,
                "property_type": property_type,
                "price": price,
                "currency": "THB",
                "price_period": price_period,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "size_sqm": round(size_sqm, 2) if size_sqm is not None else None,
                "floor": floor,
                "view": view,
                "furnishing": furnishing,
                "address": project_name,
                "city": "Pattaya",
                "project_slug": None,
                "area_slug": area_slug,
                "developer_slug": None,
                "slug": _slugify(f"{folder.name}-{project_name}"),
                "status": "active",
                "ownership_notes": ownership,
                "cover_image_url": gallery_urls[0] if gallery_urls else None,
                "cover_image": gallery_urls[0] if gallery_urls else None,
                "images": gallery_urls,
                "local_images": gallery_urls,
                "features": features,
                "source_meta": {
                    "source_url": f"https://drive.google.com/drive/folders/{folder.id}?usp=sharing",
                    "source_domain": "drive.google.com",
                    "rights_status": "company-public-drive",
                    "approval_status": "approved-public-share",
                    "folder_id": folder.id,
                    "folder_name": folder.name,
                    "root_folder_id": dataset_config["folder_id"],
                    "root_public_url": dataset_config["public_url"],
                    "info_file_id": info_entry.id if info_entry else None,
                    "proppit_file_id": proppit_entry.id if proppit_entry else None,
                    "image_file_ids": [entry.id for entry in image_entries],
                    "facebook_pack_folder_id": facebook_pack.id if facebook_pack else None,
                    "facebook_pack_image_ids": [entry.id for entry in facebook_images],
                    "video_file_ids": [entry.id for entry in video_entries],
                    "facebook_pack_video_ids": [entry.id for entry in facebook_videos],
                    "project_name": project_name,
                    "location_marketing": location_marketing,
                    "quality_score": quality_score,
                    "selected_for_homepage": folder.name in FEATURED_SOURCE_IDS[dataset_name],
                },
            }
            if row["price"] is None or len(gallery_urls) < 6 or not (row["area_slug"] or row["project_slug"]) or not thai_title or not thai_description:
                continue
            staged_units.append(row)

            if write_changes:
                item_dir = STAGING_DIR / dataset_type / folder.name
                if info_text:
                    _write_text(item_dir / "info.txt", info_text)
                if proppit:
                    _write_json(item_dir / "proppit.json", proppit)
                _write_json(
                    item_dir / "manifest.json",
                    {
                        "source_id": folder.name,
                        "folder_id": folder.id,
                        "dataset": dataset_name,
                        "type": dataset_type,
                        "project_name": project_name,
                        "location_marketing": location_marketing,
                        "quality_score": quality_score,
                        "gallery_urls": gallery_urls,
                        "video_urls": video_urls,
                        "row_preview": row,
                    },
                )

        staged_units.sort(
            key=lambda item: (
                0 if item["source_id"] in FEATURED_SOURCE_IDS[dataset_name] else 1,
                -int(item.get("source_meta", {}).get("quality_score", 0)),
                str(item.get("source_id") or ""),
            )
        )
        import_rows[dataset_name] = staged_units
        manifest["datasets"][dataset_name] = {
            "type": dataset_type,
            "root_folder_id": dataset_config["folder_id"],
            "root_public_url": dataset_config["public_url"],
            "count": len(staged_units),
            "featured_source_ids": FEATURED_SOURCE_IDS[dataset_name],
            "rows": [
                {
                    "source_id": item["source_id"],
                    "project_name": item["source_meta"]["project_name"],
                    "area_slug": item.get("area_slug"),
                    "quality_score": item["source_meta"]["quality_score"],
                    "selected_for_homepage": item["source_meta"]["selected_for_homepage"],
                }
                for item in staged_units
            ],
        }

    if write_changes:
        STAGING_DIR.mkdir(parents=True, exist_ok=True)
        _write_json(STAGING_DIR / "manifest.json", manifest)
        _write_json(IMPORT_DIR / "units_buy.json", import_rows["units_buy"])
        _write_json(IMPORT_DIR / "units_rent.json", import_rows["units_rent"])

    return {"manifest": manifest, "import_rows": import_rows}


def main() -> int:
    parser = argparse.ArgumentParser(description="Stage AMP public Drive units into import JSON.")
    parser.add_argument("--dry-run", action="store_true", help="Do not write staging or import files")
    args = parser.parse_args()

    report = build_import_rows(write_changes=not bool(args.dry_run))
    summary = {
        "datasets": {
            key: {"count": len(value), "featured_source_ids": FEATURED_SOURCE_IDS[key]}
            for key, value in report["import_rows"].items()
        }
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
