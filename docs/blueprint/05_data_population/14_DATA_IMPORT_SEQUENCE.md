# 14 -- DATA IMPORT SEQUENCE

> Phase 5: Data Population Plan -- Defines the order and process for importing real data into the platform.

---

## Prerequisites

Before importing any data, confirm:

- [ ] Database schema (doc 05) is migrated and stable
- [ ] Property type enum (doc 06) is validated
- [ ] Page templates (doc 07) are built and tested with mock data
- [ ] CTA forms (doc 13) submit correctly
- [ ] Image storage/CDN is configured

---

## Import Order

Data must be imported in this exact sequence due to foreign key dependencies.

```
1. Developers     (no FK dependencies)
2. Areas          (no FK dependencies)
3. Projects       (depends on: developers, areas)
4. Units - Buy    (depends on: projects, areas, developers)
5. Units - Rent   (depends on: projects, areas, developers)
6. Guides         (depends on: areas, projects -- for linking)
7. Team           (no FK dependencies)
8. Testimonials   (no FK dependencies)
```

**Never import Units before Projects. Never import Projects before Developers and Areas.**

---

## Step 1: Import Developers

### Source

Spreadsheet or API with developer information.

### Required Fields

| Field | Example |
|-------|---------|
| name | "Heights Holdings" |
| slug | "heights-holdings" |
| website | "https://heightsholdings.com" |
| summary (EN) | "Leading developer..." |
| summary (TH) | "ผู้พัฒนาชั้นนำ..." |
| tier | "premium" |
| logo_url | URL to logo image |
| status | "active" |

### Validation

- [ ] No duplicate slugs
- [ ] All required fields populated
- [ ] Logo images accessible
- [ ] Summary content is in correct language key

### Count Target

Initial batch: 10-20 developers

---

## Step 2: Import Areas

### Required Fields

| Field | Example |
|-------|---------|
| name | "Jomtien" |
| slug | "jomtien" |
| city | "Pattaya" |
| content (EN) | { overview, lifestyle, infrastructure } |
| content (TH) | { overview, lifestyle, infrastructure } |
| map_center | { lat: 12.8833, lng: 100.8667 } |
| hero_image_url | URL to hero image |
| status | "published" |

### Validation

- [ ] All 6 priority areas included
- [ ] Map coordinates are accurate
- [ ] Hero images are high-resolution (min 1920x600)
- [ ] Content is localized (EN + TH)

### Count Target

Initial batch: 6 areas (Jomtien, Pratumnak, Wongamat, Central, Na Jomtien, Bang Saray)

---

## Step 3: Import Projects

### Required Fields

| Field | Example |
|-------|---------|
| name | "The Riviera Jomtien" |
| slug | "the-riviera-jomtien" |
| developer_id | FK to imported developer |
| area_id | FK to imported area |
| property_type | "condo" |
| starting_price | 3500000 |
| summary (EN/TH) | Localized description |
| hero_image_url | URL to project hero |
| images | Array of image URLs |
| status | "published" |

### Validation

- [ ] developer_id matches an existing developer record
- [ ] area_id matches an existing area record
- [ ] property_type is a valid enum value
- [ ] slug is unique
- [ ] At least 1 image provided
- [ ] Summary exists in both EN and TH

### Count Target

Initial batch: 20-50 projects

---

## Step 4: Import Units (Buy)

### Required Fields

| Field | Example |
|-------|---------|
| title | "2BR Condo - The Riviera Jomtien" |
| slug | "riviera-jomtien-2br-2305" |
| type | "new" or "resale" |
| property_type | "condo" |
| project_id | FK to imported project |
| area_id | FK to imported area |
| price | 4500000 |
| currency | "THB" |
| bedrooms | 2 |
| bathrooms | 1 |
| size_sqm | 65 |
| status | "active" |

### Validation

- [ ] project_id matches an existing project
- [ ] price > 0
- [ ] Required fields per property type (doc 06) are populated
- [ ] No duplicate source_id

### Count Target

Initial batch: 100-200 buy units

---

## Step 5: Import Units (Rent)

Same structure as Step 4, with:
- `type` = "rent"
- `price_period` = "month" (required for rentals)
- Typically fewer data points needed (no ownership_notes)

### Count Target

Initial batch: 50-100 rental units

---

## Step 6: Import Guides

### Required Fields

| Field | Example |
|-------|---------|
| slug | "best-condos-jomtien" |
| category | "guide" |
| title (EN/TH) | Localized titles |
| body_md (EN/TH) | Localized markdown content |
| area_id | FK to related area (optional) |
| pillar_id | FK to pillar article (optional) |
| status | "published" |

### Validation

- [ ] Content follows Content Standard (doc 15)
- [ ] Internal links to projects and areas are valid
- [ ] Images have ALT text
- [ ] Pillar-cluster linking is correct

### Count Target

Initial batch: 12 guides (3 per pillar, 4 pillars)

---

## Step 7: Import Team

### Required Fields

| Field | Example |
|-------|---------|
| name | "Somchai Pattaya" |
| role_title | "Senior Property Advisor" |
| bio (EN/TH) | Localized bio |
| photo_url | Professional headshot URL |
| languages | ["th", "en"] |
| specialties | ["condo", "investment"] |
| display_order | 1 |
| status | "active" |

### Count Target

Initial batch: 5-10 team members

---

## Step 8: Import Testimonials

### Required Fields

| Field | Example |
|-------|---------|
| persona | "investor" |
| intent | "buy" |
| quote | "AMP helped me find the perfect investment..." |
| attribution_name | "John D." |
| context | "Condo purchase, Jomtien" |
| status | "published" |

### Count Target

Initial batch: 10-15 testimonials (mix of personas)

---

## Import Process

### For Each Step

1. Prepare data in CSV/JSON format
2. Validate against schema and required fields
3. Run import in staging environment first
4. Verify imported data renders correctly on templates
5. Fix any data issues
6. Run import in production
7. Verify production pages
8. Submit updated sitemap to Google Search Console

### Rollback Plan

If import causes issues:
1. Set status to "inactive" on affected records (not delete)
2. Fix data
3. Re-import corrected records
4. Set status back to "active"

---

## Post-Import Checklist

- [ ] All URLs return 200
- [ ] All pages render without layout breaks
- [ ] Images load correctly
- [ ] Internal links work
- [ ] Schema markup validates
- [ ] Sitemap includes new pages
- [ ] Search Console shows no new errors
