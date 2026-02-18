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

REPORTS_DIR = RUNTIME_DIR / "reports"


DEFAULT_PROD_BASE_URL = "http://127.0.0.1:8001"
DEFAULT_STAGING_BASE_URL = "http://127.0.0.1:8101"


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


def _atomic_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=str(path.parent),
        prefix=path.name + ".",
        suffix=".tmp",
        delete=False,
    ) as tf:
        tmp_name = tf.name
        tf.write(content)
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


def _curl_http_code(url: str, timeout_seconds: int = 10) -> int | None:
    try:
        result = subprocess.run(
            ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}", url],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
        s = (result.stdout or "").strip()
        return int(s) if s.isdigit() else None
    except Exception:
        return None


def _curl_body_sha256(url: str, timeout_seconds: int = 10) -> str | None:
    try:
        result = subprocess.run(
            ["curl", "-sS", url],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
        if result.returncode != 0:
            return None
        import hashlib

        return hashlib.sha256((result.stdout or "").encode("utf-8")).hexdigest()
    except Exception:
        return None


def _determinism_probe(url: str, runs: int = 3) -> bool:
    hashes: list[str] = []
    for _ in range(max(1, runs)):
        h = _curl_body_sha256(url)
        if not h:
            return False
        hashes.append(h)
    return len(set(hashes)) == 1


def _metrics_breached(metrics: dict[str, Any]) -> bool:
    for v in metrics.values():
        if isinstance(v, str) and v.lower() == "breach":
            return True
    return False


def _normalize_execution_state(state: dict[str, Any]) -> None:
    execution = state.setdefault("execution", {})
    failures = state.setdefault("failures", {})
    runtime = state.setdefault("runtime", {})
    integrity = state.setdefault("integrity", {})
    planner = state.setdefault("planner", {})
    observability = state.setdefault("observability", {})
    verification = state.setdefault("verification", {})
    mission = state.setdefault("mission", {})

    if execution.get("current_phase") is None:
        last_ok = execution.get("last_successful_phase")
        execution["current_phase"] = (int(last_ok) + 1) if last_ok is not None else 0

    execution.setdefault("phase_status", "idle")

    # Keep legacy/minimal schemas working: only enforce keys when explicitly present.
    integrity.setdefault("baseline_completed", False)

    planner.setdefault("next_action", None)
    planner.setdefault("priority", "none")
    planner.setdefault("blocked", False)
    planner.setdefault("block_reason", None)

    observability.setdefault("logs", "healthy")
    observability.setdefault("metrics", "healthy")
    observability.setdefault("tracing", "healthy")
    observability.setdefault("alerts", "armed")

    mission.setdefault("mode", "infinite")
    mission.setdefault("target_final_phase", None)
    mission.setdefault("stop_when_complete", False)
    mission.setdefault("production_base_url", DEFAULT_PROD_BASE_URL)
    mission.setdefault("staging_base_url", DEFAULT_STAGING_BASE_URL)
    mission.setdefault("status", "active")

    verification.setdefault("phase", None)
    verification.setdefault("status", "unknown")
    verification.setdefault("checks", {})
    verification.setdefault("last_checked_at", None)
    verification.setdefault("attempts", 0)
    verification.setdefault("last_result", None)

    failures.setdefault("consecutive_failures", 0)
    failures.setdefault("error_count", 0)
    failures.setdefault("last_error", None)
    runtime.setdefault("loop_interval_seconds", 60)
    runtime.setdefault("max_consecutive_failures", 3)


def _is_finite_mission(state: dict[str, Any]) -> bool:
    mode = (state.get("mission") or {}).get("mode")
    return isinstance(mode, str) and mode.lower() == "finite"


def _mission_target_phase(state: dict[str, Any]) -> int | None:
    v = (state.get("mission") or {}).get("target_final_phase")
    try:
        return int(v) if v is not None else None
    except Exception:
        return None


def _verification_passed_for_phase(state: dict[str, Any], phase: int) -> bool:
    v = state.get("verification") or {}
    if v.get("phase") != phase:
        return False
    return (v.get("status") or "").lower() == "passed"


def _mission_complete(state: dict[str, Any]) -> bool:
    if not _is_finite_mission(state):
        return False
    mission = state.get("mission") or {}
    execution = state.get("execution") or {}
    target = _mission_target_phase(state)
    if target is None:
        return False
    current_phase = int(execution.get("current_phase") or 0)
    phase_status = (execution.get("phase_status") or "").lower()
    if current_phase != target or phase_status != "completed":
        return False
    return _verification_passed_for_phase(state, target)


def _set_mission_dormant(state: dict[str, Any], reason: str) -> None:
    mission = state.setdefault("mission", {})
    mission["status"] = "completed"
    planner = state.setdefault("planner", {})
    planner["next_action"] = "monitor_production"
    planner["priority"] = "low"
    planner["blocked"] = True
    planner["block_reason"] = reason
    # Make the loop effectively stop doing work while still running under systemd.
    runtime = state.setdefault("runtime", {})
    runtime["loop_interval_seconds"] = int(runtime.get("loop_interval_seconds") or 60)
    runtime["loop_interval_seconds"] = max(runtime["loop_interval_seconds"], 3600)


def _render_phase_report(state: dict[str, Any], phase: int) -> str:
    mission = state.get("mission") or {}
    verification = state.get("verification") or {}
    execution = state.get("execution") or {}
    observability = state.get("observability") or {}
    metrics = state.get("metrics") or {}
    failures = state.get("failures") or {}

    lines: list[str] = []
    lines.append(f"# PHASE {phase} REPORT")
    lines.append("")
    lines.append(f"generated_at_utc: {_utc_now_iso()}")
    lines.append(f"mission_mode: {mission.get('mode')}")
    lines.append(f"target_final_phase: {mission.get('target_final_phase')}")
    lines.append(f"production_base_url: {mission.get('production_base_url')}")
    lines.append(f"staging_base_url: {mission.get('staging_base_url')}")
    lines.append("")
    lines.append("## execution")
    lines.append(json.dumps(execution, indent=2, sort_keys=True))
    lines.append("")
    lines.append("## verification")
    lines.append(json.dumps(verification, indent=2, sort_keys=True))
    lines.append("")
    lines.append("## observability")
    lines.append(json.dumps(observability, indent=2, sort_keys=True))
    lines.append("")
    lines.append("## metrics")
    lines.append(json.dumps(metrics, indent=2, sort_keys=True))
    lines.append("")
    lines.append("## failures")
    lines.append(json.dumps(failures, indent=2, sort_keys=True))
    lines.append("")
    return "\n".join(lines)


def _write_phase_report(state: dict[str, Any], phase: int) -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = REPORTS_DIR / f"phase_{phase:02d}_{ts}.md"
    _atomic_write_text(path, _render_phase_report(state, phase))


def _render_mission_final_report(state: dict[str, Any]) -> str:
    mission = state.get("mission") or {}
    execution = state.get("execution") or {}
    verification = state.get("verification") or {}

    lines: list[str] = []
    lines.append("# MISSION_FINAL_REPORT")
    lines.append("")
    lines.append(f"generated_at_utc: {_utc_now_iso()}")
    lines.append("")
    lines.append("## mission")
    lines.append(json.dumps(mission, indent=2, sort_keys=True))
    lines.append("")
    lines.append("## execution")
    lines.append(json.dumps(execution, indent=2, sort_keys=True))
    lines.append("")
    lines.append("## verification")
    lines.append(json.dumps(verification, indent=2, sort_keys=True))
    lines.append("")
    return "\n".join(lines)


def _write_mission_final_report(state: dict[str, Any]) -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = REPORTS_DIR / f"MISSION_FINAL_REPORT_{ts}.md"
    _atomic_write_text(path, _render_mission_final_report(state))


def _record_rollback(state: dict[str, Any], reason: str) -> None:
    failures = state.setdefault("failures", {})
    failures["last_rollback"] = _utc_now_iso()
    failures["rollback_reason"] = reason
    failures["last_error"] = f"rollback:{reason}"


def _handle_verification_failure(state: dict[str, Any], phase: int) -> None:
    verification = state.setdefault("verification", {})
    attempts = int(verification.get("attempts") or 0)
    verification["attempts"] = attempts + 1
    verification["last_result"] = "failed"

    # Retry once; on second failure, rollback (safe state-only) and stop mission.
    if attempts == 0:
        planner = state.setdefault("planner", {})
        planner["blocked"] = True
        planner["block_reason"] = "verification_failed_retry_once"
        planner["next_action"] = "monitor_production"
        planner["priority"] = "high"
        log(f"verification_failed phase={phase} retry=1")
        return

    log(f"verification_failed phase={phase} rollback=1")
    _record_rollback(state, f"verification_failed_phase_{phase}")
    _set_mission_dormant(state, "verification_failed_rollback")


def _maybe_execute_phase(state: dict[str, Any]) -> None:
    if not _is_finite_mission(state):
        return

    mission = state.get("mission") or {}
    if (mission.get("status") or "").lower() != "active":
        return

    execution = state.setdefault("execution", {})
    phase_status = (execution.get("phase_status") or "").lower()
    current_phase = int(execution.get("current_phase") or 0)

    target = _mission_target_phase(state)
    if target is not None and current_phase > target:
        _set_mission_dormant(state, "mission_complete")
        return

    # Execute phase by running required verification checks; mark completed only when passed.
    if phase_status == "running":
        state.setdefault("verification", {})["phase"] = current_phase
        _update_verification_from_checks(state)
        if _verification_passed_for_phase(state, current_phase):
            execution["phase_status"] = "completed"
            execution["phase_completed_at"] = _utc_now_iso()
            execution["last_successful_phase"] = current_phase
            state.setdefault("verification", {})["attempts"] = 0
            state.setdefault("verification", {})["last_result"] = "passed"
            _write_phase_report(state, current_phase)
            log(f"phase_completed phase={current_phase}")
        else:
            _handle_verification_failure(state, current_phase)

    # If mission is complete at target phase, finalize.
    if _mission_complete(state):
        _write_phase_report(state, int((state.get("execution") or {}).get("current_phase") or 0))
        _write_mission_final_report(state)
        _set_mission_dormant(state, "mission_complete")


def _update_verification_from_checks(state: dict[str, Any]) -> None:
    verification = state.setdefault("verification", {})
    checks = verification.setdefault("checks", {})
    mission = state.get("mission") or {}

    prod_base = str(mission.get("production_base_url") or DEFAULT_PROD_BASE_URL).rstrip("/")
    staging_base = str(mission.get("staging_base_url") or "").rstrip("/")

    prod_health = _curl_http_code(f"{prod_base}/healthz")
    prod_metrics = _curl_http_code(f"{prod_base}/metrics")
    checks["prod_healthz"] = "passed" if prod_health == 200 else "failed"
    checks["prod_metrics"] = "passed" if prod_metrics == 200 else "failed"

    # Best-effort staging check (only required in finite mode; a missing staging stack will fail).
    if staging_base:
        st_health = _curl_http_code(f"{staging_base}/healthz")
        st_metrics = _curl_http_code(f"{staging_base}/metrics")
        checks["staging_healthz"] = "passed" if st_health == 200 else "failed"
        checks["staging_metrics"] = "passed" if st_metrics == 200 else "failed"

    # Determinism probes (avoid /metrics which is intentionally non-deterministic).
    checks["prod_determinism_meta"] = "passed" if _determinism_probe(f"{prod_base}/v1/meta") else "failed"

    # Optional: properties endpoint may not exist in very early phases; treat non-200 as failed only in finite mode.
    code_props = _curl_http_code(f"{prod_base}/v1/properties?page=1&limit=5")
    if code_props == 200:
        checks["prod_determinism_properties"] = (
            "passed" if _determinism_probe(f"{prod_base}/v1/properties?page=1&limit=5") else "failed"
        )
    else:
        checks["prod_determinism_properties"] = "unknown"

    verification["last_checked_at"] = _utc_now_iso()

    # Compute overall status (strict in finite mode).
    finite = _is_finite_mission(state)
    required_keys = [
        "prod_healthz",
        "prod_metrics",
        "prod_determinism_meta",
    ]
    if finite:
        required_keys.extend(["staging_healthz", "staging_metrics"])

    all_required_passed = all((checks.get(k) == "passed") for k in required_keys)
    verification["status"] = "passed" if all_required_passed else "failed"


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
    mission = state.get("mission") or {}
    verification = state.get("verification") or {}

    # 1) Integrity (backward compatible: only enforce keys that exist)
    if integrity.get("baseline_completed") is False:
        return Decision("run_baseline", "integrity_gate_failed:baseline", "high")
    if "contracts_loaded" in integrity and integrity.get("contracts_loaded") is False:
        return Decision("run_baseline", "integrity_gate_failed:contracts", "high")

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

    # 4) Phase continuation/readiness
    phase_status = execution.get("phase_status")
    current_phase = int(execution.get("current_phase") or 0)
    finite = (mission.get("mode") or "").lower() == "finite"
    target = _mission_target_phase(state) if finite else None

    if finite and target is not None and current_phase >= target and phase_status == "completed":
        return Decision("monitor_production", "mission_complete_at_target_phase", "low")

    if phase_status == "running":
        return Decision("continue_phase", "phase_running", "medium")

    if phase_status == "completed":
        if finite and target is not None:
            # In finite mode, require a verification pass for this phase before advancing.
            if verification.get("phase") != current_phase or (verification.get("status") or "").lower() != "passed":
                return Decision("monitor_production", "verification_required_before_advance", "high")
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

            # Finite mission: execute current phase (via verification-driven completion).
            try:
                _maybe_execute_phase(state)
            except Exception as e:
                log(f"phase_execute_failed: {type(e).__name__} {e}")
                _record_failure(state, f"phase_execute_failed:{type(e).__name__}")

            # Refresh verification checks before planning, so phase advancement decisions
            # are made using up-to-date verification status.
            exec_state = state.get("execution") or {}
            if exec_state.get("phase_status") == "completed" and _is_finite_mission(state):
                try:
                    state.setdefault("verification", {})["phase"] = int(exec_state.get("current_phase") or 0)
                    _update_verification_from_checks(state)
                except Exception as e:
                    log(f"verification_update_failed: {type(e).__name__} {e}")

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

            # Planner block signals (used by operators/higher-level agents)
            planner = state.setdefault("planner", {})
            planner["blocked"] = False
            planner["block_reason"] = None
            if decision.action == "monitor_production" and decision.reason.startswith("verification_required"):
                planner["blocked"] = True
                planner["block_reason"] = "verification_required_before_advance"
            if decision.reason == "mission_complete_at_target_phase":
                planner["blocked"] = True
                planner["block_reason"] = "mission_complete"

            # If mission is completed, keep loop dormant.
            if _mission_complete(state):
                _set_mission_dormant(state, "mission_complete")

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
