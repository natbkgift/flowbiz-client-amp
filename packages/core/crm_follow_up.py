from __future__ import annotations

CANONICAL_FOLLOW_UP_STATUSES: tuple[str, ...] = (
    "pending",
    "scheduled",
    "completed",
    "no_response",
)

_STATUS_SET = set(CANONICAL_FOLLOW_UP_STATUSES)


def normalize_follow_up_status(value: str) -> str:
    text = str(value or "").strip().lower().replace("-", "_").replace(" ", "_")
    if text not in _STATUS_SET:
        allowed = ", ".join(CANONICAL_FOLLOW_UP_STATUSES)
        raise ValueError(f"Invalid follow_up_status. Allowed: {allowed}")
    return text
