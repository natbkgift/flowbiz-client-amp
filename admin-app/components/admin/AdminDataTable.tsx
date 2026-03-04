"use client";

import { type ReactNode, useEffect, useId, useMemo, useState } from "react";

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
  const hasColumns = columns.length > 0;
  const [filterQuery, setFilterQuery] = useState("");
  const [sortKey, setSortKey] = useState(() => columns[0]?.key || "");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const filterInputId = useId();

  useEffect(() => {
    if (!hasColumns) return;
    const isValidSortKey = columns.some((column) => column.key === sortKey);
    if (!isValidSortKey) {
      setSortKey(columns[0]?.key || "");
    }
  }, [columns, hasColumns, sortKey]);

  const filteredRows = useMemo(
    () => {
      if (!hasColumns) return [];
      return filterRows(rows, (row) => {
        const values = columns.map((column) => {
          const source = column.getFilterValue ? column.getFilterValue(row) : column.getSortValue?.(row);
          return normalizeTableValue(source);
        });
        return values.join(" ");
      }, filterQuery);
    },
    [columns, filterQuery, hasColumns, rows]
  );

  const sortedRows = useMemo(() => {
    if (!hasColumns) return filteredRows;
    const sortColumn = columns.find((column) => column.key === sortKey) || columns[0];
    if (!sortColumn) return filteredRows;
    return sortRows(
      filteredRows,
      (row) => normalizeTableValue(sortColumn.getSortValue ? sortColumn.getSortValue(row) : sortColumn.getFilterValue?.(row)),
      sortDirection
    );
  }, [columns, filteredRows, hasColumns, sortDirection, sortKey]);

  const effectivePage = clampPage(page, sortedRows.length, pageSize);

  useEffect(() => {
    if (page !== effectivePage) {
      setPage(effectivePage);
    }
  }, [effectivePage, page]);

  const paginatedRows = useMemo(
    () => paginateRows(sortedRows, effectivePage, pageSize),
    [effectivePage, pageSize, sortedRows]
  );

  const paginatedRowsWithIds = useMemo(
    () =>
      paginatedRows.map((row, index) => ({
        row,
        id: getRowId(row, (effectivePage - 1) * pageSize + index),
      })),
    [effectivePage, getRowId, pageSize, paginatedRows]
  );

  const pageIds = paginatedRowsWithIds.map(({ id }) => id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  if (!hasColumns) {
    return <div className="state-empty">{emptyLabel}</div>;
  }

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
        <label className="field" htmlFor={filterInputId}>
          <span>{filterLabel}</span>
          <input
            id={filterInputId}
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
              {paginatedRowsWithIds.map(({ row, id }) => {
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
              disabled={effectivePage >= totalPages}
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
