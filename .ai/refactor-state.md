# Refactor State

## Program
FlowBiz Admin UX Refactor

## Current Phase
Phase 3 - Form workflow and guidance clarity

## Active Branch
copilot/improve-admin-ux-design

## Active PR
PR #521 - Improve inquiry workflow and admin table discoverability

## Completed Modules
- admin shell
- CRM inquiries
- shared CRUD admin workspaces
- admin dashboard

## Completed Improvements
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
- added regression coverage for inquiry, shared CRUD, dashboard, and shell contract behavior

## Files Changed So Far
- admin-app/app/admin/inquiries/page.tsx
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
- admin-app/styles/admin-components.css
- admin-app/__tests__/admin_data_table_integration.test.tsx
- admin-app/__tests__/admin_shell_navigation_behavior.test.ts
- admin-app/__tests__/b11_admin_inquiries_page.test.ts
- admin-app/__tests__/b14_admin_dashboard_page.test.ts
- admin-app/__tests__/b14_admin_workspaces_pages.test.ts

## Last Run Summary
- reorganized inquiry detail into clearer operator-first sections
- grouped shared CRUD forms and strengthened record-empty guidance
- added dashboard recovery actions for empty sections
- repaired CSS hooks and validated with targeted tests plus build

## Do Not Repeat
- shell-only improvements
- CSS-only tweaks without workflow change
- topbar layout refinements
- sidebar divider tweaks
- already improved row-action visibility in inquiries and shared CRUD tables
- already improved inquiry filter persistence and list recovery messaging
- already completed form grouping for inquiry detail and shared CRUD create/patch forms
- already completed basic dashboard empty-state recovery actions

## Known Weaknesses
- dashboard cards still rely on operator familiarity to choose the best follow-on workspace
- cross-surface navigation from dashboard to inquiry or CRUD tasks is still shallow
- some admin pages outside CRM and shared CRUD still have generic empty-state messaging
- workflow handoff between list summaries and deeper page actions can be clearer

## Open Workflow Blockers
- operators still need stronger drill-down guidance from dashboard signals into the exact workspace to act in
- some secondary admin surfaces still lack explicit next-step guidance after an empty or low-data state

## Risks
- avoid breaking shared table and shared workspace components
- avoid changing API-driven behavior
- avoid creating fake domain surfaces that do not exist in the repo

## Preferred Expansion Areas
- dashboard drill-down clarity
- imports and media admin workflows
- SEO and review queue empty-state guidance
- cross-surface next-step navigation between overview cards and operational pages