import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin typography scale", () => {
  it("defines scoped admin typography tokens in admin shell content", () => {
    const css = read("app/globals.css");

    expect(css).toContain(".admin-shell-content {");
    expect(css).toContain("--admin-type-h1:");
    expect(css).toContain("--admin-type-h2:");
    expect(css).toContain("--admin-type-h3:");
    expect(css).toContain("--admin-type-body:");
    expect(css).toContain("--admin-type-label:");
    expect(css).toContain("--admin-type-helper:");
    expect(css).toContain("--admin-stack-gap:");
  });

  it("applies heading/label/body hierarchy under admin shell scope", () => {
    const css = read("app/globals.css");

    expect(css).toContain(".admin-shell-content h1");
    expect(css).toContain("font-size: var(--admin-type-h1);");
    expect(css).toContain(".admin-shell-content h2");
    expect(css).toContain("font-size: var(--admin-type-h2);");
    expect(css).toContain(".admin-shell-content h3");
    expect(css).toContain("font-size: var(--admin-type-h3);");
    expect(css).toContain(".admin-shell-content .field > span");
    expect(css).toContain("font-size: var(--admin-type-label);");
    expect(css).toContain(".admin-shell-content p,");
    expect(css).toContain("font-size: var(--admin-type-body);");
  });
});
