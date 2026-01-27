## Frontend Blueprint v0.1 — amppattaya.com (Static HTML/CSS/JS, TH/EN, SEO-first)

### Objectives (P0)

* หน้า **Home / Listing / Detail** เป็น **HTML indexable 100%** (ไม่พึ่ง JS render)
* UX บนมือถือ: **ติดต่อ LINE/Call ได้ 1 คลิก**
* Lead form + tracking ส่งเข้า API (FastAPI) ได้เสถียร
* TH/EN parity + canonical/hreflang ถูกต้อง
* Performance ดี (ภาพไม่หนัก, LCP/CLS คุมได้)

### Non-goals (P0)

* SPA framework, client-side routing, complex state management, member login

---

# 1) Output & File Structure (บน Hostinger)

โครงสร้างไฟล์ที่ generator จะอัปโหลด (frontend “รับของ” จาก generator)

```
/th/index.html
/en/index.html

/th/properties/index.html
/en/properties/index.html

/th/rent/condo/pattaya/index.html        (landing)
/en/rent/condo/pattaya/index.html

/th/property/PROP-2026-001-jomtien-1br.html
/en/property/PROP-2026-001-jomtien-1br.html

/assets/css/site.css
/assets/js/site.js
/assets/js/lead.js
/assets/js/events.js
/assets/img/...

/robots.txt
/sitemap.xml
/sitemap/index.html                       (HTML sitemap)
/th/thank-you/index.html
/en/thank-you/index.html
```

**Rule:** ทุกหน้าเป็น `index.html` ในโฟลเดอร์ (ช่วย URL สวย) ยกเว้น detail ที่ใช้ไฟล์เดียวก็ได้ แต่แนะนำเป็นโฟลเดอร์เช่นกันใน P1

---

# 2) Page Templates (Generator-driven)

Frontend มี “แม่แบบ” ที่ generator เติมข้อมูลลงไป

## 2.1 Shared layout (ทุกหน้า)

* `<head>`: title/meta/OG/canonical/hreflang/JSON-LD (detail)
* Header: logo + nav + language switch
* Footer: contact + legal + links to sitemap
* Sticky CTA (mobile): LINE + Call + Request details

## 2.2 Template: Home

Slots:

* Hero Search (form → ลิงก์ไป listing ด้วย query หรือไป landing page)
* Featured listings grid
* Area cards (link ไป landing pages)
* Quick filter chips (tags)

## 2.3 Template: Listing

Slots:

* H1 + breadcrumb (SEO)
* Filter UI (HTML controls)
* Results grid (server-rendered list of cards)
* Pagination: “Load more” หรือ static pages (`page/2/`) (เลือก 1 แบบให้ชัด)
* Lead capture block: “ให้ทีมช่วยหาให้” (form lead แบบไม่มี property_id)

**Important:** ผลลัพธ์ต้องอยู่ใน HTML แล้ว ไม่ใช่ JS fetch มา render

## 2.4 Template: Detail

Slots:

* Gallery + primary image
* Price + key facts + badges + last updated
* Description + amenities + location summary
* Agent block (ถ้ามี)
* Similar listings
* Lead form (property_id hidden)
* JSON-LD schema ใน head

## 2.5 Template: Thank-you

* ข้อความยืนยัน + CTA กลับไปดู listing
* (Optional) FAQ สั้น ๆ “ทีมจะติดต่อภายใน…”

---

# 3) UX Components Spec (P0)

## 3.1 Listing Card

ต้องสแกนได้ใน 2 วิ:

* Primary image (lazy)
* Price (ใหญ่สุด)
* Title: `<beds>BR <type> — <area>`
* Facts row: beds/baths/sqm
* Updated date
* Badges: Featured / New / Price drop / Available now
* Mini CTAs: LINE / Call (mobile-friendly)

## 3.2 Sticky CTA (Mobile)

แสดงใน Listing + Detail:

* Primary: LINE OA deep link
* Secondary: `tel:` link
* Optional: scroll to lead form

**Event:** `click_line`, `click_call`

## 3.3 Filter UX (Listing)

* Mobile: filter เป็น bottom sheet (เปิด/ปิดเร็ว)
* Desktop: sidebar
* Apply/Reset ชัดเจน
* URL reflect filters (query string) เพื่อ share ได้

---

# 4) SEO Contract (Frontend responsibilities)

## 4.1 URL strategy

* TH: `/th/...`
* EN: `/en/...`
* Landing pages แบบพยางค์ชัด: `/th/rent/condo/jomtien/1-bedroom/`

## 4.2 Head tags (ทุกหน้า)

* `<title>` ไม่ซ้ำ + มี intent/area/type
* `meta description` ไม่เกิน ~155–160 chars
* `canonical` ชี้ไป URL ภาษาตัวเอง
* `hreflang` cross-language + `x-default`
* OG/Twitter: title/desc/image/url

## 4.3 Detail JSON-LD (P0)

* `@type`: RealEstateListing / Offer
* price, address/area, floorSize, numberOfRooms (ถ้ามี), image
* dateModified = date_updated

## 4.4 Internal linking

* Home → top areas + top intents
* Listing → landing links (studios/1BR/cheap/…)
* Detail → area landing + similar listings
* Footer → HTML sitemap

---

# 5) Performance Blueprint (P0 budgets)

* CSS: 1 ไฟล์หลัก (minified)
* JS: 2–3 ไฟล์เล็ก (defer)
* Images:

  * primary image: preload (เฉพาะ detail)
  * ใช้ `loading="lazy"` ทุกภาพด้านล่าง
  * ระบุ `width/height` ลด CLS
* Fonts: 1 family, preload subset
* No heavy libraries (P0)

---

# 6) Frontend ↔ Backend Integration (P0)

## 6.1 Config

ใน `/assets/js/config.js` หรือ inline:

* `API_BASE_URL` (เช่น `https://api.amppattaya.com`)
* `SITE_LANG` (`th|en` per page)
* `SITE_VERSION` (สำหรับ cache busting)

## 6.2 Lead submission

* Form POST ไป `POST /v1/leads`
* Required:

  * `property_id` (ถ้ามาจาก detail)
  * `lang`, `name`, `phone`, `message`, `page_url`
  * `utm_*` (อ่านจาก URL)
  * honeypot `hp` (ต้องว่าง)

**UX**

* disable submit button + loading state
* on success → redirect ไป `/th/thank-you/?lead_id=...`

## 6.3 Event tracking

* `POST /v1/events`
* fire on:

  * page view detail (P0: 1 event)
  * click_line/call
  * lead_submit success

**Rule:** ถ้า API ล่ม → ไม่ block UX (fail silently + log console)

---

# 7) Language Switch (TH/EN)

* ปุ่มสลับภาษา “ต้องพาไปหน้าคู่กัน” เสมอ
* Generator ใส่ลิงก์ alternate:

  * `data-alt-url="/en/property/..."` เป็นต้น
* ถ้าไม่มีคู่ → fallback ไป `/en/` หรือ `/th/`

---

# 8) Content Rules (Trust & Compliance)

* ห้าม claim เกินจริง
* แสดง “Updated last” ทุก listing card และ detail
* Anti-scam note ที่ footer หรือ detail block
* เบอร์โทร/LINE ต้องเป็นของบริษัท/ทีม (ไม่ให้หลุดไป agent random ใน P0)

---

# 9) QA Checklist (ก่อนปล่อย)

## SEO

* View Source เห็น content ครบ
* canonical/hreflang ถูก
* sitemap.xml มี URL TH/EN ครบ

## UX

* มือถือ: CTA ติดล่างใช้งานจริง
* ฟอร์มส่งได้ + thank-you page
* filters ใช้ง่าย (ไม่ต้องซูม/เลื่อนเยอะ)

## Performance

* รูปไม่หนัก (มี lazy)
* หน้า detail ไม่กระตุก (CLS ต่ำ)

---

# 10) Deliverables (P0)

1. Template set: `home.html`, `listing.html`, `detail.html`, `thankyou.html`
2. Static assets: `site.css`, `lead.js`, `events.js`, icons
3. Generator hooks: placeholder slots + data attributes สำหรับ alt language URL
4. Tracking spec: event names + payload schema

---

# 11) Risks / Trade-offs

* **Static + many pages** → จำนวนไฟล์เยอะ

  * แก้: incremental build + manifest + delete-orphan strategy
* **Drive images** → ช้า/ไม่คงที่

  * แก้ P0: lazy + limit images above fold
  * P1: thumbnail/CDN

---

## PR Summary (frontend-focused) ที่ควรทำต่อ

1. **PR#1: Template contract** (slots + head tags + components list)
2. **PR#2: Assets** (CSS + JS lead/events + sticky CTA)
3. **PR#3: Listing filter UI** (HTML + query sync + event hooks)
4. **PR#4: Detail gallery + schema/OG** (no heavy libs)
