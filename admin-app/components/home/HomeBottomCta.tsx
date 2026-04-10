import type { ReactNode } from 'react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { Container } from '@/components/layout/Container';
import { PublicActionRow } from '@/components/public/PublicActionRow';
import { PublicChip } from '@/components/public/PublicChip';
import { PublicSurfaceCard } from '@/components/public/PublicSurfaceCard';
import { getPublicButtonClassName } from '@/components/public-system/tokens/publicUiTokens';

export function HomeBottomCta({
  heading,
  subheading,
  benefits = [],
  primaryLabel,
  primaryUrl,
  secondaryLabel,
  secondaryUrl,
  trustNote,
  conversionNote,
  formSlot,
  order,
  sectionId,
  primaryEventPayload,
  secondaryEventPayload,
}: {
  heading: string;
  subheading: string;
  benefits?: string[];
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
  trustNote: string;
  conversionNote?: string;
  formSlot: ReactNode;
  order?: number;
  sectionId?: string;
  primaryEventPayload?: Record<string, unknown>;
  secondaryEventPayload?: Record<string, unknown>;
}) {
  const resolvedSectionId = sectionId ?? 'home-bottom-cta';
  const headingId = `${resolvedSectionId}-title`;
  const isThai = /[\u0E00-\u0E7F]/.test(`${heading} ${subheading} ${primaryLabel} ${secondaryLabel} ${trustNote}`);
  const eyebrow = isThai ? 'ทีมพัทยา' : 'Pattaya team';

  return (
    <section
      id={resolvedSectionId}
      className="home-bottom-cta py-12 md:py-12 xl:py-12 2xl:py-16 bg-gray-900 text-white mt-0"
      style={order != null ? { order } : undefined}
      aria-labelledby={headingId}
    >
      <Container variant="wide">
        <div className="home-bottom-cta__grid pattern-split-grid">
          <div className="reveal home-bottom-cta__content">
            <div className="home-bottom-cta__topline">
              <PublicChip as="span" tone="accent" size="sm" className="home-bottom-cta__eyebrow">
                {eyebrow}
              </PublicChip>
            </div>
            <h2 id={headingId} className="home-bottom-cta__title type-h1 mb-6">
              {heading}
            </h2>
            <p className="home-bottom-cta__lede type-body text-white/80 mb-5 max-w-lg">
              {subheading}
            </p>
            {benefits.length > 0 ? (
              <ul
                className="home-bottom-cta__benefits type-small mb-6 grid gap-3 max-w-xl text-white/82"
                aria-label={isThai ? 'ประโยชน์จากการคุยกับทีม' : 'consultation benefits'}
              >
                {benefits.map((benefit) => (
                  <li key={benefit} className="home-bottom-cta__benefit flex items-start gap-3">
                    <span className="home-bottom-cta__benefit-mark" aria-hidden="true" />
                    <span className="home-bottom-cta__benefit-text">{benefit}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <PublicActionRow className="home-bottom-cta__actions" stackOnMobile>
              <TrackedLink
                className={getPublicButtonClassName({
                  variant: 'cta',
                  className: 'home-bottom-cta__primary',
                })}
                href={primaryUrl}
                prefetch={false}
                eventType="home_final_cta_click"
                eventPayload={primaryEventPayload ?? { cta: 'book_consultation', from: 'home_bottom' }}
              >
                {primaryLabel}
              </TrackedLink>
              <TrackedLink
                className={getPublicButtonClassName({
                  variant: 'secondary',
                  className: 'home-bottom-cta__secondary',
                })}
                href={secondaryUrl}
                prefetch={false}
                eventType="home_final_cta_click"
                eventPayload={secondaryEventPayload ?? { cta: 'view_investment_path', from: 'home_bottom' }}
              >
                {secondaryLabel}
              </TrackedLink>
            </PublicActionRow>
            {conversionNote ? (
              <p className="home-bottom-conversion-note type-caption mt-4 text-white/72 max-w-xl">{conversionNote}</p>
            ) : null}
            <p className="home-bottom-trust-note type-caption mt-4 text-white/70 max-w-xl">{trustNote}</p>
          </div>
          <div className="reveal home-bottom-cta__form-wrap">
            <PublicSurfaceCard as="div" tone="warm" className="home-bottom-cta__panel" aria-label="consultation-form-panel">
              {formSlot}
            </PublicSurfaceCard>
          </div>
        </div>
      </Container>
    </section>
  );
}
