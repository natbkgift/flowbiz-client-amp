from __future__ import annotations

import re

from packages.core.schemas.ai import AILeadProfile

_AREA_TOKENS = {
    "jomtien": "Jomtien",
    "central pattaya": "Central Pattaya",
    "pratumnak": "Pratumnak",
    "naklua": "Naklua",
    "wongamat": "Wongamat",
    "bang saray": "Bang Saray",
    "บางเสร่": "บางเสร่",
    "จอมเทียน": "จอมเทียน",
    "พัทยากลาง": "พัทยากลาง",
    "พระตำหนัก": "พระตำหนัก",
    "นาเกลือ": "นาเกลือ",
    "วงศ์อมาตย์": "วงศ์อมาตย์",
}
_PROPERTY_TYPE_TOKENS = {
    "condo": "condo",
    "condominium": "condo",
    "คอนโด": "condo",
    "villa": "villa",
    "พูลวิลล่า": "villa",
    "house": "house",
    "บ้าน": "house",
    "townhome": "townhome",
    "town house": "townhome",
    "ทาวน์โฮม": "townhome",
}


def _contains_any(text: str, patterns: tuple[str, ...]) -> bool:
    return any(pattern in text for pattern in patterns)


def _extract_intent(text: str) -> tuple[str | None, str | None]:
    if _contains_any(text, ("invest", "investment", "yield", "roi", "ลงทุน", "ปล่อยเช่า")):
        return "invest", "investor"
    if _contains_any(text, ("rent", "rental", "lease", "เช่า", "ย้ายอยู่")):
        return "rent", "renter"
    if _contains_any(text, ("sell", "listing my property", "ขาย", "ปล่อยออก")):
        return "sell", "seller"
    if _contains_any(
        text,
        (
            "book a viewing",
            "book viewing",
            "schedule a viewing",
            "schedule viewing",
            "private tour",
            "site visit",
            "tour this",
            "นัดดู",
            "นัดเข้าชม",
            "ขอดูห้อง",
            "ขอเข้าชม",
        ),
    ):
        return "viewing", "buyer"
    if _contains_any(text, ("compare", "เทียบ", "เปรียบเทียบ")):
        return "project_compare", None
    if _contains_any(text, ("buy", "purchase", "อยู่เอง", "ซื้อเพื่ออยู่เอง", "own use")):
        return "buy", "buyer"
    return None, None


def _extract_budget_range(text: str) -> str | None:
    if _contains_any(text, ("not sure", "ยังไม่แน่", "ยังไม่ชัวร์")):
        return "not_sure"
    if re.search(r"(below|under|<)\s*(thb|฿)?\s*3", text) or "ต่ำกว่า 3" in text:
        return "lt_3m"
    if re.search(r"\b3\s*(m|ล้าน)?\s*(to|-|–)\s*6\s*(m|ล้าน)?\b", text) or "3 - 6" in text:
        return "3m_6m"
    if re.search(r"\b6\s*(m|ล้าน)?\s*(to|-|–)\s*10\s*(m|ล้าน)?\b", text) or "6 - 10" in text:
        return "6m_10m"
    if re.search(r"(above|over|>)\s*(thb|฿)?\s*10", text) or "มากกว่า 10" in text:
        return "gt_10m"
    return None


def _extract_timeframe(text: str) -> str | None:
    if _contains_any(text, ("asap", "immediately", "within 1 month", "ภายใน 1 เดือน", "ด่วน")):
        return "0_3m"
    if _contains_any(text, ("within 3 months", "1-3 months", "3 months", "ภายใน 3 เดือน")):
        return "3_6m"
    if _contains_any(text, ("within 6 months", "6 months", "ครึ่งปี", "ภายใน 6 เดือน")):
        return "6m_plus"
    if _contains_any(text, ("exploring", "researching", "just looking", "กำลังดูข้อมูล", "ยังดูอยู่")):
        return "flexible"
    return None


def _extract_preferred_area(text: str) -> str | None:
    for token, value in _AREA_TOKENS.items():
        if token in text:
            return value
    return None


def _extract_property_type(text: str) -> str | None:
    for token, value in _PROPERTY_TYPE_TOKENS.items():
        if token in text:
            return value
    return None


def _extract_contact_details(text: str) -> tuple[str | None, str | None, str | None]:
    email_match = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", text, flags=re.IGNORECASE)
    phone_match = re.search(r"(?:\+?\d[\d\s-]{7,}\d)", text)
    if re.search(r"\bwhatsapp\b|\bwa\b", text):
        preference = "whatsapp"
    elif re.search(r"\bline\b", text):
        preference = "line"
    elif re.search(r"\bcall\b", text) or "โทร" in text:
        preference = "phone"
    elif re.search(r"\bemail\b", text) or "อีเมล" in text:
        preference = "email"
    else:
        preference = None

    phone = None
    if phone_match:
        phone = re.sub(r"\s+", "", phone_match.group(0))

    return email_match.group(0) if email_match else None, phone, preference


def infer_lead_profile_updates(
    message: str,
    lead_profile: AILeadProfile,
) -> tuple[AILeadProfile, list[str]]:
    lowered = message.lower()
    captured_fields: list[str] = []
    updated = lead_profile.model_copy(deep=True)

    if updated.intent is None:
        intent, buyer_type = _extract_intent(lowered)
        if intent is not None:
            updated.intent = intent
            captured_fields.append("intent")
        if updated.buyer_type is None and buyer_type is not None:
            updated.buyer_type = buyer_type
            captured_fields.append("buyer_type")

    if updated.buyer_type is None:
        _, buyer_type = _extract_intent(lowered)
        if buyer_type is not None:
            updated.buyer_type = buyer_type
            captured_fields.append("buyer_type")

    if updated.budget_range is None:
        budget_range = _extract_budget_range(lowered)
        if budget_range is not None:
            updated.budget_range = budget_range
            captured_fields.append("budget_range")

    if updated.timeframe is None:
        timeframe = _extract_timeframe(lowered)
        if timeframe is not None:
            updated.timeframe = timeframe
            captured_fields.append("timeframe")

    if updated.preferred_area is None:
        preferred_area = _extract_preferred_area(lowered)
        if preferred_area is not None:
            updated.preferred_area = preferred_area
            captured_fields.append("preferred_area")

    if updated.property_type is None:
        property_type = _extract_property_type(lowered)
        if property_type is not None:
            updated.property_type = property_type
            captured_fields.append("property_type")

    email, phone, preference = _extract_contact_details(lowered)
    if updated.email is None and email is not None:
        updated.email = email
        captured_fields.append("email")
    if updated.phone is None and phone is not None:
        updated.phone = phone
        captured_fields.append("phone")
    if updated.contact_preference is None and preference is not None:
        updated.contact_preference = preference
        captured_fields.append("contact_preference")

    return updated, list(dict.fromkeys(captured_fields))
