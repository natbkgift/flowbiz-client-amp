# AMP MVP Blueprint v0.2 — amppattaya.com

> **Consolidated Blueprint**: Backend + Frontend + Mobile + Theme  
> **Last Updated**: 2026-01-27  
> **Status**: Draft for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Project Structure](#3-project-structure)
4. [Data Contracts](#4-data-contracts)
5. [Database Schema](#5-database-schema)
6. [API Surface](#6-api-surface)
7. [Integrations](#7-integrations)
8. [Frontend & Generator](#8-frontend--generator)
9. [Mobile Responsive](#9-mobile-responsive)
10. [Brand & Theme](#10-brand--theme)
11. [Security & Compliance](#11-security--compliance)
12. [Observability](#12-observability)
13. [Implementation Plan](#13-implementation-plan)
14. [Acceptance Criteria](#14-acceptance-criteria)

---

## 1. Executive Summary

### 1.1 Product

**amppattaya.com** — เว็บไซต์ประกาศอสังหาริมทรัพย์พัทยา 2 ภาษา (TH/EN)

### 1.2 MVP Goals (P0)

| Goal | Metric |
|------|--------|
| Speed-to-Lead | Lead → Team notification < 5 seconds |
| SEO Indexable | 100% HTML content (no JS render) |
| Mobile Conversion | LINE/Call accessible in 1 tap |
| Data Quality | QA report for unpublishable properties |

### 1.3 Non-Goals (P0)

- ❌ Auth/Member portal
- ❌ Post-ad self-serve flow
- ❌ Payment/Boost system
- ❌ Chat-in-site
- ❌ Map polygon search
- ❌ Image CDN/proxy (P1)

### 1.4 Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI + Postgres (VPS) |
| Frontend | Static HTML (Hostinger) |
| Data Source | Google Sheets + Drive |
| Notifications | LINE OA + Email (SMTP) |
| Generator | Python job on VPS |

---

## 2. Architecture Overview

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Google Sheet │───▶│   FastAPI    │───▶│   Postgres   │       │
│  │ 01_All_Props │    │   Sync Job   │    │   Database   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                             │                    │               │
│                             ▼                    ▼               │
│                      ┌──────────────┐    ┌──────────────┐       │
│                      │  QA Report   │    │   Export     │       │
│                      │  Endpoint    │    │   Endpoint   │       │
│                      └──────────────┘    └──────────────┘       │
│                                                  │               │
│                                                  ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Hostinger   │◀───│  Generator   │◀───│  API Export  │       │
│  │ Static HTML  │    │   Job        │    │   JSON       │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Browser    │───▶│  Lead/Event  │───▶│ LINE + Email │       │
│  │   (User)     │    │  Endpoints   │    │ Notification │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Principles

1. **API as Source of Truth** — Generator reads from API, not Sheet directly
2. **Fail-safe Notifications** — Lead saved even if LINE/Email fails
3. **Audit Trail** — Every sync/deploy creates a run record
4. **SEO-first** — All content server-rendered in HTML

---

## 3. Project Structure

> **Aligned with existing codebase** (`apps/`, `packages/`)

```
flowbiz-client-amp/
├── apps/
│   ├── api/                          # FastAPI application
│   │   ├── main.py                   # App entrypoint
│   │   ├── routes/
│   │   │   ├── health.py             # /healthz (existing)
│   │   │   └── v1/
│   │   │       ├── meta.py           # /v1/meta (existing)
│   │   │       ├── public.py         # /v1/public/* (NEW)
│   │   │       ├── admin.py          # /v1/admin/* (NEW)
│   │   │       ├── leads.py          # /v1/leads (NEW)
│   │   │       ├── events.py         # /v1/events (NEW)
│   │   │       └── line.py           # /v1/line/* (NEW)
│   │   ├── domain/                   # Business logic (NEW)
│   │   │   ├── publish_gate.py       # Validation rules
│   │   │   ├── slug.py               # Slug generation
│   │   │   ├── dedupe.py             # Lead deduplication
│   │   │   └── filters.py            # Property filtering
│   │   ├── repos/                    # Database access (NEW)
│   │   │   ├── properties.py
│   │   │   ├── leads.py
│   │   │   ├── events.py
│   │   │   └── sync_runs.py
│   │   └── deps.py                   # Dependency injection (NEW)
│   │
│   ├── services/                     # External integrations (NEW)
│   │   ├── google_sheets.py
│   │   ├── line_messaging.py
│   │   └── email_sender.py
│   │
│   └── jobs/                         # Background jobs (NEW)
│       ├── sync_sheet.py
│       └── generator/
│           ├── render.py
│           └── deploy.py
│
├── packages/
│   └── core/
│       ├── config.py                 # Settings (existing, extend)
│       ├── logging.py                # Logging (existing)
│       ├── database.py               # DB connection (NEW)
│       ├── schemas/
│       │   ├── base.py               # (existing)
│       │   ├── health.py             # (existing)
│       │   ├── error.py              # (existing)
│       │   ├── properties.py         # (NEW)
│       │   ├── leads.py              # (NEW)
│       │   ├── events.py             # (NEW)
│       │   ├── sync.py               # (NEW)
│       │   └── enums.py              # (NEW)
│       └── models/                   # SQLAlchemy models (NEW)
│           ├── base.py
│           ├── property.py
│           ├── lead.py
│           ├── event.py
│           └── sync_run.py
│
├── migrations/                       # Alembic migrations (NEW)
│   ├── alembic.ini
│   └── versions/
│
├── templates/                        # HTML templates (NEW)
│   ├── base.html
│   ├── home.html
│   ├── listing.html
│   ├── detail.html
│   └── thank-you.html
│
├── static/                           # Static assets (NEW)
│   ├── css/
│   ├── js/
│   └── img/
│
└── tests/
    ├── test_health.py                # (existing)
    ├── test_public.py                # (NEW)
    ├── test_leads.py                 # (NEW)
    └── test_sync.py                  # (NEW)
```

---

## 4. Data Contracts

### 4.1 Canonical Enums

```python
# packages/core/schemas/enums.py

from enum import Enum

class PropertyStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"

class PropertyIntent(str, Enum):
    RENT = "rent"
    SALE = "sale"

class PropertyType(str, Enum):
    CONDO = "condo"
    HOUSE = "house"
    VILLA = "villa"
    TOWNHOME = "townhome"
    LAND = "land"
    COMMERCIAL = "commercial"
    OTHER = "other"

class Language(str, Enum):
    TH = "th"
    EN = "en"

class MediaKind(str, Enum):
    PHOTO = "photo"
    VIDEO = "video"
    VIRTUAL_TOUR = "virtual_tour"
    BROCHURE = "brochure"

class LeadStatus(str, Enum):
    NEW = "new"
    ASSIGNED = "assigned"
    CONTACTED = "contacted"
    CLOSED = "closed"

class EventName(str, Enum):
    VIEW_DETAIL = "view_detail"
    CLICK_LINE = "click_line"
    CLICK_CALL = "click_call"
    LEAD_SUBMIT = "lead_submit"
    FILTER_APPLY = "filter_apply"
    SORT_CHANGE = "sort_change"

class QASeverity(str, Enum):
    BLOCKER = "blocker"
    WARN = "warn"
```

### 4.2 Publish Gate Rules

Property is publishable if **ALL** conditions are met:

| Rule | Field | Condition |
|------|-------|-----------|
| 1 | `property_id` | Unique, not null |
| 2 | `status` | = `active` |
| 3 | `intent` | Valid enum value |
| 4 | `type` | Valid enum value |
| 5 | `area` | Not empty |
| 6 | `price_rent` OR `price_sale` | At least one > 0 |
| 7 | `media` | At least 1 photo |
| 8 | `date_updated` | Not null (auto-set if missing) |

**Result**: Failed → QA report with reason codes, not published

### 4.3 QA Reason Codes

| Code | Severity | Message |
|------|----------|---------|
| `MISSING_PROPERTY_ID` | blocker | Property ID is required |
| `DUPLICATE_PROPERTY_ID` | blocker | Property ID already exists |
| `INVALID_STATUS` | blocker | Status must be active |
| `INVALID_INTENT` | blocker | Intent must be rent or sale |
| `INVALID_TYPE` | blocker | Property type is invalid |
| `MISSING_AREA` | blocker | Location area is required |
| `MISSING_PRICE` | blocker | At least one price is required |
| `MISSING_MEDIA` | blocker | At least one photo is required |
| `MISSING_DATE_UPDATED` | warn | Date updated was auto-set |
| `SCHEMA_MISMATCH` | blocker | Sheet schema does not match expected |

### 4.4 Slug Policy

**Format**: `{intent}-{type}-{area}-{beds}br-{property_id}`

**Rules**:
- Generated once at creation
- Does NOT change if title changes (prevents URL breakage)
- Stored separately: `slug_th`, `slug_en`
- URL-safe characters only

**Example**:
```
rent-condo-jomtien-1br-PROP-2026-001
```

---

## 5. Database Schema

### 5.1 Tables Overview

```
┌─────────────────┐     ┌─────────────────┐
│   properties    │────▶│ property_media  │
└─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│     leads       │────▶│     events      │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   sync_runs     │────▶│   qa_issues     │
└─────────────────┘     └─────────────────┘

┌─────────────────┐
│  line_targets   │
└─────────────────┘
```

### 5.2 Table: `properties`

```sql
CREATE TABLE properties (
    -- Identity
    property_id VARCHAR(50) PRIMARY KEY,
    
    -- Classification
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    intent VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL,
    
    -- Location
    area VARCHAR(100) NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    
    -- Content (Multilingual)
    title_th VARCHAR(200),
    title_en VARCHAR(200),
    desc_th TEXT,
    desc_en TEXT,
    
    -- Specs
    beds INTEGER,
    baths INTEGER,
    size_sqm DECIMAL(10, 2),
    
    -- Pricing
    price_rent DECIMAL(12, 2),
    price_sale DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- Features (JSONB for flexibility)
    furnishing VARCHAR(50),
    view VARCHAR(100),
    facilities JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    
    -- Badges
    featured BOOLEAN DEFAULT FALSE,
    active_marketing BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    
    -- Dates
    date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_available DATE,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- SEO
    slug_th VARCHAR(200),
    slug_en VARCHAR(200),
    content_hash VARCHAR(64),  -- SHA256 for incremental builds
    
    -- Audit
    source_row_id VARCHAR(50),
    source_last_seen_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_intent ON properties(intent);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_area ON properties(area);
CREATE INDEX idx_properties_featured ON properties(featured) WHERE featured = TRUE;
CREATE INDEX idx_properties_date_updated ON properties(date_updated DESC);
```

### 5.3 Table: `property_media`

```sql
CREATE TABLE property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id VARCHAR(50) NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL,  -- photo|video|virtual_tour|brochure
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_property_media_property ON property_media(property_id);
CREATE INDEX idx_property_media_primary ON property_media(property_id, is_primary) WHERE is_primary = TRUE;
```

### 5.4 Table: `leads`

```sql
CREATE TABLE leads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id VARCHAR(50) REFERENCES properties(property_id),
    
    -- Contact Info
    lang VARCHAR(2) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    message TEXT,
    
    -- Source Tracking
    page_url TEXT,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    
    -- Privacy (hashed)
    ip_hash VARCHAR(64),
    user_agent TEXT,
    
    -- Deduplication
    dedupe_key VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'new',
    
    -- Notification Tracking
    notification_line_status VARCHAR(20),  -- sent|failed|pending
    notification_email_status VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_property ON leads(property_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_dedupe ON leads(dedupe_key);
```

### 5.5 Table: `events`

```sql
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(50) NOT NULL,
    property_id VARCHAR(50),
    
    -- Context
    lang VARCHAR(2),
    page_url TEXT,
    referrer TEXT,
    
    -- UTM
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    
    -- Timestamps
    client_ts TIMESTAMP WITH TIME ZONE,  -- From client
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_property ON events(property_id);
CREATE INDEX idx_events_created ON events(created_at DESC);
```

### 5.6 Table: `sync_runs`

```sql
CREATE TABLE sync_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,  -- google_sheet
    tab_name VARCHAR(100),
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    counts JSONB,  -- {inserted: 0, updated: 0, inactive: 0, skipped: 0}
    errors JSONB,  -- [{row: 1, error: "..."}]
    
    -- Status
    status VARCHAR(20) DEFAULT 'running',  -- running|completed|failed
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_runs_source ON sync_runs(source);
CREATE INDEX idx_sync_runs_created ON sync_runs(created_at DESC);
```

### 5.7 Table: `qa_issues`

```sql
CREATE TABLE qa_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES sync_runs(run_id) ON DELETE CASCADE,
    property_id VARCHAR(50),
    reason_code VARCHAR(50) NOT NULL,
    message TEXT,
    severity VARCHAR(10) NOT NULL,  -- blocker|warn
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_qa_issues_run ON qa_issues(run_id);
CREATE INDEX idx_qa_issues_severity ON qa_issues(severity);
```

### 5.8 Table: `line_targets`

```sql
CREATE TABLE line_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL,  -- group|user|room
    target_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_line_targets_active ON line_targets(is_active) WHERE is_active = TRUE;
```

---

## 6. API Surface

### 6.1 Endpoint Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/healthz` | - | Health check |
| GET | `/v1/meta` | - | Service metadata |
| GET | `/v1/public/properties` | - | List properties |
| GET | `/v1/public/properties/{id}` | - | Property detail |
| GET | `/v1/public/landing-links` | - | Filter options |
| POST | `/v1/admin/sync/google-sheet` | API Key | Trigger sync |
| GET | `/v1/admin/reports/qa/latest` | API Key | QA report |
| GET | `/v1/admin/export/properties.json` | API Key | Generator export |
| POST | `/v1/leads` | - | Submit lead |
| POST | `/v1/events` | - | Track event |
| POST | `/v1/line/webhook` | Signature | LINE webhook |
| GET | `/v1/admin/line/targets` | API Key | List LINE targets |

### 6.2 Public Endpoints

#### `GET /v1/public/properties`

**Query Parameters**:

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `lang` | string | No | `th` | Response language |
| `intent` | string | No | - | `rent` or `sale` |
| `type` | string | No | - | Property type |
| `area` | string | No | - | Location area |
| `beds` | int | No | - | Min bedrooms |
| `baths` | int | No | - | Min bathrooms |
| `price_min` | number | No | - | Min price |
| `price_max` | number | No | - | Max price |
| `featured` | bool | No | - | Featured only |
| `has_video` | bool | No | - | Has video |
| `tags` | string | No | - | Comma-separated tags |
| `sort` | string | No | `updated_desc` | Sort order |
| `page` | int | No | 1 | Page number |
| `limit` | int | No | 24 | Items per page (max 100) |

**Sort Options**: `updated_desc`, `newest`, `price_asc`, `price_desc`

**Response**:

```json
{
  "items": [
    {
      "property_id": "PROP-2026-001",
      "intent": "rent",
      "type": "condo",
      "area": "Jomtien",
      "title": "1BR Condo | Sea View",
      "beds": 1,
      "baths": 1,
      "size_sqm": 35.0,
      "price": 15000,
      "currency": "THB",
      "primary_photo_url": "https://...",
      "badges": ["featured", "available_now"],
      "date_updated": "2026-01-27T10:00:00Z",
      "slug": "rent-condo-jomtien-1br-PROP-2026-001",
      "detail_url": "/th/property/rent-condo-jomtien-1br-PROP-2026-001"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 24,
  "has_more": true
}
```

#### `GET /v1/public/properties/{property_id}`

**Response**:

```json
{
  "property_id": "PROP-2026-001",
  "intent": "rent",
  "type": "condo",
  "status": "active",
  "area": "Jomtien",
  "title": "1BR Condo | Sea View",
  "description": "Beautiful sea view condo...",
  "beds": 1,
  "baths": 1,
  "size_sqm": 35.0,
  "price_rent": 15000,
  "price_sale": null,
  "currency": "THB",
  "furnishing": "fully_furnished",
  "view": "sea_view",
  "facilities": ["pool", "gym", "parking"],
  "tags": ["sea_view", "pet_friendly"],
  "lat": 12.9234,
  "lng": 100.8765,
  "featured": true,
  "date_updated": "2026-01-27T10:00:00Z",
  "date_available": "2026-02-01",
  "media": [
    {
      "kind": "photo",
      "url": "https://...",
      "is_primary": true
    }
  ],
  "slug": "rent-condo-jomtien-1br-PROP-2026-001",
  "canonical_url": "/th/property/rent-condo-jomtien-1br-PROP-2026-001",
  "alternate_url": "/en/property/rent-condo-jomtien-1br-PROP-2026-001"
}
```

### 6.3 Lead Endpoint

#### `POST /v1/leads`

**Request**:

```json
{
  "property_id": "PROP-2026-001",  // optional
  "lang": "th",
  "name": "John Doe",
  "phone": "+66891234567",
  "message": "I'm interested in this property",
  "page_url": "https://amppattaya.com/th/property/...",
  "referrer": "https://google.com",
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "jan_2026",
  "hp": ""  // honeypot - MUST be empty
}
```

**Validation Rules**:

| Rule | Description |
|------|-------------|
| Phone format | Thai format: starts with 0 or +66, 9-10 digits |
| Honeypot | `hp` field must be empty |
| Rate limit | Max 5 leads per IP per hour |
| Dedupe | Same phone + property_id within 10 min → update existing |

**Response** (201):

```json
{
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "thank_you_url": "/th/thank-you/?lead_id=550e8400..."
}
```

**Side Effects**:
1. Insert/update lead record
2. Send LINE OA notification
3. Send Email notification
4. Create `lead_submit` event

### 6.4 Events Endpoint

#### `POST /v1/events`

**Request**:

```json
{
  "event_name": "view_detail",  // required
  "property_id": "PROP-2026-001",
  "lang": "th",
  "page_url": "https://amppattaya.com/th/property/...",
  "referrer": "https://google.com",
  "utm_source": "facebook",
  "client_ts": "2026-01-27T10:30:00Z"
}
```

**Response** (202):

```json
{
  "accepted": true
}
```

### 6.5 Admin Endpoints

#### `POST /v1/admin/sync/google-sheet`

**Headers**: `X-API-Key: {admin_api_key}`

**Response**:

```json
{
  "run_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "counts": {
    "inserted": 10,
    "updated": 5,
    "inactive": 2,
    "skipped": 3
  },
  "qa_issues_count": 3,
  "qa_report_url": "/v1/admin/reports/qa/550e8400..."
}
```

#### `GET /v1/admin/reports/qa/latest`

**Response**:

```json
{
  "run_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-01-27T10:00:00Z",
  "issues": [
    {
      "property_id": "PROP-2026-099",
      "reason_code": "MISSING_MEDIA",
      "message": "At least one photo is required",
      "severity": "blocker"
    }
  ],
  "summary": {
    "blockers": 2,
    "warnings": 1
  }
}
```

---

## 7. Integrations

### 7.1 Google Sheets

**Config**:
```python
# packages/core/config.py

class Settings(BaseSettings):
    # ... existing ...
    
    # Google Sheets
    google_sheets_credentials_json: str = ""  # Service account JSON
    google_sheets_spreadsheet_id: str = ""
    google_sheets_tab_name: str = "01_All_Properties"
```

**Sheet Column Mapping**:

| Sheet Column | DB Field | Required |
|--------------|----------|----------|
| Property_ID | property_id | Yes |
| Status | status | Yes |
| Listing_Intent | intent | Yes |
| Type | type | Yes |
| Location_Area | area | Yes |
| Title_TH | title_th | No |
| Title_EN | title_en | No |
| Desc_TH | desc_th | No |
| Desc_EN | desc_en | No |
| Bedrooms | beds | No |
| Bathrooms | baths | No |
| Size_SQM | size_sqm | No |
| Price_Rent | price_rent | No |
| Price_Sale | price_sale | No |
| Photos_Link | _parse to media_ | No |
| Video_Link | _parse to media_ | No |
| Featured | featured | No |
| Date_Updated | date_updated | No |
| Date_Available | date_available | No |

### 7.2 LINE OA Messaging

**Config**:
```python
class Settings(BaseSettings):
    # LINE OA
    line_channel_access_token: str = ""
    line_channel_secret: str = ""
    line_target_group_id: str = ""
```

**Message Template**:
```
[LEAD][RENT][TH] PROP-2026-001 Jomtien

👤 John Doe
📞 +66891234567
🗣️ Thai

💬 I'm interested in this property...

🔗 https://amppattaya.com/th/property/...
📊 UTM: facebook / cpc / jan_2026
⏰ 2026-01-27 10:30 GMT+7

---
⚡ ตอบภายใน 5 นาที
```

**Error Handling**:
- LINE fail → Lead still saved
- Set `notification_line_status = 'failed'`
- Log error for monitoring

### 7.3 Email (SMTP)

**Config**:
```python
class Settings(BaseSettings):
    # Email SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_to_emails: str = ""  # Comma-separated
```

**Email Template**: Same content as LINE, sent as plain text

---

## 8. Frontend & Generator

### 8.1 Output Structure

```
/th/index.html                          # Home TH
/en/index.html                          # Home EN
/th/properties/index.html               # Listing TH
/en/properties/index.html               # Listing EN
/th/property/{slug}.html                # Detail TH
/en/property/{slug}.html                # Detail EN
/th/rent/condo/{area}/index.html        # Landing TH
/en/rent/condo/{area}/index.html        # Landing EN
/th/thank-you/index.html                # Thank you TH
/en/thank-you/index.html                # Thank you EN
/assets/css/site.css                    # Main CSS
/assets/js/site.js                      # Main JS
/assets/js/lead.js                      # Lead form
/assets/js/events.js                    # Event tracking
/robots.txt
/sitemap.xml
```

### 8.2 SEO Requirements

**Every Page**:
```html
<head>
  <title>{intent} {type} in {area} | AMP</title>
  <meta name="description" content="{150 chars}">
  <link rel="canonical" href="https://amppattaya.com/th/...">
  <link rel="alternate" hreflang="th" href="https://amppattaya.com/th/...">
  <link rel="alternate" hreflang="en" href="https://amppattaya.com/en/...">
  <link rel="alternate" hreflang="x-default" href="https://amppattaya.com/en/...">
  
  <!-- OG Tags -->
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  <meta property="og:image" content="https://...">
  <meta property="og:url" content="https://amppattaya.com/th/...">
</head>
```

**Detail Page JSON-LD**:
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "1BR Condo in Jomtien",
  "description": "...",
  "offers": {
    "@type": "Offer",
    "price": 15000,
    "priceCurrency": "THB"
  },
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "Jomtien",
    "addressCountry": "TH"
  },
  "floorSize": {
    "@type": "QuantitativeValue",
    "value": 35,
    "unitCode": "MTK"
  },
  "numberOfRooms": 1,
  "image": "https://...",
  "dateModified": "2026-01-27"
}
```

### 8.3 Frontend JavaScript

**Config** (`/assets/js/config.js`):
```javascript
const CONFIG = {
  API_BASE_URL: 'https://api.amppattaya.com',
  SITE_LANG: document.documentElement.lang || 'th',
  SITE_VERSION: '0.1.0'
};
```

**Lead Submission** (`/assets/js/lead.js`):
```javascript
async function submitLead(formData) {
  const btn = document.querySelector('#submit-btn');
  btn.disabled = true;
  btn.textContent = 'กำลังส่ง...';
  
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/v1/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        lang: CONFIG.SITE_LANG,
        page_url: window.location.href,
        referrer: document.referrer,
        ...getUTMParams()
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      window.location.href = data.thank_you_url;
    } else {
      throw new Error('Submission failed');
    }
  } catch (error) {
    console.error(error);
    alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    btn.disabled = false;
    btn.textContent = 'ส่งข้อมูล';
  }
}
```

**Event Tracking** (`/assets/js/events.js`):
```javascript
async function trackEvent(eventName, propertyId = null) {
  try {
    await fetch(`${CONFIG.API_BASE_URL}/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        property_id: propertyId,
        lang: CONFIG.SITE_LANG,
        page_url: window.location.href,
        referrer: document.referrer,
        client_ts: new Date().toISOString(),
        ...getUTMParams()
      })
    });
  } catch (error) {
    // Fail silently - don't block UX
    console.warn('Event tracking failed:', error);
  }
}

// Auto-track on detail page
if (window.PROPERTY_ID) {
  trackEvent('view_detail', window.PROPERTY_ID);
}
```

---

## 9. Mobile Responsive

### 9.1 Breakpoints

| Name | Range | Target Devices |
|------|-------|----------------|
| XS | 320–359px | iPhone SE, small Android |
| S | 360–389px | Most Android phones |
| M | 390–430px | iPhone 13/14/15, Pro Max |
| Tablet | 768–1023px | iPad, tablets |
| Desktop | 1024px+ | Laptops, desktops |

### 9.2 Global Rules

```css
:root {
  --container-padding: 16px;
  --tap-target-min: 44px;
  --font-body: 16px;
  --line-height: 1.5;
}

@media (max-width: 359px) {
  :root {
    --container-padding: 12px;
  }
}

/* Prevent horizontal scroll */
html, body {
  overflow-x: hidden;
}

/* Prevent Safari zoom on inputs */
input, textarea, select {
  font-size: 16px;
}
```

### 9.3 Sticky Conversion Bar (Mobile)

```html
<div class="sticky-cta" id="sticky-cta">
  <a href="https://line.me/ti/p/~@amppattaya" 
     class="btn-cta btn-line"
     onclick="trackEvent('click_line', PROPERTY_ID)">
    <svg>...</svg> LINE
  </a>
  <a href="tel:+66891234567" 
     class="btn-cta btn-call"
     onclick="trackEvent('click_call', PROPERTY_ID)">
    <svg>...</svg> โทร
  </a>
</div>
```

```css
.sticky-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
}

.sticky-cta .btn-line {
  flex: 2;
  background: var(--color-accent);
  color: white;
}

.sticky-cta .btn-call {
  flex: 1;
  background: var(--color-primary);
  color: white;
}

/* Hide when typing */
body.keyboard-open .sticky-cta {
  display: none;
}

/* Desktop: hide sticky bar */
@media (min-width: 1024px) {
  .sticky-cta {
    display: none;
  }
}
```

### 9.4 Filter Bottom Sheet (Mobile)

```html
<div class="filter-sheet" id="filter-sheet">
  <div class="filter-sheet-header">
    <h3>ตัวกรอง</h3>
    <button class="close-btn">&times;</button>
  </div>
  <div class="filter-sheet-body">
    <!-- Filter controls -->
  </div>
  <div class="filter-sheet-footer">
    <button class="btn-reset">ล้าง</button>
    <button class="btn-apply">แสดงผล (42)</button>
  </div>
</div>
```

```css
.filter-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80vh;
  background: white;
  border-radius: 16px 16px 0 0;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  z-index: 1001;
}

.filter-sheet.open {
  transform: translateY(0);
}

.filter-sheet-footer {
  position: sticky;
  bottom: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid #eee;
}
```

---

## 10. Brand & Theme

### 10.1 Color Palette

```css
:root {
  /* Primary */
  --color-primary: #1744BE;      /* AMP Blue - Trust */
  --color-accent: #F05A43;       /* AMP Coral - CTA */
  
  /* Neutrals */
  --color-white: #FFFFFF;
  --color-ink: #0F172A;          /* Text */
  --color-gray-50: #F8FAFC;
  --color-gray-100: #F1F5F9;
  --color-gray-300: #CBD5E1;
  --color-gray-600: #475569;
  
  /* Semantic */
  --color-success: #16A34A;      /* Available now */
  --color-warning: #F59E0B;
  --color-error: #DC2626;
}
```

### 10.2 Typography

```css
:root {
  --font-family: 'Prompt', 'Inter', sans-serif;
  
  /* Scale */
  --font-h1: 28px;
  --font-h2: 22px;
  --font-body: 16px;
  --font-caption: 13px;
  --font-price: 24px;
}

@media (min-width: 768px) {
  :root {
    --font-h1: 34px;
    --font-h2: 24px;
    --font-price: 28px;
  }
}
```

### 10.3 Component Tokens

```css
:root {
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Borders */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* Shadows */
  --shadow-card: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-sticky: 0 -2px 10px rgba(0,0,0,0.1);
}
```

### 10.4 Button Styles

```css
.btn {
  min-height: var(--tap-target-min);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-secondary {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 10.5 Badge Styles

```css
.badge {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-caption);
  font-weight: 500;
}

.badge-featured {
  background: var(--color-accent);
  color: white;
}

.badge-updated {
  background: var(--color-primary);
  color: white;
}

.badge-available {
  background: var(--color-success);
  color: white;
}
```

---

## 11. Security & Compliance

### 11.1 Input Validation

| Field | Validation |
|-------|------------|
| `name` | 1-100 chars, trim whitespace |
| `phone` | Thai format: `/^(\+66\|0)[0-9]{8,9}$/` |
| `message` | Max 2000 chars, sanitize HTML |
| `property_id` | Alphanumeric + dash only |
| `utm_*` | Max 100 chars each |
| `hp` (honeypot) | Must be empty |

### 11.2 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /v1/leads` | 5 requests | per IP per hour |
| `POST /v1/events` | 100 requests | per IP per minute |
| `POST /v1/admin/*` | 10 requests | per API key per minute |

### 11.3 Anti-Spam

1. **Honeypot Field**: Hidden `hp` input must be empty
2. **Rate Limiting**: IP-based limits (see above)
3. **Deduplication**: Same phone + property_id within 10 min → update, not insert
4. **IP Hashing**: Store SHA256(IP + salt), not raw IP

### 11.4 CORS Configuration

```python
# apps/api/main.py

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://amppattaya.com",
        "https://www.amppattaya.com",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)
```

### 11.5 LINE Webhook Verification

```python
# apps/api/routes/v1/line.py

import hashlib
import hmac

def verify_line_signature(body: bytes, signature: str) -> bool:
    hash = hmac.new(
        settings.line_channel_secret.encode(),
        body,
        hashlib.sha256
    ).digest()
    return hmac.compare_digest(
        base64.b64encode(hash).decode(),
        signature
    )
```

---

## 12. Observability

### 12.1 Health Endpoints

```python
# GET /healthz - Basic health
{
  "status": "ok",
  "service": "amp-service",
  "version": "0.1.0"
}

# GET /readyz - Ready with deps (P1)
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "line_api": "ok"
  }
}
```

### 12.2 Logging

**Format**:
```python
# packages/core/logging.py

import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "request_id": getattr(record, 'request_id', None),
            "lead_id": getattr(record, 'lead_id', None),
            "run_id": getattr(record, 'run_id', None),
        })
```

### 12.3 Key Metrics (P0)

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `sync_duration_seconds` | Time to complete sheet sync | > 60s |
| `sync_items_updated` | Properties updated per sync | - |
| `qa_blockers_count` | Properties failing publish gate | > 10 |
| `lead_count_total` | Total leads received | - |
| `lead_notification_success_rate` | LINE + Email success | < 95% |
| `event_volume_per_minute` | Events tracked | - |

---

## 13. Implementation Plan

### 13.1 PR Sequence

| PR | Title | Scope | Est. |
|----|-------|-------|------|
| 1 | Schemas & Enums | `packages/core/schemas/`, `enums.py` | 1 day |
| 2 | Database Setup | `packages/core/models/`, `migrations/`, `database.py` | 2 days |
| 3 | Public Read API | `/v1/public/properties`, repos | 2 days |
| 4 | Google Sheet Sync | `apps/services/google_sheets.py`, sync job, QA report | 3 days |
| 5 | Lead + Notifications | `/v1/leads`, LINE, Email, rate limit | 3 days |
| 6 | Events + Observability | `/v1/events`, logging, health checks | 1 day |
| 7 | Frontend Templates | `templates/`, `static/` | 3 days |
| 8 | Generator | `apps/jobs/generator/`, deploy | 3 days |

### 13.2 Dependencies

```toml
# pyproject.toml additions

dependencies = [
    # Existing
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "pydantic>=2.4.0",
    "pydantic-settings>=2.0.0",
    
    # NEW: Database
    "sqlalchemy>=2.0.0",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    
    # NEW: Google Sheets
    "gspread>=5.12.0",
    "google-auth>=2.25.0",
    
    # NEW: LINE
    "line-bot-sdk>=3.5.0",
    
    # NEW: Email
    "aiosmtplib>=3.0.0",
    
    # NEW: HTTP Client
    "httpx>=0.25.0",
    
    # NEW: Form handling
    "python-multipart>=0.0.6",
    
    # NEW: Templates
    "jinja2>=3.1.0",
]
```

### 13.3 Environment Variables

```bash
# .env.example additions

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/amp

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_JSON='{...}'
GOOGLE_SHEETS_SPREADSHEET_ID=xxx
GOOGLE_SHEETS_TAB_NAME=01_All_Properties

# LINE OA
LINE_CHANNEL_ACCESS_TOKEN=xxx
LINE_CHANNEL_SECRET=xxx
LINE_TARGET_GROUP_ID=xxx

# Email SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@amppattaya.com
SMTP_PASSWORD=xxx
SMTP_FROM_EMAIL=noreply@amppattaya.com
SMTP_TO_EMAILS=team@amppattaya.com

# Security
ADMIN_API_KEY=xxx
CORS_ORIGINS=https://amppattaya.com,https://www.amppattaya.com
IP_HASH_SALT=xxx
```

---

## 14. Acceptance Criteria

### 14.1 Backend P0

- [ ] Sheet sync runs successfully, creates `sync_runs` + `qa_issues`
- [ ] `GET /v1/public/properties` returns paginated list with filters
- [ ] `GET /v1/public/properties/{id}` returns full detail + media
- [ ] `POST /v1/leads` saves lead and sends LINE + Email notification
- [ ] `POST /v1/events` stores events in database
- [ ] QA report endpoint shows unpublishable properties with reason codes
- [ ] All secrets via env vars, no hardcoded values
- [ ] CORS limited to amppattaya.com domain

### 14.2 Frontend P0

- [ ] Home, Listing, Detail pages in TH/EN
- [ ] All pages indexable (view source shows full content)
- [ ] `sitemap.xml` contains all TH/EN URLs
- [ ] `robots.txt` configured correctly
- [ ] canonical + hreflang tags on every page
- [ ] JSON-LD schema on detail pages
- [ ] Lead form submits successfully → thank-you page
- [ ] Event tracking fires on detail view, LINE click, call click

### 14.3 Mobile P0

- [ ] Sticky CTA visible on listing + detail (mobile)
- [ ] LINE button accessible in 1 tap
- [ ] No horizontal scroll at any breakpoint
- [ ] Filter bottom sheet opens/closes smoothly
- [ ] Form usable without pinch/zoom
- [ ] CLS < 0.1 on detail page

### 14.4 Integration P0

- [ ] Lead → LINE OA notification within 5 seconds
- [ ] Lead → Email notification within 5 seconds
- [ ] LINE webhook captures groupId successfully
- [ ] Failed notifications don't block lead save

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-01-26 | Initial blueprints (5 separate docs) |
| 0.2 | 2026-01-27 | Consolidated, aligned with codebase structure |

---

## Related Documents

- [README.md](../../README.md) - Project overview
- [ADR: System Nginx](../ADR_SYSTEM_NGINX.md) - VPS architecture
- [AGENT_BEHAVIOR_LOCK.md](../AGENT_BEHAVIOR_LOCK.md) - Deployment rules
- [Data OS](../data/README.md) - Data management guide