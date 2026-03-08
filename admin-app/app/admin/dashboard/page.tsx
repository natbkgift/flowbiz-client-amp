"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { clearAuthSession, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";
import { detectAdminLocale, type AdminLocale } from "@/app/_lib/admin-i18n";

type Locale = AdminLocale;
type WidgetStatus = "ok" | "warn" | "error" | "unknown";

type DashboardAction = {
  label: string;
  url: string;
};

type DashboardWidget = {
  key: string;
  title: string;
  value: string | number | Record<string, unknown> | null;
  status: WidgetStatus;
  summary: string;
  actions: DashboardAction[];
};

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

type FreshnessItem = {
  checked_at: string | null;
  age_seconds: number | null;
};

type DashboardSummaryResponse = {
  generated_at: string | null;
  data_freshness: Record<string, FreshnessItem>;
  raw_metrics: Record<string, unknown>;
  widgets: DashboardWidget[];
  recent_inquiries: RecentInquiry[];
  incomplete_widget_count: number;
  warnings: string[];
};

const WIDGET_KEYS = [
  "project_cover_coverage",
  "broken_media_count",
  "external_image_leakage_count",
  "pending_translations_count",
  "unpublished_drafts_count",
  "recent_leads_inquiries",
  "review_video_source_verification_pending",
  "last_import_mirror_status",
  "last_deploy_health_status",
] as const;

const copy = {
  en: {
    title: "Admin Health / QA Dashboard",
    subtitle:
      "Single-page operational view of content/media/leads/SEO/tracking completeness with actionable links.",
    loginTitle: "Admin sign in",
    loginSubtitle: "Use the same credentials as /api/v1/auth/login.",
    sessionActive: "Signed in session",
    sessionAs: "Signed in as",
    sessionUnknown: "Signed in (email unavailable)",
    email: "Admin email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in",
    signOut: "Sign out",
    refresh: "Refresh dashboard",
    loading: "Loading dashboard",
    authRequired: "Sign in to load admin dashboard data.",
    loginMissing: "Email and password are required.",
    loginInvalid: "Invalid credentials.",
    loginError: "Unable to sign in right now.",
    loadError: "Unable to load dashboard summary right now.",
    widgets: "Health widgets",
    generatedAt: "Generated at",
    incomplete: "Incomplete widgets",
    recentInquiries: "Recent leads/inquiries",
    emptyInquiries: "No recent inquiries found.",
    sourcePage: "Source page",
    status: "Status",
    intent: "Intent",
    contact: "Contact",
    createdAt: "Created at",
    warnings: "Warnings",
    unknownValue: "Unknown",
  },
  th: {
    title: "Admin Health / QA Dashboard",
    subtitle: "หน้าเดียวสำหรับดูความสมบูรณ์ของระบบและลิงก์แก้ปัญหาแบบ actionable",
    loginTitle: "เข้าสู่ระบบแอดมิน",
    loginSubtitle: "ใช้บัญชีเดียวกับ /api/v1/auth/login",
    sessionActive: "เซสชันที่เข้าสู่ระบบอยู่",
    sessionAs: "เข้าสู่ระบบเป็น",
    sessionUnknown: "เข้าสู่ระบบแล้ว (ไม่พบอีเมล)",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ",
    signOut: "ออกจากระบบ",
    refresh: "รีเฟรชแดชบอร์ด",
    loading: "กำลังโหลดแดชบอร์ด",
    authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งานแดชบอร์ด",
    loginMissing: "ต้องกรอกอีเมลและรหัสผ่าน",
    loginInvalid: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
    loginError: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    loadError: "ไม่สามารถโหลดสรุปแดชบอร์ดได้",
    widgets: "วิดเจ็ตสุขภาพระบบ",
    generatedAt: "เวลาที่สร้างรายงาน",
    incomplete: "วิดเจ็ตที่ยังไม่สมบูรณ์",
    recentInquiries: "ลีด/อินไควรีล่าสุด",
    emptyInquiries: "ยังไม่มีอินไควรีล่าสุด",
    sourcePage: "หน้า source",
    status: "สถานะ",
    intent: "Intent",
    contact: "ช่องทางติดต่อ",
    createdAt: "เวลาสร้าง",
    warnings: "คำเตือน",
    unknownValue: "ไม่ทราบ",
  },
};

function detectLocale(): Locale {
  return detectAdminLocale();
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

function widgetValueToText(value: DashboardWidget["value"], fallback: string): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : fallback;
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function statusClass(status: WidgetStatus): string {
  return `dashboard-status dashboard-status-${status}`;
}

async function fetchSummary(token: string): Promise<DashboardSummaryResponse> {
  const response = await fetch("/api/admin/dashboard/health-summary", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`request_failed:${response.status}`);
  }
  return (await response.json()) as DashboardSummaryResponse;
}

export default function AdminDashboardPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [authToken, setAuthToken] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);

  useEffect(() => {
    setLocale(detectLocale());
    const session = readAuthSession();
    if (!session) return;
    setAuthToken(session.token);
    setAuthEmail(session.email);
  }, []);

  const isAuthenticated = authToken.trim().length > 0;
  const t = copy[locale];

  const widgets = useMemo(() => {
    const rows = summary?.widgets || [];
    const byKey = new Map(rows.map((row) => [row.key, row]));
    return WIDGET_KEYS.map((key) => byKey.get(key)).filter(Boolean) as DashboardWidget[];
  }, [summary]);

  async function loadDashboard(tokenOverride?: string) {
    const activeToken = (tokenOverride ?? authToken).trim();
    if (!activeToken) {
      setPageError(t.authRequired);
      return;
    }

    setLoading(true);
    setPageError(null);
    try {
      const body = await fetchSummary(activeToken);
      setSummary(body);
      persistAuthSession(activeToken, authEmail || loginEmail);
    } catch {
      setPageError(t.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || loginEmail).trim();
    const password = String(formData.get("password") || loginPassword);
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
      await loadDashboard(accessToken);
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
    setPageError(null);
    setSummary(null);
  }

  return (
    <main id="main-content" className="container content-stack">
      <section className="card">
        <h1>{t.title}</h1>
        <p className="locale-safe">{t.subtitle}</p>
      </section>

      <section className="card dashboard-controls" aria-label={t.loginTitle}>
        {!isAuthenticated ? (
          <form className="crm-login-form" onSubmit={(event) => void login(event)}>
            <h2>{t.loginTitle}</h2>
            <p className="locale-safe">{t.loginSubtitle}</p>

            <label className="field" htmlFor="dashboard-login-email">
              <span>{t.email}</span>
              <input
                id="dashboard-login-email"
                name="email"
                type="email"
                autoComplete="username"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>

            <label className="field" htmlFor="dashboard-login-password">
              <span>{t.password}</span>
              <input
                id="dashboard-login-password"
                name="password"
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
              <button className="btn btn-secondary" type="button" onClick={() => void loadDashboard()}>
                {loading ? t.loading : t.refresh}
              </button>
              <button className="btn btn-secondary" type="button" onClick={logout}>
                {t.signOut}
              </button>
            </div>
          </div>
        )}
        {!isAuthenticated ? <div className="state-empty">{t.authRequired}</div> : null}
      </section>

      {pageError ? <div className="state-error">{pageError}</div> : null}
      {loading ? <div className="state-loading">{t.loading}</div> : null}

      {summary ? (
        <>
          <section className="card dashboard-overview" aria-live="polite">
            <p>
              <strong>{t.generatedAt}:</strong> {prettyDate(summary.generated_at, locale)}
            </p>
            <p>
              <strong>{t.incomplete}:</strong> {summary.incomplete_widget_count}
            </p>
          </section>

          <section className="dashboard-grid" aria-label={t.widgets}>
            {widgets.length === 0 ? (
              <div className="card">
                <div className="state-empty">No widgets found. Check backend summary contract.</div>
              </div>
            ) : (
              widgets.map((widget) => (
                <article key={widget.key} className="card dashboard-widget">
                  <header className="dashboard-widget-head">
                    <h2>{widget.title}</h2>
                    <span className={statusClass(widget.status)}>{widget.status}</span>
                  </header>
                  <p className="dashboard-widget-value">
                    {widgetValueToText(widget.value, t.unknownValue)}
                  </p>
                  <p className="locale-safe">{widget.summary}</p>
                  <div className="dashboard-widget-actions">
                    {(widget.actions || []).map((action, index) => (
                      <a
                        key={`${widget.key}-${action.url}-${index}`}
                        className="btn btn-secondary"
                        href={action.url}
                      >
                        {action.label}
                      </a>
                    ))}
                  </div>
                </article>
              ))
            )}
          </section>

          <section className="card" aria-label={t.recentInquiries}>
            <h2>{t.recentInquiries}</h2>
            {(summary.recent_inquiries || []).length === 0 ? (
              <div className="state-empty">{t.emptyInquiries}</div>
            ) : (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t.createdAt}</th>
                      <th>Name</th>
                      <th>{t.contact}</th>
                      <th>{t.status}</th>
                      <th>{t.intent}</th>
                      <th>{t.sourcePage}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recent_inquiries.map((row) => (
                      <tr key={row.id}>
                        <td>{prettyDate(row.created_at, locale)}</td>
                        <td>{row.name}</td>
                        <td>{row.email || row.phone || "-"}</td>
                        <td>{row.status || "-"}</td>
                        <td>{row.intent || "-"}</td>
                        <td>{row.source_page || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {(summary.warnings || []).length > 0 ? (
            <section className="card" aria-label={t.warnings}>
              <h2>{t.warnings}</h2>
              <ul className="dashboard-warning-list">
                {summary.warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
