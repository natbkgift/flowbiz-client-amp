# PR-P1-02: Admin EN/TH Navigation Localization

## Scope

- Admin shell sidebar
- Mobile quick navigation
- Topbar section label + breadcrumb
- Core admin navigation metadata (label + description)

## Changes

- Refactored `admin-app/app/_lib/admin-nav.ts`
  - `label` and `description` now use `{ en, th }` shape.
  - Added `getAdminNavText()` helper for locale-safe lookup with EN fallback.
- Updated `admin-app/components/layout/AdminShell.tsx`
  - Reads localized labels/descriptions via `getAdminNavText`.
  - Localized aria labels for:
    - workspace navigation
    - quick navigation
    - page context
    - breadcrumb
  - Localized admin brand label (`AMP Admin` / `AMP แอดมิน`).

## Regression Guard

- `admin-app/__tests__/admin_shell_i18n.test.ts`
  - verifies EN/TH coverage for all admin nav items
  - verifies `AdminShell` uses localized rendering paths and aria labels
