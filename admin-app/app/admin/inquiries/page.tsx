"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type AdminAuthErrorCode, useAdminAuthController } from "@/app/_lib/admin-auth-hooks";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";
import {
  ActionCard,
  AdminAccessGate,
  AdminBadge,
  AdminButton,
  AdminFilterDrawer,
  AdminPage,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryActionBar,
  AdminResponsiveList,
  AdminSelectionDrawer,
} from "@/components/admin/AdminPrimitives";
import { InquiryAdvisorAssistPanel } from "@/components/admin/domain/crm/InquiryAdvisorAssistPanel";
import { InquiryContactActions } from "@/components/admin/domain/crm/InquiryContactActions";
import { InquiryFollowUpPanel } from "@/components/admin/domain/crm/InquiryFollowUpPanel";
import { InquiryKanbanBoard } from "@/components/admin/domain/crm/InquiryKanbanBoard";
import { InquiryListTable } from "@/components/admin/domain/crm/InquiryListTable";
import { InquirySavedFiltersPanel } from "@/components/admin/domain/crm/InquirySavedFiltersPanel";
import { InquiryTimelinePanel } from "@/components/admin/domain/crm/InquiryTimelinePanel";
import { inquiriesCopy } from "@/components/admin/domain/crm/inquiries-copy";
import { InquiryViewToggle } from "@/components/admin/domain/crm/InquiryViewToggle";
import {
  buildQuery,
  CRM_STATUSES,
  dueClass,
  FOLLOW_UP_STATUSES,
  getInquiryDisplayLabel,
  isInquiryViewMode,
  MAX_SAVED_FILTERS,
  normalizeInquiryFilters,
  prettyDate,
  readRoleFromToken,
  savedFiltersKey,
  toLocalInputDateTime,
  translateFollowUpStatus,
  translateInquiryStatus,
  workspaceStateKey,
} from "@/components/admin/domain/crm/inquiries-utils";
import type {
  InquiryFilters,
  InquiryItem,
  InquiryLocale,
  InquiryViewMode,
  InquiryWorkspaceState,
  PaginatedResponse,
  SavedFilter,
  TimelineEvent,
} from "@/components/admin/domain/crm/inquiries-types";

const EMPTY_FILTERS: InquiryFilters = {
  status: "",
  source: "",
  purpose: "",
  date_from: "",
  date_to: "",
  follow_up_status: "",
  q: "",
};
const MAX_FILTER_SUMMARY_VALUE_LENGTH = 24;
const TRUNCATED_FILTER_SUMMARY_VALUE_LENGTH = MAX_FILTER_SUMMARY_VALUE_LENGTH - 3;

function detectLocale(): InquiryLocale {
  return detectAdminLocale();
}

async function fetchJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`request_failed:${response.status}`);
  }
  return (await response.json()) as T;
}

function buildFilterSummary(
  filters: InquiryFilters,
  t: (typeof inquiriesCopy)[keyof typeof inquiriesCopy],
  locale: InquiryLocale,
): Array<{ key: keyof InquiryFilters; label: string }> {
  const summary: Array<{ key: keyof InquiryFilters; label: string }> = [];

  if (filters.status.trim()) {
    summary.push({ key: "status", label: `${t.status}: ${translateInquiryStatus(filters.status, locale)}` });
  }
  if (filters.source.trim()) {
    summary.push({ key: "source", label: `${t.source}: ${truncateFilterSummaryValue(filters.source)}` });
  }
  if (filters.purpose.trim()) {
    summary.push({ key: "purpose", label: `${t.purpose}: ${truncateFilterSummaryValue(filters.purpose)}` });
  }
  if (filters.date_from.trim()) {
    summary.push({ key: "date_from", label: `${t.dateFrom}: ${filters.date_from}` });
  }
  if (filters.date_to.trim()) {
    summary.push({ key: "date_to", label: `${t.dateTo}: ${filters.date_to}` });
  }
  if (filters.follow_up_status.trim()) {
    summary.push({
      key: "follow_up_status",
      label: `${t.followUp}: ${translateFollowUpStatus(filters.follow_up_status, locale)}`,
    });
  }
  if (filters.q.trim()) {
    summary.push({ key: "q", label: `${t.search}: ${truncateFilterSummaryValue(filters.q)}` });
  }

  return summary;
}

function truncateFilterSummaryValue(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > MAX_FILTER_SUMMARY_VALUE_LENGTH
    ? `${trimmed.slice(0, TRUNCATED_FILTER_SUMMARY_VALUE_LENGTH)}…`
    : trimmed;
}

function authErrorMessage(
  t: (typeof inquiriesCopy)[keyof typeof inquiriesCopy],
  code: AdminAuthErrorCode,
): string {
  if (code === "missing_credentials") return t.loginMissing;
  if (code === "invalid_credentials") return t.loginInvalid;
  return t.loginError;
}

export default function AdminInquiriesPage() {
  const savedFilterCounter = useRef(0);
  const hasHydratedWorkspace = useRef(false);
  const hasBootstrappedQueue = useRef(false);
  const [locale, setLocale] = useState<InquiryLocale>(() => detectLocale());
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<InquiryItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [movingInquiryId, setMovingInquiryId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [followUpNotice, setFollowUpNotice] = useState<string | null>(null);
  const [moveStatusNotice, setMoveStatusNotice] = useState<string | null>(null);

  const [filters, setFilters] = useState<InquiryFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<InquiryFilters>(EMPTY_FILTERS);
  const [appliedFilterQuery, setAppliedFilterQuery] = useState(() => buildQuery(EMPTY_FILTERS));
  const [followUpStatus, setFollowUpStatus] = useState("pending");
  const [followUpDueAt, setFollowUpDueAt] = useState("");
  const [viewMode, setViewMode] = useState<InquiryViewMode>("table");
  const [role, setRole] = useState("admin");
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [savedFilterName, setSavedFilterName] = useState("");
  const [activeSavedFilterId, setActiveSavedFilterId] = useState("");
  const {
    token: authToken,
    email: authEmail,
    authLoading,
    authErrorCode,
    isAuthenticated,
    persistSession,
    login: loginWithAdminSession,
    logout: clearAdminSession,
  } = useAdminAuthController();

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  useEffect(() => {
    if (!authToken.trim()) {
      setRole("admin");
      return;
    }
    setRole(readRoleFromToken(authToken));
  }, [authToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(savedFiltersKey(role));
    if (!raw) {
      setSavedFilters([]);
      setActiveSavedFilterId("");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SavedFilter[];
      const scoped = Array.isArray(parsed) ? parsed.filter((item) => item.role === role) : [];
      setSavedFilters(scoped);
    } catch {
      setSavedFilters([]);
      setActiveSavedFilterId("");
      window.localStorage.removeItem(savedFiltersKey(role));
    }
  }, [role]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    hasHydratedWorkspace.current = false;
    const storageKey = workspaceStateKey(role);
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setFilters(EMPTY_FILTERS);
      setAppliedFilters(EMPTY_FILTERS);
      setAppliedFilterQuery(buildQuery(EMPTY_FILTERS));
      setViewMode("table");
      setActiveSavedFilterId("");
      hasHydratedWorkspace.current = true;
      hasBootstrappedQueue.current = false;
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<InquiryWorkspaceState>;
      const nextDraftFilters = normalizeInquiryFilters(parsed.draftFilters);
      const nextAppliedFilters = normalizeInquiryFilters(parsed.appliedFilters);
      setFilters(nextDraftFilters);
      setAppliedFilters(nextAppliedFilters);
      setAppliedFilterQuery(buildQuery(nextAppliedFilters));
      setViewMode(isInquiryViewMode(parsed.viewMode) ? parsed.viewMode : "table");
      setActiveSavedFilterId(typeof parsed.activeSavedFilterId === "string" ? parsed.activeSavedFilterId : "");
    } catch {
      window.localStorage.removeItem(storageKey);
      setFilters(EMPTY_FILTERS);
      setAppliedFilters(EMPTY_FILTERS);
      setAppliedFilterQuery(buildQuery(EMPTY_FILTERS));
      setViewMode("table");
      setActiveSavedFilterId("");
    }

    hasHydratedWorkspace.current = true;
    hasBootstrappedQueue.current = false;
  }, [role]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedWorkspace.current) return;

    const snapshot: InquiryWorkspaceState = {
      draftFilters: filters,
      appliedFilters,
      viewMode,
      activeSavedFilterId,
    };

    try {
      window.localStorage.setItem(workspaceStateKey(role), JSON.stringify(snapshot));
    } catch {
      return;
    }
  }, [activeSavedFilterId, appliedFilters, filters, role, viewMode]);

  const t = inquiriesCopy[locale];
  const authError = authErrorCode ? authErrorMessage(t, authErrorCode) : null;
  const filterQuery = useMemo(() => buildQuery(filters), [filters]);
  const detailEmptyStateMessage = !loading && items.length === 0 ? t.emptyDetails : t.noDetails;
  const hasUnappliedFilters = filterQuery !== appliedFilterQuery;
  const hasActiveFilters = Object.values(filters).some((value) => value.trim().length > 0);
  const hasAppliedFilters = Object.values(appliedFilters).some((value) => value.trim().length > 0);
  const draftFilterSummary = buildFilterSummary(filters, t, locale);
  const appliedFilterSummary = buildFilterSummary(appliedFilters, t, locale);
  const hasNoFiltersToReset = !hasUnappliedFilters && !hasActiveFilters;
  const shouldDisableApply = !isAuthenticated || loading || detailLoading || Boolean(movingInquiryId) || !hasUnappliedFilters;
  const shouldDisableReload = !isAuthenticated || detailLoading || Boolean(movingInquiryId) || hasUnappliedFilters;
  const shouldDisableClear = !isAuthenticated || loading || detailLoading || Boolean(movingInquiryId) || hasNoFiltersToReset;
  const filterStateMessage = hasUnappliedFilters ? t.filterStateDraft : t.filterStateApplied;
  const filterScopeMessage = hasAppliedFilters ? t.filterScopeFiltered : t.filterScopeDefault;
  const activeSavedViewLabel = savedFilters.find((item) => item.id === activeSavedFilterId)?.name || t.appliedQueueDefault;

  function updateFilter<Key extends keyof InquiryFilters>(key: Key, value: InquiryFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilterChip<Key extends keyof InquiryFilters>(key: Key) {
    setActiveSavedFilterId("");
    setFilters((current) => ({ ...current, [key]: "" }));
  }

  async function applyFilters(tokenOverride?: string, emailOverride?: string) {
    await loadListWithFilters(filters, tokenOverride, emailOverride);
  }

  async function reloadList(tokenOverride?: string, emailOverride?: string) {
    await loadListWithFilters(appliedFilters, tokenOverride, emailOverride);
  }

  async function openLeadDetails(id: string) {
    await loadDetails(id);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileDetailOpen(true);
    }
  }

  const loadDetails = useCallback(async (id: string, tokenOverride?: string) => {
    const activeToken = (tokenOverride ?? authToken).trim();
    if (!activeToken) {
      setError(t.authRequired);
      return;
    }

    setSelectedId(id);
    setDetailLoading(true);
    setTimelineError(null);
    setFollowUpNotice(null);
    setMoveStatusNotice(null);
    try {
      const [detailBody, timelineBody] = await Promise.all([
        fetchJson<InquiryItem>(`/admin/inquiries/${id}`, activeToken),
        fetchJson<PaginatedResponse<TimelineEvent>>(`/admin/inquiries/${id}/timeline?limit=30`, activeToken),
      ]);
      setSelected(detailBody);
      setFollowUpStatus(detailBody.follow_up_status || "pending");
      setFollowUpDueAt(toLocalInputDateTime(detailBody.follow_up_due_at));
      setTimeline(timelineBody.data);
    } catch {
      setTimelineError(t.loadTimelineError);
    } finally {
      setDetailLoading(false);
    }
  }, [authToken, t.authRequired, t.loadTimelineError]);

  const loadListWithFilters = useCallback(async (nextFilters: InquiryFilters, tokenOverride?: string, emailOverride?: string) => {
    const activeToken = (tokenOverride ?? authToken).trim();
    if (!activeToken) {
      setError(t.authRequired);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const query = buildQuery(nextFilters);
      const body = await fetchJson<PaginatedResponse<InquiryItem>>(`/admin/inquiries?${query}`, activeToken);
      setItems(body.data);
      setTotal(body.meta.total);
      setAppliedFilters(nextFilters);
      setAppliedFilterQuery(query);
      const shouldKeepSelection = Boolean(selectedId && body.data.some((item) => item.id === selectedId));
      if (shouldKeepSelection && selectedId) {
        await loadDetails(selectedId, activeToken);
      } else {
        const nextSelectedId = body.data[0]?.id ?? null;
        setSelectedId(nextSelectedId);
        setSelected(null);
        setTimeline([]);
        if (nextSelectedId) {
          await loadDetails(nextSelectedId, activeToken);
        }
      }
      persistSession(activeToken, (emailOverride ?? authEmail) || loginEmail);
      setFilterDrawerOpen(false);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [authEmail, authToken, loadDetails, loginEmail, persistSession, selectedId, t.authRequired, t.error]);

  useEffect(() => {
    if (!isAuthenticated || !authToken.trim() || !hasHydratedWorkspace.current || hasBootstrappedQueue.current) {
      return;
    }
    hasBootstrappedQueue.current = true;
    void loadListWithFilters(appliedFilters, authToken, authEmail);
  }, [appliedFilters, authEmail, authToken, isAuthenticated, loadListWithFilters]);

  async function saveFollowUp() {
    const activeToken = authToken.trim();
    if (!selectedId || !activeToken) {
      setError(t.authRequired);
      return;
    }

    setSavingFollowUp(true);
    setFollowUpError(null);
    setFollowUpNotice(null);
    try {
      const payload = {
        follow_up_status: followUpStatus,
        follow_up_due_at: followUpDueAt ? new Date(followUpDueAt).toISOString() : null,
      };
      const response = await fetch(`/admin/inquiries/${selectedId}/follow-up`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("save_failed");
      const body = (await response.json()) as InquiryItem;
      setSelected(body);
      setItems((prev) => prev.map((item) => (item.id === body.id ? body : item)));
      setFollowUpNotice(t.followUpSaved);
      await loadDetails(selectedId);
    } catch {
      setFollowUpError(t.saveFollowUpError);
    } finally {
      setSavingFollowUp(false);
    }
  }

  function saveCurrentFilter() {
    if (typeof window === "undefined") return;
    const trimmedName = savedFilterName.trim();
    if (!trimmedName) return;
    const record: SavedFilter = {
      id:
        window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `${Date.now()}-${savedFilterCounter.current++}-${Math.random().toString(16).slice(2)}`,
      role,
      name: trimmedName,
      filters: { ...filters },
    };
    const next = [record, ...savedFilters].slice(0, MAX_SAVED_FILTERS);
    setSavedFilters(next);
    setSavedFilterName("");
    setActiveSavedFilterId(record.id);
    try {
      window.localStorage?.setItem(savedFiltersKey(role), JSON.stringify(next));
    } catch (storageError) {
      console.error("Failed to persist saved inquiries filter to localStorage", storageError);
    }
  }

  function loadSavedFilter() {
    const selectedFilter = savedFilters.find((item) => item.id === activeSavedFilterId);
    if (!selectedFilter) return;
    setFilters({ ...selectedFilter.filters });
    void loadListWithFilters(selectedFilter.filters);
  }

  function clearFilters() {
    setActiveSavedFilterId("");
    setFilters(EMPTY_FILTERS);
    void loadListWithFilters(EMPTY_FILTERS);
  }

  async function moveInquiryStatus(inquiryId: string, nextStatus: string) {
    const activeToken = authToken.trim();
    if (!activeToken) {
      setError(t.authRequired);
      return;
    }
    const current = items.find((item) => item.id === inquiryId);
    if (!current || current.status === nextStatus) return;
    setMovingInquiryId(inquiryId);
    setMoveStatusNotice(null);
    try {
      const response = await fetch(`/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error("move_failed");
      const body = (await response.json()) as InquiryItem;
      setItems((prev) => prev.map((item) => (item.id === body.id ? body : item)));
      setSelected((prev) => (prev && prev.id === body.id ? body : prev));
      setMoveStatusNotice(t.moveStatusUpdated);
    } catch {
      setError(t.moveStatusError);
    } finally {
      setMovingInquiryId(null);
    }
  }

  async function exportCsv() {
    const activeToken = authToken.trim();
    if (!activeToken) {
      setError(t.authRequired);
      return;
    }

    const response = await fetch(`/admin/inquiries-export.csv?${appliedFilterQuery}`, {
      headers: { Authorization: `Bearer ${activeToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      setError(t.error);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "inquiries-export.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const loginResult = await loginWithAdminSession({ email: loginEmail.trim(), password: loginPassword });
      if (!loginResult.ok) return;
      setLoginPassword("");
      await applyFilters(loginResult.accessToken, loginResult.email);
    } catch {
      return;
    }
  }

  function logout() {
    clearAdminSession();
    hasBootstrappedQueue.current = false;
    setRole("admin");
    setLoginPassword("");
    setError(null);
    setItems([]);
    setTotal(0);
    setSelectedId(null);
    setSelected(null);
    setTimeline([]);
    setTimelineError(null);
    setFollowUpError(null);
    setFollowUpNotice(null);
    setMoveStatusNotice(null);
    setMobileDetailOpen(false);
  }

  function renderQueueCard(item: InquiryItem) {
    const primaryLabel = getInquiryDisplayLabel(item);
    return (
      <button
        key={item.id}
        type="button"
        className={selectedId === item.id ? "lead-inbox-queue-card is-active" : "lead-inbox-queue-card"}
        onClick={() => void openLeadDetails(item.id)}
        disabled={movingInquiryId === item.id}
      >
        <div className="lead-inbox-queue-card__head">
          <strong>{primaryLabel}</strong>
          <span className="crm-chip crm-chip-muted">{translateInquiryStatus(item.status, locale)}</span>
        </div>
        <div className="lead-inbox-queue-card__meta">
          <span>{item.source_page || item.intent || item.purpose || "-"}</span>
          <span className={`crm-chip ${item.follow_up_status ? "crm-chip-sla" : "crm-chip-muted"}`}>
            {translateFollowUpStatus(item.follow_up_status, locale)}
          </span>
          <span className={`crm-chip ${dueClass(item.follow_up_due_at)}`}>{prettyDate(item.follow_up_due_at, locale)}</span>
        </div>
        <div className="lead-inbox-queue-card__chips">
          {item.is_spam_hint ? <span className="crm-chip crm-chip-warn">{t.spam}</span> : null}
          {item.is_duplicate_hint ? <span className="crm-chip crm-chip-muted">{t.duplicate}</span> : null}
        </div>
      </button>
    );
  }

  function renderMobilePipeline() {
    return (
      <div className="lead-inbox-status-groups">
        {CRM_STATUSES.map((status) => {
          const statusItems = items.filter((item) => item.status === status);
          return (
            <section key={status} className="lead-inbox-status-group">
              <div className="lead-inbox-status-group__head">
                <h3>{translateInquiryStatus(status, locale)}</h3>
                <span>{statusItems.length}</span>
              </div>
              <div className="lead-inbox-queue-card-list">
                {statusItems.length > 0 ? statusItems.map((item) => renderQueueCard(item)) : <div className="state-empty">{t.empty}</div>}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  function renderDetailContent() {
    if (!selected) {
      return detailLoading ? (
        <div className="state-loading">{t.loadingDetails}</div>
      ) : (
        <div className="state-empty crm-detail-empty-state">
          <strong>{t.details}</strong>
          <p className="crm-section-description">{detailEmptyStateMessage}</p>
        </div>
      );
    }

    return (
      <div className="lead-inbox-detail-stack">
        <section className="crm-detail-section crm-detail-section--grouped" aria-label={t.detailSnapshotTitle}>
          <div className="crm-detail-section__header">
            <h3>{t.detailSnapshotTitle}</h3>
            <p className="crm-section-description">{t.detailSnapshotDescription}</p>
          </div>
          <div className="crm-detail-summary__head">
            <h3>{getInquiryDisplayLabel(selected)}</h3>
            <div className="crm-detail-summary__badges">
              <span className="crm-chip crm-chip-muted">{translateInquiryStatus(selected.status, locale)}</span>
              <span className="crm-chip crm-chip-sla">{translateFollowUpStatus(selected.follow_up_status, locale)}</span>
            </div>
          </div>
          <dl className="crm-meta-grid crm-meta-grid--detail">
            <div>
              <dt>{t.intent}</dt>
              <dd>{selected.purpose || selected.intent || "-"}</dd>
            </div>
            <div>
              <dt>{t.sourcePage}</dt>
              <dd>{selected.source_page || "-"}</dd>
            </div>
            <div>
              <dt>{t.createdAt}</dt>
              <dd>{prettyDate(selected.created_at, locale)}</dd>
            </div>
            <div>
              <dt>{t.followUpDueAt}</dt>
              <dd>{prettyDate(selected.follow_up_due_at, locale)}</dd>
            </div>
            <div>
              <dt>{t.emailAction}</dt>
              <dd>{selected.email || "-"}</dd>
            </div>
            <div>
              <dt>{t.phone}</dt>
              <dd>{selected.phone || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="crm-detail-section crm-detail-section--grouped" aria-label={t.detailActionsTitle}>
          <div className="crm-detail-section__header">
            <h3>{t.detailActionsTitle}</h3>
            <p className="crm-section-description">{t.detailActionsDescription}</p>
          </div>
          <InquiryFollowUpPanel
            t={t}
            locale={locale}
            followUpStatus={followUpStatus}
            followUpDueAt={followUpDueAt}
            savingFollowUp={savingFollowUp}
            detailLoading={detailLoading}
            followUpError={followUpError}
            followUpNotice={followUpNotice}
            onFollowUpStatusChange={setFollowUpStatus}
            onFollowUpDueAtChange={setFollowUpDueAt}
            onSave={saveFollowUp}
          />
        </section>

        <section className="crm-detail-section crm-detail-section--grouped" aria-label={t.contactActions}>
          <div className="crm-detail-section__header">
            <h3>{t.contactActions}</h3>
            <p className="crm-section-description">{t.contactActionsDescription}</p>
          </div>
          <InquiryContactActions t={t} selected={selected} />
        </section>

        <section className="crm-detail-section crm-detail-section--grouped" aria-label={t.detailContextTitle}>
          <div className="crm-detail-section__header">
            <h3>{t.detailContextTitle}</h3>
            <p className="crm-section-description">{t.detailContextDescription}</p>
          </div>
          <InquiryAdvisorAssistPanel t={t} locale={locale} selected={selected} />
          <InquiryTimelinePanel t={t} locale={locale} timeline={timeline} timelineError={timelineError} />
        </section>
      </div>
    );
  }

  return (
    <AdminPage className="lead-inbox-page">
      <AdminPageHeader
        title={t.title}
        description={t.subtitle}
        icon="message"
        eyebrow={locale === "th" ? "งานลีด" : "Lead workflow"}
        meta={
          <div className="lead-inbox-header-meta">
            <AdminBadge tone="info" icon="workspace">{`${t.total}: ${total}`}</AdminBadge>
            <AdminBadge tone="neutral" icon="info">{`${t.savedFilters}: ${activeSavedViewLabel}`}</AdminBadge>
          </div>
        }
        actions={
          isAuthenticated ? (
            <div className="lead-inbox-header-tools">
              <label className="home-composer-form-field lead-inbox-search-field">
                {t.search}
                <input
                  value={filters.q}
                  placeholder={t.searchPlaceholder}
                  className="home-composer-form-control"
                  onChange={(event) => updateFilter("q", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void applyFilters();
                    }
                  }}
                />
              </label>
              <AdminButton type="button" variant="secondary" icon="filter" onClick={() => setFilterDrawerOpen(true)}>
                {t.filters}
              </AdminButton>
              <InquiryViewToggle t={t} viewMode={viewMode} onViewModeChange={setViewMode} />
              <AdminButton type="button" variant="secondary" icon="imports" onClick={() => void exportCsv()} disabled={!isAuthenticated || loading}>
                {t.exportCsv}
              </AdminButton>
            </div>
          ) : null
        }
      />

      {!isAuthenticated ? (
        <AdminAccessGate
          isAuthenticated={false}
          authTitle={t.loginTitle}
          authDescription={t.loginSubtitle}
          authContent={
            <form className="crm-login-form" method="post" onSubmit={(event) => void login(event)}>
              <label className="field" htmlFor="crm-login-email">
                <span>{t.email}</span>
                <input
                  id="crm-login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                />
              </label>
              <label className="field" htmlFor="crm-login-password">
                <span>{t.password}</span>
                <input
                  id="crm-login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </label>
              {authError ? <div className="state-error">{authError}</div> : null}
              <div className="card-actions">
                <AdminButton variant="primary" icon="workspace" type="submit" disabled={authLoading}>
                  {authLoading ? t.signingIn : t.signIn}
                </AdminButton>
              </div>
            </form>
          }
        />
      ) : (
        <>
          <AdminPrimaryActionBar
            title={selected ? getInquiryDisplayLabel(selected) : t.details}
            description={`${filterStateMessage} ${filterScopeMessage}`}
            mobileBottom
            primaryAction={{
              label: savingFollowUp ? t.saving : t.saveFollowUp,
              icon: "success",
              onClick: () => void saveFollowUp(),
              disabled: !selected || savingFollowUp || detailLoading,
            }}
            secondaryActions={[
              {
                label: loading ? t.loading : t.reload,
                icon: "refresh",
                onClick: () => void reloadList(),
                disabled: shouldDisableReload,
              },
              {
                label: t.exportCsv,
                icon: "imports",
                onClick: () => void exportCsv(),
                disabled: !isAuthenticated || loading,
              },
              {
                label: t.signOut,
                icon: "x",
                onClick: logout,
                disabled: savingFollowUp,
              },
            ]}
            meta={
              <>
                <AdminBadge tone={hasUnappliedFilters ? "warn" : "neutral"} icon="info">
                  {hasUnappliedFilters ? t.draftChangesPending : t.appliedQueue}
                </AdminBadge>
                <AdminBadge tone="info" icon="workspace">{`${t.savedFilters}: ${activeSavedViewLabel}`}</AdminBadge>
              </>
            }
          />

          <AdminFilterDrawer
            open={filterDrawerOpen}
            title={t.filters}
            description={t.filtersDescription}
            onClose={() => setFilterDrawerOpen(false)}
            closeLabel={t.close}
            footer={
              <>
                <AdminButton type="button" variant="secondary" onClick={clearFilters} disabled={shouldDisableClear}>
                  {t.clear}
                </AdminButton>
                <AdminButton type="button" variant="secondary" onClick={() => void applyFilters()} disabled={shouldDisableApply}>
                  {loading ? t.loading : t.apply}
                </AdminButton>
              </>
            }
          >
            <div className="lead-inbox-filter-drawer">
              <InquirySavedFiltersPanel
                t={t}
                isAuthenticated={isAuthenticated}
                savedFilterName={savedFilterName}
                savedFilters={savedFilters}
                activeSavedFilterId={activeSavedFilterId}
                role={role}
                onSavedFilterNameChange={setSavedFilterName}
                onActiveSavedFilterIdChange={setActiveSavedFilterId}
                onSaveFilter={saveCurrentFilter}
                onLoadFilter={loadSavedFilter}
              />

              <fieldset className="crm-filters-fieldset" disabled={!isAuthenticated || loading}>
                <legend>{t.filters}</legend>
                <p className="crm-filter-hint">{t.filtersDescription}</p>
                <div className="crm-filters">
                  <label className="field" htmlFor="lead-inbox-status">
                    <span>{t.status}</span>
                    <input id="lead-inbox-status" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} />
                  </label>
                  <label className="field" htmlFor="lead-inbox-source">
                    <span>{t.source}</span>
                    <input id="lead-inbox-source" value={filters.source} onChange={(event) => updateFilter("source", event.target.value)} />
                  </label>
                  <label className="field" htmlFor="lead-inbox-purpose">
                    <span>{t.purpose}</span>
                    <input id="lead-inbox-purpose" value={filters.purpose} onChange={(event) => updateFilter("purpose", event.target.value)} />
                  </label>
                  <label className="field" htmlFor="lead-inbox-date-from">
                    <span>{t.dateFrom}</span>
                    <input id="lead-inbox-date-from" type="date" value={filters.date_from} onChange={(event) => updateFilter("date_from", event.target.value)} />
                  </label>
                  <label className="field" htmlFor="lead-inbox-date-to">
                    <span>{t.dateTo}</span>
                    <input id="lead-inbox-date-to" type="date" value={filters.date_to} onChange={(event) => updateFilter("date_to", event.target.value)} />
                  </label>
                  <label className="field" htmlFor="lead-inbox-follow-up">
                    <span>{t.followUp}</span>
                    <select id="lead-inbox-follow-up" value={filters.follow_up_status} onChange={(event) => updateFilter("follow_up_status", event.target.value)}>
                      <option value=""></option>
                      {FOLLOW_UP_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {translateFollowUpStatus(value, locale)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>
            </div>
          </AdminFilterDrawer>

          <AdminPageBody className="lead-inbox-stack">
            {error ? <div className="state-error">{error}</div> : null}
            {moveStatusNotice ? <div className="state-success">{moveStatusNotice}</div> : null}

            <div className="lead-inbox-summary-row" aria-live="polite">
              <div className="crm-filter-summary">
                <span className="crm-filter-summary__label">{t.currentDraft}</span>
                <div className="crm-filter-summary__chips">
                  {draftFilterSummary.length > 0 ? (
                    draftFilterSummary.map((summary) => (
                      <button
                        key={summary.key}
                        type="button"
                        className="crm-filter-chip-button"
                        onClick={() => clearFilterChip(summary.key)}
                        disabled={!isAuthenticated || loading || detailLoading || Boolean(movingInquiryId)}
                        aria-label={`${t.removeFilter}: ${summary.label}`}
                      >
                        <span>{summary.label}</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    ))
                  ) : (
                    <span className="crm-chip crm-chip-muted">{t.currentDraftDefault}</span>
                  )}
                </div>
              </div>

              <div className="crm-filter-summary">
                <span className="crm-filter-summary__label">{t.appliedQueue}</span>
                <div className="crm-filter-summary__chips">
                  {hasUnappliedFilters ? <span className="crm-chip crm-chip-warn">{t.draftChangesPending}</span> : null}
                  {appliedFilterSummary.length > 0 ? (
                    appliedFilterSummary.map((summary) => (
                      <span key={summary.key} className="crm-chip crm-chip-muted">
                        {summary.label}
                      </span>
                    ))
                  ) : (
                    <span className="crm-chip crm-chip-muted">{t.appliedQueueDefault}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="lead-inbox-layout">
              <ActionCard
                className="lead-inbox-queue-pane"
                title={t.list}
                description={t.listDescription}
                icon="table"
                titleTag="h2"
                meta={<span>{`${t.total}: ${total}`}</span>}
              >
                {loading ? <div className="state-loading">{`${t.loading} ${t.loadingHint}`}</div> : null}
                {!loading && movingInquiryId ? <div className="state-loading">{t.movingStatus}</div> : null}
                {!loading && items.length === 0 ? <div className="state-empty">{`${t.empty} ${t.emptyHint}`}</div> : null}
                {!loading && items.length > 0 ? (
                  <AdminResponsiveList
                    desktop={
                      viewMode === "table" ? (
                        <InquiryListTable
                          t={t}
                          locale={locale}
                          items={items}
                          selectedId={selectedId}
                          movingInquiryId={movingInquiryId}
                          onSelect={openLeadDetails}
                        />
                      ) : (
                        <InquiryKanbanBoard
                          t={t}
                          locale={locale}
                          items={items}
                          selectedId={selectedId}
                          movingInquiryId={movingInquiryId}
                          onSelect={openLeadDetails}
                          onMoveStatus={moveInquiryStatus}
                        />
                      )
                    }
                    mobile={
                      viewMode === "table" ? (
                        <div className="lead-inbox-queue-card-list">{items.map((item) => renderQueueCard(item))}</div>
                      ) : (
                        renderMobilePipeline()
                      )
                    }
                  />
                ) : null}
              </ActionCard>

              <ActionCard
                className="lead-inbox-detail-pane lead-inbox-detail-desktop"
                title={t.details}
                description={t.detailsDescription}
                icon="message"
                titleTag="h2"
              >
                {renderDetailContent()}
              </ActionCard>
            </div>
          </AdminPageBody>

          <AdminSelectionDrawer
            open={mobileDetailOpen && Boolean(selected)}
            title={selected ? getInquiryDisplayLabel(selected) : t.details}
            description={t.detailsDescription}
            onClose={() => setMobileDetailOpen(false)}
            closeLabel={t.close}
          >
            {renderDetailContent()}
          </AdminSelectionDrawer>
        </>
      )}
    </AdminPage>
  );
}
