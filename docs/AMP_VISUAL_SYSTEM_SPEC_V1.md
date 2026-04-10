# AMP Visual System Spec V1

Status: Authoritative public visual system for future AMP Pattaya UI work.

This document is the source of truth for public-page visual decisions. It turns the existing token and primitive layers into a binding operating spec.

## Authority And Source Files

Implementation source files:

- `admin-app/styles/public-tokens.css`
- `admin-app/styles/public-primitives.css`
- `admin-app/app/globals.css`
- `admin-app/components/layout/Container.tsx`
- `admin-app/__tests__/public_design_system_contract.test.ts`

Legacy reference only:

- `docs/contracts/AMP_UI_FOUNDATION_SPEC_2026-04-08.md`
- `docs/qa/PUBLIC_UI_AESTHETIC_IMPLEMENTATION_BRIEF_2026-04-05.md`

If this document conflicts with a legacy design note, this document wins for future work.

## Brand / Design Direction

AMP public pages should read as a premium advisory website for Pattaya property, not as a catalogue-only website.

The design direction is:

- quiet confidence over visual noise
- editorial calm over promo clutter
- curated depth over inventory sprawl
- luxury restraint over glossy excess
- decision support over feature dumping

## What AMP Should Feel Like

- calm
- premium
- warm but controlled
- locally informed
- internationally credible
- high-signal
- conversion-ready

## What AMP Must Not Feel Like

- dashboard chrome
- neon luxury cliches
- crowded marketplace UI
- generic cards-on-white template work
- over-animated landing page theatre
- "CMS fallback" presentation

## Layout System

Public layout is built on four container variants only:

| Variant | Class / API | Width | Use |
| --- | --- | --- | --- |
| Default | `container` / `Container` | `1440px` | normal public shells |
| Wide | `container--wide` / `Container variant="wide"` | `1680px` | media-heavy or inventory-heavy shells |
| Readable | `container--readable` / `Container variant="readable"` | `840px` | long-form or narrative content |
| Full | `container--full` / `Container variant="full"` | full-width with shared gutters | bleed sections that still respect the gutter system |

No fifth container language may be introduced without updating this spec.

## Max-Width Rules

- Narrative copy blocks should stay within `--public-content-measure: 68ch`.
- Major public headlines should stay within `--public-title-measure` or `--public-title-measure-wide`.
- Do not stretch body copy across the entire shell just because the shell is wide.
- Wide shells widen the frame, not the reading measure.

## Section Spacing Rules

Canonical section spacing:

| Tier | Space |
| --- | --- |
| mobile | `64px` |
| tablet | `80px` |
| desktop | `96px` |
| cinema+ | `112px` |

Rules:

- Use shared `.section`, `.section--full`, or shared section shells.
- Do not invent page-specific vertical rhythm unless the system is extended first.
- Tight local adjustments are allowed only inside a shared shell, not by changing the page rhythm.

## Grid Rules

- Public pages assume a 12-column grid.
- Shared gaps are `16px`, `24px`, and `32px`.
- Default to alignment, not asymmetry.
- Split layouts should use shared patterns such as `pattern-split-grid`, not route-local breakpoint stacks.
- Grid changes should support clarity, not novelty.

## Typography Scale

Canonical type tokens:

| Role | Token / class | Size |
| --- | --- | --- |
| H1 | `type-h1` | `clamp(2.05rem, 3.2vw, 3.3rem)` |
| H2 | `type-h2` | `clamp(1.48rem, 2.05vw, 2.04rem)` |
| H3 | `type-h3` | `clamp(1.18rem, 1.5vw, 1.48rem)` |
| H4 | `type-h4` | `clamp(1.02rem, 1.18vw, 1.16rem)` |
| Body | `type-body` | `1rem` |
| Small | `type-small` | `0.94rem` |
| Label | `type-label` | `0.78rem` |
| Caption | `type-caption` | `0.82rem` |

Rules:

- English headings may use the serif title family.
- Thai headings must shift through the token layer to the Thai-safe sans family.
- Use shared line-height and tracking tokens. Do not manually tighten Thai text.
- Section heading structure is `kicker -> title -> subtitle`, preferably via `PublicSectionHeader`.

## Color-Role System

Use color by role, not by decoration.

| Role | Token / value | Use |
| --- | --- | --- |
| Deep ink | `--color-ink: #071327` | premium anchors, dark type, deep surfaces |
| Ink soft | `--color-ink-soft: #0f2745` | secondary deep surfaces |
| Accent gold | `--color-accent: #8B6E2F` | highest-conviction CTA and premium emphasis |
| Accent hover | `--color-accent-hover: #7D6229` | CTA hover only |
| Warm stone | `--color-stone`, `--color-warm-surface` | warm premium backgrounds |
| White / light | `--color-white`, `--color-bg`, `--color-surface` | breathing room and card contrast |

Rules:

- Gold is not decorative glitter. It is reserved for conversion emphasis and premium signal moments.
- Deep ink is the primary authority color.
- Avoid saturated secondary colors unless there is a semantic reason.
- Never create a new one-off hex color for a single public route.

## Button / CTA Hierarchy

AMP uses four CTA levels:

| Level | Class | Meaning |
| --- | --- | --- |
| Conversion apex | `btn-cta` | the strongest route-closing or handoff action |
| Primary action | `btn-primary` | the main action inside the current decision frame |
| Secondary action | `btn-secondary` | an alternate action of real value |
| Tertiary action | `btn-tertiary` | browse, share, reveal, or supporting action |

Rules:

- Home hero gets exactly two button CTAs in the main row. Messaging links such as WhatsApp stay text-link or support-link style, not a third competing button.
- Each section should have one dominant action at most.
- A page should not read as "three primaries fighting each other."
- Final CTA surfaces may use `btn-cta`; list items and low-friction browses should not.

## Card System

Use the shared card language:

- `public-surface-card`
- `public-surface-card--warm`
- `public-surface-card--deep`
- `public-surface-card--interactive`

Card rules:

- Home, projects, and property cards should feel curated and premium, not like admin tiles.
- Warm cards are for premium editorial panels and curated inventory.
- Deep cards are for authority, segmentation, or strong trust emphasis.
- Interactive cards may lift subtly on hover. They must not jump or bounce.
- Card bodies should lead with title, context, and signal. Avoid decorative micro-elements that do not help decision-making.

## Image Ratio Rules

Public images should preserve a calm premium frame.

- Hero imagery should read as cinematic and immersive, not cropped like a marketplace thumbnail.
- Project and property card imagery should use stable shared ratios and `object-fit: cover`.
- Mixed ratios inside one grid are not allowed.
- Home, featured, and catalogue cards must not rely on placeholder-only imagery.
- Detail pages may use a branded fallback image only if the rest of the trust frame is strong and the limited-media state is explained calmly.

## Form Style Rules

Forms must use the shared field system:

- `form-input`
- `form-select`
- `form-textarea`
- `form-label`
- `form-helper`

Rules:

- Use the shared field height, padding, radius, focus border, and focus shadow tokens.
- Do not build public forms from raw Tailwind stacks when the shared form primitives already exist.
- Required fields must use real semantics, not visual-only asterisks.
- Lead forms should feel reassuring and premium, not transactional or cramped.

## Density / Content Rhythm Rules

- Every section must answer a clear question.
- Home and other premium entry routes should surface fewer, stronger cards.
- Two strong proof points beat six thin ones.
- A section with weak data should disappear rather than expand with filler.
- Paragraphs should stay readable and calm. Avoid walls of copy on landing sections.

## Responsive Rules

Locked public breakpoints:

- `tablet: 768px`
- `laptop: 1024px`
- `desktop: 1280px`
- `wide: 1536px`
- `cinema: 1920px`
- `wall: 2560px`

Rules:

- Mobile is stacked, not stripped of meaning.
- Desktop may breathe more, but must not invent a different story.
- Tap targets must remain mobile-safe.
- Fixed mobile action bars belong only on routes that own the conversion handoff.
- Avoid overflow, clipped chips, or line-length chaos in Thai.

## Non-Negotiables

- No one-off styling that bypasses the token and primitive layers.
- No new button grammar for one page.
- No route-specific type scale unless a shared token is added first.
- No third competing hero CTA button.
- No public section with visible placeholder text.
- No weak media blocks on premium landing surfaces.
- No English-first layout choices that break Thai readability.

## What To Avoid

Do not do this:

- add `rounded-2xl shadow-2xl p-5 md:p-8` directly to a new premium CTA block when a shared panel exists
- add a new hex accent color because one route feels "flat"
- render six mediocre cards because the CMS returned six rows
- mix serif English headlines with overly tight Thai tracking
- turn a public trust section into a KPI dashboard strip
- fill a luxury page with noisy badges, icons, and status pills
