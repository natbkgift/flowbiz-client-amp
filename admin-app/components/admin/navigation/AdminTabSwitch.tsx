import type { KeyboardEventHandler, ReactNode } from "react";

import { cx } from "@/components/admin/lib/cx";

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
