# 09 -- INTERNAL LINKING BLUEPRINT

> Phase 3: SEO & Linking Layer -- Defines all internal linking rules and relationships.

---

## Purpose

Internal linking controls:
1. **Crawl flow** -- how search engines discover and prioritize pages
2. **Authority flow** -- how PageRank distributes across the site
3. **User navigation** -- how visitors discover related content

Every link must be intentional. No random or automated link spraying.

---

## Entity Linking Rules

### Project -> Area

Every project page links to its area guide page.

```
/projects/the-riviera-jomtien/
  -> links to -> /area-guide/jomtien/
```

**Implementation:** In the Location block of the project template, the area name is a hyperlink to the area guide.

### Area -> Property Type Landings

Every area guide page links to property type searches filtered by that area.

```
/area-guide/jomtien/
  -> links to -> /buy/condo-pattaya/?area=jomtien
  -> links to -> /buy/villa-pattaya/?area=jomtien
  -> links to -> /rent/condo-pattaya/?area=jomtien
```

**Implementation:** "Browse Properties in {Area}" section with type-filtered links.

### Area -> Projects in Area

Every area guide page lists and links to all projects in that area.

```
/area-guide/jomtien/
  -> links to -> /projects/the-riviera-jomtien/
  -> links to -> /projects/laguna-beach-resort/
  -> links to -> /projects/{other-jomtien-projects}/
```

### Guide Article -> Relevant Projects

Investment and lifestyle guides link to specific projects mentioned in the content.

```
/guides/best-condos-jomtien/
  -> links to -> /projects/the-riviera-jomtien/
  -> links to -> /projects/laguna-beach-resort/
```

**Rule:** Minimum 2, maximum 5 project links per guide article.

### Developer -> All Projects

Developer profile pages list and link to every project by that developer.

```
/developers/heights-holdings/
  -> links to -> /projects/the-riviera-jomtien/
  -> links to -> /projects/the-riviera-wongamat/
```

### Project -> Developer

Every project page links to its developer profile.

```
/projects/the-riviera-jomtien/
  -> links to -> /developers/heights-holdings/
```

### Property -> Project

If a property/unit belongs to a project, it links to the project page.

```
/property/riviera-jomtien-unit-2305/
  -> links to -> /projects/the-riviera-jomtien/
```

### Pillar -> Cluster (bidirectional)

See Content Pillar Map (doc 08) for full rules:
- Pillar pages link to all their cluster articles
- Cluster articles link back to their pillar page
- Cross-pillar links allowed where topically relevant

---

## Navigation Linking

### Primary Navigation (Header)

```
Buy     -> /buy/
Rent    -> /rent/
Sell    -> /sell/
Invest  -> /invest/
Projects -> /projects/
Areas   -> /area-guide/
```

### Footer Links

```
Column 1: Buy
  - Buy Condo -> /buy/condo-pattaya/
  - Buy Villa -> /buy/villa-pattaya/
  - Buy House -> /buy/house-pattaya/
  - Buy Land  -> /buy/land-pattaya/

Column 2: Rent
  - Rent Condo -> /rent/condo-pattaya/
  - Rent Villa -> /rent/villa-pattaya/
  - Rent House -> /rent/house-pattaya/

Column 3: Areas
  - Jomtien    -> /area-guide/jomtien/
  - Pratumnak  -> /area-guide/pratumnak/
  - Wongamat   -> /area-guide/wongamat/
  - Central    -> /area-guide/central/

Column 4: Company
  - About      -> /about/
  - Contact    -> /contact/
  - Marketplace -> /marketplace/
  - Privacy    -> /privacy/
```

### Breadcrumb Links

Every page renders breadcrumbs. Each breadcrumb segment is a link.

Examples:
```
Home > Projects > The Riviera Jomtien
Home > Buy > Condo Pattaya
Home > Area Guide > Jomtien
Home > Developers > Heights Holdings
Home > Guides > Best Condos Jomtien
```

---

## Link Authority Flow

### High-Authority Pages (receive most links)

1. Homepage
2. `/buy/` (intent hub)
3. `/invest/` (intent hub)
4. `/projects/` (hub)
5. `/area-guide/` (hub)

### Link Distribution Strategy

```
Homepage
  |
  +---> Intent Hubs (buy, rent, sell, invest)
  |       |
  |       +---> Property Type Landings
  |       |       |
  |       |       +---> Individual Properties
  |       |
  |       +---> Projects Hub
  |               |
  |               +---> Individual Projects
  |                       |
  |                       +---> Individual Units
  |
  +---> Area Guide Hub
  |       |
  |       +---> Individual Area Guides
  |
  +---> Developers Hub
          |
          +---> Individual Developer Pages
```

---

## Linking Rules

### Do

- Link with descriptive anchor text (not "click here")
- Link to contextually relevant pages
- Ensure every indexed page has at least 3 internal links pointing to it
- Use breadcrumbs on every page
- Link from high-authority pages to important target pages

### Do Not

- Link to noindex pages from navigation or content (except functional links like filters)
- Use the same anchor text for different destination pages
- Create orphan pages (pages with zero internal links)
- Add excessive links (> 100 per page)
- Link to external sites without `rel="noopener"` (and `rel="sponsored"` for paid links)

---

## Linking Audit Checklist

- [ ] All projects link to their area and developer
- [ ] All area guides link to their projects
- [ ] All developer pages link to their projects
- [ ] All guides link to relevant projects and areas
- [ ] Breadcrumbs render correctly on all pages
- [ ] Footer links are complete and correct
- [ ] No orphan pages (verify via crawl)
- [ ] No broken internal links (verify via crawl)
- [ ] Anchor text is descriptive and varied
