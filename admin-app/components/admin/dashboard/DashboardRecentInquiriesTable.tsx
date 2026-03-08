import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";

import { fetchJson } from "@/app/_lib/admin-auth";
import type { AdminLocale } from "@/app/_lib/admin-i18n";
import {
  AdminTable,
  AdminTablePagination,
  AdminTableToolbar,
} from "@/components/admin/data-display/AdminTable";
import { AdminBadge } from "@/components/admin/feedback/AdminBadge";
import { adminButtonClassName } from "@/components/admin/forms/AdminButton";

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

type PaginatedInquiriesResponse = {
  data: RecentInquiry[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

const DEFAULT_PAGE_SIZE = 10;
const ALL_STATUS_FILTER_VALUE = "all";
const KNOWN_STATUS_OPTIONS = ["new", "contacted", "qualified", "closed", "lost"] as const;

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
    loading: "Loading inquiries…",
    updateError: "Unable to update inquiries right now.",
    page: "Page",
    previous: "Previous",
    next: "Next",
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
    loading: "กำลังโหลด inquiry…",
    updateError: "ไม่สามารถอัปเดต inquiry ได้ในขณะนี้",
    page: "หน้า",
    previous: "ก่อนหน้า",
    next: "ถัดไป",
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

function buildInquiriesPath(params: {
  page: number;
  query: string;
  statusFilter: string;
  sortKey: SortKey;
  sortDirection: SortDirection;
}): string {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(DEFAULT_PAGE_SIZE),
    sort: params.sortKey,
    order: params.sortDirection,
  });
  const trimmedQuery = params.query.trim();
  if (trimmedQuery) {
    searchParams.set("q", trimmedQuery);
  }
  if (normalizeText(params.statusFilter) && params.statusFilter !== ALL_STATUS_FILTER_VALUE) {
    searchParams.set("status", params.statusFilter);
  }
  return `/api/admin/inquiries?${searchParams.toString()}`;
}

function formatSummaryLabel(params: {
  page: number;
  totalPages: number;
  showingStart: number;
  showingEnd: number;
  totalRows: number;
  resultsLabel: string;
  pageLabel: string;
}): string {
  return `${params.showingStart}-${params.showingEnd} / ${params.totalRows} ${params.resultsLabel} · ${params.pageLabel} ${params.page}/${params.totalPages}`;
}

export function DashboardRecentInquiriesTable({
  rows,
  totalCount,
  locale,
  authToken,
}: {
  rows: RecentInquiry[];
  totalCount: number;
  locale: AdminLocale;
  authToken: string;
}) {
  const ui = copy[locale];
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS_FILTER_VALUE);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [serverRows, setServerRows] = useState(rows);
  const [serverTotalCount, setServerTotalCount] = useState(totalCount);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const filterId = useId();
  const statusId = useId();
  const sortId = useId();
  const tableId = useId();
  const summaryId = useId();

  const usingDefaultSnapshot =
    page === 1 &&
    normalizeText(deferredQuery).length === 0 &&
    statusFilter === ALL_STATUS_FILTER_VALUE &&
    sortKey === "created_at" &&
    sortDirection === "desc";

  useEffect(() => {
    if (usingDefaultSnapshot) {
      setServerRows(rows);
      setServerTotalCount(totalCount);
      setRequestLoading(false);
      setRequestError(null);
      return;
    }

    const activeToken = authToken.trim();
    if (!activeToken) {
      setRequestLoading(false);
      setRequestError(ui.updateError);
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    async function loadRows() {
      setRequestLoading(true);
      setRequestError(null);
      try {
        const response = await fetchJson<PaginatedInquiriesResponse>(
          buildInquiriesPath({
            page,
            query: deferredQuery,
            statusFilter,
            sortKey,
            sortDirection,
          }),
          activeToken,
          { signal: abortController.signal },
        );
        if (cancelled) return;
        setServerRows(Array.isArray(response.data) ? response.data : []);
        setServerTotalCount(
          typeof response.meta?.total === "number" ? response.meta.total : 0,
        );
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setRequestError(ui.updateError);
      } finally {
        if (!cancelled) {
          setRequestLoading(false);
        }
      }
    }

    void loadRows();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [authToken, deferredQuery, page, rows, sortDirection, sortKey, statusFilter, totalCount, ui.updateError, usingDefaultSnapshot]);

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...KNOWN_STATUS_OPTIONS,
          ...rows.map((row) => String(row.status || "").trim()).filter(Boolean),
          ...serverRows.map((row) => String(row.status || "").trim()).filter(Boolean),
        ]),
      ).sort((left, right) => left.localeCompare(right)),
    [rows, serverRows],
  );

  const totalPages = Math.max(1, Math.ceil(serverTotalCount / DEFAULT_PAGE_SIZE));
  const showingStart = serverTotalCount === 0 ? 0 : (page - 1) * DEFAULT_PAGE_SIZE + 1;
  const showingEnd = serverTotalCount === 0 ? 0 : Math.min(page * DEFAULT_PAGE_SIZE, serverTotalCount);

  function resetControls() {
    setQuery("");
    setStatusFilter(ALL_STATUS_FILTER_VALUE);
    setSortKey("created_at");
    setSortDirection("desc");
    setPage(1);
  }

  return (
    <div className="dashboard-table-shell" aria-busy={requestLoading}>
      <AdminTableToolbar role="search" aria-label={ui.filter}>
        <label className="field dashboard-table-toolbar-field" htmlFor={filterId}>
          <span>{ui.filter}</span>
          <input
            id={filterId}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={ui.searchPlaceholder}
          />
        </label>

        <label className="field dashboard-table-toolbar-field" htmlFor={statusId}>
          <span>{ui.status}</span>
          <select
            id={statusId}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value={ALL_STATUS_FILTER_VALUE}>{ui.statusAll}</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field dashboard-table-toolbar-field" htmlFor={sortId}>
          <span>{ui.sortBy}</span>
          <select
            id={sortId}
            value={sortKey}
            onChange={(event) => {
              setSortKey(event.target.value as SortKey);
              setPage(1);
            }}
          >
            <option value="created_at">{ui.sortCreated}</option>
            <option value="status">{ui.sortStatus}</option>
            <option value="name">{ui.sortName}</option>
          </select>
        </label>

        <button
          type="button"
          className={adminButtonClassName({ variant: "secondary", className: "dashboard-table-direction" })}
          onClick={() => {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            setPage(1);
          }}
        >
          {ui.sortDirection}: {sortDirection === "asc" ? ui.asc : ui.desc}
        </button>

        <button
          type="button"
          className={adminButtonClassName({ variant: "secondary", className: "dashboard-table-reset" })}
          onClick={resetControls}
        >
          {ui.reset}
        </button>
      </AdminTableToolbar>

      <p id={summaryId} className="dashboard-table-summary" aria-live="polite">
        {requestLoading
          ? ui.loading
          : formatSummaryLabel({
              page,
              totalPages,
              showingStart,
              showingEnd,
              totalRows: serverTotalCount,
              resultsLabel: ui.results,
              pageLabel: ui.page,
            })}
      </p>

      {requestError ? <p className="state-error" role="status">{requestError}</p> : null}

      {serverRows.length === 0 ? (
        <div className="dashboard-section-state dashboard-section-state--empty" role="status" aria-live="polite">
          <h3>{ui.noMatchesTitle}</h3>
          <p>{ui.noMatchesBody}</p>
        </div>
      ) : (
        <>
          <AdminTable className="dashboard-table-wrap--desktop">
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
                {serverRows.map((row) => (
                  <tr key={row.id}>
                    <td>{prettyDate(row.created_at, locale)}</td>
                    <td>{row.name}</td>
                    <td>{row.email || row.phone || "-"}</td>
                    <td>
                      <AdminBadge tone="neutral" className="dashboard-table-chip">
                        {row.status || "-"}
                      </AdminBadge>
                    </td>
                    <td>{row.intent || "-"}</td>
                    <td>{row.source_page || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>

          <div className="dashboard-table-card-list">
            {serverRows.map((row) => (
              <article key={row.id} className="dashboard-table-card">
                <div className="dashboard-table-card-head">
                  <div>
                    <h3 className="dashboard-table-card-name">{row.name}</h3>
                    <p>{prettyDate(row.created_at, locale)}</p>
                  </div>
                  <AdminBadge tone="neutral" className="dashboard-table-chip">
                    {row.status || "-"}
                  </AdminBadge>
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

          {totalPages > 1 ? (
            <AdminTablePagination
              currentPage={page}
              totalPages={totalPages}
              previousLabel={ui.previous}
              nextLabel={ui.next}
              label={ui.page}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
              previousDisabled={page <= 1 || requestLoading}
              nextDisabled={page >= totalPages || requestLoading}
              controlsId={tableId}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
