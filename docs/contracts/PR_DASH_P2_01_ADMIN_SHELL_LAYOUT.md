# DASH-P2-PR1: Admin Shell Layout, Searchable Navigation, and Mobile Drawer

## Scope

- `admin-app/components/layout/AdminShell.tsx`
- Admin shell styles in `admin-app/app/globals.css`

## What Changed

- Rebuilt the admin shell around a stronger layout model:
  - sidebar workspace context
  - searchable navigation
  - topbar tools row
  - quick actions
  - profile/context slot
- Added mobile/tablet drawer behavior:
  - toggle button
  - backdrop
  - close on navigation
  - close on `Escape`
  - body scroll lock while drawer is open, including scrollbar compensation
- Kept route compatibility:
  - existing `/admin/*` workspaces still live under the same shell
  - locale switching still uses `withAdminLocale(...)`
- Added regression tests for shell behavior and shell strings

## Intended Runtime Behavior

- Desktop keeps a persistent sidebar with filtered nav results and footer shortcuts.
- Topbar exposes search, quick actions, workspace profile context, and locale control.
- Tablet/mobile uses a drawer instead of always-expanded navigation rows.
- Users can reach the same admin routes with keyboard or pointer without losing breadcrumb context.

## Accessibility / Interaction Notes

- Mobile navigation toggle uses `aria-expanded` + `aria-controls`
- Drawer closes on `Escape`
- Drawer closes after route navigation
- Search remains available in both sidebar/topbar and drawer contexts

## Regression Guards

- `admin-app/__tests__/admin_shell_i18n.test.ts`
- `admin-app/__tests__/admin_shell_navigation_behavior.test.ts`
- `admin-app/__tests__/a_phase_admin_shell_routes.test.ts`
- `admin-app/__tests__/b14_admin_workspaces_pages.test.ts`
