#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# smoke-test.sh — Post-deploy verification for amppattaya.com
#
# Usage:  bash scripts/smoke-test.sh [SITE_URL]
# Exit 0 = all green, Exit 1 = one or more checks failed
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SITE_URL="${1:-https://amppattaya.com}"
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local expect_status="${3:-200}"

  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" || echo "000")

  if [[ "$status" == "$expect_status" ]]; then
    echo "  OK   $label ($status)"
  else
    echo "  FAIL $label (got $status, expected $expect_status)"
    FAIL=1
  fi
}

echo "=== Smoke Tests — $SITE_URL ==="

# Core public pages
check "Homepage (EN)"       "$SITE_URL/en"
check "Homepage (TH)"       "$SITE_URL/th"
check "Buy page"            "$SITE_URL/en/buy"
check "Rent page"           "$SITE_URL/en/rent"
check "Invest page"         "$SITE_URL/en/invest"
check "About page"          "$SITE_URL/en/about"
check "Contact page"        "$SITE_URL/en/contact"
check "Projects page"       "$SITE_URL/en/projects"

# API health
check "API health"          "$SITE_URL/api/v1/health"
check "API meta"            "$SITE_URL/api/v1/meta"

# Static assets
check "Favicon"             "$SITE_URL/favicon.ico"

echo ""

if [[ "$FAIL" -eq 0 ]]; then
  echo "=== All smoke tests passed ==="
  exit 0
else
  echo "=== SMOKE TEST FAILURE — triggering rollback ==="
  exit 1
fi
