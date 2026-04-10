# Public Visual QA Scoring Model

> Note
> For future public UI review and release decisions, the human-facing authoritative gate is now `docs/AMP_PUBLIC_UI_QA_GATE.md`.
> This file remains the detailed scoring model for the automated / evidence-weighted QA workflow.

อัปเดต: `2026-04-05`  
model version: `public-visual-qa-v3`

## เป้าหมาย

ทำให้ `admin-app/scripts/run-public-visual-qa.mjs` ให้คะแนนแบบ:

- อธิบายได้
- เปรียบเทียบข้าม route / locale / breakpoint ได้
- แยก `runtime defect` ออกจาก `UX debt`
- ใช้เป็น evidence ได้ทั้งกับ local QA และ deploy verification

ระบบนี้ไม่ใช่ aesthetic score แบบ subjective ล้วน ๆ  
มันเป็น `hybrid evidence-weighted public UI health score`

`v3` เพิ่ม:

- computed typography metrics
- spacing rhythm metrics
- CTA hierarchy score
- section-aware homepage score
- screenshot review checklist ที่ aggregate เข้า `summary.json`
- manual screenshot review input ผ่าน `PUBLIC_VISUAL_REVIEW_FILE` เพื่อทำ hybrid score จริง
- hero typography capture จากทั้ง `home hero`, `PublicAdvisoryHero`, และ primary detail headers เพื่อไม่ penalize หน้า decision/detail ที่ไม่ได้ใช้ `.home-hero-slider__title`
- section padding spacing check จะนับเฉพาะ `padding > 0` เพื่อไม่ double-penalize section ที่ intentional zero-padding และใช้ anchor/gap rhythm เป็นตัวกำหนด spacing อยู่แล้ว

## Score Dimensions

| Dimension | Weight | ตรวจอะไร |
|---|---:|---|
| `runtimeHealth` | `14` | HTTP status, console errors/warnings, network failures |
| `layoutIntegrity` | `10` | overflow, H1 อยู่ใน first viewport หรือไม่, heading density ด้านบน |
| `semanticsAndLandmarks` | `7` | `main`, H1 count, section headings |
| `interactionReadiness` | `7` | CTA coverage, interactive density, above-the-fold actions |
| `mobileSafety` | `10` | tap target ต่ำกว่า `44px`, mobile first-viewport safety |
| `mediaStability` | `8` | visible broken / incomplete images |
| `contentClarity` | `7` | heading length, above-the-fold text density, section rhythm |
| `localeIntegrity` | `5` | route locale vs `html lang` |
| `typographyMetrics` | `10` | hero type scale (home + advisory/detail heroes), section title scale, body readability, line-height ratios |
| `spacingRhythm` | `8` | section gap rhythm, card padding consistency, spacing scale discipline |
| `ctaHierarchy` | `7` | hero CTA structure, primary/secondary balance, final CTA readiness |
| `sectionAwareHomepage` | `7` | homepage section order, curated split, owner bridge, final CTA handoff |

รวม = `100`

## Hybrid Review Input

ถ้าต้องการ map การ review จาก screenshot โดยมนุษย์เข้า summary เดียวกัน ให้ส่งไฟล์ JSON ผ่าน env:

- `PUBLIC_VISUAL_REVIEW_FILE=docs/qa/public-visual-review.json`

รูปแบบขั้นต่ำ:

```json
{
  "reviewer": "design-qa",
  "captures": [
    {
      "route": "/en",
      "width": 390,
      "checklist": [
        {
          "id": "hero_balance",
          "area": "Art Direction",
          "status": "warn",
          "message": "Hero still feels dense against the header.",
          "evidence": {
            "note": "Needs calmer chrome separation"
          }
        }
      ]
    }
  ]
}
```

manual checklist items จะถูกรวมเข้า `captures[].checklist`, `screenshotChecklist`, `checklistSummary`, และ `topChecklistConcerns` โดยตรง

## Rating Thresholds

| Score | Rating |
|---|---|
| `97-100` | `elite` |
| `92-96.9` | `strong` |
| `85-91.9` | `passing` |
| `75-84.9` | `watch` |
| `< 75` | `failing` |

## Capture Output

แต่ละ capture ต้องมี:

- `score`
- `rating`
- `dimensionScores`
- `checklist`
- `checklist[].source`
- `checklist[].reviewer`
- `findings`
- `findingCounts`
- raw metrics เช่น `h1Count`, `smallTapTargetCount`, `visibleBrokenImageCount`, `aboveFoldInteractiveCount`, `heroTitleMetrics`, `homepageSectionGaps`, `cardPaddingSamples`

ดังนั้น score หนึ่งตัวจะย้อนกลับได้ว่าเสียเพราะอะไร ไม่ใช่แค่รู้ว่า “ตก”

## Summary Output

`summary.json` ต้องมี:

- `scoreModelVersion`
- `scoreDimensions`
- `scoreThresholds`
- `score`
- `rating`
- `dimensionAverages`
- `byRoute`
- `byLocale`
- `byBreakpoint`
- `screenshotChecklist`
- `checklistSummary`
- `reviewInputs`
- `criticalFindings`
- `warningFindings`
- `topFindings`
- `topChecklistConcerns`

## Severity Model

- `critical`: release blocker หรือ visual/runtime defect ที่ควร fail QA
- `major`: ปัญหาที่ลดคุณภาพอย่างมีนัยสำคัญ แต่ไม่ถึงขั้น hard blocker ทุกกรณี
- `minor`: debt หรือ signal ที่ควรติดตาม แต่ไม่ควรลากคะแนนลงจนเกินจริง

## Intended Use

ใช้ model นี้เมื่อ:

- compare local branch vs deployed live
- compare EN vs TH
- compare mobile vs desktop
- detect regression หลัง CSS, media, locale, หรือ layout changes
- audit homepage composition ด้วย checklist แบบ evidence-driven

ไม่ควรใช้ model นี้แทน:

- manual art direction review
- copy review ระดับ tone nuance
- section-by-section product judgment
- final design signoff แบบ human-only visual taste review

## Acceptance Baseline

สำหรับ public homepage / key decision routes:

- target ขั้นต่ำ: `passing`
- target release-ready: `strong`
- target benchmark/closeout: `elite`

ถ้า `criticalFindings.length > 0` ให้ถือว่า score สูงอย่างเดียวไม่พอ ต้องอ่าน findings ควบคู่เสมอ
