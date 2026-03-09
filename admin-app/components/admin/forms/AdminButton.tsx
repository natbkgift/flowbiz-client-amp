import type { ButtonHTMLAttributes } from "react";

import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { cx } from "@/components/admin/lib/cx";

type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type AdminButtonSize = "sm" | "md";

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
    "admin-btn",
    variant !== "primary" && `admin-btn-${variant}`,
    size === "sm" && "admin-btn-sm",
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
