export type DashboardState = "idle" | "loading" | "error" | "empty" | "success";

export type DashboardStateEvent = "fetch_start" | "fetch_success" | "fetch_error" | "reset";

export type DashboardSummaryShape = {
  generated_at?: string | null;
  data_freshness?: Record<string, unknown> | null;
  raw_metrics?: Record<string, unknown> | null;
  widgets?: unknown[] | null;
  recent_inquiries?: unknown[] | null;
  warnings?: unknown[] | null;
  incomplete_widget_count?: number | null;
};

function hasRows(value: unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function hasDashboardContent(summary: DashboardSummaryShape | null | undefined): boolean {
  if (!summary) return false;
  if (hasRows(summary.widgets) || hasRows(summary.recent_inquiries) || hasRows(summary.warnings)) {
    return true;
  }
  if (typeof summary.incomplete_widget_count === "number" && summary.incomplete_widget_count > 0) {
    return true;
  }
  if (typeof summary.generated_at === "string" && summary.generated_at.trim().length > 0) {
    return true;
  }
  if (summary.data_freshness && Object.keys(summary.data_freshness).length > 0) {
    return true;
  }
  if (summary.raw_metrics && Object.keys(summary.raw_metrics).length > 0) {
    return true;
  }
  return false;
}

export function deriveDashboardStateFromSummary(
  summary: DashboardSummaryShape | null | undefined,
): "empty" | "success" {
  return hasDashboardContent(summary) ? "success" : "empty";
}

export function transitionDashboardState(
  current: DashboardState,
  event: DashboardStateEvent,
  summary?: DashboardSummaryShape | null,
): DashboardState {
  if (event === "reset") return "idle";
  if (event === "fetch_start") return "loading";
  if (event === "fetch_error") return "error";
  if (event === "fetch_success") return deriveDashboardStateFromSummary(summary);
  return current;
}
