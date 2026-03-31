# Homepage Implementation Task List

อัปเดต: 2026-04-01 06:00 ICT  
เป้าหมาย: แปลง audit หน้าโฮมให้เป็นรายการแก้จริงรายไฟล์ พร้อม validation ที่ต้องรันหลังแต่ละรอบ

## สถานะล่าสุด

- สถานะรวม: `Homepage redesign closed`
- คะแนนล่าสุดหลัง visual/copy passes: `99/100`
- Validation ล่าสุด:
  - [x] `npm run test -- __tests__/contact_form_validation.test.tsx __tests__/lead_form_custom_intro.test.tsx __tests__/lead_form_handoff_payload.test.tsx __tests__/home_bottom_cta_conversion_gate.test.tsx __tests__/home_design_surface_contract.test.ts __tests__/home_surface_handoff_contract.test.ts __tests__/home_hero_cta_hierarchy.test.tsx __tests__/featured_projects_th_copy.test.tsx __tests__/public_catalogue_th_copy.test.tsx __tests__/public_prefetch_policy.test.ts`
  - [x] `npm run build`
  - [x] `npm run test:visual:public` ที่ `/en,/th,/en/projects,/th/projects` บน `390 / 1024 / 1440`
- สถานะงาน:
  - [x] Hero reset
  - [x] Heading and copy compression
  - [x] Featured projects layout reset
  - [x] Curated units reset
  - [x] Why Pattaya / trust reframing
  - [x] Owner route + final CTA consolidation
  - [x] Footer reduction
  - [x] Mobile rhythm pass
- งานปิดเพิ่มในรอบสุดท้าย:
  - [x] rewrite `summary` ระดับ data ของทุกโครงการใน [projects.json](/d:/FlowBiz/flowbiz-client-amp/data/import/projects.json)
  - [x] ย่อ field ของ homepage form ลงเป็น compact variant
  - [x] เก็บ warning ของ `next/image` ใน test/build path
- งานค้างระดับต่ำ:
  - [ ] ไม่มีงาน redesign ค้างในชุดนี้

## ใช้อย่างไร

- เรียงงานตามลำดับด้านล่าง
- แต่ละ block ระบุ `เป้าหมาย`, `ไฟล์ที่ต้องแตะ`, `งานย่อย`, และ `validation`
- ถ้าจะแก้เป็น pass แบบ incremental ให้ทำตามลำดับ `P0 -> P1 -> P2 -> P3`

## P0. Hero Reset

สถานะ: `DONE`

### เป้าหมาย

- ล็อก promise หลักของหน้าให้คงที่
- ลดความแน่นของ hero
- ทำให้ mobile first-view ชัดขึ้น

### ไฟล์ที่ต้องแก้

- [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx)
- [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx)
- [globals.css](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/globals.css)
- [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts)
- [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts)

### งานย่อย

- [x] ทำให้ H1 คงที่ทุก slide
- [x] จำกัด slide ให้เปลี่ยนเฉพาะภาพ, eyebrow, supporting line
- [x] ลดข้อความใน hero เหลือ `headline + subtitle + 2 CTA + WhatsApp link`
- [x] เพิ่ม safe padding ของ hero text block
- [x] ลดน้ำหนัก arrows/dots
- [x] ลดความสูงเชิง visual ของ hero panel
- [x] เอา phrase ซ้ำแนว `clearer / first / route` ออกจาก hero copy
- [x] ตรวจให้ CTA หลักยังเห็นใน first viewport ที่ `390px`

### Validation

- [x] `npm run test -- __tests__/home_hero_cta_hierarchy.test.tsx __tests__/home_design_surface_contract.test.ts`
- [x] browser QA `/en` และ `/th` ที่ `390 / 1024 / 1440`
- [x] วัดว่า H1 ไม่เปลี่ยนตาม slide

## P1. Headings and Copy Compression

สถานะ: `DONE`

### เป้าหมาย

- ลดความเป็น funnel language
- ทำให้ทุก section title และ subtitle สั้นลง
- ลบคำซ้ำที่ทำให้ทั้งหน้าดูเป็น framework

### ไฟล์ที่ต้องแก้

- [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx)
- [HomeMobileIntentRail.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeMobileIntentRail.tsx)
- [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx)
- [HomeBottomCta.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeBottomCta.tsx)
- [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts)
- [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts)

### งานย่อย

- [x] rewrite section titles ทั้งหน้าให้ไม่เกิน `2 บรรทัด`
- [x] rewrite subtitles ให้เหลือ `1-2 บรรทัด`
- [x] ลบคำซ้ำ `start / first / route / clearer / worth opening`
- [x] rewrite journey cards ให้เหลือ `who + outcome + CTA`
- [x] rewrite trust section ให้สั้นลง
- [x] rewrite Why Pattaya ให้เป็นภาษาที่ใช้งานได้จริง
- [x] rewrite owner route ให้ไม่ซ้ำกับ final CTA
- [x] rewrite final CTA ให้สงบขึ้น

### Validation

- [x] `npm run test -- __tests__/featured_projects_th_copy.test.tsx __tests__/home_bottom_cta_conversion_gate.test.tsx`
- [x] manual content pass `/en` และ `/th`
- [x] ไม่มีหัวข้อไหนยาวเกิน 2 บรรทัดบน mobile โดยไม่ตั้งใจ

## P2. Featured Projects Layout and Card System

สถานะ: `DONE`

### เป้าหมาย

- ทำให้ featured projects อ่านง่ายบน mobile
- ลดความสูง card
- ทำให้ summary แต่ละโครงการเฉพาะตัวจริง

### ไฟล์ที่ต้องแก้

- [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx)
- [projects/page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/projects/page.tsx)
- [globals.css](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/globals.css)
- [projects.json](/d:/FlowBiz/flowbiz-client-amp/data/import/projects.json)

### งานย่อย

- [x] เปลี่ยน mobile featured projects ให้ใช้ layout สม่ำเสมอ
- [x] ลด image ratio ของ project cards
- [x] ตัด pattern การ์ดใหญ่/เล็กปนกันถ้ายังมี
- [x] ทำ summary sourcing ตามลำดับ `summary -> description first sentence -> factual fallback`
- [x] rewrite summary ของ 12 โครงการให้แทนกันไม่ได้
- [x] ถ้าโครงการใดไม่มี summary ที่ดีพอ ให้ซ่อน summary แล้วใช้ facts แทน
- [x] เหลือ CTA ต่อการ์ดเพียง `ดูโครงการ / View project`

### Validation

- [x] `npm run test -- __tests__/featured_projects_th_copy.test.tsx __tests__/public_catalogue_th_copy.test.tsx`
- [x] visual QA `/en` และ `/th/projects` ที่ `390 / 1024 / 1440`
- [x] ตรวจว่าไม่เหลือ filler copy ซ้ำใน surface layer

## P3. Curated Units Reset

สถานะ: `DONE`

### เป้าหมาย

- ลดความแน่นของ units section
- แยก perception resale กับ rent
- ทำให้ cards เบาและอ่านเร็วขึ้น

### ไฟล์ที่ต้องแก้

- [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx)
- [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx)
- [globals.css](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/globals.css)

### งานย่อย

- [x] แยก resale และ rent ให้ชัดกว่าเดิม
- [x] ลด image ratio ของ unit cards
- [x] ลดข้อมูลใน card ให้เหลือเฉพาะ facts ที่จำเป็น
- [x] ทำ title format ให้เป็นธรรมชาติมากขึ้น
- [x] ทำให้ grid/scroller ของ units เหมาะกับ `390px`
- [x] ตรวจว่าการ์ดที่ข้อมูลไม่ครบไม่ทำให้ layout กระโดด

### Validation

- [x] `npm run test -- __tests__/home_design_surface_contract.test.ts`
- [x] visual QA หน่วยขาย/เช่าบน homepage ที่ `390 / 1024 / 1440`

## P4. Why Pattaya and Trust Reframing

สถานะ: `DONE`

### เป้าหมาย

- เปลี่ยน section จาก abstract strategy เป็น buyer-useful guidance
- ลด process-heavy feeling

### ไฟล์ที่ต้องแก้

- [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx)
- [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts)
- [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts)

### งานย่อย

- [x] เปลี่ยน title ของ Why Pattaya ให้ concrete มากขึ้น
- [x] rewrite demand/submarket/entry-range blocks ให้ช่วยตัดสินใจจริง
- [x] ลดหรือย่อ process panel ด้านขวา
- [x] ทำ trust strip ให้เบากว่า featured sections

### Validation

- [x] browser QA ว่าทั้ง section อ่านจบเร็วขึ้น
- [x] ไม่ใช้คำแบบ framework-heavy เกินจำเป็นใน surface หลัก

## P5. Owner Route + Final CTA Consolidation

สถานะ: `DONE`

### เป้าหมาย

- ลดการปิดการขายซ้ำ
- ให้ owner path กับ final contact path คนละบทบาทชัด

### ไฟล์ที่ต้องแก้

- [HomeBottomCta.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeBottomCta.tsx)
- [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx)
- [globals.css](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/globals.css)

### งานย่อย

- [x] ย่อ owner section ให้สั้นลง
- [x] ยุบ final CTA ให้เหลือประโยคสั้นและประโยชน์ชัด
- [x] ตัด sales checklist ที่ไม่จำเป็น
- [x] ลดฟิลด์ของ homepage form ลงเป็น compact variant
- [x] ทำให้ direct contact options เบากว่าฟอร์ม

### Validation

- [x] `npm run test -- __tests__/home_bottom_cta_conversion_gate.test.tsx`
- [x] browser QA ว่าช่วงล่างของหน้าไม่หนักเกิน

## P6. Footer Reduction

สถานะ: `DONE`

### เป้าหมาย

- ทำให้ปลายหน้าจบอย่างสงบ
- ลด content ซ้ำจากเนื้อหาด้านบน

### ไฟล์ที่ต้องแก้

- [Footer.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/Footer.tsx)
- [globals.css](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/globals.css)
- [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts)
- [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts)

### งานย่อย

- [x] ลด brand statement ให้สั้นลง
- [x] คงเฉพาะ core routes
- [x] ลดความซ้ำของ advisory/contact copy
- [x] ปรับ spacing footer ให้กระชับขึ้น

### Validation

- [x] browser QA ปลายหน้า mobile
- [x] ไม่มีความรู้สึกว่าหน้ายังขายต่อไม่ยอมจบ

## P7. Mobile Rhythm and Visual Density Pass

สถานะ: `DONE`

### เป้าหมาย

- ทำให้ทั้งหน้าให้ความรู้สึก mobile-first จริง
- เก็บ spacing และ visual hierarchy รอบสุดท้าย

### ไฟล์ที่ต้องแก้

- [globals.css](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/globals.css)
- [Header.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/Header.tsx)
- [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx)
- [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx)
- [HomeBottomCta.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeBottomCta.tsx)
- [projects/page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/projects/page.tsx)

### งานย่อย

- [x] จัด section spacing ให้มี cadence เดียวกัน
- [x] ลด card height ทั้ง projects และ units
- [x] ตรวจว่าไม่มีหัวข้อใดเกิน 2 บรรทัดโดยไม่ตั้งใจ
- [x] ตรวจว่าไม่มีพื้นที่ว่างเหนือรูปที่เสียเปล่า
- [x] ตรวจว่าปุ่มทุกจุดกดง่าย
- [x] ตรวจว่าไม่มีสัญลักษณ์ `+` หลุดอยู่ทั้ง homepage และ `/projects`

### Validation

- [x] `npm run test -- __tests__/public_prefetch_policy.test.ts`
- [x] browser QA `/en`, `/th`, `/en/projects`, `/th/projects` ที่ `390 / 1024 / 1440`

## Suggested Execution Order

1. [x] `P0 Hero Reset`
2. [x] `P1 Headings and Copy Compression`
3. [x] `P2 Featured Projects Layout and Card System`
4. [x] `P3 Curated Units Reset`
5. [x] `P4 Why Pattaya and Trust Reframing`
6. [x] `P5 Owner Route + Final CTA Consolidation`
7. [x] `P6 Footer Reduction`
8. [x] `P7 Mobile Rhythm and Visual Density Pass`

## Suggested Next Step

1. monitor live behavior หลัง deploy
2. เก็บ content maintenance ตามรอบข้อมูลจริงของโครงการ
3. แยก optimisation pass อื่นออกจากงาน redesign ชุดนี้

## Definition of Done

- [x] H1 คงที่ทุก slide
- [x] ทุก heading สำคัญไม่เกิน 2 บรรทัดบน mobile
- [x] featured project cards ไม่มี template summary ซ้ำใน surface layer
- [x] curated units section ไม่แน่นหรือรกบน `390px`
- [x] owner route และ final CTA ไม่ซ้ำหน้าที่กัน
- [x] homepage form สั้นพอสำหรับหน้าแรก
- [x] summary ของทั้ง 12 โครงการถูก rewrite ใน data layer แล้ว
- [x] warning ของ `next/image` ที่เกี่ยวกับหน้าโฮมไม่ค้างใน test/build path
- [x] footer จบหน้านิ่งและสั้นลง
- [x] `/en` และ `/th` ให้ความรู้สึก advisory/editorial มากกว่า sales push
- [x] checklist ในไฟล์ audit ถูกใช้ปิดงาน critical ส่วนบนของหน้าแล้ว
