# Admin UI Audit - 2026-03-08

## Scope

- `admin-app/app/admin/*`
- `admin-app/components/layout/AdminShell.tsx`
- `admin-app/components/admin/*`
- Admin-scoped styles in `admin-app/app/globals.css`

## Current architecture

- The admin shell is mounted from `admin-app/app/admin/layout.tsx` and wraps every `/admin/*` route with `AdminShell`.
- Navigation structure is centralized in `admin-app/app/_lib/admin-nav.ts`.
- Most CRUD workspaces (`users`, `properties`, `projects`, `areas`, `developers`, `company`, `testimonials`, `taxonomy`, `videos`, `review-queue`, `blog`) share `AdminJsonCrudWorkspace`.
- Custom admin pages with heavier bespoke UI exist for `dashboard`, `inquiries`, `imports`, `media`, `seo`, `domain`, `layout`, and `home-composer`.
- Admin visual styling is mostly global and centralized in `admin-app/app/globals.css`.

## Reusable UI patterns found

- Shared shell: `AdminShell`
- Shared CRUD workspace: `AdminJsonCrudWorkspace`
- Shared form primitives: `AdminFormPrimitives`
- Shared data table: `AdminDataTable`
- Dashboard-specific primitives: `DashboardSectionPrimitives`, `DashboardKpiWidgets`, `DashboardRecentInquiriesTable`, `DashboardTrendChart`
- Shared error state: `AdminWorkspaceErrorState`

## Audit findings

### 1. Shell/navigation

- Sidebar is text-only and does not use a consistent icon system.
- Current shell mixes a dark sidebar with warm/light main surfaces; it works functionally but feels visually inconsistent.
- Topbar content density is high and search/quick actions/profile/language compete for attention.
- Mobile drawer behavior is implemented correctly and already protected by tests; this should be preserved and restyled rather than replaced.

### 2. Shared component system

- There is no real admin design-system layer for page headers, stat cards, badges, tabs, or tables.
- Existing reuse depends mostly on generic utility classes (`card`, `btn`, `field`) and large CSS scope rules.
- `AdminJsonCrudWorkspace` is functionally rich, but visually flat and form-heavy. It is the highest-leverage target because changes there will modernize many routes at once.

### 3. Dashboard

- Dashboard primitives are structurally sound and already tested, but cards rely on text/status chips only.
- No iconography is used for metrics, sections, states, or actions.
- KPI cards and summary blocks have acceptable density but weak visual hierarchy.

### 4. Page-level inconsistency

- `dashboard`, `seo`, `domain`, `media`, `imports`, and `inquiries` use shared admin classes but still duplicate page header/session/login patterns.
- `home-composer` is a major outlier: it uses inline Tailwind-heavy styles instead of the admin shell visual language.
- Tables and action bars vary significantly by page.

### 5. Typography and Thai readability

- Admin typography tokens exist and are tested, which is a strong base.
- Labels, helper copy, and metadata are still slightly dense in several pages.
- Thai copy is present on many surfaces, but spacing rhythm and line-height are not yet tuned consistently for dense operational screens.

### 6. CSS maintainability

- `admin-app/app/globals.css` is large and contains several generations of styles.
- Admin styles live in one monolithic file, increasing cascade risk when changing shared selectors.
- Multiple admin pages rely on generic selectors, so safe changes should prefer additive admin-specific classes and component wrappers.

## Constraints and safety notes

- Do not change admin route paths, auth/session flow, request URLs, or payload shapes.
- Preserve tested shell behaviors:
  - searchable navigation
  - locale switcher behavior
  - drawer toggle/backdrop/Escape close
  - dashboard contract structure
- Preserve admin auth/login semantics used across dashboard and workspaces.
- Prefer visual refactors through shared components and CSS tokens instead of page logic rewrites.

## Recommended implementation strategy

1. Add a small admin design-system layer for:
   - page headers
   - section cards
   - stat cards
   - buttons
   - inputs
   - badge/status pills
   - tabs
   - tables
2. Introduce one consistent inline SVG icon set with shared sizing/stroke rules.
3. Restyle `AdminShell` first, but keep its DOM structure and tested behaviors stable where possible.
4. Refactor `AdminJsonCrudWorkspace` next to lift most CRUD routes in one pass.
5. Rebuild dashboard surfaces on top of the new primitives.
6. Bring custom pages (`seo`, `media`, `imports`, `inquiries`, `domain`, `layout`, `home-composer`) onto the same primitives without changing business logic.

## SSR / runtime compatibility assessment

- Admin routes are primarily client components inside the admin shell.
- Current changes can remain UI-only and backward-compatible if fetch logic, auth helpers, and route exports stay intact.
- No SSR/ISR-specific blockers were identified during the audit.
