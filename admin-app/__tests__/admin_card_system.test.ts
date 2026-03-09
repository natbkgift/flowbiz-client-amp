import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin card system", () => {
  it("exports reusable SaaS card primitives for stats, metrics, actions, and logs", () => {
    const component = read("components/admin/cards/AdminCards.tsx");
    const compatibilityBarrel = read("components/admin/AdminPrimitives.tsx");

    expect(component).toContain("export function StatCard(");
    expect(component).toContain("export function MetricCard(");
    expect(component).toContain("export function ActionCard(");
    expect(component).toContain("export function LogCard(");
    expect(component).toContain("admin-card-shell");
    expect(component).toContain("admin-stat-card__footer");
    expect(component).toContain("admin-card-shell__header");
    expect(compatibilityBarrel).toContain('from "@/components/admin/cards/AdminCards"');
  });
});
