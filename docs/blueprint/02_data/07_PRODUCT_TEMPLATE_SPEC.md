# 07 -- PRODUCT TEMPLATE SPEC

> Phase 2: Data Architecture -- Layout specifications for all database-driven page templates. Must be built before data import.

---

## Template Overview

| Template | URL Pattern | Data Source |
|----------|-------------|-------------|
| Project Page | `/projects/{slug}/` | projects table |
| Property Detail | `/property/{slug}/` | properties table |
| Area Page | `/area-guide/{slug}/` | areas table |
| Developer Page | `/developers/{slug}/` | developers table |

---

## 1. Project Page Template

**URL:** `/{locale}/projects/{project-slug}/`

### Required Blocks

| # | Block | Data Fields | Notes |
|---|-------|-------------|-------|
| 1 | Hero Section | hero_image_url, name, area.name, developer.name, starting_price | Full-width hero image with overlay text |
| 2 | Quick Facts Bar | property_type, unit_count, floors, delivery_date, starting_price | Horizontal strip below hero |
| 3 | Project Summary | summary (localized) | 2-3 paragraph overview |
| 4 | Location | location.lat, location.lng, area.name, address | Map embed + area link |
| 5 | Available Units List | properties[] (filtered by project_id) | Grid/list of units with price, beds, sqm |
| 6 | Developer Info | developer.name, developer.logo_url, developer.summary | Card with link to developer page |
| 7 | Inquiry CTA | (form) | Primary conversion block |

### Optional Blocks

| # | Block | Condition | Notes |
|---|-------|-----------|-------|
| 8 | Image Gallery | images.length > 1 | Lightbox carousel |
| 9 | Amenities | amenities.length > 0 | Icon grid |
| 10 | Investment Snapshot | investment_snapshot != null | ROI, rental yield data |
| 11 | Floor Plans | floor_plans exists in features | Image/PDF viewer |
| 12 | Nearby Projects | Same area_id, different project | Cross-sell carousel |
| 13 | Area Guide Link | area_id is set | Link to area guide page |
| 14 | Testimonials | testimonials related to project | Social proof |

### CTA Placement

- **Primary CTA:** After Available Units List (block 7)
- **Sticky CTA:** Fixed bottom bar on mobile with "Inquire Now" button
- **Secondary CTA:** Below Investment Snapshot (if present)

### SEO Requirements

- H1: Project name
- Title: `{Project Name} | {Property Type} in {Area} | AMP Pattaya`
- Meta description: First 160 chars of summary
- Schema: RealEstateListing + Product
- Breadcrumb: Home > Projects > {Project Name}

---

## 2. Property Detail Template (Unit)

**URL:** `/{locale}/property/{property-slug}/`

### Required Blocks

| # | Block | Data Fields | Notes |
|---|-------|-------------|-------|
| 1 | Image Gallery | images, cover_image_url | Main image + thumbnails |
| 2 | Title & Price | title, price, currency, price_period, type | Price prominently displayed |
| 3 | Key Specs | bedrooms, bathrooms, size_sqm, floor, furnishing | Icon row |
| 4 | Description | description | Full property description |
| 5 | Location | address, area.name | Map + area link |
| 6 | Inquiry CTA | (form) | Primary conversion |

### Optional Blocks

| # | Block | Condition | Notes |
|---|-------|-----------|-------|
| 7 | Project Link | project_id set | "Part of {Project Name}" card |
| 8 | Features List | features jsonb populated | Bullet list of amenities |
| 9 | Ownership Info | ownership_notes set | Foreign quota, legal notes |
| 10 | Fee Information | fee_notes set | Common fees, transfer costs |
| 11 | Similar Properties | Same type+area, different property | Carousel |
| 12 | Calculator Widget | type = new or resale | embedded ROI calculator |

### CTA Placement

- **Primary CTA:** After Description (block 6) -- sticky on mobile
- **Secondary CTA:** Floating sidebar on desktop
- **Micro-CTA:** "Ask about this property" link in title bar

### SEO Requirements

- H1: Property title
- Title: `{Title} | {Beds}BR {Type} {Area} | AMP Pattaya`
- Schema: RealEstateListing with price, availability
- Breadcrumb: Home > {Buy/Rent} > {Property Type} > {Title}

---

## 3. Area Page Template

**URL:** `/{locale}/area-guide/{area-slug}/`

### Required Blocks

| # | Block | Data Fields | Notes |
|---|-------|-------------|-------|
| 1 | Hero Section | hero_image_url, name | Area hero with name overlay |
| 2 | Area Overview | content (localized) | Editorial lifestyle content |
| 3 | Market Statistics | area_statistics.* | Price trends, average values |
| 4 | Featured Projects | projects[] (filtered by area_id, is_featured) | Top project cards |
| 5 | All Projects | projects[] (filtered by area_id) | Complete list |
| 6 | Inquiry CTA | (form) | "Looking in {Area}?" |

### Optional Blocks

| # | Block | Condition | Notes |
|---|-------|-----------|-------|
| 7 | Map | map_center set | Interactive area map |
| 8 | Lifestyle Section | content includes lifestyle data | Restaurants, beaches, etc. |
| 9 | Infrastructure | content includes infrastructure | Transportation, hospitals |
| 10 | Related Areas | Other areas in same city | Cross-link cards |
| 11 | Investment Guide Link | Related guide article exists | Link to pillar content |

### CTA Placement

- **Primary CTA:** After Featured Projects
- **Secondary CTA:** End of page

### SEO Requirements

- H1: `{Area Name} - Pattaya Area Guide`
- Title: `{Area Name} Guide | Property, Lifestyle & Investment | AMP Pattaya`
- Schema: Place + Breadcrumb
- Breadcrumb: Home > Area Guide > {Area Name}
- Internal links: To all projects in this area

---

## 4. Developer Page Template

**URL:** `/{locale}/developers/{developer-slug}/`

### Required Blocks

| # | Block | Data Fields | Notes |
|---|-------|-------------|-------|
| 1 | Developer Header | name, logo_url, tier, website | Logo + name + external link |
| 2 | About | summary (localized) | Developer overview |
| 3 | Projects List | projects[] (filtered by developer_id) | All projects by this developer |
| 4 | Area Presence | Derived from projects.area_id | Map or list of areas |

### Optional Blocks

| # | Block | Condition | Notes |
|---|-------|-----------|-------|
| 5 | Track Record | Data available | Completed projects, years active |
| 6 | Inquiry CTA | Always | "Interested in {Developer} projects?" |

### SEO Requirements

- H1: Developer name
- Title: `{Developer Name} | Projects in Pattaya | AMP Pattaya`
- Schema: Organization
- Breadcrumb: Home > Developers > {Developer Name}
- Internal links: To all projects by this developer

---

## Responsive Breakpoints

All templates follow the existing design system:

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, stacked blocks |
| Tablet | 640--1024px | Two-column where appropriate |
| Desktop | 1024--1440px | Full layout with sidebar |
| Wide | > 1440px | Centered max-width container |

---

## Template Build Checklist

- [ ] Project Page template implemented and tested
- [ ] Property Detail template implemented and tested
- [ ] Area Page template implemented and tested
- [ ] Developer Page template implemented and tested
- [ ] All CTA placements functional (forms submit to inquiry API)
- [ ] Schema markup embedded correctly per template
- [ ] Breadcrumb navigation renders correctly
- [ ] Mobile responsive across all breakpoints
- [ ] Localization switching works (EN <-> TH)
- [ ] Empty/null data states handled gracefully (no broken layouts)
- [ ] Image fallbacks for missing cover images
- [ ] Loading states for data-dependent sections
