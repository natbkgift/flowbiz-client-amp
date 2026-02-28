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
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-flowbiz-client-amp}"
REMOTE_URL="${REMOTE_URL_OVERRIDE:-}"
TARGET_SHA="${TARGET_SHA_OVERRIDE:-$(git rev-parse HEAD)}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vps-host) VPS_HOST="$2"; shift 2 ;;
    --vps-active-path) VPS_ACTIVE_PATH="$2"; shift 2 ;;
    --vps-release-root) VPS_RELEASE_ROOT="$2"; shift 2 ;;
    --vps-api-port) VPS_API_PORT="$2"; shift 2 ;;
    --compose-project-name) COMPOSE_PROJECT_NAME="$2"; shift 2 ;;
    --remote-url) REMOTE_URL="$2"; shift 2 ;;
    --target-sha) TARGET_SHA="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

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
  "$COMPOSE_PROJECT_NAME" <<'BASH'
set -euo pipefail

REMOTE_URL="$1"
TARGET_SHA="$2"
VPS_ACTIVE_PATH="$3"
VPS_RELEASE_ROOT="$4"
VPS_API_PORT="$5"
COMPOSE_PROJECT_NAME="$6"

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

export BUILD_SHA
BUILD_SHA="$(git rev-parse --short HEAD)"
export FLOWBIZ_ENV_FILE="$VPS_ACTIVE_PATH/.env"
export VPS_API_PORT

compose=(
  docker compose
  -p "$COMPOSE_PROJECT_NAME"
  -f "$release_path/docker-compose.yml"
  -f "$release_path/docker-compose.prod.yml"
)

echo "--- build api BUILD_SHA=$BUILD_SHA"
"${compose[@]}" build api

echo "--- recreate api"
"${compose[@]}" up -d --no-deps --force-recreate api

echo "--- migrations"
"${compose[@]}" exec -T api alembic upgrade head

echo "--- smoke"
code=000
for _ in $(seq 1 30); do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${VPS_API_PORT}/healthz" || echo 000)"
  [[ "$code" == "200" ]] && break
  sleep 2
done

echo "release_path=$release_path"
echo "build_sha=$BUILD_SHA"
echo "healthz=$code"
[[ "$code" == "200" ]]
BASH
