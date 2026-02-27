from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta

SECRET = "flowbiz-dev-secret"


def hash_password(password: str) -> str:
    payload = f"flowbiz::{password}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    expected = hash_password(password)
    return hmac.compare_digest(expected, password_hash)


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(raw + padding)


def create_access_token(
    *,
    subject: str,
    role: str = "admin",
    expires_delta: timedelta | None = None,
) -> str:
    expires = datetime.now(UTC) + (expires_delta or timedelta(hours=12))
    payload = {
        "sub": subject,
        "role": role,
        "exp": int(expires.timestamp()),
    }
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    sig = hmac.new(SECRET.encode("utf-8"), body, hashlib.sha256).digest()
    return f"{_b64url_encode(body)}.{_b64url_encode(sig)}"


def decode_access_token(token: str) -> dict:
    try:
        body_part, sig_part = token.split(".", 1)
        body = _b64url_decode(body_part)
        sig = _b64url_decode(sig_part)
    except Exception as exc:  # pragma: no cover - defensive
        raise ValueError("invalid token format") from exc

    expected_sig = hmac.new(SECRET.encode("utf-8"), body, hashlib.sha256).digest()
    if not hmac.compare_digest(sig, expected_sig):
        raise ValueError("invalid token signature")

    payload = json.loads(body.decode("utf-8"))
    exp = int(payload.get("exp", 0))
    if exp < int(datetime.now(UTC).timestamp()):
        raise ValueError("token expired")
    return payload
