import { useDeferredValue, useId, useMemo, useState } from "react";

import type { AdminLocale } from "@/app/_lib/admin-i18n";

type RecentInquiry = {
  id: string;
  created_at: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  intent: string | null;
  source_page: string | null;
};

type SortKey = "created_at" | "status" | "name";
type SortDirection = "asc" | "desc";

const copy = {
  en: {
    filter: "Filter inquiries",
    searchPlaceholder: "Search name, contact, status, intent, or source",
    status: "Status",
    statusAll: "All statuses",
    sortBy: "Sort by",
    sortCreated: "Created at",
    sortStatus: "Status",
    sortName: "Name",
    sortDirection: "Direction",
    asc: "ASC",
    desc: "DESC",
    reset: "Reset",
    results: "rows",
    noMatchesTitle: "No matching inquiries",
    noMatchesBody: "Adjust the search, status filter, or sort settings.",
    tableCaption: "Recent inquiries table with filters, sorting, and contact details.",
    sourcePage: "Source page",
    contact: "Contact",
    intent: "Intent",
    createdAt: "Created at",
    name: "Name",
  },
  th: {
    filter: "กรอง inquiry",
    searchPlaceholder: "ค้นหาชื่อ ช่องทางติดต่อ สถานะ เป้าหมาย หรือหน้าต้นทาง",
    status: "สถานะ",
    statusAll: "ทุกสถานะ",
    sortBy: "เรียงตาม",
    sortCreated: "เวลาสร้าง",
    sortStatus: "สถานะ",
    sortName: "ชื่อ",
    sortDirection: "ทิศทาง",
    asc: "ASC",
    desc: "DESC",
    reset: "รีเซ็ต",
    results: "แถว",
    noMatchesTitle: "ไม่พบ inquiry ที่ตรงเงื่อนไข",
    noMatchesBody: "ลองปรับคำค้นหา ตัวกรองสถานะ หรือรูปแบบการเรียง",
    tableCaption: "ตารางอินไควรีล่าสุดพร้อมตัวกรอง การเรียง และรายละเอียดการติดต่อ",
    sourcePage: "หน้าต้นทาง",
    contact: "ช่องทางติดต่อ",
    intent: "เป้าหมาย",
    createdAt: "เวลาสร้าง",
    name: "ชื่อ",
  },
} as const;

function prettyDate(value: string | null, locale: AdminLocale): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeText(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function DashboardRecentInquiriesTable({
  rows,
  locale,
}: {
  rows: RecentInquiry[];
  locale: AdminLocale;
}) {
  const ui = copy[locale];
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const filterId = useId();
  const statusId = useId();
  const sortId = useId();
  const tableId = useId();
  const summaryId = useId();

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((row) => String(row.status || "").trim()).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeText(deferredQuery);
    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === "all" || normalizeText(row.status) === normalizeText(statusFilter);
      if (!matchesStatus) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        row.name,
        row.email,
        row.phone,
        row.status,
        row.intent,
        row.source_page,
      ]
        .map((value) => normalizeText(value))
        .join(" ");
      return haystack.includes(normalizedQuery);
    });
  }, [deferredQuery, rows, statusFilter]);

  const sortedRows = useMemo(() => {
    const ordered = [...filteredRows];
    ordered.sort((left, right) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "created_at") {
        const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
        return (leftTime - rightTime) * direction;
      }
      const leftValue = normalizeText(sortKey === "status" ? left.status : left.name);
      const rightValue = normalizeText(sortKey === "status" ? right.status : right.name);
      return leftValue.localeCompare(rightValue) * direction;
    });
    return ordered;
  }, [filteredRows, sortDirection, sortKey]);

  function resetControls() {
    setQuery("");
    setStatusFilter("all");
    setSortKey("created_at");
    setSortDirection("desc");
  }

  return (
    <div className="dashboard-table-shell">
      <div className="dashboard-table-toolbar" role="search" aria-label={ui.filter}>
        <label className="field dashboard-table-toolbar-field" htmlFor={filterId}>
          <span>{ui.filter}</span>
          <input
            id={filterId}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ui.searchPlaceholder}
          />
        </label>

        <label className="field dashboard-table-toolbar-field" htmlFor={statusId}>
          <span>{ui.status}</span>
          <select id={statusId} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">{ui.statusAll}</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field dashboard-table-toolbar-field" htmlFor={sortId}>
          <span>{ui.sortBy}</span>
          <select id={sortId} value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="created_at">{ui.sortCreated}</option>
            <option value="status">{ui.sortStatus}</option>
            <option value="name">{ui.sortName}</option>
          </select>
        </label>

        <button
          type="button"
          className="btn btn-secondary dashboard-table-direction"
          onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
        >
          {ui.sortDirection}: {sortDirection === "asc" ? ui.asc : ui.desc}
        </button>

        <button type="button" className="btn btn-secondary dashboard-table-reset" onClick={resetControls}>
          {ui.reset}
        </button>
      </div>

      <p id={summaryId} className="dashboard-table-summary" aria-live="polite">
        {sortedRows.length} / {rows.length} {ui.results}
      </p>

      {sortedRows.length === 0 ? (
        <div className="dashboard-section-state dashboard-section-state--empty" role="status" aria-live="polite">
          <h3>{ui.noMatchesTitle}</h3>
          <p>{ui.noMatchesBody}</p>
        </div>
      ) : (
        <>
          <div className="dashboard-table-wrap dashboard-table-wrap--desktop">
            <table id={tableId} className="dashboard-table" aria-describedby={summaryId}>
              <caption className="sr-only">{ui.tableCaption}</caption>
              <thead>
                <tr>
                  <th scope="col" aria-sort={sortKey === "created_at" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>{ui.createdAt}</th>
                  <th scope="col" aria-sort={sortKey === "name" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>{ui.name}</th>
                  <th scope="col">{ui.contact}</th>
                  <th scope="col" aria-sort={sortKey === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>{ui.status}</th>
                  <th scope="col">{ui.intent}</th>
                  <th scope="col">{ui.sourcePage}</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{prettyDate(row.created_at, locale)}</td>
                    <td>{row.name}</td>
                    <td>{row.email || row.phone || "-"}</td>
                    <td>
                      <span className="dashboard-table-chip">{row.status || "-"}</span>
                    </td>
                    <td>{row.intent || "-"}</td>
                    <td>{row.source_page || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dashboard-table-card-list">
            {sortedRows.map((row) => (
              <article key={row.id} className="dashboard-table-card">
                <div className="dashboard-table-card-head">
                  <div>
                    <h3 className="dashboard-table-card-name">{row.name}</h3>
                    <p>{prettyDate(row.created_at, locale)}</p>
                  </div>
                  <span className="dashboard-table-chip">{row.status || "-"}</span>
                </div>

                <div className="dashboard-table-card-meta">
                  <div>
                    <span>{ui.contact}</span>
                    <strong>{row.email || row.phone || "-"}</strong>
                  </div>
                  <div>
                    <span>{ui.intent}</span>
                    <strong>{row.intent || "-"}</strong>
                  </div>
                  <div>
                    <span>{ui.sourcePage}</span>
                    <strong>{row.source_page || "-"}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
