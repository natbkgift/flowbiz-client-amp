import { type ReactNode, useMemo, useState } from "react";

import {
  clampPage,
  filterRows,
  normalizeTableValue,
  paginateRows,
  sortRows,
  togglePageSelection,
  toggleSelection,
  type SortDirection,
} from "@/app/_lib/admin-data-table-state";

export type AdminDataTableColumn<T> = {
  key: string;
  label: string;
  renderCell: (row: T) => ReactNode;
  getSortValue?: (row: T) => unknown;
  getFilterValue?: (row: T) => unknown;
};

type AdminDataTableProps<T> = {
  rows: T[];
  columns: AdminDataTableColumn<T>[];
  getRowId: (row: T, index: number) => string;
  emptyLabel: string;
  pageSize?: number;
  filterLabel?: string;
  onBulkSelectionChange?: (ids: string[]) => void;
};

export function AdminDataTable<T>({
  rows,
  columns,
  getRowId,
  emptyLabel,
  pageSize = 10,
  filterLabel = "Filter table rows",
  onBulkSelectionChange,
}: AdminDataTableProps<T>) {
  const [filterQuery, setFilterQuery] = useState("");
  const [sortKey, setSortKey] = useState(columns[0]?.key || "");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (columns.length === 0) {
    return <div className="state-empty">{emptyLabel}</div>;
  }

  const filteredRows = useMemo(
    () =>
      filterRows(rows, (row) => {
        const values = columns.map((column) => {
          const source = column.getFilterValue ? column.getFilterValue(row) : column.getSortValue?.(row);
          return normalizeTableValue(source);
        });
        return values.join(" ");
      }, filterQuery),
    [columns, filterQuery, rows]
  );

  const sortedRows = useMemo(() => {
    const sortColumn = columns.find((column) => column.key === sortKey) || columns[0];
    if (!sortColumn) return filteredRows;
    return sortRows(
      filteredRows,
      (row) => normalizeTableValue(sortColumn.getSortValue ? sortColumn.getSortValue(row) : sortColumn.getFilterValue?.(row)),
      sortDirection
    );
  }, [columns, filteredRows, sortDirection, sortKey]);

  const effectivePage = clampPage(page, sortedRows.length, pageSize);
  const paginatedRows = useMemo(
    () => paginateRows(sortedRows, effectivePage, pageSize),
    [effectivePage, pageSize, sortedRows]
  );

  const pageIds = paginatedRows.map((row) => getRowId(row));
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  function updateSelected(next: Set<string>) {
    setSelectedIds(next);
    onBulkSelectionChange?.(Array.from(next));
  }

  function toggleSort(nextKey: string) {
    setPage(1);
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  return (
    <div className="dashboard-table-wrap">
      <div className="card-actions">
        <label className="field" htmlFor="admin-data-table-filter">
          <span>{filterLabel}</span>
          <input
            id="admin-data-table-filter"
            aria-label={filterLabel}
            value={filterQuery}
            onChange={(event) => {
              setFilterQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <p className="locale-safe" aria-live="polite">
          Selected: {selectedIds.size}
        </p>
      </div>

      {sortedRows.length === 0 ? (
        <div className="state-empty">{emptyLabel}</div>
      ) : (
        <>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all rows on page"
                    checked={allOnPageSelected}
                    onChange={(event) => updateSelected(togglePageSelection(selectedIds, pageIds, event.target.checked))}
                  />
                </th>
                {columns.map((column) => (
                  <th key={column.key}>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      aria-label={`Sort by ${column.label}`}
                    >
                      {column.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const id = getRowId(row);
                return (
                  <tr key={id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select row ${id}`}
                        checked={selectedIds.has(id)}
                        onChange={(event) => updateSelected(toggleSelection(selectedIds, id, event.target.checked))}
                      />
                    </td>
                    {columns.map((column) => (
                      <td key={`${id}-${column.key}`}>{column.renderCell(row)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="card-actions">
            <button
              className="btn btn-secondary"
              type="button"
              disabled={effectivePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <span aria-live="polite">Page {effectivePage}</span>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={effectivePage >= Math.ceil(sortedRows.length / pageSize)}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
