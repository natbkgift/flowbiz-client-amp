import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B16 admin mobile nav discoverability", () => {
  it("keeps mobile admin nav links visible with wrapped labels and touch target sizing", () => {
    const css = read("app/globals.css");

    const baseMobileRowRegex =
      /\.admin-shell-mobile-row\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);\s*[^}]*white-space:\s*normal;[^}]*min-height:\s*var\(--tap-target-min\);[^}]*\}/s;

    const mediaQueryMobileRowRegex =
      /@media\s*\(min-width:\s*640px\)\s*and\s*\(max-width:\s*1024px\)\s*\{[^}]*\.admin-shell-mobile-row\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*\}[^}]*\}/s;

    expect(css).toMatch(baseMobileRowRegex);
    expect(css).toMatch(mediaQueryMobileRowRegex);
  });
});
