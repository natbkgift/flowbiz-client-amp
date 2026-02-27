import type { ReactNode } from 'react';

export function EmptyStateCard({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={className ?? 'ui-empty'} role="status" aria-live="polite">
      <h3 className="ui-empty__title">{title}</h3>
      <p className="ui-empty__body">{body}</p>
      {action ? <div className="ui-empty__action">{action}</div> : null}
    </section>
  );
}

export function InlineStatusMessage({
  tone,
  message,
}: {
  tone: 'error' | 'success' | 'info';
  message: string;
}) {
  return (
    <p className={`ui-status ui-status--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {message}
    </p>
  );
}

export function LoadingCardGrid({
  cards = 6,
}: {
  cards?: number;
}) {
  return (
    <div className="ui-loading-grid" aria-hidden="true">
      {Array.from({ length: cards }).map((_, index) => (
        <article key={index} className="ui-loading-card">
          <div className="skeleton skeleton--image" />
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--text" />
        </article>
      ))}
    </div>
  );
}
