# DASH-P1-PR2: Admin Dashboard Surface Styles and Tokens

## Scope

- Admin shell visual foundation under `/admin/*`
- Dashboard cards, buttons, status chips, tables, and warning surfaces

## What Changed

- Added admin-scoped surface tokens under `.admin-shell`:
  - card/shell backgrounds
  - border strengths
  - shadow tiers
  - accent colors
  - status-chip colors
- Refined admin shell chrome:
  - sidebar background and active nav treatment
  - topbar/mobile nav background and border rhythm
  - locale control styling
- Normalized admin content surfaces under `.admin-shell-content`:
  - card radius and card background
  - button treatment for primary and secondary actions
  - helper/error surface consistency
- Upgraded dashboard-specific primitives:
  - KPI card accent rail
  - status chips
  - table wrapper and hover states
  - warning list rows

## Intended Runtime Behavior

- Admin pages keep the existing structure, but feel more deliberate and consistent.
- Dashboard cards, buttons, and tables now share one visual language.
- Mobile layout keeps the same functional behavior while using the same token set.
- Public-site cards and buttons are unchanged because the overrides stay under admin scope.

## Visual Verification Notes

- Desktop:
  - sidebar and topbar should feel like one system instead of separate defaults
  - dashboard cards should read as elevated surfaces with clearer hierarchy
- Mobile:
  - quick-nav pills and cards should keep the same tone as desktop
  - dashboard grid should collapse cleanly to one column

## Regression Guards

- `admin-app/__tests__/admin_typography_scale.test.ts`
- `admin-app/__tests__/admin_dashboard_surface_styles.test.ts`
- `admin-app/__tests__/b14_admin_dashboard_page.test.ts`
