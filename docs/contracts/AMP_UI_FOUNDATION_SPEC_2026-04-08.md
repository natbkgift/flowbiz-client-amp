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

## Page Template Rules For This Slice

These rules are enforced starting now even before the rest of Phase 0 lands:

- Home, Listing, Project, Property, and support pages must use a shared container variant for each major section.
- Support and long-form pages should prefer `readable` containers for narrative blocks.
- Inventory and gallery-heavy surfaces may use `wide`, but only when the content genuinely benefits from the wider shell.
- No new page may introduce a fifth container language outside `default`, `wide`, `full`, or `readable` without updating this spec and its contract test.

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
