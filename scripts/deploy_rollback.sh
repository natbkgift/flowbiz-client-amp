#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=scripts/_deploy_lib.sh
source "$SCRIPT_DIR/_deploy_lib.sh"

VPS_HOST="${VPS_HOST_ALIAS:-flowbiz-vps}"
VPS_ACTIVE_PATH="${VPS_ACTIVE_PATH:-/opt/flowbiz/clients/flowbiz-client-amp}"
TARGET_SHA=""
BASE_URL="${FLOWBIZ_PROD_BASE_URL:-https://amppattaya.com}"
LOG_DIR="${FLOWBIZ_DEPLOY_ROLLBACK_LOG_DIR:-$REPO_ROOT/ops/logs/deploy-rollback}"
FLOWBIZ_VERBOSE="${FLOWBIZ_VERBOSE:-0}"
HISTORY_MODE="compatible"
PASSTHROUGH_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vps-host) VPS_HOST="$2"; PASSTHROUGH_ARGS+=("$1" "$2"); shift 2 ;;
    --vps-active-path) VPS_ACTIVE_PATH="$2"; PASSTHROUGH_ARGS+=("$1" "$2"); shift 2 ;;
    --target-sha) TARGET_SHA="$2"; shift 2 ;;
    --base-url) BASE_URL="$2"; shift 2 ;;
    --verbose) FLOWBIZ_VERBOSE=1; PASSTHROUGH_ARGS+=(--verbose); shift ;;
    *) PASSTHROUGH_ARGS+=("$1"); shift ;;
  esac
done

export FLOWBIZ_VERBOSE
mkdir -p "$LOG_DIR"

if [[ -z "$TARGET_SHA" ]]; then
  TRANSPORT_ENV="$(flowbiz_detect_env)"
  flowbiz_pick_ssh_tools "$TRANSPORT_ENV"
  SSH_BIN="$FLOWBIZ_SELECTED_SSH_BIN"
  SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=8)
  remote_history_path="$VPS_ACTIVE_PATH/ops/logs/deploy-history"
  remote_payload="$({
    "$SSH_BIN" "${SSH_OPTS[@]}" "$VPS_HOST" "python3 - <<'PY' $(flowbiz_quote_bash "$remote_history_path")
import json
import sys
from pathlib import Path

history_root = Path(sys.argv[1])
items = []
for telemetry in sorted(history_root.glob('*/telemetry.json'), reverse=True):
    try:
        payload = json.loads(telemetry.read_text(encoding='utf-8'))
    except json.JSONDecodeError:
        continue
    if payload.get('deploy_status') != 'ok':
        continue
    target_sha = payload.get('target_sha')
    if not target_sha:
        continue
    if not items or items[-1] != target_sha:
        items.append(target_sha)
    if len(items) >= 2:
        break
print(items[1] if len(items) >= 2 else '')
PY"
  } | tr -d '\r')"
  TARGET_SHA="$(printf '%s' "$remote_payload" | tail -n 1)"
fi

if [[ -z "$TARGET_SHA" ]]; then
  echo "Unable to resolve rollback target SHA from deploy history." >&2
  exit 1
fi

"$SCRIPT_DIR/deploy_prod.sh" --target-sha "$TARGET_SHA" "${PASSTHROUGH_ARGS[@]}"

report_path="$LOG_DIR/rollback-$(date -u +%Y%m%dT%H%M%SZ).json"
"$SCRIPT_DIR/prod_smoke_check.sh" --base-url "$BASE_URL" --expected-build-sha "${TARGET_SHA:0:8}" --history-mode "$HISTORY_MODE" --output "$report_path"
cp "$report_path" "$LOG_DIR/latest.json"

printf 'rollback=ok target_sha=%s smoke_report=%s\n' "$TARGET_SHA" "$report_path"