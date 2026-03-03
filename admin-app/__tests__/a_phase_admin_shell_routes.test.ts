import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("Admin shell + route consolidation (Phase A)", () => {
  it("provides canonical /admin shell layout + dashboard default route", () => {
    const layout = read("app/admin/layout.tsx");
    const index = read("app/admin/page.tsx");
    expect(layout).toContain("AdminShell");
    expect(index).toContain('redirect("/admin/dashboard")');
  });

  it("keeps home composer available under /admin and legacy alias", () => {
    const adminComposer = read("app/admin/home-composer/page.tsx");
    const legacyAlias = read("app/home-composer/page.tsx");
    expect(adminComposer).toContain('id="main-content"');
    expect(adminComposer).not.toContain("AdminLayout");
    expect(legacyAlias).toContain('@/app/admin/home-composer/page');
  });

  it("routes legacy admin paths into /admin canonical URLs", () => {
    const analytics = read("app/analytics/page.tsx");
    const inquiries = read("app/inquiries/page.tsx");
    const leads = read("app/leads/page.tsx");
    expect(analytics).toContain('redirect("/admin/dashboard")');
    expect(inquiries).toContain('redirect("/admin/inquiries")');
    expect(leads).toContain('redirect("/admin/inquiries")');
  });
});
