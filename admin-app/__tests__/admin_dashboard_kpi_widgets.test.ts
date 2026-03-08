import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin dashboard kpi widgets", () => {
  it("formats raw metric detail blocks and locale-safe action links", () => {
    const component = read("components/admin/dashboard/DashboardKpiWidgets.tsx");

    expect(component).toContain('from "@/app/_lib/admin-i18n"');
    expect(component).toContain("withAdminLocale(action.url, locale)");
    expect(component).toContain("function statusLabel(");
    expect(component).toContain("project_cover_coverage");
    expect(component).toContain("review_video_source_verification_pending");
    expect(component).toContain("last_import_mirror_status");
    expect(component).toContain("last_deploy_health_status");
    expect(component).toContain("translationBreakdown");
    expect(component).toContain("homeComposer");
    expect(component).toContain("dashboard-kpi-pill-row");
    expect(component).toContain("dashboard-kpi-detail-list");
    expect(component).toContain("dashboard-kpi-card--");
  });
});
