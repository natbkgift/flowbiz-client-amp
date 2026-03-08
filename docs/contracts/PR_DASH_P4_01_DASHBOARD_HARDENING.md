# DASH-P4-PR1: Dashboard Accessibility, i18n, and Performance Hardening

## Scope

- `admin-app/app/admin/dashboard/page.tsx`
- `admin-app/components/admin/dashboard/DashboardSectionPrimitives.tsx`
- `admin-app/components/admin/dashboard/DashboardKpiWidgets.tsx`
- `admin-app/components/admin/dashboard/DashboardRecentInquiriesTable.tsx`
- `admin-app/components/admin/dashboard/DashboardTrendChart.tsx`
- `admin-app/app/globals.css`

## What Changed

- Added stronger section semantics with generated heading/subtitle ids wired through `aria-labelledby` and `aria-describedby`.
- Added dashboard-level a11y state hooks:
  - `aria-busy` on the main dashboard shell while loading
  - `role="alert"` for auth errors
  - grouped period toggle semantics for the trend controls
- Hardened the recent inquiries table for assistive tech:
  - search landmark semantics
  - screen-reader table caption
  - `aria-sort` on sortable headers
- Hardened the trend chart with screen-reader summary text and explicit `title` / `aria-describedby`.
- Localized remaining dashboard UI labels that were still English in Thai mode, especially KPI detail labels and inquiry field labels.
- Reduced filter-path churn in the inquiries table by deferring the search query before the row filtering pass.

## Acceptance Mapping

- No critical accessibility blockers in dashboard flow:
  - sections, errors, chart, and table now expose clearer semantics
- TH/EN rendering is complete for dashboard UI:
  - KPI detail labels and inquiry labels no longer fall back to raw English-only UI strings
- Performance regressions are not introduced:
  - search filtering now uses a deferred query value instead of filtering on every keystroke synchronously
