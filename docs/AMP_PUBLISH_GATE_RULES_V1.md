# AMP Publish Gate Rules V1

Status: Authoritative public content publish gate for AMP Pattaya.

This document defines when a section, card, or content type is allowed to appear on public pages.

## Global Publish Rule

Public content may render only when it is:

- complete enough to feel intentional
- credible enough to protect trust
- visually strong enough for a premium surface
- locale-ready for the route it appears on

If a block fails that standard, hide it.

## Core Rule

If incomplete, weak, thin, or not locale-ready: hide.

Do not:

- pad with placeholders
- publish "coming soon" style blocks on public pages
- show a shell with missing proof just to keep symmetry
- expose raw CMS incompleteness

## Minimum Publish Requirements By Content Type

### 1. Project Cards

Minimum:

- published project status
- real project name
- routeable slug
- strong local cover image or approved local media
- location context or area label
- starting price or an approved equivalent commercial signal
- enough metadata to feel curated, not empty

Hide when:

- media is missing or weak
- location context is absent
- price / commercial signal is missing without an approved alternative
- the card reads like a database row

### 2. Property Cards

Minimum:

- active / publishable status
- real title
- local cover image
- price greater than zero
- location context
- enough decision context to justify the card

Hide when:

- no local media
- no price
- no location context
- the card is visibly thin compared with neighboring cards

### 3. Area Cards / Area Pages

Minimum:

- published area status
- real title and slug
- cover or hero media
- short orientation copy that helps the visitor understand the area
- enough linked project or listing context to justify the route

Hide when:

- the page is just a title and a cover
- Thai locale would visibly fall back to English body copy
- there is no meaningful public value yet

### 4. Developer Cards / Developer Pages

Minimum:

- developer profile or summary with real text in at least one locale
- source note
- trust proof with approval metadata
- linked published project coverage
- at least one linked published area through published projects

Hide when:

- trust proof is weak or unsourced
- there is no published project linkage
- the developer page would read as "profile pending"

Reference: `docs/contracts/A8_DEVELOPER_CONTENT_READINESS.md`

### 5. Testimonials / Reviews

Minimum:

- published status
- real quote with useful content
- attribution or approved anonymized context
- source / moderation confidence
- locale-ready display copy

Hide when:

- quote is generic and weak
- attribution is unclear without approved anonymity
- source cannot be defended
- the block exists only to fill trust space

### 6. Contact Blocks

Minimum:

- clear primary next action
- working form or channel
- response expectation
- privacy / consent language where needed
- brand-consistent reassurance

Hide or rework when:

- channels are unclear
- the block duplicates a stronger nearby CTA
- the content feels like placeholder support copy

### 7. CTA Blocks

Minimum:

- one clear primary action
- supporting copy with real value
- optional secondary action only if it supports the same decision frame

Hide or reduce when:

- there are multiple competing primaries
- the copy is generic filler
- the CTA exists only because the layout wants another block

### 8. Blog / Article Previews

Minimum:

- published article
- real title
- useful excerpt
- valid route / slug
- cover image when the section visually depends on it
- category or context label if used elsewhere in the module

Hide when:

- excerpt is thin or placeholder-like
- image quality weakens the page
- article count is too low to justify the module

## Rules For Missing Images

- Home, project-list, and property-list surfaces should omit weak cards instead of showing broken or visibly placeholder imagery.
- Detail pages may use a branded fallback image only when:
  - the route still has enough trust content
  - the missing-media state is explained calmly
  - the fallback does not make the page feel unfinished
- External hotlinked media is not acceptable for runtime display.
- Luxury surfaces should not mix strong images with obviously degraded filler cards.

## Rules For Weak / Fallback Copy

- Public copy must not reveal implementation state.
- Seed content, placeholder content, lorem ipsum, and generic "coming soon" language are not publishable.
- If text feels system-generated, too thin, or too generic for the section role, the section should be hidden.
- Prefer strong dictionary fallback only when it still feels intentional and brand-safe.

## Rules For Locale Readiness

- A TH route is not ready if it visibly reads as EN with a few translated labels.
- Primary navigation, CTA labels, headings, trust copy, and form labels on TH routes must be Thai.
- Significant English fallback inside Thai editorial blocks is not acceptable on premium public pages.
- Allowed English on TH routes:
  - brand names
  - project names
  - legally fixed external terms
  - approved unavoidable proper nouns

## Rules For Contact / Legal Trust Surfaces

- Contact and legal surfaces must feel finished.
- Missing legal body text should not be treated as a neutral defect.
- Contact surfaces must not feel like a placeholder help desk.
- If a trust-critical page lacks approved content, hold or hide weak sections rather than publishing partial reassurance.

## Sections That Should Not Render

Do not render:

- a testimonials block with sample or weak quotes
- a featured card row padded with thin cards
- a Thai section showing English body copy because Thai content is missing
- a developer page without approved trust proof
- a home review strip added only for symmetry
- a blog rail with one weak preview card

## Home-Specific Rule

Home is a curated conversion page.

That means:

- it should publish fewer, better sections
- it should clamp card counts aggressively
- it should omit weak social proof until source-ready
- it must not feel like a content dump
