## Blueprint v0.1 — amppattaya.com (MVP-first, SEO-first, Speed-to-Lead)

**Product:** เว็บไซต์ประกาศ/เอเจนต์อสังหา “พัทยา” 2 ภาษา (TH/EN)
**Goal (MVP):** มี Listing + Detail ตั้งแต่รอบแรก, ปิด lead ให้ไวที่สุด (Speed-to-Lead), SEO indexable 100%
**Stack constraints:** Static Frontend (Hostinger) + FastAPI/Postgres (VPS, repo `natbkgift/flowbiz-client-amp`) + Google Sheet/Drive + LINE OA + Email
**Non-goals (ตอน MVP):** member login, post-ad self-serve, payment/boost, chat system, map draw polygon (ค่อย P1/P2)

---

# 1) System Overview (3 ส่วน)

## 1.1 API Service (VPS)

* **Repo:** `flowbiz-client-amp`
* **Responsibilities**

  * Sync ข้อมูลจาก Google Sheet tab `01_All_Properties` → Postgres
  * Serve public endpoints สำหรับเว็บไซต์ + generator
  * รับ lead + ส่งแจ้งเตือน (LINE OA group + Email)
  * เก็บ events (CTA clicks / view detail / lead submit) เพื่อ attribution

## 1.2 Static Site (Hostinger)

* **amppattaya.com** เป็นไฟล์ HTML ที่ generator สร้าง
* **Indexable 100%**: หน้า Home/Listing/Detail ต้องมี HTML content ครบโดยไม่พึ่ง JS render
* JS ใช้เฉพาะ:

  * ส่ง lead form
  * ส่ง event tracking (เบา ๆ)
  * UI helper เล็กน้อย (เช่น toggle filter)

## 1.3 Generator (VPS job)

* ดึงข้อมูลจาก API/DB (export) แล้ว render HTML TH/EN
* สร้าง `sitemap.xml` + (optional) sitemap index เมื่อเริ่มใหญ่
* สร้าง HTML sitemap / landing pages (ทำเล/ประเภท/จำนวนห้อง/ช่วงราคา)
* Deploy ไป Hostinger ผ่าน SFTP/FTP แบบ “ปลอดภัยและ audit ได้”

---

# 2) Business & Monetization Lens (สั้นแต่ล็อคทิศ)

## Target users

* ผู้เช่า/ผู้ซื้อ (ไทย+ต่างชาติ) ที่ต้องการทรัพย์ในพัทยาและติดต่อเร็ว
* เจ้าของทรัพย์/นักลงทุนที่อยากฝากปล่อยเช่า/ขาย (P1)

## Value proposition (MVP)

* “หาเจอไว + รายละเอียดครบ + ติดต่อตอบไว”
* ลดงานทีมด้วย lead ที่มีบริบทครบ (ทรัพย์ที่สนใจ + ภาษา + UTM)

## Monetization (หลัง MVP)

* คอมมิชชั่นปิดการขาย/ปล่อยเช่า
* บริการฝากบริหาร (Property Management)
* Boost/Featured (P2)

---

# 3) Scope (MVP v1)

## In-scope (P0)

* TH/EN pages: Home, Listing, Detail, Landing pages, Contact (ขั้นต่ำ)
* Search/Filter: intent (rent/sale), type, area, beds, price range, furnishing/tags (quick filters)
* Lead capture: Call / LINE OA / WhatsApp (ถ้าต้องการ) + Form
* Lead notification: LINE OA group + Email
* Tracking: view_detail, click_call, click_line, lead_submit
* SEO essentials: canonical, hreflang, robots.txt, sitemap.xml, OG tags, JSON-LD (detail)

## Out-of-scope (P0)

* Login/Member
* Post ad flow
* Payment/boost system
* Chat-in-site
* Full map search / polygon draw

---

# 4) Data Source & Contract (Sheet → Postgres)

## 4.1 Source of truth

* Google Sheet tab: **`01_All_Properties`** (P0 only)
* Photos: Google Drive folder link (ต่อทรัพย์)

## 4.2 Required fields (publish gate)

Property ต้องผ่านขั้นต่ำนี้จึงถูก publish:

* `Property_ID` (unique)
* `Status` (active/inactive)
* `Listing_Intent` (rent|sale) *(ถ้าใน sheet ใช้ชื่ออื่นให้ map เป็น intent)*
* `Type` (condo|house|villa|…)
* `Location_Area`
* ราคาอย่างน้อย 1 (`Price_Rent` หรือ `Price_Sale`)
* `Bedrooms`, `Bathrooms` (ถ้าไม่มี ให้อนุญาต null แต่ต้องกำหนดการแสดงผล)
* `Size_SQM` (แนะนำ)
* `Photos_Link` อย่างน้อย 1 รูป (หรือมี main photo)

ถ้าไม่ผ่าน → ไม่ publish แต่ไปอยู่ใน **QA Report** (เพื่อให้ทีมแก้ใน sheet)

## 4.3 Nice-to-have fields (ทำให้ “เหนือกว่า” ตั้งแต่ P0)

* `Featured`, `Active_Marketing`, `Priority`
* `Date_Updated`, `Date_Available`
* `Tags` (sea view / near beach / pet friendly ฯลฯ)
* `Video_Link`, `Virtual_Tour`, `Brochure_Link`
* `Latitude`, `Longitude` (P1 map)

---

# 5) Postgres Model (conceptual)

## Tables (P0)

* `properties`

  * core fields + multilingual text fields (`title_th`, `title_en`, `desc_th`, `desc_en`)
  * `status`, `intent`, `type`, `area`, `price_rent`, `price_sale`, `beds`, `baths`, `size_sqm`
  * `featured`, `priority`, `active_marketing`
  * `date_added`, `date_updated`, `date_available`
  * `slug_th`, `slug_en`, `content_hash`, `published_at`
* `property_media`

  * `property_id`, `kind` (photo|video|tour|brochure), `url`, `sort_order`
* `leads`

  * `lead_id`, `property_id`, `lang`, `name`, `phone`, `message`
  * `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
  * `page_url`, `referrer`, `ip_hash`, `user_agent`, `created_at`
  * `status` (new/assigned/contacted/closed) *(เริ่ม new ได้)*
* `events`

  * `event_id`, `event_name`, `property_id`, `lang`, `page_url`
  * `utm_*`, `referrer`, `client_ts`, `created_at`
* `sync_runs`

  * `run_id`, `source` (google_sheet), `started_at`, `ended_at`, `counts`, `errors`
* `deploy_runs`

  * `deploy_id`, `started_at`, `ended_at`, `manifest`, `status`, `errors`

---

# 6) API Spec (ขั้นต่ำที่ต้องมี)

## 6.1 Public read (generator + site)

* `GET /v1/public/properties`

  * params: `lang=th|en`, `intent=rent|sale`, `type`, `area`, `beds`, `price_min`, `price_max`
  * params: `sort=updated_desc|newest|price_asc|price_desc`
  * params: `page=1`, `limit=24`
  * returns: `items`, `total`, `page`, `limit`, `has_more`
* `GET /v1/public/properties/{property_id}`

  * returns: full detail + media + computed badges
* `GET /v1/public/landing-links`

  * params: `lang`, `intent`, `type`
  * returns: curated links (areas, beds, price buckets, tags)

## 6.2 Admin / Ops

* `POST /v1/admin/sync/google-sheet`

  * sync tab `01_All_Properties`
  * returns: sync summary + QA report link/id
* `GET /v1/admin/export/properties.json?lang=th|en`

  * export สำหรับ generator (โหลดทีเดียว)
* `GET /v1/admin/reports/qa/latest`

  * properties ที่ไม่ผ่าน publish gate + reasons

## 6.3 Leads (P0)

* `POST /v1/leads`

  * required: `property_id`, `lang`, `name`, `phone`, `message`, `page_url`
  * optional: `utm_*`, `referrer`
  * anti-spam: honeypot + rate limit + dedupe window
  * actions:

    * insert/update lead
    * notify LINE OA group + send Email
  * returns: `lead_id`, `thank_you_url`

## 6.4 Events (P0 minimal)

* `POST /v1/events`

  * `event_name`: `view_detail|click_call|click_line|lead_submit`
  * `property_id`, `lang`, `page_url`, `utm_*`, `referrer`

## 6.5 LINE OA webhook (เพื่อดึง groupId แบบ audit)

* `POST /v1/line/webhook`

  * capture `source.groupId` แล้วบันทึกเป็น target
* `GET /v1/admin/line/targets`

  * list targets ที่บันทึกไว้

---

# 7) Generator (SEO-first rendering plan)

## 7.1 Output structure (Hostinger)

* `/th/index.html`
* `/en/index.html`
* `/th/properties/index.html`
* `/en/properties/index.html`
* `/th/property/<property_id>-<slug>.html`
* `/en/property/<property_id>-<slug>.html`
* `/robots.txt`
* `/sitemap.xml` *(P0)*
* `/sitemap/` *(HTML sitemap แยกภาษาได้)*

## 7.2 Canonical + hreflang

ทุกหน้า detail/list/home:

* canonical ของภาษาตัวเอง
* hreflang cross-link:

  * `hreflang="th"` → หน้า TH
  * `hreflang="en"` → หน้า EN
  * `x-default` → (เลือก EN หรือ Home รวม)

## 7.3 Metadata ที่ต้องมี (P0)

* `<title>` ตาม intent + area + type + brand
* meta description สรุป + ราคาเริ่มต้น (ถ้ามี)
* OG/Twitter card (รูปหลัก + ราคา + ทำเล)
* JSON-LD schema บน detail (RealEstateListing/Offer)

## 7.4 Incremental build (กันช้าในอนาคต)

* เก็บ `content_hash` ต่อ property
* regen เฉพาะที่เปลี่ยน + regenerate sitemap
* ถ้า inactive → สร้าง 410/404 strategy (อย่างน้อย remove from sitemap)

---

# 8) Deploy to Hostinger (Safe + Auditable)

## 8.1 Deploy mechanics

* upload ไป `_deploy_tmp/` ก่อน
* สร้าง `manifest.json` (ไฟล์ทั้งหมด + checksum + จำนวนหน้า + เวลา)
* ถ้า host รองรับ rename folder → swap
* ถ้าไม่รองรับ:

  1. upload asset/pages ทั้งหมด
  2. upload listing pages
  3. upload home pages
  4. upload `sitemap.xml` และ `robots.txt` เป็นขั้นสุดท้าย
  5. cleanup orphan อย่างระวัง

## 8.2 Rollback plan

* เก็บ `_deploy_prev/` อย่างน้อย 1 เวอร์ชัน
* มี deploy_id + timestamp

---

# 9) Lead Notification (LINE OA + Email)

## 9.1 Required secrets/config

* `LINE_CHANNEL_ACCESS_TOKEN`
* `LINE_TARGET_GROUP_ID` *(หรือ capture ผ่าน webhook แล้วเลือก target)*
* Email SMTP config

## 9.2 Message format (P0)

**Title:** `[LEAD][RENT|SALE][TH|EN] <property_id> <area>`
**Body:**

* Name / Phone / Language
* Message
* Property URL
* UTM summary (ถ้ามี)
* Timestamp

**SLA hint:** ใส่ “ตอบภายใน 5 นาที” เป็น internal reminder (ไม่โชว์ user)

---

# 10) Analytics & KPIs (MVP scoreboard)

## KPIs ที่ต้องวัดได้ตั้งแต่ P0

* **Speed-to-lead:** median time จาก lead_submit → ทีมตอบ (เริ่มจาก manual logging ได้)
* **CVR:** sessions → lead_submit (หรือ click_line/call)
* **CPL:** per channel (ผ่าน UTM)
* **SEO:** indexed pages, impressions/clicks (GSC)
* **Listing quality:** % properties ผ่าน publish gate

---

# 11) Risks & Trade-offs

1. **Static SEO vs dynamic data**

   * ทางเลือกปลอดภัย: generator pre-render (ตาม blueprint นี้)
2. **Google Drive images ช้า/ไม่เสถียร**

   * ระยะสั้น: lazy-load + limit above-the-fold
   * ระยะยาว: ทำ thumbnail/CDN
3. **Spam leads**

   * ต้องมี honeypot + rate limit + dedupe ตั้งแต่วันแรก
4. **ภาษา TH/EN**

   * ต้องกำหนด field ที่ “บังคับแปล” vs “fallback” ให้ชัด

---

# 12) Phases & Milestones (PR-by-PR)

## Phase P0 (MVP Launch)

1. Data contract + DB schema + public endpoints list (spec)
2. Sheet sync + QA report
3. Public read endpoints + export json
4. Generator spec (routes, template slots, SEO tags)
5. Lead endpoint + LINE OA + Email + thank-you page
6. Deploy run + manifest + rollback

## Phase P1

* Map search (optional)
* More landing pages (tags, price buckets)
* Assign lead owner + SLA timer
* Image proxy/thumb

## Phase P2

* Owner intake (ฝากปล่อยเช่า/ขาย)
* Boost/Featured monetization
* Member/posting flow

---

## Acceptance Criteria (MVP)

* มีหน้า TH/EN: home, listing, detail สำหรับทรัพย์อย่างน้อย 50 รายการ (หรือเท่าที่มีจริง)
* ทุกหน้า indexable (view source เห็น content ครบ)
* `sitemap.xml` + `robots.txt` ใช้งานได้
* lead จาก detail ส่งเข้า LINE OA group + Email ภายใน ~5 วินาที (เงื่อนไข network ปกติ)
* มี thank-you page URL และบันทึก lead/event ใน DB
* QA report แสดงรายการที่ publish ไม่ได้พร้อม reason codes

---
