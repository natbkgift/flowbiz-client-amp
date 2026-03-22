"use client";

import { type ReactNode, useId } from "react";

import {
  AdminTable,
  AdminTablePagination,
  AdminTableToolbar,
} from "@/components/admin/data-display/AdminTable";
import { useAdminDataTableState } from "@/components/admin/data-display/useAdminDataTableState";
import { AdminButton } from "@/components/admin/forms/AdminButton";
import { AdminInput } from "@/components/admin/forms/AdminInput";

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
  const filterInputId = useId();
  const tableId = useId();
  const {
    hasColumns,
    filterQuery,
    selectedIds,
    effectivePage,
    totalPages,
    sortedRows,
    paginatedRowsWithIds,
    allOnPageSelected,
    setFilterQuery,
    toggleSort,
    toggleRowSelection,
    toggleCurrentPageSelection,
    goToPreviousPage,
    goToNextPage,
  } = useAdminDataTableState({
    rows,
    columns,
    getRowId,
    pageSize,
    onBulkSelectionChange,
  });

  if (!hasColumns) {
    return <div className="state-empty">{emptyLabel}</div>;
  }

  const filteredCount = sortedRows.length;
  const hasActiveFilter = filterQuery.trim().length > 0;
  const tableSummary = hasActiveFilter
    ? `Showing ${filteredCount} of ${rows.length} loaded rows`
    : `Showing all ${rows.length} loaded rows`;

  return (
    <AdminTable
      toolbar={
        <AdminTableToolbar className="card-actions admin-data-table-toolbar">
          <AdminInput
            htmlFor={filterInputId}
            label={filterLabel}
            icon="search"
            hint={tableSummary}
          >
            <input
              id={filterInputId}
              aria-label={filterLabel}
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
            />
          </AdminInput>
          {filterQuery ? (
            <AdminButton variant="secondary" size="sm" onClick={() => setFilterQuery("")}>
              Clear filter
            </AdminButton>
          ) : null}
          <div className="admin-data-table-toolbar__summary" role="status" aria-live="polite">
            <span className="admin-data-table-pill">{tableSummary}</span>
            <span className="admin-data-table-pill">Selected: {selectedIds.size}</span>
          </div>
        </AdminTableToolbar>
      }
    >
      {sortedRows.length === 0 ? (
        <div className="admin-data-table-empty-state">
          <div className="state-empty">
            {hasActiveFilter ? `No loaded rows match \"${filterQuery}\".` : emptyLabel}
          </div>
          {hasActiveFilter ? (
            <AdminButton variant="secondary" size="sm" onClick={() => setFilterQuery("")}>
              Clear filter
            </AdminButton>
          ) : null}
        </div>
      ) : (
        <>
          <table id={tableId} className="dashboard-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all rows on page"
                    checked={allOnPageSelected}
                    onChange={(event) => toggleCurrentPageSelection(event.target.checked)}
                  />
                </th>
                {columns.map((column) => (
                  <th key={column.key}>
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleSort(column.key)}
                      aria-label={`Sort by ${column.label}`}
                    >
                      {column.label}
                    </AdminButton>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRowsWithIds.map(({ row, id }) => (
                <tr key={id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select row ${id}`}
                      checked={selectedIds.has(id)}
                      onChange={(event) => toggleRowSelection(id, event.target.checked)}
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={`${id}-${column.key}`}>{column.renderCell(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <AdminTablePagination
            className="card-actions"
            currentPage={effectivePage}
            totalPages={totalPages}
            previousLabel="Previous"
            nextLabel="Next"
            label="Page"
            onPrevious={goToPreviousPage}
            onNext={goToNextPage}
            previousDisabled={effectivePage <= 1}
            nextDisabled={effectivePage >= totalPages}
            summary={`Page ${effectivePage} of ${totalPages}`}
            controlsId={tableId}
          />
        </>
      )}
    </AdminTable>
  );
}
