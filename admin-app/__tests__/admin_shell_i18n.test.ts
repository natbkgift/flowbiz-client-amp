import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ADMIN_PRIMARY_NAV, ADMIN_SECONDARY_NAV, getAdminNavText } from "@/app/_lib/admin-nav";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("Admin shell i18n", () => {
  it("provides EN/TH labels and descriptions for all admin nav items", () => {
    const allItems = [...ADMIN_PRIMARY_NAV, ...ADMIN_SECONDARY_NAV];
    expect(allItems.length).toBeGreaterThan(0);
    for (const item of allItems) {
      expect(item.label.en.trim().length).toBeGreaterThan(0);
      expect(item.label.th.trim().length).toBeGreaterThan(0);
      expect(item.description.en.trim().length).toBeGreaterThan(0);
      expect(item.description.th.trim().length).toBeGreaterThan(0);
      expect(getAdminNavText(item.label, "th")).toBe(item.label.th);
      expect(getAdminNavText(item.label, "en")).toBe(item.label.en);
    }
  });

  it("admin shell renders localized nav, breadcrumb and aria labels", () => {
    const shell = read("components/layout/AdminShell.tsx");
    expect(shell).toContain("getAdminNavText(item.label, locale)");
    expect(shell).toContain("getAdminNavText(item.description, locale)");
    expect(shell).toContain("aria-label={ui.workspaceNavigation}");
    expect(shell).toContain("aria-label={ui.pageTitle}");
    expect(shell).toContain("aria-label={ui.breadcrumb}");
    expect(shell).toContain('aria-controls="admin-shell-mobile-drawer"');
    expect(shell).toContain('event.key === "Escape"');
    expect(shell).toContain("aria-label={ui.sessionMenu}");
    expect(shell).toContain("admin-shell-topbar-inner--compact");
  });

  it("preserves the requested locale when /admin redirects to the dashboard", () => {
    const adminIndex = read("app/admin/page.tsx");
    expect(adminIndex).toContain("ADMIN_LOCALE_QUERY_KEY");
    expect(adminIndex).toContain("redirect(`/admin/dashboard?${ADMIN_LOCALE_QUERY_KEY}=${locale}`)");
  });
});
