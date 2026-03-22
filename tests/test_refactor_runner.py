from __future__ import annotations

import importlib.util
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

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


@pytest.mark.skipif(
    shutil.which("pwsh") is None,
    reason="pwsh is required for wrapper regression coverage",
)
@pytest.mark.parametrize(
    ("command_template", "expects_override"),
    [
        ("", False),
        ("custom-cli --prompt {prompt_file}", True),
    ],
)
def test_run_refactor_wrapper_only_forwards_command_template_when_explicitly_supplied(
    tmp_path: Path,
    command_template: str,
    expects_override: bool,
) -> None:
    repo_root = tmp_path / "repo"
    repo_root.mkdir()
    capture_path = tmp_path / "captured-args.json"
    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    fake_python = fake_bin / "python"
    fake_python.write_text(
        "\n".join(
            [
                "#!/usr/bin/env python3",
                "import json",
                "import os",
                "import sys",
                "from pathlib import Path",
                (
                    'Path(os.environ["CAPTURE_ARGS_PATH"]).write_text('
                    'json.dumps(sys.argv[1:]), encoding="utf-8")'
                ),
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    fake_python.chmod(0o755)

    env = os.environ.copy()
    env["PATH"] = f"{fake_bin}{os.pathsep}{env['PATH']}"
    env["CAPTURE_ARGS_PATH"] = str(capture_path)

    cmd = [
        "pwsh",
        "-NoProfile",
        "-File",
        str(ROOT / "tools" / "run-refactor.ps1"),
        "-RepoRoot",
        str(repo_root),
        "-PromptFile",
        "tools/prompts/refactor_loop_v3.txt",
        "-DryRun",
        "-NoWatchStatus",
    ]
    if command_template:
        cmd.extend(["-CommandTemplate", command_template])

    result = subprocess.run(
        cmd,
        cwd=ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    captured_args = json.loads(capture_path.read_text(encoding="utf-8"))
    assert "--dry-run" in captured_args
    assert captured_args[:2] == ["tools/refactor_runner.py", "--repo-root"]

    if expects_override:
        index = captured_args.index("--command-template")
        assert captured_args[index + 1] == command_template
    else:
        assert "--command-template" not in captured_args


def test_main_retry_countdown_updates_live_status_runtime_artifacts(
    tmp_path: Path,
    monkeypatch,
) -> None:
    repo_root = tmp_path
    ai_dir = repo_root / ".ai"
    ai_dir.mkdir()
    prompt_file = repo_root / "tools" / "prompts" / "refactor_loop_v3.txt"
    prompt_file.parent.mkdir(parents=True)
    prompt_file.write_text("Base controller prompt", encoding="utf-8")
    (ai_dir / "refactor-state.md").write_text("# state\n", encoding="utf-8")
    (ai_dir / "refactor-queue.md").write_text("# queue\n", encoding="utf-8")
    (ai_dir / "next-run.md").write_text("# next\n", encoding="utf-8")

    agent_results = [
        subprocess.CompletedProcess(
            args="fake-agent",
            returncode=1,
            stdout="",
            stderr="first failure",
        ),
        subprocess.CompletedProcess(
            args="fake-agent",
            returncode=0,
            stdout=(
                "issue fixed: retry countdown artifacts verified\n"
                "validation: pytest tests/test_refactor_runner.py (passed)\n"
                "commit: none\n"
                "next: inspect any remaining runner observability gap\n"
            ),
            stderr="",
        ),
    ]
    executed_commands: list[str] = []
    retry_snapshots: list[dict[str, object]] = []

    def fake_run_cmd(
        cmd: str,
        cwd: Path,
        timeout_sec: int | None = None,
    ) -> subprocess.CompletedProcess[str]:
        assert cwd == repo_root
        assert timeout_sec is None
        executed_commands.append(cmd)
        return agent_results.pop(0)

    def fake_sleep(seconds: int) -> None:
        assert seconds == 1
        payload = json.loads((ai_dir / "refactor-live-status.json").read_text(encoding="utf-8"))
        retry_snapshots.append(payload)

    monkeypatch.setattr(RUNNER, "run_cmd", fake_run_cmd)
    monkeypatch.setattr(RUNNER, "git_branch", lambda _: "copilot/refactor-implementation-quality")
    monkeypatch.setattr(RUNNER, "git_worktree_clean", lambda _: True)
    monkeypatch.setattr(RUNNER, "last_commit", lambda _: "abc1234")
    monkeypatch.setattr(RUNNER.time, "sleep", fake_sleep)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "refactor_runner.py",
            "--repo-root",
            str(repo_root),
            "--prompt-file",
            str(prompt_file),
            "--rounds",
            "1",
            "--retry-limit",
            "1",
            "--retry-backoff-sec",
            "3",
            "--max-stale-rounds",
            "5",
            "--command-template",
            "fake-agent --prompt {prompt_file}",
        ],
    )

    exit_code = RUNNER.main()

    assert exit_code == 0
    assert len(executed_commands) == 2
    assert [snapshot["retry_countdown_sec"] for snapshot in retry_snapshots] == [3, 2, 1]
    assert {snapshot["next_retry_attempt"] for snapshot in retry_snapshots} == {2}
    assert {snapshot["status"] for snapshot in retry_snapshots} == {"retry-wait"}
    assert all(snapshot["current_prompt_file"] for snapshot in retry_snapshots)
    assert all(snapshot["last_message_file"] for snapshot in retry_snapshots)

    final_payload = json.loads((ai_dir / "refactor-live-status.json").read_text(encoding="utf-8"))
    assert final_payload["status"] == "stopped"
    assert final_payload["last_validated_round"] == 1
    assert (
        final_payload["last_validation_summary"]
        == "worktree_clean=True; smoke=skipped; agent_validations=1"
    )
