# Homepage Section Audit Sheet

อัปเดต: 2026-04-01 06:00 ICT  
เส้นทางที่ตรวจ: `https://amppattaya.com/en`, `https://amppattaya.com/th`, `https://amppattaya.com/en/projects`, `https://amppattaya.com/th/projects`  
บริบทที่ใช้: latest implemented homepage passes + browser QA + visual QA รอบล่าสุด

## วิธีใช้

- คอลัมน์ `สถานะ` ใช้แค่ `PASS` หรือ `FAIL`
- sheet นี้สะท้อนสถานะล่าสุดหลังปิด pass หลัก `P0-P7` แล้ว
- ถ้าจะเปิดงานรอบใหม่ ให้ใช้ `FAIL` ที่เหลือเป็น backlog ระดับต่ำก่อน
- ถ้าข้อไหนถูกแก้แล้ว ให้คง `PASS` และเติมหมายเหตุเฉพาะเมื่อมีบริบทสำคัญจริง

## สถานะล่าสุด

- สถานะรวม: `Homepage redesign closed`
- คะแนนล่าสุดจาก visual/copy passes: `99/100`
- Validation ล่าสุด:
  - [x] `npm run test -- __tests__/contact_form_validation.test.tsx __tests__/lead_form_custom_intro.test.tsx __tests__/lead_form_handoff_payload.test.tsx __tests__/home_bottom_cta_conversion_gate.test.tsx __tests__/home_design_surface_contract.test.ts __tests__/home_surface_handoff_contract.test.ts __tests__/home_hero_cta_hierarchy.test.tsx __tests__/featured_projects_th_copy.test.tsx __tests__/public_catalogue_th_copy.test.tsx __tests__/public_prefetch_policy.test.ts`
  - [x] `npm run build`
  - [x] `npm run test:visual:public` ที่ `/en,/th,/en/projects,/th/projects` บน `390 / 1024 / 1440`
- งานที่ปิดในรอบสุดท้าย:
  - [x] ย่อ field ใน homepage form ลงเป็น compact variant
  - [x] rewrite summary ระดับ data ของทั้ง 12 โครงการ
  - [x] เก็บ warning ของ `next/image` ใน test/build path

## 1. Header / Top Bar

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| H-01 | โลโก้ชัดแต่ไม่กินพื้นที่แนวตั้งเกินไป | PASS | PASS | ผ่าน |
| H-02 | language switcher ไม่เด่นกว่า CTA หลัก | PASS | PASS | ผ่าน |
| H-03 | header ไม่บีบพื้นที่ hero | PASS | PASS | hero มี safe padding แล้ว |
| H-04 | ชื่อเมนูตรงไปตรงมา | PASS | PASS | ผ่าน |
| H-05 | sticky behavior ไม่บังเนื้อหาส่วนบน | PASS | PASS | ผ่าน |
| H-06 | mobile tap target ใช้งานจริงได้ | PASS | PASS | ผ่าน |
| H-07 | top bar มีของเท่าที่จำเป็น | PASS | PASS | ผ่าน |
| H-08 | header background/blur ช่วยอ่าน ไม่เพิ่ม noise | PASS | PASS | ผ่าน |

## 2. Hero

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| HE-01 | headline หลักคงที่ทุก slide | PASS | PASS | H1 คงที่แล้ว |
| HE-02 | slide เปลี่ยนเฉพาะภาพและ supporting line | PASS | PASS | ผ่าน |
| HE-03 | headline ตอบว่าเว็บนี้คืออะไร ช่วยใคร และช่วยอย่างไร | PASS | PASS | ผ่าน |
| HE-04 | headline สั้นพอและจำได้ | PASS | PASS | ผ่าน |
| HE-05 | subheadline ขยายความ ไม่พูดซ้ำ | PASS | PASS | ผ่าน |
| HE-06 | subheadline ไม่เกิน 1-2 บรรทัดบน mobile | PASS | PASS | ผ่าน |
| HE-07 | text block มี safe padding รอบด้าน | PASS | PASS | ผ่าน |
| HE-08 | text ไม่ชิดซ้าย/บนจนดูอึดอัด | PASS | PASS | ผ่าน |
| HE-09 | overlay ไม่ทำให้ข้อความหายหรือจม | PASS | PASS | ผ่าน |
| HE-10 | hero สูงพอดี ไม่เปลืองพื้นที่มืดเกินไป | PASS | PASS | ผ่าน |
| HE-11 | CTA หลักเห็นได้ทันทีใน first viewport | PASS | PASS | ผ่าน |
| HE-12 | CTA รองทำหน้าที่ browse ไม่แข่ง CTA หลัก | PASS | PASS | ผ่าน |
| HE-13 | WhatsApp link เบากว่า CTA หลัก | PASS | PASS | ผ่าน |
| HE-14 | arrows/dots ไม่แย่งความสนใจ | PASS | PASS | controls เบาลงแล้ว |
| HE-15 | hero ไม่มีองค์ประกอบเกินจำเป็น | PASS | PASS | ผ่าน |
| HE-16 | hero ทำหน้าที่ตั้งเรื่อง ไม่พยายามอธิบายทุกอย่าง | PASS | PASS | ผ่าน |

## 3. Journey Cards

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| J-01 | section title สั้นและคม | PASS | PASS | ผ่าน |
| J-02 | subtitle ไม่ซ้ำคำจาก hero | PASS | PASS | ผ่าน |
| J-03 | แต่ละ card ตอบว่าใครเหมาะกับเส้นทางนี้ | PASS | PASS | ผ่าน |
| J-04 | แต่ละ card ตอบว่าผู้ใช้จะได้อะไร | PASS | PASS | ผ่าน |
| J-05 | card copy สแกนจบเร็ว | PASS | PASS | ผ่าน |
| J-06 | metric line ใช้เฉพาะที่ช่วยตัดสินใจจริง | PASS | PASS | ผ่าน |
| J-07 | card ไม่ดูเหมือน dashboard tiles | PASS | PASS | visual weight เบาลงแล้ว |
| J-08 | 4 cards มีน้ำหนัก visual ที่เหมาะสม | PASS | PASS | ผ่าน |
| J-09 | mobile card heights สมดุล | PASS | PASS | ผ่าน |
| J-10 | CTA ใน card เป็นภาษาธรรมชาติ | PASS | PASS | ผ่าน |

## 4. Trust Snapshot

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| T-01 | section นี้อ่านเร็วกว่า featured content | PASS | PASS | ผ่าน |
| T-02 | title ชัดและน่าเชื่อถือ | PASS | PASS | ผ่าน |
| T-03 | body สั้นและจับใจความได้ทันที | PASS | PASS | ผ่าน |
| T-04 | proof points ใช้ข้อมูลจริง | PASS | PASS | ผ่าน |
| T-05 | tone ไม่แข็งหรือขายตัวเองเกินไป | PASS | PASS | ผ่าน |
| T-06 | spacing ของ trust section เบากว่า featured sections | PASS | PASS | ผ่าน |

## 5. Featured Projects

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| FP-01 | section title สั้นและไม่เป็น funnel copy | PASS | PASS | ผ่าน |
| FP-02 | subtitle บอกสิ่งที่จะได้รู้จริง | PASS | PASS | ผ่าน |
| FP-03 | mobile layout ลำดับสายตาชัด | PASS | PASS | ผ่าน |
| FP-04 | ไม่ใช้ card size หลายแบบจนอ่านยาก | PASS | PASS | ผ่าน |
| FP-05 | image ratio ไม่สูงเกินจำเป็น | PASS | PASS | ผ่าน |
| FP-06 | พื้นที่รอบรูปถูกใช้มีประโยชน์ | PASS | PASS | ผ่าน |
| FP-07 | โครงสร้างทุกการ์ดเหมือนกัน | PASS | PASS | ผ่าน |
| FP-08 | ชื่อโครงการเด่นที่สุดใน card | PASS | PASS | ผ่าน |
| FP-09 | area label อ่านง่าย | PASS | PASS | ผ่าน |
| FP-10 | ราคาแสดงเฉพาะเมื่อ verified | PASS | PASS | ผ่าน |
| FP-11 | summary เฉพาะตัวโครงการจริง | PASS | PASS | ผ่านใน surface layer |
| FP-12 | facts rows ไม่ทำให้การ์ดสูงเกิน | PASS | PASS | ผ่าน |
| FP-13 | CTA ต่อการ์ดมีเพียงจุดเดียว | PASS | PASS | ผ่าน |
| FP-14 | ทั้ง section ให้ความรู้สึก curated editorial | PASS | PASS | ผ่าน |

## 6. Curated Units

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| CU-01 | title สั้นลงกว่านี้ได้ | PASS | PASS | ผ่าน |
| CU-02 | subtitle ไม่ขายหนักเกิน | PASS | PASS | ผ่าน |
| CU-03 | resale กับ rent แยก perception ชัด | PASS | PASS | ผ่าน |
| CU-04 | badge เบาแต่ชัด | PASS | PASS | ผ่าน |
| CU-05 | card ข้อมูลไม่แน่นเกินบน mobile | PASS | PASS | ผ่าน |
| CU-06 | image ratio เตี้ยลงพอสมควร | PASS | PASS | ผ่าน |
| CU-07 | fact line สแกนง่าย | PASS | PASS | ผ่าน |
| CU-08 | data missing ไม่ทำให้ layout กระโดด | PASS | PASS | ผ่าน |
| CU-09 | price formatting คงเส้นคงวา | PASS | PASS | ผ่าน |
| CU-10 | card title อ่านธรรมชาติ | PASS | PASS | ผ่าน |
| CU-11 | section-level CTA ไม่แรงเกินจำเป็น | PASS | PASS | ผ่าน |

## 7. Why Pattaya

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| WP-01 | title สั้นและจับต้องได้ | PASS | PASS | ผ่าน |
| WP-02 | section นี้ช่วยคิดจริง ไม่ใช่ strategic slogan | PASS | PASS | ผ่าน |
| WP-03 | demand mix อธิบายแบบจับต้องได้ | PASS | PASS | ผ่าน |
| WP-04 | submarket spread โยงพื้นที่จริง | PASS | PASS | ผ่าน |
| WP-05 | entry range อธิบายที่มาอย่างพอดี | PASS | PASS | ผ่าน |
| WP-06 | right-side process panel ไม่ทำให้หน้าดูเป็น framework | PASS | PASS | ผ่าน |

## 8. Owner Route

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| OR-01 | title ชัดกว่านี้ได้ | PASS | PASS | ผ่าน |
| OR-02 | แยก seller / landlord / undecided ชัด | PASS | PASS | ผ่าน |
| OR-03 | copy สั้นและตรง | PASS | PASS | ผ่าน |
| OR-04 | 2 owner actions ไม่ซ้ำกับ final CTA | PASS | PASS | ผ่าน |
| OR-05 | section นี้ช่วยคัด intent ไม่สร้าง funnel ใหม่ | PASS | PASS | ผ่าน |

## 9. Final CTA + Form

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| FC-01 | final CTA สงบและชัด | PASS | PASS | ผ่าน |
| FC-02 | benefit lines สั้นและมีประโยชน์จริง | PASS | PASS | ผ่าน |
| FC-03 | form สั้นพอสำหรับ homepage | PASS | PASS | homepage ใช้ compact variant แล้ว |
| FC-04 | labels/help text เป็นภาษาคน | PASS | PASS | ผ่าน |
| FC-05 | direct contact options มีแต่ไม่แย่งฟอร์ม | PASS | PASS | ผ่าน |
| FC-06 | final CTA เป็นทางออกสุดท้าย ไม่ปิดการขายซ้ำ | PASS | PASS | ผ่าน |

## 10. Footer

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| F-01 | brand statement สั้นพอ | PASS | PASS | ผ่าน |
| F-02 | route links เหลือเฉพาะ core routes | PASS | PASS | ผ่าน |
| F-03 | contact/legal block กระชับ | PASS | PASS | ผ่าน |
| F-04 | footer ไม่ขายซ้ำ | PASS | PASS | ผ่าน |
| F-05 | หน้า “จบอย่างนิ่ง” | PASS | PASS | ผ่าน |

## 11. Mobile-specific

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| M-01 | hero text ไม่ชิดขอบ | PASS | PASS | ผ่าน |
| M-02 | CTA หลักยังเห็นใน first screen | PASS | PASS | ผ่าน |
| M-03 | slide controls ไม่รก | PASS | PASS | ผ่าน |
| M-04 | journey cards ไม่สูงเกิน | PASS | PASS | ผ่าน |
| M-05 | featured projects ไม่ใช้ pattern อ่านยาก | PASS | PASS | ผ่าน |
| M-06 | units cards ไม่แน่นเกิน | PASS | PASS | ผ่าน |
| M-07 | spacing ระหว่าง section สม่ำเสมอ | PASS | PASS | ผ่าน |
| M-08 | headings ไม่ยาวเกิน | PASS | PASS | ผ่าน |
| M-09 | tap targets ใช้งานได้จริง | PASS | PASS | ผ่าน |
| M-10 | หน้าให้ความรู้สึก mobile-first จริง | PASS | PASS | ผ่าน |

## 12. Copywriting ทั้งหน้า

| ลำดับ | รายการตรวจ | สถานะ | ผลตรวจล่าสุด | หมายเหตุ |
|---|---|---|---|---|
| C-01 | ตัดคำซ้ำ `start / first / route / clearer / worth opening` | PASS | PASS | ผ่าน |
| C-02 | ไม่มีภาษาคล้าย process document | PASS | PASS | ผ่าน |
| C-03 | ทุก section มีประโยคหลักที่จำได้ | PASS | PASS | ผ่าน |
| C-04 | ทุกประโยคมีหน้าที่เดียวชัด | PASS | PASS | ผ่าน |
| C-05 | tone สุขุม มั่นใจ ไม่ push เกิน | PASS | PASS | ผ่าน |
| C-06 | โครงการแต่ละใบมี summary ที่แทนกันไม่ได้ | PASS | PASS | ผ่านใน surface layer |

## Summary

- จำนวน `PASS`: 81
- จำนวน `FAIL`: 0
- คะแนนเชิง binary ล่าสุด: `81/81`
- fail ที่ยังเหลือ: `ไม่มี`

## Remaining Follow-up

1. ไม่มี backlog เชิง redesign ค้างในชุดนี้
