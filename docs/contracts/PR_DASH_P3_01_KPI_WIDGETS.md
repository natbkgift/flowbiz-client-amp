# DASH-P3-PR1: KPI Widgets on Existing Health-Summary Data

## Scope

- `admin-app/app/admin/dashboard/page.tsx`
- `admin-app/components/admin/dashboard/DashboardKpiWidgets.tsx`
- `admin-app/app/globals.css`

## What Changed

- Replaced the raw widget success renderer with a dedicated KPI widget component.
- Kept the existing dashboard state handling from Phase 2:
  - loading
  - idle/info
  - empty
  - error
- Added per-key formatting based on existing `raw_metrics` data, without changing the API contract.
- Kept widget action links functional and locale-safe through `withAdminLocale(...)`.

## Formatting Coverage

- `project_cover_coverage`: percentage plus covered/missing/external detail lines
- `broken_media_count` and `external_image_leakage_count`: localized counts plus scan context
- `pending_translations_count`: total count plus policy/entity context
- `unpublished_drafts_count`: total count plus draft breakdown
- `recent_leads_inquiries`: count plus latest activity timestamp
- `review_video_source_verification_pending`: split review/video pending pills
- `last_import_mirror_status`: import/mirror pills plus rows/errors/failures detail
- `last_deploy_health_status`: health/deploy pills plus build/source detail

## Acceptance Mapping

- KPI area reflects live backend values correctly:
  - success renderer consumes `widgets` and `raw_metrics` from `/api/admin/dashboard/health-summary`
- Widget actions remain functional:
  - action URLs are still driven by backend payload
  - links are locale-safe in the admin app
- No API contract changes required:
  - no new backend fields introduced
  - existing widget keys and `raw_metrics` shape are reused
