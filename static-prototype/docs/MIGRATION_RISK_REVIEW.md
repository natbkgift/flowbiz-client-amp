# Migration Risk Review

## High Risk

| Risk | Why It Matters | Mitigation |
|---|---|---|
| Replacing production routes with static HTML structure | Existing Next routes contain metadata, i18n, data fetching, fallback states and SEO behavior. | Migrate by component and route section, not page replacement. Preserve current route files and metadata functions. |
| Duplicating `style.css` into production | The real app already has Tailwind and token CSS. A second broad CSS system can create regressions across public/admin pages. | Translate design decisions into existing `public-tokens`, `public-primitives` and `admin-*` styles. |
| Lead forms and CTA routing | Lead capture affects revenue, tracking, topic/source attribution and privacy text. | Keep `LeadForm`, `SellerForm`, `public-cta`, `contact-topic` and `TrackedLink` behavior. Change visuals only after validation. |
| Sticky mobile CTA conflicts | Production already has `StickyMobileCTA` and `PageOwnedMobileCTA`. Duplicate fixed bars can cover forms or footer. | Centralize mobile CTA ownership per route and test 390/430px with footer/forms. |
| Listing filter semantics | Static filters do not map to real query/API contracts. Bad migration could break SEO routes or show incorrect inventory. | Build filter drawer around existing `SidebarFilter`, `ListingGrid` and route query rules. |
| Detail page data model mismatch | Static project/property detail includes mock units, quotas, floor plans and cost assumptions. | Define typed data adapters and keep unknown fields optional. Do not invent API fields. |
| Financial calculator assumptions | Calculator values can be read as financial advice. | Require product/legal approval for formulas and disclaimers before production formula changes. |
| Admin auth/settings/user role pages | Static admin login/settings/users are visual placeholders and overlap with sensitive access control. | Do not migrate these directly. Only apply visual primitives after auth/admin owner review. |

## Medium Risk

| Risk | Why It Matters | Mitigation |
|---|---|---|
| Image quality and mapping | Some prototype images are low-resolution placeholders or reused across unrelated entities. | Use existing media pipeline and replace low-res placeholders before hero/gallery migration. |
| SEO metadata regression | Existing routes generate localized metadata, canonical and OpenGraph data. | Do not remove `generateMetadata` or localized route structure. Add visual components below metadata layer. |
| Analytics/tracking changes | Existing components track entity views, link clicks and shortlist behavior. | Preserve `TrackedLink`, `EntityViewTracker` and existing event payloads. |
| i18n copy drift | Static prototype is English only while production supports English and Thai. | Add copy through dictionaries or CMS, not hardcoded page strings. |
| Admin navigation mismatch | Static admin nav differs from current `ADMIN_NAV_GROUPS`. | Keep current admin information architecture and use static prototype as visual inspiration only. |
| Mobile table overflow | Static prototype solved table overflow with wrappers, but production tables differ. | Add table wrapper patterns and test every admin/listing table at 390px. |
| External image optimization | Import assets vary widely in size and aspect ratio. | Use Next image helpers, sizes, quality and fallbacks consistently. |

## Low Risk

| Risk | Why It Matters | Mitigation |
|---|---|---|
| Badge/tag visual updates | Mostly presentational and component-scoped. | Implement through shared badge/chip components. |
| KPI card styling | Admin KPI cards can be visually updated with low logic impact. | Keep data props unchanged. |
| Trust/proof section layout | Mostly static content blocks. | Source copy from existing dictionaries/CMS and avoid unsupported claims. |
| Footer visual polish | Footer already exists and can accept token/style refinements. | Keep existing links, social/contact URLs and legal paths. |

## Do Not Migrate Yet

- Static admin login UI. Production auth must remain under the existing login/auth flow.
- Static admin settings page. The concepts overlap with Company, Site Chrome, SEO and routing workspaces.
- Static property/project create/edit forms. Real schemas, validation, media upload and permissions need separate review.
- Static lead notes/contact history/task actions. These must map to real CRM/inquiry models.
- Mock calculator formulas and ROI/yield projections without product/legal approval.
- Static map pins and CSS map placeholders as if they were real map functionality.
- Placeholder floor plan SVGs as real floor plans.
- Static compare recommendation logic without real selected-entity state.
- Static Smart Finder output as real recommendations without data/analytics contract.
- Low-resolution placeholder images in hero, detail gallery or card surfaces.

