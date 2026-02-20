# 06 -- PROPERTY TYPE STANDARD

> Phase 2: Data Architecture -- Enum definitions and required/optional attributes per property type.

---

## Property Type Enum

All property types use a **single enum field** on both `projects` and `properties` tables. Do not create separate tables per type.

```
property_type ENUM:
  - condo
  - villa
  - house
  - land
  - hotel
  - shop
  - office
```

**Database implementation:** `text` column with application-level validation (not PostgreSQL ENUM, for easier evolution).

---

## Attributes by Property Type

### Common Attributes (All Types)

These fields are required or available for every property type:

| Attribute | Field | Required | Notes |
|-----------|-------|----------|-------|
| Title | title | YES | |
| Description | description | NO | |
| Price | price | YES | |
| Currency | currency | YES | Default: THB |
| Address | address | YES | |
| City | city | YES | Default: Pattaya |
| Area | area_id | NO | FK to areas |
| Status | status | YES | active/inactive/archived |
| Cover Image | cover_image_url | NO | |
| Images | images | NO | jsonb array |

---

### condo

| Attribute | Field | Required | Notes |
|-----------|-------|----------|-------|
| Bedrooms | bedrooms | YES | 0 = Studio |
| Bathrooms | bathrooms | YES | |
| Size (sqm) | size_sqm | YES | |
| Floor | floor | NO | |
| Furnishing | furnishing | NO | unfurnished/partial/fully_furnished |
| Unit Type | unit_type | NO | studio/1br/2br/3br/penthouse |
| View | view | NO | sea/city/garden/pool |
| Foreign Quota | ownership_notes | NO | |
| Common Fee | fee_notes | NO | Per sqm/month |
| Building | project_id | NO | FK to projects |

**Optional Attributes (in `features` jsonb):**
- Balcony (boolean)
- Bathtub (boolean)
- Parking (boolean)
- Pool access (boolean)
- Gym access (boolean)
- Security 24/7 (boolean)

---

### villa

| Attribute | Field | Required | Notes |
|-----------|-------|----------|-------|
| Bedrooms | bedrooms | YES | |
| Bathrooms | bathrooms | YES | |
| Size (sqm) | size_sqm | YES | Indoor area |
| Land Size (sqm) | land_size_sqm | YES | Stored in `features` jsonb |
| Furnishing | furnishing | NO | |
| Floors | floors | NO | |
| Private Pool | has_pool | NO | Stored in `features` jsonb |
| Garden | has_garden | NO | Stored in `features` jsonb |

---

### house

| Attribute | Field | Required | Notes |
|-----------|-------|----------|-------|
| Bedrooms | bedrooms | YES | |
| Bathrooms | bathrooms | YES | |
| Size (sqm) | size_sqm | YES | |
| Land Size (sqm) | land_size_sqm | YES | Stored in `features` jsonb |
| Floors | floors | NO | |
| House Type | house_type | NO | single/townhouse/semi-detached |
| Parking Spaces | parking | NO | Stored in `features` jsonb |

---

### land

| Attribute | Field | Required | Notes |
|-----------|-------|----------|-------|
| Land Size (sqm) | size_sqm | YES | |
| Land Size (rai) | land_rai | NO | Stored in `features` jsonb; 1 rai = 1,600 sqm |
| Zoning | zoning | NO | residential/commercial/mixed/agricultural |
| Road Access | road_access | NO | Stored in `features` jsonb |
| Title Deed Type | title_deed | NO | Chanote/Nor Sor 3/etc. |

Note: `bedrooms` and `bathrooms` are NULL for land.

---

### hotel

| Attribute | Field | Required | Notes |
|-----------|-------|----------|-------|
| Rooms | rooms | NO | Stored in `features` jsonb |
| Size (sqm) | size_sqm | YES | Total building area |
| Land Size (sqm) | land_size_sqm | NO | Stored in `features` jsonb |
| Star Rating | star_rating | NO | Stored in `features` jsonb |
| Current Revenue | revenue | NO | Stored in `features` jsonb |
| Occupancy Rate | occupancy | NO | Stored in `features` jsonb |

---

### shop

| Attribute | Field | Required | Notes |
|-----------|-------|----------|-------|
| Size (sqm) | size_sqm | YES | |
| Floors | floors | NO | |
| Frontage (m) | frontage | NO | Stored in `features` jsonb |
| Current Tenant | has_tenant | NO | Stored in `features` jsonb |

---

### office

| Attribute | Field | Required | Notes |
|-----------|-------|----------|-------|
| Size (sqm) | size_sqm | YES | |
| Floor | floor | NO | |
| Parking Spaces | parking | NO | Stored in `features` jsonb |
| Furnished | furnishing | NO | |
| Grade | office_grade | NO | A/B/C |

---

## Transaction Type Enum

```
type ENUM:
  - new       (new development, from developer)
  - resale    (secondary market, from owner)
  - rent      (rental listing)
```

---

## Validation Rules

1. `property_type` must match one of the 7 enum values
2. `type` must match one of the 3 transaction types
3. `price` must be > 0
4. For rentals (`type = rent`), `price_period` is required
5. For condos/villas/houses, `bedrooms` and `bathrooms` are required
6. For land, `bedrooms` and `bathrooms` must be NULL
7. `slug` must be unique and follow slug generation rules (doc 02)
8. `features` jsonb schema varies by `property_type` but is always optional

---

## Search Filter Mapping

| Filter | Applies To | Field |
|--------|-----------|-------|
| Property Type | All | property_type |
| Transaction | All | type |
| Price Range | All | price |
| Bedrooms | condo, villa, house | bedrooms |
| Bathrooms | condo, villa, house | bathrooms |
| Size Range | All | size_sqm |
| Area | All | area_id |
| Furnishing | condo, villa, house, office | furnishing |
