import os
import sys

import requests

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")
SCORE_URL = f"{BASE_URL}/v1/phase1/score"
PHASE1_API_URL = f"{BASE_URL}/v1/phase1/chat/classify"


def fail(message: str) -> None:
    print(f"[FAIL] {message}")
    raise SystemExit(1)


def post_json(url: str, payload: dict) -> dict:
    try:
        response = requests.post(url, json=payload, timeout=2)
    except requests.RequestException as exc:
        fail(f"request error for {url}: {exc}")

    if response.status_code != 200:
        fail(f"unexpected status {response.status_code} for {url}: {response.text}")

    try:
        return response.json()
    except ValueError as exc:
        fail(f"invalid JSON from {url}: {exc}")


def assert_lead(
    name: str,
    payload: dict,
    expected_temp: str,
    min_score: int | None = None,
    max_score: int | None = None,
) -> None:
    data = post_json(SCORE_URL, payload)
    score = data.get("lead_score")
    temp = data.get("lead_temp")

    if not isinstance(score, int):
        fail(f"{name}: lead_score missing or invalid ({score})")

    if temp != expected_temp:
        fail(f"{name}: expected temp={expected_temp}, got {temp}")

    if min_score is not None and score < min_score:
        fail(f"{name}: expected score >= {min_score}, got {score}")

    if max_score is not None and score > max_score:
        fail(f"{name}: expected score <= {max_score}, got {score}")

    print(f"[PASS] {name}")


def main() -> int:
    post_json(
        PHASE1_API_URL,
        {"target": "purpose", "text": "I want to rent a condo"},
    )

    common = {
        "source_page": "/",
        "first_name": "Smoke",
        "contact_value": "smoke@example.com",
        "country": "UK",
    }

    assert_lead(
        "Cold lead",
        {
            **common,
            "purpose": "exploring",
            "budget_range": "under_15k",
            "timeline": "researching",
            "in_thailand": "no_remote",
            "preferred_channel": "email",
        },
        expected_temp="cold",
        max_score=20,
    )

    assert_lead(
        "Warm lead",
        {
            **common,
            "purpose": "rent",
            "budget_range": "15k_25k",
            "timeline": "1_3mo",
            "in_thailand": "no_visiting",
            "preferred_channel": "email",
        },
        expected_temp="warm",
        min_score=21,
        max_score=45,
    )

    assert_lead(
        "Hot lead",
        {
            **common,
            "purpose": "buy_live",
            "budget_range": "5m_10m",
            "timeline": "1_3mo",
            "in_thailand": "yes_elsewhere",
            "preferred_channel": "email",
        },
        expected_temp="hot",
        min_score=46,
        max_score=70,
    )

    assert_lead(
        "Fire lead",
        {
            **common,
            "purpose": "buy_invest",
            "budget_range": "10m_plus",
            "timeline": "within_1mo",
            "in_thailand": "yes_pattaya",
            "preferred_channel": "whatsapp",
            "contact_value": "+66810000000",
        },
        expected_temp="fire",
        min_score=71,
    )

    print("All smoke tests passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
