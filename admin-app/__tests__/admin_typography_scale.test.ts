import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

function readAdminStyles(): string {
  return [
    read("styles/admin-tokens.css"),
    read("styles/admin-base.css"),
    read("styles/admin-components.css"),
  ].join("\n");
}

describe("admin typography scale", () => {
  it("defines scoped admin typography tokens in admin shell content", () => {
    const css = readAdminStyles();

    expect(css).toContain(".admin-shell-content {");
    expect(css).toContain("--admin-font-size-2xl:");
    expect(css).toContain("--admin-font-size-xl:");
    expect(css).toContain("--admin-font-size-lg:");
    expect(css).toContain("--admin-font-size-md:");
    expect(css).toContain("--admin-font-size-sm:");
    expect(css).toContain("--admin-font-size-xs:");
    expect(css).toContain(".content-stack {");
  });

  it("applies heading/label/body hierarchy under admin shell scope", () => {
    const css = readAdminStyles();

    expect(css).toContain(".admin-root h1 {");
    expect(css).toContain("font-size: var(--admin-font-size-2xl);");
    expect(css).toContain(".admin-root h2 {");
    expect(css).toContain("font-size: var(--admin-font-size-xl);");
    expect(css).toContain(".admin-root h3 {");
    expect(css).toContain("font-size: var(--admin-font-size-lg);");
    expect(css).toContain(".admin-root .field > span:first-child,");
    expect(css).toContain("font-size: var(--admin-font-size-sm);");
    expect(css).toContain(".admin-root p,");
    expect(css).toContain("font-size: var(--admin-font-size-md);");
  });
});
