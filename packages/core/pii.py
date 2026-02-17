from __future__ import annotations

import hashlib


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_phone(phone: str) -> str:
    # Minimal normalization: keep digits and leading +
    phone = phone.strip()
    out: list[str] = []
    for ch in phone:
        if ch.isdigit() or (ch == "+" and not out):
            out.append(ch)
    return "".join(out)


def sha256_hex(value: str, *, pepper: str = "") -> str:
    h = hashlib.sha256()
    h.update((pepper + value).encode("utf-8"))
    return h.hexdigest()
