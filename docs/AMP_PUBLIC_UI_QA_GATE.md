# AMP Public UI QA Gate

Status: Authoritative review and release gate for public-facing UI work.

Use this gate for homepage work, public route work, shared public components, public copy changes, and public publishability changes.

## How To Use This Gate

- Review the changed surface in EN and TH when both locales exist.
- Review at minimum on mobile and desktop.
- Score each category.
- Record blockers separately from score.
- A page does not pass if blockers exist, even if the numeric score is high.

## Scoring Model

Score each category from `0` to `10`.

| Category | Weight | Pass standard |
| --- | ---: | --- |
| Layout consistency | 10 | shared container, grid, and shell logic |
| Section spacing | 8 | shared rhythm, no random compression or gaps |
| Typography consistency | 10 | shared type roles, Thai-safe readability |
| CTA hierarchy | 10 | one dominant action where needed, no CTA competition |
| Contrast / accessibility | 8 | readable, keyboard-safe, tap-safe |
| Card consistency | 8 | shared card language, no weak visual drift |
| Image quality / ratio | 8 | premium media presentation, stable ratios |
| Mobile behavior | 10 | usable, calm, no overflow, clear action path |
| Thai / English correctness | 10 | natural Thai, consistent EN, no drift |
| Trust / professionalism | 8 | calm, credible, not template-like |
| Publish quality | 5 | no placeholders, no weak incomplete blocks |
| Performance awareness | 5 | no obviously heavy or fragile UI choices |
| Conversion clarity | 10 | the next action is obvious without shouting |

Total score: `100`

## Pass Criteria

A public UI change passes only when all are true:

- total score is `90+`
- no blocker issues remain
- no critical category scores below `7/10`
- home and key conversion routes should read at least as `strong`, not merely "not broken"

Critical categories are:

- Layout consistency
- Typography consistency
- CTA hierarchy
- Mobile behavior
- Thai / English correctness
- Publish quality
- Conversion clarity

## Fail Criteria

The work fails if any of these are true:

- score below `90`
- blocker issue exists
- Thai locale shows obvious English leak or unnatural translated structure
- a weak or incomplete section is visible
- CTA hierarchy is unclear or competitive
- the page feels like a template, dashboard, or unfinished CMS surface

## Blocker Issues

Any single blocker below is release-blocking:

- placeholder, TODO, pending, draft, seed, or debug text visible publicly
- broken, missing, or visibly weak hero or card media on premium landing surfaces
- Thai locale with obvious English UI leakage
- missing or conflicting primary CTA
- mobile overflow, clipped actions, or broken tap targets
- low-contrast text on meaningful content
- unsourced testimonial / trust proof / credibility claim
- section rendered with clearly incomplete data
- legal or contact trust surface missing on a route that depends on it

## Category Checks

### 1. Layout Consistency

Check:

- shared container variants only
- shared section shells
- aligned columns and card widths

Fail examples:

- one route invents a new page width
- cards float at arbitrary widths
- page shell padding is hardcoded locally

### 2. Section Spacing

Check:

- section rhythm matches the visual system
- sub-sections feel intentional
- no "too tight above / too loose below" drift

Fail examples:

- random `mt-*` and `pt-*` patches stacking on top of system rhythm
- one section visually collapses into the next

### 3. Typography Consistency

Check:

- headings use shared roles
- body copy uses shared body classes
- Thai line-height and tracking remain calm

Fail examples:

- local `text-*` utility stack replaces type roles
- Thai headings feel cramped or English-led

### 4. CTA Hierarchy

Check:

- one clear next action per decision frame
- hero CTA pair is stable
- secondary action does not impersonate primary importance

Fail examples:

- three equally loud buttons in one hero
- final CTA weaker than a nearby browse button

### 5. Contrast / Accessibility

Check:

- readable text contrast
- focus visibility
- tap target safety
- keyboard access

Fail examples:

- gold text on pale backgrounds with weak contrast
- small icon-only controls under `44px`

### 6. Card Consistency

Check:

- cards use the shared card system
- metadata rhythm is consistent
- cards feel premium and curated

Fail examples:

- one section uses admin-style tiles
- cards mix unrelated spacing and radius systems

### 7. Image Quality / Ratio

Check:

- image crop is stable within a grid
- media feels premium, not thin
- fallback usage follows the publish gate

Fail examples:

- mixed aspect ratios in one card row
- placeholder-only cards on home

### 8. Mobile Behavior

Check:

- first viewport tells the story
- CTAs remain reachable
- no hidden overflow or awkward wraps

Fail examples:

- page becomes a long unstructured feed
- CTA buried after too many cards

### 9. Thai / English Correctness

Check:

- Thai reads naturally
- English is polished
- labels are consistent by locale

Fail examples:

- Thai UI includes English nouns for convenience
- direct English syntax mapping makes Thai read awkwardly

### 10. Trust / Professionalism

Check:

- page feels credible, calm, and intentional
- no weak proof surfaces
- no "product demo" tone

Fail examples:

- generic trust claims with no grounding
- homepage feels like a catalogue feed or marketing template

### 11. Publish Quality

Check:

- no incomplete block is visible
- no seed content leaks
- omission choices feel intentional

Fail examples:

- empty review rail
- thin area/developer card with partial data

### 12. Performance Awareness

Check:

- no obviously wasteful media or animation choices
- page is not overloaded with heavy surfaces

Fail examples:

- too many high-priority images
- decorative motion on core content

### 13. Conversion Clarity

Check:

- visitor can identify the next meaningful action quickly
- forms and routes are coherent

Fail examples:

- page provides information but no decision path
- visitor has to guess which CTA matters

## Examples Of Unacceptable Public Output

- a Thai page with English fallback blocks mixed into Thai paragraphs
- a home page that shows weak testimonial placeholders
- a projects module with thin cards included just to fill a row
- a premium CTA panel styled with arbitrary one-off utilities
- a public route that reads like CMS or QA output
- a mobile page where the primary action disappears under content bulk

## Release Recommendation Levels

- `90-93`: acceptable but still needs careful human review
- `94-97`: strong release candidate
- `98-100`: benchmark quality

AMP homepage and key conversion routes should aim for `94+`.
