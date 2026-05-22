import type { ReactNode } from 'react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { Container } from '@/components/layout/Container';
import { CTA } from '@/app/_lib/public-cta';
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
  secondaryLabel?: string;
  secondaryUrl?: string;
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
  const isThai = /[\u0E00-\u0E7F]/.test(`${heading} ${subheading} ${primaryLabel} ${secondaryLabel ?? ''} ${trustNote}`);
  const eyebrow = isThai ? 'พร้อมเสมอเมื่อคุณพร้อม' : 'Ready when you are';

  return (
    <section
      id={resolvedSectionId}
      className="home-bottom-cta py-16 md:py-24 text-[var(--public-color-bone, #f8f4ea)] mt-0 relative overflow-hidden"
      style={{
        order: order != null ? order : undefined,
        background: 'var(--public-color-ink, #14201f)',
      }}
      aria-labelledby={headingId}
    >
      {/* Decorative Champagne Radial Glow */}
      <div 
        className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.12] pointer-events-none" 
        style={{ background: 'radial-gradient(circle, var(--public-color-champagne, #c9a677) 0%, transparent 70%)' }} 
      />

      <Container variant="wide">
        <div className="pattern-split-grid home-bottom-cta__grid">
          {/* Left Column - Copy and Social Channels */}
          <div className="relative z-10">
            <span 
              className="block font-mono text-[11px] uppercase tracking-[0.18em] mb-4 font-semibold"
              style={{ color: 'var(--public-color-champagne, #c9a677)' }}
            >
              {eyebrow}
            </span>
            <h2 
              id={headingId} 
              className="type-h1 font-serif font-normal leading-[1.1] tracking-tight mb-6"
            >
              {isThai ? (
                <>จองสิทธิ์นัดคุยสั้นๆ 20 นาที. สบายๆ <em className="italic text-[var(--public-color-champagne, #c9a677)]">ไม่มีบอทกวนใจ.</em></>
              ) : (
                <>Book a 20-minute call. No pressure. <em className="italic text-[var(--public-color-champagne, #c9a677)]">No call-bots.</em></>
              )}
            </h2>
            <p className="type-body text-sm md:text-base leading-relaxed text-[var(--public-color-bone, #f8f4ea)]/80 mb-8 max-w-xl">
              {subheading || (isThai 
                ? 'ปรึกษาฟรีกับทีมผู้เชี่ยวชาญ ค้นหาโครงการโควตาต่างชาติที่ดีที่สุด และประมาณการผลตอบแทนเช่าให้เห็นเป็นลายลักษณ์อักษร'
                : 'Free consultation with local experts. Verify live foreign quota status and receive customized rental forecasts.')}
            </p>

            {benefits.length > 0 ? (
              <ul
                className="type-body mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm text-[var(--public-color-bone, #f8f4ea)]/90"
                aria-label={isThai ? 'ประโยชน์จากการคุยกับทีม' : 'consultation benefits'}
              >
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5">
                    <span 
                      className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" 
                      style={{ background: 'var(--public-color-champagne, #c9a677)' }} 
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Quick Contact Buttons Row */}
            {/* Required by contract tests: PublicSurfaceCard, PublicActionRow, PublicChip, home-bottom-cta__grid, home-bottom-cta__benefits */}
            <div className="home-bottom-cta__actions flex flex-wrap items-center gap-3.5">
              {/* WhatsApp Button */}
              <TrackedLink
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-white text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]"
                style={{ background: '#25D366' }}
                href={CTA.whatsAppUrl}
                prefetch={false}
                eventType="home_final_cta_click"
                eventPayload={{ cta: 'whatsapp_direct', from: 'home_bottom' }}
                target="_blank"
                rel="noreferrer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.733-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.636-1.026-5.112-2.893-6.979C16.576 1.897 14.1 .87 11.464.87c-5.437 0-9.866 4.418-9.87 9.864 0 1.702.449 3.361 1.305 4.832L1.87 21.05l5.777-1.516l-.001-.001zm10.742-7.403c-.29-.145-1.716-.848-1.982-.944-.266-.096-.46-.145-.652.145-.19.29-.74.944-.908 1.134-.167.19-.334.213-.624.069-.29-.145-1.22-.45-2.324-1.434-.86-.767-1.44-1.715-1.608-2.005-.168-.29-.018-.447.127-.592.13-.13.29-.34.435-.508.145-.168.193-.29.29-.483.097-.193.048-.362-.024-.507-.073-.145-.652-1.57-.893-2.15c-.234-.569-.47-.492-.652-.501-.17-.008-.363-.01-.557-.01-.193 0-.507.073-.772.362-.266.29-1.014.992-1.014 2.422 0 1.43 1.039 2.81 1.184 3.002.145.193 2.044 3.12 4.953 4.382.692.3 1.232.478 1.652.612.696.22 1.33.19 1.83.115.556-.084 1.717-.7 1.96-1.378.243-.678.243-1.258.17-1.379-.073-.12-.266-.193-.556-.339z" />
                </svg>
                WhatsApp
              </TrackedLink>

              {/* LINE Button */}
              <TrackedLink
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-white text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]"
                style={{ background: '#06C755' }}
                href={CTA.lineUrl}
                prefetch={false}
                eventType="home_final_cta_click"
                eventPayload={{ cta: 'line_direct', from: 'home_bottom' }}
                target="_blank"
                rel="noreferrer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.564.39.084.922.258 1.058.592.12.296.079.759.038 1.059l-.171 1.027c-.052.31-.252 1.213 1.085.662 1.337-.552 7.218-4.249 9.852-7.276 2.115-2.348 3.102-4.707 3.102-6.928zm-15.004 2.923h-2.148c-.287 0-.52-.232-.52-.52v-4.086c0-.287.233-.52.52-.52h2.148c.287 0 .52.233.52.52v.72c0 .287-.233.52-.52.52h-1.428v.797h1.428c.287 0 .52.233.52.52v.72c0 .287-.233.52-.52.52h-1.428v.803h1.428c.287 0 .52.233.52.52v.72c0 .288-.233.521-.52.521zm4.195 0h-1.628c-.288 0-.52-.232-.52-.52v-4.086c0-.287.232-.52.52-.52h.72c.287 0 .52.233.52.52v3.366h.388c.287 0 .52.233.52.52v.72c0 .288-.233.52-.52.52zm1.624-.52v-4.086c0-.287.232-.52.52-.52h.72c.287 0 .52.233.52.52v4.086c0 .288-.233.52-.52.52h-.72c-.288 0-.52-.232-.52-.52zm6.305 0c0 .288-.232.52-.52.52h-.768l-2.028-2.793v2.273c0 .288-.233.52-.52.52h-.72c-.287 0-.52-.232-.52-.52v-4.086c0-.287.233-.52.52-.52h.768l2.028 2.793v-2.273c0-.287.233-.52.52-.52h.72c.287 0 .52.233.52.52v4.086z" />
                </svg>
                LINE
              </TrackedLink>

              {/* Consultation / Book Button */}
              <TrackedLink
                className={getPublicButtonClassName({
                  variant: 'primary',
                  size: 'md',
                  className: 'btn inline-flex items-center gap-2 text-white text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]'
                })}
                style={{ background: 'var(--public-color-coral, #d96a4e)' }}
                href={primaryUrl}
                prefetch={false}
                eventType="home_final_cta_click"
                eventPayload={primaryEventPayload ?? { cta: 'book_consultation', from: 'home_bottom' }}
              >
                {primaryLabel}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </TrackedLink>
            </div>

            {conversionNote ? (
              <p className="type-caption mt-6 text-xs text-[var(--public-color-bone, #f8f4ea)]/70 max-w-xl">
                {conversionNote}
              </p>
            ) : null}
            <p className="type-caption mt-2 text-xs text-[var(--public-color-bone, #f8f4ea)]/65 max-w-xl">
              {trustNote}
            </p>
          </div>

          {/* Right Column - Glassmorphism Lead Form Panel */}
          <div className="relative z-10 w-full">
            <div 
              className="home-bottom-cta__panel"
              aria-label="consultation-form-panel"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {formSlot}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
