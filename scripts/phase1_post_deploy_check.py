import json
import os
import sys
import urllib.error
import urllib.request

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")
ENVIRONMENT = os.getenv("ENVIRONMENT", "staging").strip().lower()
TIMEOUT_SECONDS = 2.0


class CheckError(Exception):
    pass


def post_json(path: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            if resp.status != 200:
                raise CheckError(f"{path} returned status {resp.status}")
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise CheckError(f"POST {path} failed: {exc}") from exc


def get_json(path: str) -> dict:
    req = urllib.request.Request(f"{BASE_URL}{path}", method="GET")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            if resp.status != 200:
                raise CheckError(f"{path} returned status {resp.status}")
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise CheckError(f"GET {path} failed: {exc}") from exc


def first_success_get(paths: list[str]) -> tuple[str, dict]:
    last_error: Exception | None = None
    for path in paths:
        try:
            return path, get_json(path)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
    raise CheckError(f"No health endpoint reachable: {last_error}")


def first_success_post(paths: list[str], payload: dict) -> tuple[str, dict]:
    last_error: Exception | None = None
    for path in paths:
        try:
            return path, post_json(path, payload)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
    raise CheckError(f"No endpoint reachable for candidates {paths}: {last_error}")


def validate_score_schema(data: dict) -> None:
    required = {
        "lead_score",
        "lead_temp",
        "scoring_version",
        "assigned_pipeline",
        "tags",
        "priority_flag",
        "line_notification_mode",
    }
    missing = [key for key in required if key not in data]
    if missing:
        raise CheckError(f"Score schema mismatch. Missing keys: {missing}")


def check_temp(
    name: str,
    payload: dict,
    expected_temp: str,
    min_score: int,
    max_score: int | None,
) -> dict:
    _, data = first_success_post(["/phase1/score", "/v1/phase1/score"], payload)
    validate_score_schema(data)

    score = data["lead_score"]
    temp = data["lead_temp"]

    if not isinstance(score, int):
        raise CheckError(f"{name} lead_score invalid: {score}")
    if temp != expected_temp:
        raise CheckError(f"{name} expected temp={expected_temp}, got {temp}")
    if score < min_score:
        raise CheckError(f"{name} expected score >= {min_score}, got {score}")
    if max_score is not None and score > max_score:
        raise CheckError(f"{name} expected score <= {max_score}, got {score}")

    return data


def main() -> int:
    if ENVIRONMENT not in {"staging", "production"}:
        raise CheckError("ENVIRONMENT must be staging or production")

    print(f"ENV: {ENVIRONMENT}")

    health_path, _ = first_success_get(["/health", "/healthz"])
    print(f"API reachable: OK ({health_path})")

    api_path, api_data = first_success_post(
        ["/phase1/api", "/v1/phase1/chat/classify"],
        {"target": "purpose", "text": "I want to rent a condo"},
    )
    if not all(key in api_data for key in ["target", "value", "confidence"]):
        raise CheckError("/phase1/api response schema mismatch")

    common = {
        "source_page": "/",
        "first_name": "PostDeploy",
        "contact_value": "check@example.com",
        "country": "UK",
    }

    cold = {
        **common,
        "purpose": "exploring",
        "budget_range": "under_15k",
        "timeline": "researching",
        "in_thailand": "no_remote",
        "preferred_channel": "email",
    }
    warm = {
        **common,
        "purpose": "rent",
        "budget_range": "15k_25k",
        "timeline": "1_3mo",
        "in_thailand": "no_visiting",
        "preferred_channel": "email",
    }
    hot = {
        **common,
        "purpose": "buy_live",
        "budget_range": "5m_10m",
        "timeline": "1_3mo",
        "in_thailand": "yes_elsewhere",
        "preferred_channel": "email",
    }
    fire = {
        **common,
        "purpose": "buy_invest",
        "budget_range": "10m_plus",
        "timeline": "within_1mo",
        "in_thailand": "yes_pattaya",
        "preferred_channel": "whatsapp",
        "contact_value": "+66810000000",
    }

    cold_result = check_temp("Cold", cold, "cold", 0, 20)
    _ = check_temp("Warm", warm, "warm", 21, 45)
    _ = check_temp("Hot", hot, "hot", 46, 70)
    _ = check_temp("Fire", fire, "fire", 71, None)

    print(f"Scoring version: {cold_result['scoring_version']}")
    print(f"Phase1 API endpoint: OK ({api_path})")
    print("Cold → OK")
    print("Warm → OK")
    print("Hot → OK")
    print("Fire → OK")
    print("SYSTEM HEALTHY")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except CheckError as exc:
        print(f"CHECK FAILED: {exc}")
        raise SystemExit(1)
