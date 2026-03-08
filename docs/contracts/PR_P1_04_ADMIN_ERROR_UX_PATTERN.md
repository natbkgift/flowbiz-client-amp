# PR-P1-04: Standardize Error UX Pattern (Media / Imports / Domain)

## Scope

- `/admin/media`
- `/admin/imports`
- `/admin/domain`

## What Changed

- Added shared workspace error component:
  - `admin-app/components/admin/AdminWorkspaceErrorState.tsx`
  - standard structure: `title + detail + action`
- Added shared error-message formatter:
  - `admin-app/app/_lib/admin-workspace-error.ts`
  - sanitizes noisy payloads and blocks raw HTML dumps
  - normalizes `request_failed:<status>:<detail>` into safe text
- Migrated 3 target workspaces to use shared error pattern for top-level page errors:
  - consistent retry action (`Retry` / `ลองใหม่`)
  - consistent visual and semantics (`role="alert"`)

## Intended Runtime Behavior

- Fail path across all 3 workspaces uses the same error card and CTA pattern.
- Retry button always invokes workspace reload action.
- Raw backend HTML payloads are not rendered in the UI.
- Success path remains unchanged after retry success.

## Regression Guards

- `admin-app/__tests__/admin_workspace_error_utils.test.ts`
- `admin-app/__tests__/admin_workspace_error_state.test.tsx`
- `admin-app/__tests__/b14_admin_workspaces_pages.test.ts`
