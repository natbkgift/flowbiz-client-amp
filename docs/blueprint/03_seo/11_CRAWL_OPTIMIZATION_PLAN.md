# 11 -- CRAWL OPTIMIZATION PLAN

> Phase 3: SEO & Linking Layer -- Controls how search engines crawl the site to maximize budget efficiency.

---

## Crawl Budget Concept

Search engines allocate a limited crawl budget per site. Wasting it on noindex, duplicate, or low-value pages starves important pages of crawl attention.

**Goal:** Ensure crawlers spend their budget on high-value, indexable pages only.

---

## robots.txt Rules

Current production `robots.txt` (from `admin-app/app/robots.ts`):

```
User-agent: *
Allow: /

Disallow: /api/
Disallow: /login
Disallow: /leads
Disallow: /inquiries
Disallow: /analytics
Disallow: /public

Sitemap: https://amppattaya.com/sitemap.xml
```

### Additions Required

```
# Block filter/parameter URLs from crawling
Disallow: /*?bedrooms=
Disallow: /*?bathrooms=
Disallow: /*?price_min=
Disallow: /*?price_max=
Disallow: /*?sort=
Disallow: /*?page=

# Block internal tool pages
Disallow: /_next/
Disallow: /404
Disallow: /500

# Block preview/draft
Disallow: /preview/
Disallow: /draft/
```

---

## Noindex Policy

Pages that must have `<meta name="robots" content="noindex, follow">`:

| Page Type | Reason |
|-----------|--------|
| Filter pages with parameters | Thin/duplicate content |
| Pagination beyond page 1 | Duplicate content |
| Search results | Dynamic, no stable content |
| Admin pages | Not public content |
| Auth pages (login) | Not public content |
| Preview/draft pages | Unpublished |
| Thank-you/confirmation pages | Post-conversion |
| Compare with specific selections | Dynamic, no stable content |

### Implementation

```tsx
// In Next.js metadata
export const metadata = {
  robots: {
    index: false,
    follow: true,
  },
};
```

---

## Parameter Blocking Strategy

### URL Parameters to Block

| Parameter | Action | Reason |
|-----------|--------|--------|
| bedrooms | noindex + robots block | Filter creates thin duplicate |
| bathrooms | noindex + robots block | Filter creates thin duplicate |
| price_min | noindex + robots block | Filter creates thin duplicate |
| price_max | noindex + robots block | Filter creates thin duplicate |
| sort | noindex + robots block | Same content, different order |
| page | noindex (page > 1) | Pagination duplicate |
| utm_source | canonical ignores | Tracking only |
| utm_medium | canonical ignores | Tracking only |
| utm_campaign | canonical ignores | Tracking only |
| utm_content | canonical ignores | Tracking only |
| ref | canonical ignores | Referral tracking only |

### Google Search Console Configuration

In GSC URL Parameters tool, mark all filter parameters as "No URLs" or "Let Google decide representative URL."

---

## Pagination Logic

### Listing Pages (Projects, Properties)

- Page 1: **indexed**, canonical to self
- Page 2+: **noindex**, canonical to page 1
- Use `rel="next"` / `rel="prev"` links (even though Google says they're hints, they help other engines)

```html
<!-- Page 1 -->
<link rel="canonical" href="https://amppattaya.com/en/projects/" />
<link rel="next" href="https://amppattaya.com/en/projects/?page=2" />

<!-- Page 2 -->
<meta name="robots" content="noindex, follow" />
<link rel="canonical" href="https://amppattaya.com/en/projects/" />
<link rel="prev" href="https://amppattaya.com/en/projects/" />
<link rel="next" href="https://amppattaya.com/en/projects/?page=3" />
```

### Load More / Infinite Scroll

If using load-more instead of pagination:
- Server-rendered initial page is indexed
- JavaScript-loaded additional items are not separate URLs
- Ensure crawlers see at least the first 20 items in server-rendered HTML

---

## Clean Internal Linking

### Link Hygiene Rules

1. **No links to noindex pages from indexed content** (except functional navigation)
2. **No redirect chains** -- all internal links point to final destination URLs
3. **No broken links** -- run automated link checks weekly
4. **No excessive links** -- max 100 unique internal links per page
5. **No links with session or tracking parameters** -- always link to clean URLs

### Redirect Chain Prevention

When a URL changes:
1. Update the database slug
2. Add 301 redirect from old URL to new URL
3. Update all internal links to point to the new URL directly (not through the redirect)

---

## Crawl Efficiency Measures

### 1. Server Response Time

- Target: < 200ms TTFB for all pages
- Use CDN (Cloudflare/Vercel) for static assets
- Database query optimization for dynamic pages

### 2. HTTP Status Codes

| Status | Usage |
|--------|-------|
| 200 | All valid pages |
| 301 | Permanent redirects (old slugs) |
| 404 | Truly nonexistent pages |
| 410 | Permanently removed pages (deleted projects/properties) |
| 500 | Never intentional -- alert on occurrence |

### 3. XML Sitemap Accuracy

- Sitemap only contains 200-status, indexed pages
- Remove 301, 404, 410, noindex URLs from sitemap
- Update `<lastmod>` only when content actually changes

### 4. Hreflang Implementation

- Every page declares all locale variants
- Include `x-default` pointing to English version
- Validate hreflang reciprocity (if EN points to TH, TH must point back to EN)

---

## Monitoring

### Weekly Checks

- [ ] Google Search Console Coverage report (errors, warnings, excluded)
- [ ] Crawl stats (pages crawled per day, average response time)
- [ ] Sitemap status (submitted vs indexed)

### Monthly Checks

- [ ] Full site crawl (Screaming Frog or similar)
- [ ] Broken link report
- [ ] Redirect chain audit
- [ ] Orphan page detection
- [ ] Index bloat check (indexed pages vs expected)

---

## Audit Checklist

- [ ] robots.txt blocks all parameter URLs
- [ ] robots.txt blocks admin/auth/API routes
- [ ] All noindex pages have correct meta tag
- [ ] No noindex pages in sitemap
- [ ] Pagination uses correct canonical + noindex logic
- [ ] No redirect chains (max 1 hop)
- [ ] Hreflang tags are reciprocal and complete
- [ ] TTFB < 200ms for top 20 pages
- [ ] GSC Coverage shows no unexpected errors
