import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin dashboard trend chart component", () => {
  it("defines chart surface and skeleton exports", () => {
    const component = read("components/admin/dashboard/DashboardTrendChart.tsx");

    expect(component).toContain("export function DashboardTrendChart(");
    expect(component).toContain("export function DashboardTrendChartSkeleton()");
    expect(component).toContain("useId()");
    expect(component).toContain('className="sr-only"');
    expect(component).toContain("aria-describedby={chartSummaryId}");
    expect(component).toContain("<title id={chartTitleId}>");
    expect(component).toContain("dashboard-chart-svg");
    expect(component).toContain("dashboard-chart-line");
    expect(component).toContain("dashboard-chart-dot");
    expect(component).toContain("dashboard-chart-axis");
  });
});
