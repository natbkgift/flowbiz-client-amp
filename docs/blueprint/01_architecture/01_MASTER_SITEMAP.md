# 01 -- MASTER SITEMAP

> Phase 1: Information Architecture -- This document must be finalized before any development begins.

---

## Level 1 Navigation

```
/                           Homepage
/buy                        Buy Landing
/rent                       Rent Landing
/sell                       Sell Landing
/invest                     Investment Landing
/projects                   All Projects
/area-guide                 Area Guide Hub
/marketplace                Marketplace Directory
/smart-finder               AI Smart Finder Tool
/compare                    Property Comparison Tool
/about                      About AMP
/contact                    Contact
```

---

## Level 2 Structure

### Buy Intent

```
/buy
  /buy/condo-pattaya
  /buy/villa-pattaya
  /buy/house-pattaya
  /buy/land-pattaya
  /buy/hotel-pattaya
  /buy/shop-pattaya
  /buy/office-pattaya
```

### Rent Intent

```
/rent
  /rent/condo-pattaya
  /rent/villa-pattaya
  /rent/house-pattaya
```

### Sell Intent

```
/sell
  /sell/valuation              Free Valuation Tool
  /sell/list-property          List Your Property
```

### Investment Intent

```
/invest
  /invest/calculator           ROI Calculator
  /invest/guides               Investment Guides Hub
  /investment                  Investment Landing (segment page)
```

### Projects

```
/projects
  /projects/{project-slug}     Individual Project Page
```

### Area Guide

```
/area-guide
  /area-guide/jomtien
  /area-guide/pratumnak
  /area-guide/wongamat
  /area-guide/central
  /area-guide/na-jomtien
  /area-guide/bang-saray
  /areas/{area-slug}           Area Detail Page (data-driven)
```

### Developers

```
/developers
  /developers/{developer-slug}  Developer Profile Page
```

### Content & Guides

```
/guides
  /guides/{guide-slug}          Individual Guide Article
/blog
  /blog/{post-slug}             Blog Post
```

### Segment Landing Pages (SEO)

```
/european                       European Buyer Landing
/investor                       Investor Landing
/luxury                         Luxury Property Landing
/holiday-home                   Holiday Home Landing
/general                        General Buyer Landing
```

### Tools

```
/smart-finder                   AI Property Matcher
/compare                        Side-by-side Comparison
```

### Support

```
/about
/contact
/privacy
/terms
```

---

## Level 3 Structure (Dynamic)

### Property Detail

```
/property/{property-slug}       Individual Unit/Property Page
```

### Filtered Views (Noindex)

```
/buy/condo-pattaya?bedrooms=2&price_max=5000000
/rent/villa-pattaya?area=jomtien
```

These dynamic filter URLs are **NOT indexed**. They canonical back to their parent landing page.

---

## Intent Structure

| Intent | Entry Points | Conversion Path |
|--------|-------------|-----------------|
| Buy | /buy, /buy/{type}, /projects, /smart-finder | Browse -> Project -> Unit -> Inquiry |
| Rent | /rent, /rent/{type}, /smart-finder | Browse -> Property -> Contact |
| Sell | /sell, /sell/valuation | Landing -> Valuation -> Lead Form |
| Invest | /invest, /investment, /european, /investor | Content -> Calculator -> Inquiry |

---

## Property Type Strategy

Each property type gets dedicated landing pages under both `/buy/` and `/rent/` prefixes.

| Property Type | Buy URL | Rent URL | Priority |
|---------------|---------|----------|----------|
| Condo | /buy/condo-pattaya | /rent/condo-pattaya | HIGH |
| Villa | /buy/villa-pattaya | /rent/villa-pattaya | HIGH |
| House | /buy/house-pattaya | /rent/house-pattaya | MEDIUM |
| Land | /buy/land-pattaya | N/A | MEDIUM |
| Hotel | /buy/hotel-pattaya | N/A | LOW |
| Shop | /buy/shop-pattaya | N/A | LOW |
| Office | /buy/office-pattaya | N/A | LOW |

---

## Area Strategy

Each area gets:
1. An **area guide page** (`/area-guide/{slug}`) -- editorial, lifestyle, infrastructure content
2. An **area data page** (`/areas/{slug}`) -- statistics, listings, market data

| Area | Guide URL | Data URL | Priority |
|------|-----------|----------|----------|
| Jomtien | /area-guide/jomtien | /areas/jomtien | HIGH |
| Pratumnak | /area-guide/pratumnak | /areas/pratumnak | HIGH |
| Wongamat | /area-guide/wongamat | /areas/wongamat | HIGH |
| Central Pattaya | /area-guide/central | /areas/central | HIGH |
| Na Jomtien | /area-guide/na-jomtien | /areas/na-jomtien | MEDIUM |
| Bang Saray | /area-guide/bang-saray | /areas/bang-saray | MEDIUM |

---

## Developer Strategy

Each developer with 2+ projects gets a dedicated profile page.

```
/developers/{developer-slug}
```

The page includes:
- Developer overview and track record
- All projects by this developer
- Area presence map
- Link back to relevant project pages

---

## Localization

All pages above exist under `/{locale}/` prefix:

```
/en/buy/condo-pattaya
/th/buy/condo-pattaya
```

Each locale version has its own canonical URL. Cross-locale `hreflang` tags connect them.

---

## Sitemap Lock Checklist

- [ ] Level 1 navigation confirmed
- [ ] All property type URLs defined
- [ ] All area URLs defined
- [ ] Intent-to-URL mapping reviewed
- [ ] No URL pattern conflicts
- [ ] Localization prefix confirmed
- [ ] Filter URL noindex policy confirmed

**Status: PENDING LOCK**
