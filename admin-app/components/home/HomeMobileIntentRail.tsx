'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { withLocale } from '@/app/_lib/i18n/routing';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { trackEvent } from '@/lib/analytics';
import { getContentRecommendation, getVisitorIntent, type VisitorIntent } from '@/lib/personalization';

type RailAudience = 'buyer' | 'investor' | 'seller';

function resolveAudience(intent: VisitorIntent): RailAudience | null {
  if (intent === 'invest') return 'investor';
  if (intent === 'buy' || intent === 'rent') return 'buyer';
  if (intent === 'sell') return 'seller';
  return null;
}

function resolveAudienceFromRecommendation(): RailAudience {
  const recommendation = getContentRecommendation();
  if (recommendation.emphasis === 'roi_data') return 'investor';
  if (recommendation.emphasis === 'advisory') return 'seller';
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
      eyebrow: locale === 'th' ? 'Buyer momentum' : 'Buyer momentum',
      title: locale === 'th'
        ? 'เปิดยูนิตที่พร้อมซื้อก่อน แล้วค่อยลงรายละเอียดลึก'
        : 'Open buy-ready inventory first, then go deeper only when it matters.',
      copy: locale === 'th'
        ? 'ลำดับนี้ดัน inventory และ shortlist path ขึ้นก่อน เพื่อให้ผู้ซื้อไม่เสีย momentum ไปกับการเปิดหลาย route โดยยังไม่เห็นตัวเลือกที่ใช้ได้จริง'
        : 'This order pushes inventory and shortlist actions first so buyers do not lose momentum before seeing workable options.',
      order: ['buyer', 'investor', 'seller'] as RailAudience[],
    },
    investor: {
      eyebrow: locale === 'th' ? 'Investor lens' : 'Investor lens',
      title: locale === 'th'
        ? 'เริ่มจาก yield signal ก่อน แล้วค่อยเปิด inventory ที่คุ้มกับ thesis'
        : 'Start with yield signals first, then open the inventory that fits the thesis.',
      copy: locale === 'th'
        ? 'ลำดับนี้เอา ROI และ market lens ขึ้นก่อน เพื่อให้นักลงทุนคัดความเสี่ยงและจังหวะได้ก่อนกดดูยูนิตจำนวนมาก'
        : 'This order leads with ROI and market context so investors can filter risk and timing before opening more listings.',
      order: ['investor', 'buyer', 'seller'] as RailAudience[],
    },
    seller: {
      eyebrow: locale === 'th' ? 'Seller advisory' : 'Seller advisory',
      title: locale === 'th'
        ? 'เริ่มจาก valuation confidence แล้วค่อยเลือกทางลัดที่เหมาะกับจังหวะขาย'
        : 'Start from valuation confidence, then choose the quickest route for your sell timing.',
      copy: locale === 'th'
        ? 'ลำดับนี้ดัน valuation brief ขึ้นก่อน เพื่อให้เจ้าของทรัพย์เริ่มจากราคา จังหวะปล่อย และ handoff ที่ทีมช่วยต่อได้จริง'
        : 'This order leads with the valuation brief so owners start from pricing, launch timing, and a clearer advisory handoff.',
      order: ['seller', 'buyer', 'investor'] as RailAudience[],
    },
  };

  const items = {
    buyer: {
      key: 'buyer' as const,
      eyebrow: locale === 'th' ? 'Buyer' : 'Buyer',
      label: locale === 'th' ? 'เปิด buy-ready inventory' : 'Open buy-ready inventory',
      detail: locale === 'th' ? 'Checklist + ตัวเลือกคัดสรร' : 'Checklist + curated options',
      href: withLocale(locale, '/buy?source=home_mobile_buyer'),
      eventPayload: { cta: 'home_mobile_buyer', from: 'home_mobile_intent_rail' },
    },
    investor: {
      key: 'investor' as const,
      eyebrow: locale === 'th' ? 'Investor' : 'Investor',
      label: locale === 'th' ? 'เปิด ROI / investment path' : 'Open ROI / investment path',
      detail: locale === 'th' ? 'Brief ตลาด + เส้นทางลงทุน' : 'Market brief + investment path',
      href: withLocale(locale, '/invest?source=home_mobile_investor'),
      eventPayload: { cta: 'home_mobile_investor', from: 'home_mobile_intent_rail' },
    },
    seller: {
      key: 'seller' as const,
      eyebrow: locale === 'th' ? 'Seller' : 'Seller',
      label: locale === 'th' ? 'เริ่ม valuation brief' : 'Start valuation brief',
      detail: locale === 'th' ? 'ราคา + จังหวะขาย + handoff' : 'Pricing + launch timing + handoff',
      href: withLocale(locale, '/sell?source=home_mobile_seller'),
      eventPayload: { cta: 'home_mobile_seller', from: 'home_mobile_intent_rail' },
    },
  };
  const activeConfig = activeAudience
    ? audienceConfig[activeAudience]
    : {
        eyebrow: locale === 'th' ? 'Mobile shortlist paths' : 'Mobile shortlist paths',
        title: locale === 'th'
          ? 'เลือกเส้นทางที่ตรงโจทย์ก่อน แล้วระบบค่อยเรียง next step ให้'
          : 'Choose the path that fits first, then let the next step tighten around it.',
        copy: locale === 'th'
          ? 'บล็อกนี้จะปรับตาม intent หลัง hydrate เสร็จ เพื่อหลีกเลี่ยง buyer flash ที่ทำให้หน้าไม่นิ่ง'
          : 'This block settles after hydration so the page does not flash the wrong buyer-first variant.',
        order: ['buyer', 'investor', 'seller'] as RailAudience[],
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