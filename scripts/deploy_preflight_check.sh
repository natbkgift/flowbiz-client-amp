#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/_deploy_lib.sh
source "$SCRIPT_DIR/_deploy_lib.sh"

VPS_HOST="${VPS_HOST_ALIAS:-flowbiz-vps}"
VPS_ACTIVE_PATH="${VPS_ACTIVE_PATH:-/opt/flowbiz/clients/flowbiz-client-amp}"
VPS_RELEASE_ROOT="${VPS_RELEASE_ROOT:-/opt/flowbiz/clients}"
MIN_REMOTE_FREE_MB="${MIN_REMOTE_FREE_MB:-2048}"
FLOWBIZ_VERBOSE="${FLOWBIZ_VERBOSE:-0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vps-host) VPS_HOST="$2"; shift 2 ;;
    --vps-active-path) VPS_ACTIVE_PATH="$2"; shift 2 ;;
    --vps-release-root) VPS_RELEASE_ROOT="$2"; shift 2 ;;
    --min-remote-free-mb) MIN_REMOTE_FREE_MB="$2"; shift 2 ;;
    --verbose) FLOWBIZ_VERBOSE=1; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

export FLOWBIZ_VERBOSE

SSH_OPTS=(
  -o BatchMode=yes
  -o ConnectTimeout=8
  -o ServerAliveInterval=15
  -o ServerAliveCountMax=2
  -o TCPKeepAlive=yes
)

TRANSPORT_ENV="$(flowbiz_detect_env)"
flowbiz_pick_ssh_tools "$TRANSPORT_ENV"
SSH_BIN="$FLOWBIZ_SELECTED_SSH_BIN"

run_ssh() {
  flowbiz_log_cmd "$SSH_BIN" "${SSH_OPTS[@]}" "$@"
  "$SSH_BIN" "${SSH_OPTS[@]}" "$@"
}

if ! worktree_status="$(flowbiz_read_clean_worktree_status)"; then
  echo "preflight=failed check=git_clean" >&2
  if [[ -n "$worktree_status" ]]; then
    printf '%s\n' "$worktree_status" >&2
  fi
  exit 2
fi

ssh_config="$(flowbiz_resolve_ssh_target "$SSH_BIN" "$VPS_HOST")"
if [[ -z "$ssh_config" ]]; then
  echo "preflight=failed check=ssh_alias_resolution classification=wrong_ip" >&2
  exit 1
fi

resolved_host="$(flowbiz_extract_ssh_field "$ssh_config" hostname)"
resolved_port="$(flowbiz_extract_ssh_field "$ssh_config" port)"
resolved_host="${resolved_host:-$VPS_HOST}"
resolved_port="${resolved_port:-22}"
flowbiz_log "preflight ssh_target=${VPS_HOST} resolved_host=${resolved_host} resolved_port=${resolved_port} transport_env=${TRANSPORT_ENV}"

if ! flowbiz_test_tcp "$resolved_host" "$resolved_port"; then
  echo "preflight=failed check=ssh_tcp classification=network_block_or_port_closed host=${resolved_host} port=${resolved_port}" >&2
  exit 1
fi

if ! run_ssh "$VPS_HOST" "exit 0" >/dev/null; then
  echo "preflight=failed check=ssh_session classification=ssh_daemon_or_auth_failure host=${resolved_host} port=${resolved_port}" >&2
  exit 1
fi

if ! run_ssh "$VPS_HOST" "test -d $(flowbiz_quote_bash "$VPS_ACTIVE_PATH")" >/dev/null; then
  echo "preflight=failed check=target_directory path=${VPS_ACTIVE_PATH}" >&2
  exit 1
fi

if ! run_ssh "$VPS_HOST" "command -v docker >/dev/null && docker compose version >/dev/null" >/dev/null; then
  echo "preflight=failed check=docker_available" >&2
  exit 1
fi

available_kb="$(run_ssh "$VPS_HOST" "df -Pk $(flowbiz_quote_bash "$VPS_RELEASE_ROOT") | awk 'NR==2 {print \$4}'" | tr -d '\r' | tail -n 1)"
if [[ -z "$available_kb" || ! "$available_kb" =~ ^[0-9]+$ ]]; then
  echo "preflight=failed check=remote_disk_space reason=unreadable" >&2
  exit 1
fi

required_kb=$((MIN_REMOTE_FREE_MB * 1024))
if (( available_kb < required_kb )); then
  echo "preflight=failed check=remote_disk_space available_kb=${available_kb} required_kb=${required_kb}" >&2
  exit 1
fi

echo "preflight=ok ssh_host=${resolved_host} ssh_port=${resolved_port} available_kb=${available_kb} target_path=${VPS_ACTIVE_PATH}"