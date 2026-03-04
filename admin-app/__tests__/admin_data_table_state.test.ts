import { describe, expect, it } from "vitest";

import {
  clampPage,
  filterRows,
  paginateRows,
  sortRows,
  togglePageSelection,
  toggleSelection,
} from "@/app/_lib/admin-data-table-state";

describe("admin data table state helpers", () => {
  const rows = [
    { id: "1", name: "Charlie", status: "queued" },
    { id: "2", name: "Alice", status: "done" },
    { id: "3", name: "Bob", status: "running" },
  ];

  it("filters rows by normalized query", () => {
    const filtered = filterRows(rows, (row) => `${row.name} ${row.status}`, " run ");
    expect(filtered).toEqual([{ id: "3", name: "Bob", status: "running" }]);
  });

  it("sorts rows ascending and descending", () => {
    const asc = sortRows(rows, (row) => row.name, "asc").map((row) => row.name);
    const desc = sortRows(rows, (row) => row.name, "desc").map((row) => row.name);

    expect(asc).toEqual(["Alice", "Bob", "Charlie"]);
    expect(desc).toEqual(["Charlie", "Bob", "Alice"]);
  });

  it("paginates and clamps page bounds", () => {
    expect(paginateRows(rows, 2, 2).map((row) => row.id)).toEqual(["3"]);
    expect(clampPage(0, rows.length, 2)).toBe(1);
    expect(clampPage(9, rows.length, 2)).toBe(2);
  });

  it("toggles row and page selections", () => {
    const withOne = toggleSelection(new Set<string>(), "1", true);
    const withPage = togglePageSelection(withOne, ["2", "3"], true);
    const clearedPage = togglePageSelection(withPage, ["2"], false);

    expect(Array.from(withPage).sort()).toEqual(["1", "2", "3"]);
    expect(Array.from(clearedPage).sort()).toEqual(["1", "3"]);
  });
});
