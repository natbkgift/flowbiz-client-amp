import type { ButtonHTMLAttributes, KeyboardEventHandler, ReactNode } from "react";

import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

type AdminButtonVariant = "primary" | "secondary" | "ghost";
type AdminButtonSize = "sm" | "md";
type AdminTone = "neutral" | "info" | "ok" | "warn" | "error";

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
    <span className="admin-button__icon" aria-hidden={iconLabel ? undefined : "true"}>
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
          <p className="admin-page-header__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
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
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: AdminIconName;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("card", "admin-section-card", className)}>
      {title || description || actions ? (
        <header className="admin-section-card__header">
          <div className="admin-section-card__title-row">
            {icon ? (
              <span className="admin-section-card__icon" aria-hidden="true">
                <AdminIcon name={icon} size={16} />
              </span>
            ) : null}
            <div className="admin-section-card__copy">
              {title ? <h2>{title}</h2> : null}
              {description ? <div className="admin-section-card__description locale-safe">{description}</div> : null}
            </div>
          </div>
          {actions ? <div className="admin-section-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="admin-section-card__body">{children}</div>
    </section>
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
    <article className={cx("card", "admin-stat-card", `admin-stat-card--${tone}`, className)}>
      <div className="admin-stat-card__head">
        <span className="admin-stat-card__label">{label}</span>
        <span className="admin-stat-card__icon" aria-hidden="true">
          <AdminIcon name={icon} size={16} />
        </span>
      </div>
      <strong className="admin-stat-card__value">{value}</strong>
      {detail ? <div className="admin-stat-card__detail locale-safe">{detail}</div> : null}
    </article>
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
  return (
    <label className={cx("field", "admin-input", className)} htmlFor={htmlFor}>
      <span className="admin-input__label">
        {icon ? <AdminIcon name={icon} size={14} className="admin-input__label-icon" /> : null}
        <span>{label}</span>
      </span>
      <div className="admin-input__control">{children}</div>
      {hint ? <small className="admin-input__hint locale-safe">{hint}</small> : null}
      {error ? (
        <span id={errorId} role="alert" className="state-error">
          {error}
        </span>
      ) : null}
    </label>
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
