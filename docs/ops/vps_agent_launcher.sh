#!/usr/bin/env bash

set -e

APP_DIR="/opt/flowbiz/clients/flowbiz-client-amp"
LOG_DIR="$APP_DIR/runtime"
STATE_FILE="$APP_DIR/runtime/system_state.json"

mkdir -p "$LOG_DIR"

echo "=== AMP AUTONOMOUS AGENT START ==="

while true; do

  echo "---- LOOP START $(date) ----" >> "$LOG_DIR/agent_loop.log"

  # STEP 1 — ensure repo synced
  cd "$APP_DIR"
  git pull --ff-only origin main >> "$LOG_DIR/git.log" 2>&1 || true

  # STEP 2 — ensure state exists
  if [ ! -f "$STATE_FILE" ]; then
      echo "STATE FILE MISSING" >> "$LOG_DIR/error.log"
      sleep 60
      continue
  fi

  # STEP 3 — planner decision
  echo "Running planner..." >> "$LOG_DIR/agent_loop.log"

  # (placeholder call — planner integration)
  echo "Planner evaluated" >> "$LOG_DIR/agent_loop.log"

  # STEP 4 — execution loop trigger
  echo "Executing loop..." >> "$LOG_DIR/agent_loop.log"

  # call loop engine (future python runner)
  # python runtime_loop.py

  # STEP 5 — health probe
  curl -s http://127.0.0.1:8001/healthz >> "$LOG_DIR/health.log" 2>&1 || true

  # STEP 6 — sleep
  LOOP_INTERVAL=$(jq '.runtime.loop_interval_seconds' "$STATE_FILE" 2>/dev/null)
  if [ -z "$LOOP_INTERVAL" ]; then
      LOOP_INTERVAL=60
  fi

  sleep "$LOOP_INTERVAL"

done
