#!/usr/bin/env bash
set -euo pipefail

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
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET//$'\r'/}"

SSH_OPTS=(
  -o BatchMode=yes
  -o ServerAliveInterval=15
  -o ServerAliveCountMax=10
  -o TCPKeepAlive=yes
)

read_clean_worktree_status() {
  local status_output=""

  status_output="$(git status --short 2>/dev/null || true)"
  if [[ -z "$status_output" ]]; then
    return 0
  fi

  if command -v powershell.exe >/dev/null 2>&1 && command -v wslpath >/dev/null 2>&1; then
    local repo_root=""
    local windows_repo_root=""
    repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
    windows_repo_root="$(wslpath -w "$repo_root" 2>/dev/null || true)"
    if [[ -n "$windows_repo_root" ]]; then
      status_output="$(
        powershell.exe -NoProfile -Command "\$ErrorActionPreference = 'Stop'; Set-Location -LiteralPath '$windows_repo_root'; \$status = (git status --short 2>&1 | Out-String).Trim(); if (\$status) { Write-Output \$status }" \
          | tr -d '\r'
      )"
      if [[ -z "$status_output" ]]; then
        return 0
      fi
    fi
  fi

  printf '%s' "$status_output"
  return 1
}

if ! worktree_status="$(read_clean_worktree_status)"; then
  echo "Local worktree must be clean before deploy." >&2
  if [[ -n "$worktree_status" ]]; then
    printf '%s\n' "$worktree_status" >&2
  fi
  exit 2
fi

quote_bash() {
  printf "'%s'" "${1//\'/\'\"\'\"\'}"
}

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
  ssh "${SSH_OPTS[@]}" "$VPS_HOST" "rm -f $(quote_bash "$remote_script_path")" >/dev/null 2>&1 || true
  ssh "${SSH_OPTS[@]}" "$VPS_HOST" "rm -f $(quote_bash "$remote_runner_path")" >/dev/null 2>&1 || true
}
trap cleanup EXIT

normalize_lf_copy "$deploy_remote_source" "$remote_script_local"

scp -q "${SSH_OPTS[@]}" "$remote_script_local" "${VPS_HOST}:${remote_script_path}"
scp -q "${SSH_OPTS[@]}" "scripts/deploy_remote_job.sh" "${VPS_HOST}:${remote_runner_path}"

launch_command=$(
  cat <<EOF
mkdir -p $(quote_bash "$remote_state_dir") &&
chmod 700 $(quote_bash "$remote_script_path") $(quote_bash "$remote_runner_path") &&
{ nohup env FLOWBIZ_DEPLOY_SOURCE=scripts/deploy_prod.sh bash $(quote_bash "$remote_runner_path") \
    $(quote_bash "$remote_state_dir") \
    $(quote_bash "$remote_script_path") \
    '' \
    $(quote_bash "$REMOTE_URL") \
    $(quote_bash "$TARGET_SHA") \
    $(quote_bash "$VPS_ACTIVE_PATH") \
    $(quote_bash "$VPS_RELEASE_ROOT") \
    $(quote_bash "$VPS_API_PORT") \
    $(quote_bash "$VPS_ADMIN_PORT") \
    $(quote_bash "$COMPOSE_PROJECT_NAME") \
    $(quote_bash "$ALEMBIC_UPGRADE_TARGET") \
    > /dev/null 2>&1 < /dev/null & printf '%s\n' "\$!" > $(quote_bash "$remote_state_dir/pid"); }
EOF
)
ssh "${SSH_OPTS[@]}" "$VPS_HOST" "$launch_command"

deadline=$((SECONDS + DEPLOY_TIMEOUT_SECONDS))
last_log=""

while (( SECONDS < deadline )); do
  poll_output="$(
    ssh "${SSH_OPTS[@]}" "$VPS_HOST" "
if [ -f $(quote_bash "$remote_state_dir/exit_code") ]; then
  printf 'status=completed\n'
  printf 'exit_code=%s\n' \"\$(cat $(quote_bash "$remote_state_dir/exit_code"))\"
elif [ -f $(quote_bash "$remote_state_dir/pid") ] && kill -0 \"\$(cat $(quote_bash "$remote_state_dir/pid"))\" 2>/dev/null; then
  printf 'status=running\n'
else
  printf 'status=unknown\n'
fi
if [ -f $(quote_bash "$remote_state_dir/deploy.log") ]; then
  printf -- '---log---\n'
  tail -n 20 $(quote_bash "$remote_state_dir/deploy.log")
fi
"
  )"

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
    ssh "${SSH_OPTS[@]}" "$VPS_HOST" "cat $(quote_bash "$telemetry_path")" || true
    exit 0
  fi

  sleep "$DEPLOY_POLL_SECONDS"
done

echo "Production deploy timed out after ${DEPLOY_TIMEOUT_SECONDS}s." >&2
exit 1
