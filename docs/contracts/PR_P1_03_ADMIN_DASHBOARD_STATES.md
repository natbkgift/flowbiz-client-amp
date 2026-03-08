# PR-P1-03: Harden Dashboard Data States

## Scope

- `/admin/dashboard`

## What Changed

- Added a small dashboard state utility:
  - `admin-app/app/admin/dashboard/state-utils.ts`
  - supports deterministic transitions for `idle/loading/error/empty/success`
- Updated dashboard page logic to use explicit state transitions:
  - loading state on fetch start
  - error state with retry action on fetch failure
  - empty state when summary payload is valid but has no actionable content
  - success state when summary has data to render
- Added localized actionable copy for:
  - retry button
  - error hint text
  - idle and empty guidance

## Intended Runtime Behavior

- Error and empty states are not mixed:
  - API/auth failure => `error`
  - valid but no data => `empty`
- Users can recover directly from UI with `Retry`.
- Success state renders widgets/table sections without console errors.

## Regression Guards

- `admin-app/__tests__/dashboard_state_utils.test.ts`
  - covers summary classification and fail->retry->success transitions
- `admin-app/__tests__/b14_admin_dashboard_page.test.ts`
  - verifies state hooks, retry copy, and contract strings on dashboard page
