from __future__ import annotations

import argparse
import json
import os
import subprocess
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any


def _parse_iso(value: str | None) -> datetime | None:
    text = str(value or "").strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


def _load_json(path: Path) -> dict[str, object] | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"path": str(path), "invalid_json": True}


def _run_command(*args: str) -> dict[str, object]:
    try:
        completed = subprocess.run(
            args,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as exc:
        return {
            "ok": False,
            "exit_code": 127,
            "stdout": "",
            "stderr": str(exc),
        }

    return {
        "ok": completed.returncode == 0,
        "exit_code": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
    }


def expected_service_lines(active_path: str, wrapper_path: str) -> dict[str, str]:
    return {
        "condition": f"ConditionPathExists={wrapper_path}",
        "execstart": f"ExecStart=/usr/bin/env bash {wrapper_path} --repo-root {active_path}",
    }


def wrapper_flags(wrapper_path: Path) -> list[str]:
    flags: list[str] = []
    if not wrapper_path.exists():
        flags.append("WRAPPER_MISSING")
    elif not os.access(wrapper_path, os.X_OK):
        flags.append("WRAPPER_NOT_EXECUTABLE")
    return flags


def detect_unit_drift(unit_text: str, active_path: str, wrapper_path: str) -> list[str]:
    expected = expected_service_lines(active_path, wrapper_path)
    issues: list[str] = []
    if expected["condition"] not in unit_text:
        issues.append("UNIT_DRIFT_DETECTED")
    if expected["execstart"] not in unit_text:
        issues.append("UNIT_DRIFT_DETECTED")
    return sorted(set(issues))


def resolve_log_dir(log_dir: str, active_path: str) -> Path:
    path = Path(log_dir)
    if path.is_absolute():
        return path
    return Path(active_path) / path


def _normalize_run_metrics(run: dict[str, object] | None) -> dict[str, object]:
    data = dict(run or {})
    summary = data.get("summary")
    summary_dict = summary if isinstance(summary, dict) else {}

    def metric(name: str) -> int:
        for source in (data, summary_dict):
            value = source.get(name, 0)
            try:
                return int(value)
            except (TypeError, ValueError):
                continue
        return 0

    return {
        "run_id": data.get("run_id"),
        "status": data.get("status") or "unknown",
        "exit_code": data.get("exit_code", 0),
        "processed": metric("processed"),
        "triggered": metric("triggered"),
        "suppressed": metric("suppressed"),
        "stale": metric("stale"),
        "failed": metric("failed"),
        "started_at": data.get("started_at"),
        "finished_at": data.get("finished_at") or data.get("ended_at"),
        "duration_ms": int(data.get("duration_ms") or 0),
        "error": data.get("error"),
        "failure_type": data.get("failure_type"),
    }


def compute_health(
    *,
    latest_success: dict[str, object] | None,
    latest_failure: dict[str, object] | None,
    recent: list[dict[str, object]],
    now: datetime,
    stall_minutes: int,
) -> dict[str, object]:
    latest_success_payload = latest_success or {}
    latest_failure_payload = latest_failure or {}
    last_success_at = _parse_iso(
        str(
            latest_success_payload.get("finished_at")
            or latest_success_payload.get("ended_at")
            or ""
        )
    )
    last_failure_at = _parse_iso(
        str(
            latest_failure_payload.get("finished_at")
            or latest_failure_payload.get("ended_at")
            or ""
        )
    )
    consecutive_failures = 0

    for run in recent:
        status = str(run.get("status") or "")
        if status == "ok":
            break
        consecutive_failures += 1

    flags: list[str] = []
    if last_success_at is None or now - last_success_at > timedelta(minutes=max(1, stall_minutes)):
        flags.append("SCHEDULER_STALLED")

    return {
        "last_success_at": last_success_at.isoformat() if last_success_at else None,
        "last_failure_at": last_failure_at.isoformat() if last_failure_at else None,
        "consecutive_failures": consecutive_failures,
        "flags": flags,
    }


def collect_runtime_state(
    *,
    log_dir: Path,
    service_name: str,
    timer_name: str,
    wrapper_path: Path,
    active_path: str,
    stall_minutes: int,
) -> dict[str, Any]:
    runs_dir = log_dir / "runs"
    run_files = sorted(runs_dir.glob("*/run.json"), reverse=True)
    recent_payloads = [_load_json(path) for path in run_files]
    recent = [_normalize_run_metrics(item) for item in recent_payloads if item is not None]

    latest = _normalize_run_metrics(_load_json(log_dir / "latest.json"))
    latest_success = _normalize_run_metrics(_load_json(log_dir / "latest-success.json"))
    latest_failure = _normalize_run_metrics(_load_json(log_dir / "latest-failure.json"))
    lock_owner = _load_json(log_dir / "lock-owner.json")

    timer_enabled = _run_command("systemctl", "is-enabled", timer_name)
    timer_active = _run_command("systemctl", "is-active", timer_name)
    timer_listing = _run_command(
        "systemctl",
        "list-timers",
        timer_name,
        "--no-pager",
        "--no-legend",
    )
    service_unit = _run_command("systemctl", "cat", service_name)

    wrapper_exists = wrapper_path.exists()
    wrapper_executable = os.access(wrapper_path, os.X_OK)
    flags: list[str] = wrapper_flags(wrapper_path)

    if str(timer_enabled.get("stdout", "")).strip() != "enabled":
        flags.append("TIMER_NOT_ENABLED")
    if str(timer_active.get("stdout", "")).strip() != "active":
        flags.append("TIMER_NOT_ACTIVE")

    unit_text = str(service_unit.get("stdout", ""))
    flags.extend(detect_unit_drift(unit_text, active_path, str(wrapper_path)))

    health = compute_health(
        latest_success=_load_json(log_dir / "latest-success.json"),
        latest_failure=_load_json(log_dir / "latest-failure.json"),
        recent=recent,
        now=datetime.now(UTC),
        stall_minutes=stall_minutes,
    )
    flags.extend(str(flag) for flag in health["flags"])

    return {
        "latest": latest,
        "latest_success": latest_success,
        "latest_failure": latest_failure,
        "lock_owner": lock_owner,
        "recent": recent,
        "scheduler": {
            "timer_enabled": str(timer_enabled.get("stdout", "")).strip() or None,
            "timer_active": str(timer_active.get("stdout", "")).strip() or None,
            "next_run": str(timer_listing.get("stdout", "")).strip() or None,
            "unit_drift": "UNIT_DRIFT_DETECTED" in flags,
            "service_unit": unit_text or None,
        },
        "wrapper": {
            "path": str(wrapper_path),
            "exists": wrapper_exists,
            "executable": wrapper_executable,
        },
        "health": health,
        "flags": sorted(set(flags)),
    }


def render_summary(payload: dict[str, Any]) -> str:
    latest = payload["latest"]
    latest_success = payload["latest_success"]
    health = payload["health"]
    wrapper = payload["wrapper"]
    scheduler = payload["scheduler"]
    flags = payload["flags"]
    next_run = scheduler["next_run"] or "unavailable"
    timer_state = (
        f"{scheduler['timer_active'] or 'unknown'}/"
        f"{scheduler['timer_enabled'] or 'unknown'}"
    )
    last_success_at = health["last_success_at"] or "never"
    last_failure_at = health["last_failure_at"] or "never"
    latest_success_at = latest_success["finished_at"] or "never"

    lines = [
        "Scheduler Status:",
        f"- timer: {timer_state}",
        f"- next run: {next_run}",
        f"- flags: {', '.join(flags) if flags else 'none'}",
        "",
        "Last Run:",
        f"- run_id: {latest['run_id'] or '-'}",
        f"- status: {latest['status']}",
        (
            "- processed / triggered / suppressed / failed: "
            f"{latest['processed']} / {latest['triggered']} / "
            f"{latest['suppressed']} / {latest['failed']}"
        ),
        f"- failure_type: {latest['failure_type'] or '-'}",
        f"- error: {latest['error'] or '-'}",
        "",
        "Health:",
        f"- last_success_at: {last_success_at}",
        f"- last_failure_at: {last_failure_at}",
        f"- consecutive_failures: {health['consecutive_failures']}",
        f"- latest_success_pointer: {latest_success_at}",
        "",
        "Wrapper:",
        f"- path exists: {'yes' if wrapper['exists'] else 'no'}",
        f"- executable: {'yes' if wrapper['executable'] else 'no'}",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect sales follow-up run artifacts.")
    parser.add_argument(
        "--log-dir",
        default="ops/logs/sales-followups",
        help="Directory containing latest.json and run history.",
    )
    parser.add_argument(
        "--failures",
        action="store_true",
        help="Only return recent failed runs.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Maximum recent runs to return.",
    )
    parser.add_argument(
        "--summary",
        action="store_true",
        help="Print a one-command operator summary.",
    )
    parser.add_argument(
        "--assert-healthy",
        action="store_true",
        help="Return non-zero if scheduler health checks fail.",
    )
    parser.add_argument(
        "--stall-minutes",
        type=int,
        default=15,
        help="Maximum allowed minutes since the last successful run.",
    )
    parser.add_argument(
        "--service-name",
        default="flowbiz-sales-followup.service",
        help="systemd service unit name.",
    )
    parser.add_argument(
        "--timer-name",
        default="flowbiz-sales-followup.timer",
        help="systemd timer unit name.",
    )
    parser.add_argument(
        "--wrapper-path",
        default="/usr/local/bin/flowbiz-run-sales-followups.sh",
        help="Installed wrapper path.",
    )
    parser.add_argument(
        "--active-path",
        default="/opt/flowbiz/clients/flowbiz-client-amp",
        help="Expected active repo path used by ExecStart.",
    )
    args = parser.parse_args()

    log_dir = resolve_log_dir(args.log_dir, args.active_path)
    payload = collect_runtime_state(
        log_dir=log_dir,
        service_name=args.service_name,
        timer_name=args.timer_name,
        wrapper_path=Path(args.wrapper_path),
        active_path=args.active_path,
        stall_minutes=max(1, args.stall_minutes),
    )
    recent = list(payload["recent"])

    if args.failures:
        recent = [
            item
            for item in recent
            if str(item.get("status")) not in {"ok", "skipped_locked"}
        ]
        payload["recent"] = recent[: max(1, args.limit)]
    else:
        payload["recent"] = recent[: max(1, args.limit)]

    if args.summary:
        print(render_summary(payload))
    else:
        print(json.dumps(payload, ensure_ascii=False, indent=2))

    if args.assert_healthy and payload["flags"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
