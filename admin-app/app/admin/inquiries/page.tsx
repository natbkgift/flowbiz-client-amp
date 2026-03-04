"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { clearAuthSession, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";

type Locale = "en" | "th";

type InquiryItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source_page: string | null;
  intent: string | null;
  purpose: string | null;
  follow_up_status: string | null;
  follow_up_due_at: string | null;
  created_at: string;
  whatsapp_url: string | null;
  phone_url: string | null;
  email_url: string | null;
  is_spam_hint: boolean;
  is_duplicate_hint: boolean;
};

type TimelineEvent = {
  id: string;
  action: string;
  note: string | null;
  created_at: string;
  actor_user_id: string | null;
};

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

const FOLLOW_UP_STATUSES = ["pending", "scheduled", "completed", "no_response"] as const;
const copy = {
  en: {
    title: "Inquiries CRM",
    subtitle:
      "Operational list/detail for lead follow-up, assignment, notes timeline, and contact quick actions.",
    loginTitle: "Admin sign in",
    loginSubtitle: "Use the same admin credentials as /v1/auth/login.",
    sessionActive: "Signed in session",
    sessionAs: "Signed in as",
    sessionUnknown: "Signed in (email unavailable)",
    email: "Admin email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in",
    signOut: "Sign out",
    loginMissing: "Email and password are required.",
    loginInvalid: "Invalid credentials.",
    loginError: "Unable to sign in right now.",
    loading: "Loading inquiries",
    reload: "Reload",
    exportCsv: "Export CSV",
    empty: "No inquiries match current filters.",
    error: "Unable to load CRM data right now.",
    authRequired: "Sign in to load admin CRM data.",
    filters: "Filters",
    status: "Status",
    source: "Source",
    purpose: "Purpose",
    dateFrom: "Date from",
    dateTo: "Date to",
    followUp: "Follow-up status",
    search: "Search",
    clear: "Clear",
    apply: "Apply filters",
    list: "Inquiries",
    total: "Total",
    details: "Details",
    timeline: "Timeline",
    contactActions: "Contact actions",
    whatsapp: "WhatsApp",
    phone: "Phone",
    emailAction: "Email",
    noDetails: "Select an inquiry from the list to view full details and timeline.",
    saveFollowUp: "Save follow-up",
    saving: "Saving follow-up",
    followUpDueAt: "Follow-up due at",
    spam: "Spam",
    duplicate: "Duplicate",
    sourcePage: "Source page",
    createdAt: "Created at",
    intent: "Purpose/Intent",
    loadTimelineError: "Unable to load timeline.",
    saveFollowUpError: "Unable to update follow-up.",
  },
  th: {
    title: "Inquiries CRM",
    subtitle:
      "หน้าหลังบ้านสำหรับติดตามลีดแบบใช้งานจริง ครบทั้งรายการ รายละเอียด ไทม์ไลน์ และ quick actions.",
    loginTitle: "เข้าสู่ระบบแอดมิน",
    loginSubtitle: "ใช้บัญชีแอดมินเดียวกับเส้นทาง /v1/auth/login",
    sessionActive: "เซสชันที่เข้าสู่ระบบอยู่",
    sessionAs: "เข้าสู่ระบบเป็น",
    sessionUnknown: "เข้าสู่ระบบแล้ว (ไม่พบอีเมล)",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ",
    signOut: "ออกจากระบบ",
    loginMissing: "ต้องกรอกอีเมลและรหัสผ่าน",
    loginInvalid: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
    loginError: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    loading: "กำลังโหลดรายการ",
    reload: "โหลดใหม่",
    exportCsv: "ส่งออก CSV",
    empty: "ไม่พบรายการตาม filter ปัจจุบัน",
    error: "ไม่สามารถโหลดข้อมูล CRM ได้ในขณะนี้",
    authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งาน CRM หลังบ้าน",
    filters: "ตัวกรอง",
    status: "สถานะ",
    source: "ที่มา",
    purpose: "วัตถุประสงค์",
    dateFrom: "วันที่เริ่ม",
    dateTo: "วันที่สิ้นสุด",
    followUp: "สถานะติดตาม",
    search: "ค้นหา",
    clear: "ล้างค่า",
    apply: "ใช้ตัวกรอง",
    list: "รายการ Inquiry",
    total: "ทั้งหมด",
    details: "รายละเอียด",
    timeline: "ไทม์ไลน์",
    contactActions: "ช่องทางติดต่อด่วน",
    whatsapp: "WhatsApp",
    phone: "โทร",
    emailAction: "อีเมล",
    noDetails: "เลือกรายการจากฝั่งซ้ายเพื่อดูรายละเอียดและไทม์ไลน์",
    saveFollowUp: "บันทึกสถานะติดตาม",
    saving: "กำลังบันทึก",
    followUpDueAt: "กำหนดติดตาม",
    spam: "สแปม",
    duplicate: "ซ้ำ",
    sourcePage: "หน้า source",
    createdAt: "เวลาสร้าง",
    intent: "วัตถุประสงค์",
    loadTimelineError: "โหลดไทม์ไลน์ไม่สำเร็จ",
    saveFollowUpError: "อัปเดตสถานะติดตามไม่สำเร็จ",
  },
};

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const queryLocale = new URLSearchParams(window.location.search).get("lang");
  if (queryLocale === "th" || queryLocale === "en") return queryLocale;
  return navigator.language.toLowerCase().startsWith("th") ? "th" : "en";
}

function buildQuery(filters: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    const normalized = value.trim();
    if (normalized) params.set(key, normalized);
  }
  params.set("page", "1");
  params.set("limit", "50");
  params.set("sort", "created_at");
  params.set("order", "desc");
  return params.toString();
}

function toLocalInputDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 16);
}

function prettyDate(value: string | null, locale: Locale): string {
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
  const [locale, setLocale] = useState<Locale>("en");
  const [authToken, setAuthToken] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("");
  const [search, setSearch] = useState("");

  const [followUpStatus, setFollowUpStatus] = useState("pending");
  const [followUpDueAt, setFollowUpDueAt] = useState("");

  useEffect(() => {
    setLocale(detectLocale());
    const session = readAuthSession();
    if (!session) return;
    setAuthToken(session.token);
    setAuthEmail(session.email);
    if (session.email) setLoginEmail(session.email);
  }, []);

  const isAuthenticated = authToken.trim().length > 0;
  const t = copy[locale];

  const filterQuery = useMemo(
    () =>
      buildQuery({
        status: statusFilter,
        source: sourceFilter,
        purpose: purposeFilter,
        date_from: dateFrom,
        date_to: dateTo,
        follow_up_status: followUpFilter,
        q: search,
      }),
    [dateFrom, dateTo, followUpFilter, purposeFilter, search, sourceFilter, statusFilter]
  );

  async function loadList(tokenOverride?: string) {
    const activeToken = (tokenOverride ?? authToken).trim();
    if (!activeToken) {
      setError(t.authRequired);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const body = await fetchJson<PaginatedResponse<InquiryItem>>(
        `/admin/inquiries?${filterQuery}`,
        activeToken
      );
      setItems(body.data);
      setTotal(body.meta.total);
      if (!body.data.some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setSelected(null);
        setTimeline([]);
      }
      persistAuthSession(activeToken, authEmail || loginEmail);
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
    const email = loginEmail.trim();
    const password = loginPassword;
    if (!email || !password) {
      setAuthError(t.loginMissing);
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const loginResult = await loginAdmin(email, password);
      if (!loginResult.ok) {
        setAuthError(loginResult.status === 401 ? t.loginInvalid : t.loginError);
        return;
      }
      const accessToken = loginResult.accessToken;

      setAuthToken(accessToken);
      setAuthEmail(email);
      setLoginPassword("");
      persistAuthSession(accessToken, email);
      await loadList(accessToken);
    } catch {
      setAuthError(t.loginError);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    clearAuthSession();
    setAuthToken("");
    setAuthEmail("");
    setLoginPassword("");
    setAuthError(null);
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
      <section className="card">
        <h1>{t.title}</h1>
        <p className="locale-safe">{t.subtitle}</p>
      </section>

      <section className="card crm-controls" aria-label={t.filters}>
        <div className="crm-auth-shell">
          {!isAuthenticated ? (
            <form className="crm-login-form" onSubmit={(event) => void login(event)}>
              <h2>{t.loginTitle}</h2>
              <p className="locale-safe">{t.loginSubtitle}</p>

              <label className="field" htmlFor="crm-login-email">
                <span>{t.email}</span>
                <input
                  id="crm-login-email"
                  type="email"
                  autoComplete="username"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                />
              </label>

              <label className="field" htmlFor="crm-login-password">
                <span>{t.password}</span>
                <input
                  id="crm-login-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </label>

              {authError ? <div className="state-error">{authError}</div> : null}

              <div className="card-actions">
                <button className="btn" type="submit" disabled={authLoading}>
                  {authLoading ? t.signingIn : t.signIn}
                </button>
              </div>
            </form>
          ) : (
            <div className="crm-session-panel" role="status" aria-live="polite">
              <h2>{t.sessionActive}</h2>
              <p className="locale-safe">
                {authEmail ? `${t.sessionAs}: ${authEmail}` : t.sessionUnknown}
              </p>
              <div className="card-actions">
                <button className="btn btn-secondary" type="button" onClick={logout}>
                  {t.signOut}
                </button>
              </div>
            </div>
          )}
        </div>

        <fieldset className="crm-filters-fieldset" disabled={!isAuthenticated}>
          <legend>{t.filters}</legend>
          <div className="crm-filters">
            <label className="field" htmlFor="crm-status">
              <span>{t.status}</span>
              <input id="crm-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} />
            </label>
            <label className="field" htmlFor="crm-source">
              <span>{t.source}</span>
              <input id="crm-source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} />
            </label>
            <label className="field" htmlFor="crm-purpose">
              <span>{t.purpose}</span>
              <input
                id="crm-purpose"
                value={purposeFilter}
                onChange={(event) => setPurposeFilter(event.target.value)}
              />
            </label>
            <label className="field" htmlFor="crm-date-from">
              <span>{t.dateFrom}</span>
              <input id="crm-date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label className="field" htmlFor="crm-date-to">
              <span>{t.dateTo}</span>
              <input id="crm-date-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </label>
            <label className="field" htmlFor="crm-follow-up-filter">
              <span>{t.followUp}</span>
              <select
                id="crm-follow-up-filter"
                value={followUpFilter}
                onChange={(event) => setFollowUpFilter(event.target.value)}
              >
                <option value=""></option>
                {FOLLOW_UP_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="field crm-search" htmlFor="crm-search">
              <span>{t.search}</span>
              <input id="crm-search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
        </fieldset>

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
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              setStatusFilter("");
              setSourceFilter("");
              setPurposeFilter("");
              setDateFrom("");
              setDateTo("");
              setFollowUpFilter("");
              setSearch("");
            }}
            disabled={!isAuthenticated || loading}
          >
            {t.clear}
          </button>
        </div>

        {!isAuthenticated ? <div className="state-empty">{t.authRequired}</div> : null}
      </section>

      {error ? <div className="state-error">{error}</div> : null}

      {isAuthenticated ? (
        <section className="crm-layout">
          <article className="card crm-list">
            <header className="crm-list-head">
              <h2>{t.list}</h2>
              <p>
                {t.total}: <strong>{total}</strong>
              </p>
            </header>

            {loading ? <div className="state-loading">{t.loading}</div> : null}
            {!loading && items.length === 0 ? <div className="state-empty">{t.empty}</div> : null}

            {!loading && items.length > 0 ? (
              <ul className="crm-items" aria-label={t.list}>
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`crm-row-button ${selectedId === item.id ? "is-active" : ""}`}
                      onClick={() => void loadDetails(item.id)}
                    >
                      <span className="crm-row-title">{item.name}</span>
                      <span className="crm-row-meta">{item.status}</span>
                      <span className="crm-row-meta">{item.purpose || "-"}</span>
                      <span className="crm-row-meta">{prettyDate(item.created_at, locale)}</span>
                      <span className="crm-row-hints">
                        {item.is_spam_hint ? <span className="crm-chip crm-chip-warn">{t.spam}</span> : null}
                        {item.is_duplicate_hint ? <span className="crm-chip crm-chip-muted">{t.duplicate}</span> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <article className="card crm-detail">
            <h2>{t.details}</h2>
            {!selected ? <div className="state-empty">{t.noDetails}</div> : null}

            {selected ? (
              <>
                <div className="crm-meta-grid">
                  <p>
                    <strong>{t.intent}:</strong> {selected.purpose || "-"}
                  </p>
                  <p>
                    <strong>{t.status}:</strong> {selected.status}
                  </p>
                  <p>
                    <strong>{t.followUp}:</strong> {selected.follow_up_status || "-"}
                  </p>
                  <p>
                    <strong>{t.followUpDueAt}:</strong> {prettyDate(selected.follow_up_due_at, locale)}
                  </p>
                  <p>
                    <strong>{t.sourcePage}:</strong> {selected.source_page || "-"}
                  </p>
                  <p>
                    <strong>{t.createdAt}:</strong> {prettyDate(selected.created_at, locale)}
                  </p>
                </div>

                <section aria-label={t.contactActions}>
                  <h3>{t.contactActions}</h3>
                  <div className="card-actions">
                    {selected.whatsapp_url ? (
                      <a className="btn btn-secondary" href={selected.whatsapp_url} target="_blank" rel="noreferrer">
                        {t.whatsapp}
                      </a>
                    ) : null}
                    {selected.phone_url ? (
                      <a className="btn btn-secondary" href={selected.phone_url}>
                        {t.phone}
                      </a>
                    ) : null}
                    {selected.email_url ? (
                      <a className="btn btn-secondary" href={selected.email_url}>
                        {t.emailAction}
                      </a>
                    ) : null}
                  </div>
                </section>

                <section aria-label={t.followUp}>
                  <h3>{t.followUp}</h3>
                  <div className="crm-follow-up-grid">
                    <label className="field" htmlFor="follow-up-status">
                      <span>{t.followUp}</span>
                      <select
                        id="follow-up-status"
                        value={followUpStatus}
                        onChange={(event) => setFollowUpStatus(event.target.value)}
                      >
                        {FOLLOW_UP_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field" htmlFor="follow-up-due-at">
                      <span>{t.followUpDueAt}</span>
                      <input
                        id="follow-up-due-at"
                        type="datetime-local"
                        value={followUpDueAt}
                        onChange={(event) => setFollowUpDueAt(event.target.value)}
                      />
                    </label>
                  </div>
                  {followUpError ? <p className="state-error">{followUpError}</p> : null}
                  <div className="card-actions">
                    <button className="btn" type="button" onClick={() => void saveFollowUp()} disabled={savingFollowUp}>
                      {savingFollowUp ? t.saving : t.saveFollowUp}
                    </button>
                  </div>
                </section>

                <section aria-label={t.timeline}>
                  <h3>{t.timeline}</h3>
                  {timelineError ? <div className="state-error">{timelineError}</div> : null}
                  {timeline.length === 0 ? (
                    <div className="state-empty">-</div>
                  ) : (
                    <ol className="crm-timeline">
                      {timeline.map((event) => (
                        <li key={event.id}>
                          <p>
                            <strong>{event.action}</strong> · {prettyDate(event.created_at, locale)}
                          </p>
                          {event.note ? <p className="locale-safe">{event.note}</p> : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            ) : null}
          </article>
        </section>
      ) : null}
    </main>
  );
}
