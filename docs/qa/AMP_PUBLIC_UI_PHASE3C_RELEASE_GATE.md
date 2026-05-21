# AMP Public UI Phase 3C Release Gate

Status: Phase 3C public frontend release checklist and staging smoke plan.

Scope:
- Public frontend only.
- Live app remains source of truth.
- Claude export remains visual reference only.
- No admin, backend, production API contract, lead form, analytics, or search/filter rewrite.

## Required Local Gate

Run from `admin-app` unless noted.

1. Relevant public test suite
   - `npm run test -- local_public_fixture_api_contract.test.ts public_runtime_audit_heuristic_contract.test.ts public_visual_qa_contract.test.ts public_design_system_contract.test.ts public_cta_visibility.test.tsx public_messaging_hierarchy.test.ts public_route_copy_contract.test.ts thai_dictionary_copy_regression.test.ts property_detail_shell.test.tsx property_card_specs.test.tsx project_detail_shell.test.tsx project_detail_trust_integration.test.tsx contact_page_shell.test.tsx contact_topic_preset.test.ts contact_form_validation.test.tsx buy_rent_lead_form_intent.test.ts public_catalogue_th_copy.test.tsx shortlist_list_surface.test.tsx compare_area_surface.test.tsx compare_decision_support_summary.test.tsx header_cta_visibility.test.tsx`
2. Lint
   - `npm run lint`
3. Production build/type check
   - `npm run build`
4. Fixture-backed runtime audit
   - Start fixture API and Next dev.
   - Run `npm run test:runtime:public` with Phase 3C public routes and widths.
   - Required: `sameOriginFailureCount=0`, `issueCount=0`.
5. Fixture-backed visual QA
   - Run `npm run test:visual:public` with Phase 3C routes and breakpoints `390,430,768,1366`.
   - Required score: `>= 98`.
   - Required: no critical findings, no warning findings, no console errors, no failed requests, no broken images.
6. Runtime text/media probe
   - Check tested property/project/listing routes for visible `undefined`, `null`, and `NaN`.
   - Check console errors, failed requests, and broken images.

## Phase 3C Visual Baseline Routes

Use these routes for local fixture-backed baseline capture:

- `/en`
- `/th`
- `/en/projects`
- `/th/projects`
- `/en/projects/skyline-ocean-premier`
- `/th/projects/skyline-ocean-premier`
- `/en/projects/jomtien-horizon-under-construction`
- `/th/projects/jomtien-horizon-under-construction`
- `/en/buy`
- `/th/buy`
- `/en/rent`
- `/th/rent`
- `/en/sell`
- `/th/sell`
- `/en/property/skyline-ocean-premier-2br-sea-view`
- `/th/property/skyline-ocean-premier-2br-sea-view`
- `/en/property/central-pattaya-1br-rent-complete`
- `/th/property/central-pattaya-1br-rent-complete`
- `/en/property/naklua-compact-no-media-fallback`
- `/th/property/naklua-compact-no-media-fallback`
- `/en/contact`
- `/th/contact`
- `/en/shortlist`
- `/th/shortlist`
- `/en/compare`
- `/th/compare`

## Staging / Production Smoke Plan

Validate after deploy against the staging or production base URL:

1. Page identity and metadata
   - Open every Phase 3C baseline route.
   - Confirm HTTP 200 for same-origin routes.
   - Confirm `html[lang]` matches `/en` or `/th`.
   - Confirm canonical and locale alternates remain present where expected.
   - Confirm JSON-LD remains present on home, project detail, and property detail pages.
2. Homepage IA
   - Confirm hero, pathways, trust strip, curated project section, unit groups, market clarity, owner bridge, and final CTA render in order.
   - Confirm project cards use live project data.
   - Confirm unit groups use live property data and no Claude prototype data.
3. Project and property data rendering
   - Confirm project detail pages render gallery, facts, trust modules, CTAs, and lead form.
   - Confirm property detail pages render sale, rent, and no-media/missing-field states without visible `undefined`, `null`, or `NaN`.
4. CTA behavior
   - Confirm WhatsApp/LINE/phone links resolve to the configured external URLs.
   - Confirm internal CTA links return 200.
   - Confirm same-page hash CTAs scroll/focus without same-origin failures.
   - Confirm sticky mobile CTA appears on home only where route rules allow it and does not collide with buy/rent/sell/contact/project/property/shortlist/compare owned CTAs.
5. Forms and tracking
   - Confirm lead forms still validate required fields.
   - Confirm form intent/purpose remains correct for buy, rent, project detail, property detail, contact, and home final CTA.
   - Confirm analytics events are still emitted through existing tracking components.
6. Responsive pass
   - Capture or inspect `390`, `430`, `768`, and `1366`.
   - Confirm no horizontal overflow, no clipped CTA text, no broken images, and no framework error overlay.

## Rollback Notes

Rollback can be scoped to public UI migration files:
- Revert homepage IA changes in `admin-app/app/(site)/[locale]/page.tsx`.
- Revert public shell CSS in `admin-app/styles/public-primitives.css`.
- Revert CTA route ownership changes in `admin-app/app/_lib/public-cta.ts`.
- Revert local fixture/test/audit contract changes.

No production data model, admin route, backend API contract, lead form contract, or analytics contract is changed by Phase 3C.
