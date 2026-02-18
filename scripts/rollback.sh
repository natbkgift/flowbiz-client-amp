#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# rollback.sh — Automatic rollback to previous known-good deploy
#
# Restores the last working image tags saved before the deploy.
# Call from the project root on the VPS:
#   bash scripts/rollback.sh
# ──────────────────────────────────────────────────────────────
set -euo pipefail

PREVIOUS_IMAGES="/tmp/previous_images.txt"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

if [[ ! -f "$PREVIOUS_IMAGES" ]]; then
  echo "ERROR: No previous image list found at $PREVIOUS_IMAGES"
  echo "Cannot auto-rollback. Please redeploy manually."
  exit 1
fi

echo "Rolling back to previous images:"
cat "$PREVIOUS_IMAGES"
echo ""

# Stop current containers
$COMPOSE down --timeout 30

# Restart with previous images (docker compose will use whatever is tagged :latest locally)
# We re-tag previous images back to :latest
while IFS= read -r img; do
  [[ -z "$img" ]] && continue
  echo "Restoring: $img"
  docker tag "$img" "$(echo "$img" | sed 's/:.*/:latest/')" 2>/dev/null || true
done < "$PREVIOUS_IMAGES"

# Bring services back up
$COMPOSE up -d --remove-orphans

echo ""
echo "Rollback complete. Running quick health check..."

sleep 10

# Quick verification
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:8001/api/v1/health || echo "000")
APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:8002 || echo "000")

echo "  API:  $API_STATUS"
echo "  App:  $APP_STATUS"

if [[ "$API_STATUS" == "200" && "$APP_STATUS" == "200" ]]; then
  echo "Rollback verified — services healthy."
  exit 0
else
  echo "WARNING: Services may not be fully healthy after rollback."
  echo "Manual intervention recommended."
  exit 1
fi
