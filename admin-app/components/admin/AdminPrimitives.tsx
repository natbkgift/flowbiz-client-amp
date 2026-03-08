import {
  createElement,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";

import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type AdminButtonSize = "sm" | "md";
export type AdminTone = "neutral" | "info" | "ok" | "warn" | "error";

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

export function adminButtonClassName({
  variant = "secondary",
  size = "md",
  block = false,
  className,
}: {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  block?: boolean;
  className?: string;
}) {
  return cx(
    "btn",
    "admin-button",
    `admin-button--${variant}`,
    `admin-button--${size}`,
    block && "admin-button--block",
    className,
  );
}

export function AdminButton({
  children,
  className,
  variant = "secondary",
  size = "md",
  block = false,
  icon,
  iconLabel,
  iconPosition = "start",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  block?: boolean;
  icon?: AdminIconName;
  iconLabel?: string;
  iconPosition?: "start" | "end";
}) {
  const iconNode = icon ? (
    <span
      className="admin-button__icon"
      aria-hidden={iconLabel ? undefined : "true"}
      {...(iconLabel ? { role: "img", "aria-label": iconLabel } : {})}
    >
      <AdminIcon name={icon} size={size === "sm" ? 15 : 16} />
    </span>
  ) : null;

  return (
    <button
      {...props}
      className={adminButtonClassName({ variant, size, block, className })}
    >
      {iconPosition === "start" ? iconNode : null}
      <span>{children}</span>
      {iconPosition === "end" ? iconNode : null}
    </button>
  );
}

export function AdminBadge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: AdminTone;
  icon?: AdminIconName;
  className?: string;
}) {
  return (
    <span className={cx("admin-badge", `admin-badge--${tone}`, className)}>
      {icon ? <AdminIcon name={icon} size={14} className="admin-badge__icon" /> : null}
      <span>{children}</span>
    </span>
  );
}

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
  icon = "info",
  tone = "neutral",
  className,
}: {
  title: ReactNode;
  value: ReactNode;
  metadata?: ReactNode;
  action?: ReactNode;
  icon?: AdminIconName;
  tone?: AdminCardTone;
  className?: string;
}) {
  const footerNode = action ? (
    action
  ) : (
    <AdminBadge tone={tone === "neutral" ? "info" : tone} icon={toneIcon(tone)}>
      {toneLabel(tone)}
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

export function AdminPageHeader({
  title,
  description,
  icon = "workspace",
  eyebrow = "Admin workspace",
  actions,
  meta,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: AdminIconName;
  eyebrow?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("card", "admin-page-header", className)}>
      <div className="admin-page-header__content">
        <div className="admin-page-header__icon" aria-hidden="true">
          <AdminIcon name={icon} size={20} />
        </div>
        <div className="admin-page-header__copy">
          <p className="admin-page-header__eyebrow admin-type-helper">{eyebrow}</p>
          <h1 className="admin-type-page-title">{title}</h1>
          {description ? <div className="admin-page-header__description locale-safe">{description}</div> : null}
          {meta ? <div className="admin-page-header__meta">{meta}</div> : null}
        </div>
      </div>
      {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
    </section>
  );
}

export function AdminSectionCard({
  title,
  description,
  icon,
  actions,
  className,
  sectionProps,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: AdminIconName;
  actions?: ReactNode;
  className?: string;
  sectionProps?: Omit<ComponentPropsWithoutRef<"section">, "children" | "className"> & {
    className?: string;
  };
  children: ReactNode;
}) {
  return (
    <MetricCard
      className={cx("admin-section-card", className)}
      title={title}
      description={description}
      icon={icon}
      actions={actions}
      sectionProps={sectionProps}
      titleTag="h2"
      bodyClassName="admin-section-card__body"
    >
      {children}
    </MetricCard>
  );
}

export function AdminStatCard({
  label,
  value,
  detail,
  icon = "info",
  tone = "info",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  icon?: AdminIconName;
  tone?: AdminTone;
  className?: string;
}) {
  return (
    <StatCard
      title={label}
      value={value}
      metadata={detail}
      icon={icon}
      tone={tone}
      className={className}
    />
  );
}

export function AdminInput({
  htmlFor,
  label,
  hint,
  error,
  errorId,
  icon,
  className,
  children,
}: {
  htmlFor?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  errorId?: string;
  icon?: AdminIconName;
  className?: string;
  children: ReactNode;
}) {
  const labelContent = (
    <>
      {icon ? <AdminIcon name={icon} size={14} className="admin-input__label-icon" /> : null}
      <span>{label}</span>
    </>
  );

  return (
    <div className={cx("field", "admin-input", className)}>
      {htmlFor ? (
        <label className="admin-input__label" htmlFor={htmlFor}>
          {labelContent}
        </label>
      ) : (
        <div className="admin-input__label">{labelContent}</div>
      )}
      <div className="admin-input__control">{children}</div>
      {hint ? <small className="admin-input__hint locale-safe">{hint}</small> : null}
      {error ? (
        <span id={errorId} role="alert" className="state-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function AdminTabSwitch({
  ariaLabel,
  options,
  value,
  onChange,
  className,
}: {
  ariaLabel: string;
  options: Array<{
    value: string;
    label: ReactNode;
    id?: string;
    controls?: string;
    disabled?: boolean;
    onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cx("admin-tab-switch", className)} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            id={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={option.controls}
            tabIndex={active ? 0 : -1}
            disabled={option.disabled}
            className={active ? "admin-tab-switch__button is-active" : "admin-tab-switch__button"}
            onClick={() => onChange(option.value)}
            onKeyDown={option.onKeyDown}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function AdminTable({
  caption,
  toolbar,
  className,
  children,
}: {
  caption?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("admin-table-frame", className)}>
      {toolbar ? <div className="admin-table-frame__toolbar">{toolbar}</div> : null}
      <div className="dashboard-table-wrap admin-table-frame__body">
        {caption ? <p className="admin-table-frame__caption sr-only">{caption}</p> : null}
        {children}
      </div>
    </div>
  );
}
