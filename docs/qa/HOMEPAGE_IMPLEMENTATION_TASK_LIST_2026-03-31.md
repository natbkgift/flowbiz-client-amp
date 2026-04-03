# Homepage Implementation Task List

อัปเดต: `2026-04-02`
บทบาทเอกสาร: `Master execution plan for dev handoff`

## Status Snapshot

- สถานะรวม: `homepage round fully closed on production live`
- คะแนน weighted ล่าสุดหลัง deploy verification:
  - `EN 86/100`
  - `TH 84/100`
  - `รวม 85/100`
- การยืนยันบน branch ปัจจุบัน:
  - targeted homepage regression suites ผ่าน
  - local public visual QA ผ่านที่ `/en` และ `/th` บน `390`, `430`, `1440`
  - local visual QA score `100` และไม่พบ critical findings ใหม่
- การยืนยันหลัง deploy เมื่อ `2026-04-02`:
  - preview deploy จาก workspace ปัจจุบันสำเร็จและ smoke ผ่าน
  - production overlay deploy ล่าสุดสำเร็จด้วย `deploy_status=ok`, `smoke_passed=true`, `duration_seconds=5925`
  - `/en` ใช้ H1 ใหม่ `Find the right Pattaya property faster`
  - `/th` ใช้ H1 ใหม่ `เลือกอสังหาพัทยาได้เร็วขึ้น ด้วย shortlist ที่คัดตามเป้าหมายของคุณ`
  - ปุ่ม `Language` จาก `/en` ไป `/th` อัปเดต `document.documentElement.lang` เป็น `th` ถูกต้องแล้ว
  - after-deploy full-page captures ที่ `390` และ `1440` ไม่พบ `overflowX` และไม่พบ console errors
  - after-media-fix probe แบบ `normal initial load + slow-3g lazy-media scroll` ไม่พบ visible incomplete card images แล้ว และปิด `HOME-P2-04`
  - side-by-side EN/TH review และ visual review หลัง deploy ตัดสินให้ `HOME-P3-01` และ `HOME-P3-02` ผ่านเกณฑ์ release และย้ายเป็น accepted non-blocking debt
- แหล่งหลักฐานที่ใช้ปิด release gate รอบนี้:
  - live browser QA ที่ `/en` และ `/th`
  - mobile viewport `390x844`
  - desktop spot-check `1440x1200`
  - DOM / metadata / accessibility spot-check
- หมายเหตุ scope:
  - `npx tsc --noEmit` ยัง fail จาก test debt นอก scope homepage
  - review/testimonial block ยัง intentionally omitted จนกว่าจะ source-ready
- contract ของเอกสาร:
  - ไฟล์นี้ authoritative สำหรับ `priority`, `sequencing`, `copy target`, `acceptance`
  - [HOMEPAGE_SECTION_AUDIT_SHEET_2026-03-31.md](d:/FlowBiz/flowbiz-client-amp/docs/qa/HOMEPAGE_SECTION_AUDIT_SHEET_2026-03-31.md) authoritative สำหรับ `live evidence` และ `PASS/FAIL by section`
  - target-state copy อยู่ในไฟล์นี้เท่านั้น
  - provenance/history อยู่ใน `Appendix` ท้ายไฟล์

## Top Blockers

- ไม่มี blocker เปิดค้างใน homepage round ปัจจุบัน
- `HOME-P3-04` ถูกปิดเป็น `closed out-of-scope for current homepage round` และยังคง omitted จนกว่าจะมี proof ที่ source-ready จริง

## Execution Workstreams

| Workstream | Goal | Includes | Current state | Primary touchpoints | Next gate |
|---|---|---|---|---|---|
| Locale semantics | แก้ semantic correctness ของ locale switching | `HOME-P0-01` | Verified on preview/live | [PublicClientEnhancements.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/PublicClientEnhancements.tsx), [Header.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/Header.tsx), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx) | closed; keep regression coverage |
| Above-the-fold conversion | ทำให้ first 2 screens ชัดและเชื่อได้เร็วขึ้น | `HOME-P1-01` ถึง `HOME-P1-04` | Verified on preview/live | [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx), [Header.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/Header.tsx), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx), [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts), [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts) | closed; retain screenshot artifacts |
| Featured content + form accessibility | ลด listing-feed feel และยกระดับ form semantics | `HOME-P2-01` ถึง `HOME-P2-05` | `HOME-P2-01` ถึง `HOME-P2-05` verified on preview/live; `HOME-P2-04` passed after media-loading tune + redeploy recheck | [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx), [HomeBottomCta.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeBottomCta.tsx), [LeadForm.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/forms/LeadForm.tsx), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx) | closed for homepage round |
| Voice and polish alignment | ล็อก EN/TH parity และ section framing ให้คงเส้น | `HOME-P3-01` ถึง `HOME-P3-04` | `HOME-P3-01`, `HOME-P3-02`, `HOME-P3-03` pass release threshold on deployed live; `HOME-P3-04` closed out-of-scope and omitted by design | [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts), [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts), [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx), [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx) | closed for homepage round |

## Release Closeout Order

1. ปิด `HOME-P2-04` หลัง media-loading tune + redeploy recheck บน production live
2. ปิด `HOME-P3-01` เป็น accepted non-blocking debt หลัง side-by-side EN/TH review
3. ปิด `HOME-P3-02` เป็น accepted non-blocking debt หลัง visual release review
4. ปิด `HOME-P3-04` เป็น out-of-scope สำหรับ homepage round นี้ และคง omitted-until-sourced

## Consolidated Issue List

| ID | Priority | Evidence IDs | Branch status | Issue | Evidence | Impact | Fix direction | Next gate | Primary touchpoints |
|---|---|---|---|---|---|---|---|---|---|
| HOME-P0-01 | P0 | `H-01` | Verified on preview/live | Client-side language switch ไม่ sync `html lang` | after-deploy live QA: `/en -> /th` ผ่านปุ่ม `Language` แล้ว `document.documentElement.lang === "th"` และ H1 ตรง locale | ปิด blocker accessibility หลักของหน้า | keep regression + deploy verification artifact ไว้ใน appendix | closed | [PublicClientEnhancements.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/PublicClientEnhancements.tsx), [Header.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/Header.tsx), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx) |
| HOME-P1-01 | P1 | `HE-01`, `C-01` | Verified on preview/live | Hero promise และ CTA ยังไม่ outcome-driven พอ | after-deploy live QA: EN ใช้ `Find the right Pattaya property faster` + `Get My Shortlist` / `Browse Verified Projects`; TH ใช้ pair ภาษาไทยตาม approved set | first impression และ CTA clarity ดีขึ้นตาม target | keep composer precedence; monitor future content drift | closed | [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx), [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts), [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts) |
| HOME-P1-02 | P1 | `T-01` | Verified on preview/live | Trust proof อยู่ต่ำเกินใน scroll | after-deploy heading order บน live คือ `H1 -> journey cards -> Verified stock first. -> featured` | hero ไม่ต้องแบก trust เดี่ยวแล้ว | keep trust snapshot in early flow | closed | [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx), [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx), [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts), [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts) |
| HOME-P1-03 | P1 | `FP-01`, `CU-01`, `FC-03`, `M-01`, `OR-02` | Verified on preview/live | หน้า mobile ยาวเกินและ featured stack กิน scroll มาก | after-deploy live QA surfacing = `4 project cards` + `6 unit cards`; owner CTA และ final form มาเร็วขึ้นจาก baseline | ลด feed feel และช่วย late CTA depth | keep 6/6 clamp and prefer omission over weak cards | closed | [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx) |
| HOME-P1-04 | P1 | `H-02`, `J-02`, `M-02` | Verified on preview/live | Text tier และ tap target บางจุดเล็กเกินบน mobile | after-deploy live QA: language button `80x44`, hero arrows `44x44`, journey meta around `12.48px` | readability และ tap confidence กลับเข้า mobile-safe range | keep mobile control thresholds in CSS regression review | closed | [Header.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/Header.tsx), [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx) |
| HOME-P2-01 | P2 | `FP-03` | Verified on preview/live | Featured content ยัง “โชว์ของ” มากกว่า “ช่วยเลือก” | after-deploy live cards now surface data-backed cues เช่น `Under THB 5M`, `Sea View option`, `Ready to move in` | featured zone ช่วยตัดสินใจมากขึ้น | keep cues data-backed only | closed | [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx), [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts), [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts) |
| HOME-P2-02 | P2 | `FC-01` | Verified on preview/live | Form semantics ยังพึ่ง custom state มากกว่า native semantics | after-deploy live DOM: `name`, `message`, `consent` ใช้ native `required`; `email`/`phone` คง shared validation pair พร้อม `aria-describedby` | browser validation และ assistive cues ดีขึ้นตรง target | keep regression suite green and rerun on future form edits | closed | [LeadForm.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/forms/LeadForm.tsx), [HomeBottomCta.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeBottomCta.tsx), [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts), [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts) |
| HOME-P2-03 | P2 | `FP-02` | Verified on preview/live | Heading hierarchy ใน featured zone ยัง noisy | after-deploy live DOM: `Verified stock first.` = `H2`, `Projects worth reviewing first` และ `Top picks for serious next steps` = `H3` | semantic outline อ่านง่ายขึ้น | keep current section hierarchy model | closed | [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx) |
| HOME-P2-04 | P2 | `CU-02` | Verified on preview/live | มี long-scroll image loading / rendering risk ใน card stack | after-media-fix production recheck แบบ `normal initial load + slow-3g lazy-media scroll` ไม่พบ visible images ที่ `complete=false` หรือ `naturalWidth=0` แล้ว | ปิด performance/perception risk หลักของ homepage ได้ครบ | keep current preload + SSR primary-start strategy; rerun only if future media policy changes | closed | [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx), [LocalMediaImage.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/media/LocalMediaImage.tsx), [SafeCoverImage.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/media/SafeCoverImage.tsx), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx) |
| HOME-P2-05 | P2 | `C-03`, `CP-01`, `CP-02` | Verified on preview/live | Home content gating ยังต้อง formalize ให้ enforce ได้จริง | after-deploy live shows no placeholder trust copy, no review block launch, and curated sets omit rather than pad weak cards | ลด risk ของ weak content regressions | keep monitoring composer/data changes after deploy | closed | [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx), [HomeBottomCta.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeBottomCta.tsx) |
| HOME-P3-01 | P3 | `C-02` | Closed for homepage round; accepted non-blocking debt | EN/TH parity ยัง drift ในระดับ tone และ microcopy | final side-by-side review จาก deployed screenshots/DOM ยืนยันว่า structure, headings, CTA hierarchy, owner CTA, และ decision-support framing ตรงกันพอสำหรับ release; nuance ที่เหลือเป็นระดับ rhythm/tone เท่านั้น | ไม่คุ้ม reopen homepage round เพื่อ polish เชิงภาษาในตอนนี้ | archive เป็น optional future copy sweep; อย่า block release closeout | closed for current homepage round | [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts), [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts), [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx) |
| HOME-P3-02 | P3 | `H-03` | Closed for homepage round; accepted non-blocking debt | Header และ nav visual weight ยังเบาไปนิด | final visual review บน deployed live ยืนยันว่า discoverability อยู่เหนือ release threshold แล้ว แม้ premium weight ยังไม่สุด | เป็น polish debt เชิง subjective มากกว่าปัญหา UX ที่ต้อง reopen | เก็บเป็น optional future polish pass เท่านั้น | closed for current homepage round | [Header.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/Header.tsx), [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx) |
| HOME-P3-03 | P3 | `WP-03` | Verified on preview/live | `Why Pattaya` ควรถูกยกระดับเป็น explicit decision-support module | after-deploy live heading now uses `Better decisions start with better framing` / `การตัดสินใจที่ดี เริ่มจากการวางกรอบให้ถูก` | advisor positioning ชัดขึ้นตาม target | keep current section framing and monitor composer drift | closed | [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx), [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts), [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts) |
| HOME-P3-04 | P3 | `CP-01`, `CP-02` | Closed for current homepage round; omitted by design | Client proof/reviews เป็น optional enhancement ไม่ใช่ mandatory current block | production live still omits review block and no sample quotes leaked to production | ลด risk ของ weak proof regressions โดยไม่เปิด social proof ที่ยังไม่ source-ready | keep omitted until sourced; reopen only with real proof | closed out-of-scope for current homepage round | [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx), [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts), [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts) |

## Approved Copy Direction by Section

| Section | Preferred EN target | Preferred TH target | Implementation note |
|---|---|---|---|
| Hero | `Find the right Pattaya property faster` | `เลือกอสังหาพัทยาได้เร็วขึ้น ด้วย shortlist ที่คัดตามเป้าหมายของคุณ` | baseline hero headline pair |
| Hero CTA pair | `Get My Shortlist` + `Browse Verified Projects` | `รับ Shortlist ของฉัน` + `ดูโครงการที่คัดแล้ว` | default primary/secondary pair |
| Choose Your Path | `Start with the goal that fits you` | `เริ่มจากเป้าหมายที่ตรงกับคุณ` | คง 4 intents เท่ากัน |
| Why AMP / Trust | `A clearer way to search, compare, and decide` | `วิธีที่ชัดกว่าในการค้นหา เปรียบเทียบ และตัดสินใจ` | ใช้ trust cards ที่พูดเรื่อง curation + clarity |
| Curated Projects | `Projects worth reviewing first` | `เริ่มจากโครงการที่ควรดูจริงก่อน` | section intro ของ grid |
| Ready Units | `Top picks for serious next steps` | `ตัวเลือกที่เหมาะกับการไปต่อจริง` | ลด feeling ว่าเป็น full feed |
| Decision-support block | `Better decisions start with better framing` | `การตัดสินใจที่ดี เริ่มจากการวางกรอบให้ถูก` | preferred rename/reframe ของ current `Why Pattaya` |
| Owner CTA | `Sell or rent out with clearer positioning` | `ขายหรือปล่อยเช่าด้วยการวางตำแหน่งที่ชัดกว่า` | คง 2-card owner structure |
| Final Lead Capture | `Tell us what you are looking for` | `เล่าให้เราฟังว่าคุณกำลังมองหาอะไร` | final CTA heading |
| Reviews | `What people value when the search gets clearer` | `สิ่งที่ผู้ใช้ให้คุณค่า เมื่อการค้นหาชัดขึ้น` | ใช้ได้ก็ต่อเมื่อมี proof จริง |

## Approved CTA and Form Microcopy Set

### Primary CTA set

- EN: `Get My Shortlist`, `Request My Shortlist`, `Start Your Shortlist`
- TH: `รับ Shortlist ของฉัน`, `ขอ Shortlist ของฉัน`, `เริ่มทำ Shortlist ของคุณ`

### Secondary CTA set

- EN: `Browse Verified Projects`, `Browse Ready Units`, `Talk to an Advisor`, `See All Projects`
- TH: `ดูโครงการที่คัดแล้ว`, `ดูยูนิตพร้อมอยู่`, `คุยกับที่ปรึกษา`, `ดูโครงการทั้งหมด`

### Recommended form field language

- EN: `Name`, `Email or Phone`, `Budget Range`, `Goal`, `Preferred Area`, `Timeline`, `Message`
- TH: `ชื่อ`, `อีเมลหรือเบอร์โทร`, `ช่วงงบประมาณ`, `เป้าหมาย`, `ทำเลที่สนใจ`, `ช่วงเวลา`, `รายละเอียดเพิ่มเติม`
- default note:
  - `Timeline` เป็น optional target
  - ถ้าจะตัดออกเพื่อคุม friction ให้ระบุว่า intentional และคงไว้ใน handoff/CRM logic แทน

## Priority Buckets

### P0. Semantic Locale Integrity

เป้าหมาย: ทำให้ `html lang`, locale UI, และ client navigation semantics ตรงกันเสมอ

- [x] ปิด `HOME-P0-01` บน branch
- [x] verify local `/en -> /th` และ `/th -> /en`
- [x] verify deployed preview/live อีกครั้ง

Validation:
- [x] regression coverage เพิ่มใน `public_client_enhancements_locale_semantics.test.tsx`
- [x] local browser QA ตรวจ `document.documentElement.lang` ตรงกับ locale
- [x] preview/live browser QA ตรวจซ้ำหลัง deploy

### P1. Above-the-fold Conversion Reset

เป้าหมาย: ทำให้ first 2 screens ชัด, เชื่อได้, และพาไปต่อได้เร็ว

- [x] implement `HOME-P1-01`
- [x] implement `HOME-P1-02`
- [x] implement `HOME-P1-03`
- [x] implement `HOME-P1-04`
- [x] ใช้ approved hero + CTA pair เป็น baseline บน branch

Validation:
- [x] local visual QA ที่ `390`, `430`, `1440`
- [x] owner CTA และ final form ยังอยู่หลัง density reduction
- [x] preview/live screenshot signoff ว่า first 2 screens ตอบ `what / who / next step / why trust`

### P2. Featured Content and Accessibility Pass

เป้าหมาย: ทำให้ featured surfaces ช่วยตัดสินใจมากขึ้น และ form semantics ผ่าน

- [x] implement `HOME-P2-01`
- [x] implement `HOME-P2-02`
- [x] implement `HOME-P2-03`
- [x] implement `HOME-P2-04`
- [x] implement `HOME-P2-05`

Validation:
- [x] `npm run test -- __tests__/contact_form_validation.test.tsx __tests__/lead_form_custom_intro.test.tsx __tests__/lead_form_handoff_payload.test.tsx`
- [x] targeted homepage regression suites อื่นที่แตะ hero/surfaces ผ่าน
- [x] preview/live manual QA เรื่อง focus, error state, required semantics, submit behavior
- [x] slow-network / long-capture QA บน deployed env
- [x] image-loading tuning + redeploy verification ปิด `HOME-P2-04` แล้ว

### P3. Voice and Polish Alignment

เป้าหมาย: ล็อก EN/TH parity และเก็บ polish โดยไม่เปิด redesign รอบใหม่

- [x] ปิด `HOME-P3-01` เป็น accepted non-blocking debt หลัง side-by-side copy review
- [x] implement `HOME-P3-02`
- [x] implement `HOME-P3-03`
- [x] ปิด `HOME-P3-04` เป็น out-of-scope สำหรับ homepage round นี้ และคง omitted-until-sourced

Validation:
- [x] copy pass แบบ side-by-side `/en` vs `/th`
- [x] deployed visual review บ่งชี้ว่า header weight ดีขึ้นและผ่าน release threshold
- [x] review block ยัง omit ตาม intended behavior

## Branch Verification Completed

- [x] targeted homepage tests ผ่าน:
  - `admin-app/__tests__/contact_form_validation.test.tsx`
  - `admin-app/__tests__/lead_form_custom_intro.test.tsx`
  - `admin-app/__tests__/lead_form_handoff_payload.test.tsx`
  - `admin-app/__tests__/home_design_surface_contract.test.ts`
  - `admin-app/__tests__/home_surface_handoff_contract.test.ts`
  - `admin-app/__tests__/home_bottom_cta_conversion_gate.test.tsx`
  - `admin-app/__tests__/public_client_enhancements_locale_semantics.test.tsx`
  - `admin-app/__tests__/home_hero_cta_hierarchy.test.tsx`
  - `admin-app/__tests__/header_cta_visibility.test.tsx`
- [x] local public visual QA ผ่านที่ `/en` และ `/th` บน `390`, `430`, `1440`
- [x] visual QA score `100` และไม่พบ `overflowX` หรือ critical findings ใหม่
- [x] preview/live deploy ผ่านและ smoke ผ่าน
- [x] after-deploy real-browser QA ยืนยัน H1/CTA/lang-switch บน production live
- [x] after-media-fix real-browser slow-network probe ยืนยันว่า visible card images โหลดครบใน featured surfaces
- [x] example review quotes ยังไม่ถูก publish
- [x] file refs ในเอกสารยังชี้ไปยัง paths ที่มีอยู่จริงใน repo

## Release Gate

### Content QA

- [x] ไม่มี placeholder / loading / pending-source copy บน deployed home
- [x] ไม่มี weak cards ที่ media หรือ metadata ไม่พร้อมบน deployed data จริง
- [x] EN/TH meaning parity ผ่าน release threshold ในทุก major section บน env ที่ deploy แล้ว
- [x] example review quotes ไม่ถูก publish ตรง ๆ

### Visual QA

- [x] hero อ่านชัดบน mobile บน deployed env
- [x] cards ภาพครบและไม่ดูเหมือน fallback บน deployed env ภายใต้ slow-network probe
- [x] CTA เด่นพอทุก major section
- [x] featured hierarchy อ่านง่ายขึ้น

### Conversion QA

- [x] primary CTA เด่นที่สุดใน hero
- [x] route cards ชี้ next step ชัด
- [x] owner CTA และ final form ไม่มาสายเกิน
- [x] CTA labels ที่ใช้จริงตรงกับ approved CTA set หรือมี rationale ชัด

### Technical QA

- [x] test file references ที่ใช้อยู่มีอยู่จริง:
  - `admin-app/__tests__/contact_form_validation.test.tsx`
  - `admin-app/__tests__/lead_form_custom_intro.test.tsx`
  - `admin-app/__tests__/lead_form_handoff_payload.test.tsx`
- [x] deployed preview/live ผ่าน browser QA และ update audit sheet แล้ว

## Definition of Done

- [x] implementer อ่านไฟล์นี้ไฟล์เดียวแล้วเริ่มลงมือได้โดยไม่ต้องตัดสินใจเพิ่ม
- [x] locale switching semantics ถูกต้องบน branch
- [x] hero ตอบ `who + outcome + next step` ได้ชัดขึ้นทั้ง EN/TH บน branch
- [x] trust proof ถูกย้ายให้ช่วย early conversion flow บน branch
- [x] home mobile ไม่ถูก featured stack กลบเท่า baseline บน branch
- [x] featured cards มี decision cues หรือ equivalent data-backed framing บน branch
- [x] form ใช้ native required semantics พร้อม accessible error wiring บน branch
- [x] deployed env reproduce behavior ชุดเดียวกันสำหรับ `HOME-P0-01` ถึง `HOME-P2-03`, `HOME-P2-05`, `HOME-P3-03`
- [x] live audit sheet ถูก refresh จาก evidence หลัง deploy
- [x] `HOME-P3-01` ถูกตัดสินและ archive เป็น accepted non-blocking debt สำหรับรอบ homepage นี้
- [x] review block ยังเป็น optional จนกว่าจะมี source-ready proof จริง
- [x] `HOME-P2-04` ถูกปิดหลัง image-loading tuning และ redeploy verification

## Appendix / Provenance

### 2026-04-02 Branch Implementation and Local QA

- code touchpoints ที่เปลี่ยน:
  - [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx)
  - [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx)
  - [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx)
  - [LeadForm.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/forms/LeadForm.tsx)
  - [Header.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/Header.tsx)
  - [PublicClientEnhancements.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/PublicClientEnhancements.tsx)
  - [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts)
  - [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts)
  - [globals.css](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/globals.css)
- tests ที่ผ่านบน branch:
  - targeted homepage regression suites ตามรายการใน `Branch Verification Completed`
- visual QA artifacts:
  - [en__390.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-visual-qa/run-20260402-083936/iteration-01/after/en__390.png)
  - [th__390.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-visual-qa/run-20260402-083936/iteration-01/after/th__390.png)
  - [en__1440.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-visual-qa/run-20260402-083936/iteration-01/after/en__1440.png)
  - [th__1440.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-visual-qa/run-20260402-083936/iteration-01/after/th__1440.png)
- known unrelated repo debt:
  - `npx tsc --noEmit` ยัง fail ที่ [shortlist_owner_reference.test.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/__tests__/shortlist_owner_reference.test.ts) และ [v2_search_filters_ui.test.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/__tests__/v2_search_filters_ui.test.tsx) ซึ่งไม่ใช่ regression จาก homepage รอบนี้

### 2026-04-02 Preview and Production Deploy Verification

- preview deploy จาก workspace ปัจจุบันสำเร็จและ `smoke_preview.ps1` ผ่าน
- production overlay deploy ล่าสุดสำเร็จด้วย telemetry:
  - `deploy_status: ok`
  - `smoke_passed: true`
  - `build_sha: 8a5b4bc`
  - `target_sha: 8a5b4bc79b9e786ea787159e3f63caea9c73aaac`
  - `duration_seconds: 5925`
- production containers หลัง switch:
  - `flowbiz-client-amp-api-1` รัน image `flowbiz-client-amp-api:8a5b4bc`
  - `flowbiz-client-amp-admin-app-1` รัน image `flowbiz-client-amp-admin-app:8a5b4bc`

### 2026-04-02 Production Live After-Deploy QA

- verified ด้วย real-browser automation บน `https://amppattaya.com/en` และ `https://amppattaya.com/th`
- after-deploy live evidence:
  - EN title = `AMP Pattaya | Find the right Pattaya property faster | AMP Pattaya`
  - TH title = `AMP Pattaya | เลือกอสังหาพัทยาได้เร็วขึ้น ด้วย shortlist ที่คัดตามเป้าหมายของคุณ | AMP Pattaya`
  - EN H1 = `Find the right Pattaya property faster`
  - TH H1 = `เลือกอสังหาพัทยาได้เร็วขึ้น ด้วย shortlist ที่คัดตามเป้าหมายของคุณ`
  - EN hero CTAs = `Get My Shortlist` / `Browse Verified Projects`
  - TH hero CTAs = `รับ Shortlist ของฉัน` / `ดูโครงการที่คัดแล้ว`
  - language switch จาก `/en` ไป `/th` อัปเดต `document.documentElement.lang` จาก `en` เป็น `th` ถูกต้อง
  - after-deploy captures ไม่พบ `overflowX` และไม่พบ console errors
- after-deploy artifacts:
  - [summary.json](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/summary.json)
  - [en__390.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/en__390.png)
  - [th__390.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/th__390.png)
  - [en__1440.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/en__1440.png)
  - [th__1440.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/th__1440.png)
  - [language-switch-en-to-th.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/language-switch-en-to-th.png)

### 2026-04-02 Final Closeout Slow-Network + Release Decision

- final closeout probe ใช้ profile `normal initial load + slow-3g lazy-media scroll`
- ผลที่ยืนยัน:
  - initial final-closeout probe ก่อน media tune เคย fail ที่ `HOME-P2-04`: visible images บางส่วนบน project/unit stack ยัง `complete=false` แม้ให้ dwell time ต่อ viewport แล้ว
  - `HOME-P3-01` ปิดเป็น accepted non-blocking debt: parity ด้าน structure, CTA, owner route, และ decision-support ดีพอสำหรับ release
  - `HOME-P3-02` ปิดเป็น accepted non-blocking debt: header weight ผ่าน threshold การใช้งานแล้ว แม้ยังไม่ใช่ polish สูงสุด
- final-closeout artifacts:
  - [summary.json](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-final-closeout/summary.json)
  - [en__390_slow-scroll.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-final-closeout/en__390_slow-scroll.png)
  - [th__390_slow-scroll.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-final-closeout/th__390_slow-scroll.png)
  - [language-switch-en-to-th-final.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-final-closeout/language-switch-en-to-th-final.png)

### 2026-04-02 Media-Fix Redeploy + Final P2-04 Recheck

- production overlay deploy ล่าสุดสำเร็จด้วย telemetry:
  - `deploy_status: ok`
  - `smoke_passed: true`
  - `build_sha: 8a5b4bc`
  - `target_sha: 8a5b4bc79b9e786ea787159e3f63caea9c73aaac`
  - `duration_seconds: 5925`
- overlay นี้รวม runtime files ของ homepage ทั้งชุด + media-loading tune:
  - [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx)
  - [HomeHero.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/HomeHero.tsx)
  - [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx)
  - [LeadForm.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/forms/LeadForm.tsx)
  - [Header.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/Header.tsx)
  - [PublicClientEnhancements.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/layout/PublicClientEnhancements.tsx)
  - [en.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/en.ts)
  - [th.ts](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/_lib/i18n/th.ts)
  - [globals.css](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/globals.css)
  - [LocalMediaImage.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/media/LocalMediaImage.tsx)
  - [SafeCoverImage.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/media/SafeCoverImage.tsx)
- after-media-fix recheck ใช้ probe ชุดเดียวกับที่เคยทำให้ `HOME-P2-04` fail ก่อนหน้า
- results:
  - EN: `relevantCount = 1`, `incompleteVisibleCount = 0`
  - TH: `relevantCount = 0`, `incompleteVisibleCount = 0`
  - ไม่พบ visible incomplete card images แล้ว
- artifacts:
  - [summary.json](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-p204-after-media-fix/summary.json)

### Confirmed Stable on Current Live

- H1 บน hero คงที่ต่อ locale
- canonical และ `hreflang` ถูกต้องเมื่อเปิด route ตรง
- owner route, final CTA, และ footer ยังไม่หลุดโครง
- contact channels หลักยังอยู่ครบ

### External 100-Point Audit

ใช้เป็น `supporting opinion only`

- ประเด็นที่รับเข้า: hero ยังไม่คม, trust มาช้า, listing density สูง, card quality gate ยังไม่แน่น
- ประเด็นที่ไม่ใช้เป็น source of truth:
  - `Find the right Pattaya property in 60 seconds`
  - `Market Insight`
  - `Testimonials`
  - ข้อสรุปว่า EN/TH เป็นคนละ architecture ในระดับใหญ่

### Strategic Implementation Blueprint

ใช้เป็น `target-state architecture + governance`

- รับเข้า:
  - canonical section model เดียวกันทั้ง EN/TH
  - outcome-driven CTA เป็น default
  - content gating สำหรับ cards / proof / trust surfaces
  - omit weak blocks ดีกว่าปล่อย content ที่ยังไม่พร้อม
- annotate:
  - `Client Proof / Reviews` ไม่ใช่ mandatory current block
  - `How We Help You Decide` เป็น enhancement target ของ current `Why Pattaya`

### Section-by-Section Rewrite Pack

ใช้เป็น `approved copy pack`

- รับเข้า:
  - hero copy pair
  - section intros
  - CTA set
  - form microcopy
  - shorter UI-safe variants
- annotate:
  - review examples เป็น sample-only
  - card labels ใช้ได้เฉพาะเมื่อ data รองรับ
  - `Timeline` เป็น optional target
