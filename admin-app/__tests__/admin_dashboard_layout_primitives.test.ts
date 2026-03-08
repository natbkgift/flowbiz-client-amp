import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin dashboard layout primitives", () => {
  it("defines reusable section, state, and skeleton building blocks", () => {
    const component = read("components/admin/dashboard/DashboardSectionPrimitives.tsx");

    expect(component).toContain("export function DashboardSection(");
    expect(component).toContain("export function DashboardSectionState(");
    expect(component).toContain("export function DashboardMetricSkeletonRow(");
    expect(component).toContain("export function DashboardWidgetSkeletonGrid(");
    expect(component).toContain("export function DashboardInsightSkeletonList(");
    expect(component).toContain("export function DashboardTableSkeleton(");
    expect(component).toContain('className="dashboard-section-body"');
    expect(component).toContain('className="dashboard-summary-grid dashboard-summary-grid--skeleton"');
    expect(component).toContain('className="dashboard-table-skeleton"');
  });
});
