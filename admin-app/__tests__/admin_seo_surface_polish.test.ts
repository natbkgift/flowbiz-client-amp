import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin seo surface polish", () => {
  it("uses shared admin action, badge, and table primitives on the SEO page", () => {
    const page = read("app/admin/seo/page.tsx");

    expect(page).toContain("AdminBadge");
    expect(page).toContain("AdminTable");
    expect(page).toContain('<AdminButton variant="primary" type="submit"');
    expect(page).toContain("<AdminBadge tone=\"info\">{item.locale}</AdminBadge>");
    expect(page).toContain("<AdminTable caption=\"Broken links report\">");
    expect(page).not.toContain('className="btn"');
  });

  it("keeps SEO page-local item/report layout polish hooks in CSS", () => {
    const css = read("app/globals.css");

    expect(css).toContain(".seo-item-row {");
    expect(css).toContain("display: grid;");
    expect(css).toContain(".seo-item-head {");
    expect(css).toContain("flex-wrap: wrap;");
    expect(css).toContain(".seo-report-grid p {");
    expect(css).toContain("margin: 0;");
  });
});
