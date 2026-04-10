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
      eyebrow: locale === 'th' ? 'เส้นทางอยู่อาศัย' : 'Lifestyle track',
      title: locale === 'th'
        ? 'เริ่มจากตัวเลือกที่อยู่จริงได้ก่อน แล้วค่อยลงลึกเฉพาะจุดที่ยังไม่ชัด'
        : 'Open the livable inventory first, then go deeper only where you still need certainty.',
      copy: locale === 'th'
        ? 'ลำดับนี้ช่วยให้ผู้ซื้อเพื่ออยู่อาศัยเห็นทำเลและตัวเลือกที่พร้อมไปต่อก่อน โดยไม่ต้องไหลไปกับข้อมูลยาวเกินจำเป็น'
        : 'This order gets end-users and retirees into workable locations and ready options before the long-scroll content takes over.',
      order: ['buyer', 'investor', 'seller'] as RailAudience[],
    },
    investor: {
      eyebrow: locale === 'th' ? 'มุมมองนักลงทุน' : 'Investor lens',
      title: locale === 'th'
        ? 'เริ่มจากสัญญาณผลตอบแทนก่อน แล้วค่อยเปิดตัวเลือกที่ตรงแผนลงทุน'
        : 'Start with yield signals first, then open the inventory that fits the thesis.',
      copy: locale === 'th'
        ? 'ลำดับนี้ยกภาพผลตอบแทนและบริบทตลาดขึ้นก่อน เพื่อให้นักลงทุนคัดความเสี่ยงและจังหวะได้ก่อนเปิดดูหลายยูนิต'
        : 'This order leads with ROI and market context so investors can filter risk and timing before opening more listings.',
      order: ['investor', 'buyer', 'seller'] as RailAudience[],
    },
    seller: {
      eyebrow: locale === 'th' ? 'เส้นทางเจ้าของทรัพย์' : 'Seller route',
      title: locale === 'th'
        ? 'เริ่มจากความมั่นใจเรื่องการประเมินราคา แล้วค่อยตัดสินใจว่าจะขายหรือปล่อยเช่า'
        : 'Start from valuation confidence, then decide whether to sell or rent out.',
      copy: locale === 'th'
        ? 'เส้นทางนี้เหมาะกับเจ้าของทรัพย์ที่ต้องการประเมินราคา วางตำแหน่ง และเลือกทางไปต่ออย่างมีเหตุผลก่อนส่งรายละเอียดให้ทีม'
        : 'This route is built for owners who need a clearer valuation brief, positioning read, and next-step decision before they hand anything off.',
      order: ['seller', 'buyer', 'investor'] as RailAudience[],
    },
  };

  const items = {
    buyer: {
      key: 'buyer' as const,
      eyebrow: locale === 'th' ? 'ซื้ออยู่เอง' : 'Buyer',
      label: locale === 'th' ? 'เปิดตัวเลือกที่พร้อมซื้อ' : 'Open buy-ready inventory',
      detail: locale === 'th' ? 'เช็กเงื่อนไขและรายการที่คัดไว้' : 'Checklist and curated options',
      href: withLocale(locale, '/buy?source=home_mobile_buyer'),
      eventPayload: { cta: 'home_mobile_buyer', from: 'home_mobile_intent_rail' },
    },
    investor: {
      key: 'investor' as const,
      eyebrow: locale === 'th' ? 'ลงทุน' : 'Investor',
      label: locale === 'th' ? 'เปิดเส้นทางลงทุน' : 'Open ROI / investment path',
      detail: locale === 'th' ? 'ภาพตลาดและกรอบการลงทุน' : 'Market brief and investment path',
      href: withLocale(locale, '/invest?source=home_mobile_investor'),
      eventPayload: { cta: 'home_mobile_investor', from: 'home_mobile_intent_rail' },
    },
    seller: {
      key: 'seller' as const,
      eyebrow: locale === 'th' ? 'ขาย' : 'Seller',
      label: locale === 'th' ? 'เริ่มประเมินฝั่งผู้ขาย' : 'Start valuation brief',
      detail: locale === 'th' ? 'ประเมินราคาและทางเลือกของเจ้าของทรัพย์' : 'Owner pricing and next-step guidance',
      href: withLocale(locale, '/sell?source=home_mobile_seller'),
      eventPayload: { cta: 'home_mobile_seller', from: 'home_mobile_intent_rail' },
    },
  };
  const activeConfig = activeAudience
    ? audienceConfig[activeAudience]
    : {
        eyebrow: locale === 'th' ? 'เส้นทางหลักบนมือถือ' : 'Mobile shortlist paths',
        title: locale === 'th'
          ? 'เลือกเส้นทางที่ตรงโจทย์ก่อน แล้วค่อยให้หน้าถัดไปแคบลงเอง'
          : 'Choose the path that fits first, then let the next step tighten around it.',
        copy: locale === 'th'
          ? 'บล็อกนี้จะจัดลำดับตามสิ่งที่คุณกำลังมองหา เพื่อพาไปยังเส้นทางซื้อ ลงทุน หรือขายที่เหมาะกว่า'
          : 'This block settles around intent so you land in the most relevant buyer, investor, or seller route.',
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
              prefetch={false}
              eventType="cta_click"
              eventPayload={item.eventPayload}
            >
              <div className="home-mobile-intent-chip__header">
                <span className="home-mobile-intent-chip__eyebrow">{item.eyebrow}</span>
                {isActive ? (
                <span className="home-mobile-intent-chip__flag">
                    {locale === 'th' ? 'เหมาะสุดตอนนี้' : 'Recommended now'}
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
