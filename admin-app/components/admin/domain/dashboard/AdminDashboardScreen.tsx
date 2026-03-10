import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo } from "react";

import { type AdminLocale, withAdminLocale } from "@/app/_lib/admin-i18n";
import type { DashboardState } from "@/app/admin/dashboard/state-utils";
import { ActionCard, LogCard, StatCard } from "@/components/admin/cards/AdminCards";
import { AdminBadge } from "@/components/admin/feedback/AdminBadge";
import { AdminButton, adminButtonClassName } from "@/components/admin/forms/AdminButton";
import { AdminTabSwitch } from "@/components/admin/navigation/AdminTabSwitch";
import { AdminPage, AdminPageBody, AdminPageHeader } from "@/components/admin/page/AdminPage";
import { AdminSectionGrid } from "@/components/admin/section/AdminSection";
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
  type TrendPeriod,
} from "@/components/admin/dashboard/trend-utils";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { dashboardCopy } from "@/components/admin/domain/dashboard/dashboard-copy";
import {
  type BackgroundTask,
  type DashboardSummaryResponse,
  type DashboardWidget,
  WIDGET_KEYS,
} from "@/components/admin/domain/dashboard/dashboard-types";

type Locale = AdminLocale;

type DashboardScreenCopy = (typeof dashboardCopy)[keyof typeof dashboardCopy];

const HEALTHY_TASK_STATUSES = new Set(["ok", "healthy", "success"]);
const ERROR_TASK_STATUSES = new Set(["failed", "error"]);
const WARNING_TASK_STATUSES = new Set(["partial", "warning"]);
const FRESHNESS_OK_MAX_AGE_SECONDS = 60 * 60;
const FRESHNESS_WARN_MAX_AGE_SECONDS = 6 * 60 * 60;

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
  if (HEALTHY_TASK_STATUSES.has(normalized)) return "ok";
  if (ERROR_TASK_STATUSES.has(normalized)) return "error";
  if (WARNING_TASK_STATUSES.has(normalized)) return "warn";
  return "info";
}

function taskLabel(
  status: string | null | undefined,
  labels: Pick<DashboardScreenCopy, "taskHealthy" | "taskAttention" | "taskUnknown" | "taskError">,
): string {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return labels.taskUnknown;
  if (HEALTHY_TASK_STATUSES.has(normalized)) return labels.taskHealthy;
  if (ERROR_TASK_STATUSES.has(normalized)) return labels.taskError;
  if (WARNING_TASK_STATUSES.has(normalized)) return labels.taskAttention;
  return normalized.toUpperCase();
}

function badgeTone(tone: BackgroundTask["tone"]): "info" | "ok" | "warn" | "error" {
  if (tone === "ok" || tone === "warn" || tone === "error") return tone;
  return "info";
}

function badgeIcon(tone: BackgroundTask["tone"]): "success" | "warning" | "x" | "info" {
  if (tone === "ok") return "success";
  if (tone === "warn") return "warning";
  if (tone === "error") return "x";
  return "info";
}

function freshnessTone(ageSeconds: number | null): BackgroundTask["tone"] {
  if (ageSeconds === null) return "info";
  if (typeof ageSeconds !== "number" || !Number.isFinite(ageSeconds) || ageSeconds < 0) return "error";
  if (ageSeconds <= FRESHNESS_OK_MAX_AGE_SECONDS) return "ok";
  if (ageSeconds <= FRESHNESS_WARN_MAX_AGE_SECONDS) return "warn";
  return "error";
}

function toneLabel(
  tone: BackgroundTask["tone"],
  labels: Pick<DashboardScreenCopy, "taskHealthy" | "warningStatus" | "errorStatus" | "refreshRequired">,
): string {
  if (tone === "ok") return labels.taskHealthy;
  if (tone === "warn") return labels.warningStatus;
  if (tone === "error") return labels.errorStatus;
  return labels.refreshRequired;
}

function DashboardControlCenter({
  t,
  locale,
  isAuthenticated,
  authEmail,
  loginEmail,
  loginPassword,
  authLoading,
  authError,
  overallTone,
  latestOperationalLabel,
  onLoginEmailChange,
  onLoginPasswordChange,
  onLogin,
  onLogout,
  refreshAction,
}: {
  t: DashboardScreenCopy;
  locale: Locale;
  isAuthenticated: boolean;
  authEmail: string;
  loginEmail: string;
  loginPassword: string;
  authLoading: boolean;
  authError: string | null;
  overallTone: BackgroundTask["tone"];
  latestOperationalLabel: string;
  onLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onLogout: () => void;
  refreshAction: ReactNode;
}) {
  return (
    <ActionCard
      title={t.controlCenterTitle}
      description={t.controlCenterHint}
      icon={isAuthenticated ? "profile" : "workspace"}
      tone={isAuthenticated ? ("info" as const) : ("neutral" as const)}
      className={isAuthenticated ? "dashboard-control-card" : "dashboard-control-card is-auth-locked"}
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
            {refreshAction}
            <AdminButton variant="secondary" icon="x" type="button" onClick={onLogout}>
              {t.signOut}
            </AdminButton>
          </div>
        ) : undefined
      }
    >
      {!isAuthenticated ? (
        <form className="crm-login-form" method="post" onSubmit={(event) => void onLogin(event)}>
          <label className="field" htmlFor="dashboard-login-email">
            <span>{t.email}</span>
            <input
              id="dashboard-login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={loginEmail}
              onChange={(event) => onLoginEmailChange(event.target.value)}
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
              onChange={(event) => onLoginPasswordChange(event.target.value)}
            />
          </label>

          {authError ? <div className="state-error" role="alert">{authError}</div> : null}

          <div className="dashboard-control-card__actions">
            <AdminButton variant="primary" icon="workspace" type="submit" disabled={authLoading}>
              {authLoading ? t.signingIn : t.signIn}
            </AdminButton>
          </div>
          <div className="dashboard-control-card__helper state-empty" role="status">
            <strong>{t.authRequired}</strong>
            <p className="locale-safe">{t.loginSubtitle}</p>
          </div>
        </form>
      ) : (
        <div className="crm-session-panel" role="status" aria-live="polite">
          <div className="crm-session-panel__head">
            <div className="crm-session-panel__copy">
              <span className="dashboard-operational-card__label">{t.status}</span>
              <h2>{t.sessionActive}</h2>
            </div>
            <AdminBadge tone={badgeTone(overallTone)} icon={badgeIcon(overallTone)}>
              {toneLabel(overallTone, t)}
            </AdminBadge>
          </div>
          <dl className="crm-session-panel__meta">
            <div>
              <dt>{t.sessionAs}</dt>
              <dd className="locale-safe">{authEmail || t.sessionUnknown}</dd>
            </div>
            <div>
              <dt>{t.lastUpdated}</dt>
              <dd>{latestOperationalLabel}</dd>
            </div>
          </dl>
          <div className="crm-session-panel__quick-actions">
            <Link
              className={adminButtonClassName({ variant: "secondary", size: "sm" })}
              href={withAdminLocale("/admin/inquiries", locale)}
            >
              {t.openCrm}
            </Link>
            <Link
              className={adminButtonClassName({ variant: "secondary", size: "sm" })}
              href={withAdminLocale("/admin/imports", locale)}
            >
              {t.openImports}
            </Link>
          </div>
        </div>
      )}
    </ActionCard>
  );
}

export function AdminDashboardScreen({
  locale,
  authToken,
  authEmail,
  loginEmail,
  loginPassword,
  authLoading,
  authError,
  loading,
  pageError,
  summary,
  dashboardState,
  chartPeriod,
  onChartPeriodChange,
  onLoginEmailChange,
  onLoginPasswordChange,
  onLogin,
  onLogout,
  onRefresh,
}: {
  locale: Locale;
  authToken: string;
  authEmail: string;
  loginEmail: string;
  loginPassword: string;
  authLoading: boolean;
  authError: string | null;
  loading: boolean;
  pageError: string | null;
  summary: DashboardSummaryResponse | null;
  dashboardState: DashboardState;
  chartPeriod: TrendPeriod;
  onChartPeriodChange: (value: TrendPeriod) => void;
  onLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onLogout: () => void;
  onRefresh: () => void | Promise<void>;
}) {
  const isAuthenticated = authToken.trim().length > 0;
  const t = dashboardCopy[locale];
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
      [string, { checked_at: string | null; age_seconds: number | null }]
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
      action: ReactNode;
      className?: string;
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
        className: "dashboard-summary-card dashboard-summary-card--secondary dashboard-summary-card--snapshot",
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
        className: "dashboard-summary-card dashboard-summary-card--secondary dashboard-summary-card--queue",
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
        className: "dashboard-summary-card dashboard-summary-card--primary",
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
        className: "dashboard-summary-card dashboard-summary-card--attention",
      },
    ],
    [locale, summary, t, totalRecentInquiryCount],
  );

  const backgroundTasks = useMemo<BackgroundTask[]>(() => {
    const raw = summary?.raw_metrics;
    const importStatus = raw?.last_import_status?.status || null;
    const mirrorStatus = raw?.last_mirror_status?.status || null;
    const deployStatus = raw?.last_deploy_health_status?.deploy_status || raw?.last_deploy_health_status?.health_status || null;
    const tasks: BackgroundTask[] = [];

    if (raw?.last_import_status) {
      tasks.push({
        key: "import",
        title: t.taskImport,
        detail: `${t.latestTask}: ${prettyDate(raw.last_import_status.checked_at || null, locale)}`,
        meta: `${t.status}: ${compactValue(importStatus, t.taskUnknown)} · ${t.rows}: ${String(raw.last_import_status.rows_total || 0)}`,
        status: importStatus,
        icon: "imports",
        tone: taskTone(importStatus),
        href: "/admin/imports",
        actionLabel: t.openImports,
      });
    }

    if (raw?.last_mirror_status) {
      tasks.push({
        key: "mirror",
        title: t.taskMirror,
        detail: `${t.latestTask}: ${prettyDate(raw.last_mirror_status.checked_at || null, locale)}`,
        meta: `${t.status}: ${compactValue(mirrorStatus, t.taskUnknown)} · ${t.warnings}: ${String(raw.last_mirror_status.failures_count || 0)}`,
        status: mirrorStatus,
        icon: "media",
        tone: taskTone(mirrorStatus),
        href: "/admin/media",
        actionLabel: t.openMedia,
      });
    }

    if (raw?.last_deploy_health_status) {
      tasks.push({
        key: "deploy",
        title: t.taskDeploy,
        detail: `${t.latestTask}: ${prettyDate(raw.last_deploy_health_status.deploy_checked_at || null, locale)}`,
        meta: `${t.taskSource}: ${compactValue(raw.last_deploy_health_status.source, t.unknownValue)} · ${t.taskBuild}: ${compactValue(
          raw.last_deploy_health_status.build_sha?.slice(0, 7),
          t.unknownValue,
        )}`,
        status: deployStatus,
        icon: "refresh",
        tone: taskTone(deployStatus),
        href: "/admin/seo",
        actionLabel: t.openSeo,
      });
    }

    return tasks;
  }, [locale, summary, t]);

  const warningCount = summary?.warnings?.length || 0;
  const incompleteWidgetCount = summary?.incomplete_widget_count || 0;
  const overallTone = useMemo<BackgroundTask["tone"]>(() => {
    if (dashboardState === "error" || Boolean(pageError) || backgroundTasks.some((task) => task.tone === "error")) {
      return "error";
    }
    if (warningCount > 0 || incompleteWidgetCount > 0 || backgroundTasks.some((task) => task.tone === "warn")) {
      return "warn";
    }
    if (isAuthenticated) {
      return "ok";
    }
    return "info";
  }, [backgroundTasks, dashboardState, incompleteWidgetCount, isAuthenticated, pageError, warningCount]);

  const latestOperationalTimestamp = summary?.generated_at || summary?.raw_metrics?.recent_inquiries?.latest_at || null;
  const latestOperationalLabel = latestOperationalTimestamp ? prettyDate(latestOperationalTimestamp, locale) : t.noSnapshotYet;

  function renderRefreshButton(label?: string) {
    return (
      <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void onRefresh()} disabled={loading}>
        {loading ? t.loading : label || t.refresh}
      </AdminButton>
    );
  }

  function renderSectionState(emptyTitle: string, emptyBody: string) {
    return (
      <DashboardSectionState
        tone="empty"
        title={emptyTitle}
        body={emptyBody}
        action={renderRefreshButton(t.retry)}
      />
    );
  }

  function renderLockedOverviewPanel() {
    return (
      <div className="dashboard-locked-overview" role="status" aria-live="polite">
        <div className="dashboard-locked-overview__main">
          <span className="dashboard-section-state__icon" aria-hidden="true">
            <AdminIcon name="workspace" size={18} />
          </span>
          <div className="dashboard-locked-overview__copy">
            <h2>{t.workspaceLockedTitle}</h2>
            <p className="locale-safe">{t.overviewLockedBody}</p>
          </div>
        </div>
        <div className="dashboard-locked-overview__facts">
          <div className="dashboard-locked-overview__fact">
            <span>{t.status}</span>
            <AdminBadge tone="info" icon="workspace">
              {t.loginTitle}
            </AdminBadge>
          </div>
          <div className="dashboard-locked-overview__fact">
            <span>{t.lastUpdated}</span>
            <strong>{t.noSnapshotYet}</strong>
          </div>
          <div className="dashboard-locked-overview__fact">
            <span>{t.widgets}</span>
            <strong>{WIDGET_KEYS.length}</strong>
          </div>
        </div>
      </div>
    );
  }

  function renderLockedSectionPreview(detail: string) {
    return (
      <article className="dashboard-locked-preview" role="status" aria-live="polite">
        <div className="dashboard-locked-preview__head">
          <span className="dashboard-operational-card__label">{t.status}</span>
          <AdminBadge tone="info" icon="workspace">
            {t.loginTitle}
          </AdminBadge>
        </div>
        <strong className="dashboard-locked-preview__title">{t.workspaceLockedTitle}</strong>
        <p className="locale-safe">{detail}</p>
        <div className="dashboard-locked-preview__meta">
          <span>{t.lastUpdated}</span>
          <strong>{t.noSnapshotYet}</strong>
        </div>
      </article>
    );
  }

  function renderOperationalIdleCard({
    title,
    value,
    detail,
    updatedAt,
    action,
    statusTone = "info",
    statusLabel = t.refreshRequired,
  }: {
    title: string;
    value: string;
    detail: string;
    updatedAt: string;
    action: ReactNode;
    statusTone?: BackgroundTask["tone"];
    statusLabel?: string;
  }) {
    return (
      <article className="dashboard-operational-card" role="status" aria-live="polite">
        <div className="dashboard-operational-card__head">
          <div className="dashboard-operational-card__heading">
            <span className="dashboard-operational-card__label">{title}</span>
            <strong className="dashboard-operational-card__value">{value}</strong>
          </div>
          <AdminBadge tone={badgeTone(statusTone)} icon={badgeIcon(statusTone)}>
            {statusLabel}
          </AdminBadge>
        </div>
        <dl className="dashboard-operational-card__meta">
          <div>
            <dt>{t.lastUpdated}</dt>
            <dd>{updatedAt}</dd>
          </div>
          <div>
            <dt>{t.metricValue}</dt>
            <dd>{detail}</dd>
          </div>
        </dl>
        <div className="dashboard-operational-card__actions">{action}</div>
      </article>
    );
  }

  function renderHeroToolbar() {
    if (!isAuthenticated) {
      return (
        <div className="dashboard-hero-toolbar dashboard-hero-toolbar--locked">
          <div className="dashboard-hero-toolbar__item">
            <span className="dashboard-hero-toolbar__label">{t.status}</span>
            <AdminBadge tone="info" icon="workspace">
              {t.loginTitle}
            </AdminBadge>
          </div>
          <div className="dashboard-hero-toolbar__item">
            <span className="dashboard-hero-toolbar__label">{t.lastUpdated}</span>
            <strong>{t.noSnapshotYet}</strong>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-hero-toolbar">
        <div className="dashboard-hero-toolbar__item">
          <span className="dashboard-hero-toolbar__label">{t.status}</span>
          <AdminBadge tone={badgeTone(overallTone)} icon={badgeIcon(overallTone)}>
            {toneLabel(overallTone, t)}
          </AdminBadge>
        </div>
        <div className="dashboard-hero-toolbar__item">
          <span className="dashboard-hero-toolbar__label">{t.lastUpdated}</span>
          <strong>{latestOperationalLabel}</strong>
        </div>
        <div className="dashboard-hero-toolbar__item dashboard-hero-toolbar__item--actions">
          <span className="dashboard-hero-toolbar__label">{t.quickActions}</span>
          <div className="dashboard-hero-toolbar__actions">
            {renderRefreshButton()}
            <Link
              className={adminButtonClassName({ variant: "secondary", size: "sm" })}
              href={withAdminLocale("/admin/inquiries", locale)}
            >
              {t.openCrm}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function renderOverviewPanel() {
    if (!isAuthenticated) {
      return renderLockedOverviewPanel();
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
      return renderOperationalIdleCard({
        title: t.generatedAt,
        value: latestOperationalLabel,
        detail: `${WIDGET_KEYS.length} · ${t.snapshot}`,
        updatedAt: latestOperationalLabel,
        action: renderRefreshButton(),
        statusTone: overallTone,
        statusLabel: toneLabel(overallTone, t),
      });
    }

    if (dashboardState === "empty") {
      return renderSectionState(t.overviewEmptyTitle, t.overviewEmptyBody);
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
            className={item.className ?? "dashboard-summary-card"}
          />
        ))}
      </div>
    );
  }

  function renderWidgetsPanel() {
    if (!isAuthenticated) {
      return renderLockedSectionPreview(t.widgetsLockedBody);
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
      return renderOperationalIdleCard({
        title: t.widgets,
        value: String(WIDGET_KEYS.length),
        detail: t.widgetsHint,
        updatedAt: latestOperationalLabel,
        action: renderRefreshButton(),
      });
    }

    if (widgets.length === 0) {
      return renderSectionState(t.widgetsEmptyTitle, t.widgetsEmptyBody);
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
      return renderLockedSectionPreview(t.insightsLockedBody);
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
      return renderOperationalIdleCard({
        title: t.insightsTitle,
        value: freshnessEntries.length > 0 ? String(freshnessEntries.length) : t.unknownValue,
        detail: t.insightsHint,
        updatedAt: latestOperationalLabel,
        action: renderRefreshButton(),
      });
    }

    if (freshnessEntries.length === 0) {
      return renderSectionState(t.insightsEmptyTitle, t.insightsEmptyBody);
    }

    return (
      <ul className="dashboard-insight-list">
        {freshnessEntries.map(([key, item]) => {
          const statusTone = freshnessTone(item.age_seconds);
          return (
            <li key={key} className="dashboard-insight-item">
              <div className="dashboard-insight-copy">
                <strong>{humanizeMetricKey(key)}</strong>
                <p>
                  {t.checkedAt}: {prettyDate(item.checked_at, locale)}
                </p>
              </div>
              <div className="dashboard-insight-item__status">
                <AdminBadge tone={badgeTone(statusTone)} icon={badgeIcon(statusTone)}>
                  {toneLabel(statusTone, t)}
                </AdminBadge>
                <span className="dashboard-insight-age">{formatAge(item.age_seconds, locale, t.unknownValue)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  function renderTrendPanel() {
    if (!isAuthenticated) {
      return renderLockedSectionPreview(t.trendLockedBody);
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
      return renderOperationalIdleCard({
        title: t.trendTitle,
        value: chartPeriod === "7d" ? t.trendPeriod7d : t.trendPeriod30d,
        detail: t.trendHint,
        updatedAt: latestOperationalLabel,
        action: renderRefreshButton(),
      });
    }

    if (!hasTrendData(trendPoints)) {
      return <DashboardSectionState tone="empty" title={t.trendEmptyTitle} body={t.trendEmptyBody} />;
    }

    return <DashboardTrendChart points={trendPoints} locale={locale} period={chartPeriod} />;
  }

  function renderWarningsPanel() {
    if (!isAuthenticated) {
      return renderLockedSectionPreview(t.watchlistLockedBody);
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
      return renderOperationalIdleCard({
        title: t.warnings,
        value: summary ? String(summary.warnings.length) : t.unknownValue,
        detail: t.watchlistHint,
        updatedAt: latestOperationalLabel,
        action: renderRefreshButton(t.reviewWatchlist),
        statusTone: (summary?.warnings?.length || 0) > 0 ? "warn" : "info",
        statusLabel: (summary?.warnings?.length || 0) > 0 ? t.warningStatus : t.refreshRequired,
      });
    }

    if ((summary?.warnings || []).length === 0) {
      return renderSectionState(t.warningsEmptyTitle, t.warningsEmptyBody);
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
      return renderLockedSectionPreview(t.logsLockedBody);
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
      return renderOperationalIdleCard({
        title: t.recentInquiries,
        value: summary ? String(totalRecentInquiryCount) : t.unknownValue,
        detail: t.recentInquiriesHint,
        updatedAt: summary?.raw_metrics?.recent_inquiries?.latest_at
          ? prettyDate(summary.raw_metrics.recent_inquiries.latest_at, locale)
          : t.noSnapshotYet,
        action: (
          <Link className={adminButtonClassName({ variant: "secondary", size: "sm" })} href={withAdminLocale("/admin/inquiries", locale)}>
            {t.openCrm}
          </Link>
        ),
      });
    }

    if (totalRecentInquiryCount === 0) {
      return renderSectionState(t.recentInquiriesEmptyTitle, t.recentInquiriesEmptyBody);
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
      return renderLockedSectionPreview(t.tasksLockedBody);
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
      return renderOperationalIdleCard({
        title: t.backgroundTasksTitle,
        value: backgroundTasks.length > 0 ? String(backgroundTasks.length) : t.unknownValue,
        detail: t.backgroundTasksHint,
        updatedAt: latestOperationalLabel,
        action: renderRefreshButton(),
        statusTone: overallTone,
        statusLabel: toneLabel(overallTone, t),
      });
    }

    if (backgroundTasks.length === 0) {
      return renderSectionState(t.backgroundTasksEmptyTitle, t.backgroundTasksEmptyBody);
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
                {taskLabel(task.status, t)}
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

  return (
    <AdminPage busy={loading}>
      <AdminPageHeader
        className="dashboard-hero"
        icon="dashboard"
        eyebrow={locale === "th" ? "สุขภาพระบบ" : "System health"}
        title={t.title}
        description={t.subtitle}
        actions={renderHeroToolbar()}
      />

      <AdminPageBody>
        <section className="dashboard-overview-band" aria-label={locale === "th" ? "ภาพรวมปฏิบัติการ" : "Operational overview"}>
          {renderOverviewPanel()}
        </section>

        <AdminSectionGrid className={isAuthenticated ? "dashboard-shell-grid" : "dashboard-shell-grid dashboard-shell-grid--locked"}>
          <div className="dashboard-zone dashboard-zone--primary">
            <DashboardSection
              title={t.widgets}
              subtitle={t.widgetsHint}
              className="dashboard-section--widgets dashboard-section--primary"
              icon="dashboard"
            >
              {renderWidgetsPanel()}
            </DashboardSection>

            <DashboardControlCenter
              t={t}
              locale={locale}
              isAuthenticated={isAuthenticated}
              authEmail={authEmail}
              loginEmail={loginEmail}
              loginPassword={loginPassword}
              authLoading={authLoading}
              authError={authError}
              overallTone={overallTone}
              latestOperationalLabel={latestOperationalLabel}
              onLoginEmailChange={onLoginEmailChange}
              onLoginPasswordChange={onLoginPasswordChange}
              onLogin={onLogin}
              onLogout={onLogout}
              refreshAction={renderRefreshButton()}
            />
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
              actions={
                <AdminTabSwitch
                  ariaLabel={t.trendTitle}
                  className="dashboard-period-toggle"
                  value={chartPeriod}
                  onChange={(value) => onChartPeriodChange(value as TrendPeriod)}
                  options={[
                    { value: "7d", label: t.trendPeriod7d, disabled: loading },
                    { value: "30d", label: t.trendPeriod30d, disabled: loading },
                  ]}
                />
              }
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
        </AdminSectionGrid>
      </AdminPageBody>
    </AdminPage>
  );
}
