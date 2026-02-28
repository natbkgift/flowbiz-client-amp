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

    expect(page).toContain('fetch("/v1/auth/login"');
    expect(page).toContain("AUTH_SESSION_STORAGE_KEY");
    expect(page).toContain("window.sessionStorage.setItem");
    expect(page).toContain("window.sessionStorage.getItem");
    expect(page).toContain("window.sessionStorage.removeItem");
    expect(page).toContain("LEGACY_TOKEN_STORAGE_KEY");
    expect(page).not.toContain('id="admin-token"');
  });

  it("keeps required admin inquiry API wiring", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain("`/admin/inquiries?${filterQuery}`");
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

  it("keeps accessibility and runtime states in EN/TH copy", () => {
    const page = read("app/admin/inquiries/page.tsx");

    expect(page).toContain('<main id="main-content"');
    expect(page).toContain('<h1>{t.title}</h1>');
    expect(page).toContain('<h2>{t.list}</h2>');
    expect(page).toContain('<h2>{t.details}</h2>');
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
