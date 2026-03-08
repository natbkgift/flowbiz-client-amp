import type { ReactNode } from "react";

import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { cx } from "@/components/admin/lib/cx";

export type AdminTone = "neutral" | "info" | "ok" | "warn" | "error";

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
