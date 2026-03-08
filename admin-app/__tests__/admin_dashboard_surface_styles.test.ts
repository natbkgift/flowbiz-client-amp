import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin dashboard surface styles", () => {
  it("defines admin shell surface and status tokens", () => {
    const css = read("app/globals.css");

    expect(css).toContain(".admin-shell {");
    expect(css).toContain("--admin-surface-card:");
    expect(css).toContain("--admin-border-strong:");
    expect(css).toContain("--admin-shadow-soft:");
    expect(css).toContain("--admin-status-ok-bg:");
    expect(css).toContain("--admin-status-error-border:");
  });

  it("scopes card and button treatment to admin shell content", () => {
    const css = read("app/globals.css");

    expect(css).toContain(".admin-shell-content .card,");
    expect(css).toContain("border-radius: var(--admin-card-radius);");
    expect(css).toContain(".admin-shell-content .btn {");
    expect(css).toContain(".admin-shell-content .btn-secondary {");
    expect(css).toContain("background: linear-gradient(135deg, #0f766e 0%, #155e75 52%, #2563eb 100%);");
  });

  it("styles dashboard-specific widgets, table states, and warning list", () => {
    const css = read("app/globals.css");

    expect(css).toContain(".dashboard-shell-grid {");
    expect(css).toContain(".dashboard-section-state--error {");
    expect(css).toContain(".dashboard-summary-grid {");
    expect(css).toContain(".dashboard-insight-item {");
    expect(css).toContain(".dashboard-widget::before");
    expect(css).toContain(".dashboard-table tbody tr:hover td");
    expect(css).toContain(".dashboard-table-skeleton {");
    expect(css).toContain(".dashboard-warning-list li");
    expect(css).toContain(".dashboard-table-wrap {");
    expect(css).toContain(".dashboard-status-unknown {");
  });
});
