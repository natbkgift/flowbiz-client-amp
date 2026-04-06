# Public UI Aesthetic Implementation Brief

อัปเดต: `2026-04-06`  
บทบาทเอกสาร: `Execution brief for visual polish passes without touching business logic`

## Execution Status

สถานะล่าสุดของแผนนี้ ณ `2026-04-06`:

- `Pass 1: Typography Pass` เสร็จแล้ว
  อ้างอิงงาน: `eb2c6fa9`
- `Pass 2: Contrast Pass` เสร็จแล้ว
  อ้างอิงงาน: `eb2c6fa9`
- `Pass 3: Surface Consistency Pass` เสร็จแล้ว
  อ้างอิงงาน: `701150ec`
- `Pass 4: Media Pass` เสร็จแล้ว
  หมายเหตุ: ปิดเป็น dedicated round หลัง compare micro-polish โดยยกระดับ home hero, projects listing, project detail gallery, และ property detail gallery
- `Pass 5: Data Presentation Pass` เสร็จแล้ว
  อ้างอิงงาน: `fa191708`
- `Pass 6: Locale Premium Parity Pass` เสร็จแล้ว
  อ้างอิงงาน: `3406c4c9`

Current QA baseline:

- `100/100`
- `elite`
- latest summary: `admin-app/artifacts/public-visual-qa/run-20260406-211757/summary.json`
- latest review file: `docs/qa/public-visual-review.full.json`

Route-level polish logged:

- `Compare route micro-polish`
  สถานะ: `applied after Pass 6`
  ขอบเขต: staged reading ของ `area comparison`, `decision summary`, และ `comparison table`
  ไฟล์หลัก: `admin-app/app/(site)/[locale]/compare/page.tsx`, `admin-app/app/globals.css`
- `Property detail media micro-polish`
  สถานะ: `applied during dedicated Media Pass`
  ขอบเขต: gallery shell, counter, thumbnail cadence, และ limited-media state
  ไฟล์หลัก: `admin-app/app/(site)/[locale]/property/[slug]/page.tsx`, `admin-app/app/globals.css`
- `Homepage TH micro-polish`
  สถานะ: `applied after dedicated Media Pass`
  ขอบเขต: first viewport cadence, TH hero line-length, trust snapshot rhythm, และ pathway card cadence
  ไฟล์หลัก: `admin-app/styles/public-primitives.css`
- `Project detail gallery micro-polish`
  สถานะ: `applied after Homepage TH micro-polish`
  ขอบเขต: lead image dominance, supporting media rail hierarchy, และ gallery shell framing ของ route โครงการ
  ไฟล์หลัก: `admin-app/app/globals.css`
- `Property detail facts micro-polish`
  สถานะ: `applied after Project detail gallery micro-polish`
  ขอบเขต: price block cadence, facts row cards, และ location hierarchy ของ route รายการ
  ไฟล์หลัก: `admin-app/app/(site)/[locale]/property/[slug]/page.tsx`, `admin-app/app/globals.css`
- `Project detail confidence pack micro-polish`
  สถานะ: `applied after Property detail facts micro-polish`
  ขอบเขต: authority-card hierarchy, lead/support card balance, และ handoff จาก gallery ไปยัง project brief
  ไฟล์หลัก: `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`, `admin-app/app/globals.css`
- `Concierge side-rail micro-polish`
  สถานะ: `applied after Project detail confidence pack micro-polish`
  ขอบเขต: project advisor rail, contact concierge rail, และ lead-form handoff shell ให้กลายเป็น transition เดียวกันมากขึ้น
  ไฟล์หลัก: `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`, `admin-app/app/(site)/[locale]/contact/page.tsx`, `admin-app/app/globals.css`

## Purpose

เอกสารนี้ใช้เป็นแผนลงมือปรับ `public surface` เชิงความงามและความสม่ำเสมอของระบบ โดยยังคง:

- ไม่เปลี่ยน business logic
- ไม่เปลี่ยน data ordering
- ไม่เปลี่ยน analytics semantics
- ไม่เปลี่ยน form schema
- ไม่เปลี่ยน route coverage ของ public QA

เป้าหมายคือทำให้ visual language ของทุก route ภายใต้ `admin-app/app/(site)/[locale]` มีบุคลิกเดียวกันมากขึ้นในมิติ:

- typography
- contrast
- media presentation
- surface consistency
- editorial calmness
- EN/TH premium parity

## Working Rules

- ใช้ฟอนต์ปัจจุบันก่อน: `Prompt` + `Noto Serif`
- ยังไม่เพิ่ม font family ใหม่ในรอบแรก
- ยังไม่เพิ่มวิดีโอใน hero หรือ section ใดในรอบแรก
- ยังไม่เพิ่ม icon inventory ใหม่ในรอบแรก
- ใช้ภาพนิ่งที่มีอยู่แล้วเป็นหลัก และปรับที่ shell / crop / contrast / fallback presentation ก่อน
- ถ้าจะสร้าง token ใหม่ ให้สร้างเพื่อเพิ่มความจริงของระบบ ไม่ใช่เพิ่มค่าเฉพาะจุด

## Primary Touchpoints

ไฟล์หลักที่จะถูกแตะใน aesthetic rounds นี้:

- `admin-app/styles/public-primitives.css`
- `admin-app/app/globals.css`
- `admin-app/components/home/HomeHero.tsx`
- `admin-app/components/public/PublicAdvisoryHero.tsx`
- `admin-app/components/home/HomeBottomCta.tsx`
- `admin-app/app/(site)/[locale]/page.tsx`
- `admin-app/app/(site)/[locale]/projects/page.tsx`
- `admin-app/app/(site)/[locale]/buy/page.tsx`
- `admin-app/app/(site)/[locale]/contact/page.tsx`
- `admin-app/app/(site)/[locale]/smart-finder/page.tsx`
- `admin-app/app/(site)/[locale]/compare/page.tsx`
- `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`
- `admin-app/app/(site)/[locale]/property/[slug]/page.tsx`

หมายเหตุ:

- `root-fonts.ts` และ `layout.tsx` เป็น reference point ของ font system
- รอบแรกยังไม่เปลี่ยน font asset หรือ locale font assignment

## Route-Level Priority Read

### Homepage `/en`, `/th`

เป้าหมาย:

- ทำให้ hero/subtitle/trust snapshot อ่านชัดขึ้นโดยไม่เสีย calmness
- ทำให้ EN/TH ยังเป็นระบบเดียวกัน แต่มีบุคลิก locale ที่คมขึ้น

จุดแตะหลัก:

- `.home-hero-slider__title`
- `.home-hero-slider__title--th`
- `.home-hero-slider__subtitle`
- `.home-hero-slider__context`
- `.home-trust-snapshot`
- `.home-trust-snapshot__label`
- `.home-page .home-trust-snapshot__value`
- `.section-title`
- `.section-subtitle`

### Projects Listing `/projects`

เป้าหมาย:

- ลด catalogue feel
- ทำให้ card stack ดู curated มากกว่า inventory grid

จุดแตะหลัก:

- `.project-catalogue-card`
- `.project-catalogue-card__chips`
- `.project-catalogue-card__eyebrow`
- `.project-catalogue-card__title`
- `.project-catalogue-card__summary`
- `.project-catalogue-card__meta`
- `.project-catalogue-card__actions`
- `.project-catalogue-card__media-scrim`

### Buy `/buy`

เป้าหมาย:

- เปลี่ยนจาก knowledge page ที่ utilitarian ไปเป็น premium buyer route
- ทำให้ tables และ utility blocks ดู intentional มากขึ้น

จุดแตะหลัก:

- `.buy-scan-note`
- `.buy-scan-note__eyebrow`
- `.buy-scan-note__body`
- `.buy-flow-utility`
- `.buy-flow-utility__text`
- `.buy-flow-utility__link`
- `.info-table`
- `.text-caption`
- `.cta-strip`
- `.cta-strip__text`

### Contact `/contact`

เป้าหมาย:

- ทำให้ route cards ดูเป็น concierge choices ไม่ใช่ utility cards
- ทำให้ form-side support ดูแพงขึ้นโดยไม่หนักเกิน

จุดแตะหลัก:

- `.contact-route-card`
- `.contact-route-card__eyebrow`
- `.contact-route-card .card-title`
- `.contact-route-card .card-subtitle`
- `.contact-route-card__action`
- `.contact-support-actions`
- `.contact-support-actions__phone`
- `.trust-box`
- `.trust-box__title`

### Smart Finder `/smart-finder`

เป้าหมาย:

- ทำให้ product UI สงบขึ้น
- ทำให้ step form และ result cards อยู่ในภาษาเดียวกับ decision pages อื่น

จุดแตะหลัก:

- `.guided-grid`
- `.guided-row`
- `.guided-dialog__step`
- `.guided-summary`
- `.smart-finder-results-grid`
- `.smart-finder-result-card`
- `.decision-page--smart-finder .guided-grid`

### Compare `/compare`

เป้าหมาย:

- แก้ utilitarian table feel
- ทำให้ compare route ไม่หลุดจาก warm/editorial language ของระบบ

จุดแตะหลัก:

- `.compare-table`
- `.compare-table th`
- `.compare-table td`
- `.compare-flow-card`
- `.compare-empty-followup`
- `.metric-card`
- `.metric-card__label`
- `.metric-card__value`

### Project Detail `/projects/[slug]`

เป้าหมาย:

- รักษาความแข็งแรงของ shell เดิม
- เพิ่ม clarity ของ signal cards และ supporting copy

จุดแตะหลัก:

- `.public-hero__proofs`
- `.public-hero__proof`
- `.public-hero__signal`
- `.public-hero__signal-title`
- `.public-hero__signal-copy p:last-child`
- `.authority-card`
- `.decision-pack`
- `.insight-list__item`
- `.decision-page__support-note`

### Property Detail `/property/[slug]`

เป้าหมาย:

- ยกระดับจาก generic listing page ไปเป็น premium advisory property detail
- ทำให้ gallery, facts, และ price block ดู curated มากขึ้น

จุดแตะหลัก:

- `.gallery-main`
- `.gallery-counter`
- `.gallery-thumbnails`
- `.gallery-thumbnail`
- `.property-header`
- `.property-location`
- `.property-price`
- `.property-facts`
- `.property-description-card`
- `.decision-page__support-note`

## Pass 1: Typography Pass

### Goal

ทำให้ type hierarchy ชัดขึ้นทั้งระบบ โดยไม่เพิ่มฟอนต์ใหม่ และไม่ทำให้ page ดู over-designed

### Files

- `admin-app/styles/public-primitives.css`
- `admin-app/app/globals.css`

### Classes / Tokens To Adjust

Global hierarchy:

- `body`
- `h1`
- `h2`
- `h3`
- `--font-h1`
- `--font-h2`
- `--font-h3`
- `--font-body`
- `--line-height`

Public hierarchy:

- `.section-title`
- `.section-subtitle`
- `.home-hero-slider__title`
- `.home-hero-slider__title--th`
- `.home-hero-slider__subtitle`
- `.home-hero-slider__context`
- `.public-hero__signal-title`
- `.public-hero__signal-copy p:last-child`
- `.project-catalogue-card__title`
- `.project-catalogue-card__summary`
- `.contact-route-card .card-title`
- `.contact-route-card .card-subtitle`
- `.decision-pack .card-title`
- `.decision-pack .card-subtitle`
- `.metric-card__label`
- `.metric-card__value`
- `.property-location`
- `.property-price`
- `.buy-scan-note__eyebrow`
- `.buy-scan-note__body`

### Design Intent

- EN: headline สำคัญยังใช้ serif ได้ แต่ section headings รองต้องสงบลงเล็กน้อย
- TH: ไม่เพิ่ม serif ใหม่ แต่ใช้ weight, spacing, max-width, และ line-height ช่วยให้ดู premium ขึ้น
- title กับ subtitle ต้องแยกชั้นกันชัดขึ้น โดย subtitle ไม่ควรดู “เบาจนหาย”

### Guardrails

- ห้ามเพิ่ม heading scale จนทุก section แย่งกันเป็น hero
- ห้ามทำ TH ให้ดูเหมือนใช้ style เดียวกับ EN แบบฝืนธรรมชาติของสคริปต์

### Acceptance

- Hero เด่นที่สุดทุก route
- Section headings รองลงมาอย่างชัดเจน
- Metadata / captions ไม่หายไปจากสายตา

## Pass 2: Contrast Pass

### Goal

ยกความชัดของข้อความรองและ dark-surface copy โดยไม่เสีย softness ของแบรนด์

### Files

- `admin-app/styles/public-primitives.css`
- `admin-app/app/globals.css`

### Tokens To Introduce Or Normalize

ควรพิจารณาสร้าง semantic text tokens ใหม่แทน hardcoded rgba กระจัดกระจาย เช่น:

- `--public-copy-strong`
- `--public-copy-muted`
- `--public-copy-soft`
- `--public-copy-inverse`
- `--public-label-muted`
- `--public-link-emphasis`

### Classes / Selectors To Refactor

- `.section-subtitle`
- `.home-hero-slider__subtitle`
- `.home-hero-slider__context`
- `.home-hero-slider__trust-item`
- `.public-hero__proof`
- `.public-hero__signal-copy p:last-child`
- `.contact-route-card .card-subtitle`
- `.buy-scan-note__body`
- `.buy-flow-utility__text`
- `.cta-strip__text`
- `.guided-dialog__step`
- `.text-caption`
- `.home-trust-snapshot__label`
- `.home-page .home-trust-snapshot__value`
- `.property-location`
- `.decision-page__support-note`

### Design Intent

- บนพื้นมืด: secondary copy ไม่ควรต่ำกว่า level ที่ทำให้ดู “บาง”
- บนพื้นอ่อน: muted copy ต้องยังอ่านได้สบายบน mobile
- label กับ helper text ควรมี contrast ต่ำกว่าหลัก แต่ไม่ควร drop จนดู faded

### Guardrails

- ห้ามแก้ด้วยการทำทุกอย่างเข้มเท่ากัน
- ห้ามลด layered depth ของ dark hero จนดูแข็ง

### Acceptance

- ไม่มีจุดที่ผู้ใช้ต้องเพ่งอ่านข้อความรอง
- subtitle และ helper text ยังดู elegant แต่ไม่จมหาย

## Pass 3: Surface Consistency Pass

### Goal

ทำให้ระบบ card / panel / utility strip มีภาษารูปร่างเดียวกันมากขึ้น และลด split-brain ระหว่าง `globals.css` กับ `public-primitives.css`

### Files

- `admin-app/styles/public-primitives.css`
- `admin-app/app/globals.css`

### Classes To Normalize

- `.authority-card`
- `.page-rail-card`
- `.metric-card`
- `.trust-box`
- `.contact-route-card`
- `.buy-scan-note`
- `.buy-flow-utility`
- `.cta-strip`
- `.property-facts`
- `.public-hero__signal`
- `.project-catalogue-card`

### Design Intent

- radius, border softness, shadow depth, และ inner spacing ต้องอยู่ family เดียวกัน
- utility-looking blocks ควรถูกยกระดับให้อยู่ในภาษาของ editorial advisory system

### Guardrails

- ห้ามทำทุก card เหมือนกันจนเสีย hierarchy
- ห้ามเพิ่ม shadow หนักจนดู luxury แบบเก่า/อสังหาฯ portal

### Acceptance

- ผู้ใช้รู้สึกว่า route ทั้งหมดมาจาก design system เดียวกัน
- utility blocks ไม่หลุดโทนจาก hero และ editorial cards

## Pass 4: Media Pass

### Goal

ยกระดับความรู้สึกของภาพโดยไม่เพิ่ม source ใหม่และไม่แตะ logic การดึง media

### Files

- `admin-app/styles/public-primitives.css`
- `admin-app/app/globals.css`
- `admin-app/components/home/HomeHero.tsx`
- `admin-app/app/(site)/[locale]/projects/page.tsx`
- `admin-app/app/(site)/[locale]/projects/[slug]/page.tsx`
- `admin-app/app/(site)/[locale]/property/[slug]/page.tsx`

### Areas To Adjust

Homepage:

- `.home-hero-slider__media-stack`
- `.home-hero-slider__scrim`
- `.home-hero-slider__image`

Projects listing:

- `.project-catalogue-card__visual`
- `.project-catalogue-card__media`
- `.project-catalogue-card__media-scrim`
- `.project-catalogue-card__chips`

Property detail:

- `.gallery-main`
- `.gallery-counter`
- `.gallery-thumbnail`
- `.gallery-thumbnail.active`

Project detail:

- media shell radius and crop consistency in gallery section

### Design Intent

- ไม่เพิ่มวิดีโอในรอบนี้
- ไม่เพิ่ม decorative image blocks ที่ไม่ช่วยการตัดสินใจ
- ใช้ภาพเพื่อยืนยัน tone และช่วยคุม emotional quality ของหน้า ไม่ใช่เพื่อเติมพื้นที่

### Guardrails

- ห้ามใส่ stock-feel imagery เพิ่ม
- ห้ามใช้ image treatment ที่ทำให้ text legibility แย่ลง

### Acceptance

- Hero still image ดูแพงขึ้นโดยไม่รบกวน CTA
- Property detail gallery ดู curated มากขึ้น
- Listing cards ไม่ตกกลับไปเป็น feed of thumbnails

## Pass 5: Data Presentation Pass

### Goal

ทำให้หน้าที่มีข้อมูลเชิงตารางหรือข้อมูลหลายชุดดูเหมือน productized advisory surfaces ไม่ใช่ utility admin blocks

### Files

- `admin-app/app/globals.css`

### Classes To Adjust

- `.info-table`
- `.info-table th`
- `.info-table td`
- `.compare-table`
- `.compare-table th`
- `.compare-table td`
- `.metric-card`
- `.metric-card__label`
- `.metric-card__value`
- `.guided-summary`

### Route Focus

- `/buy`
- `/compare`
- `/smart-finder`

### Design Intent

- table headers ต้องมี visual authority ชัดขึ้น
- rows ต้องหาย utilitarian feel
- metric cards ต้องดูเหมือน decision instruments ไม่ใช่ stat boxes ทั่วไป

### Guardrails

- ห้ามเปลี่ยน schema หรือ order ของข้อมูล
- ห้ามเพิ่ม derived metrics ใหม่ในรอบนี้

### Acceptance

- Compare อ่านง่ายขึ้นโดยไม่ต้องลดข้อมูล
- Buy tables ดูเป็น part ของ premium route เดียวกัน

## Pass 6: Locale Premium Parity Pass

### Goal

ยกระดับความรู้สึกของ TH ให้ premium ใกล้ EN มากขึ้น โดยไม่ฝืนใช้ visual grammar แบบอังกฤษตรงๆ

### Files

- `admin-app/styles/public-primitives.css`
- `admin-app/app/globals.css`

### Areas To Tune

- `.home-page[data-locale='th'] .section-title`
- `.home-page[data-locale='th'] .home-hero-slider__title--th`
- `.home-page[data-locale='th'] .home-hero-slider__subtitle`
- `.decision-page[data-locale='th'] .section-title`
- `.decision-page[data-locale='th'] .public-hero__signal-title`
- `.decision-page[data-locale='th'] .public-hero__signal-copy p:last-child`
- `.projects-page[data-locale='th'] .section-title`
- `.home-page[data-locale='th'] .home-trust-snapshot__value`

### Design Intent

- TH ใช้ sans เป็นหลักได้ แต่ต้องคุม width, spacing, and emphasis ให้ดูตั้งใจ
- TH ต้องไม่รู้สึกว่าเป็น “fallback version” ของ EN

### Guardrails

- ยังไม่เปลี่ยน font asset ใน pass นี้
- ไม่ไล่ parity แบบ pixel-identical

### Acceptance

- TH ดูเป็น intentional premium locale ไม่ใช่ utilitarian translation
- EN/TH share system เดียวกัน แต่มี cadence ที่เหมาะกับภาษา

## Execution Order

ลำดับที่ต้องทำ:

1. `Typography pass` `[complete]`
2. `Contrast pass` `[complete]`
3. `Surface consistency pass` `[complete]`
4. `Media pass` `[complete]`
5. `Data presentation pass` `[complete]`
6. `Locale premium parity pass` `[complete]`

## Next Optional Round

หลังจาก baseline ขึ้น `100/100` แล้ว งานถัดไปควรเป็น route-level micro-polish แบบแคบ ไม่ใช่ system rewrite:

- `Property advisor rail micro-polish`
  โฟกัส: ทำให้ agent card, lead form shell, และ supporting signals ของ property detail side rail ขึ้นมาอยู่ใน concierge grammar เดียวกับ project/contact
- `Buy decision helper micro-polish`
  โฟกัส: ทำให้ helper strips, estimator support blocks, และ decision nudges ของ buy route staged เป็น premium advisory path มากขึ้น

เหตุผล:

- ต้องล็อก type และ contrast ก่อน เพราะสองอย่างนี้กำหนด character ของทุก route
- media และ table polish จะดูแม่นขึ้นเมื่อ type scale และ contrast เสถียรแล้ว

## Validation After Each Pass

ขั้นต่ำหลังแต่ละ pass:

- `npm test -- __tests__/public_design_system_contract.test.ts`

เมื่อแตะ homepage:

- `npm test -- __tests__/home_design_surface_contract.test.ts`
- `npm test -- __tests__/home_hero_cta_hierarchy.test.tsx`

เมื่อแตะ project detail:

- `npm test -- __tests__/project_detail_shell.test.tsx`

เมื่อแตะ property detail:

- `npm test -- __tests__/property_detail_shell.test.tsx`

เมื่อแตะ compare / public visual shell:

- `npm test -- __tests__/public_visual_qa_contract.test.ts`

หลังจบแต่ละ major pass:

- rerun full public hybrid QA with current route matrix and breakpoints

## Done Condition For This Brief

เอกสารนี้ถือว่าใช้งานได้เมื่อ:

- implementer อ่านแล้วรู้ว่าแต่ละ pass จะเริ่มที่ file ไหน
- implementer รู้ว่า selector / token ไหนคือ shared leverage point
- implementer รู้ว่าอะไรห้ามแตะในรอบ aesthetic pass
- implementer เริ่มลงมือแก้ทีละ pass ได้โดยไม่ต้องตีความใหม่ระดับ strategy
