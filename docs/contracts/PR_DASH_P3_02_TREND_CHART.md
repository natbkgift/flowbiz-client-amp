# DASH-P3-PR2: Trend Chart Module with Period Toggle

## Scope

- `admin-app/app/admin/dashboard/page.tsx`
- `admin-app/components/admin/dashboard/DashboardTrendChart.tsx`
- `admin-app/components/admin/dashboard/trend-utils.ts`
- `admin-app/app/globals.css`

## What Changed

- Added a dedicated dashboard chart section between KPI widgets and the recent inquiries table.
- Implemented a lightweight SVG trend chart instead of introducing a charting dependency.
- Added a period toggle for `7D` and `30D`.
- Switched the chart to backend-provided daily series from `/api/admin/dashboard/health-summary`.

## State Handling

- `loading`: chart skeleton surface
- `idle`: info state prompting first refresh
- `error`: explicit section error card with retry
- `no-data`: explicit empty state when the selected period has no activity buckets
- `success`: rendered chart with summary stats and axis labels

## Data Contract

- Backend summary now includes:
  - `summary.trend_series["7d"][*].bucket_date`
  - `summary.trend_series["7d"][*].count`
  - `summary.trend_series["30d"][*].bucket_date`
  - `summary.trend_series["30d"][*].count`
- Frontend localizes labels and renders the backend series without depending on the visible `recent_inquiries` slice.

## Visual Notes

- Chart uses:
  - summary stats row
  - SVG area + line + dots
  - compact axis labels
  - pill-style period toggle
- The section remains responsive by collapsing stats vertically on narrow viewports

## Acceptance Mapping

- Chart panel renders across breakpoints:
  - responsive stats row and SVG surface styles added
- Period toggles update the displayed series/state reliably:
  - bucket generation is handled by pure `trend-utils`
- Error/empty states are explicit and non-breaking:
  - chart section uses the same section-state patterns introduced in Phase 2
