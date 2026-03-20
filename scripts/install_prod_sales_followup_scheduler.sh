#!/usr/bin/env bash
set -euo pipefail

ACTIVE_PATH="${1:-/opt/flowbiz/clients/flowbiz-client-amp}"
COMPOSE_PROJECT_NAME="${2:-flowbiz-client-amp}"
SYSTEMD_DIR="${3:-/etc/systemd/system}"
INSTALL_BIN_DIR="${4:-/usr/local/bin}"
SERVICE_NAME="flowbiz-sales-followup"
WRAPPER_PATH="$INSTALL_BIN_DIR/flowbiz-run-sales-followups.sh"
INSPECT_PATH="$INSTALL_BIN_DIR/flowbiz-inspect-sales-followups.py"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_DIR="$REPO_ROOT/ops/systemd"

mkdir -p "$ACTIVE_PATH/ops/logs/sales-followups/runs"
install -d "$INSTALL_BIN_DIR"
install -m 755 "$REPO_ROOT/scripts/run_prod_sales_followups.sh" "$WRAPPER_PATH"
install -m 755 "$REPO_ROOT/scripts/inspect_sales_followup_runs.py" "$INSPECT_PATH"

render_template() {
  local source_path="$1"
  local output_path="$2"

  python3 - <<'PY' "$source_path" "$output_path" "$ACTIVE_PATH" "$COMPOSE_PROJECT_NAME" "$INSTALL_BIN_DIR"
from __future__ import annotations

import sys
from pathlib import Path

source_path, output_path, active_path, compose_project_name, install_bin_dir = sys.argv[1:]
text = Path(source_path).read_text(encoding="utf-8")
text = text.replace("__FLOWBIZ_ACTIVE_PATH__", active_path)
text = text.replace("__FLOWBIZ_COMPOSE_PROJECT_NAME__", compose_project_name)
text = text.replace("__FLOWBIZ_INSTALL_BIN_DIR__", install_bin_dir)
Path(output_path).write_text(text, encoding="utf-8")
PY
}

install -d "$SYSTEMD_DIR"
render_template "$TEMPLATE_DIR/flowbiz-sales-followup.service" "$SYSTEMD_DIR/$SERVICE_NAME.service"
render_template "$TEMPLATE_DIR/flowbiz-sales-followup.timer" "$SYSTEMD_DIR/$SERVICE_NAME.timer"

if ! test -x "$WRAPPER_PATH"; then
  echo "Installer verification failed: wrapper is missing or not executable at $WRAPPER_PATH" >&2
  exit 1
fi

systemctl daemon-reexec
systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME.timer"
systemctl restart "$SERVICE_NAME.timer"

service_unit="$(systemctl cat "$SERVICE_NAME.service" 2>/dev/null || true)"
expected_condition="ConditionPathExists=$WRAPPER_PATH"
expected_execstart="ExecStart=/usr/bin/env bash $WRAPPER_PATH --repo-root $ACTIVE_PATH"

if [[ "$service_unit" != *"$expected_condition"* ]]; then
  echo "Installer verification failed: service unit ConditionPathExists mismatch." >&2
  echo "Expected: $expected_condition" >&2
  echo "$service_unit" >&2
  exit 1
fi

if [[ "$service_unit" != *"$expected_execstart"* ]]; then
  echo "Installer verification failed: service unit ExecStart mismatch." >&2
  echo "Expected: $expected_execstart" >&2
  echo "$service_unit" >&2
  exit 1
fi

timer_enabled="$(systemctl is-enabled "$SERVICE_NAME.timer" 2>/dev/null || true)"
timer_active="$(systemctl is-active "$SERVICE_NAME.timer" 2>/dev/null || true)"

if [[ "$timer_enabled" != "enabled" ]]; then
  echo "Installer verification failed: timer is not enabled (got: $timer_enabled)." >&2
  exit 1
fi

if [[ "$timer_active" != "active" ]]; then
  echo "Installer verification failed: timer is not active (got: $timer_active)." >&2
  exit 1
fi

systemctl list-timers "$SERVICE_NAME.timer" --no-pager