#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BASE_URL="${FLOWBIZ_PROD_BASE_URL:-https://amppattaya.com}"
OUTPUT_DIR="${FLOWBIZ_PROD_WATCHDOG_LOG_DIR:-$REPO_ROOT/ops/logs/watchdog}"
INTERVAL_SECONDS="${FLOWBIZ_PROD_WATCHDOG_INTERVAL_SECONDS:-300}"
LOOP_MODE=0
ALERT_WEBHOOK_URL="${FLOWBIZ_PROD_ALERT_WEBHOOK_URL:-}"
ALERT_COMMAND="${FLOWBIZ_PROD_ALERT_COMMAND:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) BASE_URL="$2"; shift 2 ;;
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --interval-seconds) INTERVAL_SECONDS="$2"; shift 2 ;;
    --alert-webhook-url) ALERT_WEBHOOK_URL="$2"; shift 2 ;;
    --alert-command) ALERT_COMMAND="$2"; shift 2 ;;
    --loop) LOOP_MODE=1; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$OUTPUT_DIR"

run_once() {
  local timestamp
  local report_path
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  report_path="$OUTPUT_DIR/watchdog-${timestamp}.json"

  if "$SCRIPT_DIR/prod_smoke_check.sh" --base-url "$BASE_URL" --output "$report_path"; then
    cp "$report_path" "$OUTPUT_DIR/latest.json"
    printf 'watchdog=ok report=%s\n' "$report_path"
    return 0
  fi

  cp "$report_path" "$OUTPUT_DIR/latest.json"
  if [[ -n "$ALERT_COMMAND" ]]; then
    FLOWBIZ_WATCHDOG_REPORT="$report_path" bash -lc "$ALERT_COMMAND" || true
  fi
  if [[ -n "$ALERT_WEBHOOK_URL" ]]; then
    curl -fsS -X POST -H 'Content-Type: application/json' --data @"$report_path" "$ALERT_WEBHOOK_URL" || true
  fi
  printf 'watchdog=failed report=%s\n' "$report_path" >&2
  return 1
}

if (( LOOP_MODE == 1 )); then
  while true; do
    run_once || true
    sleep "$INTERVAL_SECONDS"
  done
else
  run_once
fi