# PR-P2-02: Improve Auth Form Semantics and Accessibility

## Scope

- Login forms in admin/auth flows:
  - `/login`
  - `/admin/dashboard`
  - `/admin/domain`
  - `/admin/home-composer`
  - `/admin/imports`
  - `/admin/inquiries`
  - `/admin/layout`
  - `/admin/media`
  - `/admin/seo`

## What Changed

- Standardized login form semantics across all target pages:
  - login forms use semantic `<form ... method="post" onSubmit=...>`
  - email input includes `name="email"`, `type="email"`, `autoComplete="username"`, `required`
  - password input includes `name="password"`, `type="password"`, `autoComplete="current-password"`, `required`
  - submit buttons explicitly set `type="submit"`
- Kept existing auth business logic unchanged.

## Intended Runtime Behavior

- Enter key submits login form consistently.
- Browser/password-manager autofill can map username/password fields correctly.
- Label/input associations remain explicit via `htmlFor` and unique `id`.
- Keyboard navigation remains predictable and complete.

## Regression Guards

- `admin-app/__tests__/admin_auth_form_semantics.test.ts`
- `admin-app/__tests__/b14_admin_workspaces_pages.test.ts` (login form contract assertions)
