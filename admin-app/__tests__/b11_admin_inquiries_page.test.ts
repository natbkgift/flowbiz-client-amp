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
    const controlCenter = read("components/admin/domain/crm/InquiryControlCenter.tsx");

    expect(page).toContain('from "@/app/_lib/admin-auth-hooks"');
    expect(page).toContain("useAdminAuthController");
    expect(page).toContain("loginWithAdminSession");
    expect(page).toContain('from "@/components/admin/domain/crm/InquiryControlCenter"');
    expect(controlCenter).toContain("<form");
    expect(controlCenter).toContain('name="email"');
    expect(controlCenter).toContain('name="password"');
    expect(page).not.toContain('fetch("/v1/auth/login"');
    expect(page).not.toContain('id="admin-token"');
  });

  it("keeps required admin inquiry API wiring", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain("`/admin/inquiries?${query}`");
    expect(page).toContain("`/admin/inquiries/${id}`");
    expect(page).toContain("`/admin/inquiries/${id}/timeline?limit=30`");
    expect(page).toContain("`/admin/inquiries/${selectedId}/follow-up`");
    expect(page).toContain("`/admin/inquiries-export.csv?${filterQuery}`");
    expect(page).toContain("Authorization: `Bearer ${activeToken}`");
  });

  it("keeps filters, follow-up controls and quick contact actions", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const filters = read("components/admin/domain/crm/InquiryFiltersPanel.tsx");
    const detail = read("components/admin/domain/crm/InquiryDetailPanel.tsx");
    const contactActions = read("components/admin/domain/crm/InquiryContactActions.tsx");
    const followUp = read("components/admin/domain/crm/InquiryFollowUpPanel.tsx");
    const timeline = read("components/admin/domain/crm/InquiryTimelinePanel.tsx");
    const utils = read("components/admin/domain/crm/inquiries-utils.ts");

    expect(page).toContain("const [filters, setFilters] = useState<InquiryFilters>(EMPTY_FILTERS)");
    expect(filters).toContain('onFilterChange("status"');
    expect(filters).toContain('onFilterChange("source"');
    expect(filters).toContain('onFilterChange("purpose"');
    expect(filters).toContain('onFilterChange("date_from"');
    expect(filters).toContain('onFilterChange("date_to"');
    expect(filters).toContain('onFilterChange("follow_up_status"');
    expect(filters).toContain("filtersDescription");
    expect(filters).toContain("searchPlaceholder");
    expect(utils).toContain('["pending", "scheduled", "completed", "no_response"]');
    expect(utils).toContain("translateFollowUpStatus");
    expect(utils).toContain("translateInquiryStatus");
    expect(utils).toContain("getInquiryDisplayLabel");
    expect(contactActions).toContain("selected.whatsapp_url");
    expect(contactActions).toContain("selected.phone_url");
    expect(contactActions).toContain("selected.email_url");
    expect(detail).toContain("<InquiryContactActions");
    expect(detail).toContain("detailsDescription");
    expect(followUp).toContain("followUpNotice");
    expect(timeline).toContain("timelineEmpty");
    expect(contactActions).toContain("contactActionsEmpty");
    expect(followUp).toContain('id="follow-up-status"');
  });

  it("supports table + kanban board with saved filters and status move wiring", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const kanban = read("components/admin/domain/crm/InquiryKanbanBoard.tsx");
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
    expect(page).toContain('const [detailLoading, setDetailLoading] = useState(false)');
    expect(page).toContain('const [movingInquiryId, setMovingInquiryId] = useState<string | null>(null)');
    expect(savedFilters).toContain('id="crm-saved-filter-select"');
    expect(page).toContain('className="crm-controls-toolbar"');
    expect(savedFilters).toContain("savedFiltersHint");
    expect(savedFilters).toContain("savedFiltersEmpty");
  });

  it("auto-opens the first inquiry when the current selection is no longer in the refreshed queue", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");

    expect(page).toContain("const selectedIdToRefresh = selectedId && body.data.some((item) => item.id === selectedId) ? selectedId : null;");
    expect(page).toContain("if (selectedIdToRefresh) {");
    expect(page).toContain("await loadDetails(selectedIdToRefresh, activeToken);");
    expect(page).toContain("} else {");
    expect(page).toContain("const nextSelectedId = body.data[0]?.id ?? null;");
    expect(page).toContain("if (nextSelectedId) {");
    expect(page).toContain("await loadDetails(nextSelectedId, activeToken);");
    expect(page).toContain("async function loadDetails(id: string, tokenOverride?: string)");
    expect(page).toContain('const activeToken = (tokenOverride ?? authToken).trim();');
    expect(copy).toContain('emptyDetails: "No inquiries match current filters. Adjust filters or reload the queue to fetch the latest leads."');
  });

  it("clears filters and immediately reloads the default queue", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain("function clearFilters()");
    expect(page).toContain("setFilters(EMPTY_FILTERS);");
    expect(page).toContain("void loadListWithFilters(EMPTY_FILTERS);");
    expect(page).toContain('onClick={clearFilters}');
  });

  it("separates apply vs reload based on whether filters are still dirty", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain('const [appliedFilterQuery, setAppliedFilterQuery] = useState(() => buildQuery(EMPTY_FILTERS));');
    expect(page).toContain("const hasUnappliedFilters = filterQuery !== appliedFilterQuery;");
    expect(page).toContain("setAppliedFilterQuery(query);");
    expect(page).toContain("const shouldDisableApply = !isAuthenticated || loading || detailLoading || Boolean(movingInquiryId) || !hasUnappliedFilters;");
    expect(page).toContain("const shouldDisableReload = !isAuthenticated || detailLoading || Boolean(movingInquiryId) || hasUnappliedFilters;");
    expect(page).toContain("disabled={shouldDisableApply}");
    expect(page).toContain("disabled={shouldDisableReload}");
  });

  it("disables clear when there is no active or pending filter to reset", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain("const hasActiveFilters = Object.values(filters).some((value) => value.trim().length > 0);");
    expect(page).toContain("const hasNoFiltersToReset = !hasUnappliedFilters && !hasActiveFilters;");
    expect(page).toContain("const shouldDisableClear = !isAuthenticated || loading || detailLoading || Boolean(movingInquiryId) || hasNoFiltersToReset;");
    expect(page).toContain("disabled={shouldDisableClear}");
  });

  it("keeps a readable primary row label even when inquiry name is missing", () => {
    const list = read("components/admin/domain/crm/InquiryListTable.tsx");
    const detail = read("components/admin/domain/crm/InquiryDetailPanel.tsx");
    const utils = read("components/admin/domain/crm/inquiries-utils.ts");

    expect(list).toContain("const primaryLabel = getInquiryDisplayLabel(item);");
    expect(list).toContain("<span>{primaryLabel}</span>");
    expect(detail).toContain("const summaryTitle = getInquiryDisplayLabel(selected);");
    expect(detail).toContain("<h3>{summaryTitle}</h3>");
    expect(utils).toContain("export function getInquiryDisplayLabel");
    expect(utils).toContain("return item.name || item.email || item.phone || item.id;");
  });

  it("renders inquiry status as a visible chip for faster table scanning", () => {
    const list = read("components/admin/domain/crm/InquiryListTable.tsx");

    expect(list).toContain('<span className="crm-chip crm-chip-muted">{translateInquiryStatus(item.status, locale)}</span>');
  });

  it("aligns the detail empty state with the current queue state", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const detail = read("components/admin/domain/crm/InquiryDetailPanel.tsx");

    expect(page).toContain("const detailEmptyStateMessage = !loading && items.length === 0 ? t.emptyDetails : t.noDetails;");
    expect(page).toContain("emptyStateMessage={detailEmptyStateMessage}");
    expect(detail).toContain("emptyStateMessage?: string;");
    expect(detail).toContain("const message = emptyStateMessage ?? t.noDetails;");
    expect(detail).toContain("<div className=\"state-empty\">{message}</div>");
  });

  it("keeps accessibility and runtime states in EN/TH copy", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const controlCenter = read("components/admin/domain/crm/InquiryControlCenter.tsx");
    const detail = read("components/admin/domain/crm/InquiryDetailPanel.tsx");
    const followUp = read("components/admin/domain/crm/InquiryFollowUpPanel.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");

    expect(page).toContain('<main id="main-content"');
    expect(page).toContain("<AdminPageHeader title={t.title}");
    expect(page).toContain('title={t.list}');
    expect(page).toContain("t.listDescription");
    expect(page).toContain("t.loadingHint");
    expect(page).toContain("t.movingStatus");
    expect(page).toContain("t.emptyHint");
    expect(page).toContain('title={t.details}');
    expect(page).toContain('className="crm-list"');
    expect(page).toContain('className="crm-detail"');
    expect(page).toContain("followUpNotice");
    expect(detail).toContain("detailLoading");
    expect(detail).toContain("t.loadingDetails");
    expect(followUp).toContain("detailLoading");
    expect(controlCenter).toContain('htmlFor="crm-login-email"');
    expect(controlCenter).toContain('htmlFor="crm-login-password"');
    expect(controlCenter).toContain('autoComplete="username"');
    expect(controlCenter).toContain('autoComplete="current-password"');
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(copy).toContain('followUpSaved: "Follow-up updated."');
    expect(copy).toContain('followUpSaved: "บันทึกสถานะติดตามแล้ว"');
    expect(copy).toContain('sessionHint: "Keep this session active');
    expect(copy).toContain('sessionHint: "คงเซสชันนี้ไว้');
    expect(copy).toContain('filtersDescription: "Refine the active queue');
    expect(copy).toContain('filtersDescription: "ปรับคิวงานที่กำลังดู');
    expect(copy).toContain('loginTitle: "Admin sign in"');
    expect(copy).toContain('loginTitle: "เข้าสู่ระบบแอดมิน"');
    expect(copy).toContain('emptyDetails: "ไม่พบรายการตามตัวกรองปัจจุบัน');
  });
});
