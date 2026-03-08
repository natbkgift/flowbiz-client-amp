import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin dashboard recent inquiries table", () => {
  it("defines filter, sort, reset, and mobile card fallback behavior", () => {
    const component = read("components/admin/dashboard/DashboardRecentInquiriesTable.tsx");

    expect(component).toContain("const [query, setQuery] = useState(\"\")");
    expect(component).toContain("const deferredQuery = useDeferredValue(query)");
    expect(component).toContain("const [statusFilter, setStatusFilter] = useState(\"all\")");
    expect(component).toContain("const [sortKey, setSortKey] = useState<SortKey>(\"created_at\")");
    expect(component).toContain("const [sortDirection, setSortDirection] = useState<SortDirection>(\"desc\")");
    expect(component).toContain("dashboard-table-toolbar");
    expect(component).toContain('role="search" aria-label={ui.filter}');
    expect(component).toContain("dashboard-table-direction");
    expect(component).toContain("dashboard-table-reset");
    expect(component).toContain('type="search"');
    expect(component).toContain('className="sr-only"');
    expect(component).toContain('aria-sort={sortKey === "created_at"');
    expect(component).toContain("dashboard-table-wrap--desktop");
    expect(component).toContain("dashboard-table-card-list");
    expect(component).toContain("dashboard-section-state dashboard-section-state--empty");
  });
});
