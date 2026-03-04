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

    expect(css).toContain(".admin-shell-mobile-row {");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(css).toContain("white-space: normal;");
    expect(css).toContain("min-height: var(--tap-target-min);");
    expect(css).toContain("@media (min-width: 640px) and (max-width: 1024px)");
  });
});
