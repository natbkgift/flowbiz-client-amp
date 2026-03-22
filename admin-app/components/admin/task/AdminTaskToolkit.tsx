"use client";

import { type ReactNode, useEffect } from "react";

import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcons";
import { AdminButton } from "@/components/admin/forms/AdminButton";
import { cx } from "@/components/admin/lib/cx";

type ActionButtonConfig = {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: AdminIconName;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

export type AdminSectionTab = {
  key: string;
  label: string;
  count?: number;
};

function useOverlayDismiss(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const previousOverflow = window.document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);
}

function renderActionButton(action: ActionButtonConfig, key: string, size: "sm" | "md" = "md"): ReactNode {
  if (action.href) {
    return (
      <a
        key={key}
        className={cx(
          "admin-button",
          action.variant === "primary" ? "admin-button--primary" : "admin-button--secondary",
          size === "sm" ? "admin-button--sm" : undefined,
        )}
        href={action.href}
        aria-disabled={action.disabled ? "true" : undefined}
      >
        {action.label}
      </a>
    );
  }

  return (
    <AdminButton
      key={key}
      type="button"
      variant={action.variant === "ghost" ? "secondary" : action.variant ?? "secondary"}
      size={size}
      icon={action.icon}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.loading ? `${action.label}...` : action.label}
    </AdminButton>
  );
}

export function AdminAccessGate({
  isAuthenticated,
  authTitle,
  authDescription,
  sessionTitle,
  sessionDescription,
  authContent,
  sessionContent,
  children,
  className,
}: {
  isAuthenticated: boolean;
  authTitle: string;
  authDescription?: ReactNode;
  sessionTitle?: string;
  sessionDescription?: ReactNode;
  authContent: ReactNode;
  sessionContent?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("admin-access-gate admin-surface", className)}>
      <div className="admin-access-gate__header">
        <div className="admin-access-gate__icon" aria-hidden="true">
          <AdminIcon name={isAuthenticated ? "success" : "profile"} size={18} />
        </div>
        <div className="admin-access-gate__copy">
          <strong>{isAuthenticated ? sessionTitle ?? authTitle : authTitle}</strong>
          <p className="locale-safe">{isAuthenticated ? sessionDescription ?? authDescription : authDescription}</p>
        </div>
      </div>
      <div className="admin-access-gate__body">{isAuthenticated ? sessionContent : authContent}</div>
      {isAuthenticated && children ? <div className="admin-access-gate__content">{children}</div> : null}
    </section>
  );
}

export function AdminPrimaryActionBar({
  title,
  description,
  primaryAction,
  secondaryActions,
  meta,
  sticky = true,
  mobileBottom = false,
  className,
}: {
  title?: string;
  description?: ReactNode;
  primaryAction: ActionButtonConfig;
  secondaryActions?: ActionButtonConfig[];
  meta?: ReactNode;
  sticky?: boolean;
  mobileBottom?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "admin-primary-action-bar admin-surface",
        sticky ? "is-sticky" : undefined,
        mobileBottom ? "is-mobile-bottom" : undefined,
        className,
      )}
    >
      {title || description || meta ? (
        <div className="admin-primary-action-bar__copy">
          {title ? <strong>{title}</strong> : null}
          {description ? <p className="locale-safe">{description}</p> : null}
          {meta ? <div className="admin-primary-action-bar__meta">{meta}</div> : null}
        </div>
      ) : null}
      <div className="admin-primary-action-bar__actions">
        {secondaryActions?.map((action, index) => renderActionButton(action, `secondary-${index}`))}
        {renderActionButton({ ...primaryAction, variant: "primary" }, "primary")}
      </div>
    </section>
  );
}

export function AdminSectionTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: {
  tabs: AdminSectionTab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <nav className={cx("admin-section-tabs admin-surface", className)} aria-label="Section tabs">
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            className={cx("admin-section-tabs__tab", active ? "is-active" : undefined)}
            onClick={() => onChange(tab.key)}
            aria-pressed={active}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" ? <small>{tab.count}</small> : null}
          </button>
        );
      })}
    </nav>
  );
}

export function AdminFilterDrawer({
  open,
  title,
  description,
  onClose,
  closeLabel = "Close",
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useOverlayDismiss(open, onClose);

  if (!open) {
    return null;
  }

  return (
    <div className="admin-overlay" role="presentation">
      <button type="button" className="admin-overlay__scrim" aria-label={title} onClick={onClose} />
      <section className="admin-drawer admin-drawer--filter" role="dialog" aria-modal="true" aria-label={title}>
        <header className="admin-drawer__header">
          <div>
            <strong>{title}</strong>
            {description ? <p className="locale-safe">{description}</p> : null}
          </div>
          <AdminButton type="button" variant="secondary" icon="x" onClick={onClose}>
            {closeLabel}
          </AdminButton>
        </header>
        <div className="admin-drawer__body">{children}</div>
        {footer ? <footer className="admin-drawer__footer">{footer}</footer> : null}
      </section>
    </div>
  );
}

export function AdminSelectionDrawer({
  open,
  title,
  description,
  onClose,
  closeLabel = "Close",
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useOverlayDismiss(open, onClose);

  if (!open) {
    return null;
  }

  return (
    <div className="admin-overlay" role="presentation">
      <button type="button" className="admin-overlay__scrim" aria-label={title} onClick={onClose} />
      <section className="admin-drawer admin-drawer--selection" role="dialog" aria-modal="true" aria-label={title}>
        <header className="admin-drawer__header">
          <div>
            <strong>{title}</strong>
            {description ? <p className="locale-safe">{description}</p> : null}
          </div>
          <AdminButton type="button" variant="secondary" icon="x" onClick={onClose}>
            {closeLabel}
          </AdminButton>
        </header>
        <div className="admin-drawer__body">{children}</div>
        {footer ? <footer className="admin-drawer__footer">{footer}</footer> : null}
      </section>
    </div>
  );
}

export function AdminSearchablePicker<Item>({
  query,
  onQueryChange,
  queryPlaceholder,
  items,
  getKey,
  getLabel,
  getMeta,
  getBadge,
  onSelect,
  emptyMessage,
  className,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder: string;
  items: Item[];
  getKey: (item: Item) => string;
  getLabel: (item: Item) => string;
  getMeta?: (item: Item) => ReactNode;
  getBadge?: (item: Item) => ReactNode;
  onSelect: (item: Item) => void;
  emptyMessage: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("admin-searchable-picker", className)}>
      <label className="admin-searchable-picker__search">
        <span className="sr-only">Search</span>
        <input
          type="search"
          value={query}
          placeholder={queryPlaceholder}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      {items.length === 0 ? (
        <div className="state-empty">{emptyMessage}</div>
      ) : (
        <div className="admin-searchable-picker__list">
          {items.map((item) => (
            <button
              key={getKey(item)}
              type="button"
              className="admin-searchable-picker__item"
              onClick={() => onSelect(item)}
            >
              <div className="admin-searchable-picker__copy">
                <strong>{getLabel(item)}</strong>
                {getMeta ? <small>{getMeta(item)}</small> : null}
              </div>
              {getBadge ? <span className="admin-searchable-picker__badge">{getBadge(item)}</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminRepeaterEditor<Item>({
  items,
  addLabel,
  emptyTitle,
  emptyDescription,
  onAdd,
  onRemove,
  onMove,
  getKey,
  getItemLabel,
  renderItem,
  className,
}: {
  items: Item[];
  addLabel: string;
  emptyTitle: string;
  emptyDescription?: ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove?: (index: number, direction: -1 | 1) => void;
  getKey: (item: Item, index: number) => string;
  getItemLabel: (item: Item, index: number) => string;
  renderItem: (item: Item, index: number) => ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("admin-repeater-editor", className)}>
      <div className="admin-repeater-editor__header">
        <AdminButton type="button" variant="secondary" icon="plus" onClick={onAdd}>
          {addLabel}
        </AdminButton>
      </div>
      {items.length === 0 ? (
        <div className="admin-repeater-editor__empty state-empty">
          <strong>{emptyTitle}</strong>
          {emptyDescription ? <p className="locale-safe">{emptyDescription}</p> : null}
        </div>
      ) : (
        <div className="admin-repeater-editor__list">
          {items.map((item, index) => (
            <section key={getKey(item, index)} className="admin-repeater-editor__item admin-surface-muted">
              <header className="admin-repeater-editor__item-header">
                <strong>{getItemLabel(item, index)}</strong>
                <div className="admin-repeater-editor__item-actions">
                  {onMove ? renderActionButton({ label: "Up", onClick: () => onMove(index, -1) }, `up-${index}`, "sm") : null}
                  {onMove ? renderActionButton({ label: "Down", onClick: () => onMove(index, 1) }, `down-${index}`, "sm") : null}
                  {renderActionButton({ label: "Remove", onClick: () => onRemove(index) }, `remove-${index}`, "sm")}
                </div>
              </header>
              <div className="admin-repeater-editor__item-body">{renderItem(item, index)}</div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminResponsiveList({
  desktop,
  mobile,
  className,
}: {
  desktop: ReactNode;
  mobile: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("admin-responsive-list", className)}>
      <div className="admin-responsive-list__desktop">{desktop}</div>
      <div className="admin-responsive-list__mobile">{mobile}</div>
    </div>
  );
}