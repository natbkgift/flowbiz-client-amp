import type { ReactNode } from 'react';

import type { EventType } from '@/lib/analytics';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { Container } from '@/components/layout/Container';
import { PublicActionRow } from '@/components/public/PublicActionRow';
import { PublicChip } from '@/components/public/PublicChip';
import { PublicSurfaceCard } from '@/components/public/PublicSurfaceCard';
import {
  IconArrowRight,
  IconBuilding,
  IconCheck,
  IconShield,
  IconTrendingUp,
  IconUsers,
} from '@/components/icons/SvgIcons';

export type HeroAction = {
  href: string;
  label: string;
  id?: string;
  eventType?: EventType;
  eventPayload?: Record<string, unknown>;
  prefetch?: boolean;
};

export type ExternalAction = {
  href: string;
  label: string;
  id?: string;
  ariaLabel?: string;
};

export type HeroSignal = {
  kicker: string;
  title: string;
  body: string;
  icon?: 'shield' | 'trend' | 'users' | 'building' | 'check';
};

function signalIcon(icon?: HeroSignal['icon']): ReactNode {
  switch (icon) {
    case 'shield':
      return <IconShield size="sm" />;
    case 'trend':
      return <IconTrendingUp size="sm" />;
    case 'users':
      return <IconUsers size="sm" />;
    case 'building':
      return <IconBuilding size="sm" />;
    case 'check':
    default:
      return <IconCheck size="sm" />;
  }
}

export function PublicAdvisoryHero({
  eyebrow,
  title,
  subtitle,
  proofs,
  signals,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  supportNote,
  proofsLabel = 'Trust bar',
  guidanceLabel = 'Page guidance',
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  proofs: string[];
  signals: HeroSignal[];
  primaryAction: HeroAction;
  secondaryAction?: HeroAction | null;
  tertiaryAction?: ExternalAction | null;
  supportNote?: string;
  proofsLabel?: string;
  guidanceLabel?: string;
}) {
  const hasSignals = signals.length > 0;

  return (
    <section className="hero hero--page hero--advisory">
      <Container variant="wide">
        <div className="public-hero">
          <PublicSurfaceCard as="div" tone="warm" className="public-hero__content">
            <span className="public-hero__eyebrow">{eyebrow}</span>
            <h1 className="headline public-hero__headline">{title}</h1>
            <p className="subhead public-hero__subtitle">{subtitle}</p>

            <PublicActionRow className="public-hero__actions cta-row" stackOnMobile>
              <TrackedLink
                id={primaryAction.id}
                className="btn btn-primary public-hero__action public-hero__action--primary"
                href={primaryAction.href}
                prefetch={primaryAction.prefetch ?? false}
                eventType={primaryAction.eventType ?? 'cta_click'}
                eventPayload={primaryAction.eventPayload}
              >
                {primaryAction.label}
              </TrackedLink>

              {secondaryAction ? (
                <TrackedLink
                  id={secondaryAction.id}
                  className="btn btn-secondary public-hero__action public-hero__action--secondary"
                  href={secondaryAction.href}
                  prefetch={secondaryAction.prefetch ?? false}
                  eventType={secondaryAction.eventType ?? 'cta_click'}
                  eventPayload={secondaryAction.eventPayload}
                >
                  {secondaryAction.label}
                </TrackedLink>
              ) : null}

              {tertiaryAction ? (
                <a
                  id={tertiaryAction.id}
                  className="btn btn-tertiary public-hero__action public-hero__action--tertiary"
                  href={tertiaryAction.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={tertiaryAction.ariaLabel ?? tertiaryAction.label}
                >
                  {tertiaryAction.label}
                </a>
              ) : null}
            </PublicActionRow>

            <div className="public-hero__meta">
              {supportNote ? (
                <p className="public-hero__support-note">{supportNote}</p>
              ) : null}

              <div className="public-hero__proofs" role="note" aria-label={proofsLabel}>
                {proofs.map((proof) => (
                  <PublicChip key={proof} className="public-hero__proof">
                    {proof}
                  </PublicChip>
                ))}
              </div>
            </div>
          </PublicSurfaceCard>

          {hasSignals ? (
            <PublicSurfaceCard as="aside" tone="deep" className="public-hero__rail" aria-label={guidanceLabel}>
              {signals.map((signal, index) => (
                <article key={`${signal.kicker}-${signal.title}`} className="public-hero__signal">
                  <div className="public-hero__signal-icon" aria-hidden="true">
                    {signalIcon(signal.icon)}
                  </div>
                  <div className="public-hero__signal-copy">
                    <span className="public-hero__signal-kicker">{signal.kicker}</span>
                    <h2 className="public-hero__signal-title">{signal.title}</h2>
                    <p>{signal.body}</p>
                  </div>
                  <span className="public-hero__signal-arrow" aria-hidden="true">
                    <IconArrowRight size="sm" />
                  </span>
                </article>
              ))}
            </PublicSurfaceCard>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
