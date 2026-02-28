# A2 Release-ready Handoff Pack

Date: 2026-02-28
Status: Ready for final editorial/legal/admin pass

## Working Status

- Engineering status: complete enough for runtime use
- Admin status: editable and publishable through existing admin/seed flows
- Content status: partially populated from approved company-owned source
- Closure status: not fully closed until external sign-off items are cleared

This is the single handoff pack to use for the remaining A2 completion work.

## What Is Already Done

1. Real Home runtime exists on `/`, `/en`, `/th`
2. Required Home sections render with published-content-first logic
3. Public destination routes exist for:
   - `/projects`
   - `/areas`
   - `/insights`
   - `/about`
   - `/contact`
   - `/privacy`
   - `/terms`
   - `/cookies`
   - `/investment/methodology`
4. Runtime media policy is local-only
5. Browser tracking works against `/api/v1/events`
6. Consultation form works with legacy and additive CRM payloads
7. Admin publish flow exists for:
   - `CompanyInfo`
   - `TeamMember`
   - `Testimonial`
8. Seed flow exists for:
   - `CompanyInfo`
   - `TeamMember`
   - `Testimonial`
   - `Article`
9. Seed/media policy blocks external image URLs for:
   - `TeamMember.photo_url`
   - `Article.hero_image_url`
10. Baseline import set can be synchronized for managed entities with:
   - `--sync company_info team_members testimonials`

## Approved Source Policy

- Approved company-owned editorial source: `https://www.assetmp.net/`
- Allowed use:
  - migrate company-owned editorial copy into repo-backed models
- Not allowed:
  - runtime hotlinking of `assetmp.net` media
- If media from that source is needed:
  - mirror into internal media storage first
  - use only internal paths at runtime

## Admin-editable Content Map

| Public Surface | Internal Model | Required Record |
|---|---|---|
| About page | `CompanyInfo` | `slug=about` |
| Process / trust detail | `CompanyInfo` | `slug=how-we-work` |
| Contact page | `CompanyInfo` | `slug=contact` |
| Privacy page | `CompanyInfo` | `slug=privacy` |
| Terms page | `CompanyInfo` | `slug=terms` |
| Cookies page | `CompanyInfo` | `slug=cookies` |
| Investment methodology | `CompanyInfo` | `slug=investment-methodology` |
| Team section | `TeamMember` | `status=active` |
| Reviews section | `Testimonial` | `status=published` |
| Insights page | `Article` | `status=published`, category `guide`/`blog` |

## Remaining Owner Actions

### Content / Legal

1. Replace reference-style legal content with final legal-approved body
2. Publish approved customer testimonials; default import leaves this empty on purpose until real reviews exist
3. Replace seeded name-and-role team profiles with final localized bios and approved local photos
4. Review and finalize EN/TH about/contact copy
5. Review and finalize process/trust copy
6. Publish additional articles so Insights is not dependent on a minimal seed set

### Infra / DevOps

1. Verify `.webp` edge headers in deployed environment
2. Verify `.avif` edge headers in deployed environment
3. Confirm CDN/proxy does not rewrite content-type incorrectly

### CRM / Integrations

1. Validate downstream consumers against additive inquiry fields:
   - `budget_band`
   - `timeline`
   - `persona`
   - `tags`

## Production Verification Commands

### Media headers

Manual:

```powershell
curl -I https://<your-domain>/media/<sample>.webp
curl -I https://<your-domain>/media/<sample>.avif
```

Scripted:

```powershell
D:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe ops/verify_production_media_headers.py --base-url https://<your-domain> --webp-path /media/<sample>.webp --avif-path /media/<sample>.avif --strict
```

Expected:

- success status
- `Content-Type: image/webp` for `.webp`
- `Content-Type: image/avif` for `.avif`
- no fallback to `application/octet-stream`

### Runtime smoke

```powershell
curl -I https://<your-domain>/en
curl -I https://<your-domain>/th
curl -I https://<your-domain>/en/about
curl -I https://<your-domain>/en/insights
```

### CRM compatibility

Verify at least one consumer path with:

- legacy payload
- additive payload

## Exit Rule

A2 may be marked `closed` only when:

1. all owner actions above are complete
2. production media header checks pass
3. downstream CRM verification is confirmed
4. final editorial/legal/admin pass is complete

Until then, the correct status is:

`A2 is production-ready, admin-editable, and pending final editorial/legal/infra/CRM sign-off.`
