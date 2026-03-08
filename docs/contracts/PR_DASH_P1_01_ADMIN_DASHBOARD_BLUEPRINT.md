# DASH-P1-PR1: Admin Dashboard UX Blueprint and Component Inventory

## Scope

- `/admin/dashboard`
- Admin shell navigation and dashboard-specific content composition

## Design Reference and Constraints

- Use the Kubayar demo only as a layout-pattern reference:
  - sidebar + topbar + summary cards + insights + table
- Rebuild in FlowBiz's existing `Next.js + React + Tailwind/CSS` stack
- Do not import third-party template code, assets, or vendor JS from the demo
- Preserve current backend/API contract:
  - `/api/admin/dashboard/health-summary`
- Keep EN/TH support, auth gating, and empty/loading/error states

## Current Audit

- Current shell owner:
  - `admin-app/components/layout/AdminShell.tsx`
- Current dashboard page owner:
  - `admin-app/app/admin/dashboard/page.tsx`
- Current dashboard state model:
  - `admin-app/app/admin/dashboard/state-utils.ts`
- Current admin shell/dashboard styling:
  - `admin-app/app/globals.css`
- Current regression guards:
  - `admin-app/__tests__/b14_admin_dashboard_page.test.ts`
  - `admin-app/__tests__/b14_admin_workspaces_pages.test.ts`

## Target Information Architecture

1. Shell layer
   - Persistent sidebar on desktop
   - Contextual topbar with page context, global actions, and locale control
2. Dashboard header zone
   - Title/subtitle
   - Session/auth state
   - Primary actions such as refresh/sign-out
3. Summary zone
   - Generated-at and incomplete-widget meta
   - KPI cards for highest-signal health metrics
4. Insight zone
   - Trend/chart panel
   - Warning and freshness callouts
5. Activity zone
   - Recent inquiries table with filter/sort/mobile fallback

## Component Ownership Map

| Dashboard block | Current owner | Target owner after redesign | Notes |
| --- | --- | --- | --- |
| Shell/sidebar/topbar | `admin-app/components/layout/AdminShell.tsx` | `AdminShell.tsx` plus extracted dashboard shell subcomponents if needed | Phase 2 owns structural nav redesign |
| Page title + subtitle | `admin-app/app/admin/dashboard/page.tsx` | `admin-app/components/admin/dashboard/DashboardHero.tsx` | Header copy stays dashboard-local |
| Auth/session panel | `admin-app/app/admin/dashboard/page.tsx` | `admin-app/components/admin/dashboard/DashboardSessionPanel.tsx` | Must preserve current auth flow |
| Global dashboard state rendering | `admin-app/app/admin/dashboard/page.tsx` + `state-utils.ts` | `state-utils.ts` plus `DashboardStatePanel.tsx` | Existing state machine remains source of truth |
| Overview meta strip | `admin-app/app/admin/dashboard/page.tsx` | `admin-app/components/admin/dashboard/DashboardOverviewMeta.tsx` | Generated-at + incomplete count |
| KPI widget grid | `admin-app/app/admin/dashboard/page.tsx` | `admin-app/components/admin/dashboard/DashboardKpiGrid.tsx` | Uses existing widget keys |
| KPI widget card | `admin-app/app/admin/dashboard/page.tsx` | `admin-app/components/admin/dashboard/DashboardKpiCard.tsx` | Status chip + action links |
| Trend/chart module | Not yet implemented | `admin-app/components/admin/dashboard/DashboardTrendPanel.tsx` | Phase 3 new module |
| Recent inquiries table | `admin-app/app/admin/dashboard/page.tsx` | `admin-app/components/admin/dashboard/DashboardRecentInquiriesTable.tsx` | Phase 3 usability upgrade |
| Warning list | `admin-app/app/admin/dashboard/page.tsx` | `admin-app/components/admin/dashboard/DashboardWarningsPanel.tsx` | Could stay inline if scope stays small |
| Dashboard surface tokens | `admin-app/app/globals.css` | `admin-app/app/globals.css` | Phase 1 PR2 owns tokens and base surfaces |
| Dashboard contract tests | `admin-app/__tests__/b14_admin_dashboard_page.test.ts` | Existing tests + new dashboard component tests | Expand only when components split |

## Responsive Behavior Contract

- Desktop (`>= 1280px`)
  - Persistent sidebar
  - Multi-column dashboard grid
  - Topbar stays horizontal with page context and actions
- Tablet (`768px - 1279px`)
  - Sidebar may compress or collapse
  - KPI and insight cards collapse to 2-column rhythm
  - Table remains readable without horizontal page overflow
- Mobile (`< 768px`)
  - Quick navigation row replaces persistent sidebar
  - Header/session/actions stack vertically
  - KPI cards render as single column
  - Table uses stacked-row or controlled horizontal strategy

## State Model Contract

- Source of truth:
  - `admin-app/app/admin/dashboard/state-utils.ts`
- Required visible states:
  - `idle`
  - `loading`
  - `error`
  - `empty`
  - `success`
- Redesign must preserve the current distinction:
  - API/auth failure => `error`
  - valid empty payload => `empty`
  - renderable payload => `success`

## Dependencies Into Next PRs

- `#286`
  - adds dashboard-specific tokens, surfaces, spacing, and status-chip treatment
- `#287`
  - upgrades shell/sidebar/topbar structure
- `#288`
  - composes section scaffolding and skeleton states
- `#289`
  - moves widget rendering into dedicated KPI components

## Risks and Open Questions

- Search/action controls in the topbar are a layout concern only right now:
  - no backend search contract is defined yet for admin shell global search
- Trend chart data is not yet defined in the current dashboard payload:
  - Phase 3 should either derive from existing metrics or render a clearly-labeled placeholder state
- Sidebar breadth is large:
  - Phase 2 should prefer hierarchy and density control over adding more visual chrome

## Blocker Status

- No unresolved blocker for `#286` or `#287`
- Existing auth flow, state utility, and backend contract are stable enough to proceed

## Regression Guards

- Keep these passing during dashboard redesign:
  - `admin-app/__tests__/b14_admin_dashboard_page.test.ts`
  - `admin-app/__tests__/b14_admin_workspaces_pages.test.ts`
- Add component-level tests only when dashboard blocks are split into dedicated files
