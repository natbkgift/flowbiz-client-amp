import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

function readAdminStyles(): string {
  return [
    read("app/globals.css"),
    read("styles/admin-base.css"),
    read("styles/admin-components.css"),
  ].join("\n");
}

describe("admin shell navigation behavior", () => {
  it("includes searchable nav, quick actions, and workspace profile slots", () => {
    const shell = read("components/layout/AdminShell.tsx");

    expect(shell).toContain("ADMIN_QUICK_ACTIONS");
    expect(shell).toContain("searchPlaceholder");
    expect(shell).toContain("admin-shell-search--sidebar");
    expect(shell).toContain("admin-shell-search--topbar");
    expect(shell).toContain("admin-shell-profile");
    expect(shell).toContain("admin-shell-sidebar-footer");
  });

  it("shows the empty search state in both desktop and mobile navigation", () => {
    const shell = read("components/layout/AdminShell.tsx");

    expect(shell).toContain("const hasSearchResults =");
    expect(shell).toContain("const totalSearchResults =");
    expect(shell).toContain("filteredUtilityItems.length > 0");
    expect(shell).toContain("renderHighlightedText");
    expect(shell).toContain("admin-shell-nav-match");
    expect(shell).toContain("admin-shell-search-summary");
    expect(shell).toContain("searchSummaryLabel");
    expect(shell).toContain("searchSummaryMatches");
    expect(shell).toContain('aria-live="polite"');
    expect(shell).toContain("admin-shell-nav-empty-icon");
    expect(shell).toContain("hasSearchResults ? (");
    expect(shell).toContain("emptySearchState");
    expect(shell).toContain("admin-shell-sidebar-scroll");
    expect(shell).toContain("admin-shell-mobile-drawer-sections");
  });

  it("implements mobile drawer toggle and close behavior", () => {
    const shell = read("components/layout/AdminShell.tsx");

    expect(shell).toContain("mobileNavOpen");
    expect(shell).toContain("setMobileNavOpen(false)");
    expect(shell).toContain("lockBodyScroll()");
    expect(shell).toContain('id="admin-shell-mobile-drawer"');
    expect(shell).toContain("closeMobileNav");
    expect(shell).toContain("body.style.paddingRight");
  });

  it("styles drawer and topbar shell controls in globals.css", () => {
    const css = readAdminStyles();

    expect(css).toContain(".admin-shell-toggle");
    expect(css).toContain(".admin-shell-topbar-tools");
    expect(css).toContain(".admin-shell-search");
    expect(css).toContain(".admin-shell-search-summary");
    expect(css).toContain(".admin-shell-search-summary__label");
    expect(css).toContain(".admin-shell-mobile-drawer");
    expect(css).toContain(".admin-shell-backdrop.is-open");
    expect(css).toContain(".admin-btn-danger,");
    expect(css).toContain(".admin-button--danger {");
  });
});
