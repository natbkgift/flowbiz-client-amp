# B11 Admin CRM Frontend Location (Confirmed)

Date: 2026-02-28

## Canonical UI location
- `admin-app/app/admin/inquiries/page.tsx`

## Ownership
- Owner team: `FlowBiz Frontend (admin-app)`
- Owner person (repo evidence): `01bkgift <01bkgift@users.noreply.github.com>`
- Evidence source: git history under `admin-app` shows `01bkgift` as dominant contributor.

## Auth session flow status
- Admin CRM page uses canonical `POST /api/v1/auth/login` (`email/password`) and stores session token in `sessionStorage`.
- Legacy manual token key (`flowbiz_admin_token`) is migrated/cleared for backward compatibility.

## Scope lock for B11 UI
- Page consumes `/admin/inquiries*` contracts for:
  - list + filters (`status`, `source`, `purpose`, `date_from`, `date_to`, `follow_up_status`)
  - detail + timeline
  - follow-up update
  - contact quick actions
  - CSV export

## WhatsApp normalization default
- Runtime default country code is `+66` (configured as `66`) when no country code is present.
- Region override is supported via env `CRM_WHATSAPP_DEFAULT_COUNTRY_CODE`.
