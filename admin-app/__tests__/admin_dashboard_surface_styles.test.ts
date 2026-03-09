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
    read("styles/admin-tokens.css"),
    read("styles/admin-base.css"),
    read("styles/admin-components.css"),
  ].join("\n");
}

describe("admin dashboard surface styles", () => {
  it("defines admin shell surface and status tokens", () => {
    const css = readAdminStyles();

    expect(css).toContain(".admin-shell {");
    expect(css).toContain("--admin-bg-card:");
    expect(css).toContain("--admin-border-strong:");
    expect(css).toContain("--admin-shadow-sm:");
    expect(css).toContain("--admin-color-success-50:");
    expect(css).toContain("--admin-color-danger-100:");
  });

  it("scopes card and button treatment to admin shell content", () => {
    const css = readAdminStyles();

    expect(css).toContain(".admin-root .card,");
    expect(css).toContain("border-radius: var(--admin-radius-lg);");
    expect(css).toContain(".admin-root .btn,");
    expect(css).toContain(".admin-root .btn-secondary,");
    expect(css).toContain(".admin-btn-danger,");
    expect(css).toContain(".admin-card-shell--ok::before");
    expect(css).toContain(".admin-input.has-error .admin-input__label");
    expect(css).toContain(".admin-shell-nav-match");
  });

  it("styles dashboard-specific widgets, table states, and warning list", () => {
    const css = readAdminStyles();

    expect(css).toContain(".dashboard-shell-grid {");
    expect(css).toContain(".dashboard-section-state--error {");
    expect(css).toContain(".dashboard-summary-grid {");
    expect(css).toContain(".dashboard-insight-item {");
    expect(css).toContain(".dashboard-widget::before");
    expect(css).toContain(".dashboard-kpi-card--ok {");
    expect(css).toContain(".dashboard-kpi-pill {");
    expect(css).toContain(".dashboard-period-toggle {");
    expect(css).toContain(".dashboard-chart-surface {");
    expect(css).toContain(".dashboard-chart-line {");
    expect(css).toContain(".dashboard-table-shell {");
    expect(css).toContain(".dashboard-table-toolbar {");
    expect(css).toContain(".dashboard-table-chip {");
    expect(css).toContain(".dashboard-table-card-list {");
    expect(css).toContain(".dashboard-table-wrap,");
    expect(css).toContain(".dashboard-table tbody tr:hover td");
    expect(css).toContain(".dashboard-warning-list li");
    expect(css).toContain(".dashboard-table-wrap {");
    expect(css).toContain(".dashboard-status-unknown {");
    expect(css).toContain(".dashboard-summary-card--primary");
    expect(css).toContain(".dashboard-summary-card--attention");
  });
});
