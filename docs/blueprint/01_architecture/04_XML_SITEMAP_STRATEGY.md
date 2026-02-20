# 04 -- XML SITEMAP STRATEGY

> Phase 1: Information Architecture -- Defines sitemap structure, split logic, and update rules.

---

## Current State

The existing sitemap (`admin-app/app/sitemap.ts`) generates a flat list of 44 routes across 2 locales. This works for the current page count but will not scale as property and content pages grow.

---

## Target Sitemap Architecture

### Sitemap Index

The root `sitemap.xml` is a **sitemap index** that references split sitemaps:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://amppattaya.com/sitemap-pages.xml</loc>
    <lastmod>2025-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://amppattaya.com/sitemap-projects.xml</loc>
    <lastmod>2025-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://amppattaya.com/sitemap-properties.xml</loc>
    <lastmod>2025-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://amppattaya.com/sitemap-areas.xml</loc>
    <lastmod>2025-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://amppattaya.com/sitemap-developers.xml</loc>
    <lastmod>2025-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://amppattaya.com/sitemap-guides.xml</loc>
    <lastmod>2025-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://amppattaya.com/sitemap-blog.xml</loc>
    <lastmod>2025-01-01</lastmod>
  </sitemap>
</sitemapindex>
```

---

## Split Sitemap Definitions

### sitemap-pages.xml

Static and semi-static pages (landing pages, tools, about, contact, etc.)

| Content | Example URLs |
|---------|-------------|
| Homepage | `/en/`, `/th/` |
| Intent landings | `/en/buy/`, `/en/rent/`, `/en/sell/`, `/en/invest/` |
| Property type landings | `/en/buy/condo-pattaya/`, `/en/rent/villa-pattaya/` |
| Segment landings | `/en/european/`, `/en/investor/`, `/en/luxury/` |
| Tools | `/en/smart-finder/`, `/en/compare/` |
| Legal | `/en/privacy/`, `/en/terms/` |
| About/Contact | `/en/about/`, `/en/contact/` |

**Estimated count:** ~60 URLs (30 pages x 2 locales)
**Change frequency:** weekly
**Priority:** 0.7--1.0

### sitemap-projects.xml

All published project pages.

**Pattern:** `/{locale}/projects/{project-slug}/`
**Estimated count:** Grows with projects (initially ~50--200 URLs)
**Change frequency:** weekly
**Priority:** 0.8

### sitemap-properties.xml

All active property/unit detail pages.

**Pattern:** `/{locale}/property/{property-slug}/`
**Estimated count:** Grows with inventory (potentially 1,000+ URLs)
**Change frequency:** daily
**Priority:** 0.7

### sitemap-areas.xml

Area guide and area data pages.

**Pattern:** `/{locale}/area-guide/{slug}/`, `/{locale}/areas/{slug}/`
**Estimated count:** ~24 URLs (12 area pages x 2 locales)
**Change frequency:** monthly
**Priority:** 0.7

### sitemap-developers.xml

Developer profile pages.

**Pattern:** `/{locale}/developers/{slug}/`
**Estimated count:** ~20--40 URLs
**Change frequency:** monthly
**Priority:** 0.6

### sitemap-guides.xml

Investment guides and educational content.

**Pattern:** `/{locale}/guides/{slug}/`
**Estimated count:** Grows with content
**Change frequency:** monthly
**Priority:** 0.6

### sitemap-blog.xml

Blog posts.

**Pattern:** `/{locale}/blog/{slug}/`
**Estimated count:** Grows with content
**Change frequency:** weekly
**Priority:** 0.5

---

## Rules

### Max URLs per File

- Maximum **5,000 URLs** per sitemap file
- If a sitemap exceeds 5,000, split into numbered files: `sitemap-properties-1.xml`, `sitemap-properties-2.xml`

### Priority Assignment

| Page Type | Priority |
|-----------|----------|
| Homepage | 1.0 |
| Intent Landings (buy/rent/sell/invest) | 0.9 |
| Property Type Landings | 0.8 |
| Project Detail | 0.8 |
| Area Guide | 0.7 |
| Property Detail | 0.7 |
| Segment Landings | 0.7 |
| Developer Profile | 0.6 |
| Guide Article | 0.6 |
| Blog Post | 0.5 |
| About/Contact/Legal | 0.5 |

### Change Frequency

| Content Type | Frequency |
|-------------|-----------|
| Homepage | daily |
| Property listings | daily |
| Project pages | weekly |
| Intent/type landings | weekly |
| Area guides | monthly |
| Developer profiles | monthly |
| Guides/Blog | monthly |
| Legal pages | yearly |

### Last Modified

`<lastmod>` must reflect actual content changes, not the sitemap generation timestamp.

- For database-driven pages: use the record's `updated_at` field
- For static pages: use the git commit timestamp of the page file

---

## Exclusion Rules

Never include in any sitemap:

- URLs with query parameters
- Noindex pages (filter, pagination, admin, auth)
- Draft/unpublished content
- API endpoints
- Static asset paths (`/_next/`, `/public/`)
- Redirect source URLs

---

## Implementation Notes

### Next.js Approach

Use Next.js `app/sitemap.ts` with the sitemap index pattern:

```typescript
// app/sitemap.ts -> returns sitemap index
// app/sitemap-pages/route.ts -> static pages sitemap
// app/sitemap-projects/route.ts -> fetches from DB
// app/sitemap-properties/route.ts -> fetches from DB
```

Each dynamic sitemap route queries the database for published records and generates the XML.

### robots.txt Reference

```
Sitemap: https://amppattaya.com/sitemap.xml
```

---

## Validation Checklist

- [ ] Sitemap index is accessible at `/sitemap.xml`
- [ ] All split sitemaps are accessible and valid XML
- [ ] No sitemap exceeds 5,000 URLs
- [ ] No noindex pages appear in any sitemap
- [ ] All URLs in sitemaps return 200 status
- [ ] `lastmod` reflects actual content update dates
- [ ] Sitemap is registered in Google Search Console
- [ ] Sitemap is referenced in `robots.txt`
