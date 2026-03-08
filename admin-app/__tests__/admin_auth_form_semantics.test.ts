import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

const AUTH_FORM_PAGES = [
  "app/login/page.tsx",
  "app/admin/dashboard/page.tsx",
  "app/admin/domain/page.tsx",
  "app/admin/home-composer/page.tsx",
  "app/admin/imports/page.tsx",
  "app/admin/inquiries/page.tsx",
  "app/admin/layout/page.tsx",
  "app/admin/media/page.tsx",
  "app/admin/seo/page.tsx",
];

describe("admin auth form semantics", () => {
  it("keeps login fields inside semantic forms with submit behavior", () => {
    for (const file of AUTH_FORM_PAGES) {
      const page = read(file);
      expect(page).toContain("<form");
      expect(page).toContain("onSubmit");
      expect(page).toContain("type=\"submit\"");
    }
  });

  it("uses proper login field attributes for password managers and a11y", () => {
    for (const file of AUTH_FORM_PAGES) {
      const page = read(file);
      expect(page).toContain("name=\"email\"");
      expect(page).toContain("name=\"password\"");
      expect(page).toContain("type=\"email\"");
      expect(page).toContain("type=\"password\"");
      expect(page).toContain("autoComplete=\"username\"");
      expect(page).toContain("autoComplete=\"current-password\"");
      expect(page).toContain("required");
      expect(page).toContain("htmlFor=");
    }
  });
});
