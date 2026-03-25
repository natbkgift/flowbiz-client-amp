import { TrackedLink } from '@/components/analytics/TrackedLink';

type MobileAction = {
  href: string;
  label: string;
  id?: string;
  eventPayload?: Record<string, unknown>;
};

type PageOwnedMobileCTAProps = {
  id: string;
  title: string;
  description: string;
  primaryAction: MobileAction;
  secondaryAction?: MobileAction;
};

function isExternalHref(href: string): boolean {
  return /^(tel:|https?:\/\/|mailto:)/i.test(href);
}

export function PageOwnedMobileCTA({
  id,
  title,
  description,
  primaryAction,
  secondaryAction,
}: PageOwnedMobileCTAProps) {
  return (
    <div id={id} className="detail-mobile-cta" role="region" aria-label={title}>
      <div className="detail-mobile-cta__meta">
        <p className="detail-mobile-cta__title">{title}</p>
        <p className="detail-mobile-cta__description">{description}</p>
      </div>

      <div className="detail-mobile-cta__actions">
        <TrackedLink
          id={primaryAction.id}
          className="btn btn-cta detail-mobile-cta__btn detail-mobile-cta__btn--primary"
          href={primaryAction.href}
          eventType="cta_click"
          eventPayload={primaryAction.eventPayload}
        >
          {primaryAction.label}
        </TrackedLink>

        {secondaryAction ? (
          isExternalHref(secondaryAction.href) ? (
            <a
              id={secondaryAction.id}
              className="btn btn-secondary detail-mobile-cta__btn"
              href={secondaryAction.href}
              target={secondaryAction.href.startsWith('http') ? '_blank' : undefined}
              rel={secondaryAction.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {secondaryAction.label}
            </a>
          ) : (
            <TrackedLink
              id={secondaryAction.id}
              className="btn btn-secondary detail-mobile-cta__btn"
              href={secondaryAction.href}
              eventType="cta_click"
              eventPayload={secondaryAction.eventPayload}
            >
              {secondaryAction.label}
            </TrackedLink>
          )
        ) : null}
      </div>
    </div>
  );
}
