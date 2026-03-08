# PR-P2-01: Tune Admin Typography Scale and Hierarchy

## Scope

- Admin shell content (`/admin/*`) typography and spacing rhythm

## What Changed

- Added admin-scoped typography tokens under `.admin-shell-content`:
  - `--admin-type-h1/h2/h3`
  - `--admin-type-body`
  - `--admin-type-label`
  - `--admin-type-helper`
  - `--admin-stack-gap`, `--admin-card-padding`
- Overrode heading styles in admin content to use tooling-friendly scale and sans-serif hierarchy.
- Standardized text scale for body, table cells, form controls, labels, helper/error/empty/loading states.
- Tightened spacing rhythm inside admin content stack/cards to match smaller typography.

## Intended Runtime Behavior

- Page title (`h1`) remains clearly dominant without oversized marketing-scale typography.
- Section titles (`h2/h3`) and field labels have consistent hierarchy.
- Readability stays stable on mobile and desktop breakpoints due `clamp()` token usage.
- Scope is limited to `.admin-shell-content`; public site typography is unchanged.

## Regression Guards

- `admin-app/__tests__/admin_typography_scale.test.ts`
  - verifies admin typography tokens and scoped hierarchy selectors
