import type { ReactNode } from "react";

function joinClasses(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

export function DashboardSection({
  title,
  subtitle,
  actions,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={joinClasses("card", "dashboard-section", className)} aria-label={title}>
      <header className="dashboard-section-head">
        <div className="dashboard-section-copy">
          <h2>{title}</h2>
          {subtitle ? <p className="locale-safe">{subtitle}</p> : null}
        </div>
        {actions ? <div className="dashboard-section-actions">{actions}</div> : null}
      </header>
      <div className="dashboard-section-body">{children}</div>
    </section>
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
