import { useEffect, useMemo, useState } from "react";

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

export function useAdminDataTableState<T>({
  rows,
  columns,
  getRowId,
  pageSize,
  onBulkSelectionChange,
}: {
  rows: T[];
  columns: Array<{
    key: string;
    getSortValue?: (row: T) => unknown;
    getFilterValue?: (row: T) => unknown;
  }>;
  getRowId: (row: T, index: number) => string;
  pageSize: number;
  onBulkSelectionChange?: (ids: string[]) => void;
}) {
  const hasColumns = columns.length > 0;
  const [filterQuery, setFilterQuery] = useState("");
  const [sortKey, setSortKey] = useState(() => columns[0]?.key || "");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!hasColumns) return;
    const isValidSortKey = columns.some((column) => column.key === sortKey);
    if (!isValidSortKey) {
      setSortKey(columns[0]?.key || "");
    }
  }, [columns, hasColumns, sortKey]);

  const filteredRows = useMemo(() => {
    if (!hasColumns) return [];
    return filterRows(
      rows,
      (row) => {
        const values = columns.map((column) => {
          const source = column.getFilterValue ? column.getFilterValue(row) : column.getSortValue?.(row);
          return normalizeTableValue(source);
        });
        return values.join(" ");
      },
      filterQuery,
    );
  }, [columns, filterQuery, hasColumns, rows]);

  const sortedRows = useMemo(() => {
    if (!hasColumns) return filteredRows;
    const sortColumn = columns.find((column) => column.key === sortKey) || columns[0];
    if (!sortColumn) return filteredRows;
    return sortRows(
      filteredRows,
      (row) =>
        normalizeTableValue(
          sortColumn.getSortValue ? sortColumn.getSortValue(row) : sortColumn.getFilterValue?.(row),
        ),
      sortDirection,
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
    [effectivePage, pageSize, sortedRows],
  );

  const paginatedRowsWithIds = useMemo(
    () =>
      paginatedRows.map((row, index) => ({
        row,
        id: getRowId(row, (effectivePage - 1) * pageSize + index),
      })),
    [effectivePage, getRowId, pageSize, paginatedRows],
  );

  const pageIds = paginatedRowsWithIds.map(({ id }) => id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  function updateSelected(next: Set<string>) {
    setSelectedIds(next);
    onBulkSelectionChange?.(Array.from(next));
  }

  function updateFilterQuery(next: string) {
    setFilterQuery(next);
    setPage(1);
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

  function toggleRowSelection(id: string, checked: boolean) {
    updateSelected(toggleSelection(selectedIds, id, checked));
  }

  function toggleCurrentPageSelection(checked: boolean) {
    updateSelected(togglePageSelection(selectedIds, pageIds, checked));
  }

  function goToPreviousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    setPage((current) => Math.min(totalPages, current + 1));
  }

  return {
    hasColumns,
    filterQuery,
    sortKey,
    sortDirection,
    effectivePage,
    selectedIds,
    sortedRows,
    paginatedRowsWithIds,
    allOnPageSelected,
    totalPages,
    setFilterQuery: updateFilterQuery,
    toggleSort,
    toggleRowSelection,
    toggleCurrentPageSelection,
    goToPreviousPage,
    goToNextPage,
  };
}
