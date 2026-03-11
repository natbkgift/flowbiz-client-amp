"use client";

// TODO(admin-architecture phase 2): split CRM page orchestration into page/section/domain blocks without changing routes or API contracts.

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { type AdminAuthErrorCode, useAdminAuthController } from "@/app/_lib/admin-auth-hooks";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";
import { ActionCard, AdminPageHeader, LogCard } from "@/components/admin/AdminPrimitives";
import { InquiryControlCenter } from "@/components/admin/domain/crm/InquiryControlCenter";
import { InquiryDetailPanel } from "@/components/admin/domain/crm/InquiryDetailPanel";
import { InquiryFiltersPanel } from "@/components/admin/domain/crm/InquiryFiltersPanel";
import { InquiryKanbanBoard } from "@/components/admin/domain/crm/InquiryKanbanBoard";
import { InquiryListTable } from "@/components/admin/domain/crm/InquiryListTable";
import { InquirySavedFiltersPanel } from "@/components/admin/domain/crm/InquirySavedFiltersPanel";
import { inquiriesCopy } from "@/components/admin/domain/crm/inquiries-copy";
import { InquiryViewToggle } from "@/components/admin/domain/crm/InquiryViewToggle";
import {
  buildQuery,
  MAX_SAVED_FILTERS,
  readRoleFromToken,
  savedFiltersKey,
  toLocalInputDateTime,
} from "@/components/admin/domain/crm/inquiries-utils";
import type {
  InquiryFilters,
  InquiryItem,
  InquiryLocale,
  InquiryViewMode,
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

export default function AdminInquiriesPage() {
  const savedFilterCounter = useRef(0);
  const [locale, setLocale] = useState<InquiryLocale>("en");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<InquiryItem | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const [filters, setFilters] = useState<InquiryFilters>(EMPTY_FILTERS);
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
    setActiveSavedFilterId("");
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

  const t = inquiriesCopy[locale];
  const authError = authErrorCode ? authErrorMessage(t, authErrorCode) : null;
  const filterQuery = useMemo(() => buildQuery(filters), [filters]);

  function updateFilter<Key extends keyof InquiryFilters>(key: Key, value: InquiryFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function loadList(tokenOverride?: string, emailOverride?: string) {
    await loadListWithFilters(filters, tokenOverride, emailOverride);
  }

  async function loadListWithFilters(nextFilters: InquiryFilters, tokenOverride?: string, emailOverride?: string) {
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
      if (!body.data.some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setSelected(null);
        setTimeline([]);
      }
      persistSession(activeToken, (emailOverride ?? authEmail) || loginEmail);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(id: string) {
    const activeToken = authToken.trim();
    if (!activeToken) {
      setError(t.authRequired);
      return;
    }

    setSelectedId(id);
    setTimelineError(null);
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
    }
  }

  async function saveFollowUp() {
    const activeToken = authToken.trim();
    if (!selectedId || !activeToken) {
      setError(t.authRequired);
      return;
    }

    setSavingFollowUp(true);
    setFollowUpError(null);
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

  async function moveInquiryStatus(inquiryId: string, nextStatus: string) {
    const activeToken = authToken.trim();
    if (!activeToken) {
      setError(t.authRequired);
      return;
    }
    const current = items.find((item) => item.id === inquiryId);
    if (!current || current.status === nextStatus) return;
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
    } catch {
      setError(t.moveStatusError);
    }
  }

  async function exportCsv() {
    const activeToken = authToken.trim();
    if (!activeToken) {
      setError(t.authRequired);
      return;
    }

    const response = await fetch(`/admin/inquiries-export.csv?${filterQuery}`, {
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
      await loadList(loginResult.accessToken, loginResult.email);
    } catch {
      return;
    }
  }

  function logout() {
    clearAdminSession();
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
  }

  return (
    <main id="main-content" className="container content-stack">
      <AdminPageHeader title={t.title} description={t.subtitle} icon="message" eyebrow="CRM" />

        <ActionCard
        className="crm-controls"
        title={isAuthenticated ? t.filters : t.loginTitle}
        description={
          isAuthenticated
            ? t.filtersDescription
            : t.loginSubtitle
        }
        icon="message"
        titleTag="h2"
      >
        <InquiryControlCenter
          t={t}
          isAuthenticated={isAuthenticated}
          authEmail={authEmail}
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          authLoading={authLoading}
          authError={authError}
          onLoginEmailChange={setLoginEmail}
          onLoginPasswordChange={setLoginPassword}
          onLogin={login}
          onLogout={logout}
        />

        <InquiryFiltersPanel
          t={t}
          isAuthenticated={isAuthenticated}
          filters={filters}
          loading={loading}
          onFilterChange={updateFilter}
        />

        <div className="card-actions">
          <button className="btn" type="button" onClick={() => void loadList()} disabled={!isAuthenticated}>
            {loading ? t.loading : t.apply}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => void loadList()} disabled={!isAuthenticated}>
            {t.reload}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => void exportCsv()} disabled={!isAuthenticated || loading}>
            {t.exportCsv}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!isAuthenticated || loading}>
            {t.clear}
          </button>
        </div>

        <InquiryViewToggle t={t} viewMode={viewMode} onViewModeChange={setViewMode} />

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

        {!isAuthenticated ? <div className="state-empty">{t.authRequired}</div> : null}
      </ActionCard>

      {error ? <div className="state-error">{error}</div> : null}

      {isAuthenticated ? (
        <section className="crm-layout">
          <LogCard
            className="crm-list"
            title={t.list}
            description={t.listDescription}
            icon="table"
            titleTag="h2"
            meta={
              <span>
                {t.total}: <strong>{total}</strong>
              </span>
            }
          >
            {loading ? <div className="state-loading">{`${t.loading} ${t.loadingHint}`}</div> : null}
            {!loading && items.length === 0 ? <div className="state-empty">{`${t.empty} ${t.emptyHint}`}</div> : null}
            {!loading && items.length > 0 && viewMode === "table" ? (
              <InquiryListTable t={t} locale={locale} items={items} selectedId={selectedId} onSelect={loadDetails} />
            ) : null}
            {!loading && items.length > 0 && viewMode === "kanban" ? (
              <InquiryKanbanBoard
                t={t}
                locale={locale}
                items={items}
                selectedId={selectedId}
                onSelect={loadDetails}
                onMoveStatus={moveInquiryStatus}
              />
            ) : null}
          </LogCard>

          <ActionCard
            className="crm-detail"
            title={t.details}
            description="Selected inquiry metadata, contact actions, follow-up controls, and timeline."
            icon="message"
            titleTag="h2"
          >
            <InquiryDetailPanel
              t={t}
              locale={locale}
              selected={selected}
              followUpStatus={followUpStatus}
              followUpDueAt={followUpDueAt}
              savingFollowUp={savingFollowUp}
              followUpError={followUpError}
              timeline={timeline}
              timelineError={timelineError}
              onFollowUpStatusChange={setFollowUpStatus}
              onFollowUpDueAtChange={setFollowUpDueAt}
              onSaveFollowUp={saveFollowUp}
            />
          </ActionCard>
        </section>
      ) : null}
    </main>
  );
}

function authErrorMessage(
  t: (typeof inquiriesCopy)[keyof typeof inquiriesCopy],
  code: AdminAuthErrorCode
): string {
  if (code === "missing_credentials") return t.loginMissing;
  if (code === "invalid_credentials") return t.loginInvalid;
  return t.loginError;
}
