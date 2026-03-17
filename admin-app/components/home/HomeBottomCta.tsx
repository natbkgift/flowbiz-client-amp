import type { ReactNode } from 'react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { Container } from '@/components/layout/Container';

export function HomeBottomCta({
  heading,
  subheading,
  primaryLabel,
  primaryUrl,
  secondaryLabel,
  secondaryUrl,
  trustNote,
  conversionNote,
  formSlot,
  order,
  sectionId,
}: {
  heading: string;
  subheading: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
  trustNote: string;
  conversionNote?: string;
  formSlot: ReactNode;
  order?: number;
  sectionId?: string;
}) {
  const resolvedSectionId = sectionId ?? 'home-bottom-cta';
  const headingId = `${resolvedSectionId}-title`;

  return (
    <section
      id={resolvedSectionId}
      className="home-bottom-cta cv-auto py-20 md:py-32 bg-gray-900 text-white mt-8"
      style={order != null ? { order } : undefined}
      aria-labelledby={headingId}
    >
      <Container variant="wide">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="reveal">
            <h2 id={headingId} className="text-3xl md:text-5xl font-serif font-medium mb-6 leading-tight">
              {heading}
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-lg leading-relaxed">
              {subheading}
            </p>
            <div className="flex flex-wrap gap-4">
              <TrackedLink
                className="px-6 py-3 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
                href={primaryUrl}
                eventType="home_final_cta_click"
                eventPayload={{ cta: 'book_consultation', from: 'home_bottom' }}
              >
                {primaryLabel}
              </TrackedLink>
              <TrackedLink
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20"
                href={secondaryUrl}
                eventType="home_final_cta_click"
                eventPayload={{ cta: 'view_investment_path', from: 'home_bottom' }}
              >
                {secondaryLabel}
              </TrackedLink>
            </div>
            {conversionNote ? (
              <p className="home-bottom-conversion-note mt-4 text-sm text-white/72 max-w-xl">{conversionNote}</p>
            ) : null}
            <p className="home-bottom-trust-note mt-4 text-sm text-white/70 max-w-xl">{trustNote}</p>
          </div>
          <div className="reveal">
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl text-gray-900" aria-label="consultation-form-panel">
              {formSlot}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}