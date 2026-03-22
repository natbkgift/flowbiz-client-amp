import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B10 admin SEO page contract", () => {
  it("keeps admin auth/session flow compatible with existing admin pages", () => {
    const page = read("app/admin/seo/page.tsx");
    expect(page).toContain('from "@/app/_lib/admin-auth"');
    expect(page).toContain("loginAdmin");
    expect(page).not.toContain('fetch("/v1/auth/login"');
    expect(page).not.toContain("login_failed:");
  });

  it("wires B10 endpoints for overrides redirects schema and broken-links", () => {
    const page = read("app/admin/seo/page.tsx");
    expect(page).toContain('fetch(`/api${path}`');
    expect(page).toContain('"/admin/seo/overrides"');
    expect(page).toContain('"/admin/seo/redirects"');
    expect(page).toContain('"/admin/seo/schema-source"');
    expect(page).toContain('"/admin/seo/schema-source/bootstrap-production"');
    expect(page).toContain('"/admin/seo/broken-links/run"');
    expect(page).toContain('"/admin/seo/broken-links/latest"');
    expect(page).toContain('"/admin/seo/broken-links/policy"');
    expect(page).toContain('"/admin/seo/redirects/preload-production"');
  });

  it("contains required sections and runtime states", () => {
    const page = read("app/admin/seo/page.tsx");
    expect(page).toContain('<main id="main-content"');
    expect(page).toContain("admin-overflow-guard");
    expect(page).toContain("sectionOverrides");
    expect(page).toContain("sectionRedirects");
    expect(page).toContain("sectionSchema");
    expect(page).toContain("sectionBroken");
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(page).toContain("formatSeoApiError");
    expect(page).toContain("readRequestFailedStatus");
    expect(page).toContain("{t.retry}");
    expect(page).toContain('overflowWrap: "anywhere"');
    expect(page).toContain('className="state-empty admin-workspace-empty-state"');
    expect(page).toContain("overridesEmptyHint");
    expect(page).toContain("redirectsEmptyHint");
    expect(page).toContain("schemaEmptyHint");
    expect(page).toContain("reportEmptyHint");
    expect(page).toContain('href={withAdminLocale("/admin/dashboard", locale)}');
    expect(page).toContain('href={withAdminLocale("/admin/review-queue", locale)}');
    expect(page).toContain("successTitle");
    expect(page).toContain("overrideSaved");
    expect(page).toContain("reportReady");
    expect(page).toContain('className="admin-workspace-success-handoff"');
  });

  it("includes basic accessible labels and EN/TH copy", () => {
    const page = read("app/admin/seo/page.tsx");
    expect(page).toContain('htmlFor="seo-login-email"');
    expect(page).toContain('htmlFor="seo-login-password"');
    expect(page).toContain('htmlFor="seo-override-path"');
    expect(page).toContain('htmlFor="seo-redirect-old-path"');
    expect(page).toContain('htmlFor="seo-schema-org-name"');
    expect(page).toContain('title: "SEO Controls"');
    expect(page).toContain('title: "SEO Controls หลังบ้าน"');
  });
});
