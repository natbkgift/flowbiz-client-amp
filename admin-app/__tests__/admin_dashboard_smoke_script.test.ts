import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin dashboard smoke script", () => {
  it("mocks non-empty dashboard data and verifies redesigned sections after login", () => {
    const script = read("scripts/run-admin-smoke-e2e.mjs");

    expect(script).toContain('const SMOKE_MODE = process.env.ADMIN_SMOKE_MODE === "live" ? "live" : "mocked";');
    expect(script).toContain('const SMOKE_LOCALE = process.env.ADMIN_SMOKE_LOCALE === "th" ? "th" : "en";');
    expect(script).toContain('ADMIN_SMOKE_EMAIL');
    expect(script).toContain('ADMIN_SMOKE_PASSWORD');
    expect(script).toContain('smokeMode: SMOKE_MODE');
    expect(script).toContain('locale: SMOKE_LOCALE');
    expect(script).toContain('healthSummaryStatuses');
    expect(script).toContain('recentInquiriesStatuses');
    expect(script).toContain('healthSummaryContract');
    expect(script).toContain('mockedRoutes:');
    expect(script).toContain("function buildAdminUrl(routePath)");
    expect(script).toContain("function getVisibleWidgetTitle(widgetKey, fallbackTitle)");
    expect(script).toContain("function buildDashboardSmokePayload()");
    expect(script).toContain("function buildInquiriesListPayload(pageNumber, limit = 10)");
    expect(script).toContain("function inspectDashboardSummary(payload)");
    expect(script).toContain("async function verifyDashboardUi(page, contractSummary, options = {})");
    expect(script).toContain('const { smokeMode = "mocked", getCurrentRecentInquiriesRequestCount = () => 0 } = options;');
    expect(script).toContain("const generatedDate = new Date();");
    expect(script).toContain("const baseTimestamp = generatedDate.getTime();");
    expect(script).toContain('title: "Recent leads / inquiries"');
    expect(script).toContain('title: "Deploy health"');
    expect(script).toContain("trend_series:");
    expect(script).toContain('bucket_date:');
    expect(script).toContain('name: `Smoke Inquiry ${index + 1}`');
    expect(script).toContain('warnings: ["Smoke warning check", "Translation policy sign-off still pending"]');
    expect(script).toContain("System health \\/ QA overview|Health widgets|ภาพรวมสุขภาพระบบ|วิดเจ็ตสุขภาพระบบ");
    expect(script).toContain("Activity metrics|Lead activity trend|แนวโน้มกิจกรรมของลีด|แนวโน้ม activity ของลีด");
    expect(script).toContain("Logs|Recent leads\\/inquiries|บันทึกเหตุการณ์|ลีด\\/อินไควรีล่าสุด");
    expect(script).toContain("getByPlaceholder(");
    expect(script).toContain('page.locator(".dashboard-table-pagination").getByRole("button", { name: /Next|ถัดไป/i }).click()');
    expect(script).toContain('getCurrentRecentInquiriesRequestCount() <= requestsBeforePagination');
    expect(script).toContain('"/api/admin/inquiries"');
    expect(script).toContain("contractSummary.firstWarning");
    expect(script).toContain('admin-smoke-summary.json');
  });
});
