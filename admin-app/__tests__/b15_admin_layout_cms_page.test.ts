import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B15 admin layout cms workspace contract", () => {
  it("keeps auth/session flow and company CMS endpoints for site-layout", () => {
    const page = read("app/admin/layout/page.tsx");

    expect(page).toContain("from '@/app/_lib/admin-auth'");
    expect(page).toContain("loginAdmin");
    expect(page).not.toContain('fetch(`${API_PREFIX}/v1/auth/login`');
    expect(page).toContain("`${API_PREFIX}/admin/company/${SITE_LAYOUT_CMS_SLUG}`");
    expect(page).toContain("`${API_PREFIX}/admin/company`");
    expect(page).toContain("'site-layout JSON'");
    expect(page).toContain("primary_links");
    expect(page).toContain("legal_links");
    expect(page).toContain("SITE_LAYOUT_CMS_TEMPLATE");
    expect(page).toContain("AdminPrimaryActionBar");
    expect(page).toContain("AdminRepeaterEditor");
    expect(page).toContain("Site Chrome");
    expect(page).not.toContain("textarea");
    expect(page).toContain("state-error");
    expect(page).toContain("successTitle");
    expect(page).toContain('className="admin-workspace-success-handoff"');
    expect(page).toContain("href={withAdminLocale('/admin/company', locale)}");
    expect(page).toContain("href={withAdminLocale('/admin/home-composer', locale)}");
  });

  it("exposes a non-admin alias route for environments that rewrite /admin/*", () => {
    const alias = read("app/layout-cms/page.tsx");
    expect(alias).toContain('@/app/admin/layout/page');
  });
});
