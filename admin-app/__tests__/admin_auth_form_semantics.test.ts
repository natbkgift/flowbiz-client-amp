import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

const AUTH_FORM_PAGES = [
  { stateFile: "app/login/page.tsx" },
  {
    stateFile: "app/admin/dashboard/page.tsx",
    formFile: "components/admin/domain/dashboard/AdminDashboardScreen.tsx",
  },
  { stateFile: "app/admin/domain/page.tsx" },
  { stateFile: "app/admin/home-composer/page.tsx" },
  { stateFile: "app/admin/imports/page.tsx" },
  {
    stateFile: "app/admin/inquiries/page.tsx",
    formFile: "components/admin/domain/crm/InquiryControlCenter.tsx",
  },
  { stateFile: "app/admin/layout/page.tsx" },
  { stateFile: "app/admin/media/page.tsx" },
  { stateFile: "app/admin/seo/page.tsx" },
];

describe("admin auth form semantics", () => {
  it("keeps login fields inside semantic forms with submit behavior", () => {
    for (const { stateFile, formFile } of AUTH_FORM_PAGES) {
      const page = read(formFile || stateFile);
      expect(page).toContain("<form");
      expect(page).toContain("onSubmit");
      expect(page).toContain("type=\"submit\"");
    }
  });

  it("uses proper login field attributes for password managers and a11y", () => {
    for (const { stateFile, formFile } of AUTH_FORM_PAGES) {
      const page = read(formFile || stateFile);
      expect(page).toContain("name=\"email\"");
      expect(page).toContain("name=\"password\"");
      expect(page).toContain("type=\"email\"");
      expect(page).toContain("type=\"password\"");
      expect(page).toContain("autoComplete=\"username\"");
      expect(page).toContain("autoComplete=\"current-password\"");
      expect(page).toContain("required");
      expect(page).toContain("htmlFor=");
    }
  });

  it("announces admin auth errors and keeps helper copy inside the login form", () => {
    const dashboardForm = read("components/admin/domain/dashboard/AdminDashboardScreen.tsx");
    const crmForm = read("components/admin/domain/crm/InquiryControlCenter.tsx");

    expect(dashboardForm).toContain('role="alert"');
    expect(crmForm).toContain('role="alert"');
    expect(crmForm).toContain('aria-live="assertive"');
    expect(crmForm).toContain('aria-atomic="true"');
    expect(crmForm).toContain('className="dashboard-control-card__helper state-empty"');
    expect(crmForm).toContain("<strong>{t.authRequired}</strong>");
    expect(crmForm).toContain("t.loginSubtitle");
  });
});
