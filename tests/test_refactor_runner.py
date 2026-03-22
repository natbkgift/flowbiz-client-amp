from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "tools" / "refactor_runner.py"
SPEC = importlib.util.spec_from_file_location("refactor_runner", MODULE_PATH)
assert SPEC is not None
assert SPEC.loader is not None
RUNNER = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = RUNNER
SPEC.loader.exec_module(RUNNER)


def test_parse_agent_output_accepts_progress_contract() -> None:
    output = """
issue fixed: UX-101 - clarified dashboard drill-down handoff
validation: npm --prefix admin-app run build (passed)
commit: abc1234
next: inspect secondary admin empty states for another safe gap
""".strip()

    parsed = RUNNER.parse_agent_output(output)

    assert parsed.status == "progress"
    assert parsed.issues_fixed == ["UX-101 - clarified dashboard drill-down handoff"]
    assert parsed.issues_blocked == []
    assert parsed.validations == ["npm --prefix admin-app run build (passed)"]
    assert parsed.commit == "abc1234"
    assert parsed.next_steps == ["inspect secondary admin empty states for another safe gap"]
    assert parsed.missing_fields == []


def test_parse_agent_output_accepts_blocked_contract() -> None:
    output = """
issue blocked: UX-202 - waiting on missing domain fixture data
validation: targeted tests not run because the dependency data is absent
commit: none
next: unblock test data before retrying the workflow pass
""".strip()

    parsed = RUNNER.parse_agent_output(output)

    assert parsed.status == "progress"
    assert parsed.issues_fixed == []
    assert parsed.issues_blocked == ["UX-202 - waiting on missing domain fixture data"]
    assert parsed.commit == "none"


def test_parse_agent_output_detects_stop() -> None:
    parsed = RUNNER.parse_agent_output("STOP")
    assert parsed.status == "stop"
    assert parsed.missing_fields == []

    parsed_lower = RUNNER.parse_agent_output("stop")
    assert parsed_lower.status == "stop"


def test_parse_agent_output_requires_machine_footer() -> None:
    output = """
issue fixed: UX-404 - improved queue copy
validation: pytest tests/test_refactor_runner.py
next: add smoke command coverage
""".strip()

    parsed = RUNNER.parse_agent_output(output)

    assert parsed.status == "unknown"
    assert parsed.missing_fields == ["commit"]


def test_detect_command_template_prefers_claude_over_codex(
    monkeypatch,
) -> None:
    def fake_which(name: str) -> str | None:
        if name == "claude":
            return "C:/bin/claude.exe"
        if name == "codex":
            return "C:/bin/codex.exe"
        return None

    monkeypatch.setattr(RUNNER.shutil, "which", fake_which)

    template, source, cli = RUNNER.detect_command_template()

    assert template == "claude code --print --input-file {prompt_file}"
    assert source == "auto-detected"
    assert cli == "claude"


def test_detect_command_template_uses_codex_overrides_and_repo_root(
    monkeypatch,
) -> None:
    def fake_which(name: str) -> str | None:
        if name == "codex":
            return "C:/bin/codex.exe"
        return None

    monkeypatch.setattr(RUNNER.shutil, "which", fake_which)

    template, source, cli = RUNNER.detect_command_template()

    assert source == "auto-detected"
    assert cli == "codex"
    assert "-c mcp_servers={}" in template
    assert "-c model_reasoning_effort=high" in template
    assert "-c shell_environment_policy.inherit=all" in template
    assert "--color never" in template
    assert "-C {repo_root}" in template
    assert "--output-last-message {last_message_file}" in template
    assert "< {prompt_file}" in template


def test_render_live_status_marks_active_and_final_states() -> None:
    active_status = RUNNER.render_live_status(
        {
            "status": "retry-wait",
            "selected_cli": "codex",
            "command_template_source": "auto-detected",
            "started_at": "2026-03-22T14:00:00+00:00",
            "elapsed_seconds": 12,
            "retry_countdown_sec": 4,
            "next_retry_attempt": 2,
            "current_prompt_file": "logs/refactor_runner/runtime-prompt-round-001.txt",
            "last_message_file": "logs/refactor_runner/round-001/attempt-01/last-message.txt",
            "last_validated_round": 1,
            "last_validation_summary": "worktree_clean=True",
        }
    )
    final_status = RUNNER.render_live_status(
        {
            "status": "completed",
            "selected_cli": "codex",
            "command_template_source": "auto-detected",
            "started_at": "2026-03-22T14:00:00+00:00",
            "elapsed_seconds": 24,
            "current_prompt_file": "logs/refactor_runner/runtime-prompt-round-001.txt",
            "last_message_file": "logs/refactor_runner/round-001/attempt-01/last-message.txt",
            "last_validated_round": 1,
            "last_validation_summary": "worktree_clean=True",
        }
    )

    assert "# Refactor Runner Live Status (Active)" in active_status
    assert "- lifecycle: active" in active_status
    assert "- retry countdown: 4s" in active_status
    assert "- next retry attempt: 2" in active_status
    assert "# Refactor Runner Live Status (Final)" in final_status
    assert "- lifecycle: final" in final_status
    assert "- last validated round: 1" in final_status
    assert "- last validation summary: worktree_clean=True" in final_status


def test_stale_round_count_resets_when_worktree_or_blocker_changes() -> None:
    assert RUNNER.stale_round_count(
        1,
        commit_changed=True,
        worktree_clean=True,
        blocked=False,
    ) == 0
    assert RUNNER.stale_round_count(
        1,
        commit_changed=False,
        worktree_clean=False,
        blocked=False,
    ) == 0
    assert RUNNER.stale_round_count(
        1,
        commit_changed=False,
        worktree_clean=True,
        blocked=True,
    ) == 0
    assert RUNNER.stale_round_count(
        1,
        commit_changed=False,
        worktree_clean=True,
        blocked=False,
    ) == 2
