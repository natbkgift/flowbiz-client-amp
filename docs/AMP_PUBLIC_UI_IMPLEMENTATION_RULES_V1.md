# AMP Public UI Implementation Rules V1

Status: Engineering rules for implementing public UI without drift.

This document translates the visual, copy, and publish governance into code-level implementation rules.

## Shared Primitives Requirement

Public UI should reuse shared primitives before creating new route-local UI.

Required reuse targets include:

- `admin-app/styles/public-tokens.css`
- `admin-app/styles/public-primitives.css`
- `admin-app/components/layout/Container.tsx`
- `PublicSectionHeader`
- `PublicSurfaceCard`
- `PublicChip`
- `PublicActionRow`
- shared form primitives

If a component pattern is needed on more than one public route, promote it into the shared system.

## Token Centralization Requirement

Do not hardcode public design values when a system token already exists.

Do not add one-off values for:

- container widths
- page gutters
- section spacing
- font sizes
- line heights
- radii
- control heights
- shadows
- accent colors

If the current system is insufficient, add a named token first and document why.

## No Arbitrary One-Off Styling

Avoid route-local styling such as:

- isolated `text-*` size patches
- isolated `rounded-*` shape changes
- isolated `shadow-*` treatments
- raw `p-*` and `gap-*` overrides that bypass section rhythm

Allowed exception:

- data-driven layout values that cannot live in the shared system yet, but only with a clear implementation note

## Locale Mapping Rules

- Public copy should come from the dictionary or publish-ready CMS content.
- Do not use inline locale ternaries for major public copy if the dictionary path exists.
- Thai routes must render Thai-first labels and CTA language.
- If Thai content is not ready and the visible result would be mixed-language UI, hide the section or use approved Thai fallback copy.

## Publish-Gate Implementation Rules

- Apply publish gating before render where possible.
- Filter weak cards out of collection surfaces before the UI maps them.
- Detail pages may use controlled fallback states, but list and home surfaces should prefer omission.
- Placeholder detection should happen before text is displayed publicly.
- Media should resolve to local-safe renderable paths only.

## Responsive Implementation Rules

- Start mobile-first.
- Reuse existing breakpoint names and shared responsive patterns.
- A new page should not invent a custom breakpoint story when the shared tiers already work.
- Keep mobile action ownership clear. Do not layer sticky/floating CTAs on routes that already own their conversion surface.

## CTA Implementation Rules

- Maintain one clear dominant CTA per decision frame.
- Home hero keeps exactly two button CTAs.
- Route-level closing panels may use `btn-cta`.
- Secondary and tertiary actions must look secondary and tertiary.

## Content Assembly Rules

- Build public content in this order:
  1. determine if the content is strong enough to render
  2. resolve locale-safe copy
  3. resolve local-safe media
  4. render with shared primitives

- Do not assemble the full shell first and hope weak data still looks acceptable.

## Testing / Validation Expectations

When public UI changes:

- update or preserve relevant contract tests
- validate route copy and locale behavior
- validate design system compliance where the change affects primitives or tokens
- validate publish behavior when weak or missing content is involved

Useful existing tests include:

- `admin-app/__tests__/public_design_system_contract.test.ts`
- `admin-app/__tests__/public_route_copy_contract.test.ts`
- `admin-app/__tests__/public_messaging_hierarchy.test.ts`
- `admin-app/__tests__/public_cta_visibility.test.tsx`
- `admin-app/__tests__/thai_dictionary_copy_regression.test.ts`

## Engineering Anti-Patterns

Do not:

- build public UI directly from raw CMS payloads without readiness filtering
- hardcode public copy inside JSX for convenience
- paper over weak data with decorative styling
- use placeholder imagery as if it were neutral production content
- let home or premium entry routes grow into uncontrolled content feeds
