"""Governance autopilot CLI.

This script intentionally composes existing deterministic gates and deployment
mechanisms already present in this repo.

Primary use-cases:
- Run local gates (ruff/pytest + governance gate bundle)
- Post a machine-generated review comment to a GitHub PR via `gh`
- Enable auto-merge for a PR via `gh`
- Deploy to FlowBiz VPS via SSH alias (default: `flowbiz-vps`)

The tool is designed to run non-interactively for automation.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class CmdResult:
    cmd: list[str]
    rc: int


def _utc_now() -> str:
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _run(cmd: list[str], *, cwd: Path = REPO_ROOT, env: dict[str, str] | None = None) -> CmdResult:
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)

    proc = subprocess.run(
        cmd,
        cwd=str(cwd),
        env=merged_env,
        text=True,
        check=False,
    )
    return CmdResult(cmd=cmd, rc=proc.returncode)


def _require_tool(name: str) -> None:
    if shutil.which(name) is None:
        raise SystemExit(
            f"Missing required tool: {name}. "
            f"Install it and ensure it's on PATH before running this command."
        )


def run_ci(*, base: str, head: str, out_dir: str) -> None:
    # Keep the same ordering as docs: format -> lint -> tests -> governance gates.
    steps: list[list[str]] = [
        [sys.executable, "-m", "ruff", "format"],
        [sys.executable, "-m", "ruff", "check", "."],
        [sys.executable, "-m", "pytest", "-q", "--tb=short"],
        [
            sys.executable,
            str(REPO_ROOT / "scripts" / "governance" / "run_ci_gates.py"),
            "--base",
            base,
            "--head",
            head,
            "--out-dir",
            out_dir,
        ],
    ]

    for cmd in steps:
        res = _run(cmd)
        if res.rc != 0:
            raise SystemExit(res.rc)


def _gh_repo_slug() -> str:
    # Prefer GH CLI context (works in CI and locally when authenticated).
    _require_tool("gh")
    proc = subprocess.run(
        ["gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise SystemExit(
            "Unable to resolve GitHub repo from `gh`. "
            "Run `gh auth login` and retry.\n" + (proc.stderr or proc.stdout)
        )
    slug = (proc.stdout or "").strip()
    if not slug:
        raise SystemExit("`gh repo view` returned empty repo slug.")
    return slug


def pr_review_comment(*, pr: int, base: str, head: str, out_dir: str, skip_ci: bool) -> None:
    _require_tool("gh")
    repo = _gh_repo_slug()

    if not skip_ci:
        run_ci(base=base, head=head, out_dir=out_dir)

    result_line = (
        "Result: **PASS**" if not skip_ci else "Result: **SKIPPED** (local gates not executed)"
    )

    body = "\n".join(
        [
            "### ✅ Autonomous governance review (local)",
            "",
            f"- Time (UTC): `{_utc_now()}`",
            f"- Repo: `{repo}`",
            f"- PR: `#{pr}`",
            "- Gates: `ruff format` → `ruff check` → `pytest` → `run_ci_gates.py`",
            f"- Base: `{base}`",
            f"- Head: `{head}`",
            f"- Artifacts: `{out_dir}` (local path)",
            "",
            result_line,
        ]
    )

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".md") as fp:
        fp.write(body)
        tmp_path = fp.name

    try:
        res = _run(["gh", "pr", "comment", str(pr), "--repo", repo, "--body-file", tmp_path])
        if res.rc != 0:
            raise SystemExit(res.rc)
    finally:
        try:
            Path(tmp_path).unlink(missing_ok=True)
        except Exception:
            pass


def pr_enable_automerge(*, pr: int, squash: bool, delete_branch: bool) -> None:
    _require_tool("gh")
    repo = _gh_repo_slug()
    cmd = ["gh", "pr", "merge", str(pr), "--repo", repo, "--auto", "--yes"]
    if squash:
        cmd.append("--squash")
    if delete_branch:
        cmd.append("--delete-branch")

    res = _run(cmd)
    if res.rc != 0:
        raise SystemExit(res.rc)


def deploy_vps(*, vps_host: str, vps_path: str, public_base: str, vps_api_port: int) -> None:
    # We intentionally reuse the hardened drift+deploy+validate logic.
    _require_tool("ssh")
    _require_tool("pwsh")

    script = REPO_ROOT / "scripts" / "continuous_production_guard.ps1"
    if not script.exists():
        raise SystemExit(f"Missing deploy script: {script}")

    cmd = [
        "pwsh",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(script),
        "-VpsHost",
        vps_host,
        "-VpsPath",
        vps_path,
        "-PublicBase",
        public_base,
        "-VpsApiPort",
        str(vps_api_port),
    ]
    res = _run(cmd)
    if res.rc != 0:
        raise SystemExit(res.rc)


def main() -> int:
    parser = argparse.ArgumentParser(prog="autopilot")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_ci = sub.add_parser("ci", help="Run local lint/test + deterministic governance gates")
    p_ci.add_argument("--base", default=os.getenv("GOVERNANCE_BASE", "origin/main"))
    p_ci.add_argument("--head", default=os.getenv("GOVERNANCE_HEAD", "HEAD"))
    p_ci.add_argument("--out-dir", default=os.getenv("GOVERNANCE_OUT_DIR", ".tmp/governance"))

    p_review = sub.add_parser(
        "review",
        help="Run gates (optional) then post a machine PASS/FAIL comment to the PR via gh",
    )
    p_review.add_argument("pr", type=int, help="PR number")
    p_review.add_argument("--skip-ci", action="store_true")
    p_review.add_argument("--base", default=os.getenv("GOVERNANCE_BASE", "origin/main"))
    p_review.add_argument("--head", default=os.getenv("GOVERNANCE_HEAD", "HEAD"))
    p_review.add_argument("--out-dir", default=os.getenv("GOVERNANCE_OUT_DIR", ".tmp/governance"))

    p_merge = sub.add_parser("merge", help="Enable GitHub auto-merge for a PR via gh")
    p_merge.add_argument("pr", type=int, help="PR number")
    p_merge.add_argument("--no-squash", action="store_true", help="Use default merge method")
    p_merge.add_argument(
        "--keep-branch",
        action="store_true",
        help="Do not delete the source branch after merge",
    )

    p_deploy = sub.add_parser(
        "deploy-vps", help="Deploy to VPS via ssh alias using PS deploy guard"
    )
    p_deploy.add_argument("--vps-host", default=os.getenv("VPS_HOST_ALIAS", "flowbiz-vps"))
    p_deploy.add_argument(
        "--vps-path",
        default=os.getenv("VPS_DEPLOY_PATH", "/opt/flowbiz/clients/flowbiz-client-amp"),
    )
    p_deploy.add_argument(
        "--public-base",
        default=os.getenv("PUBLIC_BASE", "https://www.amppattaya.com"),
    )
    p_deploy.add_argument(
        "--vps-api-port", type=int, default=int(os.getenv("VPS_API_PORT", "8001"))
    )

    p_loop = sub.add_parser(
        "loop",
        help="Run CI gates -> PR comment -> enable auto-merge -> (optional) deploy via ssh",
    )
    p_loop.add_argument("pr", type=int, help="PR number")
    p_loop.add_argument("--skip-ci", action="store_true")
    p_loop.add_argument("--skip-deploy", action="store_true")
    p_loop.add_argument("--base", default=os.getenv("GOVERNANCE_BASE", "origin/main"))
    p_loop.add_argument("--head", default=os.getenv("GOVERNANCE_HEAD", "HEAD"))
    p_loop.add_argument("--out-dir", default=os.getenv("GOVERNANCE_OUT_DIR", ".tmp/governance"))
    p_loop.add_argument("--vps-host", default=os.getenv("VPS_HOST_ALIAS", "flowbiz-vps"))
    p_loop.add_argument(
        "--vps-path",
        default=os.getenv("VPS_DEPLOY_PATH", "/opt/flowbiz/clients/flowbiz-client-amp"),
    )
    p_loop.add_argument(
        "--public-base",
        default=os.getenv("PUBLIC_BASE", "https://www.amppattaya.com"),
    )
    p_loop.add_argument("--vps-api-port", type=int, default=int(os.getenv("VPS_API_PORT", "8001")))

    args = parser.parse_args()

    if args.cmd == "ci":
        run_ci(base=args.base, head=args.head, out_dir=args.out_dir)
        return 0

    if args.cmd == "review":
        pr_review_comment(
            pr=args.pr, base=args.base, head=args.head, out_dir=args.out_dir, skip_ci=args.skip_ci
        )
        return 0

    if args.cmd == "merge":
        pr_enable_automerge(
            pr=args.pr, squash=not args.no_squash, delete_branch=not args.keep_branch
        )
        return 0

    if args.cmd == "deploy-vps":
        deploy_vps(
            vps_host=args.vps_host,
            vps_path=args.vps_path,
            public_base=args.public_base,
            vps_api_port=args.vps_api_port,
        )
        return 0

    if args.cmd == "loop":
        pr_review_comment(
            pr=args.pr,
            base=args.base,
            head=args.head,
            out_dir=args.out_dir,
            skip_ci=args.skip_ci,
        )
        pr_enable_automerge(pr=args.pr, squash=True, delete_branch=True)
        if not args.skip_deploy:
            deploy_vps(
                vps_host=args.vps_host,
                vps_path=args.vps_path,
                public_base=args.public_base,
                vps_api_port=args.vps_api_port,
            )
        return 0

    raise SystemExit("Unknown command")


if __name__ == "__main__":
    raise SystemExit(main())
