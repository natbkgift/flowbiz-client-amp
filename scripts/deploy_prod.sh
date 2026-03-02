#!/usr/bin/env bash
set -euo pipefail

# API-only production deploy via fresh VPS checkout.
# The current branch does not contain the legacy Next.js frontend source, so
# this script rebuilds and replaces only the API container and leaves the
# existing admin-app container untouched.

VPS_HOST="${VPS_HOST_ALIAS:-flowbiz-vps}"
VPS_ACTIVE_PATH="${VPS_ACTIVE_PATH:-/opt/flowbiz/clients/flowbiz-client-amp}"
VPS_RELEASE_ROOT="${VPS_RELEASE_ROOT:-/opt/flowbiz/clients}"
VPS_API_PORT="${VPS_API_PORT:-8001}"
VPS_ADMIN_PORT="${VPS_ADMIN_PORT:-8002}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-flowbiz-client-amp}"
REMOTE_URL="${REMOTE_URL_OVERRIDE:-}"
TARGET_SHA="${TARGET_SHA_OVERRIDE:-$(git rev-parse HEAD)}"
ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET:-head}"

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
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET//$'\r'/}"

if [[ -n "$(git status --short)" ]]; then
  echo "Local worktree must be clean before deploy." >&2
  exit 2
fi

ssh -o BatchMode=yes "$VPS_HOST" bash -s -- \
  "$REMOTE_URL" \
  "$TARGET_SHA" \
  "$VPS_ACTIVE_PATH" \
  "$VPS_RELEASE_ROOT" \
  "$VPS_API_PORT" \
  "$VPS_ADMIN_PORT" \
  "$COMPOSE_PROJECT_NAME" \
  "$ALEMBIC_UPGRADE_TARGET" <<'BASH'
set -euo pipefail

REMOTE_URL="$1"
TARGET_SHA="$2"
VPS_ACTIVE_PATH="$3"
VPS_RELEASE_ROOT="$4"
VPS_API_PORT="$5"
VPS_ADMIN_PORT="$6"
COMPOSE_PROJECT_NAME="$7"
ALEMBIC_UPGRADE_TARGET="$8"
ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET//$'\r'/}"

if [[ -z "$REMOTE_URL" || "$REMOTE_URL" == "__AUTO__" ]]; then
  REMOTE_URL="$(git -C "$VPS_ACTIVE_PATH" remote get-url origin)"
fi

release_path="${VPS_RELEASE_ROOT}/flowbiz-client-amp-release-${TARGET_SHA:0:8}-$(date +%Y%m%d%H%M%S)"

cleanup() {
  code=$?
  if [[ $code -ne 0 && -d "${release_path:-}" ]]; then
    rm -rf "$release_path"
  fi
  exit $code
}
trap cleanup EXIT

mkdir -p "$VPS_RELEASE_ROOT"
git clone --branch main --single-branch "$REMOTE_URL" "$release_path"
cd "$release_path"
git checkout "$TARGET_SHA"

if [[ ! -f "$VPS_ACTIVE_PATH/.env" ]]; then
  echo "Missing production env file: $VPS_ACTIVE_PATH/.env" >&2
  exit 1
fi

set -a
. "$VPS_ACTIVE_PATH/.env"
set +a

export BUILD_SHA
BUILD_SHA="$(git rev-parse --short HEAD)"
export FLOWBIZ_ENV_FILE="$VPS_ACTIVE_PATH/.env"
export VPS_API_PORT
export VPS_ADMIN_PORT

compose=(
  docker compose
  -p "$COMPOSE_PROJECT_NAME"
  -f "$release_path/docker-compose.yml"
  -f "$release_path/docker-compose.prod.yml"
)

echo "--- build api/admin-app BUILD_SHA=$BUILD_SHA"
"${compose[@]}" build api admin-app

echo "--- migrations"
"${compose[@]}" run --rm --no-deps \
  -e ALEMBIC_UPGRADE_TARGET="$ALEMBIC_UPGRADE_TARGET" \
  api sh -lc 'python -m alembic upgrade "$ALEMBIC_UPGRADE_TARGET"'

echo "--- recreate api/admin-app"
"${compose[@]}" up -d --no-deps --force-recreate api admin-app

echo "--- smoke"
healthz=000
properties=000
projects=000
admin_login=000
for _ in $(seq 1 30); do
  healthz="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${VPS_API_PORT}/healthz" || echo 000)"
  properties="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${VPS_API_PORT}/v1/properties?limit=1" || echo 000)"
  projects="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${VPS_API_PORT}/v1/projects?limit=1" || echo 000)"
  admin_login="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${VPS_ADMIN_PORT}/login" || echo 000)"
  [[ "$healthz" == "200" && "$properties" == "200" && "$projects" == "200" && "$admin_login" == "200" ]] && break
  sleep 2
done

echo "release_path=$release_path"
echo "build_sha=$BUILD_SHA"
echo "healthz=$healthz"
echo "properties=$properties"
echo "projects=$projects"
echo "admin_login=$admin_login"

deploy_status="error"
if [[ "$healthz" == "200" && "$properties" == "200" && "$projects" == "200" && "$admin_login" == "200" ]]; then
  deploy_status="ok"
fi

telemetry_dir="${VPS_ACTIVE_PATH}/ops/logs"
telemetry_file="${telemetry_dir}/deploy_telemetry.json"
mkdir -p "$telemetry_dir"
export TELEMETRY_FILE="$telemetry_file"
export TARGET_SHA
export release_path
export TELEMETRY_DEPLOYED_AT
TELEMETRY_DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
export TELEMETRY_DEPLOY_STATUS="$deploy_status"
python - <<'PY'
import json
import os
from pathlib import Path

path = Path(os.environ["TELEMETRY_FILE"])
payload = {
    "generated_at": os.environ["TELEMETRY_DEPLOYED_AT"],
    "deployed_at": os.environ["TELEMETRY_DEPLOYED_AT"],
    "deploy_status": os.environ["TELEMETRY_DEPLOY_STATUS"],
    "smoke_passed": os.environ["TELEMETRY_DEPLOY_STATUS"] == "ok",
    "build_sha": os.environ.get("BUILD_SHA"),
    "target_sha": os.environ.get("TARGET_SHA"),
    "release_path": os.environ.get("release_path"),
    "source": "scripts/deploy_prod.sh",
    "smoke": {
        "healthz_code": os.environ.get("healthz"),
        "properties_code": os.environ.get("properties"),
        "projects_code": os.environ.get("projects"),
        "admin_login_code": os.environ.get("admin_login"),
    },
}
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
PY
echo "deploy_telemetry=$telemetry_file"
[[ "$healthz" == "200" && "$properties" == "200" && "$projects" == "200" && "$admin_login" == "200" ]]
BASH
