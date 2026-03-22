#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import shutil
import subprocess
import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

ISSUE_FIXED_PREFIX = "issue fixed:"
ISSUE_BLOCKED_PREFIX = "issue blocked:"
VALIDATION_PREFIX = "validation:"
COMMIT_PREFIX = "commit:"
NEXT_PREFIX = "next:"
STOP_SENTINEL = "STOP"
TERMINAL_STATUSES = {
    "bootstrap_failed",
    "completed",
    "dry-run-complete",
    "failed",
    "stopped",
}


class RunnerError(Exception):
    pass


@dataclass(slots=True)
class RunnerConfig:
    repo_root: Path
    prompt_file: Path
    log_dir: Path
    state_file: Path
    queue_file: Path
    next_run_file: Path
    live_status_file: Path
    live_status_json_file: Path
    rounds: int
    retry_limit: int
    retry_backoff_sec: int
    command_template: str
    command_template_source: str
    selected_cli: str
    max_stale_rounds: int
    smoke_command: str | None = None
    command_timeout_sec: int | None = None
    dry_run: bool = False


@dataclass(slots=True)
class ParsedOutput:
    status: str
    issues_fixed: list[str] = field(default_factory=list)
    issues_blocked: list[str] = field(default_factory=list)
    validations: list[str] = field(default_factory=list)
    commit: str | None = None
    next_steps: list[str] = field(default_factory=list)
    missing_fields: list[str] = field(default_factory=list)


def now_ts() -> str:
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


def iso_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def read_text(path: Path) -> str:
    if not path.exists():
        raise RunnerError(f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def append_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as file_handle:
        file_handle.write(content)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def update_session_file(path: Path, **updates: Any) -> None:
    payload: dict[str, Any] = {}
    if path.exists():
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            payload = {}
    payload.update(updates)
    payload["updated_at"] = iso_now()
    write_json(path, payload)


def render_live_status(payload: dict[str, Any]) -> str:
    status = str(payload.get("status", "unknown"))
    lifecycle = "final" if status in TERMINAL_STATUSES else "active"
    lines = [f"# Refactor Runner Live Status ({lifecycle.title()})", ""]
    lines.append(f"- status: {status}")
    lines.append(f"- lifecycle: {lifecycle}")

    selected_cli = payload.get("selected_cli")
    if selected_cli:
        lines.append(f"- cli: {selected_cli}")

    command_template_source = payload.get("command_template_source")
    if command_template_source:
        lines.append(f"- command template source: {command_template_source}")

    branch = payload.get("branch")
    if branch:
        lines.append(f"- branch: {branch}")

    started_at = payload.get("started_at")
    if started_at:
        lines.append(f"- started at: {started_at}")

    elapsed_seconds = payload.get("elapsed_seconds")
    if elapsed_seconds is not None:
        lines.append(f"- elapsed: {format_duration(int(elapsed_seconds))}")

    round_limit = payload.get("round_limit")
    current_round = payload.get("current_round")
    if current_round:
        if round_limit:
            lines.append(f"- round: {current_round} of {round_limit}")
        else:
            lines.append(f"- round: {current_round}")

    attempt = payload.get("current_attempt")
    attempt_limit = payload.get("attempt_limit")
    if attempt:
        if attempt_limit:
            lines.append(f"- attempt: {attempt} of {attempt_limit}")
        else:
            lines.append(f"- attempt: {attempt}")

    retry_countdown_sec = payload.get("retry_countdown_sec")
    if retry_countdown_sec is not None:
        lines.append(f"- retry countdown: {retry_countdown_sec}s")

    next_retry_attempt = payload.get("next_retry_attempt")
    if next_retry_attempt:
        lines.append(f"- next retry attempt: {next_retry_attempt}")

    rounds_completed = payload.get("rounds_completed")
    if rounds_completed is not None:
        lines.append(f"- rounds completed: {rounds_completed}")

    stale_rounds = payload.get("stale_rounds")
    if stale_rounds is not None:
        lines.append(f"- stale rounds: {stale_rounds}")

    last_commit_value = payload.get("last_commit")
    if last_commit_value:
        lines.append(f"- last commit: {last_commit_value}")

    updated_at = payload.get("updated_at")
    if updated_at:
        lines.append(f"- updated at: {updated_at}")

    log_dir = payload.get("log_dir")
    if log_dir:
        lines.append(f"- log dir: {log_dir}")

    session_file = payload.get("session_file")
    if session_file:
        lines.append(f"- session file: {session_file}")

    current_prompt_file = payload.get("current_prompt_file")
    if current_prompt_file:
        lines.append(f"- current prompt file: {current_prompt_file}")

    last_message_file = payload.get("last_message_file")
    if last_message_file:
        lines.append(f"- last message file: {last_message_file}")

    last_validated_round = payload.get("last_validated_round")
    if last_validated_round is not None:
        lines.append(f"- last validated round: {last_validated_round}")

    last_validation_summary = payload.get("last_validation_summary")
    if last_validation_summary:
        lines.append(f"- last validation summary: {last_validation_summary}")

    current_activity = payload.get("current_activity")
    if current_activity:
        lines.extend(["", "## Current Activity", str(current_activity)])

    last_output = payload.get("last_output") or {}
    if last_output:
        lines.extend(["", "## Last Agent Output"])
        parsed_status = last_output.get("status")
        if parsed_status:
            lines.append(f"- parsed status: {parsed_status}")
        for item in last_output.get("issues_fixed") or []:
            lines.append(f"- issue fixed: {item}")
        for item in last_output.get("issues_blocked") or []:
            lines.append(f"- issue blocked: {item}")
        for item in last_output.get("validations") or []:
            lines.append(f"- validation: {item}")
        last_output_commit = last_output.get("commit")
        if last_output_commit:
            lines.append(f"- commit: {last_output_commit}")
        for item in last_output.get("next_steps") or []:
            lines.append(f"- next: {item}")
        missing_fields = last_output.get("missing_fields") or []
        if missing_fields:
            lines.append(f"- missing fields: {', '.join(missing_fields)}")

    last_error = payload.get("last_error")
    if last_error:
        lines.extend(["", "## Last Error", str(last_error)])

    stop_reason = payload.get("stop_reason")
    if stop_reason:
        lines.extend(["", "## Stop Reason", str(stop_reason)])

    return "\n".join(lines).strip() + "\n"


def update_live_status(cfg: RunnerConfig, **updates: Any) -> None:
    payload: dict[str, Any] = {}
    if cfg.live_status_json_file.exists():
        try:
            payload = json.loads(cfg.live_status_json_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            payload = {}

    payload.update(updates)
    payload["log_dir"] = str(cfg.log_dir)
    payload["session_file"] = str(cfg.log_dir / "session.json")
    payload["round_limit"] = cfg.rounds
    payload["attempt_limit"] = cfg.retry_limit + 1
    payload["selected_cli"] = cfg.selected_cli
    payload["command_template_source"] = cfg.command_template_source
    payload.setdefault("started_at", iso_now())
    started_at_raw = payload.get("started_at")
    if isinstance(started_at_raw, str):
        try:
            started_at_value = dt.datetime.fromisoformat(started_at_raw)
            payload["elapsed_seconds"] = max(
                0,
                int((utc_now() - started_at_value).total_seconds()),
            )
        except ValueError:
            payload["elapsed_seconds"] = None
    payload["updated_at"] = iso_now()

    write_json(cfg.live_status_json_file, payload)
    write_text(cfg.live_status_file, render_live_status(payload))


def format_duration(total_seconds: int) -> str:
    minutes, seconds = divmod(max(0, total_seconds), 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}h {minutes}m {seconds}s"
    if minutes:
        return f"{minutes}m {seconds}s"
    return f"{seconds}s"


def detect_command_template() -> tuple[str, str, str]:
    if shutil.which("claude"):
        return (
            "claude code --print --input-file {prompt_file}",
            "auto-detected",
            "claude",
        )

    if shutil.which("codex"):
        return (
            (
                'cmd /d /s /c "codex exec -c mcp_servers={} '
                '-c model_reasoning_effort=high '
                '-c shell_environment_policy.inherit=all '
                '--color never '
                '-C {repo_root} '
                '--output-last-message {last_message_file} - < {prompt_file} '
                '&& type {last_message_file}"'
            ),
            "auto-detected",
            "codex",
        )

    raise RunnerError("No supported agent CLI found on PATH. Checked: claude, codex")


def run_cmd(
    cmd: str,
    cwd: Path,
    timeout_sec: int | None = None,
) -> subprocess.CompletedProcess[str]:
    timeout = timeout_sec if timeout_sec and timeout_sec > 0 else None
    return subprocess.run(
        cmd,
        cwd=str(cwd),
        shell=True,
        text=True,
        capture_output=True,
        timeout=timeout,
    )


def git_worktree_clean(repo_root: Path) -> bool:
    result = run_cmd("git status --porcelain", repo_root)
    if result.returncode != 0:
        raise RunnerError(f"git status failed:\n{result.stderr}")
    return result.stdout.strip() == ""


def git_branch(repo_root: Path) -> str:
    result = run_cmd("git rev-parse --abbrev-ref HEAD", repo_root)
    if result.returncode != 0:
        raise RunnerError(f"git branch lookup failed:\n{result.stderr}")
    return result.stdout.strip()


def last_commit(repo_root: Path) -> str | None:
    result = run_cmd("git rev-parse --short HEAD", repo_root)
    if result.returncode != 0:
        return None
    return result.stdout.strip() or None


def resolve_path(repo_root: Path, raw_path: str) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path.resolve()
    return (repo_root / path).resolve()


def relative_display(path: Path, repo_root: Path) -> str:
    try:
        return str(path.relative_to(repo_root))
    except ValueError:
        return str(path)


def extract_prefixed_lines(output: str, prefix: str) -> list[str]:
    matches: list[str] = []
    needle = prefix.lower()
    for raw_line in output.splitlines():
        line = raw_line.strip()
        if line.lower().startswith(needle):
            matches.append(line[len(prefix) :].strip())
    return matches


def parse_agent_output(output: str) -> ParsedOutput:
    if any(line.strip().upper() == STOP_SENTINEL for line in output.splitlines()):
        return ParsedOutput(status="stop")

    issues_fixed = extract_prefixed_lines(output, ISSUE_FIXED_PREFIX)
    issues_blocked = extract_prefixed_lines(output, ISSUE_BLOCKED_PREFIX)
    validations = extract_prefixed_lines(output, VALIDATION_PREFIX)
    commits = extract_prefixed_lines(output, COMMIT_PREFIX)
    next_steps = extract_prefixed_lines(output, NEXT_PREFIX)

    missing_fields: list[str] = []
    if not issues_fixed and not issues_blocked:
        missing_fields.append("issue fixed|issue blocked")
    if not validations:
        missing_fields.append("validation")
    if not commits:
        missing_fields.append("commit")
    if not next_steps:
        missing_fields.append("next")

    status = "progress" if not missing_fields else "unknown"
    commit = commits[-1] if commits else None
    return ParsedOutput(
        status=status,
        issues_fixed=issues_fixed,
        issues_blocked=issues_blocked,
        validations=validations,
        commit=commit,
        next_steps=next_steps,
        missing_fields=missing_fields,
    )


def build_runtime_prompt(cfg: RunnerConfig, base_prompt: str, round_no: int) -> str:
    state = read_text(cfg.state_file)
    queue = read_text(cfg.queue_file)
    next_run = read_text(cfg.next_run_file)

    return f"""
{base_prompt}

RUNTIME CONTROLLER NOTE
- automated round: {round_no}
- continue from current repository state
- read the control files fresh before changing code
- do not redo closed work
- if stop conditions are met, output STOP exactly on its own line
- otherwise complete the work and emit the required machine-readable footer

CURRENT CONTROL FILE SNAPSHOT
=== {relative_display(cfg.state_file, cfg.repo_root)} ===
{state}

=== {relative_display(cfg.queue_file, cfg.repo_root)} ===
{queue}

=== {relative_display(cfg.next_run_file, cfg.repo_root)} ===
{next_run}
""".strip()


def build_command(
    command_template: str,
    prompt_path: Path,
    repo_root: Path,
    last_message_path: Path,
) -> str:
    quoted_prompt = subprocess.list2cmdline([str(prompt_path)])
    quoted_repo = subprocess.list2cmdline([str(repo_root)])
    quoted_last_message = subprocess.list2cmdline([str(last_message_path)])
    return (
        command_template.replace("{prompt_file}", quoted_prompt)
        .replace("{repo_root}", quoted_repo)
        .replace("{last_message_file}", quoted_last_message)
    )


def runner_log(log_dir: Path, message: str) -> None:
    stamp = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    append_text(log_dir / "runner.log", f"[{stamp}] {message}\n")


def save_attempt_artifacts(
    log_dir: Path,
    round_no: int,
    attempt_no: int,
    prompt: str,
    stdout: str,
    stderr: str,
    metadata: dict[str, Any],
) -> None:
    attempt_dir = log_dir / f"round-{round_no:03d}" / f"attempt-{attempt_no:02d}"
    attempt_dir.mkdir(parents=True, exist_ok=True)
    write_text(attempt_dir / "prompt.txt", prompt)
    write_text(attempt_dir / "stdout.txt", stdout)
    write_text(attempt_dir / "stderr.txt", stderr)
    write_json(attempt_dir / "metadata.json", metadata)


def save_round_contract(log_dir: Path, round_no: int, parsed_output: ParsedOutput) -> None:
    round_dir = log_dir / f"round-{round_no:03d}"
    round_dir.mkdir(parents=True, exist_ok=True)
    write_json(round_dir / "contract.json", asdict(parsed_output))


def save_smoke_artifacts(
    log_dir: Path,
    round_no: int,
    command: str,
    stdout: str,
    stderr: str,
    returncode: int,
) -> None:
    smoke_dir = log_dir / f"round-{round_no:03d}" / "smoke"
    smoke_dir.mkdir(parents=True, exist_ok=True)
    write_text(smoke_dir / "command.txt", command)
    write_text(smoke_dir / "stdout.txt", stdout)
    write_text(smoke_dir / "stderr.txt", stderr)
    write_json(smoke_dir / "metadata.json", {"returncode": returncode})


def stale_round_count(
    previous_count: int,
    *,
    commit_changed: bool,
    worktree_clean: bool,
    blocked: bool,
) -> int:
    if commit_changed or blocked or not worktree_clean:
        return 0
    return previous_count + 1


def validate_control_files(cfg: RunnerConfig) -> None:
    for required_path in (cfg.prompt_file, cfg.state_file, cfg.queue_file, cfg.next_run_file):
        _ = read_text(required_path)


def sleep_with_retry_countdown(
    cfg: RunnerConfig,
    round_no: int,
    attempt: int,
    current_prompt_file: Path,
) -> None:
    for seconds_remaining in range(cfg.retry_backoff_sec, 0, -1):
        update_live_status(
            cfg,
            status="retry-wait",
            current_round=round_no,
            current_attempt=attempt,
            current_prompt_file=str(current_prompt_file),
            retry_countdown_sec=seconds_remaining,
            next_retry_attempt=attempt + 1,
            current_activity=(
                f"Round {round_no} attempt {attempt} failed. "
                f"Retrying in {seconds_remaining} seconds."
            ),
        )
        time.sleep(1)


def emit_stop(reason: str, repo_root: Path) -> None:
    print(f"STOP\nreason: {reason}\nlast_commit: {last_commit(repo_root) or 'none'}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Continuous refactor loop runner")
    parser.add_argument("--repo-root", default=".", help="Path to repository root")
    parser.add_argument("--prompt-file", required=True, help="Base prompt file")
    parser.add_argument("--rounds", type=int, default=10, help="Maximum controller rounds")
    parser.add_argument("--retry-limit", type=int, default=2, help="Retries per failed round")
    parser.add_argument(
        "--retry-backoff-sec",
        type=int,
        default=8,
        help="Retry backoff seconds",
    )
    parser.add_argument(
        "--command-template",
        help=(
            "Shell command template to invoke your Claude or agent CLI. "
            "Use {prompt_file} for the generated runtime prompt, {repo_root} when needed, "
            "and {last_message_file} when the CLI can write a final response to a file. "
            "If omitted, the runner auto-detects a supported CLI."
        ),
    )
    parser.add_argument(
        "--max-stale-rounds",
        type=int,
        default=2,
        help="Stop after this many clean rounds without a new commit",
    )
    parser.add_argument(
        "--smoke-command",
        help="Optional post-round smoke command that must succeed after each round",
    )
    parser.add_argument(
        "--command-timeout-sec",
        type=int,
        default=0,
        help="Optional timeout per agent command attempt; 0 disables timeout",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate prompts and logs only; do not run the agent command",
    )
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    prompt_file = resolve_path(repo_root, args.prompt_file)
    log_dir = (repo_root / "logs" / "refactor_runner" / now_ts()).resolve()
    log_dir.mkdir(parents=True, exist_ok=True)

    try:
        command_template, command_template_source, selected_cli = (
            (args.command_template, "user-supplied", "custom")
            if args.command_template
            else detect_command_template()
        )
    except RunnerError as exc:
        print(f"Runner bootstrap failed: {exc}", file=sys.stderr)
        return 1

    cfg = RunnerConfig(
        repo_root=repo_root,
        prompt_file=prompt_file,
        log_dir=log_dir,
        state_file=repo_root / ".ai" / "refactor-state.md",
        queue_file=repo_root / ".ai" / "refactor-queue.md",
        next_run_file=repo_root / ".ai" / "next-run.md",
        live_status_file=repo_root / ".ai" / "refactor-live-status.md",
        live_status_json_file=repo_root / ".ai" / "refactor-live-status.json",
        rounds=args.rounds,
        retry_limit=args.retry_limit,
        retry_backoff_sec=args.retry_backoff_sec,
        command_template=command_template,
        command_template_source=command_template_source,
        selected_cli=selected_cli,
        max_stale_rounds=args.max_stale_rounds,
        smoke_command=args.smoke_command,
        command_timeout_sec=args.command_timeout_sec or None,
        dry_run=args.dry_run,
    )
    session_path = cfg.log_dir / "session.json"

    update_session_file(
        session_path,
        repo_root=str(cfg.repo_root),
        prompt_file=str(cfg.prompt_file),
        log_dir=str(cfg.log_dir),
        started_at=iso_now(),
        status="bootstrapping",
        round_limit=cfg.rounds,
        retry_limit=cfg.retry_limit,
        retry_backoff_sec=cfg.retry_backoff_sec,
        max_stale_rounds=cfg.max_stale_rounds,
        smoke_command=cfg.smoke_command,
        dry_run=cfg.dry_run,
    )
    update_live_status(
        cfg,
        status="bootstrapping",
        started_at=iso_now(),
        branch=None,
        current_round=0,
        current_attempt=0,
        rounds_completed=0,
        stale_rounds=0,
        last_commit=None,
        current_prompt_file=None,
        retry_countdown_sec=None,
        next_retry_attempt=None,
        last_validated_round=None,
        last_validation_summary=None,
        last_message_file=None,
        current_activity="Verifying control files and repository state before the loop starts.",
        stop_reason=None,
        last_error=None,
        last_output=None,
    )

    try:
        validate_control_files(cfg)
        base_prompt = read_text(cfg.prompt_file)
        branch = git_branch(cfg.repo_root)
        clean = git_worktree_clean(cfg.repo_root)
        starting_commit = last_commit(cfg.repo_root)
    except Exception as exc:
        update_session_file(session_path, status="bootstrap_failed", stop_reason=str(exc))
        update_live_status(
            cfg,
            status="bootstrap_failed",
            current_activity="Bootstrap failed before the refactor loop could start.",
            stop_reason=str(exc),
            last_error=str(exc),
        )
        print(f"Runner bootstrap failed: {exc}", file=sys.stderr)
        return 1

    runner_log(cfg.log_dir, f"repo_root={cfg.repo_root}")
    runner_log(cfg.log_dir, f"branch={branch}")
    runner_log(cfg.log_dir, f"worktree_clean={clean}")
    runner_log(cfg.log_dir, f"prompt_file={cfg.prompt_file}")
    runner_log(cfg.log_dir, f"round_limit={cfg.rounds}")
    runner_log(cfg.log_dir, f"max_stale_rounds={cfg.max_stale_rounds}")
    runner_log(cfg.log_dir, f"selected_cli={cfg.selected_cli}")
    runner_log(cfg.log_dir, f"command_template_source={cfg.command_template_source}")
    update_session_file(
        session_path,
        status="running",
        branch=branch,
        worktree_clean_at_start=clean,
        last_commit=starting_commit,
        rounds_completed=0,
        stale_rounds=0,
    )
    update_live_status(
        cfg,
        status="running",
        branch=branch,
        current_round=0,
        current_attempt=0,
        rounds_completed=0,
        stale_rounds=0,
        last_commit=starting_commit,
        current_prompt_file=None,
        current_activity="Runner is ready. Waiting to start round 1.",
    )

    if not clean:
        runner_log(cfg.log_dir, "WARNING: worktree not clean at startup")
        update_live_status(
            cfg,
            current_activity="Runner started with a dirty worktree. Proceed carefully.",
        )

    previous_commit = starting_commit
    stale_rounds = 0

    for round_no in range(1, cfg.rounds + 1):
        runtime_prompt = build_runtime_prompt(cfg, base_prompt, round_no)
        runtime_prompt_path = cfg.log_dir / f"runtime-prompt-round-{round_no:03d}.txt"
        write_text(runtime_prompt_path, runtime_prompt)
        update_session_file(
            session_path,
            current_round=round_no,
            last_prompt_file=str(runtime_prompt_path),
        )
        update_live_status(
            cfg,
            status="running",
            current_round=round_no,
            current_attempt=0,
            current_prompt_file=str(runtime_prompt_path),
            retry_countdown_sec=None,
            next_retry_attempt=None,
            current_activity=(
                f"Round {round_no}: built the runtime prompt and is waiting "
                "to launch the agent command."
            ),
            last_error=None,
        )

        if cfg.dry_run:
            runner_log(cfg.log_dir, f"dry_run round={round_no}")
            update_live_status(
                cfg,
                status="dry_run",
                rounds_completed=round_no,
                current_prompt_file=str(runtime_prompt_path),
                current_activity=f"Dry run only: generated prompt for round {round_no}.",
            )
            print(f"[dry-run] generated prompt: {runtime_prompt_path}")
            continue

        success = False
        stdout = ""
        stderr = ""

        for attempt in range(1, cfg.retry_limit + 2):
            last_message_path = (
                cfg.log_dir
                / f"round-{round_no:03d}"
                / f"attempt-{attempt:02d}"
                / "last-message.txt"
            )
            cmd = build_command(
                cfg.command_template,
                runtime_prompt_path,
                cfg.repo_root,
                last_message_path,
            )
            runner_log(cfg.log_dir, f"round={round_no} attempt={attempt} command={cmd}")
            runner_log(cfg.log_dir, f"round={round_no} attempt={attempt} started")
            attempt_started_at = iso_now()
            timed_out = False
            returncode = -1
            update_live_status(
                cfg,
                status="running",
                current_round=round_no,
                current_attempt=attempt,
                current_prompt_file=str(runtime_prompt_path),
                last_message_file=str(last_message_path),
                retry_countdown_sec=None,
                next_retry_attempt=None,
                current_activity=(
                    f"Round {round_no} attempt {attempt}: waiting for the agent CLI to finish."
                ),
                last_error=None,
            )

            try:
                result = run_cmd(cmd, cfg.repo_root, cfg.command_timeout_sec)
                stdout = result.stdout or ""
                stderr = result.stderr or ""
                returncode = result.returncode
            except subprocess.TimeoutExpired as exc:
                timed_out = True
                stdout = exc.stdout or ""
                stderr = (exc.stderr or "") + (
                    f"\nCommand timed out after {cfg.command_timeout_sec} seconds."
                )
                returncode = 124

            save_attempt_artifacts(
                cfg.log_dir,
                round_no,
                attempt,
                runtime_prompt,
                stdout,
                stderr,
                {
                    "attempt": attempt,
                    "command": cmd,
                    "returncode": returncode,
                    "round": round_no,
                    "started_at": attempt_started_at,
                    "finished_at": iso_now(),
                    "last_message_file": str(last_message_path),
                    "timed_out": timed_out,
                },
            )

            runner_log(
                cfg.log_dir,
                (
                    f"round={round_no} attempt={attempt} "
                    f"returncode={returncode} timed_out={timed_out}"
                ),
            )
            update_live_status(
                cfg,
                current_round=round_no,
                current_attempt=attempt,
                current_prompt_file=str(runtime_prompt_path),
                last_message_file=str(last_message_path),
                retry_countdown_sec=None,
                next_retry_attempt=None,
                current_activity=(
                    f"Round {round_no} attempt {attempt} finished with exit code {returncode}."
                ),
                last_error=(stderr.strip() or None) if returncode != 0 else None,
            )

            if returncode == 0:
                success = True
                break

            if attempt <= cfg.retry_limit:
                runner_log(
                    cfg.log_dir,
                    (
                        f"round={round_no} attempt={attempt} failed; "
                        f"backing off {cfg.retry_backoff_sec}s"
                    ),
                )
                update_live_status(
                    cfg,
                    current_prompt_file=str(runtime_prompt_path),
                    last_message_file=str(last_message_path),
                )
                sleep_with_retry_countdown(cfg, round_no, attempt, runtime_prompt_path)

        if not success:
            stop_reason = f"agent command failed after retries on round {round_no}"
            runner_log(cfg.log_dir, f"STOP: {stop_reason}")
            update_session_file(
                session_path,
                status="failed",
                stop_reason=stop_reason,
                rounds_completed=round_no - 1,
                last_commit=last_commit(cfg.repo_root),
                stale_rounds=stale_rounds,
            )
            update_live_status(
                cfg,
                status="failed",
                current_round=round_no,
                current_attempt=cfg.retry_limit + 1,
                rounds_completed=round_no - 1,
                stale_rounds=stale_rounds,
                last_commit=last_commit(cfg.repo_root),
                current_prompt_file=str(runtime_prompt_path),
                retry_countdown_sec=None,
                next_retry_attempt=None,
                current_activity=(
                    f"Round {round_no} exhausted all retries and the runner is stopping."
                ),
                stop_reason=stop_reason,
            )
            emit_stop(stop_reason, cfg.repo_root)
            return 2

        parsed_output = parse_agent_output(stdout)
        save_round_contract(cfg.log_dir, round_no, parsed_output)
        runner_log(cfg.log_dir, f"round={round_no} parsed_status={parsed_output.status}")
        update_live_status(
            cfg,
            current_round=round_no,
            current_attempt=0,
            current_prompt_file=str(runtime_prompt_path),
            retry_countdown_sec=None,
            next_retry_attempt=None,
            current_activity=f"Round {round_no}: agent output received and parsed.",
            last_output=asdict(parsed_output),
            last_error=None,
        )

        print(f"\n===== ROUND {round_no} OUTPUT START =====\n")
        print(stdout.strip())
        print(f"\n===== ROUND {round_no} OUTPUT END =====\n")

        if parsed_output.status == "stop":
            stop_reason = f"agent emitted STOP on round {round_no}"
            runner_log(cfg.log_dir, f"STOP: {stop_reason}")
            update_session_file(
                session_path,
                status="completed",
                stop_reason=stop_reason,
                rounds_completed=round_no,
                last_commit=last_commit(cfg.repo_root),
                stale_rounds=stale_rounds,
            )
            update_live_status(
                cfg,
                status="completed",
                current_round=round_no,
                rounds_completed=round_no,
                stale_rounds=stale_rounds,
                last_commit=last_commit(cfg.repo_root),
                current_prompt_file=str(runtime_prompt_path),
                current_activity="The agent requested STOP and the runner finished cleanly.",
                stop_reason=stop_reason,
            )
            return 0

        if parsed_output.status == "unknown":
            missing = ", ".join(parsed_output.missing_fields)
            stop_reason = f"unknown output contract on round {round_no}; missing: {missing}"
            runner_log(cfg.log_dir, f"STOP: {stop_reason}")
            update_session_file(
                session_path,
                status="stopped",
                stop_reason=stop_reason,
                rounds_completed=round_no - 1,
                last_commit=last_commit(cfg.repo_root),
                stale_rounds=stale_rounds,
            )
            update_live_status(
                cfg,
                status="stopped",
                current_round=round_no,
                rounds_completed=round_no - 1,
                stale_rounds=stale_rounds,
                last_commit=last_commit(cfg.repo_root),
                current_prompt_file=str(runtime_prompt_path),
                current_activity="The agent output did not satisfy the required contract.",
                stop_reason=stop_reason,
            )
            emit_stop(stop_reason, cfg.repo_root)
            return 3

        try:
            validate_control_files(cfg)
            current_branch = git_branch(cfg.repo_root)
            current_commit = last_commit(cfg.repo_root)
            worktree_clean_after = git_worktree_clean(cfg.repo_root)
        except Exception as exc:
            stop_reason = f"required repo checks failed after round {round_no}: {exc}"
            runner_log(cfg.log_dir, f"STOP: {stop_reason}")
            update_session_file(
                session_path,
                status="stopped",
                stop_reason=stop_reason,
                rounds_completed=round_no - 1,
                last_commit=last_commit(cfg.repo_root),
                stale_rounds=stale_rounds,
            )
            update_live_status(
                cfg,
                status="stopped",
                current_round=round_no,
                rounds_completed=round_no - 1,
                stale_rounds=stale_rounds,
                last_commit=last_commit(cfg.repo_root),
                current_prompt_file=str(runtime_prompt_path),
                current_activity="Post-round repository checks failed.",
                stop_reason=stop_reason,
                last_error=str(exc),
            )
            emit_stop(stop_reason, cfg.repo_root)
            return 4

        if current_branch != branch:
            stop_reason = (
                f"branch changed during execution on round {round_no}: "
                f"{branch} -> {current_branch}"
            )
            runner_log(cfg.log_dir, f"STOP: {stop_reason}")
            update_session_file(
                session_path,
                status="stopped",
                stop_reason=stop_reason,
                rounds_completed=round_no - 1,
                last_commit=current_commit,
                stale_rounds=stale_rounds,
            )
            update_live_status(
                cfg,
                status="stopped",
                current_round=round_no,
                rounds_completed=round_no - 1,
                stale_rounds=stale_rounds,
                last_commit=current_commit,
                current_prompt_file=str(runtime_prompt_path),
                current_activity="The checked out branch changed while the runner was active.",
                stop_reason=stop_reason,
            )
            emit_stop(stop_reason, cfg.repo_root)
            return 5

        if cfg.smoke_command:
            runner_log(cfg.log_dir, f"round={round_no} smoke_command={cfg.smoke_command}")
            update_live_status(
                cfg,
                current_round=round_no,
                current_prompt_file=str(runtime_prompt_path),
                current_activity=f"Round {round_no}: running smoke command.",
            )
            smoke = run_cmd(cfg.smoke_command, cfg.repo_root)
            save_smoke_artifacts(
                cfg.log_dir,
                round_no,
                cfg.smoke_command,
                smoke.stdout or "",
                smoke.stderr or "",
                smoke.returncode,
            )
            if smoke.returncode != 0:
                stop_reason = f"smoke command failed after round {round_no}"
                runner_log(cfg.log_dir, f"STOP: {stop_reason}")
                update_session_file(
                    session_path,
                    status="stopped",
                    stop_reason=stop_reason,
                    rounds_completed=round_no - 1,
                    last_commit=current_commit,
                    stale_rounds=stale_rounds,
                )
                update_live_status(
                    cfg,
                    status="stopped",
                    current_round=round_no,
                    rounds_completed=round_no - 1,
                    stale_rounds=stale_rounds,
                    last_commit=current_commit,
                    current_prompt_file=str(runtime_prompt_path),
                    current_activity="Smoke validation failed and the runner stopped.",
                    stop_reason=stop_reason,
                    last_error=(smoke.stderr or "").strip() or None,
                )
                emit_stop(stop_reason, cfg.repo_root)
                return 6
            update_live_status(
                cfg,
                current_round=round_no,
                current_prompt_file=str(runtime_prompt_path),
                current_activity=f"Round {round_no}: smoke command passed.",
                last_error=None,
            )

        stale_rounds = stale_round_count(
            stale_rounds,
            commit_changed=current_commit != previous_commit,
            worktree_clean=worktree_clean_after,
            blocked=bool(parsed_output.issues_blocked),
        )
        previous_commit = current_commit
        runner_log(
            cfg.log_dir,
            (
                f"round={round_no} last_commit={current_commit} "
                f"worktree_clean={worktree_clean_after} stale_rounds={stale_rounds}"
            ),
        )

        update_session_file(
            session_path,
            status="running",
            rounds_completed=round_no,
            last_commit=current_commit,
            stale_rounds=stale_rounds,
            last_contract=asdict(parsed_output),
            worktree_clean_after_round=worktree_clean_after,
        )
        validation_summary = (
            "worktree_clean="
            f"{worktree_clean_after}; "
            f"smoke={'passed' if cfg.smoke_command else 'skipped'}; "
            f"agent_validations={len(parsed_output.validations)}"
        )
        update_live_status(
            cfg,
            status="running",
            current_round=round_no,
            rounds_completed=round_no,
            stale_rounds=stale_rounds,
            last_commit=current_commit,
            current_prompt_file=str(runtime_prompt_path),
            last_validated_round=round_no,
            last_validation_summary=validation_summary,
            current_activity=(
                f"Round {round_no} complete. Preparing the next round if the watchdog allows it."
            ),
        )

        if stale_rounds >= cfg.max_stale_rounds:
            stop_reason = (
                f"watchdog detected {stale_rounds} consecutive clean rounds "
                "without a new commit"
            )
            runner_log(cfg.log_dir, f"STOP: {stop_reason}")
            update_session_file(
                session_path,
                status="stopped",
                stop_reason=stop_reason,
                rounds_completed=round_no,
                last_commit=current_commit,
                stale_rounds=stale_rounds,
            )
            update_live_status(
                cfg,
                status="stopped",
                current_round=round_no,
                rounds_completed=round_no,
                stale_rounds=stale_rounds,
                last_commit=current_commit,
                current_prompt_file=str(runtime_prompt_path),
                current_activity="The stale-round watchdog stopped the loop.",
                stop_reason=stop_reason,
            )
            emit_stop(stop_reason, cfg.repo_root)
            return 7

    if cfg.dry_run:
        update_session_file(
            session_path,
            status="dry-run-complete",
            rounds_completed=cfg.rounds,
            stop_reason="dry run completed",
            last_commit=last_commit(cfg.repo_root),
        )
        update_live_status(
            cfg,
            status="dry-run-complete",
            rounds_completed=cfg.rounds,
            last_commit=last_commit(cfg.repo_root),
            current_prompt_file=str(runtime_prompt_path),
            current_activity="Dry run completed successfully.",
            stop_reason="dry run completed",
        )
        print(f"[dry-run] completed {cfg.rounds} prompt generation rounds in {cfg.log_dir}")
        return 0

    stop_reason = f"controller round limit reached ({cfg.rounds})"
    runner_log(cfg.log_dir, f"STOP: {stop_reason}")
    update_session_file(
        session_path,
        status="stopped",
        stop_reason=stop_reason,
        rounds_completed=cfg.rounds,
        last_commit=last_commit(cfg.repo_root),
        stale_rounds=stale_rounds,
    )
    update_live_status(
        cfg,
        status="stopped",
        current_round=cfg.rounds,
        rounds_completed=cfg.rounds,
        stale_rounds=stale_rounds,
        last_commit=last_commit(cfg.repo_root),
        current_prompt_file=str(runtime_prompt_path),
        current_activity="The configured round limit was reached.",
        stop_reason=stop_reason,
    )
    emit_stop(stop_reason, cfg.repo_root)
    return 0


if __name__ == "__main__":
    sys.exit(main())
