# PR-P0-02C: Media / Imports Admin API Contract

## Problem

`/admin/media` and `/admin/imports` workspaces returned 404 errors because the
frontend `fetchJson` helpers called backend paths directly (e.g.
`/admin/media/integrity-report`) instead of routing via the `/api` reverse-proxy
that both the dev rewrite and production nginx expect.

## Root Cause

Each workspace page defined its own `fetchJson` that called `fetch(path, …)` using
a raw `/admin/*` path.  In production, nginx strips the `/api` prefix and forwards
to the backend, so all admin API calls must originate as `/api/admin/*` from the
Next.js origin.  The `media` and `imports` pages were missing this prefix.

## Fix

The `fetchJson` functions in both workspace pages now prepend `/api`:

```ts
const response = await fetch(`/api${path}`, { ...init, headers, cache: "no-store" });
```

This matches the pattern already established in `admin/seo/page.tsx` and
`admin/dashboard/page.tsx`.

## Frontend → Proxy → Backend Path Mapping

| Frontend call (Next.js origin) | Backend route |
|---|---|
| `GET /api/admin/media/integrity-report` | `GET /admin/media/integrity-report` |
| `GET /api/admin/media` | `GET /admin/media` |
| `POST /api/admin/media/upload` | `POST /admin/media/upload` |
| `GET /api/admin/media/{id}/usage` | `GET /admin/media/{id}/usage` |
| `POST /api/admin/media/{id}/archive` | `POST /admin/media/{id}/archive` |
| `POST /api/admin/media/{id}/restore` | `POST /admin/media/{id}/restore` |
| `POST /api/admin/media/{id}/replace` | `POST /admin/media/{id}/replace` |
| `PUT /api/admin/media/projects/{id}/gallery` | `PUT /admin/media/projects/{id}/gallery` |
| `PUT /api/admin/media/properties/{id}/gallery` | `PUT /admin/media/properties/{id}/gallery` |
| `GET /api/admin/properties/imports` | `GET /admin/properties/imports` |
| `POST /api/admin/properties/import` | `POST /admin/properties/import` |
| `GET /api/admin/dashboard/health-summary` | `GET /admin/dashboard/health-summary` |

## States Supported

Both workspaces render:
- **state-loading**: spinner/message while workspace data is fetching
- **state-empty**: empty list notice when no records are returned
- **state-error**: user-friendly error message (no internal status codes exposed)

## Test Coverage

- `admin-app/__tests__/b14_admin_workspaces_pages.test.ts` – asserts:
  - `fetch(\`/api\${path}\`)` proxy pattern present in both pages
  - all required endpoint path fragments present
  - empty/loading/error states present
- `tests/test_media_integrity.py` – backend endpoint returns 200 with correct shape
