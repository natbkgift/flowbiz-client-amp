import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';
import { fetchAreaStatisticsBySlug } from '@/app/_lib/public-api-server';

const AREA_SLUGS = ['jomtien', 'pratumnak', 'wongamat', 'central'] as const;

type AreaSlug = (typeof AREA_SLUGS)[number];

type AreaCopy = {
  titleEn: string;
  titleTh: string;
  buyerTypesEn: string[];
  buyerTypesTh: string[];
};

const AREA_COPY: Record<AreaSlug, AreaCopy> = {
  jomtien: {
    titleEn: 'Jomtien',
    titleTh: 'จอมเทียน',
    buyerTypesEn: ['Long-stay renters', 'Lifestyle buyers', 'Yield-focused investors (when demand supports)'],
    buyerTypesTh: ['ผู้เช่าระยะยาว', 'ผู้ซื้อเพื่อไลฟ์สไตล์', 'นักลงทุนที่เน้นผลตอบแทน (เมื่อดีมานด์รองรับ)'],
  },
  pratumnak: {
    titleEn: 'Pratumnak',
    titleTh: 'พระตำหนัก',
    buyerTypesEn: ['Quiet-lifestyle buyers', 'Privacy-first owners', 'Selective investors'],
    buyerTypesTh: ['ผู้ซื้อที่ชอบความสงบ', 'เจ้าของที่เน้นความเป็นส่วนตัว', 'นักลงทุนสายคัดเลือก'],
  },
  wongamat: {
    titleEn: 'Wongamat',
    titleTh: 'วงศ์อมาตย์',
    buyerTypesEn: ['Premium buyers', 'Beach-adjacent lifestyle owners', 'Defensive investors'],
    buyerTypesTh: ['ผู้ซื้อระดับพรีเมียม', 'เจ้าของเพื่อไลฟ์สไตล์ติดทะเล', 'นักลงทุนสายเน้นความปลอดภัย'],
  },
  central: {
    titleEn: 'Central Pattaya',
    titleTh: 'พัทยากลาง',
    buyerTypesEn: ['Convenience buyers', 'Active city renters', 'Balanced investors'],
    buyerTypesTh: ['ผู้ซื้อที่เน้นความสะดวก', 'ผู้เช่าที่ชอบในเมือง', 'นักลงทุนสายสมดุล'],
  },
};

function isAreaSlug(slug: string): slug is AreaSlug {
  return (AREA_SLUGS as readonly string[]).includes(slug);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  const slug = params.slug;
  const canonical = `/${locale}/areas/${encodeURIComponent(slug)}`;

  const titleBase = isAreaSlug(slug)
    ? locale === 'th'
      ? AREA_COPY[slug].titleTh
      : AREA_COPY[slug].titleEn
    : 'Area';

  return {
    title: `${titleBase} | ${dict.brand.name}`,
    description: 'Area guidance with pricing and rental demand snapshots (when available).',
    alternates: {
      canonical,
      languages: {
        en: `/en/areas/${encodeURIComponent(slug)}`,
        th: `/th/areas/${encodeURIComponent(slug)}`,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${titleBase} | ${dict.brand.name}`,
      description: 'Area guidance with pricing and rental demand snapshots (when available).',
      siteName: dict.brand.name,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
}

export default async function AreaPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  if (!isAreaSlug(params.slug)) {
    return (
      <main className="section" id="main-content">
        <Container>
          <h1 className="section-title">{locale === 'th' ? 'ไม่พบพื้นที่' : 'Area not found'}</h1>
          <p className="section-subtitle">{locale === 'th' ? 'ลิงก์อาจไม่ถูกต้อง' : 'The link may be invalid.'}</p>
          <div className="cta-row" style={{ marginTop: 16 }}>
            <Link className="btn btn-cta" href={withLocale(locale, '/area-guide')}>
              {locale === 'th' ? 'กลับไป Area Guide' : 'Back to Area Guide'}
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  const copy = AREA_COPY[params.slug];
  const stats = await fetchAreaStatisticsBySlug(params.slug);

  const title = locale === 'th' ? copy.titleTh : copy.titleEn;
  const buyerTypes = locale === 'th' ? copy.buyerTypesTh : copy.buyerTypesEn;

  const hasStats = Boolean(stats?.statistics);

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{title}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'คำแนะนำพื้นที่ + snapshot ราคา/ค่าเช่า (เมื่อมีข้อมูล)'
              : 'Area guidance + pricing/rent snapshots (when available).'}
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="grid grid-2">
            <div className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'Price trend' : 'Price trend'}</h2>
              <p className="card-subtitle">
                {hasStats
                  ? locale === 'th'
                    ? 'ตอนนี้ระบบมี snapshot ล่าสุด (ยังไม่มีข้อมูลย้อนหลังเพื่อคำนวณแนวโน้ม)'
                    : 'Currently provides the latest snapshot (no historical series to compute trends yet).'
                  : locale === 'th'
                    ? 'ยังไม่มีข้อมูล snapshot สำหรับพื้นที่นี้'
                    : 'No snapshot data available for this area yet.'}
              </p>
              <ul className="bullet-list" style={{ marginTop: 12 }}>
                <li>avg_price: {stats?.statistics?.avg_price ?? '—'}</li>
                <li>as_of: {stats?.statistics?.as_of ?? '—'}</li>
              </ul>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'Rental demand profile' : 'Rental demand profile'}</h2>
              <p className="card-subtitle">
                {hasStats
                  ? locale === 'th'
                    ? 'แสดง snapshot ค่าเช่าเฉลี่ย (ไม่ใช่การการันตีดีมานด์)'
                    : 'Shows avg rent snapshot (not a guarantee of demand).'
                  : locale === 'th'
                    ? 'ยังไม่มี snapshot ค่าเช่าเฉลี่ยสำหรับพื้นที่นี้'
                    : 'No avg rent snapshot available for this area yet.'}
              </p>
              <ul className="bullet-list" style={{ marginTop: 12 }}>
                <li>avg_rent: {stats?.statistics?.avg_rent ?? '—'}</li>
                <li>roi_percent: {stats?.statistics?.roi_percent ?? '—'}</li>
              </ul>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'Suitable buyer type' : 'Suitable buyer type'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'เป็นคำแนะนำเพื่อช่วยตัดสินใจ (ไม่ใช่ข้อสรุปตายตัว)'
                  : 'Guidance to support decision-making (not definitive).'}
              </p>
              <ul className="bullet-list" style={{ marginTop: 12 }}>
                {buyerTypes.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'Next step' : 'Next step'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ใช้ Smart Finder เพื่อ shortlist โครงการ แล้วเปรียบเทียบ'
                  : 'Use Smart Finder to shortlist projects, then compare.'}
              </p>
              <div className="cta-row" style={{ marginTop: 12 }}>
                <Link className="btn btn-cta" href={withLocale(locale, '/smart-finder')}>
                  {locale === 'th' ? 'ไป Smart Finder' : 'Go to Smart Finder'}
                </Link>
                <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
                  {locale === 'th' ? 'ดู Projects' : 'Browse Projects'}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
