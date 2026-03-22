import fs from "node:fs";
import path from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminDataTable, type AdminDataTableColumn } from "@/components/admin/AdminDataTable";

const root = path.resolve(__dirname, "..");

type Row = {
  id: string;
  name: string;
  status: string;
};

const rows: Row[] = [
  { id: "1", name: "Charlie", status: "queued" },
  { id: "2", name: "Alice", status: "done" },
  { id: "3", name: "Bob", status: "running" },
];

const columns: AdminDataTableColumn<Row>[] = [
  {
    key: "name",
    label: "Name",
    renderCell: (row) => row.name,
    getSortValue: (row) => row.name,
    getFilterValue: (row) => row.name,
  },
  {
    key: "status",
    label: "Status",
    renderCell: (row) => row.status,
    getSortValue: (row) => row.status,
    getFilterValue: (row) => row.status,
  },
];

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("AdminDataTable integration", () => {
  it("supports sort/filter/pagination/bulk select with accessible labels", () => {
    render(<AdminDataTable rows={rows} columns={columns} getRowId={(row) => row.id} emptyLabel="No rows" pageSize={2} />);

    expect(screen.getAllByText("Showing all 3 loaded rows")).toHaveLength(2);
    expect(screen.getByText("Selected: 0")).toBeInTheDocument();

    const sortByName = screen.getByRole("button", { name: "Sort by Name" });
    fireEvent.click(sortByName);
    fireEvent.keyDown(sortByName, { key: "Enter" });

    fireEvent.change(screen.getByLabelText("Filter table rows"), { target: { value: "run" } });
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getAllByText("Showing 1 of 3 loaded rows")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Clear filter" }).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Filter table rows"), { target: { value: "zzz" } });
    expect(screen.getByText('No loaded rows match "zzz".')).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Clear filter" })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: "Clear filter" })[0]);
    expect(screen.getAllByText("Showing all 3 loaded rows")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Filter table rows"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Currently viewing page 2 of 2 total pages")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Select all rows on page"));
    expect(screen.getByText("Selected: 1")).toBeInTheDocument();
    expect(screen.getByLabelText(/Select row /)).toBeInTheDocument();
  });

  it("is used in shared CRUD workspace so it applies across multiple admin workspaces", () => {
    const workspace = read("components/admin/AdminJsonCrudWorkspace.tsx");
    const recordsPanel = read("components/admin/domain/crud-workspace/AdminCrudWorkspacePanels.tsx");
    const copy = read("components/admin/domain/crud-workspace/crud-workspace-copy.ts");
    const propertiesPage = read("app/admin/properties/page.tsx");
    const projectsPage = read("app/admin/projects/page.tsx");
    const developersPage = read("app/admin/developers/page.tsx");

    expect(workspace).toContain("AdminDataTable");
    expect(workspace).toContain('className={`btn ${isActiveRecord ? "btn" : "btn-secondary"}`}');
    expect(workspace).toContain('aria-pressed={isActiveRecord}');
    expect(workspace).toContain('className="admin-data-table-row-action"');
    expect(recordsPanel).toContain("<AdminDataTable");
    expect(propertiesPage).toContain("AdminJsonCrudWorkspace");
    expect(projectsPage).toContain("AdminJsonCrudWorkspace");
    expect(developersPage).toContain("AdminJsonCrudWorkspace");
    expect(copy).toContain('useRecordHint: "Load this row into the action panels"');
    expect(copy).toContain('activeRecord: "Active record"');
  });
});
