#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="$1"
REMOTE_SCRIPT="$2"
OVERLAY_ROOT="$3"
shift 3

mkdir -p "$STATE_DIR"
LOG_FILE="$STATE_DIR/deploy.log"
EXIT_FILE="$STATE_DIR/exit_code"

set +e
bash "$REMOTE_SCRIPT" "$@" >>"$LOG_FILE" 2>&1
status=$?
set -e

printf '%s\n' "$status" >"$EXIT_FILE"
rm -f "$REMOTE_SCRIPT"
if [[ -n "$OVERLAY_ROOT" ]]; then
  rm -rf "$OVERLAY_ROOT"
fi

exit "$status"
