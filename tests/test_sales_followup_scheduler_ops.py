from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

from scripts.inspect_sales_followup_runs import (
    compute_health,
    detect_unit_drift,
    expected_service_lines,
    wrapper_flags,
)


def test_detect_unit_drift_flags_missing_wrapper_path_and_execstart() -> None:
    active_path = "/opt/flowbiz/clients/flowbiz-client-amp"
    wrapper_path = "/usr/local/bin/flowbiz-run-sales-followups.sh"
    expected = expected_service_lines(active_path, wrapper_path)

    valid_unit = "\n".join(
        [
            "[Unit]",
            expected["condition"],
            "[Service]",
            expected["execstart"],
        ]
    )
    assert detect_unit_drift(valid_unit, active_path, wrapper_path) == []

    invalid_unit = valid_unit.replace(
        wrapper_path,
        f"{active_path}/scripts/run_prod_sales_followups.sh",
    )
    assert detect_unit_drift(invalid_unit, active_path, wrapper_path) == ["UNIT_DRIFT_DETECTED"]


def test_compute_health_flags_stall_and_consecutive_failures() -> None:
    now = datetime(2026, 3, 20, 2, 0, tzinfo=UTC)
    latest_success = {
        "finished_at": (now - timedelta(minutes=30)).isoformat(),
    }
    latest_failure = {
        "finished_at": (now - timedelta(minutes=5)).isoformat(),
    }
    recent = [
        {"status": "failed"},
        {"status": "partial"},
        {"status": "ok"},
    ]

    payload = compute_health(
        latest_success=latest_success,
        latest_failure=latest_failure,
        recent=recent,
        now=now,
        stall_minutes=15,
    )

    assert payload["last_success_at"] == latest_success["finished_at"]
    assert payload["last_failure_at"] == latest_failure["finished_at"]
    assert payload["consecutive_failures"] == 2
    assert payload["flags"] == ["SCHEDULER_STALLED"]


def test_installer_contract_detects_missing_wrapper_path() -> None:
    assert wrapper_flags(Path("/tmp/definitely-missing-flowbiz-wrapper.sh")) == ["WRAPPER_MISSING"]


def test_artifact_schema_is_stable_for_operator_consumption(tmp_path: Path) -> None:
    run_path = tmp_path / "run.json"
    run_path.write_text(
        json.dumps(
            {
                "run_id": "run-20260320T011500Z-2228705",
                "status": "partial",
                "exit_code": 0,
                "processed": 2,
                "triggered": 1,
                "suppressed": 1,
                "stale": 0,
                "failed": 1,
                "started_at": "2026-03-20T01:15:00Z",
                "finished_at": "2026-03-20T01:15:02Z",
                "duration_ms": 2000,
                "error": "processor completed with failed items",
                "failure_type": "processor_error",
            }
        ),
        encoding="utf-8",
    )

    payload = json.loads(run_path.read_text(encoding="utf-8"))
    assert payload == {
        "run_id": "run-20260320T011500Z-2228705",
        "status": "partial",
        "exit_code": 0,
        "processed": 2,
        "triggered": 1,
        "suppressed": 1,
        "stale": 0,
        "failed": 1,
        "started_at": "2026-03-20T01:15:00Z",
        "finished_at": "2026-03-20T01:15:02Z",
        "duration_ms": 2000,
        "error": "processor completed with failed items",
        "failure_type": "processor_error",
    }
