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

    expect(page).toContain("status: statusFilter");
    expect(page).toContain("source: sourceFilter");
    expect(page).toContain("purpose: purposeFilter");
    expect(page).toContain("date_from: dateFrom");
    expect(page).toContain("date_to: dateTo");
    expect(page).toContain("follow_up_status: followUpFilter");
    expect(page).toContain('["pending", "scheduled", "completed", "no_response"]');
    expect(page).toContain("selected.whatsapp_url");
    expect(page).toContain("selected.phone_url");
    expect(page).toContain("selected.email_url");
  });

  it("supports table + kanban board with saved filters and status move wiring", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain('const [viewMode, setViewMode] = useState<"table" | "kanban">("table")');
    expect(page).toContain("CRM_STATUSES");
    expect(page).toContain('method: "PATCH"');
    expect(page).toContain("`/admin/inquiries/${inquiryId}`");
    expect(page).toContain('body: JSON.stringify({ status: nextStatus })');
    expect(page).toContain("flowbiz_crm_saved_filters_v1");
    expect(page).toContain("readRoleFromToken");
    expect(page).toContain("saveCurrentFilter");
    expect(page).toContain("loadSavedFilter");
  });

  it("keeps accessibility and runtime states in EN/TH copy", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain('<main id="main-content"');
    expect(page).toContain("<AdminPageHeader title={t.title}");
    expect(page).toContain('title={t.list}');
    expect(page).toContain('title={t.details}');
    expect(page).toContain('className="crm-list"');
    expect(page).toContain('className="crm-detail"');
    expect(page).toContain('htmlFor="crm-login-email"');
    expect(page).toContain('htmlFor="crm-login-password"');
    expect(page).toContain('autoComplete="username"');
    expect(page).toContain('autoComplete="current-password"');
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(page).toContain('loginTitle: "Admin sign in"');
    expect(page).toContain('loginTitle: "เข้าสู่ระบบแอดมิน"');
  });
});
