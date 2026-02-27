## Mobile Responsive Blueprint v0.1 — amppattaya.com (Mobile-first, Speed-to-Lead)

### Objective (P0)

* มือถือเป็น “ช่องทางปิด lead หลัก” → **ติดต่อได้ 1 คลิก**
* หน้าโหลดไว, ไม่ต้องซูม, ไม่ต้องเลื่อนหา CTA
* Layout ไม่พังทุก breakpoint สำคัญ (360–430px เป็นหลัก)

### Non-goals (P0)

* ทำ native app, animation หนัก, complex gestures

---

# 1) Breakpoints & Layout Rules (มาตรฐานที่บังคับใช้)

## Breakpoints

* **XS:** 320–359px (เผื่อเครื่องเล็ก)
* **S:** 360–389px (ส่วนใหญ่)
* **M:** 390–430px (iPhone Pro/Android รุ่นใหม่)
* **Tablet:** 768px+
* **Desktop:** 1024px+

## Global rules

* Container padding: **16px** (XS=12px)
* Tap targets: **≥44px height**
* Body font: **16px** minimum (กัน Safari zoom)
* Line height: 1.5
* No horizontal scroll (ห้าม overflow-x)
* Images ต้องมี `width/height` หรือ aspect ratio กัน CLS

---

# 2) Mobile Navigation Blueprint

## Header (sticky)

* แถวเดียว: Logo (ซ้าย) + Language switch + Hamburger
* Hamburger เปิดเป็น **full-height drawer**

  * Rent / Buy / Areas / Contact
  * CTA “Chat on LINE” อยู่บนสุดของ drawer

## Language switch (P0)

* ปุ่มสั้น “TH / EN”
* ต้องพาไป URL คู่กัน (alternate URL) เสมอ

---

# 3) Sticky Conversion Bar (Must-have)

**แสดงบนมือถือทุกหน้า Listing + Detail**

### Layout (Bottom fixed)

* ปุ่ม 2–3 ปุ่ม:

  1. **LINE (Primary)** — กว้างสุด
  2. Call (Secondary)
  3. (Optional) “Request” scroll ไปฟอร์ม

### Behavior

* ซ่อนเมื่อผู้ใช้กำลังพิมพ์ใน input (กันบังคีย์บอร์ด)
* ถ้าอยู่ในส่วนฟอร์มแล้ว → เปลี่ยนปุ่มเป็น “Submit lead” (optional P1)

### Tracking

* `click_line`, `click_call` ส่ง `/v1/events`

**KPI impact:** speed-to-lead ↑, CVR ↑

---

# 4) Home (Mobile-first Layout)

## Above-the-fold (ไม่เกิน 1.5 screen)

1. Title + value line (สั้นมาก)
2. Search module

   * Rent/Buy toggle (segmented control)
   * Type dropdown
   * Area dropdown
   * Budget min/max (หรือ preset chips)
   * Beds (chips)
   * CTA “Search”
3. Quick chips (2 แถวพอ)

   * “Available now”, “Sea view”, “Pet friendly”, “Near beach”

## Below-the-fold

* Featured carousel (เลื่อนซ้าย-ขวา) หรือ grid 2 คอลัมน์
* Areas grid 2 คอลัมน์
* Trust strip: “ตอบไวใน X นาที” + LINE icon

**Mobile rule:** ห้ามยัดฟิลเตอร์ยาวบน home

---

# 5) Listing Page (Mobile UX Blueprint)

## 5.1 Top bar (sticky optional)

* “X results” + Sort + Filter button
* Filter เปิดเป็น **bottom sheet**

  * สูง ~80% ของจอ
  * มี Apply / Reset ชัดเจนด้านล่าง (sticky)

## 5.2 Filters (P0 set บนมือถือ)

* Intent toggle (rent/sale)
* Area (searchable dropdown)
* Type
* Price range (min/max + preset chips)
* Beds chips
* Rent-specific quick toggles:

  * Available now
  * Pet friendly
  * Furnished

**UX rule:** ฟิลเตอร์ต้อง “พับได้” (accordion) อย่าให้ยาวจนท้อ

## 5.3 Results grid

* มือถือ: **1 คอลัมน์**
* Card ต้องมี:

  * รูป + badge
  * ราคาใหญ่
  * facts row
  * ปุ่ม LINE/Call (เล็ก) หรือใช้ sticky bar เป็นหลัก

## 5.4 Pagination

* P0: “Load more” ปุ่มใหญ่ + loading state
* มี “Back to top” floating button เมื่อเลื่อนเกิน 2 screens

---

# 6) Detail Page (Mobile Conversion Blueprint)

## 6.1 Above-the-fold (ต้องครบก่อนเลื่อน)

* Title (สั้น)
* Area + key tags
* Price (ใหญ่มาก)
* Chips: beds/baths/sqm + Available date
* Gallery preview (รูปแรกใหญ่ + count)

## 6.2 Gallery UX

* เปิด full-screen viewer
* Swipe ได้
* แสดง “19 photos” / “Video” ถ้ามี

## 6.3 Content blocks (mobile-friendly)

* Highlights (bullet 3–6)
* Description (ย่อหน้า, มี “อ่านเพิ่ม”)
* Amenities (accordion)
* Location summary (text)
* Agent card (trust)
* Similar listings (horizontal scroll)

## 6.4 Lead form (P0)

* ไม่เกิน 3 fields (name/phone/message)
* ปุ่ม submit ใหญ่
* หลังส่ง → redirect thank-you

**Sticky bar** ต้องไม่บัง submit button (มี spacing bottom)

---

# 7) Responsive Typography & Spacing Tokens

## Font sizes (mobile)

* H1: 22–26
* H2: 18–20
* Body: 16
* Caption: 12–13

## Spacing scale

* 4 / 8 / 12 / 16 / 24 / 32
* Card padding: 12–16
* Section gap: 24

---

# 8) Mobile Performance Guardrails

* JS defer; ไม่ใช้ framework หนัก
* รูป:

  * lazy-load ทุกภาพยกเว้น hero/primary
  * ใช้ `srcset` ถ้าทำได้ (P1)
* จำกัดจำนวนรูปโหลดใน detail:

  * โหลด 6 รูปแรกก่อน ที่เหลือ lazy
* Skeleton UI สำหรับ load more / form submit

---

# 9) Mobile Accessibility Checklist (P0)

* contrast ผ่านมาตรฐาน (อ่านกลางแดดได้)
* focus state ชัด
* form label ครบ
* error message ใต้ field
* ปุ่ม/ลิงก์ไม่ชิดกันเกินไป (กันกดพลาด)

---

# 10) QA Test Matrix (ต้องเทสต์จริง)

## Devices widths

* 320px (iPhone SE)
* 360px (Android common)
* 390px (iPhone 13/14/15)
* 430px (Pro Max)
* 768px (iPad)

## Critical flows

* Home search → listing
* Apply filters → results change + URL update
* Open detail → click LINE/Call
* Submit lead → thank-you + LINE notify success
* Language switch on detail → ไปหน้าคู่กันถูก

---

# 11) Deliverables (สิ่งที่ต้องมีใน P0)

1. Sticky bottom CTA component (Listing/Detail)
2. Filter bottom sheet component (Listing)
3. Card spec (mobile)
4. Gallery viewer spec (mobile)
5. Spacing/typography tokens (ใช้ร่วมทั้งเว็บ)

---

## P0 Success Criteria (Mobile)

* จากหน้า detail: ผู้ใช้กด LINE ได้ **ภายใน 1 tap** ทุกเครื่อง
* ไม่ต้อง pinch/zoom เพื่อใช้งานฟอร์ม
* CLS ต่ำ (หน้าไม่กระโดดตอนรูปโหลด)
* ฟิลเตอร์ใช้ง่าย (Apply/Reset เห็นชัด)


