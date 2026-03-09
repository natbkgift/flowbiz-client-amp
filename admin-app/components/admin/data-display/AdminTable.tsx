import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { AdminButton } from "@/components/admin/forms/AdminButton";
import { cx } from "@/components/admin/lib/cx";

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
      <div className="admin-table-wrap admin-table-frame__body">
        {caption ? <p className="admin-table-frame__caption sr-only">{caption}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function AdminTableToolbar({
  className,
  role,
  "aria-label": ariaLabel,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={cx("dashboard-table-toolbar", "admin-table-toolbar", className)}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function AdminTablePagination({
  className,
  currentPage,
  totalPages,
  previousLabel,
  nextLabel,
  label,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  summary,
  controlsId,
}: {
  className?: string;
  currentPage: number;
  totalPages: number;
  previousLabel: string;
  nextLabel: string;
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  summary?: ReactNode;
  controlsId?: string;
}) {
  return (
    <AdminTableToolbar className={cx("dashboard-table-pagination", className)} aria-label={label}>
      <AdminButton
        variant="secondary"
        onClick={onPrevious}
        disabled={previousDisabled}
        aria-controls={controlsId}
      >
        {previousLabel}
      </AdminButton>
      <span className="dashboard-table-summary" aria-live="polite">
        {summary || `${label} ${currentPage} / ${totalPages}`}
      </span>
      <AdminButton
        variant="secondary"
        onClick={onNext}
        disabled={nextDisabled}
        aria-controls={controlsId}
      >
        {nextLabel}
      </AdminButton>
    </AdminTableToolbar>
  );
}
