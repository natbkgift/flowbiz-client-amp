import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("Admin shell + route consolidation (Phase A)", () => {
  const workspaceRoutes = [
    "dashboard",
    "domain",
    "imports",
    "inquiries",
    "layout",
    "media",
    "seo",
    "home-composer",
  ] as const;

  it("provides canonical /admin shell layout + dashboard default route", () => {
    const layout = read("app/admin/layout.tsx");
    const index = read("app/admin/page.tsx");
    const shell = read("components/layout/AdminShell.tsx");
    const nav = read("app/_lib/admin-nav.ts");
    expect(layout).toContain("AdminShell");
    expect(index).toContain('redirect("/admin/dashboard")');
    for (const route of workspaceRoutes) {
      expect(nav).toContain(`/admin/${route}`);
    }
    expect(shell).toContain("ADMIN_PRIMARY_NAV");
    expect(shell).toContain("ADMIN_SECONDARY_NAV");
    expect(shell).toContain("admin-shell-topbar");
    expect(shell).toContain("admin-shell-search--topbar");
    expect(shell).toContain("admin-shell-quick-actions");
    expect(shell).toContain("admin-shell-profile");
    expect(shell).toContain("admin-shell-mobile-drawer");
    expect(shell).toContain("aria-label={ui.breadcrumb}");
    expect(shell).toContain("admin-shell-nav-section is-active");
    expect(shell).toContain("admin-language-switcher");
    expect(shell).toContain("window.location.hash");
  });

  it("keeps all workspaces under /admin with main landmark and no legacy shell import", () => {
    for (const route of workspaceRoutes) {
      const page = read(`app/admin/${route}/page.tsx`);
      expect(page).toContain('id="main-content"');
      expect(page).not.toContain("from '../../components/layout/AdminLayout'");
      expect(page).not.toContain('from "@/components/layout/AdminLayout"');
    }
  });

  it("routes legacy admin paths into /admin canonical URLs or aliases", () => {
    const analytics = read("app/analytics/page.tsx");
    const inquiries = read("app/inquiries/page.tsx");
    const leads = read("app/leads/page.tsx");
    const layoutCms = read("app/layout-cms/page.tsx");
    const homeComposer = read("app/home-composer/page.tsx");
    expect(analytics).toContain('redirect("/admin/dashboard")');
    expect(inquiries).toContain('redirect("/admin/inquiries")');
    expect(leads).toContain('redirect("/admin/inquiries")');
    expect(layoutCms).toContain('@/app/admin/layout/page');
    expect(homeComposer).toContain('@/app/admin/home-composer/page');
  });

  it("disables trailing-slash redirects to prevent /admin proxy loops", () => {
    const nextConfig = read("next.config.js");
    expect(nextConfig).toContain("skipTrailingSlashRedirect: true");
  });
});
