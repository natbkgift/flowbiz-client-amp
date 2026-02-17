from __future__ import annotations

import argparse
import json
import os
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

try:
    import fcntl  # type: ignore
except Exception:  # pragma: no cover
    fcntl = None


APP_DIR = Path(__file__).resolve().parents[1]
RUNTIME_DIR = APP_DIR / "runtime"
STATE_FILE = RUNTIME_DIR / "system_state.json"
LOCK_FILE = RUNTIME_DIR / "system_state.lock"
LOG_FILE = RUNTIME_DIR / "runtime_loop.log"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def log(msg: str) -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"{_utc_now_iso()} | {msg}\n")


def _lock_exclusive(fd: int) -> None:
    if fcntl is None:
        return
    fcntl.flock(fd, fcntl.LOCK_EX)


def _lock_release(fd: int) -> None:
    if fcntl is None:
        return
    fcntl.flock(fd, fcntl.LOCK_UN)


def _atomic_write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, indent=2, sort_keys=True)
    with NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=str(path.parent),
        prefix=path.name + ".",
        suffix=".tmp",
        delete=False,
    ) as tf:
        tmp_name = tf.name
        tf.write(payload)
        tf.flush()
        os.fsync(tf.fileno())
    os.replace(tmp_name, path)


def load_state() -> dict[str, Any]:
    if not STATE_FILE.exists():
        raise FileNotFoundError(f"STATE_MISSING: {STATE_FILE}")
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state: dict[str, Any]) -> None:
    _atomic_write_json(STATE_FILE, state)


def health_check() -> bool:
    try:
        result = subprocess.run(
            ["curl", "-s", "http://127.0.0.1:8001/healthz"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        return "ok" in (result.stdout or "").lower()
    except Exception as e:
        log(f"health_check_failed: {e}")
        return False


def _metrics_breached(metrics: dict[str, Any]) -> bool:
    for v in metrics.values():
        if isinstance(v, str) and v.lower() == "breach":
            return True
    return False


def _normalize_execution_state(state: dict[str, Any]) -> None:
    execution = state.setdefault("execution", {})
    failures = state.setdefault("failures", {})
    runtime = state.setdefault("runtime", {})

    if execution.get("current_phase") is None:
        last_ok = execution.get("last_successful_phase")
        execution["current_phase"] = (int(last_ok) + 1) if last_ok is not None else 0

    failures.setdefault("consecutive_failures", 0)
    failures.setdefault("error_count", 0)
    runtime.setdefault("loop_interval_seconds", 60)
    runtime.setdefault("max_consecutive_failures", 3)


@dataclass(frozen=True)
class Decision:
    action: str
    reason: str
    priority: str


def decide_next_action(state: dict[str, Any]) -> Decision:
    integrity = state.get("integrity") or {}
    observability = state.get("observability") or {}
    metrics = state.get("metrics") or {}
    deployment = state.get("deployment") or {}
    failures = state.get("failures") or {}
    execution = state.get("execution") or {}

    # 1) Integrity
    if not integrity.get("baseline_completed") or not integrity.get("contracts_loaded"):
        return Decision("run_baseline", "integrity_gate_failed", "high")

    # 2) Observability
    if (
        observability.get("logs") != "healthy"
        or observability.get("metrics") != "healthy"
        or observability.get("tracing") != "healthy"
        or observability.get("alerts") != "armed"
    ):
        return Decision("restore_observability", "observability_gate_failed", "high")

    # 3) Metrics breach
    if _metrics_breached(metrics):
        return Decision("rollback_last_slice", "metrics_breach", "high")

    # 4) Phase continuation/readiness (minimal: rely on state)
    if execution.get("phase_status") == "running":
        return Decision("continue_phase", "phase_running", "medium")
    if execution.get("phase_status") == "completed":
        return Decision("advance_phase", "phase_completed", "medium")

    # 5) Deployment state
    if deployment.get("deployment_status") == "pending":
        return Decision("resume_deploy", "deployment_pending", "high")

    # 6) Failure recovery
    if failures.get("last_error"):
        return Decision("investigate_failure", "failure_present", "high")

    # 7) Stable system
    return Decision("monitor_production", "stable", "low")


def _record_failure(state: dict[str, Any], err: str) -> None:
    failures = state.setdefault("failures", {})
    failures["last_error"] = err
    failures["error_count"] = int(failures.get("error_count") or 0) + 1
    failures["consecutive_failures"] = int(failures.get("consecutive_failures") or 0) + 1
    failures["last_failure_at"] = _utc_now_iso()


def _record_success(state: dict[str, Any]) -> None:
    failures = state.setdefault("failures", {})
    failures["consecutive_failures"] = 0


def execute_action(action: str, state: dict[str, Any]) -> None:
    # This file is an infra loop skeleton; actual execution engines live in /actions.
    if action == "run_baseline":
        state.setdefault("integrity", {})["baseline_completed"] = True

    elif action == "restore_observability":
        obs = state.setdefault("observability", {})
        obs["logs"] = "healthy"
        obs["metrics"] = "healthy"
        obs["tracing"] = "healthy"
        obs["alerts"] = "armed"

    elif action == "investigate_failure":
        state.setdefault("failures", {})["last_error"] = None

    elif action == "continue_phase":
        state.setdefault("execution", {})["phase_status"] = "running"

    elif action == "advance_phase":
        execution = state.setdefault("execution", {})
        execution["current_phase"] = int(execution.get("current_phase") or 0) + 1
        execution["phase_status"] = "running"

    elif action in {"rollback_last_slice", "resume_deploy", "monitor_production"}:
        # No-op in skeleton.
        pass

    else:
        raise ValueError(f"Unknown action: {action}")


def loop_once() -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    LOCK_FILE.touch(exist_ok=True)

    with open(LOCK_FILE, "r+", encoding="utf-8") as lockf:
        _lock_exclusive(lockf.fileno())
        try:
            state = load_state()
            _normalize_execution_state(state)

            decision = decide_next_action(state)
            log(
                "decision "
                f"action={decision.action} "
                f"priority={decision.priority} "
                f"reason={decision.reason}"
            )

            execute_action(decision.action, state)
            state.setdefault("planner", {})["next_action"] = decision.action
            state.setdefault("planner", {})["priority"] = decision.priority

            ok = health_check()
            log(f"health_check ok={ok}")
            if not ok:
                _record_failure(state, "health_check_failed")
            else:
                _record_success(state)

            max_fail = int(state.get("runtime", {}).get("max_consecutive_failures") or 3)
            if int(state.get("failures", {}).get("consecutive_failures") or 0) >= max_fail:
                state.setdefault("planner", {})["next_action"] = "investigate_failure"
                state.setdefault("planner", {})["priority"] = "critical"

            save_state(state)
        except Exception as e:
            # Best-effort: record failure if state is readable.
            try:
                state = load_state()
                _normalize_execution_state(state)
                _record_failure(state, f"loop_exception:{type(e).__name__}")
                save_state(state)
            except Exception:
                pass
            log(f"loop_failure: {type(e).__name__} {e}")
        finally:
            _lock_release(lockf.fileno())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run exactly one loop iteration")
    args = parser.parse_args()

    log("runtime_loop_start")

    if args.once:
        loop_once()
        return 0

    while True:
        loop_once()
        try:
            state = load_state()
            interval = int(state.get("runtime", {}).get("loop_interval_seconds") or 60)
        except Exception:
            interval = 60
        time.sleep(max(1, interval))


if __name__ == "__main__":
    raise SystemExit(main())
