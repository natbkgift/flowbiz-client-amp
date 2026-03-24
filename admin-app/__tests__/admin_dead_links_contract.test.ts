import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const scanRoots = [
  path.join(root, "app", "admin"),
  path.join(root, "app", "_lib"),
  path.join(root, "components", "admin"),
];

function collectFiles(directory: string, output: string[] = []): string[] {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectFiles(absolutePath, output);
      continue;
    }
    if (absolutePath.endsWith(".ts") || absolutePath.endsWith(".tsx") || absolutePath.endsWith(".mjs")) {
      output.push(absolutePath);
    }
  }
  return output;
}

function routeExists(route: string): boolean {
  const cleanRoute = route.split("?")[0];
  if (cleanRoute === "/admin") {
    return fs.existsSync(path.join(root, "app", "admin", "page.tsx"));
  }
  const segments = cleanRoute.replace(/^\/admin\//, "").split("/").filter(Boolean);
  if (segments.length === 0) return false;
  return fs.existsSync(path.join(root, "app", "admin", ...segments, "page.tsx"));
}

describe("admin dead-link contract", () => {
  it("keeps shipped admin links on real routes and excludes /admin/roles", () => {
    const hrefPattern = /href\s*:\s*["'`](\/admin(?:\/[a-z0-9-]+)*)["'`]/gi;
    const routes = new Set<string>();
    let containsDeadRolesReference = false;

    for (const scanRoot of scanRoots) {
      for (const filePath of collectFiles(scanRoot)) {
        const source = fs.readFileSync(filePath, "utf-8");
        if (source.includes("/admin/roles")) {
          containsDeadRolesReference = true;
        }
        for (const match of source.matchAll(hrefPattern)) {
          const route = match[1];
          if (route.startsWith("/admin")) {
            routes.add(route);
          }
        }
      }
    }

    expect(containsDeadRolesReference).toBe(false);
    const missingRoutes = [...routes].filter((route) => !routeExists(route));
    expect(missingRoutes).toEqual([]);
  });
});
