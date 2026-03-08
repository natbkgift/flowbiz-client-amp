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

    expect(script).toContain("function buildDashboardSmokePayload()");
    expect(script).toContain('title: "Recent leads / inquiries"');
    expect(script).toContain('title: "Deploy health"');
    expect(script).toContain('name: "Smoke Inquiry"');
    expect(script).toContain('warnings: ["Smoke warning check"]');
    expect(script).toContain('getByRole("heading", { name: /Health widgets|วิดเจ็ตสุขภาพระบบ/i })');
    expect(script).toContain('getByRole("heading", { name: /Lead activity trend|แนวโน้ม activity ของลีด/i })');
    expect(script).toContain('getByRole("heading", { name: /Deploy health/i })');
    expect(script).toContain("getByPlaceholder(");
    expect(script).toContain('getByText(/Smoke warning check/i)');
    expect(script).toContain('admin-smoke-summary.json');
  });
});
