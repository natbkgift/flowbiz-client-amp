#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/opt/flowbiz/clients/flowbiz-client-amp"
RUNTIME_DIR="$APP_DIR/runtime"
STATE_FILE="$RUNTIME_DIR/system_state.json"

mkdir -p "$RUNTIME_DIR"

echo "=== AMP AUTONOMOUS AGENT START ==="

while true; do
  echo "---- LOOP START $(date -u +%Y-%m-%dT%H:%M:%SZ) ----" >> "$RUNTIME_DIR/agent_loop.log"

  # STEP 1 — ensure repo synced (best-effort)
  cd "$APP_DIR" || exit 1
  git pull --ff-only origin main >> "$RUNTIME_DIR/git.log" 2>&1 || true

  # STEP 2 — ensure state exists
  if [ ! -f "$STATE_FILE" ]; then
    echo "STATE FILE MISSING: $STATE_FILE" >> "$RUNTIME_DIR/error.log"
    sleep 60
    continue
  fi

  # STEP 3/4/5/6 — run one deterministic loop iteration (single-process via lock)
  if command -v python3 >/dev/null 2>&1; then
    python3 -u "$APP_DIR/runtime/runtime_loop.py" --once >> "$RUNTIME_DIR/agent_loop.log" 2>&1 || true
  elif command -v python >/dev/null 2>&1; then
    python -u "$APP_DIR/runtime/runtime_loop.py" --once >> "$RUNTIME_DIR/agent_loop.log" 2>&1 || true
  else
    echo "python_not_found" >> "$RUNTIME_DIR/error.log"
  fi

  # STEP 7 — sleep based on state (no jq dependency)
  LOOP_INTERVAL=$(
    python3 - <<'PY' 2>/dev/null || echo 60
import json
from pathlib import Path

state_path = Path("/opt/flowbiz/clients/flowbiz-client-amp/runtime/system_state.json")
try:
    state = json.loads(state_path.read_text(encoding="utf-8"))
    v = int(state.get("runtime", {}).get("loop_interval_seconds") or 60)
    print(max(1, v))
except Exception:
    print(60)
PY
  )

  sleep "$LOOP_INTERVAL"
done
