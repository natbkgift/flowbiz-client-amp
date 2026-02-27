from __future__ import annotations

import json
import os
import platform
import subprocess
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class LatencyResult:
    url: str
    ok: bool
    status: int | None
    n: int
    p50_ms: float | None
    p95_ms: float | None
    min_ms: float | None
    max_ms: float | None
    errors: list[str]


def _run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, cwd=ROOT, text=True, stderr=subprocess.STDOUT).strip()


def git_sha() -> str:
    return _run(["git", "rev-parse", "--short", "HEAD"])


def alembic_head() -> str:
    # Requires alembic installed in the active env.
    out = _run(["python", "-m", "alembic", "heads"])
    # Example: "0018_xxx (head)"
    return out.splitlines()[-1].strip()


def http_latency(url: str, n: int = 20, timeout_s: int = 20) -> LatencyResult:
    timings_ms: list[float] = []
    errors: list[str] = []
    status: int | None = None

    req = urllib.request.Request(url, headers={"User-Agent": "AMP-PhaseG-Baseline/1.0"})

    for _ in range(n):
        start = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=timeout_s) as resp:
                status = resp.getcode()
                resp.read(256)
        except urllib.error.HTTPError as e:
            status = e.code
            errors.append(f"HTTPError {e.code}")
        except Exception as e:  # noqa: BLE001
            errors.append(type(e).__name__)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        timings_ms.append(elapsed_ms)

    ok = status is not None and 200 <= status < 400 and not errors

    def pct(p: float) -> float:
        if not timings_ms:
            return float("nan")
        s = sorted(timings_ms)
        k = max(0, min(len(s) - 1, int(round((p / 100.0) * (len(s) - 1)))))
        return s[k]

    if timings_ms:
        p50 = pct(50)
        p95 = pct(95)
        return LatencyResult(
            url=url,
            ok=ok,
            status=status,
            n=n,
            p50_ms=round(p50, 2),
            p95_ms=round(p95, 2),
            min_ms=round(min(timings_ms), 2),
            max_ms=round(max(timings_ms), 2),
            errors=errors,
        )

    return LatencyResult(
        url=url,
        ok=False,
        status=status,
        n=n,
        p50_ms=None,
        p95_ms=None,
        min_ms=None,
        max_ms=None,
        errors=errors,
    )


def main() -> int:
    base_url = os.environ.get("AMP_BASE_URL", "https://amppattaya.com").rstrip("/")
    endpoints = [
        "/api/v1/meta",
        "/api/v1/inquiries",
        "/api/v1/projects",
    ]

    sha = git_sha()
    head = None
    try:
        head = alembic_head()
    except Exception as e:  # noqa: BLE001
        head = f"(failed: {type(e).__name__})"

    ts = datetime.now(timezone.utc).isoformat()

    latency: list[dict] = []
    for ep in endpoints:
        url = f"{base_url}{ep}"
        res = http_latency(url)
        latency.append(res.__dict__)

    payload = {
        "timestamp_utc": ts,
        "sha": sha,
        "alembic_head": head,
        "host": {
            "platform": platform.platform(),
            "python": platform.python_version(),
        },
        "base_url": base_url,
        "latency": latency,
    }

    out_dir = ROOT / "docs" / "v3" / "baselines"
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / f"phase-g-baseline-{sha}.json"
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    md_lines = [
        "# Phase G Baseline",
        "",
        f"- Timestamp (UTC): {ts}",
        f"- Git SHA: {sha}",
        f"- Alembic head: {head}",
        f"- Base URL: {base_url}",
        "",
        "## API latency (ms)",
        "",
        "| Endpoint | Status | p50 | p95 | min | max | Errors |",
        "|---|---:|---:|---:|---:|---:|---|",
    ]

    for item in latency:
        md_lines.append(
            "| "
            + item["url"].replace(base_url, "")
            + " | "
            + str(item.get("status") or "-")
            + " | "
            + str(item.get("p50_ms") or "-")
            + " | "
            + str(item.get("p95_ms") or "-")
            + " | "
            + str(item.get("min_ms") or "-")
            + " | "
            + str(item.get("max_ms") or "-")
            + " | "
            + ", ".join(item.get("errors") or [])
            + " |"
        )

    md_lines += [
        "",
        "## Docker image sizes",
        "",
        "- Capture not run in this environment.",
        "  Run: `docker images` or execute this script on the VPS runner.",
        "",
        "## Lighthouse",
        "",
        "- Capture not run in this environment.",
        "  If available, run: `npx lighthouse https://... --preset=desktop|mobile`.",
        "",
        f"Baseline JSON: `{json_path.as_posix().split('docs/')[-1]}`",
    ]

    md_path = out_dir / f"phase-g-baseline-{sha}.md"
    md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    print(str(md_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
