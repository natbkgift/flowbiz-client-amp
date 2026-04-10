# AMP Home Blueprint V1

Status: Authoritative home-page UX blueprint for future AMP Pattaya work.

The home page is a premium advisory and conversion surface. It is not a content dump, a blog hub, or an inventory wall.

## Page Goal

Make a qualified visitor understand, within one session:

- what AMP Pattaya does
- who it is for
- what route they should take next
- why AMP is credible enough to trust with their brief

## Target Audience

Primary:

- foreign buyers exploring Pattaya property seriously
- investors comparing yield, location, and risk
- relocators or lifestyle buyers who need guided narrowing, not endless browsing

Secondary:

- sellers or owners needing a route into advisory support

## Primary Conversion Goals

Ordered by importance:

1. Get the visitor into a qualified advisory handoff or shortlist request
2. Move the visitor into the correct route: buy, invest, rent/live, or sell
3. Move the visitor into verified project review, not random listing browsing

## Page-Level UX Principles

- Say what AMP does before showing volume.
- Route clarity comes before inventory depth.
- Trust should appear early, but only with real signals.
- Curated sections beat longer sections.
- The page should feel like a guided start, not a catalogue homepage.
- Every section must either sharpen intent, increase trust, or advance conversion.

## Exact Recommended Section Order

1. Hero
2. Route Pathways
3. Featured Projects
4. Curated Featured Properties
5. Decision Framing / Why Pattaya
6. Trust Micro Strip
7. Team CTA
8. Final CTA + Form

This order matches the current route contract and is the default unless a governance review approves a new structure.

## Section Roles

### 1. Hero

Must communicate:

- AMP is a Pattaya property advisory, not a generic portal
- the visitor can get a tighter shortlist around their brief
- the next step is simple and immediate

CTA hierarchy:

- Primary: shortlist / send brief
- Secondary: browse verified projects
- Support link only: messaging channel such as WhatsApp

Mobile guidance:

- H1 and both CTAs must remain visible or nearly visible in the first viewport
- no third hero button

Publish gate:

- hero copy must be strong in both locales
- hero image must be premium-grade and render cleanly

If weak / incomplete:

- do not rotate multiple weak slides
- fall back to one strong static slide

### 2. Route Pathways

Must communicate:

- AMP serves distinct visitor intents
- each route answers a different property question
- the visitor can choose a route without reading the whole site

CTA hierarchy:

- one CTA per pathway card
- no global competing CTA inside the section

Mobile guidance:

- pathway cards must stack calmly
- card microcopy must stay readable in Thai

Publish gate:

- all route cards must have purposeful copy
- if one route is weak, hide or refactor it rather than publishing a broken grid

### 3. Featured Projects

Must communicate:

- verified project stock exists
- these are worth opening first
- AMP curates what should be reviewed first

CTA hierarchy:

- primary within card: review project
- section-level CTA should not outrank the card decision

Mobile guidance:

- clamp the number of cards
- do not bury later CTA sections under excessive project volume

Publish gate:

- cards must have strong media, name, area/context, and price signal
- prefer omission over thin projects

### 4. Curated Featured Properties

Must communicate:

- there are ready units worth a second look
- AMP can move from project-level review into unit-level decision support

CTA hierarchy:

- primary within card: check fit / review unit
- secondary: shortlist save or equivalent low-friction action

Mobile guidance:

- keep the stack short
- do not let unit cards turn the page into a feed

Publish gate:

- weak cards must not render
- poor media, missing price, or missing location context means hide

### 5. Decision Framing / Why Pattaya

Must communicate:

- AMP helps the visitor think better, not just browse more
- area fit, budget reality, ownership path, and use-case framing matter

CTA hierarchy:

- light supporting CTA only if needed

Mobile guidance:

- keep this section scannable
- use blocks, not dense essays

Publish gate:

- publish only if the content sharpens decision-making
- do not publish slogan-only filler

### 6. Trust Micro Strip

Must communicate:

- AMP is credible, local, and process-led
- trust is grounded in real proof, not generic brand claims

CTA hierarchy:

- if present, the section CTA must support trust, not hijack the page

Mobile guidance:

- short proof set only
- avoid KPI clutter

Publish gate:

- unsourced testimonials or weak proof must stay hidden
- no "coming soon" review block on home

### 7. Team CTA

Must communicate:

- a real team helps narrow the first set
- the visitor can talk to humans, not just browse pages

CTA hierarchy:

- Primary: contact / talk to team
- Secondary: learn how AMP works

Mobile guidance:

- keep the section calm and compact
- this is advisory reassurance, not another hero

Publish gate:

- copy must sound real and premium
- do not render if the team story becomes generic filler

### 8. Final CTA + Form

Must communicate:

- the visitor can act now with a short brief
- AMP will return a tighter, more usable first set

CTA hierarchy:

- one dominant submit action
- one restrained secondary option at most

Mobile guidance:

- form must not feel overwhelming
- labels and required states must remain clear

Publish gate:

- no weak legal/privacy language
- no fake urgency
- form and channels must work

## What Each Section Must Omit If Weak

- Hero: extra slides, weak image rotations, generic luxury copy
- Pathways: route cards with vague audience or overlapping meaning
- Featured Projects: low-signal or visually weak project cards
- Featured Properties: thin cards, placeholder imagery, low-value metadata
- Decision Framing: generic city praise without decision value
- Trust: unsourced proof, weak testimonials, inflated claims
- Team CTA: generic "talk to us" filler
- Final CTA: bloated forms, aggressive urgency, duplicate actions

## EN / TH Copy Guidance For Home

- EN should sound composed, direct, and premium.
- TH should sound natural, confident, and locally fluent.
- Do not translate literally when a more natural Thai sentence structure is available.
- Route names may stay concise; support copy must explain intent clearly.
- Home CTAs should be action-led and outcome-led, not abstract.

## Publish-Gate Rules By Section

- Every section must clear `docs/AMP_PUBLISH_GATE_RULES_V1.md`.
- Home is a curated surface, so omission is preferred over filler.
- Reviews remain omitted until source-ready and moderation-ready.
- Home must not expose placeholder trust, source, media, or "loading" style language.

## Do Not Do This

- Do not turn the home page into a long feed of project and property cards.
- Do not add a testimonial block just to "fill trust."
- Do not place equal-weight CTAs in every section.
- Do not make the Thai home feel like an English page with translated nouns.
- Do not render weak cards because the CMS returned data.
- Do not introduce a new visual language on home that the rest of the site cannot support.
