import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B15 admin layout cms workspace contract", () => {
  it("uses auth/session flow and company CMS endpoints for site-layout", () => {
    const page = read("app/admin/layout/page.tsx");

    expect(page).toContain('fetch(`${API_PREFIX}/v1/auth/login`');
    expect(page).toContain("AUTH_SESSION_STORAGE_KEY");
    expect(page).toContain("`${API_PREFIX}/admin/company/${SITE_LAYOUT_CMS_SLUG}`");
    expect(page).toContain("`${API_PREFIX}/admin/company`");
    expect(page).toContain('"site-layout JSON"');
    expect(page).toContain("primary_links");
    expect(page).toContain("legal_links");
    expect(page).toContain("SITE_LAYOUT_CMS_TEMPLATE");
    expect(page).toContain("state-error");
  });

  it("exposes a non-admin alias route for environments that rewrite /admin/*", () => {
    const alias = read("app/layout-cms/page.tsx");
    expect(alias).toContain('@/app/admin/layout/page');
  });
});
