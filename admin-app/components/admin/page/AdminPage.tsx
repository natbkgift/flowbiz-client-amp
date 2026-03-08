import type { ReactNode } from "react";

import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { cx } from "@/components/admin/lib/cx";

export function AdminPage({
  children,
  className,
  busy,
}: {
  children: ReactNode;
  className?: string;
  busy?: boolean;
}) {
  return (
    <main id="main-content" className={cx("container", "content-stack", className)} aria-busy={busy}>
      {children}
    </main>
  );
}

export function AdminPageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("content-stack", className)}>{children}</div>;
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
