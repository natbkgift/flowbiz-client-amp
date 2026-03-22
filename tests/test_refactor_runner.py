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
