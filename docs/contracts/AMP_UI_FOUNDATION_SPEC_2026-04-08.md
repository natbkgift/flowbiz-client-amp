# AMP UI Foundation Spec

Date: 2026-04-08
Status: Active foundation contract for Phase A and PR 0.1

This document is the canonical UI layout contract for the public AMP experience. It does not replace the current shipped design system. It hardens the existing V1 baseline so later PRs cannot reintroduce width drift, breakpoint drift, or page-template inconsistency.

## Source Of Truth

- `admin-app/styles/public-tokens.css`
- `admin-app/app/globals.css`
- `admin-app/components/layout/Container.tsx`
- `admin-app/tailwind.config.ts`
- `admin-app/__tests__/public_design_system_contract.test.ts`

## Breakpoints

The public responsive contract is locked to these named tiers:

| Tier | Min width | Use |
| --- | --- | --- |
| mobile | 0px | default stacked layout, narrow scan rhythm |
| tablet | 768px | two-column support layouts, wider gutters |
| laptop | 1024px | expanded cards, wider hero balance |
| desktop | 1280px | default large-screen layout |
| wide | 1536px | extra breathing room, not new layout logic |
| cinema | 1920px | ultra-wide density control |
| wall | 2560px | 4K guardrail tier |

Rules:

- Mobile-first styling is required.
- `tablet`, `laptop`, and `desktop` are the primary behavioral breakpoints.
- `wide`, `cinema`, and `wall` may increase spacing or visual comfort, but must not invent a different page structure.

## Containers

The public container contract is:

| Token | Value | Purpose |
| --- | --- | --- |
| `--public-container-default` | `1440px` | default page shell |
| `--public-container-wide` | `1680px` | media-heavy or marketplace layouts |
| `--public-container-readable` | `840px` | long-form/support content |
| `--public-content-measure` | `68ch` | readable copy width inside readable sections |

Container variants:

- `Container` or `.container`: default page shell
- `Container variant="wide"` or `.container--wide`: wide media/inventory shell
- `Container variant="full"` or `.container--full`: full-width wrapper with shared gutters
- `Container variant="readable"` or `.container--readable`: long-form/support shell
- `.content-readable`: internal copy measure lock

## Gutters

Page gutters are locked by tier:

| Tier | Gutter |
| --- | --- |
| mobile | `24px` |
| tablet | `32px` |
| desktop | `64px` |
| wide | `96px` |
| cinema | `112px` |
| wall | `128px` |

Rules:

- Do not hardcode page-shell horizontal padding inside route components.
- When a section needs local padding, it must sit inside the shared container instead of redefining page gutters.

## Grid Rules

- Public layouts assume a 12-column grid.
- Shared grid gaps are tokenized as `16px`, `24px`, and `32px` for compact/default/relaxed density.
- Cards and section groups should align to the container grid, not free-float at custom widths.
- New page-specific grids must document why an existing listing, gallery, or signal-grid pattern was insufficient.

## Section Width And Vertical Rhythm

Public section spacing is locked to:

| Tier | Section space |
| --- | --- |
| mobile | `64px` |
| tablet | `80px` |
| desktop | `96px` |
| cinema | `112px` |

Rules:

- Use `.section` or `.section--full` for standard section rhythm.
- Use `.section-rhythm` only when composing nested structures that still need the same contract.
- New sections should reuse existing section-header and surface primitives before introducing local spacing systems.

## Typography

Canonical public typography is locked through the shared token and primitive layers. This is a hardening pass on the shipped V1 system, not a second typography system.

Tokens live in `admin-app/styles/public-tokens.css` and are applied through `admin-app/app/globals.css` plus `admin-app/styles/public-primitives.css`.

Required canonical roles:

| Role | Canonical rule |
| --- | --- |
| H1 | `type-h1` or the canonical hero/title classes wired to the same token set |
| H2 | `type-h2` or `section-title` on standard section shells |
| H3 | `type-h3` for card and sub-section titles |
| H4 | `type-h4` for tertiary headings such as filters or rail titles |
| body | `type-body` or body-copy primitives wired to the same token set |
| small | `type-small` for secondary explanation copy |
| label | `type-label`, `form-label`, or shared eyebrow/kicker patterns |
| caption | `type-caption`, helper text, status text, and support-note text |

Locale rules:

- EN headings may use the serif title family.
- TH headings switch through the same token layer to the Thai-safe sans family.
- TH line-height and tracking adjustments must come from the token layer, not page-specific numeric overrides.

Exceptions that are allowed because they are now tokenized and documented:

- Home hero copy may use the tokenized `--public-type-home-hero-*` values.
- Home and Projects landing section headers may use the tokenized compact section-header values.
- Home final CTA may use an `h2` element with the `type-h1` class when that section functions as the page-closing conversion headline.

Rules:

- Do not add page-level magic-number font sizes or line-heights when a canonical role already exists.
- If an exception is needed, add a named token and document it here before using it.

## Content Rhythm

Paragraph, list, and section-heading rhythm must reuse the shared typography tokens.

Rules:

- Standard prose blocks should use `content-flow` or an equivalent shared article primitive.
- Paragraph spacing must come from the shared paragraph-gap token.
- List spacing and list indent must come from the shared list-gap and list-indent tokens.
- Section heading composition is `kicker -> title -> subtitle` and should prefer `PublicSectionHeader`.
- When `PublicSectionHeader` is not used, the replacement must still use the same `type-label`, heading, and body-copy contract.

## Surface And Elevation

Shared public surfaces must source panel padding, radius, border, background, and shadow from the token layer.

Rules:

- Reuse `public-surface-card` for standard light, warm, and deep panels before creating page-specific surface treatments.
- Reuse tokenized shells such as `authority-card`, `page-rail-card`, `editorial-card`, and `cta-panel` before introducing new card languages.
- Showcase variants such as the home final CTA panel and buy closing CTA may use named showcase or feature tokens, but not ad-hoc `rounded-*`, `shadow-*`, or raw utility surface overrides inside JSX.
- Shared panel padding and stack gaps must come from named panel and stack tokens rather than repeated local pixel values.
- When a component already uses `PublicSurfaceCard`, its radius, fill, and elevation should be controlled by shared CSS tokens or classes, not local utility overrides.

## Controls And CTA Hierarchy

Shared public controls must reuse the tokenized control and field system.

Rules:

- `btn-cta` is reserved for conversion-forward contact or closing actions that should clearly outrank adjacent controls.
- `btn-primary` is the main route-level action inside a local decision surface.
- `btn-secondary` is the alternate action when the user should stay in the same decision context.
- `btn-tertiary` is for lower-emphasis browse, share, reveal, or return actions.
- `form-input`, `form-select`, `form-textarea`, consent checkboxes, and `btn-block` submits must use the shared field and control tokens for height, padding, radius, border, and focus state.
- Do not rebuild button or field styling with local utility stacks when the shared control classes already cover the role.

## Page Template Rules For This Slice

These rules are enforced starting now even before the rest of Phase 0 lands:

- Home, Listing, Project, Property, and support pages must use a shared container variant for each major section.
- Support and long-form pages should prefer `readable` containers for narrative blocks.
- Long-form routes that keep a supporting rail may keep the outer section shell at `default`, but the narrative column itself should still respect the readable measure.
- Inventory and gallery-heavy surfaces may use `wide`, but only when the content genuinely benefits from the wider shell.
- No new page may introduce a fifth container language outside `default`, `wide`, `full`, or `readable` without updating this spec and its contract test.
- New page or component work must use the canonical typography roles above instead of local `text-*` utility sizing for headings, body copy, or helper copy.

## PR Review Rules

Every PR after this document lands must answer these questions:

1. Which container variant does each new section use, and why?
2. Which breakpoint changes behavior, and what exactly changes at that tier?
3. Were gutters or section spacing hardcoded anywhere instead of using the shared contract?
4. Does the page reuse an existing responsive pattern before creating a new one?
5. If a wider or readable layout was chosen, is that choice consistent with this spec?

## Validation

- `npm --prefix admin-app run test -- public_design_system_contract.test.ts`
- `npm --prefix admin-app run build`

Follow-up PRs will extend this spec for typography, spacing/surfaces, controls, responsive component behavior, and page-template usage rules.
