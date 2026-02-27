"""Migration safety gate (autonomous governance).

Rules:
- No destructive migrations allowed (upgrade path must be additive-only).
- Destructive patterns include: drop_table, drop_column, drop_constraint, TRUNCATE,
  DELETE FROM, and raw SQL DROP statements.

This script only inspects migration files changed in the diff between base and head.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

_DESTRUCTIVE_PATTERNS = [
    r"\bop\.drop_table\b",
    r"\bop\.drop_column\b",
    r"\bop\.drop_constraint\b",
    r"\bbatch_op\.drop_column\b",
    r"\bbatch_op\.drop_constraint\b",
    r"\bDROP\s+TABLE\b",
    r"\bDROP\s+COLUMN\b",
    r"\bTRUNCATE\b",
    r"\bDELETE\s+FROM\b",
]

_DESTRUCTIVE_RE = re.compile("|".join(_DESTRUCTIVE_PATTERNS), re.IGNORECASE | re.MULTILINE)


def _run_git(args: list[str]) -> str:
    completed = subprocess.run(
        ["git", *args],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        stderr = (completed.stderr or "").strip()
        raise RuntimeError(f"git {' '.join(args)} failed ({completed.returncode}): {stderr}")
    return (completed.stdout or "").strip()


def _changed_migration_files(base: str, head: str) -> list[str]:
    out = _run_git(["diff", "--name-only", f"{base}...{head}"])
    files = [ln.strip() for ln in out.splitlines() if ln.strip()]
    return [
        f
        for f in files
        if f.startswith("alembic/versions/") and f.endswith(".py") and not f.endswith("__init__.py")
    ]


def _extract_upgrade_block(text: str) -> str:
    # Minimal parser: capture from def upgrade(): to the next top-level def/class or EOF.
    # This is robust enough for Alembic revision modules.
    m = re.search(r"^def\s+upgrade\s*\(\s*\)\s*:\s*$", text, flags=re.MULTILINE)
    if not m:
        return ""
    start = m.end()

    # Find next top-level def/class after upgrade.
    m2 = re.search(r"^def\s+\w+\s*\(|^class\s+\w+\s*\(?", text[start:], flags=re.MULTILINE)
    end = start + (m2.start() if m2 else len(text) - start)
    return text[start:end]


@dataclass(frozen=True)
class Finding:
    file: str
    patterns: list[str]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="origin/main")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--out", default=".tmp/governance/migrations.json")
    args = parser.parse_args()

    files = _changed_migration_files(args.base, args.head)

    findings: list[Finding] = []

    for rel in files:
        path = REPO_ROOT / rel
        if not path.exists():
            # Deleted migration is already suspicious; treat as destructive.
            findings.append(Finding(file=rel, patterns=["migration_file_deleted_or_missing"]))
            continue

        text = path.read_text(encoding="utf-8")
        upgrade = _extract_upgrade_block(text)
        if not upgrade:
            continue

        matches = sorted(set(m.group(0) for m in _DESTRUCTIVE_RE.finditer(upgrade)))
        if matches:
            findings.append(Finding(file=rel, patterns=matches))

        # Also catch op.execute("...DROP ...") and friends.
        if "op.execute" in upgrade and _DESTRUCTIVE_RE.search(upgrade):
            if not matches:
                findings.append(Finding(file=rel, patterns=["op.execute_destructive_sql"]))

    breaking = len(findings) > 0

    report = {
        "base": args.base,
        "head": args.head,
        "checked_files": files,
        "breaking": breaking,
        "findings": [{"file": f.file, "patterns": f.patterns} for f in findings],
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    return 2 if breaking else 0


if __name__ == "__main__":
    raise SystemExit(main())
