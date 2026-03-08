"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { clearAuthSession, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";
import { detectAdminLocale, type AdminLocale, withAdminLocale } from "@/app/_lib/admin-i18n";
import {
  transitionDashboardState,
  type DashboardState,
} from "@/app/admin/dashboard/state-utils";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import {
  ActionCard,
  AdminBadge,
  AdminButton,
  AdminPageHeader,
  AdminTabSwitch,
  LogCard,
  StatCard,
  adminButtonClassName,
} from "@/components/admin/AdminPrimitives";
import {
  DashboardInsightSkeletonList,
  DashboardMetricSkeletonRow,
  DashboardSection,
  DashboardSectionState,
  DashboardTableSkeleton,
  DashboardWidgetSkeletonGrid,
} from "@/components/admin/dashboard/DashboardSectionPrimitives";
import { DashboardKpiWidgets } from "@/components/admin/dashboard/DashboardKpiWidgets";
import { DashboardRecentInquiriesTable } from "@/components/admin/dashboard/DashboardRecentInquiriesTable";
import {
  DashboardTrendChart,
  DashboardTrendChartSkeleton,
} from "@/components/admin/dashboard/DashboardTrendChart";
import {
  buildTrendPoints,
  hasTrendData,
  type TrendSeriesBucket,
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

type DashboardRawMetrics = Record<string, unknown> & {
  recent_inquiries?: {
    count?: number | null;
    latest_at?: string | null;
  };
  last_import_status?: {
    status?: string | null;
    checked_at?: string | null;
    rows_total?: number | null;
    rows_errors?: number | null;
  };
  last_mirror_status?: {
    status?: string | null;
    checked_at?: string | null;
    failures_count?: number | null;
  };
  last_deploy_health_status?: {
    health_status?: string | null;
    health_checked_at?: string | null;
    deploy_status?: string | null;
    deploy_checked_at?: string | null;
    source?: string | null;
    build_sha?: string | null;
  };
};

type DashboardSummaryResponse = {
  generated_at: string | null;
  data_freshness: Record<string, FreshnessItem>;
  raw_metrics: DashboardRawMetrics;
  widgets: DashboardWidget[];
  trend_series: Record<TrendPeriod, TrendSeriesBucket[]>;
  recent_inquiries: RecentInquiry[];
  incomplete_widget_count: number;
  warnings: string[];
};

type BackgroundTask = {
  key: string;
  title: string;
  detail: string;
  meta: string;
  icon: AdminIconName;
  tone: "info" | "ok" | "warn" | "error";
  href: string;
  actionLabel: string;
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
      "Operational control surface for system health, pipeline flow, watchlist items, and live activity.",
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
    widgets: "System health / QA overview",
    widgetsHint: "Primary checks across content, media, translations, and deploy readiness.",
    widgetsEmptyTitle: "No widgets returned",
    widgetsEmptyBody: "Backend summary returned no health widgets for this snapshot.",
    trendTitle: "Activity metrics",
    trendHint: "Lead activity trend backed by backend-provided daily inquiry buckets.",
    trendEmptyTitle: "No activity in this window",
    trendEmptyBody: "Switch periods or wait for new inquiry activity to appear in this trend.",
    trendPeriod7d: "7D",
    trendPeriod30d: "30D",
    insightsTitle: "Pipeline summary",
    insightsHint: "Freshness timestamps and upstream hand-off signals from summary sources.",
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
    rows: "Rows",
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
    controlCenterTitle: "Control center",
    controlCenterHint: "Authentication, refresh actions, and direct operator controls.",
    watchlistTitle: "Watchlist",
    watchlistHint: "Warnings that need operator review before they turn into regressions.",
    logsTitle: "Logs",
    logsHint: "Recent inbound activity and lead capture logs.",
    backgroundTasksTitle: "Background tasks",
    backgroundTasksHint: "Import, mirror, and deploy jobs with their latest task outcomes.",
    backgroundTasksEmptyTitle: "No background tasks",
    backgroundTasksEmptyBody: "Task summaries will appear after the next system run.",
    snapshot: "Snapshot",
    stable: "Stable",
    needsReview: "Needs review",
    liveInbox: "Live inbox",
    operatorQueue: "Operator queue",
    openCrm: "Open CRM",
    reviewWatchlist: "Review",
    taskImport: "Import sync",
    taskMirror: "Mirror refresh",
    taskDeploy: "Deploy health",
    openImports: "Open imports",
    openMedia: "Open media",
    openSeo: "Open SEO",
    latestTask: "Latest task",
    taskHealthy: "Healthy",
    taskAttention: "Needs attention",
    taskUnknown: "Unknown",
    taskSource: "Source",
    taskBuild: "Build",
    workspaceLockedTitle: "Sign in required",
    workspaceLockedBody: "This dashboard keeps its structure visible, but live data loads only after admin sign-in.",
  },
  th: {
    title: "Admin Health / QA Dashboard",
    subtitle: "ศูนย์ควบคุมสำหรับสุขภาพระบบ pipeline watchlist และ activity ล่าสุดของแอดมิน",
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
    widgets: "System health / QA overview",
    widgetsHint: "เช็กหลักของ content, media, translations และความพร้อมของ deploy",
    widgetsEmptyTitle: "ยังไม่มีวิดเจ็ต",
    widgetsEmptyBody: "backend summary ยังไม่ส่ง health widget มาในรอบนี้",
    trendTitle: "Activity metrics",
    trendHint: "แนวโน้ม activity ของลีดจาก daily inquiry buckets ของ backend",
    trendEmptyTitle: "ช่วงเวลานี้ยังไม่มี activity",
    trendEmptyBody: "ลองสลับช่วงเวลา หรือรอ activity ใหม่เข้ามาในกราฟนี้",
    trendPeriod7d: "7D",
    trendPeriod30d: "30D",
    insightsTitle: "Pipeline summary",
    insightsHint: "เวลาอัปเดตและสัญญาณ hand-off ล่าสุดจาก summary sources",
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
    sourcePage: "หน้าต้นทาง",
    status: "สถานะ",
    rows: "แถว",
    intent: "เป้าหมาย",
    contact: "ช่องทางติดต่อ",
    name: "ชื่อ",
    createdAt: "เวลาสร้าง",
    warnings: "Warnings",
    warningsHint: "watchlist จาก summary endpoint ที่ควรตรวจต่อ",
    warningsEmptyTitle: "ไม่มีคำเตือนที่เปิดอยู่",
    warningsEmptyBody: "snapshot ปัจจุบันไม่มีข้อความเตือน",
    checkedAt: "ตรวจล่าสุด",
    age: "อายุข้อมูล",
    unknownValue: "ไม่ทราบ",
    controlCenterTitle: "Control center",
    controlCenterHint: "เข้าสู่ระบบ รีเฟรชข้อมูล และคอนโทรลหลักของ operator",
    watchlistTitle: "Watchlist",
    watchlistHint: "คำเตือนที่ควรตรวจทันที ก่อนกลายเป็น regression",
    logsTitle: "Logs",
    logsHint: "activity ล่าสุดและบันทึกการรับลีด",
    backgroundTasksTitle: "Background tasks",
    backgroundTasksHint: "งาน import, mirror และ deploy พร้อมผลล่าสุดของแต่ละ task",
    backgroundTasksEmptyTitle: "ยังไม่มี background tasks",
    backgroundTasksEmptyBody: "เมื่อมีรันระบบครั้งถัดไป ระบบจะแสดงข้อมูล task ที่นี่",
    snapshot: "Snapshot",
    stable: "เสถียร",
    needsReview: "ต้องตรวจ",
    liveInbox: "Live inbox",
    operatorQueue: "คิวงานของ operator",
    openCrm: "เปิด CRM",
    reviewWatchlist: "ตรวจรายการ",
    taskImport: "Import sync",
    taskMirror: "Mirror refresh",
    taskDeploy: "Deploy health",
    openImports: "เปิด imports",
    openMedia: "เปิด media",
    openSeo: "เปิด SEO",
    latestTask: "งานล่าสุด",
    taskHealthy: "ปกติ",
    taskAttention: "ต้องตรวจ",
    taskUnknown: "ไม่ทราบ",
    taskSource: "แหล่งที่มา",
    taskBuild: "Build",
    workspaceLockedTitle: "ต้องเข้าสู่ระบบก่อน",
    workspaceLockedBody: "ระบบยังแสดงโครงแดชบอร์ดไว้ให้เห็น แต่ข้อมูลสดจะโหลดหลังจากแอดมินเข้าสู่ระบบเท่านั้น",
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

function compactValue(value: string | null | undefined, fallback: string): string {
  const text = String(value || "").trim();
  return text || fallback;
}

function taskTone(status: string | null | undefined): BackgroundTask["tone"] {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "info";
  if (normalized === "ok" || normalized === "healthy" || normalized === "success") return "ok";
  if (normalized === "failed" || normalized === "error") return "error";
  if (normalized === "partial" || normalized === "warning") return "warn";
  return "info";
}

function taskLabel(
  status: string | null | undefined,
  locale: Locale,
  labels: Pick<(typeof copy)["en"], "taskHealthy" | "taskAttention" | "taskUnknown">,
): string {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return labels.taskUnknown;
  if (normalized === "ok" || normalized === "healthy" || normalized === "success") return labels.taskHealthy;
  if (normalized === "failed" || normalized === "error" || normalized === "partial" || normalized === "warning") {
    return labels.taskAttention;
  }
  return locale === "th" ? normalized.toUpperCase() : normalized.toUpperCase();
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
  const totalRecentInquiryCount = Math.max(
    Number(summary?.raw_metrics?.recent_inquiries?.count || 0),
    summary?.recent_inquiries?.length || 0,
  );

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
      buildTrendPoints(
        summary?.trend_series?.[chartPeriod] || [],
        summary?.generated_at || null,
        chartPeriod,
        locale,
      ),
    [chartPeriod, locale, summary],
  );

  const overviewCards = useMemo<
    Array<{
      key: string;
      title: string;
      value: string;
      metadata: string;
      icon: AdminIconName;
      tone: "info" | "ok" | "warn";
      action: JSX.Element;
    }>
  >(
    () => [
      {
        key: "generated_at",
        title: t.generatedAt,
        value: prettyDate(summary?.generated_at || null, locale),
        metadata: t.snapshot,
        icon: "refresh" as AdminIconName,
        tone: "info" as const,
        action: (
          <AdminBadge tone="info" icon="refresh">
            {t.snapshot}
          </AdminBadge>
        ),
      },
      {
        key: "incomplete_widget_count",
        title: t.incomplete,
        value:
          typeof summary?.incomplete_widget_count === "number"
            ? String(summary.incomplete_widget_count)
            : t.unknownValue,
        metadata: t.operatorQueue,
        icon: "review" as AdminIconName,
        tone:
          typeof summary?.incomplete_widget_count === "number" && summary.incomplete_widget_count > 0
            ? ("warn" as const)
            : ("ok" as const),
        action: (
          <AdminBadge
            tone={typeof summary?.incomplete_widget_count === "number" && summary.incomplete_widget_count > 0 ? "warn" : "ok"}
            icon={typeof summary?.incomplete_widget_count === "number" && summary.incomplete_widget_count > 0 ? "warning" : "success"}
          >
            {typeof summary?.incomplete_widget_count === "number" && summary.incomplete_widget_count > 0
              ? t.needsReview
              : t.stable}
          </AdminBadge>
        ),
      },
      {
        key: "recent_inquiries",
        title: t.recentInquiries,
        value: String(totalRecentInquiryCount),
        metadata: t.liveInbox,
        icon: "message" as AdminIconName,
        tone: totalRecentInquiryCount > 0 ? "ok" : "info",
        action: (
          <Link
            className={adminButtonClassName({ variant: "secondary", size: "sm" })}
            href={withAdminLocale("/admin/inquiries", locale)}
          >
            {t.openCrm}
          </Link>
        ),
      },
      {
        key: "warnings",
        title: t.warnings,
        value: String(summary?.warnings?.length || 0),
        metadata: t.watchlistTitle,
        icon: "warning" as AdminIconName,
        tone: (summary?.warnings?.length || 0) > 0 ? ("warn" as const) : ("ok" as const),
        action: (
          <AdminBadge
            tone={(summary?.warnings?.length || 0) > 0 ? "warn" : "ok"}
            icon={(summary?.warnings?.length || 0) > 0 ? "warning" : "success"}
          >
            {(summary?.warnings?.length || 0) > 0 ? t.reviewWatchlist : t.stable}
          </AdminBadge>
        ),
      },
    ],
    [locale, summary, t, totalRecentInquiryCount],
  );

  const backgroundTasks = useMemo<BackgroundTask[]>(() => {
    const raw = summary?.raw_metrics;
    const importStatus = raw?.last_import_status?.status || null;
    const mirrorStatus = raw?.last_mirror_status?.status || null;
    const deployStatus = raw?.last_deploy_health_status?.deploy_status || raw?.last_deploy_health_status?.health_status || null;

    return [
      {
        key: "import",
        title: t.taskImport,
        detail: `${t.latestTask}: ${prettyDate(raw?.last_import_status?.checked_at || null, locale)}`,
        meta: `${t.status}: ${compactValue(importStatus, t.taskUnknown)} · ${t.rows}: ${String(raw?.last_import_status?.rows_total || 0)}`,
        icon: "imports",
        tone: taskTone(importStatus),
        href: "/admin/imports",
        actionLabel: t.openImports,
      },
      {
        key: "mirror",
        title: t.taskMirror,
        detail: `${t.latestTask}: ${prettyDate(raw?.last_mirror_status?.checked_at || null, locale)}`,
        meta: `${t.status}: ${compactValue(mirrorStatus, t.taskUnknown)} · ${t.warnings}: ${String(raw?.last_mirror_status?.failures_count || 0)}`,
        icon: "media",
        tone: taskTone(mirrorStatus),
        href: "/admin/media",
        actionLabel: t.openMedia,
      },
      {
        key: "deploy",
        title: t.taskDeploy,
        detail: `${t.latestTask}: ${prettyDate(raw?.last_deploy_health_status?.deploy_checked_at || null, locale)}`,
        meta: `${t.taskSource}: ${compactValue(raw?.last_deploy_health_status?.source, t.unknownValue)} · ${t.taskBuild}: ${compactValue(
          raw?.last_deploy_health_status?.build_sha?.slice(0, 7),
          t.unknownValue,
        )}`,
        icon: "refresh",
        tone: taskTone(deployStatus),
        href: "/admin/seo",
        actionLabel: t.openSeo,
      },
    ];
  }, [locale, summary, t]);

  function renderRefreshButton(label?: string) {
    return (
      <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void loadDashboard()} disabled={loading}>
        {loading ? t.loading : label || t.refresh}
      </AdminButton>
    );
  }

  function renderOverviewPanel() {
    if (!isAuthenticated) {
      return <DashboardSectionState tone="info" title={t.workspaceLockedTitle} body={t.workspaceLockedBody} />;
    }

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
        {overviewCards.map((item) => (
          <StatCard
            key={item.key}
            title={item.title}
            value={item.value}
            metadata={item.metadata}
            icon={item.icon}
            tone={item.tone}
            action={item.action}
            className="dashboard-summary-card"
          />
        ))}
      </div>
    );
  }

  function renderTrendToggle() {
    return (
      <AdminTabSwitch
        ariaLabel={t.trendTitle}
        className="dashboard-period-toggle"
        value={chartPeriod}
        onChange={(value) => setChartPeriod(value as TrendPeriod)}
        options={[
          { value: "7d", label: t.trendPeriod7d, disabled: loading },
          { value: "30d", label: t.trendPeriod30d, disabled: loading },
        ]}
      />
    );
  }

  function renderWidgetsPanel() {
    if (!isAuthenticated) {
      return <DashboardSectionState tone="info" title={t.workspaceLockedTitle} body={t.workspaceLockedBody} />;
    }

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
    if (!isAuthenticated) {
      return <DashboardSectionState tone="info" title={t.workspaceLockedTitle} body={t.workspaceLockedBody} />;
    }

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
    if (!isAuthenticated) {
      return <DashboardSectionState tone="info" title={t.workspaceLockedTitle} body={t.workspaceLockedBody} />;
    }

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
    if (!isAuthenticated) {
      return <DashboardSectionState tone="info" title={t.workspaceLockedTitle} body={t.workspaceLockedBody} />;
    }

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
          <li key={item}>
            <span className="dashboard-warning-icon" aria-hidden="true">
              <AdminIcon name="warning" size={16} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  function renderTablePanel() {
    if (!isAuthenticated) {
      return <DashboardSectionState tone="info" title={t.workspaceLockedTitle} body={t.workspaceLockedBody} />;
    }

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

    if (totalRecentInquiryCount === 0) {
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
      <DashboardRecentInquiriesTable
        rows={summary?.recent_inquiries || []}
        totalCount={totalRecentInquiryCount}
        locale={locale}
        authToken={authToken}
      />
    );
  }

  function renderBackgroundTasksPanel() {
    if (!isAuthenticated) {
      return <DashboardSectionState tone="info" title={t.workspaceLockedTitle} body={t.workspaceLockedBody} />;
    }

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

    if (backgroundTasks.length === 0) {
      return (
        <DashboardSectionState
          tone="empty"
          title={t.backgroundTasksEmptyTitle}
          body={t.backgroundTasksEmptyBody}
          action={renderRefreshButton(t.retry)}
        />
      );
    }

    return (
      <ul className="dashboard-task-list">
        {backgroundTasks.map((task) => (
          <li key={task.key} className="dashboard-task-item">
            <div className="dashboard-task-item__head">
              <span className="dashboard-task-item__icon" aria-hidden="true">
                <AdminIcon name={task.icon} size={16} />
              </span>
              <div className="dashboard-task-item__copy">
                <strong>{task.title}</strong>
                <p>{task.detail}</p>
              </div>
              <AdminBadge tone={task.tone} icon={task.tone === "ok" ? "success" : task.tone === "warn" ? "warning" : task.tone === "error" ? "x" : "info"}>
                {taskLabel(
                  task.key === "deploy"
                    ? summary?.raw_metrics?.last_deploy_health_status?.deploy_status || summary?.raw_metrics?.last_deploy_health_status?.health_status
                    : task.key === "mirror"
                      ? summary?.raw_metrics?.last_mirror_status?.status
                      : summary?.raw_metrics?.last_import_status?.status,
                  locale,
                  t,
                )}
              </AdminBadge>
            </div>
            <div className="dashboard-task-item__footer">
              <span>{task.meta}</span>
              <Link
                className={adminButtonClassName({ variant: "secondary", size: "sm" })}
                href={withAdminLocale(task.href, locale)}
              >
                {task.actionLabel}
              </Link>
            </div>
          </li>
        ))}
      </ul>
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

  function renderControlCenter() {
    return (
      <ActionCard
        title={t.controlCenterTitle}
        description={t.controlCenterHint}
        icon={isAuthenticated ? "profile" : "workspace"}
        tone={isAuthenticated ? ("info" as const) : ("neutral" as const)}
        className="dashboard-control-card"
        meta={
          isAuthenticated ? (
            <AdminBadge tone="ok" icon="success">
              {t.sessionActive}
            </AdminBadge>
          ) : (
            <AdminBadge tone="info" icon="workspace">
              {t.loginTitle}
            </AdminBadge>
          )
        }
        footer={
          isAuthenticated ? (
            <div className="dashboard-control-card__actions">
              {renderRefreshButton()}
              <AdminButton variant="secondary" icon="x" type="button" onClick={logout}>
                {t.signOut}
              </AdminButton>
            </div>
          ) : undefined
        }
      >
        {!isAuthenticated ? (
          <form className="crm-login-form" method="post" onSubmit={(event) => void login(event)}>
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

            {authError ? <div className="state-error" role="alert">{authError}</div> : null}

            <div className="dashboard-control-card__actions">
              <AdminButton variant="primary" icon="workspace" type="submit" disabled={authLoading}>
                {authLoading ? t.signingIn : t.signIn}
              </AdminButton>
            </div>
          </form>
        ) : (
          <div className="crm-session-panel" role="status" aria-live="polite">
            <h2>{t.sessionActive}</h2>
            <p className="locale-safe">
              {authEmail ? `${t.sessionAs}: ${authEmail}` : t.sessionUnknown}
            </p>
          </div>
        )}
      </ActionCard>
    );
  }

  return (
    <main id="main-content" className="container content-stack" aria-busy={loading}>
      <AdminPageHeader
        className="dashboard-hero"
        icon="dashboard"
        eyebrow={locale === "th" ? "สุขภาพระบบ" : "System health"}
        title={t.title}
        description={t.subtitle}
        meta={renderOverviewPanel()}
      />

      <div className="dashboard-shell-grid">
        <div className="dashboard-zone dashboard-zone--primary">
          <DashboardSection
            title={t.widgets}
            subtitle={t.widgetsHint}
            className="dashboard-section--widgets dashboard-section--primary"
            icon="dashboard"
          >
            {renderWidgetsPanel()}
          </DashboardSection>

          {renderControlCenter()}
        </div>

        <div className="dashboard-zone dashboard-zone--secondary">
          <DashboardSection
            title={t.insightsTitle}
            subtitle={t.insightsHint}
            className="dashboard-section--insights"
            icon="imports"
          >
            {renderInsightsPanel()}
          </DashboardSection>

          <DashboardSection
            title={t.trendTitle}
            subtitle={t.trendHint}
            className="dashboard-section--chart"
            icon="message"
            actions={renderTrendToggle()}
          >
            {renderTrendPanel()}
          </DashboardSection>
        </div>

        <div className="dashboard-zone dashboard-zone--tertiary">
          <LogCard
            title={t.watchlistTitle}
            description={t.watchlistHint}
            icon="warning"
            className="dashboard-log-card dashboard-section--warnings"
          >
            {renderWarningsPanel()}
          </LogCard>

          <DashboardSection
            title={t.logsTitle}
            subtitle={t.logsHint}
            className="dashboard-section--table"
            icon="table"
          >
            {renderTablePanel()}
          </DashboardSection>

          <ActionCard
            title={t.backgroundTasksTitle}
            description={t.backgroundTasksHint}
            icon="refresh"
            className="dashboard-action-card dashboard-section--tasks"
            tone="neutral"
          >
            {renderBackgroundTasksPanel()}
          </ActionCard>
        </div>
      </div>
    </main>
  );
}
