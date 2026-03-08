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
- Used existing `recent_inquiries.created_at` rows from `/api/admin/dashboard/health-summary` as the chart data source.

## State Handling

- `loading`: chart skeleton surface
- `idle`: info state prompting first refresh
- `error`: explicit section error card with retry
- `no-data`: explicit empty state when the selected period has no activity buckets
- `success`: rendered chart with summary stats and axis labels

## Data Contract

- No backend contract changes
- Trend points are derived client-side from:
  - `summary.generated_at`
  - `summary.recent_inquiries[*].created_at`

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
