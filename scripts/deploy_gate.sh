#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BASE_URL="${FLOWBIZ_PROD_BASE_URL:-https://amppattaya.com}"
OUTPUT_PATH="${FLOWBIZ_PROD_SMOKE_REPORT:-$REPO_ROOT/ops/deploy-smoke-report.json}"
LOG_DIR="${FLOWBIZ_DEPLOY_GATE_LOG_DIR:-$REPO_ROOT/ops/logs/deploy-gate}"
TARGET_SHA="${TARGET_SHA_OVERRIDE:-$(git rev-parse HEAD)}"
DEPLOY_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) BASE_URL="$2"; shift 2 ;;
    --output) OUTPUT_PATH="$2"; shift 2 ;;
    --target-sha) TARGET_SHA="$2"; shift 2 ;;
    --verbose) DEPLOY_ARGS+=(--verbose); shift ;;
    *) DEPLOY_ARGS+=("$1"); shift ;;
  esac
done

mkdir -p "$LOG_DIR"

"$SCRIPT_DIR/deploy_preflight_check.sh" "${DEPLOY_ARGS[@]}"
"$SCRIPT_DIR/deploy_prod.sh" --target-sha "$TARGET_SHA" --skip-preflight "${DEPLOY_ARGS[@]}"
"$SCRIPT_DIR/prod_smoke_check.sh" --base-url "$BASE_URL" --expected-build-sha "${TARGET_SHA:0:8}" --output "$OUTPUT_PATH"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
cp "$OUTPUT_PATH" "$LOG_DIR/deploy-gate-${timestamp}.json"
cp "$OUTPUT_PATH" "$LOG_DIR/latest.json"

printf 'deploy_gate=ok target_sha=%s smoke_report=%s\n' "$TARGET_SHA" "$OUTPUT_PATH"