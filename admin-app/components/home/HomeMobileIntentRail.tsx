'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { withLocale } from '@/app/_lib/i18n/routing';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { trackEvent } from '@/lib/analytics';
import { getContentRecommendation, getVisitorIntent, type VisitorIntent } from '@/lib/personalization';

type RailAudience = 'buyer' | 'investor' | 'luxury';

function resolveAudience(intent: VisitorIntent): RailAudience | null {
  if (intent === 'invest') return 'investor';
  if (intent === 'buy' || intent === 'rent') return 'buyer';
  if (intent === 'sell') return 'luxury';
  return null;
}

function resolveAudienceFromRecommendation(): RailAudience {
  const recommendation = getContentRecommendation();
  if (recommendation.emphasis === 'roi_data') return 'investor';
  if (recommendation.emphasis === 'advisory') return 'luxury';
  return 'buyer';
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(max-width: 767px)').matches;
}

export function HomeMobileIntentRail({ locale }: { locale: 'en' | 'th' }) {
  const [activeAudience, setActiveAudience] = useState<RailAudience | null>(null);
  const [mobileViewport, setMobileViewport] = useState(false);
  const pathname = usePathname() ?? '/';

  useEffect(() => {
    const syncViewport = () => setMobileViewport(isMobileViewport());
    syncViewport();

    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleViewportChange = () => syncViewport();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleViewportChange);
      return () => {
        mediaQuery.removeEventListener('change', handleViewportChange);
      };
    }

    mediaQuery.addListener(handleViewportChange);
    return () => {
      mediaQuery.removeListener(handleViewportChange);
    };
  }, []);

  useEffect(() => {
    const intentAudience = resolveAudience(getVisitorIntent());
    const nextAudience = intentAudience ?? resolveAudienceFromRecommendation();
    setActiveAudience(nextAudience);
  }, []);

  useEffect(() => {
    if (!mobileViewport || !activeAudience) {
      return;
    }

    void trackEvent('experiment_exposure', pathname, {
      source_route: 'home',
      locale,
      experiment_id: 'home_mobile_intent_order_v2',
      variant_id: activeAudience,
      entity_type: 'module',
      entity_name: 'home_mobile_intent_rail',
      context: {
        audience: activeAudience,
      },
    });
  }, [activeAudience, locale, mobileViewport, pathname]);

  const audienceConfig = {
    buyer: {
      eyebrow: locale === 'th' ? 'เส้นทางอยู่อาศัย' : 'Lifestyle track',
      title: locale === 'th'
        ? 'เริ่มจากยูนิตที่อยู่จริงได้ก่อน แล้วค่อยลงลึกเฉพาะสิ่งที่ยังไม่ชัด'
        : 'Open the livable inventory first, then go deeper only where you still need certainty.',
      copy: locale === 'th'
        ? 'ลำดับนี้ช่วยให้ผู้ซื้ออยู่อาศัยจริงเห็นทำเลและตัวเลือกที่ใช้งานได้ก่อน ไม่ต้องไหลไปกับหน้าเนื้อหาที่ยาวเกินจำเป็น'
        : 'This order gets end-users and retirees into workable locations and ready options before the long-scroll content takes over.',
      order: ['buyer', 'investor', 'luxury'] as RailAudience[],
    },
    investor: {
      eyebrow: locale === 'th' ? 'มุมมองนักลงทุน' : 'Investor lens',
      title: locale === 'th'
        ? 'เริ่มจากสัญญาณผลตอบแทนก่อน แล้วค่อยเปิดยูนิตที่เหมาะกับแผนลงทุน'
        : 'Start with yield signals first, then open the inventory that fits the thesis.',
      copy: locale === 'th'
        ? 'ลำดับนี้ยกเรื่องผลตอบแทนและภาพตลาดขึ้นก่อน เพื่อให้นักลงทุนคัดความเสี่ยงและจังหวะได้ก่อนเปิดดูยูนิตจำนวนมาก'
        : 'This order leads with ROI and market context so investors can filter risk and timing before opening more listings.',
      order: ['investor', 'buyer', 'luxury'] as RailAudience[],
    },
    luxury: {
      eyebrow: locale === 'th' ? 'เส้นทางพรีเมียม' : 'Luxury handoff',
      title: locale === 'th'
        ? 'เริ่มจากการนัดชมแบบเป็นส่วนตัวและตัวเลือกชุดสั้น แทนการไล่ดูยูนิตแบบพอร์ทัล'
        : 'Start from a private tour and a shorter luxury shortlist instead of browsing like a portal.',
      copy: locale === 'th'
        ? 'เส้นทางนี้เหมาะกับผู้ซื้อระดับบนที่ต้องการความเป็นส่วนตัว ภาพลักษณ์ และทีมช่วยคัดรายการก่อนนัดดูจริง'
        : 'This route is built for prestige buyers who want privacy, better brand feel, and a discreet handoff into the right inventory.',
      order: ['luxury', 'buyer', 'investor'] as RailAudience[],
    },
  };

  const items = {
    buyer: {
      key: 'buyer' as const,
      eyebrow: locale === 'th' ? 'ซื้ออยู่เอง' : 'Buyer',
      label: locale === 'th' ? 'เปิดยูนิตที่พร้อมซื้อ' : 'Open buy-ready inventory',
      detail: locale === 'th' ? 'เช็กลิสต์ + ตัวเลือกคัดสรร' : 'Checklist + curated options',
      href: withLocale(locale, '/buy?source=home_mobile_buyer'),
      eventPayload: { cta: 'home_mobile_buyer', from: 'home_mobile_intent_rail' },
    },
    investor: {
      key: 'investor' as const,
      eyebrow: locale === 'th' ? 'ลงทุน' : 'Investor',
      label: locale === 'th' ? 'เปิดเส้นทางลงทุน' : 'Open ROI / investment path',
      detail: locale === 'th' ? 'ภาพตลาด + แนวทางลงทุน' : 'Market brief + investment path',
      href: withLocale(locale, '/invest?source=home_mobile_investor'),
      eventPayload: { cta: 'home_mobile_investor', from: 'home_mobile_intent_rail' },
    },
    luxury: {
      key: 'luxury' as const,
      eyebrow: locale === 'th' ? 'พรีเมียม' : 'High-end',
      label: locale === 'th' ? 'เปิดเส้นทางนัดชมแบบส่วนตัว' : 'Open private tour route',
      detail: locale === 'th' ? 'ตัวเลือกชุดสั้น + การประสานงานแบบตรงจุด' : 'Luxury shortlist + discreet handoff',
      href: withLocale(locale, '/contact?topic=private_tour&source=home_mobile_luxury'),
      eventPayload: { cta: 'home_mobile_luxury', from: 'home_mobile_intent_rail' },
    },
  };
  const activeConfig = activeAudience
    ? audienceConfig[activeAudience]
    : {
        eyebrow: locale === 'th' ? 'เส้นทางหลักบนมือถือ' : 'Mobile shortlist paths',
        title: locale === 'th'
          ? 'เลือกเส้นทางที่ตรงโจทย์ก่อน แล้วค่อยไปยังขั้นตอนถัดไปที่เหมาะกว่า'
          : 'Choose the path that fits first, then let the next step tighten around it.',
        copy: locale === 'th'
          ? 'บล็อกนี้จะจัดลำดับตามความสนใจ เพื่อพาคุณไปยังเส้นทางอยู่อาศัย ลงทุน หรือพรีเมียมที่เหมาะกว่า'
          : 'This block settles around intent so you land in the most relevant investor, lifestyle, or luxury route.',
        order: ['buyer', 'investor', 'luxury'] as RailAudience[],
      };
  const orderedItems = activeConfig.order.map((key) => items[key]);

  return (
    <section
      className="home-mobile-intent-rail"
      data-home-mobile-active={activeAudience ?? 'neutral'}
      data-home-perf="mobile-intent-rail"
      aria-label={locale === 'th' ? 'เส้นทางหลักสำหรับมือถือ' : 'Mobile-first primary paths'}
    >
      <div className="home-mobile-intent-rail__intro">
        <p className="home-mobile-intent-rail__eyebrow">{activeConfig.eyebrow}</p>
        <h2 className="home-mobile-intent-rail__title">{activeConfig.title}</h2>
        <p className="home-mobile-intent-rail__copy">{activeConfig.copy}</p>
      </div>

      <div className="home-mobile-intent-rail__grid">
        {orderedItems.map((item) => {
          const isActive = item.key === activeAudience;
          return (
            <TrackedLink
              key={item.key}
              className={`home-mobile-intent-chip home-mobile-intent-chip--${item.key}${isActive ? ' home-mobile-intent-chip--active' : ''}`}
              href={item.href}
              prefetch={false}
              eventType="cta_click"
              eventPayload={item.eventPayload}
            >
              <div className="home-mobile-intent-chip__header">
                <span className="home-mobile-intent-chip__eyebrow">{item.eyebrow}</span>
                {isActive ? (
                  <span className="home-mobile-intent-chip__flag">
                    {locale === 'th' ? 'แนะนำตอนนี้' : 'Recommended now'}
                  </span>
                ) : null}
              </div>
              <strong className="home-mobile-intent-chip__label">{item.label}</strong>
              <span className="home-mobile-intent-chip__detail">{item.detail}</span>
            </TrackedLink>
          );
        })}
      </div>
    </section>
  );
}
