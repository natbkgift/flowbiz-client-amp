import {
  createElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { AdminBadge, type AdminTone } from "@/components/admin/feedback/AdminBadge";
import { cx } from "@/components/admin/lib/cx";

type AdminCardTone = Exclude<AdminTone, "neutral"> | "neutral";
type AdminCardTitleTag = "div" | "h2" | "h3";

type AdminCardShellProps = {
  title?: ReactNode;
  description?: ReactNode;
  icon?: AdminIconName;
  meta?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  titleTag?: AdminCardTitleTag;
  tone?: AdminCardTone;
  surface?: "metric" | "action" | "log";
  sectionProps?: Omit<ComponentPropsWithoutRef<"section">, "children" | "className"> & {
    className?: string;
  };
  children: ReactNode;
};

function toneIcon(tone: AdminCardTone): AdminIconName {
  if (tone === "ok") return "success";
  if (tone === "warn") return "warning";
  if (tone === "error") return "x";
  if (tone === "info") return "info";
  return "spark";
}

function toneLabel(tone: AdminCardTone): string {
  if (tone === "ok") return "Stable";
  if (tone === "warn") return "Watch";
  if (tone === "error") return "Blocked";
  if (tone === "info") return "Live";
  return "Ready";
}

function AdminCardShell({
  title,
  description,
  icon = "info",
  meta,
  actions,
  footer,
  className,
  bodyClassName,
  titleTag = "h3",
  tone = "neutral",
  surface = "metric",
  sectionProps,
  children,
}: AdminCardShellProps) {
  const { className: sectionClassName, ...restSectionProps } = sectionProps ?? {};
  const titleNode = title
    ? createElement(
        titleTag,
        {
          className:
            titleTag === "h2"
              ? "admin-card-shell__title admin-type-section-title"
              : "admin-card-shell__title admin-type-card-title",
        },
        title,
      )
    : null;

  return (
    <section
      {...restSectionProps}
      className={cx(
        "card",
        "admin-card-shell",
        `admin-card-shell--${surface}`,
        `admin-card-shell--${tone}`,
        sectionClassName,
        className,
      )}
    >
      {title || description || meta || actions ? (
        <header className="admin-card-shell__header">
          <div className="admin-card-shell__header-main">
            <span className="admin-card-shell__icon" aria-hidden="true">
              <AdminIcon name={icon} size={18} />
            </span>
            <div className="admin-card-shell__heading">
              {titleNode}
              {description ? <div className="admin-card-shell__description admin-type-body locale-safe">{description}</div> : null}
              {meta ? <div className="admin-card-shell__meta">{meta}</div> : null}
            </div>
          </div>
          {actions ? <div className="admin-card-shell__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx("admin-card-shell__body", bodyClassName)}>{children}</div>
      {footer ? <footer className="admin-card-shell__footer">{footer}</footer> : null}
    </section>
  );
}

export function MetricCard({
  title,
  description,
  icon = "dashboard",
  meta,
  actions,
  footer,
  className,
  bodyClassName,
  titleTag = "h3",
  tone = "neutral",
  sectionProps,
  children,
}: Omit<AdminCardShellProps, "surface">) {
  return (
    <AdminCardShell
      title={title}
      description={description}
      icon={icon}
      meta={meta}
      actions={actions}
      footer={footer}
      className={cx("metric-card", className)}
      bodyClassName={bodyClassName}
      titleTag={titleTag}
      tone={tone}
      surface="metric"
      sectionProps={sectionProps}
    >
      {children}
    </AdminCardShell>
  );
}

export function ActionCard({
  title,
  description,
  icon = "spark",
  meta,
  actions,
  footer,
  className,
  bodyClassName,
  titleTag = "h3",
  tone = "info",
  sectionProps,
  children,
}: Omit<AdminCardShellProps, "surface">) {
  return (
    <AdminCardShell
      title={title}
      description={description}
      icon={icon}
      meta={meta}
      actions={actions}
      footer={footer}
      className={cx("action-card", className)}
      bodyClassName={bodyClassName}
      titleTag={titleTag}
      tone={tone}
      surface="action"
      sectionProps={sectionProps}
    >
      {children}
    </AdminCardShell>
  );
}

export function LogCard({
  title,
  description,
  icon = "table",
  meta,
  actions,
  footer,
  className,
  bodyClassName,
  titleTag = "h3",
  tone = "neutral",
  sectionProps,
  children,
}: Omit<AdminCardShellProps, "surface">) {
  return (
    <AdminCardShell
      title={title}
      description={description}
      icon={icon}
      meta={meta}
      actions={actions}
      footer={footer}
      className={cx("log-card", className)}
      bodyClassName={bodyClassName}
      titleTag={titleTag}
      tone={tone}
      surface="log"
      sectionProps={sectionProps}
    >
      {children}
    </AdminCardShell>
  );
}

export function StatCard({
  title,
  value,
  metadata,
  action,
  badgeLabel,
  icon = "info",
  tone = "neutral",
  className,
}: {
  title: ReactNode;
  value: ReactNode;
  metadata?: ReactNode;
  action?: ReactNode;
  badgeLabel?: ReactNode;
  icon?: AdminIconName;
  tone?: AdminCardTone;
  className?: string;
}) {
  const footerNode = action ? (
    action
  ) : (
    <AdminBadge tone={tone === "neutral" ? "info" : tone} icon={toneIcon(tone)}>
      {badgeLabel ?? toneLabel(tone)}
    </AdminBadge>
  );

  return (
    <article className={cx("card", "admin-stat-card", `admin-stat-card--${tone}`, className)}>
      <div className="admin-stat-card__head">
        <div className="admin-stat-card__heading">
          <span className="admin-stat-card__label admin-type-label">{title}</span>
          {metadata ? <span className="admin-stat-card__meta admin-type-helper locale-safe">{metadata}</span> : null}
        </div>
        <span className="admin-stat-card__icon" aria-hidden="true">
          <AdminIcon name={icon} size={16} />
        </span>
      </div>
      <div className="admin-stat-card__body">
        <strong className="admin-stat-card__value">{value}</strong>
      </div>
      <div className="admin-stat-card__footer">{footerNode}</div>
    </article>
  );
}

export function AdminStatCard({
  label,
  value,
  detail,
  badgeLabel,
  icon = "info",
  tone = "info",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  badgeLabel?: ReactNode;
  icon?: AdminIconName;
  tone?: AdminTone;
  className?: string;
}) {
  return (
    <StatCard
      title={label}
      value={value}
      metadata={detail}
      badgeLabel={badgeLabel}
      icon={icon}
      tone={tone}
      className={className}
    />
  );
}
