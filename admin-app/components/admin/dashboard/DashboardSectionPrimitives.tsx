import { type ReactNode, useId } from "react";

import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { MetricCard } from "@/components/admin/AdminPrimitives";

function joinClasses(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

export function DashboardSection({
  title,
  subtitle,
  actions,
  icon = "dashboard",
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: AdminIconName;
  className?: string;
  children: ReactNode;
}) {
  const headingId = useId();
  const subtitleId = useId();

  return (
    <MetricCard
      className={joinClasses("dashboard-section", className)}
      title={<span id={headingId}>{title}</span>}
      description={subtitle ? <p id={subtitleId}>{subtitle}</p> : undefined}
      icon={icon}
      actions={actions}
      titleTag="h2"
      sectionProps={{
        "aria-labelledby": headingId,
        "aria-describedby": subtitle ? subtitleId : undefined,
      }}
    >
      <div className="dashboard-section-body">{children}</div>
    </MetricCard>
  );
}

export function DashboardSectionState({
  tone = "info",
  title,
  body,
  action,
}: {
  tone?: "empty" | "error" | "info";
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={joinClasses("dashboard-section-state", `dashboard-section-state--${tone}`)}
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <span className="dashboard-section-state__icon" aria-hidden="true">
        <AdminIcon name={tone === "error" ? "x" : tone === "empty" ? "info" : "spark"} size={18} />
      </span>
      <h3>{title}</h3>
      <p className="locale-safe">{body}</p>
      {action ? <div className="dashboard-section-actions">{action}</div> : null}
    </div>
  );
}

export function DashboardMetricSkeletonRow({ cards = 4 }: { cards?: number }) {
  return (
    <div className="dashboard-summary-grid dashboard-summary-grid--skeleton" aria-hidden="true">
      {Array.from({ length: cards }).map((_, index) => (
        <article key={index} className="dashboard-summary-card dashboard-summary-card--skeleton">
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--text" />
        </article>
      ))}
    </div>
  );
}

export function DashboardWidgetSkeletonGrid({ cards = 6 }: { cards?: number }) {
  return (
    <div className="dashboard-grid dashboard-grid--skeleton" aria-hidden="true">
      {Array.from({ length: cards }).map((_, index) => (
        <article key={index} className="card dashboard-widget dashboard-widget--skeleton">
          <div className="dashboard-widget-head">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--text" />
          </div>
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--text" />
          <div className="dashboard-widget-actions">
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function DashboardInsightSkeletonList({ items = 4 }: { items?: number }) {
  return (
    <div className="dashboard-insight-list" aria-hidden="true">
      {Array.from({ length: items }).map((_, index) => (
        <article key={index} className="dashboard-insight-item dashboard-insight-item--skeleton">
          <div className="dashboard-insight-copy">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--text" />
          </div>
          <div className="skeleton skeleton--text" />
        </article>
      ))}
    </div>
  );
}

export function DashboardTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="dashboard-table-skeleton" aria-hidden="true">
      <div className="dashboard-table-skeleton-row dashboard-table-skeleton-row--head">
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="dashboard-table-skeleton-row">
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text" />
        </div>
      ))}
    </div>
  );
}
