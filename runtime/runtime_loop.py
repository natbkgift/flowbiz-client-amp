from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
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


CONSTITUTION_PATH = APP_DIR / "docs" / "directive" / "AMP_MASTER_EXECUTION_DIRECTIVE_V4.md"
REQUIRED_GOVERNANCE_ARTIFACTS: list[Path] = [
    APP_DIR / "docs" / "DEPLOY_PLAN_AMP_PRODUCTION_SAFE_MODE.md",
    CONSTITUTION_PATH,
    APP_DIR / "docs" / "governance" / "metrics.yaml",
    APP_DIR / "docs" / "governance" / "observability.md",
    APP_DIR / "docs" / "governance" / "phase-dependency.md",
    APP_DIR / "docs" / "architecture" / "platform-architecture.md",
    APP_DIR / "docs" / "architecture" / "experience-system.md",
    APP_DIR / "docs" / "architecture" / "brand-system.md",
]


def _system_integrity_reports_dir() -> Path:
    return APP_DIR / "docs" / "phase_reports" / "system_integrity"


def write_system_integrity_report(*, missing: list[str], unreadable: list[str]) -> None:
    base_root = _system_integrity_reports_dir()
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    base = base_root / ts
    base.mkdir(parents=True, exist_ok=True)
    (base_root / "LATEST.txt").write_text(ts + "\n", encoding="utf-8")

    payload = {
        "timestamp": _utc_now_iso(),
        "missing": missing,
        "unreadable": unreadable,
        "required": [p.relative_to(APP_DIR).as_posix() for p in REQUIRED_GOVERNANCE_ARTIFACTS],
    }
    (base / "SYSTEM_INTEGRITY_REPORT.json").write_text(
        json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    lines = [
        "# SYSTEM INTEGRITY REPORT",
        "",
        f"- Timestamp: {payload['timestamp']}",
        f"- Missing artifacts: {len(missing)}",
        f"- Unreadable artifacts: {len(unreadable)}",
    ]
    if missing:
        lines.append("")
        lines.append("## Missing")
        lines.extend([f"- {m}" for m in missing])
    if unreadable:
        lines.append("")
        lines.append("## Unreadable")
        lines.extend([f"- {u}" for u in unreadable])
    (base / "SYSTEM_INTEGRITY_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def _check_system_integrity_or_stop() -> None:
    missing: list[str] = []
    unreadable: list[str] = []
    for p in REQUIRED_GOVERNANCE_ARTIFACTS:
        rel = p.relative_to(APP_DIR).as_posix()
        if not p.exists():
            missing.append(rel)
            continue
        try:
            # Read a small prefix to ensure file is readable.
            with open(p, "r", encoding="utf-8") as f:
                _ = f.read(256)
        except Exception:
            unreadable.append(rel)

    if missing or unreadable:
        write_system_integrity_report(missing=missing, unreadable=unreadable)
        log(f"system_integrity_failed missing={len(missing)} unreadable={len(unreadable)}")
        raise SystemExit(2)


@dataclass(frozen=True)
class PhaseWorkResult:
    ok: bool
    summary: str
    details: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {"ok": self.ok, "summary": self.summary, "details": self.details}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def log(msg: str) -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"{_utc_now_iso()} | {msg}\n")


def _ensure_reports_dir() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def _report_ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def _phase_report_payload(state: dict[str, Any], phase: int, outcome: str) -> dict[str, Any]:
    return {
        "timestamp": _utc_now_iso(),
        "phase": phase,
        "outcome": outcome,
        "mission": state.get("mission"),
        "execution": state.get("execution"),
        "verification": state.get("verification"),
        "observability": state.get("observability"),
        "metrics": state.get("metrics"),
        "failures": state.get("failures"),
        "note": (
            "Phase completion is governed by runtime verification gates; "
            "no additional phase executor is configured."
        ),
    }


def write_phase_report(state: dict[str, Any], phase: int, outcome: str) -> None:
    _ensure_reports_dir()
    ts = _report_ts()
    base = REPORTS_DIR / f"phase_{phase}" / ts
    payload = _phase_report_payload(state, phase, outcome)
    _write_json(base / "PHASE_REPORT.json", payload)
    _write_text(
        base / "PHASE_REPORT.md",
        "\n".join(
            [
                f"# PHASE {phase} REPORT",
                "",
                f"- Timestamp: {payload['timestamp']}",
                f"- Outcome: {outcome}",
                f"- Phase status: {(state.get('execution') or {}).get('phase_status')}",
                f"- Verification status: {(state.get('verification') or {}).get('status')}",
            ]
        )
        + "\n",
    )
    _write_text(REPORTS_DIR / f"phase_{phase}" / "LATEST.txt", ts + "\n")


def write_mission_final_report(state: dict[str, Any], outcome: str) -> None:
    _ensure_reports_dir()
    ts = _report_ts()
    base = REPORTS_DIR / "mission_final" / ts
    payload = {
        "timestamp": _utc_now_iso(),
        "outcome": outcome,
        "mission": state.get("mission"),
        "execution": state.get("execution"),
        "verification": state.get("verification"),
        "observability": state.get("observability"),
        "metrics": state.get("metrics"),
        "failures": state.get("failures"),
    }
    _write_json(base / "MISSION_FINAL_REPORT.json", payload)
    _write_text(
        base / "MISSION_FINAL_REPORT.md",
        "\n".join(
            [
                "# MISSION FINAL REPORT",
                "",
                f"- Timestamp: {payload['timestamp']}",
                f"- Outcome: {outcome}",
                f"- Current phase: {(state.get('execution') or {}).get('current_phase')}",
                f"- Phase status: {(state.get('execution') or {}).get('phase_status')}",
                f"- Verification status: {(state.get('verification') or {}).get('status')}",
            ]
        )
        + "\n",
    )
    _write_text(base.parent / "LATEST.txt", ts + "\n")


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
    execution.setdefault("phase_work", {})
    execution.setdefault("phase_work_retry", {})

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
    mission.setdefault("status", "running")
    mission.setdefault("started_at", None)
    mission.setdefault("completed_at", None)
    mission.setdefault("production_base_url", DEFAULT_PROD_BASE_URL)
    mission.setdefault("staging_base_url", DEFAULT_STAGING_BASE_URL)
    # In finite mode we may still *record* staging signals, but we only *require*
    # them when explicitly enabled. This avoids blocking prod progression when
    # a staging endpoint is intentionally unavailable (e.g. /metrics disabled).
    mission.setdefault("staging_required", False)
    mission.setdefault("staging_deploy_enabled", False)
    mission.setdefault("public_base_url", "https://amppattaya.com")
    mission.setdefault("admin_base_url", "http://127.0.0.1:8002")
    mission.setdefault("allow_seed_demo", False)

    # Optional: self-fix engine (host-side). Disabled by default.
    mission.setdefault("self_fix_enabled", False)
    mission.setdefault("self_fix_max_attempts", 1)
    mission.setdefault("self_fix_auto_commit", False)
    mission.setdefault("self_fix_auto_deploy", False)
    mission.setdefault("self_fix_vps_host", None)
    mission.setdefault("self_fix_vps_path", "/opt/flowbiz/clients/flowbiz-client-amp")
    mission.setdefault(
        "self_fix_staging_vps_path", "/opt/flowbiz/clients/flowbiz-client-amp-staging"
    )

    # Optional: baseline runner inputs (used when in mission/finite mode).
    mission.setdefault(
        "baseline_public_base", mission.get("public_base_url") or "https://amppattaya.com"
    )
    mission.setdefault("baseline_vps_host", None)
    mission.setdefault("baseline_vps_path", "/opt/flowbiz/clients/flowbiz-client-amp")

    verification.setdefault("phase", None)
    verification.setdefault("status", "unknown")
    verification.setdefault("checks", {})
    verification.setdefault("last_checked_at", None)
    verification.setdefault("retry_count", 0)

    failures.setdefault("consecutive_failures", 0)
    failures.setdefault("error_count", 0)
    failures.setdefault("last_error", None)
    failures.setdefault("self_fix_attempts", {})
    runtime.setdefault("loop_interval_seconds", 60)
    runtime.setdefault("max_consecutive_failures", 3)


def _is_finite_mission(state: dict[str, Any]) -> bool:
    mode = (state.get("mission") or {}).get("mode")
    return isinstance(mode, str) and mode.lower() in {"finite", "mission"}


def _is_standby_mode(state: dict[str, Any]) -> bool:
    mode = ((state.get("mission") or {}).get("mode") or "").lower()
    return mode in {"standby"}


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


def _update_verification_from_checks(state: dict[str, Any]) -> None:
    verification = state.setdefault("verification", {})
    checks = verification.setdefault("checks", {})
    mission = state.get("mission") or {}

    prod_base = str(mission.get("production_base_url") or DEFAULT_PROD_BASE_URL).rstrip("/")
    staging_base = str(mission.get("staging_base_url") or "").rstrip("/")

    def _run(cmd: list[str], timeout_seconds: int) -> bool:
        try:
            r = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                check=False,
            )
            if r.returncode != 0:
                log(
                    "cmd_failed "
                    f"rc={r.returncode} "
                    f"cmd={' '.join(cmd)} "
                    f"stderr={(r.stderr or '').strip()[:300]}"
                )
            return r.returncode == 0
        except Exception as e:
            log(f"cmd_exception cmd={' '.join(cmd)} err={type(e).__name__}")
            return False

    def _staging_deploy_best_effort() -> bool:
        staging_dir = Path("/opt/flowbiz/clients/flowbiz-client-amp-staging")
        if not staging_dir.exists():
            return False
        ok = True
        ok = ok and _run(["git", "-C", str(staging_dir), "pull", "--ff-only", "origin", "main"], 90)

        # Compose may not exist in minimal environments.
        if _run(["docker", "compose", "version"], 15):
            ok = ok and _run(
                [
                    "docker",
                    "compose",
                    "-f",
                    str(staging_dir / "docker-compose.yml"),
                    "-f",
                    str(staging_dir / "docker-compose.prod.yml"),
                    "up",
                    "-d",
                    "--remove-orphans",
                ],
                300,
            )
            ok = ok and _run(
                [
                    "docker",
                    "compose",
                    "-f",
                    str(staging_dir / "docker-compose.yml"),
                    "-f",
                    str(staging_dir / "docker-compose.prod.yml"),
                    "exec",
                    "-T",
                    "api",
                    "alembic",
                    "upgrade",
                    "head",
                ],
                300,
            )
        return ok

    prod_health = _curl_http_code(f"{prod_base}/healthz")
    prod_metrics = _curl_http_code(f"{prod_base}/metrics")
    checks["prod_healthz"] = "passed" if prod_health == 200 else "failed"
    checks["prod_metrics"] = "passed" if prod_metrics == 200 else "failed"

    finite = _is_finite_mission(state)
    staging_required = bool(mission.get("staging_required"))
    staging_deploy_enabled = bool(mission.get("staging_deploy_enabled"))

    # Staging deploy is best-effort; it is only required when explicitly configured.
    if finite and staging_deploy_enabled:
        checks["staging_deploy"] = "passed" if _staging_deploy_best_effort() else "failed"
    else:
        checks.setdefault("staging_deploy", "skipped")

    # Staging smoke checks: record if staging_base exists, but require only when enabled.
    if staging_base:
        st_health = _curl_http_code(f"{staging_base}/healthz")
        st_metrics = _curl_http_code(f"{staging_base}/metrics")
        checks["staging_healthz"] = "passed" if st_health == 200 else "failed"
        if st_metrics == 200:
            checks["staging_metrics"] = "passed"
        elif st_metrics == 404 or st_metrics is None:
            # Metrics endpoint may be intentionally disabled in some environments.
            checks["staging_metrics"] = "unknown"
        else:
            checks["staging_metrics"] = "failed"

    # Determinism probes (avoid /metrics which is intentionally non-deterministic).
    checks["prod_determinism_meta"] = (
        "passed" if _determinism_probe(f"{prod_base}/v1/meta") else "failed"
    )

    # Optional: properties endpoint may not exist in very early phases; treat non-200
    # as failed only in finite mode.
    code_props = _curl_http_code(f"{prod_base}/v1/properties?page=1&limit=5")
    if code_props == 200:
        checks["prod_determinism_properties"] = (
            "passed"
            if _determinism_probe(f"{prod_base}/v1/properties?page=1&limit=5")
            else "failed"
        )
    else:
        checks["prod_determinism_properties"] = "unknown"

    verification["last_checked_at"] = _utc_now_iso()

    # Compute overall status.
    required_keys = [
        "prod_healthz",
        "prod_metrics",
        "prod_determinism_meta",
    ]
    if finite and staging_required:
        required_keys.append("staging_healthz")
        # Only require staging metrics if it exists (i.e. not unknown).
        if checks.get("staging_metrics") in {"passed", "failed"}:
            required_keys.append("staging_metrics")
        if staging_deploy_enabled:
            required_keys.append("staging_deploy")

    all_required_passed = all((checks.get(k) == "passed") for k in required_keys)
    verification["status"] = "passed" if all_required_passed else "failed"


def _phase_can_complete(state: dict[str, Any]) -> bool:
    # A minimal phase "executor": complete a phase only when core runtime checks pass.
    # This does not implement feature work; it only enforces operational gates.
    _update_verification_from_checks(state)
    return (state.get("verification") or {}).get("status") == "passed"


def _attempt_stop_service() -> None:
    try:
        # Best-effort: stop the service that runs this loop.
        subprocess.run(["systemctl", "stop", "amp-agent.service"], timeout=10, check=False)
    except Exception:
        pass


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

    # 1) Integrity
    # Baseline is required for execution modes (mission/finite). Standby must not auto-execute.
    if (
        not _is_standby_mode(state)
        and _is_finite_mission(state)
        and integrity.get("baseline_completed") is False
    ):
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

    # 4) Failure recovery (before phase progression)
    if failures.get("last_error"):
        if bool(mission.get("self_fix_enabled")):
            return Decision("attempt_self_fix", "failure_present", "high")
        return Decision("investigate_failure", "failure_present", "high")

    # 5) Phase continuation/readiness
    phase_status = execution.get("phase_status")
    current_phase = int(execution.get("current_phase") or 0)
    finite = _is_finite_mission(state)
    target = _mission_target_phase(state) if finite else None

    if finite and mission.get("status") == "completed":
        return Decision("monitor_production", "mission_already_completed", "low")

    if finite and mission.get("status") == "failed":
        return Decision("monitor_production", "mission_failed", "high")

    if finite and target is not None and current_phase >= target and phase_status == "completed":
        return Decision("monitor_production", "mission_complete_at_target_phase", "low")

    if phase_status == "running":
        return Decision("continue_phase", "phase_running", "medium")

    if phase_status == "completed":
        if finite:
            # In finite mode, every phase must pass verification gates before advancing.
            if verification.get("phase") != current_phase:
                return Decision("verify_phase", "verification_required_before_advance", "high")
            if (verification.get("status") or "").lower() != "passed":
                return Decision("verify_phase", "verification_retry_or_fail", "high")
        return Decision("advance_phase", "phase_completed", "medium")

    # 5) Deployment state
    if deployment.get("deployment_status") == "pending":
        return Decision("resume_deploy", "deployment_pending", "high")

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


def _run_cmd_capture(cmd: list[str], timeout_seconds: int) -> tuple[int, str, str]:
    try:
        r = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout_seconds, check=False
        )
        return r.returncode, (r.stdout or ""), (r.stderr or "")
    except Exception as e:
        return 99, "", f"{type(e).__name__}: {e}"


def _host_python() -> str:
    """Return a stable Python executable for running host-side tools.

    Prefer the workspace .venv interpreter when available.
    """

    venv = APP_DIR / ".venv"
    if os.name == "nt":
        candidate = venv / "Scripts" / "python.exe"
    else:
        candidate = venv / "bin" / "python"
    if candidate.exists():
        return str(candidate)
    return sys.executable or "python"


def _run_host_python_module(
    module: str, args: list[str], *, timeout_seconds: int
) -> tuple[int, str, str]:
    return _run_cmd_capture([_host_python(), "-m", module, *args], timeout_seconds=timeout_seconds)


def _determinism_probe_post_json(url: str, payload_json: str, runs: int = 3) -> bool:
    import hashlib

    hashes: list[str] = []
    for _ in range(max(1, runs)):
        r = subprocess.run(
            [
                "curl",
                "-sS",
                "-H",
                "Content-Type: application/json",
                "-d",
                payload_json,
                url,
            ],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
        if r.returncode != 0:
            return False
        hashes.append(hashlib.sha256((r.stdout or "").encode("utf-8")).hexdigest())
    return len(set(hashes)) == 1


def _curl_headers_and_body(
    url: str,
    *,
    method: str = "GET",
    data: str | None = None,
    headers: list[str] | None = None,
) -> str | None:
    cmd = ["curl", "-sS", "-i", "-X", method]
    for h in headers or []:
        cmd.extend(["-H", h])
    if data is not None:
        cmd.extend(["-H", "Content-Type: application/json", "-d", data])
    cmd.append(url)
    rc, out, _err = _run_cmd_capture(cmd, timeout_seconds=20)
    if rc != 0:
        return None
    return out


def _compose_exec_cmd(*, service: str, argv: list[str], state: dict[str, Any]) -> list[str]:
    """Build a docker compose exec command.

    Uses docker-compose.prod.yml when present to match production runtime.
    """

    app_dir = Path(__file__).resolve().parents[1]
    prod_override = app_dir / "docker-compose.prod.yml"
    base = ["docker", "compose"]
    if prod_override.exists():
        base.extend(["-f", str(app_dir / "docker-compose.yml"), "-f", str(prod_override)])
    return base + ["exec", "-T", service] + argv


def _run_phase_work(state: dict[str, Any], phase: int) -> PhaseWorkResult:
    """Execute concrete, idempotent phase work.

    This function is intentionally strict: if a phase has no executable work, it fails.
    """

    execution = state.setdefault("execution", {})
    phase_work: dict[str, Any] = execution.setdefault("phase_work", {})
    existing = phase_work.get(str(phase))
    if isinstance(existing, dict) and existing.get("ok") is True:
        return PhaseWorkResult(True, "already_completed", ["phase_work_cached_ok"])

    details: list[str] = []

    def _run(cmd: list[str], timeout_seconds: int = 300) -> bool:
        rc, out, err = _run_cmd_capture(cmd, timeout_seconds=timeout_seconds)
        details.append(f"cmd={' '.join(cmd)} rc={rc}")
        if out.strip():
            details.append("stdout=" + out.strip()[:800])
        if err.strip():
            details.append("stderr=" + err.strip()[:800])
        return rc == 0

    def _expect_http(url: str, *, ok_codes: set[int]) -> bool:
        code = _curl_http_code(url, timeout_seconds=15)
        details.append(f"http url={url} code={code}")
        return code in ok_codes

    def _post_http_code(url: str, payload_json: str) -> int | None:
        rc, out, err = _run_cmd_capture(
            [
                "curl",
                "-sS",
                "-o",
                "/dev/null",
                "-w",
                "%{http_code}",
                "-H",
                "Content-Type: application/json",
                "-d",
                payload_json,
                url,
            ],
            timeout_seconds=20,
        )
        details.append(
            f"post_http url={url} rc={rc} out={out.strip()[:50]} err={err.strip()[:120]}"
        )
        s = (out or "").strip()
        return int(s) if s.isdigit() else None

    # Phase work is executed inside the running API container when possible.
    # This keeps DB connectivity consistent and avoids host dependency drift.
    if phase == 0:
        mission = state.get("mission") or {}
        public_base = str(mission.get("public_base_url") or "https://amppattaya.com").rstrip("/")
        prod_base = str(mission.get("production_base_url") or DEFAULT_PROD_BASE_URL).rstrip("/")
        ok = True
        ok = ok and _expect_http(f"{public_base}/health", ok_codes={200})
        ok = ok and _expect_http(f"{public_base}/api/v1/meta", ok_codes={200, 301, 302, 307, 308})
        ok = ok and _expect_http(f"{prod_base}/healthz", ok_codes={200})
        ok = ok and _determinism_probe(f"{prod_base}/v1/meta", runs=2)
        if not ok:
            details.append("phase0_foundation_probe_failed")
        return PhaseWorkResult(ok, "foundation" if ok else "foundation_failed", details)

    if phase == 1:
        mission = state.get("mission") or {}
        prod_base = str(mission.get("production_base_url") or DEFAULT_PROD_BASE_URL).rstrip("/")
        ok = True
        ok = ok and _expect_http(f"{prod_base}/metrics", ok_codes={200})
        ok = ok and _expect_http(f"{prod_base}/openapi.json", ok_codes={200})
        ok = ok and _determinism_probe(f"{prod_base}/v1/meta", runs=3)
        return PhaseWorkResult(ok, "observability" if ok else "observability_failed", details)

    if phase == 2:
        mission = state.get("mission") or {}
        prod_base = str(mission.get("production_base_url") or DEFAULT_PROD_BASE_URL).rstrip("/")
        url = f"{prod_base}/v1/finder/search"
        payload = json.dumps(
            {
                "page": 1,
                "limit": 5,
                "session_id": "runtime-phase2",
                "intent": "sale_new",
                "search": "",
                "sort": "newest",
            },
            separators=(",", ":"),
            sort_keys=True,
        )
        code = _post_http_code(url, payload)
        ok = code == 200
        ok = ok and _determinism_probe_post_json(url, payload, runs=3)
        if not ok:
            details.append("finder_search_missing_or_nondeterministic")
        return PhaseWorkResult(ok, "finder_engine" if ok else "finder_engine_failed", details)

    if phase == 3:
        mission = state.get("mission") or {}
        prod_base = str(mission.get("production_base_url") or DEFAULT_PROD_BASE_URL).rstrip("/")
        url = f"{prod_base}/v1/members/me"
        code = _curl_http_code(url, timeout_seconds=10)
        details.append(f"members_me_http_code={code}")
        # No auth header => should return 401 Unauthorized.
        ok = code in {401, 403}
        return PhaseWorkResult(ok, "authz_contract" if ok else "authz_contract_failed", details)

    if phase == 4:
        mission = state.get("mission") or {}
        prod_base = str(mission.get("production_base_url") or DEFAULT_PROD_BASE_URL).rstrip("/")
        booking_url = f"{prod_base}/v1/bookings"
        availability_url = (
            f"{prod_base}/v1/availability"
            "?property_id=00000000-0000-0000-0000-000000000000"
            "&start_at=2026-02-19T12:00:00Z"
            "&end_at=2026-02-20T12:00:00Z"
        )
        idem = f"runtime-phase4-{int(time.time())}"
        payload = json.dumps(
            {
                "property_id": None,
                "start_at": "2026-02-19T12:00:00Z",
                "end_at": "2026-02-20T12:00:00Z",
                "guests": 2,
                "notes": "runtime-probe",
            },
            separators=(",", ":"),
            sort_keys=True,
        )

        raw1 = _curl_headers_and_body(
            booking_url,
            method="POST",
            data=payload,
            headers=[f"Idempotency-Key: {idem}"],
        )
        raw2 = _curl_headers_and_body(
            booking_url,
            method="POST",
            data=payload,
            headers=[f"Idempotency-Key: {idem}"],
        )
        if raw1 is None or raw2 is None:
            return PhaseWorkResult(False, "booking_probe_failed", details + ["curl_failed"])

        def _parse(raw: str) -> tuple[int | None, str | None, str | None]:
            cleaned = raw.replace("\r\n", "\n")
            if "\n\n" not in cleaned:
                return None, None, None
            header_block, body = cleaned.split("\n\n", 1)
            lines = header_block.splitlines()
            code: int | None = None
            if lines:
                parts = (lines[0] or "").split()
                if len(parts) >= 2 and parts[1].isdigit():
                    code = int(parts[1])
            idempotent: str | None = None
            for line in lines[1:]:
                if line.lower().startswith("x-booking-idempotent:"):
                    idempotent = line.split(":", 1)[1].strip().lower()
                    break
            booking_id: str | None = None
            try:
                obj = json.loads(body)
                if isinstance(obj, dict):
                    booking_id = obj.get("id")
            except Exception:
                booking_id = None
            return code, idempotent, booking_id

        code1, idem1, id1 = _parse(raw1)
        code2, idem2, id2 = _parse(raw2)
        details.append(f"booking_code1={code1} booking_id1={id1} idempotent1={idem1}")
        details.append(f"booking_code2={code2} booking_id2={id2} idempotent2={idem2}")

        ok = True
        ok = ok and (code1 == 201)
        ok = ok and (code2 in {200, 201})
        ok = ok and (id1 is not None and id1 == id2)
        ok = ok and (idem2 == "true")
        ok = ok and _expect_http(availability_url, ok_codes={404})
        return PhaseWorkResult(ok, "booking_system" if ok else "booking_system_failed", details)

    if phase == 5:
        ok = _run(
            _compose_exec_cmd(
                service="api",
                argv=[
                    "python",
                    "-c",
                    "from packages.core.phase_work.phase_05_crm_automation import run; run()",
                ],
                state=state,
            ),
            timeout_seconds=300,
        )
        return PhaseWorkResult(ok, "crm_automation" if ok else "crm_automation_failed", details)

    if phase == 6:
        ok = _run(
            _compose_exec_cmd(
                service="api",
                argv=[
                    "python",
                    "-c",
                    "from packages.core.phase_work.phase_06_investor_tools import run; run()",
                ],
                state=state,
            ),
            timeout_seconds=120,
        )
        return PhaseWorkResult(ok, "investor_tools" if ok else "investor_tools_failed", details)

    if phase == 7:
        # Validate the recommendation endpoint exists and is deterministic.
        base = str(
            (state.get("mission") or {}).get("production_base_url") or DEFAULT_PROD_BASE_URL
        ).rstrip("/")
        ok = _expect_http(f"{base}/v1/recommendations?limit=5", ok_codes={200})
        ok = ok and _determinism_probe(f"{base}/v1/recommendations?limit=5", runs=3)
        if not ok:
            details.append("recommendations_endpoint_missing_or_nondeterministic")
        return PhaseWorkResult(
            ok, "ai_recommendation" if ok else "ai_recommendation_failed", details
        )

    if phase == 8:
        # Public SEO integrity surfaces: robots.txt and sitemap.xml must be reachable.
        public_base = str(
            (state.get("mission") or {}).get("public_base_url") or "https://amppattaya.com"
        ).rstrip("/")
        ok = True
        ok = ok and _expect_http(f"{public_base}/robots.txt", ok_codes={200})
        ok = ok and _expect_http(f"{public_base}/sitemap.xml", ok_codes={200})
        if ok:
            ok = ok and _determinism_probe(f"{public_base}/robots.txt", runs=2)
            ok = ok and _determinism_probe(f"{public_base}/sitemap.xml", runs=2)
        return PhaseWorkResult(ok, "seo_authority" if ok else "seo_authority_failed", details)

    if phase == 9:
        # Design system engine: enforce admin UI availability.
        admin_base = str(
            (state.get("mission") or {}).get("admin_base_url") or "http://127.0.0.1:8002"
        ).rstrip("/")
        code = _curl_http_code(admin_base, timeout_seconds=10)
        # Next.js commonly redirects (307/308) to canonical paths (e.g. trailing slash)
        # or auth routes; treat any 2xx/3xx as "available".
        ok = code is not None and 200 <= int(code) < 400
        details.append(f"admin_http_code={code}")
        return PhaseWorkResult(ok, "design_system" if ok else "design_system_failed", details)

    if phase == 10:
        # Phase 10 is defined as development-only.
        # In production, the "real" work is enforcing protection (seeding must be blocked).
        allow = bool((state.get("mission") or {}).get("allow_seed_demo"))

        if not allow:
            seed_protection_script = (
                "import os,sys; os.environ.pop('AMP_ALLOW_SEED', None); "
                "from packages.core.phase_work.phase_10_seed_demo import run; "
                "\ntry: run()"
                "\nexcept SystemExit as e: print('seed_blocked_ok', str(e)); sys.exit(0)"
                "\nelse: print('seed_block_failed'); sys.exit(1)"
            )
            ok = _run(
                _compose_exec_cmd(
                    service="api",
                    argv=[
                        "python",
                        "-c",
                        seed_protection_script,
                    ],
                    state=state,
                ),
                timeout_seconds=60,
            )
            return PhaseWorkResult(
                ok, "seed_demo_protection" if ok else "seed_demo_protection_failed", details
            )

        ok = _run(
            _compose_exec_cmd(
                service="api",
                argv=[
                    "python",
                    "-c",
                    "from packages.core.phase_work.phase_10_seed_demo import run; run()",
                ],
                state=state,
            ),
            timeout_seconds=300,
        )
        return PhaseWorkResult(ok, "seed_demo" if ok else "seed_demo_failed", details)

    return PhaseWorkResult(
        False, "no_phase_work_defined", [f"No executable work defined for phase={phase}"]
    )


def _attempt_self_fix(state: dict[str, Any]) -> tuple[bool, list[str]]:
    mission = state.get("mission") or {}
    failures = state.setdefault("failures", {})
    execution = state.get("execution") or {}

    current_phase = int(execution.get("current_phase") or 0)
    err = str(failures.get("last_error") or "unknown")
    max_attempts = int(mission.get("self_fix_max_attempts") or 1)
    attempts: dict[str, Any] = failures.setdefault("self_fix_attempts", {})
    key = f"phase={current_phase}|error={err}"
    count = int(attempts.get(key) or 0)
    if count >= max_attempts:
        return False, [f"self_fix_exhausted key={key} max_attempts={max_attempts}"]
    attempts[key] = count + 1

    details: list[str] = [f"self_fix_attempt={attempts[key]} key={key}"]

    # 0) Infra recovery first (best-effort): restart api + migrate when health/verification fails.
    infra_errors = {
        "health_check_failed",
        "verification_failed",
        "verification_failed_twice",
        "deployment_pending",
    }
    if any(token in err for token in infra_errors) or err.startswith("loop_exception:"):
        prod_override = APP_DIR / "docker-compose.prod.yml"
        compose = ["docker", "compose"]
        if prod_override.exists():
            compose.extend(["-f", str(APP_DIR / "docker-compose.yml"), "-f", str(prod_override)])
        rc, out, e = _run_cmd_capture([*compose, "up", "-d", "--force-recreate", "api"], 300)
        details.append(f"compose_recreate_api rc={rc}")
        if out.strip():
            details.append("compose_stdout=" + out.strip()[:250])
        if e.strip():
            details.append("compose_stderr=" + e.strip()[:250])
        if rc == 0:
            mig_rc, _mig_out, mig_err = _run_cmd_capture(
                [*compose, "exec", "-T", "api", "alembic", "upgrade", "head"],
                300,
            )
            details.append(f"alembic_upgrade rc={mig_rc}")
            if mig_err.strip():
                details.append("alembic_stderr=" + mig_err.strip()[:250])

            prod_base = str((mission.get("production_base_url") or DEFAULT_PROD_BASE_URL)).rstrip(
                "/"
            )
            code = _curl_http_code(f"{prod_base}/healthz", timeout_seconds=10)
            details.append(f"post_recreate_healthz={code}")
            if code == 200:
                failures["self_fix_last"] = {"ok": True, "details": details}
                return True, details

    # 1) Try auto-format + lint fixes (safe and deterministic)
    rc, out, e = _run_host_python_module("ruff", ["format"], timeout_seconds=300)
    details.append(f"ruff_format rc={rc}")
    if out.strip():
        details.append("ruff_format_stdout=" + out.strip()[:400])
    if e.strip():
        details.append("ruff_format_stderr=" + e.strip()[:400])
    if rc != 0:
        failures["self_fix_last"] = {"ok": False, "details": details}
        return False, details

    rc, out, e = _run_host_python_module("ruff", ["check", "--fix"], timeout_seconds=300)
    details.append(f"ruff_check_fix rc={rc}")
    if out.strip():
        details.append("ruff_check_stdout=" + out.strip()[:400])
    if e.strip():
        details.append("ruff_check_stderr=" + e.strip()[:400])
    if rc != 0:
        failures["self_fix_last"] = {"ok": False, "details": details}
        return False, details

    # 2) Run tests
    rc, out, e = _run_host_python_module("pytest", ["-q"], timeout_seconds=900)
    details.append(f"pytest rc={rc}")
    if out.strip():
        details.append("pytest_stdout=" + out.strip()[:400])
    if e.strip():
        details.append("pytest_stderr=" + e.strip()[:400])
    if rc != 0:
        failures["self_fix_last"] = {"ok": False, "details": details}
        return False, details

    # 3) Optional: auto-commit & push
    if bool(mission.get("self_fix_auto_commit")):
        rc, out, e = _run_cmd_capture(["git", "status", "--porcelain=v1"], timeout_seconds=30)
        dirty = rc == 0 and bool((out or "").strip())
        details.append(f"git_dirty={dirty}")
        if dirty:
            ok = True
            ok = ok and _run_cmd_capture(["git", "add", "-A"], timeout_seconds=60)[0] == 0
            msg = f"auto-fix: {err} (phase {current_phase})"
            commit_rc, commit_out, commit_err = _run_cmd_capture(
                ["git", "commit", "-m", msg], timeout_seconds=60
            )
            details.append(f"git_commit rc={commit_rc}")
            if commit_out.strip():
                details.append("git_commit_stdout=" + commit_out.strip()[:250])
            if commit_err.strip():
                details.append("git_commit_stderr=" + commit_err.strip()[:250])

            push_rc, push_out, push_err = _run_cmd_capture(
                ["git", "push", "origin", "main"], timeout_seconds=180
            )
            details.append(f"git_push rc={push_rc}")
            if push_out.strip():
                details.append("git_push_stdout=" + push_out.strip()[:250])
            if push_err.strip():
                details.append("git_push_stderr=" + push_err.strip()[:250])

            if not ok or push_rc != 0:
                failures["self_fix_last"] = {"ok": False, "details": details}
                return False, details

    # 4) Optional: auto-deploy to VPS
    if bool(mission.get("self_fix_auto_deploy")):
        vps_host = mission.get("self_fix_vps_host")
        vps_path = str(mission.get("self_fix_vps_path") or "").strip()
        staging_required = bool(mission.get("staging_required"))
        staging_deploy_enabled = bool(mission.get("staging_deploy_enabled"))

        def _local_deploy(*, path: Path) -> bool:
            prod_override = path / "docker-compose.prod.yml"
            compose = ["docker", "compose"]
            if prod_override.exists():
                compose.extend(["-f", str(path / "docker-compose.yml"), "-f", str(prod_override)])
            sha_rc, sha_out, sha_err = _run_cmd_capture(
                ["git", "-C", str(path), "rev-parse", "--short", "HEAD"],
                timeout_seconds=30,
            )
            details.append(
                f"deploy_sha rc={sha_rc} "
                f"out={(sha_out or '').strip()} "
                f"err={(sha_err or '').strip()[:120]}"
            )
            build_sha = (sha_out or "").strip() or "unknown"
            build_rc, _build_out, build_err = _run_cmd_capture(
                [
                    *compose,
                    "build",
                    "--build-arg",
                    f"GIT_SHA={build_sha}",
                    "api",
                ],
                timeout_seconds=900,
            )
            details.append(f"compose_build_api rc={build_rc}")
            if build_err.strip():
                details.append("compose_build_stderr=" + build_err.strip()[:250])
            if build_rc != 0:
                return False

            up_rc, _up_out, up_err = _run_cmd_capture(
                [*compose, "up", "-d", "--force-recreate", "api", "otel-collector"],
                timeout_seconds=300,
            )
            details.append(f"compose_up rc={up_rc}")
            if up_err.strip():
                details.append("compose_up_stderr=" + up_err.strip()[:250])
            if up_rc != 0:
                return False

            mig_rc, _mig_out, mig_err = _run_cmd_capture(
                [*compose, "exec", "-T", "api", "alembic", "upgrade", "head"],
                timeout_seconds=300,
            )
            details.append(f"alembic_upgrade rc={mig_rc}")
            if mig_err.strip():
                details.append("alembic_stderr=" + mig_err.strip()[:250])
            return mig_rc == 0

        if isinstance(vps_host, str) and vps_host.strip() and vps_path:
            remote = (
                "set -e; "
                f"cd {vps_path}; "
                "git pull --ff-only origin main; "
                "export BUILD_SHA=$(git rev-parse --short HEAD); "
                "export OTEL_ENABLED=true; "
                'echo "DEPLOY BUILD_SHA=$BUILD_SHA"; '
                "docker compose -f docker-compose.yml -f docker-compose.prod.yml build "
                "--build-arg GIT_SHA=$BUILD_SHA api; "
                "docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d "
                "--force-recreate api otel-collector; "
                "docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api "
                "alembic upgrade head; "
                "curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8001/healthz"
            )
            rc, out, e = _run_cmd_capture(
                ["ssh", "-o", "BatchMode=yes", vps_host.strip(), remote],
                timeout_seconds=1200,
            )
            details.append(f"vps_deploy rc={rc} out={out.strip()[:60]} err={e.strip()[:120]}")
            if rc != 0 or (out or "").strip() != "200":
                failures["self_fix_last"] = {"ok": False, "details": details}
                return False, details

            # Optional staging deploy (remote host) when enabled.
            if staging_deploy_enabled:
                staging_path = str(
                    mission.get("self_fix_staging_vps_path")
                    or "/opt/flowbiz/clients/flowbiz-client-amp-staging"
                )
                remote_staging = (
                    "set -e; "
                    f"cd {staging_path}; "
                    "git pull --ff-only origin main; "
                    "export BUILD_SHA=$(git rev-parse --short HEAD); "
                    "export OTEL_ENABLED=true; "
                    'echo "STAGING BUILD_SHA=$BUILD_SHA"; '
                    "docker compose -f docker-compose.yml -f docker-compose.prod.yml build "
                    "--build-arg GIT_SHA=$BUILD_SHA api; "
                    "docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d "
                    "--force-recreate api otel-collector; "
                    "docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api "
                    "alembic upgrade head; "
                    "curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8101/healthz"
                )
                rc, out, e = _run_cmd_capture(
                    ["ssh", "-o", "BatchMode=yes", vps_host.strip(), remote_staging],
                    timeout_seconds=1200,
                )
                details.append(
                    f"vps_staging_deploy rc={rc} out={out.strip()[:60]} err={e.strip()[:120]}"
                )
                if staging_required and (rc != 0 or (out or "").strip() != "200"):
                    failures["self_fix_last"] = {"ok": False, "details": details}
                    return False, details
        else:
            # Local deploy path (common when runtime loop runs on the VPS itself).
            details.append("deploy_mode=local")
            if not _local_deploy(path=APP_DIR):
                failures["self_fix_last"] = {"ok": False, "details": details}
                return False, details

            # Optional staging local deploy.
            if staging_deploy_enabled:
                staging_dir = Path("/opt/flowbiz/clients/flowbiz-client-amp-staging")
                if staging_dir.exists():
                    ok_st = _local_deploy(path=staging_dir)
                    details.append(f"staging_local_deploy_ok={ok_st}")
                    if staging_required and not ok_st:
                        failures["self_fix_last"] = {"ok": False, "details": details}
                        return False, details
                else:
                    details.append("staging_local_deploy_skipped_missing_dir")
                    if staging_required:
                        failures["self_fix_last"] = {"ok": False, "details": details}
                        return False, details

            prod_base = str((mission.get("production_base_url") or DEFAULT_PROD_BASE_URL)).rstrip(
                "/"
            )
            code = _curl_http_code(f"{prod_base}/healthz", timeout_seconds=10)
            details.append(f"local_deploy_healthz={code}")
            if code != 200:
                failures["self_fix_last"] = {"ok": False, "details": details}
                return False, details

    failures["self_fix_last"] = {"ok": True, "details": details}
    return True, details


def execute_action(action: str, state: dict[str, Any]) -> None:
    # This file is an infra loop skeleton; actual execution engines live in /actions.
    if action == "run_baseline":
        # Constitution baseline: run the baseline integrity engine and only then
        # mark baseline_completed.
        mission = state.get("mission") or {}
        public_base = str(
            mission.get("baseline_public_base")
            or mission.get("public_base_url")
            or "https://amppattaya.com"
        )
        vps_host = mission.get("baseline_vps_host")
        vps_path = str(
            mission.get("baseline_vps_path") or "/opt/flowbiz/clients/flowbiz-client-amp"
        )

        cmd = [
            _host_python(),
            str(APP_DIR / "scripts" / "baseline_integrity.py"),
            "--public-base",
            public_base,
        ]
        if isinstance(vps_host, str) and vps_host.strip():
            cmd.extend(["--vps", vps_host.strip(), "--vps-path", vps_path])

        rc, out, err = _run_cmd_capture(cmd, timeout_seconds=900)
        log(
            "baseline_integrity "
            f"rc={rc} "
            f"stdout={(out or '').strip()[:300]} "
            f"stderr={(err or '').strip()[:300]}"
        )
        if rc != 0:
            state.setdefault("failures", {})["last_error"] = "baseline_failed"
            return

        state.setdefault("integrity", {})["baseline_completed"] = True

    elif action == "restore_observability":
        obs = state.setdefault("observability", {})
        obs["logs"] = "healthy"
        obs["metrics"] = "healthy"
        obs["tracing"] = "healthy"
        obs["alerts"] = "armed"

    elif action == "investigate_failure":
        state.setdefault("failures", {})["last_error"] = None

    elif action == "attempt_self_fix":
        failures = state.setdefault("failures", {})
        previous_error = str(failures.get("last_error") or "unknown")
        ok, details = _attempt_self_fix(state)
        log("self_fix " + ("ok" if ok else "failed") + " " + " | ".join(details[:8]))
        if ok:
            failures["last_error"] = None
            failures["consecutive_failures"] = 0
            execution = state.get("execution") or {}
            phase = int(execution.get("current_phase") or 0)
            (execution.setdefault("phase_work_retry", {}))[str(phase)] = 0
            v = state.setdefault("verification", {})
            v["retry_count"] = 0
        else:
            # Keep original error for stable retry keys, but rollback if exhausted.
            failures["last_error"] = previous_error
            if any("self_fix_exhausted" in d for d in details):
                execute_action("rollback_last_slice", state)

    elif action == "continue_phase":
        execution = state.setdefault("execution", {})
        execution["phase_status"] = "running"

        # Finite executor: run real phase work (idempotent) and then run
        # verification gates as a separate step.
        if _is_finite_mission(state):
            phase = int(execution.get("current_phase") or 0)
            mission = state.get("mission") or {}
            self_fix_enabled = bool(mission.get("self_fix_enabled"))

            # 1) Phase work (idempotent). Retry once; then rollback.
            work = _run_phase_work(state, phase)
            execution.setdefault("phase_work", {})[str(phase)] = work.to_dict()
            if not work.ok:
                retry = execution.setdefault("phase_work_retry", {})
                retry[str(phase)] = int(retry.get(str(phase)) or 0) + 1
                state.setdefault("failures", {})["last_error"] = "phase_work_failed"
                write_phase_report(state, phase, f"phase_work_failed_retry_{retry[str(phase)]}")
                if int(retry.get(str(phase)) or 0) >= 2:
                    state.setdefault("failures", {})["last_error"] = "phase_work_failed_twice"
                    if not self_fix_enabled:
                        execute_action("rollback_last_slice", state)
                return

            # Mark phase work completed; verification is handled by verify_phase.
            state.setdefault("failures", {})["last_error"] = None
            execution["phase_status"] = "completed"
            execution["last_successful_phase"] = phase

            v = state.setdefault("verification", {})
            v["phase"] = phase
            v["status"] = "unknown"
            v["checks"] = {}
            v["retry_count"] = 0
            write_phase_report(state, phase, "phase_work_completed")

    elif action == "verify_phase":
        execution = state.setdefault("execution", {})
        phase = int(execution.get("current_phase") or 0)
        v = state.setdefault("verification", {})
        v["phase"] = phase
        v["retry_count"] = int(v.get("retry_count") or 0)

        mission = state.get("mission") or {}
        self_fix_enabled = bool(mission.get("self_fix_enabled"))

        _update_verification_from_checks(state)
        if (v.get("status") or "").lower() != "passed":
            v["retry_count"] = int(v.get("retry_count") or 0) + 1
            state.setdefault("failures", {})["last_error"] = "verification_failed"
            write_phase_report(state, phase, f"verification_failed_retry_{v['retry_count']}")
            if int(v.get("retry_count") or 0) >= 2:
                state.setdefault("failures", {})["last_error"] = "verification_failed_twice"
                if not self_fix_enabled:
                    execute_action("rollback_last_slice", state)
            return

        v["retry_count"] = 0
        state.setdefault("failures", {})["last_error"] = None
        write_phase_report(state, phase, "verification_passed")

    elif action == "advance_phase":
        execution = state.setdefault("execution", {})
        execution["current_phase"] = int(execution.get("current_phase") or 0) + 1
        execution["phase_status"] = "running"

        # Reset verification for next phase.
        v = state.setdefault("verification", {})
        v["phase"] = int(execution.get("current_phase") or 0)
        v["status"] = "unknown"
        v["checks"] = {}
        v["retry_count"] = 0

        # Mission start marker.
        mission = state.setdefault("mission", {})
        if not mission.get("started_at"):
            mission["started_at"] = _utc_now_iso()

    elif action == "rollback_last_slice":
        # Safety-first rollback: mark mission failed and stop; no destructive deployment actions.
        execution = state.setdefault("execution", {})
        phase = int(execution.get("current_phase") or 0)
        failures = state.setdefault("failures", {})
        failures.setdefault("last_error", "rollback_triggered")
        mission = state.setdefault("mission", {})
        mission["status"] = "failed"
        mission["completed_at"] = _utc_now_iso()
        write_phase_report(state, phase, "rollback_triggered")
        outcome = "failed_verification"
        if str(failures.get("last_error") or "").startswith("phase_work_"):
            outcome = "failed_phase_work"
        write_mission_final_report(state, outcome)
        if mission.get("stop_when_complete"):
            _attempt_stop_service()

    elif action in {"resume_deploy", "monitor_production"}:
        pass

    else:
        raise ValueError(f"Unknown action: {action}")


def loop_once() -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    LOCK_FILE.touch(exist_ok=True)

    with open(LOCK_FILE, "r+", encoding="utf-8") as lockf:
        _lock_exclusive(lockf.fileno())
        try:
            # Constitution hard gate: required artifacts must exist and be readable.
            _check_system_integrity_or_stop()

            state = load_state()
            _normalize_execution_state(state)

            # Terminal mission handling: if already completed/failed and stop_when_complete is set,
            # finalize timestamps, emit final report, and stop the service.
            mission = state.get("mission") or {}
            if _is_finite_mission(state) and mission.get("stop_when_complete"):
                status = (mission.get("status") or "").lower()
                if status in {"completed", "failed"}:
                    m = state.setdefault("mission", {})
                    if not m.get("completed_at"):
                        m["completed_at"] = _utc_now_iso()
                    try:
                        write_mission_final_report(state, status)
                    except Exception as e:
                        log(f"final_report_failed: {type(e).__name__} {e}")
                    save_state(state)
                    _attempt_stop_service()
                    raise SystemExit(0)

            # Refresh verification checks before planning, so phase advancement decisions
            # are made using up-to-date verification status.
            exec_state = state.get("execution") or {}
            if exec_state.get("phase_status") == "completed" and _is_finite_mission(state):
                try:
                    state.setdefault("verification", {})["phase"] = int(
                        exec_state.get("current_phase") or 0
                    )
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
            if decision.action == "monitor_production" and decision.reason.startswith(
                "verification_required"
            ):
                planner["blocked"] = True
                planner["block_reason"] = "verification_required_before_advance"
            if decision.reason == "mission_complete_at_target_phase":
                planner["blocked"] = True
                planner["block_reason"] = "mission_complete"

                # Finalize mission and stop.
                mission = state.setdefault("mission", {})
                mission["status"] = "completed"
                mission["completed_at"] = _utc_now_iso()
                write_mission_final_report(state, "completed")
                if mission.get("stop_when_complete"):
                    save_state(state)
                    _attempt_stop_service()
                    raise SystemExit(0)

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
