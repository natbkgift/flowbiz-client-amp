import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin dashboard section primitives", () => {
  it("uses heading and subtitle ids for accessible section labelling", () => {
    const component = read("components/admin/dashboard/DashboardSectionPrimitives.tsx");

    expect(component).toContain("const headingId = useId()");
    expect(component).toContain("const subtitleId = useId()");
    expect(component).toContain("aria-labelledby={headingId}");
    expect(component).toContain("aria-describedby={subtitle ? subtitleId : undefined}");
    expect(component).toContain("<h2 id={headingId}>{title}</h2>");
  });
});
