# Phase G — Production Validation Snapshot (2bd1367)

- Date: 2026-02-17
- Domain: https://www.amppattaya.com
- Release tag: v3-phase-g-stable (points to `2bd1367`)
- VPS repo HEAD (short): `2bd13671`
- Alembic current (prod): `0020_v3_media_image_urls (head)`

## Meta

`GET /api/v1/meta`:

```json
{"service":"flowbiz-template-service","environment":"prod","version":"0.1.0+6e1d5b32","build_sha":"2bd13671"}
```

## Smoke results

Timestamp used: `1771319507`

- Pages
  - GET /marketplace -> 200
  - GET /projects -> 200
  - GET /en/marketplace -> 200
  - GET /en/projects -> 200
  - GET /inquiries -> 200
  - GET /analytics -> 200

- API
  - POST /api/v1/inquiries -> 201 (email: smoke+1771319507@example.com)
  - POST /api/v1/inquiries (honeypot) -> 400
  - POST /api/v1/inquiries (invalid) -> 422
  - POST /api/v1/inquiries (rate_limit) -> 429 (hit_at=19)
  - POST /api/v1/sell/submit -> 201 (email: seller+1771319507@example.com)

- Security (unauth)
  - GET /api/admin/inquiries -> 401
  - GET /api/admin/analytics/summary -> 401

## Seller DB row verification

Ran on VPS (inside postgres container):

```sql
select count(*) from seller_submissions where email='seller+1771319507@example.com';
```

Result: `1`

## Lighthouse

Homepage: https://www.amppattaya.com/

- Desktop (JSON saved): docs/v3/baselines/lighthouse_desktop_2bd1367.json
  - performance: 99
  - accessibility: 96
  - best-practices: 100
  - seo: 91

- Mobile (JSON saved): docs/v3/baselines/lighthouse_mobile_2bd1367.json
  - performance: 97
  - accessibility: 96
  - best-practices: 100
  - seo: 91
