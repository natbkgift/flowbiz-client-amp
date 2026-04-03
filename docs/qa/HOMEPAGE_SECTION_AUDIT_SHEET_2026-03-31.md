# Homepage Section Audit Sheet

อัปเดต: `2026-04-02`
บทบาทเอกสาร: `Live evidence + section-level PASS/FAIL`

## Status Snapshot

- สถานะรวม: `Production live refreshed after media-fix redeploy; no open fail items remain for homepage round`
- คะแนน weighted ล่าสุดของ deployed-live after-deploy evidence:
  - `EN 86/100`
  - `TH 84/100`
  - `รวม 85/100`
- checklist completion note:
  - open fail items `0` บน deployed-live evidence ล่าสุด
  - sections with open fail items `0`
  - preview deploy ผ่าน smoke และ production overlay deploy ล่าสุดปิดด้วย `deploy_status=ok`
  - after-deploy browser QA ยืนยันว่า major P0-P2 fixes ขึ้น production แล้ว
  - after-media-fix probe ปิด `CU-02 / HOME-P2-04` แล้ว และ `H-03 / HOME-P3-02`, `C-02 / HOME-P3-01` ยังคงผ่าน release threshold
- next gate สูงสุด:
  - ไม่มี release gate เปิดค้างใน homepage round ปัจจุบัน; คง review block omitted จนกว่าจะ source-ready

## Evidence Rules

- เอกสารนี้ authoritative สำหรับ `live-current observations`, `PASS/FAIL`, และ `evidence rows`
- [HOMEPAGE_IMPLEMENTATION_TASK_LIST_2026-03-31.md](d:/FlowBiz/flowbiz-client-amp/docs/qa/HOMEPAGE_IMPLEMENTATION_TASK_LIST_2026-03-31.md) authoritative สำหรับ `priority`, `sequencing`, `copy target`, `acceptance`
- target-state copy ไม่เขียนซ้ำใน main body ของเอกสารนี้
- stale external claims ไม่ใช้เป็น source of truth ถ้าไม่ reproduce บน live current
- review/proof block ยังถือเป็น optional จนกว่าจะมี source-ready proof จริง
- `FAIL` rows ใน main body นี้อ้างอิง deployed-live after-deploy evidence ล่าสุด

## 1. Header / Top Bar

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| H-01 | client-side language switch ต้องอัปเดต `html lang` ถูกต้อง | PASS | P0 | `HOME-P0-01` | after-deploy live QA: กดปุ่ม `Language` บน `/en` แล้ว URL ไป `/th`, H1 เป็นไทย, และ `document.documentElement.lang` เปลี่ยนเป็น `th` | semantic blocker หลักถูกปิดแล้ว | คง regression coverage และ deploy probe ไว้ |
| H-02 | language switch และ hero controls ต้องมี tap target ระดับ mobile-safe | PASS | P1 | `HOME-P1-04` | after-deploy live DOM: language button `80x44`; hero arrows `44x44` | tap confidence กลับเข้า mobile-safe range | คง control sizing ไว้ |
| H-03 | nav/header ต้องมีน้ำหนักพอสำหรับ premium advisory surface | PASS | P3 | `HOME-P3-02` | final visual review บน deployed live ยืนยันว่า nav ยังเบากว่า hero เล็กน้อย แต่ยังชัดพอและไม่กด CTA หลักลง | header ผ่าน release threshold แล้ว; ที่เหลือเป็น polish debt | archive เป็น optional future polish เท่านั้น |
| H-04 | menu state และ accessible labels ต้องครบ | PASS | P3 | `—` | ปุ่ม `Menu`, `Close menu`, และ nav labels ถูกตั้งชื่อแล้ว | ใช้งาน mobile nav ได้จริง | คงไว้ |

## 2. Hero

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| HE-01 | hero promise ต้องตอบ `who + outcome + next step` เร็วกว่านี้ | PASS | P1 | `HOME-P1-01` | after-deploy live QA: EN H1 = `Find the right Pattaya property faster`; TH H1 = `เลือกอสังหาพัทยาได้เร็วขึ้น ด้วย shortlist ที่คัดตามเป้าหมายของคุณ`; CTA pair ตรง approved set ทั้งสองภาษา | first impression และ click intent align กับ target แล้ว | คง composer precedence แต่ monitor drift |
| HE-02 | hero ต้องคง premium tone โดยไม่รก | PASS | P2 | `—` | visual direction, imagery, และ contrast โดยรวมดี | ช่วยตั้ง tone ของแบรนด์ | คงไว้ |
| HE-03 | hero ต้องมี H1 เดียวและ CTA เห็นใน first viewport | PASS | P2 | `—` | H1 คงที่ต่อ locale และ CTA ยังเห็นบน `390px` | foundation ด้าน structure ยังดี | คงไว้ |

## 3. Journey Cards

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| J-01 | primary intents ต้อง parity กันระหว่าง EN/TH | PASS | P2 | `—` | ทั้งสองภาษาใช้ `buy / invest / rent-relocate / sell` แล้ว | โครง funnel เสถียรขึ้น | คงไว้ |
| J-02 | micro text ใน cards ต้องอ่านง่ายขึ้นบน mobile | PASS | P1 | `HOME-P1-04` | after-deploy live DOM: journey meta lines ที่ sampled อยู่ราว `12.48px / 17.47px` | scan speed และ readability ดีขึ้นจาก baseline | คง type scale ปัจจุบันไว้ |
| J-03 | cards ต้องตอบว่า route นี้เหมาะกับใคร | PASS | P2 | `—` | copy แต่ละ card บอก persona/route ได้ชัด | intent segmentation ใช้งานได้จริง | คงไว้ |

## 4. Trust Snapshot

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| T-01 | trust proof ต้องมาเร็วกว่านี้ใน scroll | PASS | P1 | `HOME-P1-02` | after-deploy heading order บน live คือ `H1 -> journey cards -> Verified stock first. -> featured` | trust ถูกดึงเข้ามาช่วย early conversion flow แล้ว | คง order ปัจจุบันไว้ |
| T-02 | proof points ต้องใช้ข้อมูลจริงและกระชับ | PASS | P2 | `—` | `22 live projects / 53 listings checked` และ supporting lines อ่านเข้าใจได้ | trust content ใช้ได้ | คงไว้ |

## 5. Featured Projects

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| FP-01 | จำนวน cards บน home ต้องน้อยกว่านี้ | PASS | P1 | `HOME-P1-03` | after-deploy live QA surfacing `View project = 4` cards ซึ่งต่ำกว่า `6 max` | featured zone สั้นลงจาก baseline | คง clamp และ prefer omission |
| FP-02 | featured zone ต้องมี hierarchy ที่คมกว่าเดิม | PASS | P2 | `HOME-P2-03` | after-deploy live DOM: `Verified stock first.` = `H2`; `Projects worth reviewing first` = `H3`; `Top picks for serious next steps` = `H3` | outline และ scan rhythm อ่านง่ายขึ้น | คง hierarchy model นี้ |
| FP-03 | featured cards ต้องช่วยตัดสินใจ ไม่ใช่แค่แสดง inventory | PASS | P2 | `HOME-P2-01` | after-deploy live cards มี data-backed cues เช่น `Under THB 5M`, `Sea View option`, `Ready to move in` | user ได้ decision cue เพิ่มโดยไม่พึ่ง guesswork | keep cues data-backed only |
| FP-04 | card facts หลักต้องอ่านเร็วและคงเส้น | PASS | P2 | `—` | price, location, type, developer ยังอ่านง่าย | โครงข้อมูลพื้นฐานยังดี | คงไว้ |

## 6. Curated Units

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| CU-01 | units stack ต้องสั้นลงสำหรับ home | PASS | P1 | `HOME-P1-03` | after-deploy live QA surfacing `View unit = 6` cards | owner CTA และ final form มาเร็วขึ้นจาก baseline | คง 6-card cap |
| CU-02 | home cards ต้องไม่ให้ความรู้สึกว่า media ยังไม่พร้อม | PASS | P2 | `HOME-P2-04` | after-media-fix production recheck แบบ `normal initial load + slow-3g lazy-media scroll` ไม่พบ visible images ที่ `complete=false` หรือ `naturalWidth=0` แล้ว | ปิด performance/perception risk หลักของ featured card stack ได้ | คง media preload + SSR primary-start strategy ปัจจุบันไว้ |
| CU-03 | resale และ rent ต้องแยก perception ได้ชัด | PASS | P2 | `—` | sale/resale กับ rent แยกเป็นสองช่วงชัด | user แยก intent ได้ | คงไว้ |

## 7. Why Pattaya

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| WP-01 | section นี้ต้องช่วยคิดจริง ไม่ใช่แค่ slogan | PASS | P2 | `—` | current bullets อ่านเป็น buyer guidance ได้ | supporting section ใช้งานได้ | คงไว้ |
| WP-02 | EN/TH ต้องสื่อเรื่องเดียวกันในระดับ section | PASS | P3 | `—` | structure และ meaning broad-level ใกล้กันแล้ว | parity ดีขึ้นจากรอบก่อน | คงไว้ |
| WP-03 | section นี้ควรถูก reframe ให้ explicit แบบ `How We Help You Decide` มากขึ้นหรือไม่ | PASS | P3 | `HOME-P3-03` | after-deploy live heading ใช้ `Better decisions start with better framing` / `การตัดสินใจที่ดี เริ่มจากการวางกรอบให้ถูก` พร้อม 4 decision blocks | advisor positioning ตรง target state มากขึ้นแล้ว | คง framing ปัจจุบันและ monitor drift |

## 8. Client Proof / Reviews

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| CP-01 | absence ของ review block ตอนนี้ถือว่า safer than weak proof | PASS | P3 | `HOME-P3-04` | live current ไม่แสดง testimonial/review block และไม่พบ source-ready proof บน home | หลีกเลี่ยง social proof ปลอม/อ่อน | คง omission ไว้จนกว่าจะมี proof จริง |
| CP-02 | ถ้าจะเพิ่ม review block ภายหลัง ต้อง source-ready และ parity-matched | PASS | P3 | `HOME-P3-04` | current live ยังไม่ควรเปิดใช้ review block | ลด risk จาก unsourced testimonials | เปิดใช้ได้เฉพาะเมื่อมี moderation/source rule ชัด |

## 9. Owner Route

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| OR-01 | owner actions ต้องชัดและไม่ซ้ำ final CTA | PASS | P2 | `—` | `Share owner details` และ `Talk through the options` แยกหน้าที่ชัด | supply-side path ใช้ได้ | คงไว้ |
| OR-02 | owner route ต้องไม่ถูกดันลึกเกินเพราะ content ก่อนหน้าเยอะไป | PASS | P2 | `HOME-P1-03` | after-deploy home surfaces `4` project cards + `6` unit cards ก่อน owner CTA | owner route มาเร็วขึ้นและไม่ buried แบบ baseline | คง density ปัจจุบันไว้ |

## 10. Final CTA + Form

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| FC-01 | fields ที่ label ว่า required ต้องมี native required semantics | PASS | P2 | `HOME-P2-02` | after-deploy live DOM: `name`, `message`, `consent` ใช้ native `required`; `email`/`phone` คง shared validation pair พร้อม `aria-describedby` | browser validation และ assistive cues ตรง target | คง form semantics ปัจจุบันไว้ |
| FC-02 | form และ contact channels ต้องพร้อมใช้งาน | PASS | P2 | `—` | form, WhatsApp, LINE, browse path ยังอยู่ครบ | final conversion surface ใช้งานได้ | คงไว้ |
| FC-03 | final lead capture ต้องไม่มาสายเกิน | PASS | P2 | `HOME-P1-03` | after-deploy home ลด featured density เหลือ `4 + 6` cards ทำให้ final CTA/form มาเร็วขึ้นจาก baseline | high-intent user ไม่ต้องเลื่อนลึกเท่าเดิม | คง density ปัจจุบันไว้ |

## 11. Footer

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| F-01 | footer ต้องจบหน้าอย่างสงบและไม่ขายซ้ำ | PASS | P3 | `—` | current footer calm และไม่แย่ง CTA หลัก | ช่วยให้หน้าจบเรียบร้อย | คงไว้ |

## 12. Mobile-specific

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| M-01 | homepage ต้องไม่ยาวจนเสียบทบาท landing page | PASS | P1 | `HOME-P1-03` | after-deploy live QA: featured stack ถูกลดเหลือ `4 projects + 6 units` | landing-page role ดีขึ้นชัดจาก baseline | keep current density guardrails |
| M-02 | small tap targets ต้องถูกเก็บให้หมด | PASS | P1 | `HOME-P1-04` | after-deploy live DOM: language switch และ hero arrows อยู่ที่ `44px` class แล้ว | usability บนมือถือจริงดีขึ้นตาม target | keep control sizing thresholds |
| M-03 | first viewport ต้องยังชี้ทางหลักได้ | PASS | P2 | `—` | CTA หลักยังอยู่ above the fold | first-screen foundation ยังพอใช้ | คงไว้ |

## 13. Copywriting / Localization

| Evidence ID | Check | Status | Priority | Maps to task | Live evidence | Impact | Fix direction |
|---|---|---|---|---|---|---|---|
| C-01 | hero และ CTA verbs ต้องคมขึ้นในเชิงผลลัพธ์ | PASS | P1 | `HOME-P1-01` | after-deploy live ใช้ CTA ชุดใหม่ `Get My Shortlist` / `Browse Verified Projects` และ `รับ Shortlist ของฉัน` / `ดูโครงการที่คัดแล้ว` | outcome-led CTA ขึ้น production แล้ว | keep approved CTA set as baseline |
| C-02 | EN/TH tone ต้อง one-to-one มากขึ้น | PASS | P3 | `HOME-P3-01` | final side-by-side review ยืนยันว่า section order, hero promise, CTA hierarchy, owner route, และ decision-support framing aligned พอสำหรับ release; nuance ที่เหลืออยู่ระดับ rhythm/tone | parity ผ่าน release threshold แล้ว แม้ยังไม่ perfect 1:1 | archive เป็น optional future copy sweep เท่านั้น |
| C-03 | placeholder trust/source text จาก audit เก่าต้องไม่อยู่บน live current home | PASS | P2 | `HOME-P2-05` | spot-check current live แล้วไม่พบข้อความ `Source TBD` / `กำลังโหลด...` บน home | ลด false alarm จากเอกสารเก่า | keep monitoring เท่านั้น |
| C-04 | audit ภายนอกที่อ้าง section หรือ claim เก่าต้องไม่ถูกใช้เป็น source of truth โดยไม่ cross-check live | PASS | P3 | `—` | current live ไม่ตรงกับ claim เก่าบางรายการจาก audit ภายนอก | ลดการ reopen issue จากข้อมูลเก่า | ใช้ live browser QA เป็นตัวตัดสินเสมอ |
| C-05 | blueprint และ rewrite pack ต้องถูกใช้เป็น target state ไม่ใช่ current-state assumption | PASS | P3 | `—` | direction ดี แต่ไม่ใช่สิ่งที่ live ปัจจุบันทำสำเร็จแล้ว | ลดการสรุปผิดว่า current live ผ่านแล้ว | ใช้เป็น implementation reference เท่านั้น |

## Summary

- checklist completion note:
  - `0` fail items remain บน deployed-live evidence ล่าสุด
  - weighted UX score ของ deployed live ขยับขึ้นมาราว `85/100`
  - `HOME-P0-01` ถึง `HOME-P2-03`, `HOME-P2-05`, และ `HOME-P3-03` ถูกยืนยันบน production live แล้ว
  - `HOME-P2-04` ถูกปิดแล้วหลัง media-fix redeploy + live slow-network recheck
  - `HOME-P3-01` และ `HOME-P3-02` ถูกปิดเป็น accepted non-blocking polish debt สำหรับรอบ homepage นี้
- fail clusters ที่ยังเปิดอยู่:
  - ไม่มี open fail cluster สำหรับ homepage round ปัจจุบัน

## Remaining Follow-up

1. ถ้าจะเปิด `Client Proof / Reviews` ภายหลัง ให้เปิดก็ต่อเมื่อผ่าน source-readiness gate และ parity review ทั้ง EN/TH
2. ถ้ามีการเปลี่ยน media policy, card gating, หรือ loading strategy รอบใหม่ ให้ rerun slow-network probe ชุด `run-20260402-p204-after-media-fix`

## Appendix / Provenance

### Post-Implementation Local Verification (`2026-04-02`)

| Scope | Related evidence / task | Local branch status | Verification source | Next gate |
|---|---|---|---|---|
| Locale semantics | `H-01` / `HOME-P0-01` | Implemented locally | [public_client_enhancements_locale_semantics.test.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/__tests__/public_client_enhancements_locale_semantics.test.tsx) + local browser QA | verify preview/live locale switch |
| Above-the-fold conversion | `HE-01`, `T-01`, `H-02`, `J-02`, `M-02` / `HOME-P1-01` ถึง `HOME-P1-04` | Implemented locally | local visual QA on `/en`, `/th` at `390`, `430`, `1440` | preview/live screenshot signoff |
| Featured density and gating | `FP-01`, `FP-02`, `FP-03`, `CU-01`, `CU-02`, `FC-03`, `M-01`, `OR-02` / `HOME-P1-03`, `HOME-P2-01`, `HOME-P2-03`, `HOME-P2-04`, `HOME-P2-05` | Implemented locally | branch code gating in [page.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/app/(site)/[locale]/page.tsx) and [FeaturedProjects.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/components/home/FeaturedProjects.tsx) + local visual QA | closed after production recheck |
| Form semantics | `FC-01` / `HOME-P2-02` | Implemented locally | [contact_form_validation.test.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/__tests__/contact_form_validation.test.tsx), [lead_form_custom_intro.test.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/__tests__/lead_form_custom_intro.test.tsx), [lead_form_handoff_payload.test.tsx](/d:/FlowBiz/flowbiz-client-amp/admin-app/__tests__/lead_form_handoff_payload.test.tsx) | preview/live manual form QA |
| Header and decision-support polish | `H-03`, `WP-03` / `HOME-P3-02`, `HOME-P3-03` | Accepted for release after deployed review | branch copy/CSS updates + deployed visual QA | optional future polish only |
| EN/TH microcopy parity | `C-02` / `HOME-P3-01` | Accepted for release after deployed review | hero, owner, decision-support, and CTA parity reviewed side-by-side on deployed live | optional future copy sweep only |
| Reviews | `CP-01`, `CP-02` / `HOME-P3-04` | Intentionally omitted locally | no review block launched in branch implementation | reopen only when proof is source-ready |

### 2026-04-02 Preview + Production Deploy Verification

- preview deploy จาก workspace ปัจจุบันสำเร็จและ smoke ผ่าน
- production overlay deploy ล่าสุด telemetry:
  - `deploy_status: ok`
  - `smoke_passed: true`
  - `build_sha: 8a5b4bc`
  - `duration_seconds: 5925`
- production containers หลัง switch รัน image `flowbiz-client-amp-api:8a5b4bc` และ `flowbiz-client-amp-admin-app:8a5b4bc`

### 2026-04-02 Production Live After-Deploy QA

- verified ด้วย real-browser automation บน `https://amppattaya.com/en` และ `https://amppattaya.com/th`
- after-deploy evidence:
  - EN title = `AMP Pattaya | Find the right Pattaya property faster | AMP Pattaya`
  - TH title = `AMP Pattaya | เลือกอสังหาพัทยาได้เร็วขึ้น ด้วย shortlist ที่คัดตามเป้าหมายของคุณ | AMP Pattaya`
  - EN H1 = `Find the right Pattaya property faster`
  - TH H1 = `เลือกอสังหาพัทยาได้เร็วขึ้น ด้วย shortlist ที่คัดตามเป้าหมายของคุณ`
  - EN CTA pair = `Get My Shortlist` / `Browse Verified Projects`
  - TH CTA pair = `รับ Shortlist ของฉัน` / `ดูโครงการที่คัดแล้ว`
  - `/en -> /th` language switch อัปเดต `document.documentElement.lang` จาก `en` เป็น `th`
  - after-deploy captures ไม่พบ `overflowX` และไม่พบ console errors
- artifacts:
  - [summary.json](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/summary.json)
  - [en__390.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/en__390.png)
  - [th__390.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/th__390.png)
  - [en__1440.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/en__1440.png)
  - [th__1440.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/th__1440.png)
  - [language-switch-en-to-th.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-after-deploy/language-switch-en-to-th.png)

### 2026-04-02 Final Closeout Slow-Network + Release Decision

- final closeout probe ใช้ profile `normal initial load + slow-3g lazy-media scroll`
- results:
  - initial final-closeout probe ก่อน media tune เคย fail ที่ `CU-02 / HOME-P2-04`: visible images บางส่วนบน project/unit stack ยัง `complete=false` แม้ให้ dwell time ต่อ viewport แล้ว
  - `H-03 / HOME-P3-02` ผ่าน release threshold และย้ายเป็น accepted non-blocking visual debt
  - `C-02 / HOME-P3-01` ผ่าน release threshold และย้ายเป็น accepted non-blocking copy debt
- artifacts:
  - [summary.json](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-final-closeout/summary.json)
  - [en__390_slow-scroll.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-final-closeout/en__390_slow-scroll.png)
  - [th__390_slow-scroll.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-final-closeout/th__390_slow-scroll.png)
  - [language-switch-en-to-th-final.png](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-final-closeout/language-switch-en-to-th-final.png)

### 2026-04-02 Media-Fix Redeploy + Final P2-04 Recheck

- production overlay deploy ล่าสุดปิดด้วย telemetry:
  - `deploy_status: ok`
  - `smoke_passed: true`
  - `build_sha: 8a5b4bc`
  - `duration_seconds: 5925`
- recheck ใช้ slow-network probe ชุดเดียวกับที่เคยทำให้ `CU-02 / HOME-P2-04` fail ก่อนหน้า
- results:
  - EN: `relevantCount = 1`, `incompleteVisibleCount = 0`
  - TH: `relevantCount = 0`, `incompleteVisibleCount = 0`
  - ไม่พบ visible incomplete card images แล้ว
- artifacts:
  - [summary.json](/d:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-live-qa/run-20260402-p204-after-media-fix/summary.json)

### Current Live Facts Used by This Sheet

- EN/TH ใช้โครงหลักเดียวกันแล้ว
- canonical / `hreflang` / OG metadata ถูกต้องเมื่อเปิด route ตรง
- placeholder trust/source text จาก audit เก่าไม่ reproduce บนหน้า home live ปัจจุบัน
- current root/EN ไม่ใช้ claim `Find the right Pattaya property in 60 seconds`

### External 100-Point Audit

ใช้เป็น `supporting opinion only`

- รับเข้าเฉพาะประเด็นที่ reproduce ได้จริง เช่น hero, trust, listing gate
- ไม่ใช้ claims ที่ไม่ตรงกับ live current เช่น `Market Insight`, `Testimonials`, หรือ `60 seconds`

### Strategic Blueprint

ใช้เป็น `target-state architecture and governance`

- รองรับ canonical section model, outcome-driven CTA, และ content gating
- ไม่ override หลักฐานจาก live current
- `Client Proof / Reviews` ยังเป็น optional future module

### Section-by-Section Rewrite Pack

ใช้เป็น `approved copy source in task list`

- ไม่เขียน target-state copy ซ้ำใน main body ของเอกสารนี้
- example review quotes ถือเป็น sample-only และไม่ publish-ready
- implementer ต้องอ้างกลับไปที่ task list สำหรับ copy target
