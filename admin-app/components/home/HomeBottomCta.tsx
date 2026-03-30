import type { ReactNode } from 'react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { Container } from '@/components/layout/Container';

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
  const eyebrow = isThai ? 'ปรึกษากับทีมพัทยาโดยตรง' : 'Private advisory handoff';
  const formBadge = isThai ? 'ช่องทางส่งโจทย์ถึงทีม AMP' : 'AMP advisory intake';
  const signalItems = isThai
    ? ['ราคา current', 'ยูนิตที่ยังว่าง', 'ขั้นตอนถัดไปชัด']
    : ['Current pricing', 'Available units', 'Clear next step'];

  return (
    <section
      id={resolvedSectionId}
      className="home-bottom-cta py-[60px] md:py-20 xl:py-24 bg-gray-900 text-white mt-3 md:mt-6"
      style={order != null ? { order } : undefined}
      aria-labelledby={headingId}
    >
      <Container variant="wide">
        <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center home-bottom-cta__grid">
          <div className="reveal home-bottom-cta__content">
            <div className="home-bottom-cta__topline">
              <p className="home-bottom-cta__eyebrow">{eyebrow}</p>
              <div className="home-bottom-cta__signal-row" aria-hidden="true">
                {signalItems.map((item) => (
                  <span key={item} className="home-bottom-cta__signal">{item}</span>
                ))}
              </div>
            </div>
            <h2 id={headingId} className="home-bottom-cta__title text-3xl md:text-5xl font-serif font-semibold mb-6 leading-tight">
              {heading}
            </h2>
            <p className="home-bottom-cta__lede text-lg text-white/80 mb-5 max-w-lg leading-relaxed">
              {subheading}
            </p>
            {benefits.length > 0 ? (
              <ul className="home-bottom-cta__benefits mb-6 grid gap-3 max-w-xl text-sm text-white/82 leading-relaxed" aria-label="consultation benefits">
                {benefits.map((benefit) => (
                  <li key={benefit} className="home-bottom-cta__benefit flex items-start gap-3">
                    <span className="home-bottom-cta__benefit-mark mt-[2px] inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border border-white/20 bg-white/10 text-[11px] font-semibold text-white">+</span>
                    <span className="home-bottom-cta__benefit-text">{benefit}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-4 home-bottom-cta__actions">
              <TrackedLink
                className="px-6 py-3 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors home-bottom-cta__primary"
                href={primaryUrl}
                eventType="home_final_cta_click"
                eventPayload={primaryEventPayload ?? { cta: 'book_consultation', from: 'home_bottom' }}
              >
                {primaryLabel}
              </TrackedLink>
              <TrackedLink
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20 home-bottom-cta__secondary"
                href={secondaryUrl}
                eventType="home_final_cta_click"
                eventPayload={secondaryEventPayload ?? { cta: 'view_investment_path', from: 'home_bottom' }}
              >
                {secondaryLabel}
              </TrackedLink>
            </div>
            {conversionNote ? (
              <p className="home-bottom-conversion-note mt-4 text-sm text-white/72 max-w-xl">{conversionNote}</p>
            ) : null}
            <p className="home-bottom-trust-note mt-4 text-sm text-white/70 max-w-xl">{trustNote}</p>
          </div>
          <div className="reveal home-bottom-cta__form-wrap">
            <div className="home-bottom-cta__form-badge" aria-hidden="true">{formBadge}</div>
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl text-gray-900 home-bottom-cta__panel" aria-label="consultation-form-panel">
              {formSlot}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
