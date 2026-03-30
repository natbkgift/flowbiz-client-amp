#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL="$1"
TARGET_SHA="$2"
VPS_ACTIVE_PATH="$3"
VPS_RELEASE_ROOT="$4"
VPS_API_PORT="$5"
VPS_ADMIN_PORT="$6"
COMPOSE_PROJECT_NAME="$7"
ALEMBIC_UPGRADE_TARGET="$8"
OVERLAY_ROOT="${9:-}"

if [[ $# -ge 9 ]]; then
  shift 9
else
  shift 8
fi
overlay_files=("$@")
ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET//$'\r'/}"

DEPLOY_SOURCE="${FLOWBIZ_DEPLOY_SOURCE:-scripts/deploy_prod.sh}"
HISTORY_LIMIT="${FLOWBIZ_DEPLOY_HISTORY_LIMIT:-25}"
DEPLOY_STATE_DIR="${FLOWBIZ_DEPLOY_STATE_DIR:-}"

if [[ -z "$REMOTE_URL" || "$REMOTE_URL" == "__AUTO__" ]]; then
  REMOTE_URL="$(git -C "$VPS_ACTIVE_PATH" remote get-url origin)"
fi

deploy_started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
start_epoch="$(date +%s)"
history_id="run-$(date -u +%Y%m%dT%H%M%SZ)-${TARGET_SHA:0:8}"
telemetry_dir="${VPS_ACTIVE_PATH}/ops/logs"
history_root="${telemetry_dir}/deploy-history"
history_dir="${history_root}/${history_id}"
deploy_log="${history_dir}/deploy.log"
lifecycle_log="${history_dir}/lifecycle.log"
smoke_results_file="${history_dir}/smoke-results.json"
telemetry_file="${history_dir}/telemetry.json"
latest_telemetry_file="${telemetry_dir}/deploy_telemetry.json"
release_path="${VPS_RELEASE_ROOT}/flowbiz-client-amp-release-${TARGET_SHA:0:8}-$(date +%Y%m%d%H%M%S)"

ACTIVE_REPO_SYNC_STATUS="unknown"
ACTIVE_REPO_SYNC_DETAIL=""
ACTIVE_REPO_SHA=""
ACTIVE_REPO_BRANCH=""
ACTIVE_REPO_UPSTREAM=""
ACTIVE_REPO_ALIGNED="false"
BUILD_SHA=""
CURRENT_PHASE="start"

mkdir -p "$history_dir"
exec > >(tee -a "$deploy_log") 2>&1

phase() {
  local name="$1"
  CURRENT_PHASE="$name"
  printf '%s phase=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$name" >>"$lifecycle_log"
  printf -- '--- %s\n' "$name"
}

run_release_script() {
  local script_path="$1"
  shift

  if [[ ! -f "$script_path" ]]; then
    echo "Missing release script: $script_path" >&2
    exit 1
  fi

  bash "$script_path" "$@"
}

write_telemetry() {
  local deploy_status="$1"
  local smoke_passed="$2"
  local ended_at
  local duration_seconds

  ended_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  duration_seconds=$(( $(date +%s) - start_epoch ))

  export FLOWBIZ_DEPLOY_GENERATED_AT="$ended_at"
  export FLOWBIZ_DEPLOY_COMPLETED_AT="$ended_at"
  export FLOWBIZ_DEPLOY_STATUS="$deploy_status"
  export FLOWBIZ_SMOKE_PASSED="$smoke_passed"
  export FLOWBIZ_BUILD_SHA="${BUILD_SHA:-}"
  export FLOWBIZ_TARGET_SHA="$TARGET_SHA"
  export FLOWBIZ_RELEASE_PATH="$release_path"
  export FLOWBIZ_DEPLOY_SOURCE="$DEPLOY_SOURCE"
  export FLOWBIZ_DEPLOY_VALIDATION_MODE="owner-aligned"
  export FLOWBIZ_DEPLOY_DURATION_SECONDS="$duration_seconds"
  export FLOWBIZ_DEPLOY_HISTORY_ID="$history_id"
  export FLOWBIZ_DEPLOY_HISTORY_DIR="$history_dir"
  export FLOWBIZ_DEPLOY_LOG_PATH="$deploy_log"
  export FLOWBIZ_DEPLOY_LIFECYCLE_LOG_PATH="$lifecycle_log"
  export FLOWBIZ_DEPLOY_STATE_DIR_VALUE="$DEPLOY_STATE_DIR"
  export FLOWBIZ_DEPLOY_CURRENT_PHASE="$CURRENT_PHASE"
  export FLOWBIZ_ACTIVE_REPO_SYNC_STATUS="$ACTIVE_REPO_SYNC_STATUS"
  export FLOWBIZ_ACTIVE_REPO_SYNC_DETAIL="$ACTIVE_REPO_SYNC_DETAIL"
  export FLOWBIZ_ACTIVE_REPO_SHA="$ACTIVE_REPO_SHA"
  export FLOWBIZ_ACTIVE_REPO_BRANCH="$ACTIVE_REPO_BRANCH"
  export FLOWBIZ_ACTIVE_REPO_UPSTREAM="$ACTIVE_REPO_UPSTREAM"
  export FLOWBIZ_ACTIVE_REPO_ALIGNED="$ACTIVE_REPO_ALIGNED"
  export FLOWBIZ_DEPLOY_TELEMETRY_FILE="$telemetry_file"
  export FLOWBIZ_DEPLOY_LATEST_TELEMETRY_FILE="$latest_telemetry_file"
  export FLOWBIZ_DEPLOY_SMOKE_RESULTS_FILE="$smoke_results_file"
  export FLOWBIZ_DEPLOY_STARTED_AT="$deploy_started_at"

  python3 - <<'PY'
import json
import os
from pathlib import Path

smoke_path = Path(os.environ["FLOWBIZ_DEPLOY_SMOKE_RESULTS_FILE"])
smoke_payload = {
    "validation_mode": os.environ.get("FLOWBIZ_DEPLOY_VALIDATION_MODE"),
    "results": {},
    "failed_paths": [],
}
if smoke_path.exists():
    try:
        smoke_payload = json.loads(smoke_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        smoke_payload = {
            "validation_mode": os.environ.get("FLOWBIZ_DEPLOY_VALIDATION_MODE"),
            "results": {},
            "failed_paths": ["telemetry-smoke-results-invalid-json"],
        }

payload = {
    "generated_at": os.environ.get("FLOWBIZ_DEPLOY_GENERATED_AT"),
    "started_at": os.environ.get("FLOWBIZ_DEPLOY_STARTED_AT"),
    "deployed_at": os.environ.get("FLOWBIZ_DEPLOY_COMPLETED_AT"),
    "deploy_status": os.environ.get("FLOWBIZ_DEPLOY_STATUS"),
    "smoke_passed": os.environ.get("FLOWBIZ_SMOKE_PASSED") == "true",
    "build_sha": os.environ.get("FLOWBIZ_BUILD_SHA") or None,
    "target_sha": os.environ.get("FLOWBIZ_TARGET_SHA") or None,
    "release_path": os.environ.get("FLOWBIZ_RELEASE_PATH") or None,
    "source": os.environ.get("FLOWBIZ_DEPLOY_SOURCE") or None,
    "validation_mode": os.environ.get("FLOWBIZ_DEPLOY_VALIDATION_MODE") or None,
    "duration_seconds": int(os.environ.get("FLOWBIZ_DEPLOY_DURATION_SECONDS") or "0"),
    "history_id": os.environ.get("FLOWBIZ_DEPLOY_HISTORY_ID") or None,
    "history_dir": os.environ.get("FLOWBIZ_DEPLOY_HISTORY_DIR") or None,
    "log_path": os.environ.get("FLOWBIZ_DEPLOY_LOG_PATH") or None,
    "lifecycle_log_path": os.environ.get("FLOWBIZ_DEPLOY_LIFECYCLE_LOG_PATH") or None,
    "state_dir": os.environ.get("FLOWBIZ_DEPLOY_STATE_DIR_VALUE") or None,
    "current_phase": os.environ.get("FLOWBIZ_DEPLOY_CURRENT_PHASE") or None,
    "active_repo": {
        "sync_status": os.environ.get("FLOWBIZ_ACTIVE_REPO_SYNC_STATUS") or None,
        "sync_detail": os.environ.get("FLOWBIZ_ACTIVE_REPO_SYNC_DETAIL") or None,
        "sha": os.environ.get("FLOWBIZ_ACTIVE_REPO_SHA") or None,
        "branch": os.environ.get("FLOWBIZ_ACTIVE_REPO_BRANCH") or None,
        "upstream": os.environ.get("FLOWBIZ_ACTIVE_REPO_UPSTREAM") or None,
        "aligned": os.environ.get("FLOWBIZ_ACTIVE_REPO_ALIGNED") == "true",
    },
    "smoke": smoke_payload,
}

telemetry_path = Path(os.environ["FLOWBIZ_DEPLOY_TELEMETRY_FILE"])
latest_path = Path(os.environ["FLOWBIZ_DEPLOY_LATEST_TELEMETRY_FILE"])
telemetry_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
latest_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
PY
}

prune_history() {
  local limit="$1"
  local -a history_dirs=()

  if [[ ! -d "$history_root" ]]; then
    return
  fi

  mapfile -t history_dirs < <(find "$history_root" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)
  if (( ${#history_dirs[@]} <= limit )); then
    return
  fi

  local remove_count=$(( ${#history_dirs[@]} - limit ))
  local index=0
  while (( index < remove_count )); do
    rm -rf "${history_root}/${history_dirs[$index]}"
    index=$(( index + 1 ))
  done
}

cleanup() {
  local code=$?
  if (( code != 0 )); then
    phase "failed"
    write_telemetry "error" "false"
    if [[ -d "${release_path:-}" ]]; then
      rm -rf "$release_path"
    fi
  fi
  prune_history "$HISTORY_LIMIT"
  exit "$code"
}
trap cleanup EXIT

write_telemetry "running" "false"

phase "start"
mkdir -p "$VPS_RELEASE_ROOT"
git clone --branch main --single-branch "$REMOTE_URL" "$release_path"
cd "$release_path"
git checkout "$TARGET_SHA"

if [[ -n "$OVERLAY_ROOT" && ${#overlay_files[@]} -gt 0 ]]; then
  phase "overlay"
  for relative_path in "${overlay_files[@]}"; do
    mkdir -p "$release_path/$(dirname "$relative_path")"
    cp "$OVERLAY_ROOT/$relative_path" "$release_path/$relative_path"
  done
fi

if [[ ! -f "$VPS_ACTIVE_PATH/.env" ]]; then
  echo "Missing production env file: $VPS_ACTIVE_PATH/.env" >&2
  exit 1
fi

phase "infra"
run_release_script "$release_path/scripts/sync_prod_media_storage.sh"
run_release_script "$release_path/scripts/enforce_prod_nginx_media_route.sh" \
  --config "/etc/nginx/conf.d/amppattaya.com.conf" \
  --snippet "$release_path/ops/nginx/amppattaya-media-location.conf"

set -a
. "$VPS_ACTIVE_PATH/.env"
set +a

export BUILD_SHA
BUILD_SHA="$(git rev-parse --short HEAD)"
export release_path
export FLOWBIZ_ENV_FILE="$VPS_ACTIVE_PATH/.env"
export VPS_API_PORT
export VPS_ADMIN_PORT

compose=(
  docker compose
  -p "$COMPOSE_PROJECT_NAME"
  -f "$release_path/docker-compose.yml"
  -f "$release_path/docker-compose.prod.yml"
)

phase "build"
"${compose[@]}" build api admin-app

phase "migrations"
"${compose[@]}" run --rm --no-deps \
  -e ALEMBIC_UPGRADE_TARGET="$ALEMBIC_UPGRADE_TARGET" \
  api sh -lc 'python -m alembic upgrade "$ALEMBIC_UPGRADE_TARGET"'

phase "seed-data"
"${compose[@]}" run --rm --no-deps \
  -e AMP_ALLOW_IMPORT=1 \
  -e AMP_SKIP_PROJECT_COVER_MIRROR=1 \
  -e AMP_PURGE_PREVIEW_DEMO=1 \
  api sh -lc 'python scripts/import_seed_data.py --input data/import'

phase "switch"
"${compose[@]}" up -d --no-deps --force-recreate api admin-app

phase "health-check"
export FLOWBIZ_DEPLOY_SMOKE_RESULTS_FILE="$smoke_results_file"
python3 - <<'PY'
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

checks = [
  {
    "owner": "admin-app",
    "public_path": "/en/shortlist",
    "internal_path": "/en/shortlist",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_ADMIN_PORT']}",
    "expected": 200,
  },
  {
    "owner": "admin-app",
    "public_path": "/en/buying-cost-estimator",
    "internal_path": "/en/buying-cost-estimator",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_ADMIN_PORT']}",
    "expected": 200,
  },
  {
    "owner": "api",
    "public_path": "/api/health",
    "internal_path": "/health",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_API_PORT']}",
    "expected": 200,
  },
  {
    "owner": "api",
    "public_path": "/api/ping",
    "internal_path": "/ping",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_API_PORT']}",
    "expected": 200,
  },
  {
    "owner": "api",
    "public_path": "/api/platform/version",
    "internal_path": "/platform/version",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_API_PORT']}",
    "expected": 200,
  },
  {
    "owner": "api",
    "public_path": "/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en",
    "internal_path": "/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_API_PORT']}",
    "expected": 200,
  },
  {
    "owner": "api",
    "public_path": "/api/v1/events",
    "internal_path": "/v1/events",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_API_PORT']}",
    "expected": 202,
    "method": "POST",
    "headers": {"Content-Type": "application/json"},
    "body": json.dumps(
      {
        "event_name": "deploy_smoke_event",
        "source": {"app": "deploy-smoke", "page": "/en", "locale": "en"},
        "payload": {"placement": "deploy_smoke"},
      }
    ),
  },
]


def fetch_status(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: str | None = None,
) -> int:
    payload = body.encode("utf-8") if body is not None else None
    request = Request(url, method=method, data=payload, headers=headers or {})
    try:
        with urlopen(request, timeout=5) as response:
            return int(getattr(response, "status", 0) or 0)
    except HTTPError as exc:
        return int(exc.code)
    except (URLError, TimeoutError, OSError):
        return 0


results: dict[str, dict[str, int | bool | str]] = {}
for _ in range(30):
    current_results = {}
    for check in checks:
        public_path = check["public_path"]
        internal_path = check["internal_path"]
        owner = check["owner"]
        expected = int(check["expected"])
        internal_url = f"{check['base_url']}{internal_path}"
        status = fetch_status(
            internal_url,
            method=str(check.get("method") or "GET"),
            headers=check.get("headers"),
            body=check.get("body"),
        )
        current_results[public_path] = {
            "owner": owner,
            "internal_path": internal_path,
            "internal_url": internal_url,
            "status": status,
            "expected": expected,
            "ok": status == expected,
        }
    results = current_results
    if all(item["ok"] for item in results.values()):
        break
    time.sleep(2)

failed_paths = [path for path, item in results.items() if not item["ok"]]

payload = {
    "validation_mode": "owner-aligned",
    "results": results,
    "failed_paths": failed_paths,
}
Path(os.environ["FLOWBIZ_DEPLOY_SMOKE_RESULTS_FILE"]).write_text(
    json.dumps(payload, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

print(f"release_path={os.environ.get('release_path')}")
print(f"build_sha={os.environ.get('BUILD_SHA')}")
for path, item in results.items():
    print(f"owner_check[{item['owner']} {path} -> {item['internal_path']}]={item['status']}")

sys.exit(0 if not failed_paths else 1)
PY

phase "sync-active-repo"
if [[ -d "$VPS_ACTIVE_PATH/.git" ]]; then
  ACTIVE_REPO_BRANCH="$(git -C "$VPS_ACTIVE_PATH" branch --show-current 2>/dev/null || true)"
  ACTIVE_REPO_SHA="$(git -C "$VPS_ACTIVE_PATH" rev-parse HEAD 2>/dev/null || true)"

  tracked_dirty="$(git -C "$VPS_ACTIVE_PATH" status --porcelain --untracked-files=no 2>/dev/null || true)"
  if [[ -n "$tracked_dirty" ]]; then
    ACTIVE_REPO_SYNC_STATUS="skipped"
    ACTIVE_REPO_SYNC_DETAIL="Active repo has tracked local changes; skipped fast-forward sync."
  elif [[ -z "$ACTIVE_REPO_BRANCH" ]]; then
    ACTIVE_REPO_SYNC_STATUS="skipped"
    ACTIVE_REPO_SYNC_DETAIL="Active repo is not on a named branch; skipped fast-forward sync."
  else
    if git -C "$VPS_ACTIVE_PATH" fetch origin main --quiet; then
      if git -C "$VPS_ACTIVE_PATH" checkout main >/dev/null 2>&1; then
        if git -C "$VPS_ACTIVE_PATH" merge --ff-only "$TARGET_SHA" >/dev/null 2>&1; then
          ACTIVE_REPO_SYNC_STATUS="ok"
          ACTIVE_REPO_SYNC_DETAIL="Active repo fast-forwarded to deployed target SHA."
          if ! git -C "$VPS_ACTIVE_PATH" rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
            git -C "$VPS_ACTIVE_PATH" branch --set-upstream-to=origin/main main >/dev/null 2>&1 || true
          fi
        else
          ACTIVE_REPO_SYNC_STATUS="error"
          ACTIVE_REPO_SYNC_DETAIL="Active repo could not fast-forward to deployed target SHA."
        fi
      else
        ACTIVE_REPO_SYNC_STATUS="error"
        ACTIVE_REPO_SYNC_DETAIL="Active repo could not switch to branch main."
      fi
    else
      ACTIVE_REPO_SYNC_STATUS="error"
      ACTIVE_REPO_SYNC_DETAIL="Active repo could not fetch origin/main."
    fi
  fi

  ACTIVE_REPO_SHA="$(git -C "$VPS_ACTIVE_PATH" rev-parse HEAD 2>/dev/null || true)"
  ACTIVE_REPO_BRANCH="$(git -C "$VPS_ACTIVE_PATH" branch --show-current 2>/dev/null || true)"
  ACTIVE_REPO_UPSTREAM="$(git -C "$VPS_ACTIVE_PATH" rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"
  if [[ "$ACTIVE_REPO_SHA" == "$TARGET_SHA" ]]; then
    ACTIVE_REPO_ALIGNED="true"
  fi
else
  ACTIVE_REPO_SYNC_STATUS="missing"
  ACTIVE_REPO_SYNC_DETAIL="Active repo path is not a git repository."
fi

phase "follow-up-scheduler"
run_release_script "$release_path/scripts/install_prod_sales_followup_scheduler.sh" \
  "$VPS_ACTIVE_PATH" \
  "$COMPOSE_PROJECT_NAME"

phase "follow-up-scheduler-verify"
python3 "$release_path/scripts/inspect_sales_followup_runs.py" \
  --summary \
  --assert-healthy \
  --log-dir "$VPS_ACTIVE_PATH/ops/logs/sales-followups" \
  --active-path "$VPS_ACTIVE_PATH"

phase "done"
write_telemetry "ok" "true"
echo "deploy_telemetry=$latest_telemetry_file"
