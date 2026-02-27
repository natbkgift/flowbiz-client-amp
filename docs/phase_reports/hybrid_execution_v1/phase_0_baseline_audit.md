# Phase 0 — Baseline Audit (Hybrid Execution v1)

Date: 2026-02-18

This snapshot is evidence-based (taken from the repo source) and intended to freeze the current system surface **before** conversion-layer changes.

## 1) Route map snapshot

### Public site (Next.js App Router)
Public site is implemented in `admin-app/app/(site)/[locale]/…` with locale middleware defaulting to `/en`.

Key public routes (non-exhaustive, from file layout):

- `/` → localized to `/en` by middleware
- `/{locale}` → Home (`admin-app/app/(site)/[locale]/page.tsx`)
- `/{locale}/invest` (`admin-app/app/(site)/[locale]/invest/page.tsx`)
- `/{locale}/buy` (`admin-app/app/(site)/[locale]/buy/page.tsx`)
- `/{locale}/rent` (`admin-app/app/(site)/[locale]/rent/page.tsx`)
- `/{locale}/projects` (`admin-app/app/(site)/[locale]/projects/page.tsx`)
- `/{locale}/projects/{slug}` (`admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`)
- `/{locale}/property/{slug}` (`admin-app/app/(site)/[locale]/property/[slug]/page.tsx`)
- `/{locale}/marketplace` (`admin-app/app/(site)/[locale]/marketplace/page.tsx`)
- `/{locale}/area-guide` (`admin-app/app/(site)/[locale]/area-guide/page.tsx`)
- `/{locale}/about` (`admin-app/app/(site)/[locale]/about/page.tsx`)
- `/{locale}/contact` (`admin-app/app/(site)/[locale]/contact/page.tsx`)

Locale behavior:
- Requests without locale prefix are redirected to `/en…` (see `admin-app/middleware.ts`).
- `/api/*` is explicitly excluded from localization middleware and is expected to be served by backend behind nginx.

### Admin (Next.js)
Admin routes are excluded from locale middleware and remain stable:

- `/login`
- `/leads`
- `/inquiries`
- `/analytics`
- `/public/*` (public listing utilities)

(see `admin-app/middleware.ts`)

### Backend API (FastAPI)
Backend API is mounted in `apps/api/main.py` and exposes (selected):

- `/healthz` (health router)
- `/v1/meta`
- `/v1/properties…`
- `/v1/projects…`
- `/v1/finder/search` (finder engine)
- `/v1/compare` (compare API)
- `/v1/inquiries` (CRM intake)
- `/v1/bookings`, `/v1/availability` (booking system)

Source: router includes in `apps/api/main.py` and individual routers under `apps/api/routes/v1/*`.

## 2) Project page structure snapshot

### Project listing
- `/{locale}/projects` fetches projects from `/api/v1/projects` (via `admin-app/app/_lib/public-api-server.ts`).
- If no projects are present, it falls back to grouping properties by `address` (see `admin-app/app/(site)/[locale]/projects/page.tsx`).

### Project detail
- `/{locale}/projects/{slug}` fetches a single project by slug from `/api/v1/projects/slug/{slug}`.
- Current content is a minimal advisory shell (title, subtitle, two CTAs, and “Explore more” links) (see `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`).

## 3) Current search / filter capabilities

### Public listing surfaces
- `/{locale}/buy` fetches properties with `type=resale` sorted by `newest` (see `admin-app/app/(site)/[locale]/buy/page.tsx`).
- `/{locale}/rent` fetches properties with `type=rent` sorted by `newest` (see `admin-app/app/(site)/[locale]/rent/page.tsx`).

### Finder engine
- Deterministic finder search is available at backend `/v1/finder/search` (see `apps/api/routes/v1/finder.py`, plus `packages/core/finder/*`).
- This is not currently exposed as a dedicated public UI route.

## 4) Existing CRM integration map

### Lead capture entry points
- Public pages embed `LeadForm` (client component) in multiple places (buy/rent/invest/contact) (e.g. `admin-app/components/forms/LeadForm.tsx`).
- `LeadForm` submits JSON to **same-origin** `/api/v1/inquiries` (expected to be backend via nginx).

### Backend intake
- `/v1/inquiries` creates `Inquiry` records and performs:
  - rate limiting (best-effort in-memory)
  - honeypot rejection (`website` field)
  - property existence validation
  - PII hashing for dedupe and idempotent retry window (`X-Inquiry-Deduped` header)
  - optional auto-assignment logic

Source: `apps/api/routes/v1/crm.py`.

CRM contract risk note:
- Frontend assumes `/api/v1/inquiries` accepts JSON payload matching `InquiryCreate` schema.

## 5) Current CTA placement map

Global CTAs:
- Header has a Contact CTA link styled as `.nav-link--cta` (see `admin-app/components/layout/Header.tsx`).
- Sticky CTAs exist globally:
  - Floating WhatsApp button (`admin-app/components/ux/FloatingWhatsAppCTA.tsx`)
  - Mobile sticky bar (`admin-app/components/ux/StickyMobileCTA.tsx`)

Homepage CTAs:
- Hero has 2 CTAs:
  - Explore investment → `/{locale}/invest`
  - Speak to advisor → `/{locale}/contact`

Source: `admin-app/app/(site)/[locale]/page.tsx`.

## Acceptance gate checks (Phase 0)

- Hidden coupling risks: locale middleware excludes `/api/*` and admin routes; public pages rely on backend availability at `/api`.
- Route conflict risk: new routes must not overlap with `/api/*`, `/public/*`, or locale middleware behavior.
- Schema risk: Phase 0 makes no schema changes.
