from __future__ import annotations

import os

CRM_WHATSAPP_DEFAULT_COUNTRY_CODE_ENV = "CRM_WHATSAPP_DEFAULT_COUNTRY_CODE"
DEFAULT_WHATSAPP_COUNTRY_CODE = "66"


def _normalize_email(value: str | None) -> str | None:
    text = str(value or "").strip()
    if "@" not in text or " " in text:
        return None
    return text


def _normalize_phone(value: str | None) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    has_plus_prefix = raw.startswith("+")
    digits = "".join(ch for ch in raw if ch.isdigit())
    if len(digits) < 8:
        return None
    if has_plus_prefix:
        return f"+{digits}"
    return digits


def _to_whatsapp_digits(normalized_phone: str | None) -> str | None:
    default_country_code = (
        "".join(ch for ch in os.getenv(CRM_WHATSAPP_DEFAULT_COUNTRY_CODE_ENV, "") if ch.isdigit())
        or DEFAULT_WHATSAPP_COUNTRY_CODE
    )
    digits = "".join(ch for ch in str(normalized_phone or "") if ch.isdigit())
    if len(digits) < 8:
        return None
    if str(normalized_phone or "").startswith("+"):
        return digits
    if digits.startswith(default_country_code):
        return digits
    if digits.startswith("0"):
        local = digits.lstrip("0")
        return f"{default_country_code}{local}" if local else None
    if len(digits) <= 10:
        return f"{default_country_code}{digits}"
    return digits


def build_contact_action_urls(*, email: str | None, phone: str | None) -> dict[str, str | None]:
    normalized_email = _normalize_email(email)
    normalized_phone = _normalize_phone(phone)
    wa_digits = _to_whatsapp_digits(normalized_phone)
    return {
        "email_url": f"mailto:{normalized_email}" if normalized_email else None,
        "phone_url": f"tel:{normalized_phone}" if normalized_phone else None,
        "whatsapp_url": f"https://wa.me/{wa_digits}" if wa_digits else None,
    }
