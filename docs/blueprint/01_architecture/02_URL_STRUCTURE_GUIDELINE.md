# 02 -- URL STRUCTURE GUIDELINE

> Phase 1: Information Architecture -- Defines URL patterns, conventions, and conflict avoidance rules.

---

## Core Rules

### 1. Trailing Slash

All URLs **must** end with a trailing slash.

```
CORRECT:  /buy/condo-pattaya/
WRONG:    /buy/condo-pattaya
```

Next.js `trailingSlash: true` is enforced in `next.config.js`.

### 2. Lowercase Only

All URL segments must be **lowercase**. No camelCase, no UPPERCASE.

```
CORRECT:  /projects/the-riviera-jomtien/
WRONG:    /projects/The-Riviera-Jomtien/
```

### 3. Hyphens for Word Separation

Use hyphens (`-`), never underscores (`_`) or spaces.

```
CORRECT:  /buy/condo-pattaya/
WRONG:    /buy/condo_pattaya/
WRONG:    /buy/condo%20pattaya/
```

### 4. No File Extensions

Never include `.html`, `.php`, or other extensions in URLs.

```
CORRECT:  /about/
WRONG:    /about.html
```

### 5. Locale Prefix

All public pages are prefixed with `/{locale}/`:

```
/en/buy/condo-pattaya/
/th/buy/condo-pattaya/
```

Supported locales: `en`, `th`

---

## URL Pattern Rules

### Intent-based Pages

```
/{locale}/{intent}/{property-type}-{city}/
```

Examples:
```
/en/buy/condo-pattaya/
/en/rent/villa-pattaya/
/th/buy/land-pattaya/
```

### Project Pages

```
/{locale}/projects/{project-slug}/
```

Slug generation: lowercase project name, spaces replaced by hyphens, special characters removed.

Example: "The Riviera Jomtien" -> `the-riviera-jomtien`

### Property/Unit Pages

```
/{locale}/property/{property-slug}/
```

### Area Pages

```
/{locale}/area-guide/{area-slug}/      (editorial guide)
/{locale}/areas/{area-slug}/           (data/listings view)
```

### Developer Pages

```
/{locale}/developers/{developer-slug}/
```

### Content Pages

```
/{locale}/guides/{guide-slug}/
/{locale}/blog/{post-slug}/
```

---

## Parameter Usage Rules

### Allowed Parameters

Parameters are used **only** for filtering and pagination on listing pages:

```
/en/buy/condo-pattaya/?bedrooms=2&price_max=5000000&page=2
```

### Parameter Conventions

| Parameter | Type | Example |
|-----------|------|---------|
| bedrooms | integer | `?bedrooms=2` |
| bathrooms | integer | `?bathrooms=1` |
| price_min | integer | `?price_min=1000000` |
| price_max | integer | `?price_max=5000000` |
| area | string (slug) | `?area=jomtien` |
| sort | string | `?sort=price_asc` |
| page | integer | `?page=2` |

### Parameter Rules

1. Filter pages with parameters are **noindex**
2. Canonical tag points to the **parameterless parent URL**
3. Parameters must not change the page content structure, only filter results
4. Maximum 5 parameters per URL
5. Unknown parameters are silently ignored (never 404)

---

## Slug Generation Logic

### Project Slugs

```
Input:  "The Riviera Jomtien Beach Resort"
Output: "the-riviera-jomtien-beach-resort"
```

Rules:
1. Convert to lowercase
2. Replace spaces with hyphens
3. Remove special characters except hyphens
4. Collapse multiple hyphens to single
5. Trim leading/trailing hyphens
6. Max length: 80 characters
7. Must be unique across all projects

### Area Slugs

Use short, recognizable names:

| Area Name | Slug |
|-----------|------|
| Jomtien Beach | jomtien |
| Pratumnak Hill | pratumnak |
| Wongamat Beach | wongamat |
| Central Pattaya | central |
| Na Jomtien | na-jomtien |
| Bang Saray | bang-saray |

### Developer Slugs

```
Input:  "Heights Holdings Co., Ltd."
Output: "heights-holdings"
```

Rules: Same as project slugs, but strip legal suffixes (Co., Ltd., Corp., Inc.)

---

## Conflict Avoidance

### Reserved Paths

These paths are reserved and must never be used as slugs:

```
/api/          (API routes)
/login/        (Auth)
/admin/        (Admin panel)
/leads/        (Admin)
/inquiries/    (Admin)
/analytics/    (Admin)
/public/       (Static assets)
/_next/        (Next.js internals)
```

### No Overlapping Patterns

- `/area-guide/{slug}` and `/areas/{slug}` are intentionally separate
- `/buy/{type}` never overlaps with `/projects/{slug}` because project slugs are never a property type name
- Segment landing pages (`/european`, `/investor`, etc.) use single-segment paths that don't conflict with intent paths

---

## Redirect Rules

| Scenario | Rule |
|----------|------|
| Non-trailing-slash | 301 -> trailing slash version |
| Uppercase in URL | 301 -> lowercase version |
| Old/renamed slug | 301 -> new slug |
| Deleted page | 410 Gone (not 404) |
| HTTP | 301 -> HTTPS |
