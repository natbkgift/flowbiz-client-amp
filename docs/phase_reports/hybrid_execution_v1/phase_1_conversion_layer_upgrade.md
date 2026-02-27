# Phase 1 — Conversion Layer Upgrade (Hybrid Execution v1)

Date: 2026-02-18

## 1) What was observed

- Homepage hero content is driven by i18n dictionary keys `home.heroTitle` / `home.heroSubtitle`.
- Homepage already had two hero CTAs (Invest / Contact) and multiple below-the-fold sections.
- Global CTAs already exist:
  - Floating WhatsApp CTA
  - Mobile sticky CTA bar (2 buttons)
- Public site is locale-prefixed (`/en`, `/th`) with middleware redirecting non-localized routes.

## 2) What was changed

- Updated the hero headline to the new promise:
  - EN: “Find the right Pattaya property in 60 seconds”
  - TH: Thai equivalent
- Added an above-the-fold “Smart Entry” CTA block (Buy / Rent / Invest) that opens a guided flow.
- Implemented a guided goal “modal” using query params + server-rendered HTML so it still works if client-side JS fails.
  - Flow: Goal → Budget → Timeline → Contact
  - Contact step provides direct WhatsApp + internal links for tour/plan requests.
- Updated mobile sticky CTA bar to include the required 3 actions:
  - Book Private Tour
  - WhatsApp
  - Get Investment Plan

No existing sections were removed.

## 3) Files affected

- `admin-app/app/(site)/[locale]/page.tsx`
- `admin-app/app/(site)/[locale]/contact/page.tsx`
- `admin-app/components/ux/StickyMobileCTA.tsx`
- `admin-app/app/globals.css`
- `admin-app/app/_lib/i18n/types.ts`
- `admin-app/app/_lib/i18n/en.ts`
- `admin-app/app/_lib/i18n/th.ts`

## 4) Risk assessment

- Low–medium UI risk: adding a new above-the-fold block and a guided overlay can affect mobile layout.
- Low route risk: changes are limited to existing routes with query params; no route deletions.
- No backend/schema risk: no API changes; no migrations.

## 5) Validation result (deterministic + regression surface)

- Determinism: guided flow is query-param driven; same inputs render same outputs.
- Regression surface: existing hero CTAs and sections remain intact; locale routing unchanged.
- Mobile overflow: sticky bar updated to 3 columns; requires quick manual viewport check.

## 6) Rollback strategy

- Revert the Phase 1 commit SHA.
- Rebuild and redeploy the `admin-app` container.
- Smoke test:
  - `/{locale}` loads
  - CTAs link correctly
  - `/health` and `/api/v1/meta` unchanged
