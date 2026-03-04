export type SortDirection = "asc" | "desc";

export function normalizeTableValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export function filterRows<T>(rows: T[], getFilterValue: (row: T) => string, query: string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) => getFilterValue(row).toLowerCase().includes(normalized));
}

export function sortRows<T>(rows: T[], getSortValue: (row: T) => string, direction: SortDirection): T[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const a = getSortValue(left);
    const b = getSortValue(right);
    if (a === b) return 0;
    return a > b ? factor : -factor;
  });
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = Math.max(0, (page - 1) * pageSize);
  return rows.slice(start, start + pageSize);
}

export function clampPage(page: number, totalRows: number, pageSize: number): number {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  return Math.min(Math.max(page, 1), totalPages);
}

export function toggleSelection(current: Set<string>, id: string, checked: boolean): Set<string> {
  const next = new Set(current);
  if (checked) next.add(id);
  else next.delete(id);
  return next;
}

export function togglePageSelection(current: Set<string>, ids: string[], checked: boolean): Set<string> {
  const next = new Set(current);
  for (const id of ids) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  return next;
}
