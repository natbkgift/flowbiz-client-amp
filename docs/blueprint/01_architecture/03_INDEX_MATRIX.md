# 03 -- INDEX MATRIX

> Phase 1: Information Architecture -- Defines which pages are indexed by search engines.

---

## Rules

1. Only pages with unique, valuable content get indexed
2. Filter/parameter pages are always noindex
3. Admin and auth pages are always noindex
4. Pagination pages beyond page 1 are noindex (canonical to page 1)
5. Duplicate locale versions use `hreflang`, both are indexed

---

## Index Decision Matrix

| Page Type | Index? | Canonical | Notes |
|-----------|--------|-----------|-------|
| **Homepage** | YES | Self | Priority 1.0 |
| **Buy Landing** (`/buy/`) | YES | Self | Intent hub page |
| **Buy + Type** (`/buy/condo-pattaya/`) | YES | Self | Primary SEO target |
| **Rent Landing** (`/rent/`) | YES | Self | Intent hub page |
| **Rent + Type** (`/rent/villa-pattaya/`) | YES | Self | Primary SEO target |
| **Sell Landing** (`/sell/`) | YES | Self | |
| **Sell Valuation** (`/sell/valuation/`) | YES | Self | Lead capture tool |
| **Invest Landing** (`/invest/`) | YES | Self | |
| **Projects Hub** (`/projects/`) | YES | Self | |
| **Project Detail** (`/projects/{slug}/`) | YES | Self | High-value page |
| **Property Detail** (`/property/{slug}/`) | YES | Self | Unique content per unit |
| **Area Guide Hub** (`/area-guide/`) | YES | Self | |
| **Area Guide Detail** (`/area-guide/{slug}/`) | YES | Self | Pillar content |
| **Area Data Page** (`/areas/{slug}/`) | YES | Self | Data-driven content |
| **Developers Hub** (`/developers/`) | YES | Self | |
| **Developer Detail** (`/developers/{slug}/`) | YES | Self | |
| **Guides Hub** (`/guides/`) | YES | Self | |
| **Guide Article** (`/guides/{slug}/`) | YES | Self | |
| **Blog Hub** (`/blog/`) | YES | Self | |
| **Blog Post** (`/blog/{slug}/`) | YES | Self | |
| **Smart Finder** (`/smart-finder/`) | YES | Self | Tool page with unique value |
| **Compare Tool** (`/compare/`) | YES | Self | |
| **Marketplace** (`/marketplace/`) | YES | Self | |
| **Investment Landing** (`/investment/`) | YES | Self | Segment page |
| **European Landing** (`/european/`) | YES | Self | Segment page |
| **Luxury Landing** (`/luxury/`) | YES | Self | Segment page |
| **Holiday Home** (`/holiday-home/`) | YES | Self | Segment page |
| **Investor Landing** (`/investor/`) | YES | Self | Segment page |
| **About** (`/about/`) | YES | Self | |
| **Contact** (`/contact/`) | YES | Self | |
| **Privacy** (`/privacy/`) | YES | Self | |
| **Terms** (`/terms/`) | YES | Self | |

---

## Noindex Pages

| Page Type | Index? | Reason |
|-----------|--------|--------|
| **Filter w/ Parameters** (`/buy/condo-pattaya/?bedrooms=2`) | NO | Duplicate/thin content |
| **Compare w/ Selection** (`/compare/?ids=a,b`) | NO | Dynamic, no unique content |
| **Pagination Page 2+** (`/projects/?page=2`) | NO | Canonical to page 1 |
| **Search Results** (`/search/?q=...`) | NO | Dynamic query results |
| **Login** (`/login/`) | NO | Auth page |
| **Admin Pages** (`/leads/`, `/inquiries/`, `/analytics/`) | NO | Admin only |
| **API Routes** (`/api/*`) | NO | Not content |
| **Preview/Draft Pages** | NO | Unpublished content |
| **Thank You / Confirmation** | NO | Post-conversion, no SEO value |

---

## Canonical Rules

### Standard Pages
Every indexed page sets `<link rel="canonical" href="...">` to itself (full absolute URL with trailing slash).

### Locale Variants
```html
<!-- On /en/buy/condo-pattaya/ -->
<link rel="canonical" href="https://amppattaya.com/en/buy/condo-pattaya/" />
<link rel="alternate" hreflang="en" href="https://amppattaya.com/en/buy/condo-pattaya/" />
<link rel="alternate" hreflang="th" href="https://amppattaya.com/th/buy/condo-pattaya/" />
<link rel="alternate" hreflang="x-default" href="https://amppattaya.com/en/buy/condo-pattaya/" />
```

### Filter Pages
```html
<!-- On /en/buy/condo-pattaya/?bedrooms=2 -->
<link rel="canonical" href="https://amppattaya.com/en/buy/condo-pattaya/" />
<meta name="robots" content="noindex, follow" />
```

### Pagination
```html
<!-- On /en/projects/?page=3 -->
<link rel="canonical" href="https://amppattaya.com/en/projects/" />
<meta name="robots" content="noindex, follow" />
```

---

## Implementation Checklist

- [ ] All indexed pages have self-referencing canonical
- [ ] All locale variants have correct hreflang tags
- [ ] Filter pages set noindex + canonical to parent
- [ ] Pagination pages set noindex + canonical to page 1
- [ ] Admin pages have noindex meta tag
- [ ] robots.txt disallows /api/, /login, /leads, /inquiries, /analytics
- [ ] No orphan pages (every indexed page is linked from at least one other indexed page)
