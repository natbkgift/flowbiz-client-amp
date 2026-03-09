import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B16 admin mobile nav discoverability", () => {
  it("keeps mobile admin nav links visible with wrapped labels and touch target sizing", () => {
    const css = read("styles/admin-components.css");

    const drawerActionGridRegex =
      /\.admin-shell-sidebar-footer,\s*\.admin-shell-mobile-drawer-actions\s*\{[^}]*display:\s*grid;[^}]*gap:\s*var\(--admin-space-2\);[^}]*\}[\s\S]*?\.admin-shell-mobile-drawer-actions\s*\{[^}]*grid-template-columns:\s*1fr;[^}]*\}/s;

    const mobileActionRegex =
      /\.admin-shell-mobile-action\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*44px;[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere;[^}]*word-break:\s*break-word;[^}]*\}/s;

    const mobileDrawerMediaRegex =
      /@media\s*\(max-width:\s*1024px\)\s*\{[\s\S]*\.admin-shell-mobile-drawer\s*\{[\s\S]*display:\s*grid;[\s\S]*\}[\s\S]*\}/s;

    expect(css).toMatch(drawerActionGridRegex);
    expect(css).toMatch(mobileActionRegex);
    expect(css).toMatch(mobileDrawerMediaRegex);
  });
});
