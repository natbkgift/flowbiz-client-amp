"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { clearAuthSession, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";
import { detectAdminLocale, type AdminLocale } from "@/app/_lib/admin-i18n";
import {
  transitionDashboardState,
  type DashboardState,
} from "@/app/admin/dashboard/state-utils";
import {
  DashboardInsightSkeletonList,
  DashboardMetricSkeletonRow,
  DashboardSection,
  DashboardSectionState,
  DashboardTableSkeleton,
  DashboardWidgetSkeletonGrid,
} from "@/components/admin/dashboard/DashboardSectionPrimitives";
import { DashboardKpiWidgets } from "@/components/admin/dashboard/DashboardKpiWidgets";
import {
  DashboardTrendChart,
  DashboardTrendChartSkeleton,
} from "@/components/admin/dashboard/DashboardTrendChart";
import {
  buildInquiryTrendPoints,
  hasTrendData,
  type TrendPeriod,
} from "@/components/admin/dashboard/trend-utils";

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
    overviewReadyTitle: "Ready to load overview",
    overviewReadyBody: "Refresh the dashboard to load the latest QA snapshot.",
    overviewEmptyTitle: "Overview unavailable",
    overviewEmptyBody: "Dashboard summary responded without any visible content yet.",
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
    retry: "Retry",
    authRequired: "Sign in to load admin dashboard data.",
    idleState: "Dashboard is ready. Click refresh to load the latest summary.",
    loginMissing: "Email and password are required.",
    loginInvalid: "Invalid credentials.",
    loginError: "Unable to sign in right now.",
    loadError: "Unable to load dashboard summary right now.",
    loadErrorHint: "Check API health/auth configuration, then retry.",
    emptyState: "No dashboard data found yet.",
    emptyStateHint: "Check data pipelines and retry.",
    emptyWidgets: "No widgets found. Check backend summary contract.",
    widgets: "Health widgets",
    widgetsHint: "Priority QA checks across content, media, translations, and deploy health.",
    widgetsEmptyTitle: "No widgets returned",
    widgetsEmptyBody: "Backend summary returned no health widgets for this snapshot.",
    trendTitle: "Lead activity trend",
    trendHint: "Daily inquiry buckets from the existing dashboard rows.",
    trendEmptyTitle: "No activity in this window",
    trendEmptyBody: "Switch periods or wait for fresh inquiry rows to populate this trend.",
    trendPeriod7d: "7D",
    trendPeriod30d: "30D",
    insightsTitle: "Pipeline insights",
    insightsHint: "Freshness timestamps from upstream summary sources.",
    insightsEmptyTitle: "No freshness insights",
    insightsEmptyBody: "Freshness signals will appear here when upstream jobs report timestamps.",
    generatedAt: "Generated at",
    incomplete: "Incomplete widgets",
    sectionReadyTitle: "Ready to load",
    sectionReadyBody: "Refresh the dashboard to populate this section.",
    sectionErrorTitle: "Section unavailable",
    recentInquiries: "Recent leads/inquiries",
    recentInquiriesHint: "Latest captured leads and inquiries from public entry points.",
    recentInquiriesEmptyTitle: "No recent inquiries",
    recentInquiriesEmptyBody: "New lead rows will appear here after the next captured submission.",
    emptyInquiries: "No recent inquiries found.",
    sourcePage: "Source page",
    status: "Status",
    intent: "Intent",
    contact: "Contact",
    name: "Name",
    createdAt: "Created at",
    warnings: "Warnings",
    warningsHint: "Operator watchlist emitted by the summary endpoint.",
    warningsEmptyTitle: "No active warnings",
    warningsEmptyBody: "Current snapshot has no warning messages.",
    checkedAt: "Checked at",
    age: "Age",
    unknownValue: "Unknown",
  },
  th: {
    title: "Admin Health / QA Dashboard",
    subtitle: "หน้าเดียวสำหรับดูความสมบูรณ์ของระบบและลิงก์แก้ปัญหาแบบ actionable",
    overviewReadyTitle: "พร้อมโหลดภาพรวม",
    overviewReadyBody: "กดรีเฟรชเพื่อโหลด snapshot ล่าสุดของแดชบอร์ด",
    overviewEmptyTitle: "ยังไม่มีภาพรวม",
    overviewEmptyBody: "summary ตอบกลับมา แต่ยังไม่มีข้อมูลที่แสดงผลได้",
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
    retry: "ลองใหม่",
    authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งานแดชบอร์ด",
    idleState: "พร้อมใช้งานแดชบอร์ดแล้ว กดรีเฟรชเพื่อโหลดข้อมูลล่าสุด",
    loginMissing: "ต้องกรอกอีเมลและรหัสผ่าน",
    loginInvalid: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
    loginError: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    loadError: "ไม่สามารถโหลดสรุปแดชบอร์ดได้",
    loadErrorHint: "ตรวจสอบ API/auth แล้วลองใหม่",
    emptyState: "ยังไม่พบข้อมูลสรุปแดชบอร์ด",
    emptyStateHint: "ตรวจ pipeline ข้อมูลแล้วลองใหม่อีกครั้ง",
    emptyWidgets: "ยังไม่พบวิดเจ็ต ตรวจสอบ backend summary contract",
    widgets: "วิดเจ็ตสุขภาพระบบ",
    widgetsHint: "QA checks หลักของ content, media, translations และ deploy",
    widgetsEmptyTitle: "ยังไม่มีวิดเจ็ต",
    widgetsEmptyBody: "backend summary ยังไม่ส่ง health widget มาในรอบนี้",
    trendTitle: "แนวโน้ม activity ของลีด",
    trendHint: "bucket รายวันจาก inquiry rows ที่มีอยู่แล้วในแดชบอร์ด",
    trendEmptyTitle: "ช่วงเวลานี้ยังไม่มี activity",
    trendEmptyBody: "ลองสลับช่วงเวลา หรือรอ inquiry ใหม่เข้ามาในหน้าต่างนี้",
    trendPeriod7d: "7D",
    trendPeriod30d: "30D",
    insightsTitle: "ข้อมูล pipeline",
    insightsHint: "เวลาอัปเดตล่าสุดจาก upstream summary sources",
    insightsEmptyTitle: "ยังไม่มี freshness insight",
    insightsEmptyBody: "เมื่อ upstream jobs ส่ง timestamp มา ระบบจะแสดงในส่วนนี้",
    generatedAt: "เวลาที่สร้างรายงาน",
    incomplete: "วิดเจ็ตที่ยังไม่สมบูรณ์",
    sectionReadyTitle: "พร้อมโหลดข้อมูล",
    sectionReadyBody: "กดรีเฟรชเพื่อเติมข้อมูลในส่วนนี้",
    sectionErrorTitle: "ไม่สามารถแสดงส่วนนี้ได้",
    recentInquiries: "ลีด/อินไควรีล่าสุด",
    recentInquiriesHint: "ลีดและอินไควรีล่าสุดจากหน้า public",
    recentInquiriesEmptyTitle: "ยังไม่มีอินไควรีล่าสุด",
    recentInquiriesEmptyBody: "เมื่อมี submission ใหม่ ระบบจะแสดงแถวข้อมูลที่นี่",
    emptyInquiries: "ยังไม่มีอินไควรีล่าสุด",
    sourcePage: "หน้า source",
    status: "สถานะ",
    intent: "Intent",
    contact: "ช่องทางติดต่อ",
    name: "ชื่อ",
    createdAt: "เวลาสร้าง",
    warnings: "คำเตือน",
    warningsHint: "watchlist จาก summary endpoint",
    warningsEmptyTitle: "ไม่มีคำเตือนที่เปิดอยู่",
    warningsEmptyBody: "snapshot ปัจจุบันไม่มีข้อความเตือน",
    checkedAt: "ตรวจล่าสุด",
    age: "อายุข้อมูล",
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

function humanizeMetricKey(key: string): string {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAge(value: number | null, locale: Locale, fallback: string): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return fallback;
  if (value < 60) return locale === "th" ? `${Math.round(value)} วินาทีที่ผ่านมา` : `${Math.round(value)}s ago`;
  if (value < 3600) {
    const minutes = Math.max(1, Math.round(value / 60));
    return locale === "th" ? `${minutes} นาทีที่ผ่านมา` : `${minutes}m ago`;
  }
  if (value < 86400) {
    const hours = Math.max(1, Math.round(value / 3600));
    return locale === "th" ? `${hours} ชั่วโมงที่ผ่านมา` : `${hours}h ago`;
  }
  const days = Math.max(1, Math.round(value / 86400));
  return locale === "th" ? `${days} วันที่ผ่านมา` : `${days}d ago`;
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
  const [dashboardState, setDashboardState] = useState<DashboardState>("idle");
  const [chartPeriod, setChartPeriod] = useState<TrendPeriod>("7d");

  useEffect(() => {
    setLocale(detectLocale());
    const session = readAuthSession();
    if (!session) return;
    setAuthToken(session.token);
    setAuthEmail(session.email);
    setDashboardState("idle");
  }, []);

  const isAuthenticated = authToken.trim().length > 0;
  const t = copy[locale];

  const widgets = useMemo(() => {
    const rows = summary?.widgets || [];
    const byKey = new Map(rows.map((row) => [row.key, row]));
    return WIDGET_KEYS.map((key) => byKey.get(key)).filter(Boolean) as DashboardWidget[];
  }, [summary]);
  const freshnessEntries = useMemo(() => {
    const source = summary?.data_freshness || {};
    return Object.entries(source).sort(([left], [right]) => left.localeCompare(right)) as Array<
      [string, FreshnessItem]
    >;
  }, [summary]);
  const trendPoints = useMemo(
    () =>
      buildInquiryTrendPoints(
        summary?.recent_inquiries || [],
        summary?.generated_at || null,
        chartPeriod,
        locale,
      ),
    [chartPeriod, locale, summary],
  );
  const overviewMetrics = useMemo(
    () => [
      {
        key: "generated_at",
        label: t.generatedAt,
        value: prettyDate(summary?.generated_at || null, locale),
      },
      {
        key: "incomplete_widget_count",
        label: t.incomplete,
        value:
          typeof summary?.incomplete_widget_count === "number"
            ? String(summary.incomplete_widget_count)
            : t.unknownValue,
      },
      {
        key: "recent_inquiries",
        label: t.recentInquiries,
        value: String(summary?.recent_inquiries?.length || 0),
      },
      {
        key: "warnings",
        label: t.warnings,
        value: String(summary?.warnings?.length || 0),
      },
    ],
    [locale, summary, t],
  );

  function renderRefreshButton(label?: string) {
    return (
      <button
        className="btn btn-secondary"
        type="button"
        onClick={() => void loadDashboard()}
        disabled={loading}
      >
        {loading ? t.loading : label || t.refresh}
      </button>
    );
  }

  function renderOverviewPanel() {
    if (dashboardState === "loading") {
      return <DashboardMetricSkeletonRow cards={4} />;
    }

    if (dashboardState === "error") {
      return (
        <DashboardSectionState
          tone="error"
          title={t.sectionErrorTitle}
          body={pageError || `${t.loadError} ${t.loadErrorHint}`}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    if (dashboardState === "idle") {
      return (
        <DashboardSectionState
          tone="info"
          title={t.overviewReadyTitle}
          body={t.overviewReadyBody}
          action={renderRefreshButton()}
        />
      );
    }

    if (dashboardState === "empty") {
      return (
        <DashboardSectionState
          tone="empty"
          title={t.overviewEmptyTitle}
          body={t.overviewEmptyBody}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    return (
      <div className="dashboard-summary-grid" aria-live="polite">
        {overviewMetrics.map((item) => (
          <article key={item.key} className="dashboard-summary-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    );
  }

  function renderTrendToggle() {
    return (
      <div className="dashboard-period-toggle" aria-label={t.trendTitle}>
        <button
          type="button"
          className={chartPeriod === "7d" ? "dashboard-period-button is-active" : "dashboard-period-button"}
          aria-pressed={chartPeriod === "7d"}
          onClick={() => setChartPeriod("7d")}
          disabled={loading}
        >
          {t.trendPeriod7d}
        </button>
        <button
          type="button"
          className={chartPeriod === "30d" ? "dashboard-period-button is-active" : "dashboard-period-button"}
          aria-pressed={chartPeriod === "30d"}
          onClick={() => setChartPeriod("30d")}
          disabled={loading}
        >
          {t.trendPeriod30d}
        </button>
      </div>
    );
  }

  function renderWidgetsPanel() {
    if (dashboardState === "loading") {
      return <DashboardWidgetSkeletonGrid cards={6} />;
    }

    if (dashboardState === "error") {
      return (
        <DashboardSectionState
          tone="error"
          title={t.sectionErrorTitle}
          body={pageError || `${t.loadError} ${t.loadErrorHint}`}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    if (dashboardState === "idle") {
      return <DashboardSectionState tone="info" title={t.sectionReadyTitle} body={t.sectionReadyBody} action={renderRefreshButton()} />;
    }

    if (widgets.length === 0) {
      return (
        <DashboardSectionState
          tone="empty"
          title={t.widgetsEmptyTitle}
          body={t.widgetsEmptyBody}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    return (
      <DashboardKpiWidgets
        widgets={widgets}
        rawMetrics={summary?.raw_metrics}
        locale={locale}
        fallback={t.unknownValue}
      />
    );
  }

  function renderInsightsPanel() {
    if (dashboardState === "loading") {
      return <DashboardInsightSkeletonList items={4} />;
    }

    if (dashboardState === "error") {
      return (
        <DashboardSectionState
          tone="error"
          title={t.sectionErrorTitle}
          body={pageError || `${t.loadError} ${t.loadErrorHint}`}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    if (dashboardState === "idle") {
      return <DashboardSectionState tone="info" title={t.sectionReadyTitle} body={t.sectionReadyBody} action={renderRefreshButton()} />;
    }

    if (freshnessEntries.length === 0) {
      return (
        <DashboardSectionState
          tone="empty"
          title={t.insightsEmptyTitle}
          body={t.insightsEmptyBody}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    return (
      <ul className="dashboard-insight-list">
        {freshnessEntries.map(([key, item]) => (
          <li key={key} className="dashboard-insight-item">
            <div className="dashboard-insight-copy">
              <strong>{humanizeMetricKey(key)}</strong>
              <p>
                {t.checkedAt}: {prettyDate(item.checked_at, locale)}
              </p>
            </div>
            <span className="dashboard-insight-age">{formatAge(item.age_seconds, locale, t.unknownValue)}</span>
          </li>
        ))}
      </ul>
    );
  }

  function renderTrendPanel() {
    if (dashboardState === "loading") {
      return <DashboardTrendChartSkeleton />;
    }

    if (dashboardState === "error") {
      return (
        <DashboardSectionState
          tone="error"
          title={t.sectionErrorTitle}
          body={pageError || `${t.loadError} ${t.loadErrorHint}`}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    if (dashboardState === "idle") {
      return <DashboardSectionState tone="info" title={t.sectionReadyTitle} body={t.sectionReadyBody} action={renderRefreshButton()} />;
    }

    if (!hasTrendData(trendPoints)) {
      return (
        <DashboardSectionState
          tone="empty"
          title={t.trendEmptyTitle}
          body={t.trendEmptyBody}
        />
      );
    }

    return <DashboardTrendChart points={trendPoints} locale={locale} period={chartPeriod} />;
  }

  function renderWarningsPanel() {
    if (dashboardState === "loading") {
      return <DashboardInsightSkeletonList items={3} />;
    }

    if (dashboardState === "error") {
      return (
        <DashboardSectionState
          tone="error"
          title={t.sectionErrorTitle}
          body={pageError || `${t.loadError} ${t.loadErrorHint}`}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    if (dashboardState === "idle") {
      return <DashboardSectionState tone="info" title={t.sectionReadyTitle} body={t.sectionReadyBody} action={renderRefreshButton()} />;
    }

    if ((summary?.warnings || []).length === 0) {
      return (
        <DashboardSectionState
          tone="empty"
          title={t.warningsEmptyTitle}
          body={t.warningsEmptyBody}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    return (
      <ul className="dashboard-warning-list">
        {(summary?.warnings || []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  function renderTablePanel() {
    if (dashboardState === "loading") {
      return <DashboardTableSkeleton rows={5} />;
    }

    if (dashboardState === "error") {
      return (
        <DashboardSectionState
          tone="error"
          title={t.sectionErrorTitle}
          body={pageError || `${t.loadError} ${t.loadErrorHint}`}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    if (dashboardState === "idle") {
      return <DashboardSectionState tone="info" title={t.sectionReadyTitle} body={t.sectionReadyBody} action={renderRefreshButton()} />;
    }

    if ((summary?.recent_inquiries || []).length === 0) {
      return (
        <DashboardSectionState
          tone="empty"
          title={t.recentInquiriesEmptyTitle}
          body={t.recentInquiriesEmptyBody}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    return (
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>{t.createdAt}</th>
              <th>{t.name}</th>
              <th>{t.contact}</th>
              <th>{t.status}</th>
              <th>{t.intent}</th>
              <th>{t.sourcePage}</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.recent_inquiries || []).map((row) => (
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
    );
  }

  async function loadDashboard(tokenOverride?: string) {
    const activeToken = (tokenOverride ?? authToken).trim();
    if (!activeToken) {
      setPageError(t.authRequired);
      setDashboardState((current) => transitionDashboardState(current, "fetch_error"));
      return;
    }

    setLoading(true);
    setPageError(null);
    setDashboardState((current) => transitionDashboardState(current, "fetch_start"));
    try {
      const body = await fetchSummary(activeToken);
      setSummary(body);
      setDashboardState((current) => transitionDashboardState(current, "fetch_success", body));
      persistAuthSession(activeToken, authEmail || loginEmail);
    } catch {
      setSummary(null);
      setPageError(`${t.loadError} ${t.loadErrorHint}`);
      setDashboardState((current) => transitionDashboardState(current, "fetch_error"));
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
    setDashboardState((current) => transitionDashboardState(current, "reset"));
  }

  return (
    <main id="main-content" className="container content-stack">
      <section className="card dashboard-hero">
        <h1>{t.title}</h1>
        <p className="locale-safe">{t.subtitle}</p>
        {isAuthenticated ? renderOverviewPanel() : <DashboardSectionState tone="info" title={t.loginTitle} body={t.authRequired} />}
      </section>

      <section className="card dashboard-controls" aria-label={t.loginTitle}>
        {!isAuthenticated ? (
          <form className="crm-login-form" method="post" onSubmit={(event) => void login(event)}>
            <h2>{t.loginTitle}</h2>
            <p className="locale-safe">{t.loginSubtitle}</p>

            <label className="field" htmlFor="dashboard-login-email">
              <span>{t.email}</span>
              <input
                id="dashboard-login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
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
                required
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
              {renderRefreshButton()}
              <button className="btn btn-secondary" type="button" onClick={logout}>
                {t.signOut}
              </button>
            </div>
          </div>
        )}
        {!isAuthenticated ? <div className="state-empty">{t.authRequired}</div> : null}
      </section>

      {isAuthenticated ? (
        <div className="dashboard-shell-grid">
          <div className="dashboard-shell-main">
            <DashboardSection
              title={t.widgets}
              subtitle={t.widgetsHint}
              className="dashboard-section--widgets"
            >
              {renderWidgetsPanel()}
            </DashboardSection>

            <DashboardSection
              title={t.trendTitle}
              subtitle={t.trendHint}
              className="dashboard-section--chart"
              actions={renderTrendToggle()}
            >
              {renderTrendPanel()}
            </DashboardSection>

            <DashboardSection
              title={t.recentInquiries}
              subtitle={t.recentInquiriesHint}
              className="dashboard-section--table"
            >
              {renderTablePanel()}
            </DashboardSection>
          </div>

          <div className="dashboard-shell-side">
            <DashboardSection
              title={t.insightsTitle}
              subtitle={t.insightsHint}
              className="dashboard-section--insights"
            >
              {renderInsightsPanel()}
            </DashboardSection>

            <DashboardSection
              title={t.warnings}
              subtitle={t.warningsHint}
              className="dashboard-section--warnings"
            >
              {renderWarningsPanel()}
            </DashboardSection>
          </div>
        </div>
      ) : null}
    </main>
  );
}
