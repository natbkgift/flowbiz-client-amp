# AMP Public UI Foundation - PR 1

## Purpose

This PR adds a small public-facing foundation layer for future AMP Pattaya UI migration. It maps the static prototype design language onto the existing Next.js public design system without rewriting pages or changing production behavior.

## Scope

Added:

- Opt-in `--amp-public-*` token aliases in `admin-app/styles/public-tokens.css`.
- Opt-in public primitive classes in `admin-app/styles/public-primitives.css`.
- Additional `Button` and `Card` variant mappings in `admin-app/components/public-system/tokens/publicUiTokens.ts`.

Not added:

- No route changes.
- No page rewrites.
- No form, tracking, backend, database or admin workflow changes.
- No import of `static-prototype/assets/css/style.css`.

## Token Layer

Use the `--amp-public-*` aliases when migrating prototype-driven UI so future changes can happen in one place:

```css
color: var(--amp-public-color-ink);
background: var(--amp-public-color-paper-warm);
border-radius: var(--amp-public-radius-card);
box-shadow: var(--amp-public-shadow-card);
```

These aliases currently point at the existing public token system.

The typography aliases include desktop and mobile scale tokens so future page work can follow the reviewed prototype hierarchy without page-specific overrides:

```css
font-size: var(--amp-public-display-size);
font-size: var(--amp-public-mobile-display-size);
font-size: var(--amp-public-headline-size);
```

## Component Variants

Existing `Button` now supports these future migration variants:

```tsx
<Button variant="coral">Book a Private Tour</Button>
<Button variant="ink">View Project Details</Button>
<Button variant="paper">Request Latest Availability</Button>
```

Existing `Card` / `CardBase` now supports:

```tsx
<Card tone="premium" title="Foreign quota verified" />
<Card tone="flat" title="Key fact" />
```

## Opt-In Utility Classes

Available primitives:

- `public-amp-eyebrow`
- `public-amp-display`
- `public-amp-headline`
- `public-amp-lead`
- `public-amp-card-title`
- `public-amp-card`
- `public-amp-card--pad`
- `public-amp-card--interactive`
- `public-amp-facts-grid`
- `public-amp-fact`
- `public-amp-fact__label`
- `public-amp-fact__value`
- `public-amp-fact__helper`

These classes are not applied to existing routes by this PR.

## Intended PR 2 Usage

PR 2 should use these primitives only inside public header/footer/mobile navigation work. Keep existing locale, currency, CMS, CTA and accessibility behavior intact.

## Guardrails

- Do not use these classes in admin surfaces until the admin visual PR.
- Do not add page-specific selectors to the foundation layer.
- Do not hardcode English-only copy in components.
- Do not use mock static prototype data in production routes.
