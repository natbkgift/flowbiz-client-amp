# DASH-P2-PR2: Dashboard Section Composition and Loading States

## Scope

- `admin-app/app/admin/dashboard/page.tsx`
- `admin-app/components/admin/dashboard/DashboardSectionPrimitives.tsx`
- `admin-app/app/globals.css`

## What Changed

- Reframed the admin dashboard into stable layout blocks:
  - hero overview
  - KPI/widget section
  - pipeline insights section
  - recent inquiries table section
  - warnings section
- Added reusable dashboard primitives for:
  - section shells
  - section-level info/empty/error states
  - metric, widget, insight, and table skeletons
- Preserved the existing auth/session flow and backend summary contract while changing the composition surface.

## Intended Runtime Behavior

- Authenticated users always see the same section hierarchy, even while data is loading or unavailable.
- Each major section owns its own placeholder state instead of collapsing the whole page into one generic message.
- Loading surfaces reserve space for their eventual content to reduce layout jumpiness.

## Regression Guards

- `admin-app/__tests__/b14_admin_dashboard_page.test.ts`
- `admin-app/__tests__/admin_dashboard_surface_styles.test.ts`
- `admin-app/__tests__/admin_dashboard_layout_primitives.test.ts`

## Acceptance Mapping

- Layout stable with and without data:
  - fixed dashboard shell columns
  - section min-heights
  - dedicated skeleton surfaces
- Skeleton states match section hierarchy:
  - overview metrics
  - widget grid
  - insight list
  - table rows
- Section-level empty/error states are visible and usable:
  - retry actions available from each section
  - idle/info states guide first refresh after sign-in
