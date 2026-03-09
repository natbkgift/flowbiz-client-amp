import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin shared surface polish", () => {
  it("marks invalid shared inputs with a reusable error class", () => {
    const input = read("components/admin/forms/AdminInput.tsx");

    expect(input).toContain('const hasError = Boolean(error);');
    expect(input).toContain('className={cx("admin-field", "admin-input", hasError && "has-error", className)}');
  });

  it("adds search affordance and fuller pagination context to shared data tables", () => {
    const table = read("components/admin/AdminDataTable.tsx");
    const primitives = read("components/admin/data-display/AdminTable.tsx");

    expect(table).toContain('label={filterLabel} icon="search"');
    expect(table).toContain('summary={`Page ${effectivePage} of ${totalPages}`}');
    expect(primitives).toContain('aria-label={`Currently viewing page ${currentPage} of ${totalPages} total pages`}');
  });

  it("gives dashboard overview cards explicit hierarchy classes", () => {
    const screen = read("components/admin/domain/dashboard/AdminDashboardScreen.tsx");

    expect(screen).toContain('className: "dashboard-summary-card dashboard-summary-card--secondary dashboard-summary-card--snapshot"');
    expect(screen).toContain('className: "dashboard-summary-card dashboard-summary-card--secondary dashboard-summary-card--queue"');
    expect(screen).toContain('className: "dashboard-summary-card dashboard-summary-card--primary"');
    expect(screen).toContain('className: "dashboard-summary-card dashboard-summary-card--attention"');
    expect(screen).toContain('className="dashboard-hero-toolbar"');
    expect(screen).toContain('className="dashboard-operational-card"');
  });
});
