# DASH-P3-PR3: Recent Inquiries Table Interactions and Mobile Fallback

## Scope

- `admin-app/app/admin/dashboard/page.tsx`
- `admin-app/components/admin/dashboard/DashboardRecentInquiriesTable.tsx`
- `admin-app/app/globals.css`

## What Changed

- Replaced the raw success-state table renderer with a dedicated recent inquiries table component.
- Kept the existing inquiry fields intact:
  - `created_at`
  - `name`
  - `email`
  - `phone`
  - `status`
  - `intent`
  - `source_page`
- Moved dashboard table filtering/sorting/pagination onto the existing admin CRM endpoint:
  - `GET /api/admin/inquiries?page=<n>&limit=10`
  - optional `q=<text>`
  - optional `status=<status>`
  - `sort=created_at|status|name`
  - `order=asc|desc`
- Continued using `/api/admin/dashboard/health-summary` for widgets/trends/warnings and for the default first-page inquiry snapshot/count.
- Added a stacked card fallback for narrow screens instead of relying on horizontal table scrolling alone.

## Interaction Notes

- Search now issues server-backed `q` requests against the inquiry list.
- Status filter drives the server `status` query parameter.
- Sorting supports:
  - created time
  - status
  - name
- Pagination uses the server `page` + `limit` contract, with previous/next controls sized to 10 rows per page.
- Reset returns the view to default:
  - no query
  - all statuses
  - sort by newest first
  - page 1 from the summary snapshot

## Acceptance Mapping

- Users can scan, filter, and sort key rows quickly:
  - toolbar controls are rendered above the inquiry list
  - result count and page indicator update from the server response
- Mobile remains usable:
  - desktop table is hidden on narrow screens
  - stacked inquiry cards expose the same fields for mobile reading
- Existing inquiry semantics remain intact:
  - no field-name changes were introduced
