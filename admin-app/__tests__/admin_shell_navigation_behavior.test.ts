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
  it("keeps a slim task shell with grouped navigation and a session menu", () => {
    const shell = read("components/layout/AdminShell.tsx");

    expect(shell).toContain("ADMIN_NAV_GROUPS");
    expect(shell).toContain("admin-shell-sidebar");
    expect(shell).toContain("admin-shell-sidebar-scroll");
    expect(shell).toContain("admin-shell-topbar");
    expect(shell).toContain("admin-shell-session-menu");
    expect(shell).toContain("admin-shell-profile-head");
    expect(shell).toContain("admin-shell-locale-control");
    expect(shell).toContain("admin-shell-mobile-drawer-sections");
  });

  it("derives page context from the shared nav registry", () => {
    const shell = read("components/layout/AdminShell.tsx");

    expect(shell).toContain("getCurrentAdminLocation");
    expect(shell).toContain("currentGroupLabel");
    expect(shell).toContain("currentWorkspaceLabel");
    expect(shell).toContain("showWorkspaceBreadcrumb");
    expect(shell).toContain("admin-shell-page-heading");
    expect(shell).toContain("admin-shell-breadcrumb");
  });

  it("implements mobile drawer toggle and close behavior", () => {
    const shell = read("components/layout/AdminShell.tsx");

    expect(shell).toContain("mobileNavOpen");
    expect(shell).toContain("setMobileNavOpen(false)");
    expect(shell).toContain("lockBodyScroll()");
    expect(shell).toContain('id="admin-shell-mobile-drawer"');
    expect(shell).toContain("closeMobileNav");
    expect(shell).toContain("window.document.body.style.overflow = \"hidden\"");
  });

  it("styles the simplified drawer and topbar shell controls in admin styles", () => {
    const shell = read("components/layout/AdminShell.tsx");
    const css = readAdminStyles();

    expect(css).toContain(".admin-shell-toggle");
    expect(css).toContain(".admin-shell-sidebar {");
    expect(css).toContain(".admin-shell-topbar {");
    expect(shell).toContain("admin-shell-topbar-inner--compact");
    expect(css).toContain(".admin-shell-mobile-drawer");
    expect(css).toContain(".admin-shell-backdrop.is-open");
    expect(css).toContain(".admin-shell-profile {");
    expect(shell).toContain("admin-shell-session-menu");
    expect(css).toContain("border-right: 1px solid rgba(203, 213, 225, 0.82)");
    expect(css).toContain("box-shadow: 4px 0 18px rgba(15, 23, 42, 0.03)");
    expect(css).toContain(".admin-btn-danger,");
    expect(css).toContain(".admin-button--danger {");
  });
});
