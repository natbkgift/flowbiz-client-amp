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
    expect(script).toContain('ADMIN_SMOKE_EMAIL');
    expect(script).toContain('ADMIN_SMOKE_PASSWORD');
    expect(script).toContain('smokeMode: SMOKE_MODE');
    expect(script).toContain('healthSummaryStatuses');
    expect(script).toContain('recentInquiriesStatuses');
    expect(script).toContain('healthSummaryContract');
    expect(script).toContain('mockedRoutes:');
    expect(script).toContain("function buildDashboardSmokePayload()");
    expect(script).toContain("function buildInquiriesListPayload(pageNumber, limit = 10)");
    expect(script).toContain("function inspectDashboardSummary(payload)");
    expect(script).toContain("async function verifyDashboardUi(page, contractSummary)");
    expect(script).toContain('getByRole("heading", { name: /Recent leads\\/inquiries|ลีด\\/อินไควรีล่าสุด/i }).first().waitFor');
    expect(script).toContain("const generatedDate = new Date();");
    expect(script).toContain("const baseTimestamp = generatedDate.getTime();");
    expect(script).toContain('title: "Recent leads / inquiries"');
    expect(script).toContain('title: "Deploy health"');
    expect(script).toContain("trend_series:");
    expect(script).toContain('bucket_date:');
    expect(script).toContain('name: `Smoke Inquiry ${index + 1}`');
    expect(script).toContain('warnings: ["Smoke warning check"]');
    expect(script).toContain('getByRole("heading", { name: /Health widgets|วิดเจ็ตสุขภาพระบบ/i })');
    expect(script).toContain('getByRole("heading", { name: /Lead activity trend|แนวโน้ม activity ของลีด/i })');
    expect(script).toContain("getByPlaceholder(");
    expect(script).toContain('page.getByRole("button", { name: /Next|ถัดไป/i }).click()');
    expect(script).toContain('"/api/admin/inquiries"');
    expect(script).toContain("contractSummary.firstWarning");
    expect(script).toContain('admin-smoke-summary.json');
  });
});
