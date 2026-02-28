# A5 Property Listing Rules + Copy Sign-off (v1)

Date: 2026-02-28  
Scope: `/en|th/buy`, `/en|th/rent`, `/en|th/investment`, `/en|th/marketplace`  
Runtime copy pack id: `a5-listing-v1-2026-02-28`

## Status

- Engineering: Implemented in runtime and covered by tests.
- Product/Brand approval: Pending sign-off.

## Locked Business Rules

### Common

- Source of truth is published runtime inventory from internal DB.
- Runtime listing never emits external hotlinked media URLs.
- No fabricated pricing, metrics, source, SLA, or review numbers.
- If data is missing or invalid, page shows fallback/empty/error states.

### Buy (`/buy`)

- Include only `Property.status = active`.
- Include only sale inventory: `Property.type in (new, resale)`.

### Rent (`/rent`)

- Include only `Property.status = active`.
- Include only rental inventory: `Property.type = rent`.

### Investment (`/investment`)

- Include only `Property.status = active`.
- Include only sale inventory: `Property.type in (new, resale)`.
- Must pass listing quality gate:
  - `price > 0`
  - cover media is local path (`/media/...`) via `cover_image_url` or `cover_image`
  - has location context (`area_id` or `project_id` or `city` or `address`)
- Project linkage rule:
  - listing project must be published
  - linked project must have `investment_snapshot.source` and `investment_snapshot.updated_at`
- If no listing passes these conditions, show empty state only (no fabricated substitute).

### Marketplace (`/marketplace`)

- Include only `Property.status = active`.
- Include both sale and rent inventory (`new`, `resale`, `rent`).
- Must pass listing quality gate:
  - `price > 0`
  - cover media is local path (`/media/...`) via `cover_image_url` or `cover_image`
  - has location context (`area_id` or `project_id` or `city` or `address`)

## Final Copy Pack (EN/TH)

### EN

- Buy:
  - Page title: `Buy Property in Pattaya`
  - Intro: `Browse active sale listings with local media, practical filters, and direct next-step support.`
  - Hero title: `Buy Listings`
  - Hero sub: `Compare ownership-ready listings with clear pricing and key unit facts.`
  - Rule note: `Buy rules: active sale listings (new/resale), local media covers, no fabricated claims.`
- Rent:
  - Page title: `Rent Property in Pattaya`
  - Intro: `Browse active rental listings with local media and move-in focused filters.`
  - Hero title: `Rent Listings`
  - Hero sub: `Filter by budget, room count, and area to shortlist your next rental.`
  - Rule note: `Rent rules: active rental listings only, local media covers, no fabricated claims.`
- Investment:
  - Page title: `Investment Property in Pattaya`
  - Intro: `Browse investment-ready sale listings that pass data quality and source-timestamp checks.`
  - Hero title: `Investment Listings`
  - Hero sub: `View sale listings tied to projects with published investment snapshot source and update date.`
  - Rule note: `Investment rules: active sale listings + local cover media + project investment_snapshot.source and updated_at.`
- Marketplace:
  - Page title: `Property Marketplace in Pattaya`
  - Intro: `Browse active buy and rent inventory in one page with unified filters and consultation paths.`
  - Hero title: `Marketplace Listings`
  - Hero sub: `Browse all active listings with local media and transparent listing facts.`
  - Rule note: `Marketplace rules: active listings across buy/rent that pass local media and listing quality gates.`
- Shared controls:
  - CTA: `Request Consultation`, `Open Smart Finder`
  - Loading: `Loading listings`
  - Empty: `No listings match the current filters. Adjust filters or request consultation.`
  - Query error: `Some query parameters were invalid. Default values were used where possible.`
  - Runtime error: `Unable to process this interaction right now. Please reload and try again.`

### TH

- Buy:
  - Page title: `ซื้ออสังหาในพัทยา`
  - Intro: `ดูรายการขาย active พร้อม local media ตัวกรองที่ใช้งานจริง และเส้นทางปรึกษาที่ชัดเจน`
  - Hero title: `รายการสำหรับซื้อ`
  - Hero sub: `เปรียบเทียบรายการที่พร้อมถือครองด้วยราคาและข้อมูลยูนิตที่ชัดเจน`
  - Rule note: `กติกา Buy: แสดงเฉพาะรายการขาย active (new/resale) ที่มี local cover และไม่ใส่ข้อมูลที่สร้างขึ้น`
- Rent:
  - Page title: `เช่าอสังหาในพัทยา`
  - Intro: `ดูรายการเช่า active พร้อม local media และตัวกรองเพื่อวางแผนย้ายเข้า`
  - Hero title: `รายการสำหรับเช่า`
  - Hero sub: `กรองตามงบ จำนวนห้อง และทำเลเพื่อ shortlist สำหรับการเช่า`
  - Rule note: `กติกา Rent: แสดงเฉพาะรายการเช่า active ที่มี local cover และไม่ใส่ข้อมูลที่สร้างขึ้น`
- Investment:
  - Page title: `อสังหาเพื่อการลงทุนในพัทยา`
  - Intro: `ดูรายการขายเพื่อการลงทุนที่ผ่าน quality gate และมี source/timestamp สำหรับข้อมูลลงทุน`
  - Hero title: `รายการเพื่อการลงทุน`
  - Hero sub: `แสดงเฉพาะรายการขายที่เชื่อมกับโครงการซึ่งมี investment snapshot พร้อมแหล่งที่มาและวันที่อัปเดต`
  - Rule note: `กติกา Investment: รายการขาย active + local cover + โครงการต้องมี investment_snapshot.source และ updated_at`
- Marketplace:
  - Page title: `มาร์เก็ตเพลสอสังหาในพัทยา`
  - Intro: `รวมรายการซื้อและเช่า active ในหน้าเดียว ด้วยตัวกรองเดียวกันและเส้นทางปรึกษาที่ชัดเจน`
  - Hero title: `รายการใน Marketplace`
  - Hero sub: `ดูรายการ active ทั้งหมดด้วย local media และข้อมูลทรัพย์ที่โปร่งใส`
  - Rule note: `กติกา Marketplace: รวมรายการ active buy/rent ที่ผ่าน local media และ quality gate ของ listing`
- Shared controls:
  - CTA: `ขอคำปรึกษา`, `เปิด Smart Finder`
  - Loading: `กำลังโหลดรายการ`
  - Empty: `ไม่พบรายการที่ตรงกับตัวกรองนี้ ลองปรับตัวกรองหรือขอคำปรึกษา`
  - Query error: `พารามิเตอร์บางรายการไม่ถูกต้อง ระบบใช้ค่าเริ่มต้นแทน`
  - Runtime error: `ยังไม่สามารถประมวลผลได้ในขณะนี้ กรุณารีเฟรชแล้วลองใหม่`

## Sign-off Checklist

- [ ] Product owner approves inventory rules for investment and marketplace.
- [ ] Brand/content owner approves copy pack EN/TH.
- [ ] Legal/compliance confirms no claim conflicts.
- [ ] Engineering updates copy pack id on next approved revision.
