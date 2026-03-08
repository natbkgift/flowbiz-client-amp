# PR-P1-01: Admin SEO/Domain Horizontal Overflow Fix

## Scope

- `/admin/seo`
- `/admin/domain`

## What Changed

- Added `admin-overflow-guard` on both pages.
- Added `domain-editor-card` wrapper for domain operation panel.
- Hardened shared admin CSS:
  - `min-width: 0` on workspace containers/cards/grids.
  - safe wrapping on `state-empty`, `state-loading`, `state-error`.
  - `max-width: 100%` for admin form controls under overflow guard.

## Intended Runtime Behavior

- No page-level horizontal overflow on key breakpoints:
  - `390px`
  - `768px`
  - `1440px`
- Long error messages and long JSON text do not force viewport overflow.
- Tables keep local horizontal scrolling inside their own wrappers when needed.

## Regression Guards

- `admin-app/__tests__/b10_admin_seo_page.test.ts`
  - asserts `admin-overflow-guard` on SEO page.
- `admin-app/__tests__/b14_admin_workspaces_pages.test.ts`
  - asserts `admin-overflow-guard` and `domain-editor-card` on domain page.
