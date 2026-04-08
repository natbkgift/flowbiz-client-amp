export type WidgetStatus = "ok" | "warn" | "error" | "unknown";

export type DashboardAction = {
  label: string;
  url: string;
};

export type DashboardWidget = {
  key: string;
  title: string;
  value: string | number | Record<string, unknown> | null;
  status: WidgetStatus;
  summary: string;
  actions: DashboardAction[];
};

export type RecentInquiry = {
  id: string;
  created_at: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  intent: string | null;
  source_page: string | null;
  sales_automation?: {
    priority_label?: string | null;
    next_follow_up_at?: string | null;
    response_channel?: string | null;
  };
};

export type FreshnessItem = {
  checked_at: string | null;
  age_seconds: number | null;
};

export type DashboardRawMetrics = Record<string, unknown> & {
  recent_inquiries?: {
    count?: number | null;
    latest_at?: string | null;
  };
  conversion_funnel?: {
    counts_7d?: Record<string, number> | null;
    counts_30d?: Record<string, number> | null;
    success_rate_7d?: number | null;
    submit_rate_7d?: number | null;
    error_rate_7d?: number | null;
    last_event_at?: string | null;
    top_source_route_7d?: string | null;
    top_lead_source_7d?: string | null;
    top_lead_tier_7d?: string | null;
    top_error_route_7d?: string | null;
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

export type DashboardSummaryResponse = {
  generated_at: string | null;
  data_freshness: Record<string, FreshnessItem>;
  raw_metrics: DashboardRawMetrics;
  widgets: DashboardWidget[];
  trend_series: Record<"7d" | "30d", Array<{ bucket_date: string; count: number }>>;
  recent_inquiries: RecentInquiry[];
  incomplete_widget_count: number;
  warnings: string[];
};

export type BackgroundTask = {
  key: string;
  title: string;
  detail: string;
  meta: string;
  status: string | null;
  icon: import("@/components/admin/AdminIcons").AdminIconName;
  tone: "info" | "ok" | "warn" | "error";
  href: string;
  actionLabel: string;
};

export const WIDGET_KEYS = [
  "project_cover_coverage",
  "broken_media_count",
  "external_image_leakage_count",
  "pending_translations_count",
  "unpublished_drafts_count",
  "recent_leads_inquiries",
  "conversion_funnel_health",
  "review_video_source_verification_pending",
  "last_import_mirror_status",
  "last_deploy_health_status",
] as const;
