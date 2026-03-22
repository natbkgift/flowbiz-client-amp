import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B11 admin inquiries page contract", () => {
  it("uses admin login endpoint and session storage auth flow", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain('from "@/app/_lib/admin-auth-hooks"');
    expect(page).toContain("useAdminAuthController");
    expect(page).toContain("loginWithAdminSession");
    expect(page).toContain("AdminAccessGate");
    expect(page).toContain("<form className=\"crm-login-form\"");
    expect(page).toContain('name="email"');
    expect(page).toContain('name="password"');
    expect(page).not.toContain('fetch("/v1/auth/login"');
    expect(page).not.toContain('id="admin-token"');
  });

  it("keeps required admin inquiry API wiring", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain("`/admin/inquiries?${query}`");
    expect(page).toContain("`/admin/inquiries/${id}`");
    expect(page).toContain("`/admin/inquiries/${id}/timeline?limit=30`");
    expect(page).toContain("`/admin/inquiries/${selectedId}/follow-up`");
    expect(page).toContain("`/admin/inquiries-export.csv?${appliedFilterQuery}`");
    expect(page).toContain("Authorization: `Bearer ${activeToken}`");
  });

  it("keeps filters, follow-up controls and quick contact actions", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const contactActions = read("components/admin/domain/crm/InquiryContactActions.tsx");
    const followUp = read("components/admin/domain/crm/InquiryFollowUpPanel.tsx");
    const timeline = read("components/admin/domain/crm/InquiryTimelinePanel.tsx");
    const utils = read("components/admin/domain/crm/inquiries-utils.ts");

    expect(page).toContain("const [filters, setFilters] = useState<InquiryFilters>(EMPTY_FILTERS)");
    expect(page).toContain("AdminFilterDrawer");
    expect(page).toContain('updateFilter("status", event.target.value)');
    expect(page).toContain('updateFilter("source", event.target.value)');
    expect(page).toContain('updateFilter("purpose", event.target.value)');
    expect(page).toContain('updateFilter("date_from", event.target.value)');
    expect(page).toContain('updateFilter("date_to", event.target.value)');
    expect(page).toContain('updateFilter("follow_up_status", event.target.value)');
    expect(page).toContain('updateFilter("q", event.target.value)');
    expect(utils).toContain('["pending", "scheduled", "completed", "no_response"]');
    expect(utils).toContain("translateFollowUpStatus");
    expect(utils).toContain("translateInquiryStatus");
    expect(utils).toContain("getInquiryDisplayLabel");
    expect(contactActions).toContain("selected.whatsapp_url");
    expect(contactActions).toContain("selected.phone_url");
    expect(contactActions).toContain("selected.email_url");
    expect(page).toContain("InquiryContactActions");
    expect(page).toContain("InquiryAdvisorAssistPanel");
    expect(page).toContain("InquiryTimelinePanel");
    expect(followUp).toContain("followUpNotice");
    expect(followUp).toContain("followUpActionHint");
    expect(timeline).toContain("timelineEmpty");
    expect(contactActions).toContain("contactActionsEmpty");
    expect(followUp).toContain('id="follow-up-status"');
  });

  it("supports inbox + pipeline views with saved filters and status move wiring", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const kanban = read("components/admin/domain/crm/InquiryKanbanBoard.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");
    const savedFilters = read("components/admin/domain/crm/InquirySavedFiltersPanel.tsx");
    const utils = read("components/admin/domain/crm/inquiries-utils.ts");

    expect(page).toContain('const [viewMode, setViewMode] = useState<InquiryViewMode>("table")');
    expect(kanban).toContain("CRM_STATUSES");
    expect(page).toContain('method: "PATCH"');
    expect(page).toContain("`/admin/inquiries/${inquiryId}`");
    expect(page).toContain('body: JSON.stringify({ status: nextStatus })');
    expect(utils).toContain("flowbiz_crm_saved_filters_v1");
    expect(utils).toContain("readRoleFromToken");
    expect(page).toContain("saveCurrentFilter");
    expect(page).toContain("loadSavedFilter");
    expect(page).toContain("AdminResponsiveList");
    expect(page).toContain("renderMobilePipeline()");
    expect(page).toContain("lead-inbox-queue-card-list");
    expect(page).toContain('const [detailLoading, setDetailLoading] = useState(false)');
    expect(page).toContain('const [movingInquiryId, setMovingInquiryId] = useState<string | null>(null)');
    expect(page).toContain('const [moveStatusNotice, setMoveStatusNotice] = useState<string | null>(null)');
    expect(page).toContain("setMoveStatusNotice(t.moveStatusUpdated);");
    expect(page).toContain("moveStatusNotice ? <div className=\"state-success\">{moveStatusNotice}</div> : null");
    expect(savedFilters).toContain('id="crm-saved-filter-select"');
    expect(savedFilters).toContain("savedFiltersHint");
    expect(savedFilters).toContain("savedFiltersEmpty");
    expect(kanban).toContain('const EMPTY_FIELD_PLACEHOLDER = "-";');
    expect(kanban).toContain("const secondaryLabelParts = [item.source_page, item.intent].filter(Boolean);");
    expect(kanban).toContain('const secondaryLabel = secondaryLabelParts.length > 0 ? secondaryLabelParts.join(" · ") : EMPTY_FIELD_PLACEHOLDER;');
    expect(kanban).toContain("const purposeLabel = item.purpose || EMPTY_FIELD_PLACEHOLDER;");
    expect(kanban).toContain('className="crm-row-meta crm-row-meta-secondary"');
    expect(kanban).toContain('className="crm-row-progress" role="status" aria-live="polite"');
    expect(copy).toContain('moveStatusUpdated: "Inquiry status updated."');
    expect(copy).toContain('moveStatusUpdated: "อัปเดตสถานะรายการแล้ว"');
  });

  it("auto-opens the first inquiry when the current selection is no longer in the refreshed queue", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");

    expect(page).toContain("const shouldKeepSelection = Boolean(selectedId && body.data.some((item) => item.id === selectedId));");
    expect(page).toContain("if (shouldKeepSelection && selectedId) {");
    expect(page).toContain("await loadDetails(selectedId, activeToken);");
    expect(page).toContain("} else {");
    expect(page).toContain("const nextSelectedId = body.data[0]?.id ?? null;");
    expect(page).toContain("if (nextSelectedId) {");
    expect(page).toContain("await loadDetails(nextSelectedId, activeToken);");
    expect(page).toContain("const loadDetails = useCallback(async (id: string, tokenOverride?: string) => {");
    expect(page).toContain('const activeToken = (tokenOverride ?? authToken).trim();');
    expect(copy).toContain('emptyDetails: "No inquiries match current filters. Adjust filters or reload the queue to fetch the latest leads."');
  });

  it("clears filters and immediately reloads the default queue", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain("function clearFilters()");
    expect(page).toContain("setFilters(EMPTY_FILTERS);");
    expect(page).toContain("void loadListWithFilters(EMPTY_FILTERS);");
    expect(page).toContain('onClick={clearFilters}');
    expect(page).toContain('setActiveSavedFilterId("");');
  });

  it("restores the last inquiry workspace state and auto-loads the saved queue for active sessions", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const utils = read("components/admin/domain/crm/inquiries-utils.ts");
    const types = read("components/admin/domain/crm/inquiries-types.ts");

    expect(page).toContain("const hasHydratedWorkspace = useRef(false);");
    expect(page).toContain("const hasBootstrappedQueue = useRef(false);");
    expect(page).toContain("const storageKey = workspaceStateKey(role);");
    expect(page).toContain("const parsed = JSON.parse(raw) as Partial<InquiryWorkspaceState>;");
    expect(page).toContain("const nextDraftFilters = normalizeInquiryFilters(parsed.draftFilters);");
    expect(page).toContain("setAppliedFilterQuery(buildQuery(nextAppliedFilters));");
    expect(page).toContain("setViewMode(isInquiryViewMode(parsed.viewMode) ? parsed.viewMode : \"table\");");
    expect(page).toContain("window.localStorage.setItem(workspaceStateKey(role), JSON.stringify(snapshot));");
    expect(page).toContain("void loadListWithFilters(appliedFilters, authToken, authEmail);");
    expect(utils).toContain('WORKSPACE_STATE_STORAGE_KEY = "flowbiz_crm_workspace_state_v1"');
    expect(utils).toContain("export function workspaceStateKey(role: string)");
    expect(utils).toContain("export function normalizeInquiryFilters");
    expect(utils).toContain("export function isInquiryViewMode");
    expect(types).toContain("export type InquiryWorkspaceState = {");
  });

  it("separates apply vs reload based on whether filters are still dirty", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain("const [appliedFilters, setAppliedFilters] = useState<InquiryFilters>(EMPTY_FILTERS);");
    expect(page).toContain('const [appliedFilterQuery, setAppliedFilterQuery] = useState(() => buildQuery(EMPTY_FILTERS));');
    expect(page).toContain("const hasUnappliedFilters = filterQuery !== appliedFilterQuery;");
    expect(page).toContain("async function applyFilters(tokenOverride?: string, emailOverride?: string) {");
    expect(page).toContain("async function reloadList(tokenOverride?: string, emailOverride?: string) {");
    expect(page).toContain("await loadListWithFilters(appliedFilters, tokenOverride, emailOverride);");
    expect(page).toContain("setAppliedFilters(nextFilters);");
    expect(page).toContain("setAppliedFilterQuery(query);");
    expect(page).toContain("`/admin/inquiries-export.csv?${appliedFilterQuery}`");
    expect(page).toContain("const shouldDisableApply = !isAuthenticated || loading || detailLoading || Boolean(movingInquiryId) || !hasUnappliedFilters;");
    expect(page).toContain("const shouldDisableReload = !isAuthenticated || detailLoading || Boolean(movingInquiryId) || hasUnappliedFilters;");
    expect(page).toContain("disabled={shouldDisableApply}");
    expect(page).toContain("const shouldDisableReload = !isAuthenticated || detailLoading || Boolean(movingInquiryId) || hasUnappliedFilters;");
    expect(page).toContain("onClick={() => void applyFilters()}");
    expect(page).toContain("onClick: () => void reloadList(),");
  });

  it("disables clear when there is no active or pending filter to reset", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain("const hasActiveFilters = Object.values(filters).some((value) => value.trim().length > 0);");
    expect(page).toContain("const hasNoFiltersToReset = !hasUnappliedFilters && !hasActiveFilters;");
    expect(page).toContain("const shouldDisableClear = !isAuthenticated || loading || detailLoading || Boolean(movingInquiryId) || hasNoFiltersToReset;");
    expect(page).toContain("disabled={shouldDisableClear}");
  });

  it("shows whether the visible queue is synced with draft filters or still waiting for apply", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");

    expect(page).toContain("const hasAppliedFilters = Object.values(appliedFilters).some((value) => value.trim().length > 0);");
    expect(page).toContain("const filterStateMessage = hasUnappliedFilters ? t.filterStateDraft : t.filterStateApplied;");
    expect(page).toContain("const filterScopeMessage = hasAppliedFilters ? t.filterScopeFiltered : t.filterScopeDefault;");
    expect(page).toContain('description={`${filterStateMessage} ${filterScopeMessage}`}');
    expect(copy).toContain('filterStateDraft: "Draft filters are not applied yet. Apply filters to refresh the visible queue."');
    expect(copy).toContain('filterStateApplied: "Queue is synced with the current filters. Reload and Export CSV use the visible queue."');
    expect(copy).toContain('filterScopeDefault: "Current queue uses the default filter set."');
    expect(copy).toContain('filterScopeFiltered: "Current queue uses a filtered result set."');
    expect(copy).toContain('filterStateDraft: "ตัวกรองที่แก้ไขไว้ยังไม่ถูกใช้กับคิวปัจจุบัน');
    expect(copy).toContain('filterStateApplied: "คิวปัจจุบันตรงกับตัวกรองที่ใช้งานอยู่แล้ว');
  });

  it("surfaces the applied queue filters as readable summary chips with a pending-draft warning", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");
    const styles = read("styles/admin-components.css");

    expect(page).toContain('translateFollowUpStatus,');
    expect(page).toContain('translateInquiryStatus,');
    expect(page).toContain("const appliedFilterSummary = buildFilterSummary(appliedFilters, t, locale);");
    expect(page).toContain("const draftFilterSummary = buildFilterSummary(filters, t, locale);");
    expect(page).toContain('<div className="lead-inbox-summary-row" aria-live="polite">');
    expect(page).toContain('<span className="crm-filter-summary__label">{t.currentDraft}</span>');
    expect(page).toContain('className="crm-filter-chip-button"');
    expect(page).toContain('aria-label={`${t.removeFilter}: ${summary.label}`}');
    expect(page).toContain("function clearFilterChip<Key extends keyof InquiryFilters>(key: Key) {");
    expect(page).toContain('setFilters((current) => ({ ...current, [key]: "" }));');
    expect(page).toContain('<span className="crm-chip crm-chip-muted">{t.currentDraftDefault}</span>');
    expect(page).toContain('<span className="crm-filter-summary__label">{t.appliedQueue}</span>');
    expect(page).toContain('{hasUnappliedFilters ? <span className="crm-chip crm-chip-warn">{t.draftChangesPending}</span> : null}');
    expect(page).toContain('<span className="crm-chip crm-chip-muted">{t.appliedQueueDefault}</span>');
    expect(page).toContain('label: `${t.status}: ${translateInquiryStatus(filters.status, locale)}`');
    expect(page).toContain('label: `${t.followUp}: ${translateFollowUpStatus(filters.follow_up_status, locale)}`');
    expect(page).toContain('label: `${t.search}: ${truncateFilterSummaryValue(filters.q)}`');
    expect(page).toContain("const MAX_FILTER_SUMMARY_VALUE_LENGTH = 24;");
    expect(page).toContain("const TRUNCATED_FILTER_SUMMARY_VALUE_LENGTH = MAX_FILTER_SUMMARY_VALUE_LENGTH - 3;");
    expect(page).toContain("function truncateFilterSummaryValue(value: string): string {");
    expect(copy).toContain('appliedQueue: "Applied queue"');
    expect(copy).toContain('appliedQueueDefault: "Default filters"');
    expect(copy).toContain('currentDraft: "Current draft"');
    expect(copy).toContain('currentDraftDefault: "No draft filters yet"');
    expect(copy).toContain('draftChangesPending: "Draft changes pending"');
    expect(copy).toContain('removeFilter: "Remove filter"');
    expect(copy).toContain('appliedQueue: "คิวที่ใช้งานอยู่"');
    expect(copy).toContain('currentDraft: "ฉบับร่างปัจจุบัน"');
    expect(copy).toContain('draftChangesPending: "มีตัวกรองฉบับรอใช้"');
    expect(copy).toContain('removeFilter: "ลบตัวกรอง"');
    expect(styles).toContain(".crm-filter-summary-grid {");
    expect(styles).toContain(".crm-filter-summary {");
    expect(styles).toContain(".crm-filter-chip-button {");
    expect(styles).toContain(".crm-filter-summary__chips {");
  });

  it("keeps lead inbox queue/detail panels compact instead of stretching to full column height", () => {
    const styles = read("styles/admin-components.css");

    expect(styles).toContain(".lead-inbox-layout {");
    expect(styles).toContain("grid-template-columns: minmax(320px, 0.4fr) minmax(0, 0.6fr);");
    expect(styles).toContain(".lead-inbox-queue-pane,");
    expect(styles).toContain(".lead-inbox-detail-pane {");
  });

  it("keeps a readable primary row label even when inquiry name is missing", () => {
    const list = read("components/admin/domain/crm/InquiryListTable.tsx");
    const kanban = read("components/admin/domain/crm/InquiryKanbanBoard.tsx");
    const detail = read("components/admin/domain/crm/InquiryDetailPanel.tsx");
    const utils = read("components/admin/domain/crm/inquiries-utils.ts");

    expect(list).toContain("const primaryLabel = getInquiryDisplayLabel(item);");
    expect(list).toContain("<span>{primaryLabel}</span>");
    expect(kanban).toContain("const primaryLabel = getInquiryDisplayLabel(item);");
    expect(kanban).toContain('<span className="crm-row-title">{primaryLabel}</span>');
    expect(detail).toContain("const summaryTitle = getInquiryDisplayLabel(selected);");
    expect(detail).toContain("<h3>{summaryTitle}</h3>");
    expect(utils).toContain("export function getInquiryDisplayLabel");
    expect(utils).toContain("return item.name || item.email || item.phone || item.id;");
  });

  it("renders inquiry status as a visible chip for faster table scanning", () => {
    const list = read("components/admin/domain/crm/InquiryListTable.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");
    const styles = read("styles/admin-components.css");

    expect(list).toContain('<span className="crm-chip crm-chip-muted">{translateInquiryStatus(item.status, locale)}</span>');
    expect(list).toContain("<AdminTableToolbar");
    expect(list).toContain("t.rowActionHint");
    expect(list).toContain("t.openDetails");
    expect(list).toContain("t.viewingDetails");
    expect(list).toContain('className="crm-table-select-action"');
    expect(copy).toContain('rowActionHint: "Open a lead to review the snapshot, set the next action, and then use contact options if needed."');
    expect(copy).toContain('openDetails: "Open details"');
    expect(copy).toContain('viewingDetails: "Viewing details"');
    expect(styles).toContain(".crm-table-toolbar {");
    expect(styles).toContain(".crm-table-select-action {");
  });

  it("adds dedicated row actions so operators can open details or jump straight to contact routes", () => {
    const list = read("components/admin/domain/crm/InquiryListTable.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");
    const styles = read("styles/admin-components.css");

    expect(list).toContain('<th scope="col">{t.rowActions}</th>');
    expect(list).toContain('className="crm-row-actions"');
    expect(list).toContain('className="btn btn-secondary crm-row-actions__primary"');
    expect(list).toContain('className="crm-row-action-link" href={item.whatsapp_url}');
    expect(list).toContain('className="crm-row-action-link" href={item.phone_url}');
    expect(list).toContain('className="crm-row-action-link" href={item.email_url}');
    expect(list).toContain('className="crm-row-actions__empty"');
    expect(copy).toContain('rowActions: "Next steps"');
    expect(copy).toContain('noRowActions: "No direct contact route"');
    expect(copy).toContain('rowActions: "ขั้นตอนถัดไป"');
    expect(styles).toContain('.crm-row-actions,');
    expect(styles).toContain('.crm-row-action-link,');
  });

  it("gives moving rows a visible disabled state in both table and kanban views", () => {
    const list = read("components/admin/domain/crm/InquiryListTable.tsx");
    const kanban = read("components/admin/domain/crm/InquiryKanbanBoard.tsx");
    const styles = read("styles/admin-components.css");

    expect(list).toContain("disabled={movingInquiryId === item.id}");
    expect(kanban).toContain("const isMoving = movingInquiryId === item.id;");
    expect(kanban).toContain("disabled={isMoving}");
    expect(styles).toContain(".crm-row-button:disabled,");
    expect(styles).toContain(".crm-table-select:disabled,");
    expect(styles).toContain(".crm-filter-chip-button:disabled {");
    expect(styles).toContain("cursor: not-allowed;");
    expect(styles).toContain("color: var(--admin-text-soft);");
  });

  it("aligns the detail empty state with the current queue state", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain("const detailEmptyStateMessage = !loading && items.length === 0 ? t.emptyDetails : t.noDetails;");
    expect(page).toContain('className="state-empty crm-detail-empty-state"');
    expect(page).toContain("<strong>{t.details}</strong>");
    expect(page).toContain("<p className=\"crm-section-description\">{detailEmptyStateMessage}</p>");
  });

  it("groups inquiry detail into snapshot, next action, and context sections", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const followUp = read("components/admin/domain/crm/InquiryFollowUpPanel.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");
    const styles = read("styles/admin-components.css");

    expect(page).toContain('aria-label={t.detailSnapshotTitle}');
    expect(page).toContain('aria-label={t.detailActionsTitle}');
    expect(page).toContain('aria-label={t.detailContextTitle}');
    expect(page).toContain("InquiryFollowUpPanel");
    expect(followUp).toContain('className="crm-detail-callout crm-detail-callout--followup"');
    expect(copy).toContain('detailSnapshotTitle: "Lead snapshot"');
    expect(copy).toContain('detailActionsTitle: "Next action"');
    expect(copy).toContain('detailContextTitle: "Context & timeline"');
    expect(copy).toContain('followUpActionHint: "Save this next action after adjusting status or due time so the inbox stays current."');
    expect(copy).toContain('detailSnapshotTitle: "สรุปข้อมูลลีด"');
    expect(copy).toContain('detailActionsTitle: "Next action"');
    expect(styles).toContain('.crm-detail-section--grouped {');
    expect(styles).toContain('.crm-detail-callout {');
  });

  it("keeps accessibility and runtime states in EN/TH copy", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const followUp = read("components/admin/domain/crm/InquiryFollowUpPanel.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");

    expect(page).toContain("<AdminPage");
    expect(page).toContain("AdminPageHeader");
    expect(page).toContain("title={t.title}");
    expect(page).toContain('title={t.list}');
    expect(page).toContain("t.listDescription");
    expect(page).toContain("t.loadingHint");
    expect(page).toContain("t.movingStatus");
    expect(page).toContain("t.emptyHint");
    expect(page).toContain('title={t.details}');
    expect(page).toContain('className="lead-inbox-queue-pane"');
    expect(page).toContain('className="lead-inbox-detail-pane lead-inbox-detail-desktop"');
    expect(page).toContain("followUpNotice");
    expect(followUp).toContain("detailLoading");
    expect(page).toContain('htmlFor="crm-login-email"');
    expect(page).toContain('htmlFor="crm-login-password"');
    expect(page).toContain('autoComplete="username"');
    expect(page).toContain('autoComplete="current-password"');
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(copy).toContain('followUpSaved: "Next action updated."');
    expect(copy).toContain('followUpSaved: "อัปเดตงานถัดไปแล้ว"');
    expect(copy).toContain('authRequired: "Sign in to load admin CRM data."');
    expect(copy).toContain('loginSubtitle: "Use the same admin credentials as /api/v1/auth/login."');
    expect(copy).toContain('authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งาน CRM หลังบ้าน"');
    expect(copy).toContain('loginSubtitle: "ใช้บัญชีแอดมินเดียวกับเส้นทาง /api/v1/auth/login"');
    expect(copy).toContain('title: "Lead Inbox"');
    expect(copy).toContain('filtersDescription: "Refine the active queue');
    expect(copy).toContain('filtersDescription: "ปรับคิวที่กำลังดู');
    expect(copy).toContain('filterStateDraft: "Draft filters are not applied yet.');
    expect(copy).toContain('filterStateDraft: "ตัวกรองที่แก้ไขไว้ยังไม่ถูกใช้กับคิวปัจจุบัน');
    expect(copy).toContain('appliedQueue: "Applied queue"');
    expect(copy).toContain('appliedQueue: "คิวที่ใช้งานอยู่"');
    expect(copy).toContain('loginTitle: "Admin sign in"');
    expect(copy).toContain('loginTitle: "เข้าสู่ระบบแอดมิน"');
    expect(copy).toContain('emptyDetails: "ไม่พบรายการตามตัวกรองปัจจุบัน');
  });
});
