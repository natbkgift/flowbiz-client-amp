import type { ReactNode } from "react";

import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { cx } from "@/components/admin/lib/cx";

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
    <div className={cx("admin-field", "admin-input", className)}>
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
