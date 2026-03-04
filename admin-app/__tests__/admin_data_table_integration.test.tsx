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

    const sortByName = screen.getByRole("button", { name: "Sort by Name" });
    fireEvent.click(sortByName);
    fireEvent.keyDown(sortByName, { key: "Enter" });

    fireEvent.change(screen.getByLabelText("Filter table rows"), { target: { value: "run" } });
    expect(screen.getByText("running")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filter table rows"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Page 2")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Select all rows on page"));
    expect(screen.getByText("Selected: 1")).toBeInTheDocument();
    expect(screen.getByLabelText(/Select row /)).toBeInTheDocument();
  });

  it("is used in shared CRUD workspace so it applies across multiple admin workspaces", () => {
    const workspace = read("components/admin/AdminJsonCrudWorkspace.tsx");
    const propertiesPage = read("app/admin/properties/page.tsx");
    const projectsPage = read("app/admin/projects/page.tsx");
    const developersPage = read("app/admin/developers/page.tsx");

    expect(workspace).toContain("AdminDataTable");
    expect(propertiesPage).toContain("AdminJsonCrudWorkspace");
    expect(projectsPage).toContain("AdminJsonCrudWorkspace");
    expect(developersPage).toContain("AdminJsonCrudWorkspace");
  });
});
