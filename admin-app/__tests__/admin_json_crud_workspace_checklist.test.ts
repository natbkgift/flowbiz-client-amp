import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { checklistReport } from "@/components/admin/AdminJsonCrudWorkspace";

const workspaceSource = fs.readFileSync(
  path.resolve(__dirname, "../components/admin/AdminJsonCrudWorkspace.tsx"),
  "utf-8"
);

describe("AdminJsonCrudWorkspace checklist report", () => {
  const config = {
    requiredLocales: ["en"],
    warningLocales: ["th"],
    requiredLocalizedFields: [
      { path: "title", label: "Title" },
      { path: "body_md", label: "Body" },
    ],
  } as const;

  it("treats missing warning locale as warning and computes partial completeness", () => {
    const report = checklistReport(config, {
      title: { en: "English title" },
      body_md: { en: "English body" },
      status: "draft",
    });

    expect(report.blocking).toEqual([]);
    expect(report.warnings).toContain("Title (TH) is recommended.");
    expect(report.warnings).toContain("Body (TH) is recommended.");
    expect(report.completeness).toMatchObject({
      filled: 2,
      total: 4,
      percent: 50,
    });
    expect(report.completeness.locales.en).toEqual({ filled: 2, total: 2 });
    expect(report.completeness.locales.th).toEqual({ filled: 0, total: 2 });
  });

  it("reports full completeness for complete EN+TH content", () => {
    const report = checklistReport(config, {
      title: { en: "English title", th: "หัวข้อภาษาไทย" },
      body_md: { en: "English body", th: "เนื้อหาภาษาไทย" },
      status: "draft",
    });

    expect(report.blocking).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.completeness.percent).toBe(100);
  });

  it("uses roving tab focus and keyboard navigation for locale tabs", () => {
    expect(workspaceSource).toContain("tabIndex={createLocaleTab === locale ? 0 : -1}");
    expect(workspaceSource).toContain("tabIndex={patchLocaleTab === locale ? 0 : -1}");
    expect(workspaceSource).toContain("onLocaleTabKeyDown");
    expect(workspaceSource).toContain("nextLocaleTabFromKey");
  });
});
