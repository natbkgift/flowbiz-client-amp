## Backend Blueprint v0.1 — amppattaya.com (FastAPI + Postgres + Sheet/Drive + LINE OA + Email)

### Objectives (MVP P0)

* Sync ข้อมูลจาก Google Sheet → Postgres แบบ **audit + deterministic**
* Serve public read API สำหรับ **generator + site**
* รับ lead แล้วแจ้งทีมผ่าน **LINE OA group + Email** ภายในไม่กี่วินาที
* เก็บ events เพื่อวัด **CVR/CPL/Speed-to-Lead**
* พร้อม scale แบบ “เพิ่ม data, เพิ่ม landing pages” โดยไม่พัง

### Non-goals (P0)

* Auth/member portal, post-ad flow, payment/boost, full CRM UI, image CDN/proxy (ค่อยทำ P1)

---

# 1) Architecture (Modules)

**FastAPI app** แยกเลเยอร์ชัด (auditability)

1. `api/` — routers (public/admin/leads/events/line)
2. `domain/` — business rules (filters, publish gate, dedupe)
3. `services/` — integrations (google sheets, line, email)
4. `repos/` — DB access (SQLAlchemy/SQLModel)
5. `jobs/` — sync runner + deploy/generator triggers (ถ้าต้อง)
6. `schemas/` — Pydantic contracts (request/response)
7. `ops/` — config, logging, metrics, health checks

**Key principle:** API เป็น source-of-truth สำหรับ generator; generator ไม่อ่าน sheet ตรง

---

# 2) Data Flow (Conceptual)

1. Admin เรียก `POST /v1/admin/sync/google-sheet` (หรือ schedule)
2. Service อ่าน `01_All_Properties` → validate/normalize → upsert Postgres
3. สร้าง `sync_run` record + QA report (items ที่ publish ไม่ได้)
4. Generator เรียก `GET /v1/admin/export/properties.json?lang=th|en`
5. Public site ใช้ HTML + JS เล็กน้อยเรียก:

   * lead submit (`POST /v1/leads`)
   * events (`POST /v1/events`)

---

# 3) Data Contract & Normalization

## 3.1 Canonical enums (บังคับ map ให้ตรง)

* `status`: `active|inactive|draft`
* `intent`: `rent|sale`
* `type`: `condo|house|villa|townhome|land|commercial|other`
* `lang`: `th|en`

## 3.2 Publish Gate (P0)

Property publish ได้ถ้า:

* `property_id` unique
* `status=active`
* `intent` valid
* `type` valid
* `area` not empty
* มีราคาอย่างน้อย 1 (rent หรือ sale)
* มี media อย่างน้อย 1 รูป (หรือ main_photo_url)
* มี `date_updated` (ถ้าไม่มี ให้ set ตอน sync เป็น now และ flag)

**ผลลัพธ์:** ไม่ผ่าน gate → ไม่ออก public/export แต่เข้า QA report พร้อม reason codes

## 3.3 Slug policy (deterministic)

* สร้างจาก `{intent}-{type}-{area}-{beds}br-{property_id}` (per lang)
* ถ้า title เปลี่ยน slug “ไม่ต้องเปลี่ยน” ใน P0 (กัน URL แตก)
* เก็บ `slug_th`, `slug_en` ใน DB

---

# 4) Postgres Schema (P0)

## 4.1 Tables

### `properties`

* `property_id` (PK, string)
* `status`, `intent`, `type`
* `area` (Location_Area)
* `title_th`, `title_en`
* `desc_th`, `desc_en`
* `beds` int, `baths` int, `size_sqm` numeric
* `price_rent` numeric, `price_sale` numeric, `currency` (THB default)
* `furnishing`, `view`, `facilities` (structured as jsonb หรือ normalized later)
* `lat`, `lng` (nullable)
* badges: `featured` bool, `active_marketing` bool, `priority` int
* `date_added`, `date_updated`, `date_available`
* `slug_th`, `slug_en`
* `content_hash` (for generator incremental)
* `published_at`
* `source_row_id` / `source_last_seen_at` (audit)

### `property_media`

* `id` (PK)
* `property_id` (FK)
* `kind` = `photo|video|virtual_tour|brochure`
* `url`
* `sort_order`
* `is_primary` bool

### `leads`

* `lead_id` (PK, uuid)
* `property_id` (FK, nullable ถ้า lead จาก listing hub)
* `lang`, `name`, `phone`, `message`
* `page_url`, `referrer`
* `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
* `ip_hash`, `user_agent`
* `dedupe_key`
* `status` (`new|assigned|contacted|closed`) (P0 ใช้ new)
* `created_at`

### `events`

* `event_id` (PK, uuid)
* `event_name` (`view_detail|click_line|click_call|lead_submit|filter_apply|sort_change`)
* `property_id` nullable
* `lang`, `page_url`, `referrer`, `utm_*`
* `client_ts`, `created_at`

### `sync_runs`

* `run_id` (PK, uuid)
* `source` = `google_sheet`
* `tab_name` = `01_All_Properties`
* `started_at`, `ended_at`
* `counts_json` (inserted/updated/inactive/skipped)
* `errors_json`

### `qa_issues`

* `id`
* `run_id`
* `property_id`
* `reason_code` (machine)
* `message` (human)
* `severity` (`blocker|warn`)
* `created_at`

### `line_targets`

* `id`
* `type` (`group|user|room`)
* `target_id` (groupId)
* `name` (optional)
* `created_at`, `last_seen_at`

---

# 5) API Surface (P0)

## 5.1 Public Read (สำหรับ generator + frontend)

### `GET /v1/public/properties`

**Query**

* `lang=th|en`
* `intent=rent|sale` (optional)
* `type`, `area`, `beds`, `baths`
* `price_min`, `price_max`
* `featured=true|false` (optional)
* `has_video=true` (optional)
* `tags=sea_view,pet_friendly` (optional)
* `sort=updated_desc|newest|price_asc|price_desc`
* `page`, `limit` (default 24)

**Response**

* `items[]` (card-ready: primary photo, badges, updated date)
* `total`, `page`, `limit`, `has_more`

### `GET /v1/public/properties/{property_id}`

* detail + media list + computed fields (canonical url, alternate lang url)

### `GET /v1/public/landing-links`

* returns: areas, beds buckets, price buckets, top tags (curated or computed)

## 5.2 Admin/Ops

### `POST /v1/admin/sync/google-sheet`

* triggers sync run (idempotent)
* response: run summary + QA issues count + link to report endpoint

### `GET /v1/admin/reports/qa/latest`

* returns: blockers/warns with property_id and reason codes

### `GET /v1/admin/export/properties.json?lang=th|en`

* returns: publishable properties only, optimized payload for generator
* include: `content_hash`, `slug`, `alternate_url`, media, SEO fields

## 5.3 Leads (Conversion core)

### `POST /v1/leads`

**Request**

* `property_id` (optional)
* `lang`, `name`, `phone`, `message`
* `page_url`
* optional: `utm_*`, `referrer`
* `hp` honeypot (must be empty)

**Rules**

* rate limit by `ip_hash` + sliding window
* dedupe window (เช่น 10 นาที): same phone + property_id → update message/updated_at แทน

**Actions**

* write lead record
* send LINE OA message to configured target
* send email to team
* write event `lead_submit`

**Response**

* `lead_id`, `thank_you_url`

## 5.4 Events

### `POST /v1/events`

* accept minimal event payload (see schema above)

## 5.5 LINE Webhook (เพื่อหา groupId และ health)

### `POST /v1/line/webhook`

* verify signature
* on message event: capture `source.groupId` update `line_targets`

### `GET /v1/admin/line/targets`

* list known targets (pick groupId to use)

---

# 6) Integrations Blueprint

## 6.1 Google Sheets

* Prefer **Service Account** + shared sheet to SA email
* Pull tab `01_All_Properties`
* Store `source_row_id` / last seen to detect deletions/inactive

## 6.2 Google Drive links (media)

P0: เก็บเป็น URL ตรง (folder/link) + parse เป็น list ถ้ารูปเป็น direct links อยู่แล้ว
P1: ทำ image proxy/thumbnail service

## 6.3 LINE OA Messaging API

* config: `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_TARGET_GROUP_ID`
* message template (deterministic)
* error handling: ถ้า LINE fail → still save lead + mark notification_status=failed (เพิ่ม field ได้)

## 6.4 Email

* SMTP config (Hostinger/Gmail Workspace)
* ส่งแบบ plaintext + link
* fail-safe: ถ้า email fail → lead ยังถูกเก็บ + log

---

# 7) Security / Compliance (P0 minimal)

* Secrets via env vars only (no hardcode)
* Request logging แต่ **hash IP** ไม่เก็บ raw (ลด PII risk)
* Validate input (phone normalization)
* LINE webhook signature verification
* CORS จำกัดเฉพาะ domain `amppattaya.com`

---

# 8) Observability (Ops-ready)

## Endpoints

* `GET /healthz` (db connectivity + basic)
* `GET /readyz` (optional: deps)

## Logs

* structured logs: request_id, run_id, lead_id

## Metrics (ขั้นต่ำ)

* sync duration, items updated, qa blockers
* lead count, notification success rate, event volume

---

# 9) Failure Modes & Rollback

* **Sheet schema เปลี่ยน** → sync run fail + QA issue “schema_mismatch”
* **LINE/Email down** → lead save success แต่ notification fail (retry P1)
* **Duplicate property_id** → reject row + QA blocker
* **Deploy/generator mismatch** → export payload schema versioning (`schema_version: v1`)

---

# 10) Acceptance Criteria (Backend P0)

* Sync tab `01_All_Properties` → Postgres ได้ พร้อม `sync_runs` และ `qa_issues`
* `GET /v1/public/properties` และ `/{id}` คืนข้อมูลครบสำหรับ card/detail
* `POST /v1/leads` บันทึก lead และแจ้ง LINE OA + Email ได้
* `POST /v1/events` เก็บ event ได้
* มี QA report endpoint ใช้งานได้
* Config/secrets แยกชัด, CORS จำกัดโดเมน

---

## P0 → PR Summary (แนะนำลำดับ PR)

1. **PR#1 Contracts**: schemas + reason codes + API surface (no impl)
2. **PR#2 DB**: migrations + models + repos
3. **PR#3 Sync**: google sheet sync + QA report
4. **PR#4 Public read**: list/detail + landing links
5. **PR#5 Leads+Notify**: lead endpoint + LINE + Email + honeypot/rate limit
6. **PR#6 Events+Health**: events + health + basic metrics/logging

