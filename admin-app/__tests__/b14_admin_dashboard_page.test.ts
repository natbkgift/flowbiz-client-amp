import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B14 admin dashboard page contract", () => {
  it("uses admin login endpoint and session storage auth flow", () => {
    const page = read("app/admin/dashboard/page.tsx");

    expect(page).toContain('fetch("/v1/auth/login"');
    expect(page).toContain("AUTH_SESSION_STORAGE_KEY");
    expect(page).toContain("window.sessionStorage.setItem");
    expect(page).toContain("window.sessionStorage.getItem");
    expect(page).toContain("window.sessionStorage.removeItem");
    expect(page).toContain("LEGACY_TOKEN_STORAGE_KEY");
  });

  it("loads B14 backend summary endpoint and includes all required widget keys", () => {
    const page = read("app/admin/dashboard/page.tsx");

    expect(page).toContain('"/admin/dashboard/health-summary"');
    expect(page).toContain('"project_cover_coverage"');
    expect(page).toContain('"broken_media_count"');
    expect(page).toContain('"external_image_leakage_count"');
    expect(page).toContain('"pending_translations_count"');
    expect(page).toContain('"unpublished_drafts_count"');
    expect(page).toContain('"recent_leads_inquiries"');
    expect(page).toContain('"review_video_source_verification_pending"');
    expect(page).toContain('"last_import_mirror_status"');
    expect(page).toContain('"last_deploy_health_status"');
  });

  it("contains accessible structure and runtime states in EN/TH copy", () => {
    const page = read("app/admin/dashboard/page.tsx");

    expect(page).toContain('<main id="main-content"');
    expect(page).toContain('htmlFor="dashboard-login-email"');
    expect(page).toContain('htmlFor="dashboard-login-password"');
    expect(page).toContain('autoComplete="username"');
    expect(page).toContain('autoComplete="current-password"');
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(page).toContain('title: "Admin Health / QA Dashboard"');
    expect(page).toContain('title: "Admin Health / QA Dashboard"');
    expect(page).toContain('subtitle: "หน้าเดียวสำหรับดูความสมบูรณ์ของระบบและลิงก์แก้ปัญหาแบบ actionable"');
  });
});
