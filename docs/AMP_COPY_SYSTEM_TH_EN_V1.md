# AMP Copy System TH / EN V1

Status: Authoritative public copy and tone system for English and Thai public UI.

This document governs tone, wording, labels, CTA language, and bilingual quality for the public AMP Pattaya website.

## Brand Voice

AMP should sound like:

- a premium property advisory team
- calm, informed, and selective
- practical about buying, investing, renting, and selling
- confident without hype
- local without slang
- international without corporate stiffness

AMP should not sound like:

- a SaaS product
- a data dashboard
- a lead-gen template
- a high-pressure broker script
- a machine-translated interface

## English Tone Rules

- Use clear, composed sentences.
- Lead with outcome, fit, or next step.
- Prefer “curated”, “verified”, “review”, and “shortlist” where they help real users.
- Avoid overclaiming certainty or speed.
- Keep luxury language restrained.

Preferred English style:

- “Get a Pattaya shortlist built around your brief”
- “Review verified projects”
- “Tell us your brief”

Avoid:

- “Unlock your investment journey now”
- “Best deals guaranteed”
- “Premium solutions for your real-estate needs”

## Thai Tone Rules

- Thai must read as native public-facing copy, not literal translation.
- Keep Thai direct, elegant, and easy to scan.
- Prefer clear Thai verbs over transliterated English business jargon.
- Keep sentence length moderate. Thai public UI becomes heavy fast when over-explained.
- Use English only for unavoidable proper nouns, brand names, or legally fixed terms.

Preferred Thai style:

- “เริ่มรายการคัดไว้ของฉัน”
- “ดูโครงการที่ตรวจแล้ว”
- “เล่าโจทย์ของคุณให้เราฟัง”

Avoid:

- “เริ่ม process ของคุณ”
- “route นี้จะช่วย optimize next step”
- “inventory ที่ publish แล้ว”

## Banned Language Patterns

Never ship these patterns publicly:

- placeholder / seed / TODO / draft / pending / debug phrasing
- CMS-style wording such as “published object”, “content block”, “fallback”
- technical data terms in public UI such as `dataset`, `API`, `sync`, `render`, `module`
- vague luxury filler such as “ultimate lifestyle”, “world-class living” without context
- aggressive urgency such as “act now before it’s too late”

For Thai public UI, also avoid English leakage such as:

- `brief`
- `inventory`
- `next step`
- `market context`
- `developer options`
- `featured`
- `listings`

unless the term is intentionally approved and cannot be translated cleanly.

## System-Like / Too-Technical Wording To Avoid

Bad:

- “Loading listing surface”
- “No published objects available”
- “This route has no dataset”
- “Fallback image in use”

Better:

- “No listings match the current filters”
- “The team can help narrow the right options for you”
- “This page is being prepared”

## Preferred CTA Style

CTA rules:

- Start with a verb
- Promise a clear next action
- Avoid generic “learn more” on key conversion surfaces
- Keep secondary CTA useful but calmer

Good CTA patterns:

- “Start My Shortlist”
- “Review Verified Projects”
- “Send My Brief”
- “Speak to an Advisor”
- “เริ่มรายการคัดไว้ของฉัน”
- “ดูโครงการที่ตรวจแล้ว”
- “ส่งรายละเอียดให้เรา”
- “คุยกับที่ปรึกษา”

Bad CTA patterns:

- “Submit”
- “Click here”
- “Learn more” as the only main CTA
- “ดำเนินการต่อ”
- “เปิดระบบ”

## Glossary Of Common UI Labels

Use these as defaults unless a route has a stronger approved label.

| EN | TH |
| --- | --- |
| Home | หน้าแรก |
| Projects | โครงการ |
| Buy | ซื้อ |
| Rent | เช่า |
| Invest | ลงทุน |
| Sell | ขาย |
| Contact | ติดต่อ |
| Start My Shortlist | เริ่มรายการคัดไว้ของฉัน |
| Review Verified Projects | ดูโครงการที่ตรวจแล้ว |
| Send My Brief | ส่งรายละเอียดให้เรา |
| Speak to an Advisor | คุยกับที่ปรึกษา |
| Verified | ตรวจแล้ว |
| Curated | คัดแล้ว |
| Area Guide | ไกด์พื้นที่ |
| Private Tour | นัดชมแบบส่วนตัว |
| Starting from | เริ่มต้นที่ |
| Best for | เหมาะกับใคร |
| Next step | ขั้นตอนถัดไป |
| Why trust AMP | เหตุผลที่เชื่อใจ AMP |

## Rules For Thai Naturalness

- Rewrite for Thai sentence flow. Do not preserve English word order blindly.
- Use Thai nouns and verbs that sound like real customer-facing language.
- Avoid stacking too many English nouns into one Thai sentence.
- Remove English filler phrases even if the source EN used them.
- If a Thai label sounds like an internal tool label, rewrite it.

## Rules That Prevent English Labels From Leaking Into Thai UI

- All primary navigation labels must be Thai.
- All primary CTA labels on Thai pages must be Thai.
- Thai empty states, trust sections, and form labels must not contain English system terms.
- English brand and platform names may remain only where they are truly proper nouns.
- If TH editorial content is missing and would produce obvious EN leakage, the section should be hidden until fixed.

## Good Vs Bad Copy

### Home Hero

Good EN:

- “Get a Pattaya shortlist built around your brief”

Bad EN:

- “Discover the ultimate Pattaya investment ecosystem”

Good TH:

- “เริ่มจากรายการคัดไว้พัทยาที่จัดตามโจทย์ของคุณ”

Bad TH:

- “เริ่ม process shortlist ของคุณสำหรับ Pattaya property”

### Trust Copy

Good EN:

- “Curated listings, verified information, and local Pattaya guidance before you commit.”

Bad EN:

- “We offer the best premium service with total transparency and excellence.”

Good TH:

- “รายการที่คัดและตรวจแล้ว พร้อมทีมพัทยาที่ช่วยพาคุณไปยังขั้นถัดไปอย่างชัดเจน”

Bad TH:

- “เราให้ service premium พร้อม data transparency ระดับสูง”

## Page-Copy Principles For Luxury Trust-Focused Property Advisory

- Say less, but say something useful.
- Lead with fit, clarity, and next action.
- Use trust language only when the page can support it.
- Do not oversell a page with weak data.
- A premium site sounds edited. Cut filler aggressively.
- On Thai pages, sounding natural matters more than mirroring the exact English sentence shape.

## Implementation Rules For Copy

- Prefer dictionary-driven UI copy over inline hardcoded strings.
- Prefer CMS text only when it is publish-ready, locale-ready, and passes the publish gate.
- Strip placeholder and seed content before it reaches the public surface.
- Review both EN and TH when a shared concept changes, even if only one locale was edited.
