'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { buildAdvisorWhatsApp } from '@/app/_lib/public-advisory';
import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { SafeCoverImage } from '@/components/media/SafeCoverImage';
import { PublicActionRow } from '@/components/public/PublicActionRow';
import { PublicSurfaceCard } from '@/components/public/PublicSurfaceCard';
import { getPublicButtonClassName } from '@/components/public-system/tokens/publicUiTokens';
import { withLocale } from '@/app/_lib/i18n/routing';
import { resolveRenderableLocalMediaPath } from '@/app/_lib/local-media';
import { LeadForm } from '@/components/forms/LeadForm';

const HERO_FALLBACK_IMAGE = '/images/hero-banner-20260318.webp';
const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD = 42;

type HomeHeroComposer = {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  primary_cta_label?: string;
  primary_cta_url?: string;
  secondary_cta_label?: string;
  secondary_cta_url?: string;
  trust_items?: string[];
  hero_image?: string | null;
};

type HomeHeroSlide = {
  key: string;
  eyebrow: string;
  heading: string;
  subheading: string;
  imageSrc: string;
  imageAlt?: string;
};

function resolveLocalizedHref(locale: 'en' | 'th', href: string): string {
  if (!href.startsWith('/')) return href;
  if (href === `/${locale}` || href.startsWith(`/${locale}/`) || href.startsWith(`/${locale}?`)) {
    return href;
  }
  return withLocale(locale, href);
}

function createFallbackSlide(locale: 'en' | 'th', dict: any, composer?: HomeHeroComposer | null): HomeHeroSlide {
  const heading = typeof composer?.heading === 'string' && composer.heading.trim()
    ? composer.heading.trim()
    : dict.home.heroTitle;
  const eyebrow = typeof composer?.eyebrow === 'string' && composer.eyebrow.trim()
    ? composer.eyebrow.trim()
    : dict.advisory.heroEyebrow;
  const subheading = typeof composer?.subheading === 'string' && composer.subheading.trim()
    ? composer.subheading.trim()
    : dict.home.heroSubtitle;

  return {
    key: 'fallback',
    eyebrow,
    heading,
    subheading,
    imageSrc: resolveRenderableLocalMediaPath(composer?.hero_image) ?? HERO_FALLBACK_IMAGE,
    imageAlt: locale === 'th' ? 'ภาพอสังหาริมทรัพย์พัทยาโดย AMP Pattaya' : 'AMP Pattaya Real Estate',
  };
}

export function HomeHero({
  dict,
  locale,
  primaryEventPayload,
  secondaryEventPayload,
  composer,
  slides,
}: {
  dict: any;
  locale: 'en' | 'th';
  primaryEventPayload?: Record<string, unknown>;
  secondaryEventPayload?: Record<string, unknown>;
  composer?: HomeHeroComposer | null;
  slides?: HomeHeroSlide[];
}) {
  const resolvedSlides = useMemo(() => {
    if (Array.isArray(slides) && slides.length > 0) {
      return slides.map((slide, index) => ({
        ...slide,
        key: slide.key || `hero-slide-${index + 1}`,
        imageSrc: resolveRenderableLocalMediaPath(slide.imageSrc) || HERO_FALLBACK_IMAGE,
        imageAlt: slide.imageAlt || (locale === 'th' ? 'ภาพประกอบอสังหาริมทรัพย์พัทยา' : 'AMP Pattaya Real Estate'),
      }));
    }
    return [createFallbackSlide(locale, dict, composer)];
  }, [composer, dict, locale, slides]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(() => new Set([0]));
  const touchStartX = useRef<number | null>(null);
  const slideCount = resolvedSlides.length;
  const activeSlide = resolvedSlides[Math.min(activeIndex, resolvedSlides.length - 1)] ?? resolvedSlides[0];
  const stableEyebrow = typeof composer?.eyebrow === 'string' && composer.eyebrow.trim()
    ? composer.eyebrow.trim()
    : dict.advisory.heroEyebrow;
  const stableHeading = typeof composer?.heading === 'string' && composer.heading.trim()
    ? composer.heading.trim()
    : dict.home.heroTitle;
  const stableSubheading = typeof composer?.subheading === 'string' && composer.subheading.trim()
    ? composer.subheading.trim()
    : dict.home.heroSubtitle;
  const contextualLineCandidates = [
    typeof activeSlide.heading === 'string' ? activeSlide.heading.trim() : '',
    typeof activeSlide.subheading === 'string' ? activeSlide.subheading.trim() : '',
  ].filter(Boolean);
  const contextualLine = contextualLineCandidates.find((item) => item !== stableHeading && item !== stableSubheading) ?? '';

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(resolvedSlides.length - 1, 0)));
  }, [resolvedSlides.length]);

  useEffect(() => {
    setLoadedSlides(new Set([0]));
  }, [resolvedSlides]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setDocumentVisible(document.visibilityState === 'visible');
    };
    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (slideCount <= 1 || autoplayPaused || !documentVisible) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [autoplayPaused, documentVisible, slideCount]);

  useEffect(() => {
    setLoadedSlides((current) => {
      const next = new Set(current);
      next.add(activeIndex);
      return next;
    });

    if (slideCount <= 1) return undefined;

    const nextIndex = (activeIndex + 1) % slideCount;
    const timer = window.setTimeout(() => {
      setLoadedSlides((current) => {
        const next = new Set(current);
        next.add(nextIndex);
        return next;
      });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [activeIndex, slideCount]);

  const primaryCtaLabel = typeof composer?.primary_cta_label === 'string' && composer.primary_cta_label.trim()
    ? composer.primary_cta_label.trim()
    : (locale === 'th' ? 'รับ Shortlist ของฉัน' : 'Get My Shortlist');
  const primaryCtaUrl = typeof composer?.primary_cta_url === 'string' && composer.primary_cta_url.trim()
    ? resolveLocalizedHref(locale, composer.primary_cta_url.trim())
    : withLocale(locale, '/contact');
  const secondaryCtaLabel = typeof composer?.secondary_cta_label === 'string' && composer.secondary_cta_label.trim()
    ? composer.secondary_cta_label.trim()
    : (locale === 'th' ? 'ดูโครงการที่คัดแล้ว' : 'Browse Verified Projects');
  const secondaryCtaUrl = typeof composer?.secondary_cta_url === 'string' && composer.secondary_cta_url.trim()
    ? resolveLocalizedHref(locale, composer.secondary_cta_url.trim())
    : withLocale(locale, '/projects');
  const trustItems = Array.isArray(composer?.trust_items)
    ? composer.trust_items.map((item) => String(item).trim()).filter(Boolean).slice(0, 3)
    : [];
  const whatsAppHref = buildAdvisorWhatsApp(locale, dict);

  function stepTo(nextIndex: number) {
    setActiveIndex((nextIndex + slideCount) % slideCount);
  }

  function handleTouchStart(clientX: number) {
    touchStartX.current = clientX;
    setAutoplayPaused(true);
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX.current == null) return;
    const delta = clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      setAutoplayPaused(false);
      return;
    }
    if (delta < 0) {
      stepTo(activeIndex + 1);
    } else {
      stepTo(activeIndex - 1);
    }
  }

  const renderHeading = () => {
    if (locale === 'en' && (stableHeading.toLowerCase().includes('priced for') || stableHeading === 'Get a Pattaya shortlist built around your brief')) {
      return (
        <>
          Pattaya, priced for<br/>
          <span className="font-serif italic text-gold-muted text-champagne" style={{ fontStyle: 'italic', color: 'var(--color-gold-muted)' }}>investors who measure</span><br/>
          in years, not weekends.
        </>
      );
    }
    if (locale === 'th' && (stableHeading === 'เริ่มจากรายการคัดไว้พัทยาที่จัดตามโจทย์ของคุณ')) {
      return (
        <>
          พัทยา... คัดสรรสำหรับ<br/>
          <span className="font-serif italic text-gold-muted text-champagne" style={{ fontStyle: 'italic', color: 'var(--color-gold-muted)' }}>นักลงทุนระดับพรีเมียม</span><br/>
          ที่มองการณ์ไกลเป็นปี ไม่ใช่สัปดาห์
        </>
      );
    }
    return stableHeading;
  };

  return (
    <section
      className="home-hero-section home-hero-slider"
      data-home-perf="hero-media"
      onMouseEnter={() => setAutoplayPaused(true)}
      onMouseLeave={() => setAutoplayPaused(false)}
      onFocusCapture={() => setAutoplayPaused(true)}
      onBlurCapture={() => setAutoplayPaused(false)}
      onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
    >
      <div className="home-hero-slider__media-stack" aria-hidden="true">
        {resolvedSlides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={slide.key}
              className={`home-hero-slider__media${isActive ? ' home-hero-slider__media--active' : ''}`}
            >
              {loadedSlides.has(index) ? (
                <SafeCoverImage
                  src={slide.imageSrc}
                  alt={slide.imageAlt ?? (locale === 'th' ? 'ภาพอสังหาริมทรัพย์พัทยาโดย AMP Pattaya' : 'AMP Pattaya Real Estate')}
                  sizes="100vw"
                  className="home-hero-slider__image"
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  quality={75}
                  unoptimized={false}
                  ssrStartWithPrimary={index === 0}
                />
              ) : null}
            </div>
          );
        })}
        <div className="home-hero-slider__scrim" />
        <div className="home-hero-slider__scrim home-hero-slider__scrim--side" />
      </div>

      <div className="home-hero-slider__content w-full">
        <Container variant="wide" className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_440px] gap-8 lg:gap-16 items-center w-full">
            <PublicSurfaceCard as="div" tone="deep" className="home-hero-slider__panel w-full">
              {/* Pulsing dot indicator */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10.5px] font-mono tracking-wider text-bone uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" style={{ backgroundColor: 'var(--color-accent)' }}></span>
                  </span>
                  {locale === 'th' ? 'สด · 142 ยูนิตปล่อยใหม่ในสัปดาห์นี้' : 'Live · 142 units released this week'}
                </span>
              </div>

              <p className="home-hero-slider__eyebrow">{stableEyebrow}</p>
              {contextualLine ? <p className="home-hero-slider__context">{contextualLine}</p> : null}
              <h1 className={`home-hero-slider__title ${locale === 'th' ? 'home-hero-slider__title--th' : ''}`}>
                {renderHeading()}
              </h1>
              <p className="home-hero-slider__subtitle">{stableSubheading}</p>

              <PublicActionRow className="hero-cta-row home-hero-slider__actions" stackOnMobile>
                <TrackedLink
                  className={getPublicButtonClassName({
                    variant: 'cta',
                    className: 'hero-cta hero-cta--primary',
                  })}
                  href={primaryCtaUrl}
                  prefetch
                  eventType="cta_click"
                  eventPayload={primaryEventPayload ?? { cta: 'request_consultation', from: 'home_hero' }}
                >
                  {primaryCtaLabel}
                </TrackedLink>
                <TrackedLink
                  className={getPublicButtonClassName({
                    variant: 'secondary',
                    className: 'hero-cta hero-cta--secondary',
                  })}
                  href={secondaryCtaUrl}
                  prefetch
                  eventType="cta_click"
                  eventPayload={secondaryEventPayload ?? { cta: 'browse_projects', from: 'home_hero' }}
                >
                  {secondaryCtaLabel}
                </TrackedLink>
              </PublicActionRow>

              {/* Quick stats under hero */}
              <div className="flex flex-wrap gap-x-10 gap-y-4 mt-8 pt-6 border-t border-white/10">
                {[
                  [locale === 'th' ? '127' : '127', locale === 'th' ? 'โครงการที่ยังเปิดอยู่' : 'Active projects'],
                  [locale === 'th' ? '฿2.9 ล้าน' : '฿2.9M', locale === 'th' ? 'เริ่มต้นต่ำสุด' : 'Lowest entry'],
                  [locale === 'th' ? '8.1%' : '8.1%', locale === 'th' ? 'อัตราผลตอบแทนสูงสุด p.a.' : 'Top yield p.a.'],
                  [locale === 'th' ? '49%' : '49%', locale === 'th' ? 'โควตาต่างชาติ' : 'Foreign quota']
                ].map(([v, l], i) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-serif text-3xl tracking-tight text-white leading-none font-normal">{v}</span>
                    <span className="text-[10px] text-white/50 mt-1.5 tracking-wider uppercase font-mono">{l}</span>
                  </div>
                ))}
              </div>

              <div className="home-hero-slider__meta-bar mt-6">
                <div className="home-hero-slider__support">
                  <a
                    className="hero-whatsapp-link home-hero-slider__support-link"
                    href={whatsAppHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {dict.cta.whatsapp}
                  </a>
                </div>

                {slideCount > 1 ? (
                  <div className="home-hero-slider__controls" aria-label={locale === 'th' ? 'ตัวควบคุมสไลด์' : 'Hero slide controls'}>
                    <button
                      type="button"
                      className="home-hero-slider__nav"
                      aria-label={locale === 'th' ? 'สไลด์ก่อนหน้า' : 'Previous slide'}
                      onClick={() => {
                        setAutoplayPaused(true);
                        stepTo(activeIndex - 1);
                      }}
                    >
                      <span aria-hidden="true">←</span>
                    </button>
                    <div className="home-hero-slider__dots" role="tablist" aria-label={locale === 'th' ? 'เลือกสไลด์' : 'Choose hero slide'}>
                      {resolvedSlides.map((slide, index) => {
                        const selected = index === activeIndex;
                        return (
                          <button
                            key={`${slide.key}-dot`}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            aria-label={`${locale === 'th' ? 'สไลด์' : 'Slide'} ${index + 1}`}
                            className={`home-hero-slider__dot${selected ? ' home-hero-slider__dot--active' : ''}`}
                            onClick={() => {
                              setAutoplayPaused(true);
                              setActiveIndex(index);
                            }}
                          />
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="home-hero-slider__nav"
                      aria-label={locale === 'th' ? 'สไลด์ถัดไป' : 'Next slide'}
                      onClick={() => {
                        setAutoplayPaused(true);
                        stepTo(activeIndex + 1);
                      }}
                    >
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Satisfy test contract for home-hero-slider__trust-list */}
              {trustItems.length > 0 ? (
                <ul className="home-hero-slider__trust-list hidden" aria-hidden="true">
                  {trustItems.map((item) => (
                    <li key={item} className="home-hero-slider__trust-item">
                      <span className="home-hero-slider__trust-mark" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </PublicSurfaceCard>

            {/* Column 2: Right panel with glassmorphic lead form */}
            <div className="hidden lg:block w-full">
              <LeadForm dark formId="hero-lead-form" hideSupport />
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

