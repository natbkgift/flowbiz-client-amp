#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="${FLOWBIZ_ACTIVE_PATH:-$DEFAULT_REPO_ROOT}"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-flowbiz-client-amp}"
RETENTION="${FLOWBIZ_SALES_FOLLOWUP_RETENTION:-50}"

DRY_RUN=0
LIMIT="${FLOWBIZ_SALES_FOLLOWUP_LIMIT:-50}"
AS_OF=""
INQUIRY_ID=""
ARG_ERROR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root) REPO_ROOT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --limit) LIMIT="$2"; shift 2 ;;
    --as-of) AS_OF="$2"; shift 2 ;;
    --inquiry-id) INQUIRY_ID="$2"; shift 2 ;;
    *) ARG_ERROR="Unknown arg: $1"; break ;;
  esac
done

LOG_ROOT="${FLOWBIZ_SALES_FOLLOWUP_LOG_DIR:-$REPO_ROOT/ops/logs/sales-followups}"
RUNS_DIR="$LOG_ROOT/runs"
LOCK_FILE="$LOG_ROOT/job.lock"
LOCK_OWNER_FILE="$LOG_ROOT/lock-owner.json"
LATEST_JSON="$LOG_ROOT/latest.json"
LATEST_SUCCESS_JSON="$LOG_ROOT/latest-success.json"
LATEST_FAILURE_JSON="$LOG_ROOT/latest-failure.json"

mkdir -p "$RUNS_DIR"

started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
start_epoch="$(date +%s)"
run_id="run-$(date -u +%Y%m%dT%H%M%SZ)-$$"
run_dir="$RUNS_DIR/$run_id"
stdout_file="$run_dir/processor-output.json"
stderr_file="$run_dir/stderr.log"
run_file="$run_dir/run.json"
failure_type_file="$run_dir/failure-type.txt"

mkdir -p "$run_dir"

write_pointer() {
  local source_path="$1"
  local target_path="$2"
  local temp_path

  temp_path="$target_path.tmp.$$"
  cp "$source_path" "$temp_path"
  mv -f "$temp_path" "$target_path"
}

classify_failure_type() {
  local current_status="$1"
  local current_error="$2"

  if [[ "$current_status" == "ok" ]]; then
    printf 'null'
    return
  fi

  if [[ "$current_error" == Unknown\ arg:* ]]; then
    printf 'wrapper_error'
    return
  fi

  if [[ -s "$stderr_file" ]]; then
    local stderr_lower
    stderr_lower="$(tr '[:upper:]' '[:lower:]' <"$stderr_file")"
    if [[ "$stderr_lower" == *"sqlalchemy"* || "$stderr_lower" == *"psycopg"* || "$stderr_lower" == *"database"* || "$stderr_lower" == *"dbapi"* || "$stderr_lower" == *"could not connect"* ]]; then
      printf 'db_error'
      return
    fi
    if [[ "$stderr_lower" == *"traceback"* || "$stderr_lower" == *"exception"* || "$stderr_lower" == *"process_sales_followups.py"* ]]; then
      printf 'processor_error'
      return
    fi
  fi

  if [[ "$current_status" == "partial" ]]; then
    printf 'processor_error'
    return
  fi

  if [[ "$current_status" == "failed" ]]; then
    printf 'unknown_error'
    return
  fi

  printf 'null'
}

render_run_json() {
  local status="$1"
  local exit_code="$2"
  local finished_at="$3"
  local duration_ms="$4"
  local error_message="$5"
  local failure_type="$6"

  python3 - <<'PY' \
    "$run_file" "$stdout_file" "$status" "$exit_code" "$started_at" "$finished_at" "$duration_ms" "$run_id" "$run_dir" "$stderr_file" "$DRY_RUN" "$LIMIT" "$AS_OF" "$INQUIRY_ID" "$error_message" "$failure_type"
from __future__ import annotations

import json
import sys
from pathlib import Path

(
    run_file,
    stdout_file,
    status,
    exit_code,
    started_at,
    finished_at,
    duration_ms,
    run_id,
    run_dir,
    stderr_file,
    dry_run,
    limit,
    as_of,
    inquiry_id,
    error_message,
    failure_type,
) = sys.argv[1:]

summary: dict[str, object] = {}
stdout_path = Path(stdout_file)
if stdout_path.exists() and stdout_path.read_text(encoding="utf-8").strip():
    try:
        summary = json.loads(stdout_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        summary = {"invalid_json": True}


def metric(name: str) -> int:
    value = summary.get(name, 0)
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0

payload = {
    "run_id": run_id,
    "started_at": started_at,
    "finished_at": finished_at,
    "duration_ms": int(duration_ms),
    "status": status,
    "exit_code": int(exit_code),
    "processed": metric("processed"),
    "triggered": metric("triggered"),
    "suppressed": metric("suppressed"),
    "stale": metric("stale"),
    "failed": metric("failed"),
    "error": error_message or None,
    "failure_type": None if failure_type == "null" else failure_type,
    "mode": "dry-run" if dry_run == "1" else "live",
    "command": {
        "limit": int(limit),
        "as_of": as_of or None,
        "inquiry_id": inquiry_id or None,
    },
    "artifact_dir": run_dir,
    "processor_output_path": stdout_file,
    "stderr_path": stderr_file,
    "summary": summary,
}

Path(run_file).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
PY
}

finalize_run() {
  local status="$1"
  local exit_code="$2"
  local error_message="$3"
  local failure_type="$4"
  local finished_at
  local duration_ms

  finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  duration_ms=$(( ($(date +%s) - start_epoch) * 1000 ))
  render_run_json "$status" "$exit_code" "$finished_at" "$duration_ms" "$error_message" "$failure_type"
  write_pointer "$run_file" "$LATEST_JSON"
  if [[ "$status" == "ok" ]]; then
    write_pointer "$run_file" "$LATEST_SUCCESS_JSON"
  else
    write_pointer "$run_file" "$LATEST_FAILURE_JSON"
  fi
}

prune_runs() {
  python3 - <<'PY' "$RUNS_DIR" "$RETENTION"
from __future__ import annotations

import shutil
import sys
from pathlib import Path

runs_dir = Path(sys.argv[1])
limit = max(1, int(sys.argv[2]))
run_dirs = sorted([path for path in runs_dir.iterdir() if path.is_dir()])
for path in run_dirs[:-limit]:
    shutil.rmtree(path, ignore_errors=True)
PY
}

compose_cmd=(
  docker compose
  -p "$COMPOSE_PROJECT_NAME"
  -f "$REPO_ROOT/docker-compose.yml"
  -f "$REPO_ROOT/docker-compose.prod.yml"
)

processor_cmd=(
  "${compose_cmd[@]}"
  exec -T api
  python /app/scripts/process_sales_followups.py
  --limit "$LIMIT"
)

if (( DRY_RUN == 1 )); then
  processor_cmd+=(--dry-run)
fi
if [[ -n "$AS_OF" ]]; then
  processor_cmd+=(--as-of "$AS_OF")
fi
if [[ -n "$INQUIRY_ID" ]]; then
  processor_cmd+=(--inquiry-id "$INQUIRY_ID")
fi

if [[ -n "$ARG_ERROR" ]]; then
  printf '%s\n' "$ARG_ERROR" >"$stderr_file"
  failure_type="$(classify_failure_type "failed" "$ARG_ERROR")"
  finalize_run "failed" 2 "$ARG_ERROR" "$failure_type"
  prune_runs
  exit 2
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  finalize_run "partial" 0 "lock already held by another scheduler run" null
  prune_runs
  exit 0
fi

printf '{"pid": %s, "started_at": "%s", "lock_file": "%s", "run_id": "%s"}\n' "$$" "$started_at" "$LOCK_FILE" "$run_id" >"$LOCK_OWNER_FILE"
trap 'rm -f "$LOCK_OWNER_FILE"' EXIT

set +e
"${processor_cmd[@]}" >"$stdout_file" 2>"$stderr_file"
exit_code=$?
set -e

status="ok"
error_message=""
if (( exit_code != 0 )); then
  status="failed"
  error_message="processor exited with code $exit_code"
elif ! python3 - <<'PY' "$stdout_file"
from __future__ import annotations

import json
import sys
from pathlib import Path

payload = Path(sys.argv[1]).read_text(encoding="utf-8")
json.loads(payload)
PY
then
  status="failed"
  exit_code=1
  error_message="processor output is not valid JSON"
elif python3 - <<'PY' "$stdout_file"
from __future__ import annotations

import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
raise SystemExit(0 if int(payload.get("failed", 0) or 0) > 0 else 1)
PY
then
  status="partial"
  error_message="processor completed with failed items"
fi

failure_type="$(classify_failure_type "$status" "$error_message")"
finalize_run "$status" "$exit_code" "$error_message" "$failure_type"
prune_runs

if [[ "$status" != "ok" ]]; then
  exit "$exit_code"
fi