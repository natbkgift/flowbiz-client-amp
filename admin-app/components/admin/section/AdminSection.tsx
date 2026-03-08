import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { type AdminIconName } from "@/components/admin/AdminIcons";
import { MetricCard } from "@/components/admin/cards/AdminCards";
import { cx } from "@/components/admin/lib/cx";

export function AdminSectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  if (!title && !description && !actions) return null;
  return (
    <div className={cx("admin-section-header", className)}>
      <div className="admin-section-header__copy">
        {title ? <div className="admin-section-header__title">{title}</div> : null}
        {description ? <div className="admin-section-header__description locale-safe">{description}</div> : null}
      </div>
      {actions ? <div className="admin-section-header__actions">{actions}</div> : null}
    </div>
  );
}

export function AdminSectionBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("admin-section-body", className)}>{children}</div>;
}

export function AdminSectionGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("admin-section-grid", className)}>{children}</div>;
}

export function AdminSection({
  title,
  description,
  icon,
  actions,
  className,
  bodyClassName,
  sectionProps,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: AdminIconName;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
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
      bodyClassName={cx("admin-section-card__body", bodyClassName)}
    >
      {children}
    </MetricCard>
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
    <AdminSection
      title={title}
      description={description}
      icon={icon}
      actions={actions}
      className={className}
      sectionProps={sectionProps}
    >
      {children}
    </AdminSection>
  );
}
