# Refactor State

## Program
FlowBiz Admin UX Refactor

## Current Phase
Phase 4 - Cross-surface navigation and operational guidance

## Active Branch
copilot/improve-admin-ux-design

## Active PR
PR #521 - Improve inquiry workflow and admin table discoverability

## Completed Modules
- admin shell
- CRM inquiries
- shared CRUD admin workspaces
- admin dashboard
- admin imports workspace
- admin media workspace
- admin SEO workspace

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
- expanded dashboard drill-down action groups for insights, warnings, and background tasks
- added imports workspace session guidance and history empty-state recovery links
- added media workspace session guidance and empty-state recovery links
- added SEO workspace structured empty-state guidance for overrides, redirects, schema, and broken-link reports
- added regression coverage for inquiry, shared CRUD, dashboard, and shell contract behavior
- added regression coverage for imports and SEO workflow guidance contracts

## Files Changed So Far
- admin-app/app/admin/inquiries/page.tsx
- admin-app/app/admin/imports/page.tsx
- admin-app/app/admin/media/page.tsx
- admin-app/app/admin/seo/page.tsx
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
- admin-app/__tests__/b10_admin_seo_page.test.ts
- admin-app/__tests__/admin_data_table_integration.test.tsx
- admin-app/__tests__/admin_shell_navigation_behavior.test.ts
- admin-app/__tests__/b11_admin_inquiries_page.test.ts
- admin-app/__tests__/b14_admin_dashboard_page.test.ts
- admin-app/__tests__/b14_admin_workspaces_pages.test.ts

## Last Run Summary
- expanded dashboard drill-down actions so freshness, warnings, and background-task states point directly to imports, media, and SEO workspaces
- added stronger next-step guidance to imports, media, and SEO surfaces without changing backend contracts
- validated the new workflow links and empty-state guidance with targeted tests plus build

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

## Known Weaknesses
- review queue still depends heavily on shared CRUD defaults rather than review-specific next-step cues
- shared CRUD workspaces still do not point operators back to the most relevant dashboard or queue after record inspection
- dashboard trend and recent inquiry areas are clearer, but not all operator paths expose explicit follow-on actions after review
- workflow handoff between list summaries, publish readiness, and approval actions can still be clearer

## Open Workflow Blockers
- review-oriented admin pages still need clearer follow-on actions after inspection or approval work
- shared CRUD workspaces still need stronger round-trip navigation between queue, detail, patch, and publish flows

## Risks
- avoid breaking shared table and shared workspace components
- avoid changing API-driven behavior
- avoid creating fake domain surfaces that do not exist in the repo
- preserve existing review and publish flows while adding navigation cues

## Preferred Expansion Areas
- review queue workflow guidance
- shared CRUD next-step navigation after load, patch, revision, and publish actions
- dashboard follow-on actions for trend and recent inquiry review flows
- publish-readiness and approval handoff clarity