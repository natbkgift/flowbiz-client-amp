import Link from "next/link";

import { type AdminLocale, withAdminLocale } from "@/app/_lib/admin-i18n";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { AdminBadge, adminButtonClassName } from "@/components/admin/AdminPrimitives";

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

type DashboardRawMetrics = {
  project_cover_coverage?: {
    checked_at?: string | null;
    projects_total?: number | null;
    projects_real_cover_count?: number | null;
    projects_real_cover_pct?: number | null;
    projects_external_cover_count?: number | null;
    projects_missing_cover_count?: number | null;
  };
  media_integrity?: {
    scanned_at?: string | null;
    broken_media_count?: number | null;
    external_image_leakage_count?: number | null;
    error_count?: number | null;
    warn_count?: number | null;
  };
  pending_translations?: {
    total_pending_translations?: number | null;
    policy?: {
      approved?: boolean | null;
      checked_at?: string | null;
    };
    areas_missing_en_th?: number | null;
    developers_missing_en_th?: number | null;
    projects_missing_en_th?: number | null;
    articles_missing_en_th?: number | null;
    home_composer_missing_locale_pairs?: number | null;
  };
  unpublished_drafts?: {
    total_unpublished_drafts?: number | null;
    projects_draft?: number | null;
    areas_draft?: number | null;
    articles_draft?: number | null;
    testimonials_draft?: number | null;
    home_composer_draft?: number | null;
    marketplace_items_draft?: number | null;
  };
  recent_inquiries?: {
    count?: number | null;
    latest_at?: string | null;
  };
  review_video_source_verification_pending?: {
    total_pending?: number | null;
    reviews_pending?: number | null;
    videos_pending?: number | null;
  };
  last_import_status?: {
    status?: string | null;
    checked_at?: string | null;
    rows_total?: number | null;
    rows_errors?: number | null;
    filename?: string | null;
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

type WidgetPresentation = {
  primaryValue: string;
  secondaryValue?: string;
  pills?: string[];
  details?: string[];
};

const copy = {
  en: {
    statusOk: "OK",
    statusWarn: "Warning",
    statusError: "Error",
    statusUnknown: "Unknown",
    covered: "Covered",
    broken: "Broken",
    missing: "Missing",
    external: "External",
    scanned: "Scanned",
    reviews: "Reviews",
    videos: "Videos",
    policy: "Policy",
    entities: "Entities",
    drafts: "Drafts",
    warnings: "Warnings",
    latest: "Latest",
    import: "Import",
    mirror: "Mirror",
    health: "Health",
    deploy: "Deploy",
    rows: "Rows",
    errors: "Errors",
    failures: "Failures",
    build: "Build",
    source: "Source",
    approved: "Approved",
    draft: "Draft",
    healthy: "Healthy",
    attention: "Attention",
    unknown: "Unknown",
    projects: "Projects",
    articles: "Articles",
    homeComposer: "Home composer",
    translationBreakdown: "Translation gaps",
  },
  th: {
    statusOk: "ปกติ",
    statusWarn: "เตือน",
    statusError: "ผิดพลาด",
    statusUnknown: "ไม่ทราบ",
    covered: "มี cover",
    broken: "เสีย",
    missing: "ขาด cover",
    external: "ภายนอก",
    scanned: "สแกนล่าสุด",
    reviews: "รีวิว",
    videos: "วิดีโอ",
    policy: "นโยบาย",
    entities: "รายการ",
    drafts: "ฉบับร่าง",
    warnings: "คำเตือน",
    latest: "ล่าสุด",
    import: "Import",
    mirror: "Mirror",
    health: "Health",
    deploy: "Deploy",
    rows: "แถว",
    errors: "ข้อผิดพลาด",
    failures: "ล้มเหลว",
    build: "Build",
    source: "Source",
    approved: "อนุมัติแล้ว",
    draft: "ยังไม่อนุมัติ",
    healthy: "ปกติ",
    attention: "ต้องตรวจ",
    unknown: "ไม่ทราบ",
    projects: "โปรเจกต์",
    articles: "บทความ",
    homeComposer: "โฮมคอมโพสเซอร์",
    translationBreakdown: "รายการที่ยังขาดคำแปล",
  },
} as const;

function prettyDate(value: string | null | undefined, locale: AdminLocale): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCount(value: number | null | undefined, locale: AdminLocale, fallback: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US").format(value);
}

function formatPercent(value: number | null | undefined, locale: AdminLocale, fallback: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const rounded = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
  return `${new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US").format(Number(rounded))}%`;
}

function formatTextValue(value: DashboardWidget["value"], fallback: string): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : fallback;
  if (typeof value === "string") return value.trim() || fallback;
  return fallback;
}

function statusClass(status: WidgetStatus): string {
  return `dashboard-status dashboard-status-${status}`;
}

function statusIcon(status: WidgetStatus): AdminIconName {
  if (status === "ok") return "success";
  if (status === "warn") return "warning";
  if (status === "error") return "x";
  return "info";
}

function statusLabel(status: WidgetStatus, locale: AdminLocale): string {
  const ui = copy[locale];
  if (status === "ok") return ui.statusOk;
  if (status === "warn") return ui.statusWarn;
  if (status === "error") return ui.statusError;
  return ui.statusUnknown;
}

function widgetIcon(key: string): AdminIconName {
  if (key.includes("cover")) return "media";
  if (key.includes("media")) return "media";
  if (key.includes("translation")) return "language";
  if (key.includes("draft")) return "blog";
  if (key.includes("inquiries")) return "message";
  if (key.includes("video")) return "videos";
  if (key.includes("import")) return "imports";
  if (key.includes("deploy")) return "refresh";
  return "dashboard";
}

function formatStatusWord(
  value: string | null | undefined,
  locale: AdminLocale,
  fallback: string,
): string {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === "ok") return locale === "th" ? "OK" : "OK";
  if (normalized === "failed") return locale === "th" ? "FAILED" : "FAILED";
  if (normalized === "partial") return locale === "th" ? "PARTIAL" : "PARTIAL";
  if (normalized === "unknown") return fallback;
  return normalized.toUpperCase();
}

function compactBuildSha(value: string | null | undefined): string | null {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.slice(0, 7);
}

function createPresentation(
  widget: DashboardWidget,
  rawMetrics: DashboardRawMetrics,
  locale: AdminLocale,
  fallback: string,
): WidgetPresentation {
  const ui = copy[locale];

  if (widget.key === "project_cover_coverage") {
    const metric = rawMetrics.project_cover_coverage;
    return {
      primaryValue: formatPercent(
        typeof widget.value === "number" ? widget.value : metric?.projects_real_cover_pct,
        locale,
        fallback,
      ),
      secondaryValue:
        metric && typeof metric.projects_total === "number"
          ? `${ui.covered} ${formatCount(metric.projects_real_cover_count, locale, fallback)} / ${formatCount(metric.projects_total, locale, fallback)}`
          : undefined,
      details: [
        `${ui.missing}: ${formatCount(metric?.projects_missing_cover_count, locale, fallback)}`,
        `${ui.external}: ${formatCount(metric?.projects_external_cover_count, locale, fallback)}`,
      ],
    };
  }

  if (widget.key === "broken_media_count") {
    const metric = rawMetrics.media_integrity;
    return {
      primaryValue: formatCount(
        typeof widget.value === "number" ? widget.value : metric?.broken_media_count,
        locale,
        fallback,
      ),
      details: [
        `${ui.errors}: ${formatCount(metric?.error_count, locale, fallback)}`,
        `${ui.warnings}: ${formatCount(metric?.warn_count, locale, fallback)}`,
        `${ui.scanned}: ${prettyDate(metric?.scanned_at, locale) || fallback}`,
      ],
    };
  }

  if (widget.key === "external_image_leakage_count") {
    const metric = rawMetrics.media_integrity;
    return {
      primaryValue: formatCount(
        typeof widget.value === "number" ? widget.value : metric?.external_image_leakage_count,
        locale,
        fallback,
      ),
      details: [
        `${ui.broken}: ${formatCount(metric?.broken_media_count, locale, fallback)}`,
        `${ui.scanned}: ${prettyDate(metric?.scanned_at, locale) || fallback}`,
      ],
    };
  }

  if (widget.key === "pending_translations_count") {
    const metric = rawMetrics.pending_translations;
    return {
      primaryValue: formatCount(
        typeof widget.value === "number" ? widget.value : metric?.total_pending_translations,
        locale,
        fallback,
      ),
      secondaryValue:
        metric?.policy?.approved === true
          ? ui.approved
          : ui.draft,
      details: [
        `${ui.translationBreakdown}: ${formatCount(metric?.projects_missing_en_th, locale, fallback)} ${ui.projects} / ${formatCount(metric?.articles_missing_en_th, locale, fallback)} ${ui.articles}`,
        `${ui.homeComposer}: ${formatCount(metric?.home_composer_missing_locale_pairs, locale, fallback)}`,
      ],
    };
  }

  if (widget.key === "unpublished_drafts_count") {
    const metric = rawMetrics.unpublished_drafts;
    return {
      primaryValue: formatCount(
        typeof widget.value === "number" ? widget.value : metric?.total_unpublished_drafts,
        locale,
        fallback,
      ),
      details: [
        `${ui.projects}: ${formatCount(metric?.projects_draft, locale, fallback)}`,
        `${ui.articles}: ${formatCount(metric?.articles_draft, locale, fallback)}`,
        `${ui.homeComposer}: ${formatCount(metric?.home_composer_draft, locale, fallback)}`,
      ],
    };
  }

  if (widget.key === "recent_leads_inquiries") {
    const metric = rawMetrics.recent_inquiries;
    return {
      primaryValue: formatCount(
        typeof widget.value === "number" ? widget.value : metric?.count,
        locale,
        fallback,
      ),
      details: [`${ui.latest}: ${prettyDate(metric?.latest_at, locale) || fallback}`],
    };
  }

  if (widget.key === "review_video_source_verification_pending") {
    const metric = rawMetrics.review_video_source_verification_pending;
    return {
      primaryValue: formatCount(
        typeof widget.value === "number" ? widget.value : metric?.total_pending,
        locale,
        fallback,
      ),
      pills: [
        `${ui.reviews}: ${formatCount(metric?.reviews_pending, locale, fallback)}`,
        `${ui.videos}: ${formatCount(metric?.videos_pending, locale, fallback)}`,
      ],
    };
  }

  if (widget.key === "last_import_mirror_status") {
    const importMetric = rawMetrics.last_import_status;
    const mirrorMetric = rawMetrics.last_mirror_status;
    const overall =
      widget.status === "ok"
        ? ui.healthy
        : widget.status === "unknown"
          ? ui.unknown
          : ui.attention;
    return {
      primaryValue: overall,
      pills: [
        `${ui.import}: ${formatStatusWord(importMetric?.status, locale, fallback)}`,
        `${ui.mirror}: ${formatStatusWord(mirrorMetric?.status, locale, fallback)}`,
      ],
      details: [
        `${ui.rows}: ${formatCount(importMetric?.rows_total, locale, fallback)}`,
        `${ui.errors}: ${formatCount(importMetric?.rows_errors, locale, fallback)}`,
        `${ui.failures}: ${formatCount(mirrorMetric?.failures_count, locale, fallback)}`,
      ],
    };
  }

  if (widget.key === "last_deploy_health_status") {
    const metric = rawMetrics.last_deploy_health_status;
    const overall =
      widget.status === "ok"
        ? ui.healthy
        : widget.status === "unknown"
          ? ui.unknown
          : ui.attention;
    return {
      primaryValue: overall,
      pills: [
        `${ui.health}: ${formatStatusWord(metric?.health_status, locale, fallback)}`,
        `${ui.deploy}: ${formatStatusWord(metric?.deploy_status, locale, fallback)}`,
      ],
      details: [
        `${ui.build}: ${compactBuildSha(metric?.build_sha) || fallback}`,
        `${ui.source}: ${String(metric?.source || fallback)}`,
      ],
    };
  }

  return {
    primaryValue: formatTextValue(widget.value, fallback),
  };
}

export function DashboardKpiWidgets({
  widgets,
  rawMetrics,
  locale,
  fallback,
}: {
  widgets: DashboardWidget[];
  rawMetrics?: Record<string, unknown> | null;
  locale: AdminLocale;
  fallback: string;
}) {
  const metricMap = (rawMetrics || {}) as DashboardRawMetrics;

  return (
    <div className="dashboard-grid dashboard-kpi-grid">
      {widgets.map((widget) => {
        const presentation = createPresentation(widget, metricMap, locale, fallback);
        return (
          <article
            key={widget.key}
            className={`card dashboard-widget dashboard-kpi-card dashboard-kpi-card--${widget.status}`}
          >
            <header className="dashboard-widget-head">
              <div className="dashboard-widget-title">
                <span className="dashboard-widget-title-icon" aria-hidden="true">
                  <AdminIcon name={widgetIcon(widget.key)} size={16} />
                </span>
                <h3>{widget.title}</h3>
              </div>
              <AdminBadge
                tone={widget.status === "ok" ? "ok" : widget.status === "warn" ? "warn" : widget.status === "error" ? "error" : "neutral"}
                icon={statusIcon(widget.status)}
                className={statusClass(widget.status)}
              >
                {statusLabel(widget.status, locale)}
              </AdminBadge>
            </header>

            <div className="dashboard-kpi-value-block">
              <p className="dashboard-widget-value">{presentation.primaryValue}</p>
              {presentation.secondaryValue ? (
                <p className="dashboard-kpi-secondary">{presentation.secondaryValue}</p>
              ) : null}
            </div>

            {(presentation.pills || []).length > 0 ? (
              <div className="dashboard-kpi-pill-row">
                {(presentation.pills || []).map((item) => (
                  <span key={`${widget.key}-${item}`} className="dashboard-kpi-pill">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            {(presentation.details || []).length > 0 ? (
              <ul className="dashboard-kpi-detail-list">
                {(presentation.details || []).map((item) => (
                  <li key={`${widget.key}-${item}`}>{item}</li>
                ))}
              </ul>
            ) : null}

            <p className="locale-safe">{widget.summary}</p>

            <div className="dashboard-widget-actions">
              {(widget.actions || []).map((action, index) => (
                <Link
                  key={`${widget.key}-${action.url}-${index}`}
                  className={adminButtonClassName({ variant: "secondary", size: "sm" })}
                  href={withAdminLocale(action.url, locale)}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
