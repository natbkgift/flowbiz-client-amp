# DASH-P3-PR3: Recent Inquiries Table Interactions and Mobile Fallback

## Scope

- `admin-app/app/admin/dashboard/page.tsx`
- `admin-app/components/admin/dashboard/DashboardRecentInquiriesTable.tsx`
- `admin-app/app/globals.css`

## What Changed

- Replaced the raw success-state table renderer with a dedicated recent inquiries table component.
- Added client-side search, status filtering, sort key selection, and sort direction toggle.
- Kept the existing inquiry fields and backend contract intact:
  - `created_at`
  - `name`
  - `email`
  - `phone`
  - `status`
  - `intent`
  - `source_page`
- Added a stacked card fallback for narrow screens instead of relying on horizontal table scrolling alone.

## Interaction Notes

- Search matches across the existing visible inquiry fields.
- Status options are derived from the rows already returned by `/api/admin/dashboard/health-summary`.
- Sorting supports:
  - created time
  - status
  - name
- Reset returns the view to default:
  - no query
  - all statuses
  - sort by newest first

## Acceptance Mapping

- Users can scan, filter, and sort key rows quickly:
  - toolbar controls are rendered above the inquiry list
  - result count updates from filtered rows
- Mobile remains usable:
  - desktop table is hidden on narrow screens
  - stacked inquiry cards expose the same fields for mobile reading
- Existing inquiry semantics remain intact:
  - no backend or field-name changes were introduced
