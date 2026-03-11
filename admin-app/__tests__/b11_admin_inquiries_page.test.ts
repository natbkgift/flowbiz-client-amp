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
    expect(contactActions).toContain("selected.whatsapp_url");
    expect(contactActions).toContain("selected.phone_url");
    expect(contactActions).toContain("selected.email_url");
    expect(detail).toContain("<InquiryContactActions");
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
    expect(savedFilters).toContain('id="crm-saved-filter-select"');
  });

  it("keeps accessibility and runtime states in EN/TH copy", () => {
    const page = read("app/admin/inquiries/page.tsx");
    const controlCenter = read("components/admin/domain/crm/InquiryControlCenter.tsx");
    const copy = read("components/admin/domain/crm/inquiries-copy.ts");

    expect(page).toContain('<main id="main-content"');
    expect(page).toContain("<AdminPageHeader title={t.title}");
    expect(page).toContain('title={t.list}');
    expect(page).toContain("t.listDescription");
    expect(page).toContain("t.loadingHint");
    expect(page).toContain("t.emptyHint");
    expect(page).toContain('title={t.details}');
    expect(page).toContain('className="crm-list"');
    expect(page).toContain('className="crm-detail"');
    expect(controlCenter).toContain('htmlFor="crm-login-email"');
    expect(controlCenter).toContain('htmlFor="crm-login-password"');
    expect(controlCenter).toContain('autoComplete="username"');
    expect(controlCenter).toContain('autoComplete="current-password"');
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(copy).toContain('filtersDescription: "Refine the active queue');
    expect(copy).toContain('filtersDescription: "ปรับคิวงานที่กำลังดู');
    expect(copy).toContain('loginTitle: "Admin sign in"');
    expect(copy).toContain('loginTitle: "เข้าสู่ระบบแอดมิน"');
  });
});
