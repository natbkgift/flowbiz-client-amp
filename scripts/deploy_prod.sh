#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/_deploy_lib.sh
source "$SCRIPT_DIR/_deploy_lib.sh"

VPS_HOST="${VPS_HOST_ALIAS:-flowbiz-vps}"
VPS_ACTIVE_PATH="${VPS_ACTIVE_PATH:-/opt/flowbiz/clients/flowbiz-client-amp}"
VPS_RELEASE_ROOT="${VPS_RELEASE_ROOT:-/opt/flowbiz/clients}"
VPS_API_PORT="${VPS_API_PORT:-8001}"
VPS_ADMIN_PORT="${VPS_ADMIN_PORT:-8002}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-flowbiz-client-amp}"
REMOTE_URL="${REMOTE_URL_OVERRIDE:-}"
TARGET_SHA="${TARGET_SHA_OVERRIDE:-$(git rev-parse HEAD)}"
ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET:-head}"
DEPLOY_POLL_SECONDS="${DEPLOY_POLL_SECONDS:-5}"
DEPLOY_TIMEOUT_SECONDS="${DEPLOY_TIMEOUT_SECONDS:-2700}"
DEPLOY_RETRY_ATTEMPTS="${FLOWBIZ_DEPLOY_RETRY_ATTEMPTS:-3}"
DEPLOY_RETRY_BACKOFF_SECONDS="${FLOWBIZ_DEPLOY_RETRY_BACKOFF_SECONDS:-3}"
FLOWBIZ_VERBOSE="${FLOWBIZ_VERBOSE:-0}"
SKIP_PREFLIGHT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vps-host) VPS_HOST="$2"; shift 2 ;;
    --vps-active-path) VPS_ACTIVE_PATH="$2"; shift 2 ;;
    --vps-release-root) VPS_RELEASE_ROOT="$2"; shift 2 ;;
    --vps-api-port) VPS_API_PORT="$2"; shift 2 ;;
    --vps-admin-port) VPS_ADMIN_PORT="$2"; shift 2 ;;
    --compose-project-name) COMPOSE_PROJECT_NAME="$2"; shift 2 ;;
    --remote-url) REMOTE_URL="$2"; shift 2 ;;
    --target-sha) TARGET_SHA="$2"; shift 2 ;;
    --alembic-target) ALEMBIC_UPGRADE_TARGET="$2"; shift 2 ;;
    --poll-seconds) DEPLOY_POLL_SECONDS="$2"; shift 2 ;;
    --timeout-seconds) DEPLOY_TIMEOUT_SECONDS="$2"; shift 2 ;;
    --retry-attempts) DEPLOY_RETRY_ATTEMPTS="$2"; shift 2 ;;
    --retry-backoff-seconds) DEPLOY_RETRY_BACKOFF_SECONDS="$2"; shift 2 ;;
    --skip-preflight) SKIP_PREFLIGHT=1; shift ;;
    --verbose) FLOWBIZ_VERBOSE=1; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET//$'\r'/}"
export FLOWBIZ_VERBOSE

SSH_OPTS=(
  -o BatchMode=yes
  -o ServerAliveInterval=15
  -o ServerAliveCountMax=10
  -o TCPKeepAlive=yes
)
SCP_OPTS=(
  -q
  "${SSH_OPTS[@]}"
)

TRANSPORT_ENV="$(flowbiz_detect_env)"
flowbiz_pick_ssh_tools "$TRANSPORT_ENV"
SSH_BIN="$FLOWBIZ_SELECTED_SSH_BIN"
SCP_BIN="$FLOWBIZ_SELECTED_SCP_BIN"
flowbiz_log "transport_env=${TRANSPORT_ENV} ssh_bin=${SSH_BIN} scp_bin=${SCP_BIN}"

run_ssh() {
  flowbiz_retry_command "$DEPLOY_RETRY_ATTEMPTS" "$DEPLOY_RETRY_BACKOFF_SECONDS" ssh \
    "$SSH_BIN" "${SSH_OPTS[@]}" "$@"
}

run_scp() {
  flowbiz_retry_command "$DEPLOY_RETRY_ATTEMPTS" "$DEPLOY_RETRY_BACKOFF_SECONDS" scp \
    "$SCP_BIN" "${SCP_OPTS[@]}" "$@"
}

if (( SKIP_PREFLIGHT == 0 )); then
  preflight_args=(
    --vps-host "$VPS_HOST"
    --vps-active-path "$VPS_ACTIVE_PATH"
    --vps-release-root "$VPS_RELEASE_ROOT"
  )
  if [[ "$FLOWBIZ_VERBOSE" == '1' ]]; then
    preflight_args+=(--verbose)
  fi
  "$SCRIPT_DIR/deploy_preflight_check.sh" "${preflight_args[@]}"
fi

if ! worktree_status="$(flowbiz_read_clean_worktree_status)"; then
  echo "Local worktree must be clean before deploy." >&2
  if [[ -n "$worktree_status" ]]; then
    printf '%s\n' "$worktree_status" >&2
  fi
  exit 2
fi

normalize_lf_copy() {
  local source_path="$1"
  local output_path="$2"
  perl -0pe 's/\r\n/\n/g; s/\r/\n/g' "$source_path" >"$output_path"
}

remote_script_local="$(mktemp)"
remote_script_path="/tmp/flowbiz-deploy-$(date +%s)-$RANDOM.sh"
remote_runner_path="/tmp/flowbiz-deploy-runner-$(date +%s)-$RANDOM.sh"
remote_state_dir="/tmp/flowbiz-deploy-state-${TARGET_SHA:0:8}-$(date +%s)"
telemetry_path="${VPS_ACTIVE_PATH}/ops/logs/deploy_telemetry.json"
deploy_remote_source="scripts/deploy_prod_remote.sh"

cleanup() {
  rm -f "$remote_script_local"
  run_ssh "$VPS_HOST" "rm -f $(flowbiz_quote_bash "$remote_script_path")" >/dev/null 2>&1 || true
  run_ssh "$VPS_HOST" "rm -f $(flowbiz_quote_bash "$remote_runner_path")" >/dev/null 2>&1 || true
}
trap cleanup EXIT

normalize_lf_copy "$deploy_remote_source" "$remote_script_local"

run_scp "$(flowbiz_local_copy_path "$SCP_BIN" "$remote_script_local")" "${VPS_HOST}:${remote_script_path}"
run_scp "$(flowbiz_local_copy_path "$SCP_BIN" "scripts/deploy_remote_job.sh")" "${VPS_HOST}:${remote_runner_path}"

launch_command=$(
  cat <<EOF
mkdir -p $(flowbiz_quote_bash "$remote_state_dir") &&
chmod 700 $(flowbiz_quote_bash "$remote_script_path") $(flowbiz_quote_bash "$remote_runner_path") &&
{ nohup env FLOWBIZ_DEPLOY_SOURCE=scripts/deploy_prod.sh bash $(flowbiz_quote_bash "$remote_runner_path") \
    $(flowbiz_quote_bash "$remote_state_dir") \
    $(flowbiz_quote_bash "$remote_script_path") \
    '' \
    $(flowbiz_quote_bash "$REMOTE_URL") \
    $(flowbiz_quote_bash "$TARGET_SHA") \
    $(flowbiz_quote_bash "$VPS_ACTIVE_PATH") \
    $(flowbiz_quote_bash "$VPS_RELEASE_ROOT") \
    $(flowbiz_quote_bash "$VPS_API_PORT") \
    $(flowbiz_quote_bash "$VPS_ADMIN_PORT") \
    $(flowbiz_quote_bash "$COMPOSE_PROJECT_NAME") \
    $(flowbiz_quote_bash "$ALEMBIC_UPGRADE_TARGET") \
    > /dev/null 2>&1 < /dev/null & printf '%s\n' "\$!" > $(flowbiz_quote_bash "$remote_state_dir/pid"); }
EOF
)
run_ssh "$VPS_HOST" "$launch_command"

deadline=$((SECONDS + DEPLOY_TIMEOUT_SECONDS))
last_log=""

while (( SECONDS < deadline )); do
  poll_command=$(
    cat <<EOF
if [ -f $(flowbiz_quote_bash "$remote_state_dir/exit_code") ]; then
  printf 'status=completed\n'
  printf 'exit_code=%s\n' "\$(cat $(flowbiz_quote_bash "$remote_state_dir/exit_code"))"
elif [ -f $(flowbiz_quote_bash "$remote_state_dir/pid") ] && kill -0 "\$(cat $(flowbiz_quote_bash "$remote_state_dir/pid"))" 2>/dev/null; then
  printf 'status=running\n'
else
  printf 'status=unknown\n'
fi
if [ -f $(flowbiz_quote_bash "$remote_state_dir/deploy.log") ]; then
  printf -- '---log---\n'
  tail -n 20 $(flowbiz_quote_bash "$remote_state_dir/deploy.log")
fi
EOF
  )
  poll_output="$(run_ssh "$VPS_HOST" "$poll_command" | tr -d '\r')"

  status="$(printf '%s\n' "$poll_output" | awk -F= '/^status=/{print $2; exit}')"
  exit_code="$(printf '%s\n' "$poll_output" | awk -F= '/^exit_code=/{print $2; exit}')"
  log_tail="$(printf '%s\n' "$poll_output" | awk 'found{print} /^---log---$/{found=1}')"

  if [[ -n "$log_tail" && "$log_tail" != "$last_log" ]]; then
    printf '%s\n' "$log_tail"
    last_log="$log_tail"
  fi

  if [[ "$status" == "completed" ]]; then
    if [[ "${exit_code:-1}" != "0" ]]; then
      echo "Production deploy failed." >&2
      exit 1
    fi
    run_ssh "$VPS_HOST" "cat $(flowbiz_quote_bash "$telemetry_path")" | tr -d '\r' || true
    exit 0
  fi

  sleep "$DEPLOY_POLL_SECONDS"
done

echo "Production deploy timed out after ${DEPLOY_TIMEOUT_SECONDS}s." >&2
exit 1
