# Issue Queue

## [UX-001] Row actions not visible enough
Type: table usability
Priority: HIGH
Status: DONE
Modules: CRM inquiries, shared CRUD lists
Success:
- row actions are clearly visible or easier to access
- less need to click multiple times

## [UX-002] Filters reset or unclear
Type: workflow / discoverability
Priority: HIGH
Status: DONE
Modules: CRM inquiries
Success:
- filters are easier to understand and reuse
- less frustration navigating lists

## [UX-003] Forms lack grouping
Type: form usability
Priority: HIGH
Status: DONE
Modules: CRM inquiries, shared CRUD workspaces
Success:
- fields grouped logically
- scanability improved

## [UX-004] Empty states weak
Type: feedback / state
Priority: MEDIUM
Status: DONE
Modules: dashboard, CRM inquiries, shared CRUD workspaces
Success:
- clear next-step guidance
- reduced confusion for new users

## [UX-005] Dashboard drill-down paths are still shallow
Type: navigation / workflow
Priority: HIGH
Status: DONE
Modules: dashboard, inquiries, imports, media
Success:
- key dashboard states link operators to the correct next workspace
- less ambiguity after seeing warning, freshness, or background-task cards

## [UX-006] Secondary admin surfaces still use generic empty guidance
Type: feedback / state
Priority: MEDIUM
Status: DONE
Modules: imports, media, SEO, review queue
Success:
- empty states explain what to do next
- operators can recover without guessing

## [UX-007] Cross-surface action handoff is inconsistent
Type: workflow continuity
Priority: MEDIUM
Status: DONE
Modules: dashboard, shared CRUD workspaces, review queue
Success:
- operators can move from overview signals into list, patch, or import actions with fewer dead ends
- next actions are visible near the state that triggered them

## [UX-008] Review and CRUD follow-on routes are still implicit
Type: workflow continuity
Priority: MEDIUM
Status: DONE
Modules: review queue, shared CRUD workspaces, dashboard
Success:
- review-oriented pages expose clearer follow-on actions after list inspection or approval work
- shared CRUD surfaces point operators back to the most relevant dashboards or queues

## [UX-009] Shared CRUD success states still end in raw payloads
Type: workflow continuity
Priority: MEDIUM
Status: DONE
Modules: shared CRUD workspaces, result panels
Success:
- create/patch/publish/unpublish/restore outcomes explain the recommended next verification step
- operators can move from a successful mutation into the right queue, dashboard, or validation surface without guessing

## [UX-010] Secondary CRUD workspaces still use generic routing
Type: workflow continuity
Priority: MEDIUM
Status: DONE
Modules: taxonomy, videos, company, testimonials, users
Success:
- secondary CRUD pages expose route-specific follow-up destinations
- operators can move into the right operational surface after inspecting or updating records

## [UX-011] Non-shared admin workspaces still diverge on success-state handoff
Type: workflow continuity
Priority: MEDIUM
Status: DONE
Modules: imports, media, SEO, home composer
Success:
- successful non-shared admin actions explain the next verification step instead of stopping at raw output or ad hoc notices
- operators can move from mutation success into the right validation surface with consistent cues

## [UX-012] Shared CRUD prerequisite guidance is still too generic
Type: workflow continuity
Priority: MEDIUM
Status: DONE
Modules: shared CRUD auth/query panels, secondary CRUD pages
Success:
- route-specific prerequisites are visible before operators run high-impact mutations
- secondary CRUD pages explain what should be verified first when content depends on media, taxonomy, or downstream operational checks

## [UX-013] Domain workspace mutations still lack entity-aware guidance
Type: workflow continuity
Priority: MEDIUM
Status: DONE
Modules: domain workspace, areas/developers/projects handoff flow
Success:
- operators see entity-specific prerequisites before create, patch, statistics, or publish actions
- successful domain actions point back to the right workspace or verification surface instead of ending at raw JSON alone

## [UX-014] Layout CMS save flow still ends at a bare success state
Type: workflow continuity
Priority: MEDIUM
Status: DONE
Modules: layout CMS, company/home composer handoff
Success:
- successful layout saves explain which downstream surfaces should be checked next
- operators can jump directly from the save confirmation into company CMS or home composer validation work

## [RUNNER-001] Auto-detected CLI flow was not explicit enough under codex fallback
Type: tooling / execution safety
Priority: HIGH
Status: DONE
Modules: refactor runner, PowerShell wrapper validation
Success:
- omitting `--command-template` still auto-detects supported CLIs in the right precedence order
- detected codex runs with repo-root pinning and config overrides that bypass broken local user config on this machine
- wrapper dry-run leaves auto-detect in control unless the caller explicitly provides an override

## [RUNNER-002] Live status did not clearly separate active and final states
Type: observability / workflow continuity
Priority: MEDIUM
Status: DONE
Modules: refactor runner status markdown and tests
Success:
- live status remains useful while active and is visually distinct after completion
- required fields stay coherent between markdown rendering and JSON payloads

## [RUNNER-003] Wrapper override path still lacks dedicated regression coverage
Type: validation / argument passing
Priority: LOW
Status: DONE
Modules: PowerShell wrapper, runner integration
Success:
- explicit wrapper `-CommandTemplate` forwarding is covered by an automated regression path
- default wrapper behavior continues to omit `--command-template` unless the caller opts in
