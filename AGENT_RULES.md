# AMP Pattaya Public UI Agent Rules

This file is binding for any future AI agent or developer touching public-facing AMP Pattaya UI, UX, copy, or publishability.

## Mission

Protect a premium, calm, trustworthy, curated, bilingual public website that converts qualified visitors without visual drift, copy drift, or unfinished content leaking to production.

## Scope

These rules apply to all public-facing work, including:

- `admin-app/app/(site)/[locale]/**`
- `admin-app/components/**` used by public routes
- `admin-app/styles/public-*`
- `admin-app/app/globals.css` when public UI is affected
- public dictionaries under `admin-app/app/_lib/i18n/**`
- public content resolution, media, publish gating, and QA logic
- any CMS-driven public content that can appear on the website

These rules do not control admin-only UX unless admin work directly affects the public experience.

## Mandatory First-Read Files

Before making any public UI change, read:

1. `AGENT_RULES.md`
2. `docs/AMP_VISUAL_SYSTEM_SPEC_V1.md`
3. `docs/AMP_PUBLIC_UI_QA_GATE.md`
4. `docs/AMP_COPY_SYSTEM_TH_EN_V1.md`
5. `docs/AMP_PUBLISH_GATE_RULES_V1.md`
6. `docs/AMP_PUBLIC_UI_IMPLEMENTATION_RULES_V1.md`

Read these when relevant:

- `docs/AMP_HOME_BLUEPRINT_V1.md` for any home-page work
- `docs/AMP_AGENT_STARTER_PROMPT_V1.md` when starting or handing off a new session

Legacy context may still be useful, but if a legacy doc conflicts with the files above, the files above win unless code/tests prove otherwise. In that case, flag the conflict before editing.

## Non-Negotiable Rules

- Read the required docs in `/docs` before making public UI changes.
- Summarize what you read before implementation.
- Identify spec conflicts before editing files.
- Do not invent a new visual language for a single route or section.
- Do not introduce arbitrary one-off spacing, color, radius, shadow, or typography fixes without system alignment.
- No public placeholder, TODO, pending, debug, seed, draft, or system-note text may appear in production UI.
- If a section is incomplete, weak, thin, or not locale-ready, hide it. Do not weakly render it.
- Thai locale must not be English-mixed unless the English term is intentionally required and approved.
- Public UI work must follow the visual system spec and CTA hierarchy.
- Do not fabricate proof, counts, market claims, review signals, developer credibility, or advisory claims.
- Prefer omission over a weak card, weak module, or low-signal section.

## Public UI Guardrails

The AMP public site must feel:

- luxury
- calm
- trustworthy
- curated
- premium but restrained
- advisory-led
- conversion-focused

The AMP public site must not feel like:

- a SaaS dashboard
- an unfinished template
- a marketplace clone
- a noisy landing page
- a dev/demo site
- a placeholder-heavy CMS frontend

## Copy / Language Guardrails

- Public copy must sound like a real property advisory team, not a product dashboard.
- English must be concise, composed, and outcome-led.
- Thai must read naturally for Thai users, not like English syntax translated word-for-word.
- Do not use inline locale ternaries for major public copy when the dictionary or CMS path already exists.
- Do not leak internal terms such as `dataset`, `inventory sync`, `published object`, `seed content`, `fallback`, or `next move` into Thai public UI.
- Proper nouns, brand names, and legally fixed external terms are the only routine exceptions to the no-English-mix rule.

## Publish-Gate Guardrails

- Only render content that clears the publish gate for its content type.
- Local media quality matters. A missing or weak image is not a neutral defect on a luxury site.
- Home, listing, and promotional surfaces must omit weak cards rather than pad them.
- Detail pages may use a controlled fallback image only when the rest of the page remains credible and the state is explained calmly.
- Locale readiness is part of publish readiness.

## Visual Consistency Rules

- Use the shared token layer in `admin-app/styles/public-tokens.css`.
- Use the shared primitive layer in `admin-app/styles/public-primitives.css`.
- Use container variants from `admin-app/components/layout/Container.tsx`.
- Use canonical type roles such as `type-h1`, `type-h2`, `type-body`, `type-small`, `type-label`, `type-caption`.
- Use shared surfaces such as `public-surface-card`, `public-surface-card--warm`, `public-surface-card--deep`.
- Use CTA roles intentionally: `btn-cta`, `btn-primary`, `btn-secondary`, `btn-tertiary`.
- Keep section rhythm and page density aligned to the visual system. No local magic numbers unless the system is updated first.

## Responsive Rules

- Mobile-first behavior is required.
- Mobile, tablet, laptop, desktop, wide, cinema, and wall tiers must follow the locked breakpoint contract.
- Mobile layout may compress, stack, or reduce density, but it must not become a different product.
- Tap targets must stay mobile-safe.
- CTA visibility and hierarchy must still be clear in the first mobile viewport.
- Avoid fixed/floating conversion takeovers on page-owned conversion routes.

## Pre-Edit Checklist

Before editing:

1. Confirm the task is public-facing.
2. Read the mandatory docs.
3. Inspect the existing route/component/token structure.
4. Check for existing tests, contracts, and shared primitives.
5. Identify any doc-vs-code or doc-vs-doc conflicts.
6. State which files you read and what constraints will govern the change.
7. Decide what should be reused, refactored, hidden, or left untouched.

## Post-Edit Validation Checklist

Before closing:

1. Verify the implementation still follows the visual system.
2. Verify CTA hierarchy is still clear and non-competitive.
3. Verify no placeholder, TODO, pending, or debug text is visible.
4. Verify thin or incomplete sections are hidden.
5. Verify EN and TH behavior both make sense.
6. Verify mobile layout, spacing, and action visibility.
7. Run or update relevant tests where possible.
8. Report any unresolved content or publish-gate risks explicitly.

## What Counts As Invalid Work

Invalid work includes:

- editing public UI without reading the required docs
- editing without summarizing what was read
- ignoring a spec conflict and changing code anyway
- adding one-off `text-*`, `p-*`, `rounded-*`, `shadow-*`, or raw color overrides where shared primitives already exist
- shipping a visible weak card, empty block, seed content, or broken image state on a premium landing surface
- mixing English UI labels into Thai public UI without a deliberate exception
- rendering incomplete sections instead of hiding them
- adding extra competing primary CTAs
- writing public copy that sounds like tooling, CMS, or QA output

## Required First Response Behavior For Agents

On any new public UI task, the first response must:

1. State that the task is public UI / UX governance or implementation work.
2. List the files read first.
3. Summarize the key constraints from those files.
4. Call out any conflicts or missing information before editing.
5. State the intended implementation approach.

Do not jump straight into edits without this acknowledgment.

## Required Final Response Behavior For Agents

The final response must:

1. List the files created or updated.
2. State how the work complies with the governing docs.
3. Call out any conflicts discovered between legacy docs, current code, and the new rules.
4. State what was validated and what was not validated.
5. Recommend the next implementation step if the work was documentation or governance setup.
