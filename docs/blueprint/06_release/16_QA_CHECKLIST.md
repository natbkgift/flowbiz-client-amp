# 16 -- QA CHECKLIST

> Phase 6: QA & Release Control -- Comprehensive quality assurance checklist before any release.

---

## How to Use

This checklist defines **release invariants**.
In autonomous governance mode, CRITICAL items must be validated by deterministic automation and will block merge/deploy if they fail.

---

## 1. URL Validation (CRITICAL)

- [ ] All public URLs return HTTP 200
- [ ] No 404 errors on indexed pages
- [ ] All 301 redirects resolve in 1 hop (no chains)
- [ ] Trailing slash enforced on all URLs
- [ ] All URLs are lowercase
- [ ] No duplicate URLs (same content, different URL)
- [ ] Locale prefix present on all public pages (`/en/`, `/th/`)
- [ ] Filter/parameter URLs return 200 but are noindex

---

## 2. Canonical Check (CRITICAL)

- [ ] Every indexed page has `<link rel="canonical">` pointing to itself
- [ ] Filter pages canonical to parameterless parent URL
- [ ] Pagination pages canonical to page 1
- [ ] No self-referencing canonical with parameters
- [ ] Canonical URLs are absolute (include domain)
- [ ] Canonical URLs include trailing slash

---

## 3. Hreflang Check (CRITICAL)

- [ ] Every page has `hreflang` tags for all locale variants
- [ ] `x-default` points to English version
- [ ] Hreflang is reciprocal (EN -> TH and TH -> EN)
- [ ] Hreflang URLs are absolute
- [ ] No hreflang pointing to noindex pages

---

## 4. Schema Validation (CRITICAL)

- [ ] Organization schema present on all pages
- [ ] Breadcrumb schema matches visible breadcrumbs
- [ ] RealEstateListing schema on project/property pages
- [ ] Article schema on guide/blog pages
- [ ] No errors in Google Rich Results Test
- [ ] Schema data matches visible page content
- [ ] Price and availability in schema match displayed values

---

## 5. Index / Noindex Check

- [ ] All intended index pages have no `noindex` tag
- [ ] All intended noindex pages have `noindex` meta tag
- [ ] No indexed pages blocked by robots.txt (contradiction)
- [ ] Admin/auth pages are noindex
- [ ] Filter/parameter pages are noindex
- [ ] Pagination > page 1 is noindex

---

## 6. Sitemap Validation

- [ ] `sitemap.xml` is accessible and valid XML
- [ ] All split sitemaps are accessible
- [ ] No noindex URLs in sitemaps
- [ ] No 301/404/410 URLs in sitemaps
- [ ] `<lastmod>` reflects actual content updates
- [ ] Sitemap URL count matches expected page count
- [ ] Sitemap is referenced in `robots.txt`

---

## 7. Content Check

- [ ] Every page has a unique H1
- [ ] No pages have duplicate H1s
- [ ] Meta titles are unique per page (max 60 chars)
- [ ] Meta descriptions are unique per page (150-160 chars)
- [ ] No pages have missing or empty titles
- [ ] All images have ALT text
- [ ] No broken images (all return 200)
- [ ] Content exists in both EN and TH for all pages

---

## 8. Internal Linking Check

- [ ] No broken internal links (all return 200)
- [ ] No orphan pages (every page has at least 1 incoming link)
- [ ] Breadcrumbs render correctly on all pages
- [ ] Footer links are complete and functional
- [ ] Navigation links are correct
- [ ] Project pages link to area and developer
- [ ] Area pages link to projects

---

## 9. Performance / Speed Audit

- [ ] Largest Contentful Paint (LCP) < 2.5s on mobile
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to First Byte (TTFB) < 200ms
- [ ] Total page weight < 1.5MB on initial load
- [ ] Images served in WebP/AVIF format
- [ ] CSS and JS are minified
- [ ] No render-blocking resources in critical path

---

## 10. Mobile Test (CRITICAL)

- [ ] All pages are mobile-responsive (test at 375px, 414px, 768px)
- [ ] Touch targets are minimum 48x48px
- [ ] No horizontal scrolling
- [ ] Sticky CTA displays correctly on mobile
- [ ] Forms are usable on mobile (inputs are tappable, keyboard appropriate)
- [ ] Google Mobile-Friendly Test passes for all page types
- [ ] Text is readable without zooming

---

## 11. Security Check

- [ ] All pages served over HTTPS
- [ ] HSTS header present
- [ ] X-Frame-Options: DENY
- [ ] Content-Security-Policy header present
- [ ] No exposed API keys in client-side code
- [ ] Form submissions are rate-limited
- [ ] No XSS vulnerabilities in user-submitted content
- [ ] Admin pages require authentication

---

## 12. Functional Check

- [ ] Inquiry forms submit successfully and create lead records
- [ ] Thank-you/confirmation displays after form submission
- [ ] Advisor notification triggers on new inquiry
- [ ] Smart Finder returns results
- [ ] Compare tool works with 2+ properties
- [ ] Investment calculator produces correct calculations
- [ ] Language switching works (EN <-> TH)
- [ ] Search/filter returns relevant results

---

## 13. Analytics Check

- [ ] Analytics events fire on page views
- [ ] CTA click events fire correctly
- [ ] Form submission events fire
- [ ] UTM parameters are captured in inquiry records
- [ ] No PII leaking to analytics

---

## Summary

| Category | Items | Priority |
|----------|-------|----------|
| URL Validation | 8 | CRITICAL |
| Canonical | 6 | CRITICAL |
| Hreflang | 5 | CRITICAL |
| Schema | 7 | CRITICAL |
| Index/Noindex | 6 | HIGH |
| Sitemap | 7 | HIGH |
| Content | 8 | HIGH |
| Internal Linking | 7 | HIGH |
| Performance | 8 | MEDIUM |
| Mobile | 7 | CRITICAL |
| Security | 8 | CRITICAL |
| Functional | 8 | HIGH |
| Analytics | 5 | MEDIUM |

**Total: 90 checkpoints**

All CRITICAL categories must pass 100% before release.
