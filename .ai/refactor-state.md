# Refactor State

## Program
FlowBiz Admin UX Refactor

## Current Phase
Phase 8 - Domain and layout workflow guidance parity

## Active Branch
copilot/refactor-implementation-quality

## Active PR
PR #522 - [WIP] Refactor implementation quality of refactor runner

## Completed Modules
- admin shell
- CRM inquiries
- shared CRUD admin workspaces
- admin dashboard
- admin imports workspace
- admin media workspace
- admin SEO workspace
- admin domain workspace
- admin layout CMS workspace
- secondary shared CRUD workspaces

## Completed Improvements
- hardened refactor runner codex auto-detect so the default template pins the repo root, disables ANSI color noise, and preserves config overrides that bypass broken local user config
- clarified refactor runner live-status rendering so active versus final states are clearly differentiated while preserving the existing status fields
- added targeted refactor runner regression coverage for CLI precedence, codex auto-detect template shape, and live-status rendering
- added PowerShell wrapper regression coverage proving default runs omit `--command-template` while explicit `-CommandTemplate` values still forward intact
- added retry countdown integration coverage that reads `.ai/refactor-live-status.json` during backoff to prove countdown and next-attempt runtime artifacts
- rebalanced topbar layout and shell spacing
- improved inquiry row action visibility with direct contact actions
- added inquiry workspace and filter persistence
- improved shared admin data-table summary and recovery messaging
- clarified shared CRUD active-record and row action states
- grouped inquiry detail into snapshot, operator actions, and advisory context sections
- added follow-up action callout guidance in inquiry detail
- grouped shared CRUD create and patch forms into base fields and localized content
- strengthened shared CRUD records empty-state guidance
- added dashboard empty-state recovery actions and clearer next-step affordances
- expanded dashboard drill-down action groups for insights, warnings, and background tasks
- added imports workspace session guidance and history empty-state recovery links
- added media workspace session guidance and empty-state recovery links
- added SEO workspace structured empty-state guidance for overrides, redirects, schema, and broken-link reports
- added reusable shared CRUD follow-up links in header, record actions, records empty states, and revisions empty states
- connected review queue, blog, areas, developers, properties, and projects workspaces to their next operational destinations
- added dashboard trend and recent-inquiry follow-on actions so operators can jump straight into CRM review flows
- added action-aware shared CRUD result guidance so successful create, patch, publish, bulk, diff, and restore flows do not end in raw payloads alone
- connected company, taxonomy, testimonials, users, and videos workspaces to route-specific downstream destinations instead of leaving them on generic shared routing
- added shared CRUD prerequisite hints so auth and query panels can explain route-specific dependencies before operators mutate records
- added route-specific prerequisite guidance for company, taxonomy, testimonials, users, and videos workspaces
- added consistent success-state handoff guidance for imports, media, SEO, and home composer so bespoke admin flows now point to real validation surfaces after successful actions
- added entity-specific prerequisite guidance and post-action handoff links inside the bespoke domain workspace for areas, developers, and projects
- added layout CMS success-state handoff links so shared layout saves point operators into company CMS and home composer verification flows
- added regression coverage for inquiry, shared CRUD, dashboard, and shell contract behavior
- added regression coverage for imports and SEO workflow guidance contracts
- added regression coverage for shared CRUD follow-up routing and dashboard review handoff actions
- added regression coverage for secondary CRUD routing and shared result-panel guidance
- added regression coverage for shared CRUD prerequisite hints and bespoke success handoff affordances
- added regression coverage for domain and layout workflow guidance contracts

## Files Changed So Far
- tools/refactor_runner.py
- tests/test_refactor_runner.py
- admin-app/app/admin/inquiries/page.tsx
- admin-app/app/admin/areas/page.tsx
- admin-app/app/admin/blog/page.tsx
- admin-app/app/admin/company/page.tsx
- admin-app/app/admin/developers/page.tsx
- admin-app/app/admin/imports/page.tsx
- admin-app/app/admin/layout/page.tsx
- admin-app/app/admin/media/page.tsx
- admin-app/app/admin/domain/page.tsx
- admin-app/app/admin/projects/page.tsx
- admin-app/app/admin/properties/page.tsx
- admin-app/app/admin/review-queue/page.tsx
- admin-app/app/admin/seo/page.tsx
- admin-app/app/admin/home-composer/page.tsx
- admin-app/app/admin/taxonomy/page.tsx
- admin-app/app/admin/testimonials/page.tsx
- admin-app/app/admin/users/page.tsx
- admin-app/app/admin/videos/page.tsx
- admin-app/components/admin/AdminDataTable.tsx
- admin-app/components/admin/AdminJsonCrudWorkspace.tsx
- admin-app/components/admin/domain/crm/InquiryDetailPanel.tsx
- admin-app/components/admin/domain/crm/InquiryFollowUpPanel.tsx
- admin-app/components/admin/domain/crm/InquiryListTable.tsx
- admin-app/components/admin/domain/crm/inquiries-copy.ts
- admin-app/components/admin/domain/crm/inquiries-types.ts
- admin-app/components/admin/domain/crm/inquiries-utils.ts
- admin-app/components/admin/domain/crud-workspace/AdminCrudWorkspacePanels.tsx
- admin-app/components/admin/domain/crud-workspace/crud-workspace-copy.ts
- admin-app/components/admin/domain/dashboard/AdminDashboardScreen.tsx
- admin-app/components/admin/domain/dashboard/dashboard-copy.ts
- admin-app/components/admin/domain/crud-workspace/workspace-types.ts
- admin-app/styles/admin-components.css
- admin-app/__tests__/b10_admin_seo_page.test.ts
- admin-app/__tests__/admin_data_table_integration.test.tsx
- admin-app/__tests__/admin_shell_navigation_behavior.test.ts
- admin-app/__tests__/b11_admin_inquiries_page.test.ts
- admin-app/__tests__/b14_admin_dashboard_page.test.ts
- admin-app/__tests__/b14_admin_workspaces_pages.test.ts
- admin-app/__tests__/b15_admin_layout_cms_page.test.ts

## Last Run Summary
- added automated PowerShell wrapper coverage so the default path still omits `--command-template` while explicit overrides are forwarded unchanged
- added retry backoff coverage that inspects live status runtime artifacts during countdown and verifies `retry_countdown_sec`, `next_retry_attempt`, and validation summary fields
- validated the runner updates with `python -m pytest -q tests/test_refactor_runner.py` and `python -m ruff check tools/refactor_runner.py tests/test_refactor_runner.py`
- added entity-aware prerequisite guidance and post-action handoff panels to the bespoke domain workspace so areas, developers, and projects now point to the right verification surfaces after successful actions
- added layout CMS success handoff links so a saved shared layout can move straight into company CMS or home composer verification work
- validated the new domain and layout guidance with targeted workspace tests, targeted layout CMS tests, and a successful admin build

## Do Not Repeat
- shell-only improvements
- CSS-only tweaks without workflow change
- topbar layout refinements
- sidebar divider tweaks
- already improved row-action visibility in inquiries and shared CRUD tables
- already improved inquiry filter persistence and list recovery messaging
- already completed form grouping for inquiry detail and shared CRUD create/patch forms
- already completed basic dashboard empty-state recovery actions
- already completed dashboard drill-down links for imports, media, and SEO
- already completed imports/media/SEO structured empty-state guidance
- already completed shared CRUD follow-up links for review queue, blog, areas, developers, properties, and projects
- already completed dashboard review handoff actions for trend and recent inquiries
- already completed shared CRUD result guidance for action outcomes
- already completed route-specific follow-up links for company, taxonomy, testimonials, users, and videos
- already completed shared CRUD prerequisite hints for secondary CRUD pages
- already completed bespoke success-state handoff parity for imports, media, SEO, and home composer
- already completed domain workspace prerequisite and success handoff guidance
- already completed layout CMS success-state handoff guidance

## Known Weaknesses
- no concrete runner validation gap is currently open in the queue

## Open Workflow Blockers
- none in the current queue

## Risks
- avoid breaking shared table and shared workspace components
- avoid changing API-driven behavior
- avoid creating fake domain surfaces that do not exist in the repo
- preserve existing review and publish flows while adding navigation cues

## Preferred Expansion Areas
- rerun a real controller session only when a concrete runtime observability gap appears in CI or operator logs
- keep future runner changes scoped to demonstrated controller contract or retry-state regressions
