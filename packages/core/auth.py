from __future__ import annotations

import hashlib
import hmac
import os
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from jwt import InvalidTokenError

SECRET = os.getenv("JWT_SECRET_KEY", "flowbiz-dev-secret")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "720"))


def _legacy_hash(password: str) -> str:
    payload = f"flowbiz::{password}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    if password_hash.startswith("$2"):
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    expected = _legacy_hash(password)
    return hmac.compare_digest(expected, password_hash)


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
        "exp": expires,
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    except InvalidTokenError as exc:
        raise ValueError("invalid token") from exc
