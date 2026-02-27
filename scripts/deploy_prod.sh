#!/usr/bin/env bash
set -euo pipefail

# Minimal production deploy via SSH alias.
# This script is intentionally deterministic and aligns with the repo's VPS rules:
# - Service remains localhost-bound (system nginx handles public routing)

VPS_HOST="${VPS_HOST_ALIAS:-flowbiz-vps}"
VPS_PATH="${VPS_DEPLOY_PATH:-/opt/flowbiz/clients/flowbiz-client-amp}"
VPS_API_PORT="${VPS_API_PORT:-8001}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vps-host) VPS_HOST="$2"; shift 2;;
    --vps-path) VPS_PATH="$2"; shift 2;;
    --vps-api-port) VPS_API_PORT="$2"; shift 2;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

ssh -o BatchMode=yes "$VPS_HOST" bash -s -- "$VPS_PATH" "$VPS_API_PORT" <<'BASH'
set -euo pipefail

VPS_PATH="$1"
VPS_API_PORT="$2"

cd "$VPS_PATH"

git fetch origin --prune
git checkout main
git checkout -- runtime/system_state.json 2>/dev/null || true
git reset --hard origin/main

BUILD_SHA=$(git rev-parse --short HEAD)
export BUILD_SHA

compose="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

echo "--- build BUILD_SHA=$BUILD_SHA"
${compose} build --build-arg GIT_SHA=$BUILD_SHA api admin-app

echo "--- up"
${compose} up -d --force-recreate --remove-orphans api admin-app

echo "--- migrations"
${compose} exec -T api alembic upgrade head

echo "--- smoke"
code=000
for i in $(seq 1 30); do
  code=$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${VPS_API_PORT}/healthz" || echo "000")
  [[ "$code" == "200" ]] && break
  sleep 2
done

echo "healthz=${code}"
[[ "$code" == "200" ]]
BASH
