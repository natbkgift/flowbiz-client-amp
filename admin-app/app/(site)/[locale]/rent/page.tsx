import type { Metadata } from 'next';

import { ListingGrid } from '@/components/listing/ListingGrid';
import { LeadForm } from '@/components/forms/LeadForm';
import { Container } from '@/components/layout/Container';
import { fetchProperties } from '@/app/_lib/public-api-server';

import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/rent`;
  return {
    title: `${dict.nav.live} | ${dict.brand.name}`,
    description: dict.home.pathLive.desc,
    alternates: {
      canonical,
      languages: {
        en: '/en/rent',
        th: '/th/rent',
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${dict.nav.live} | ${dict.brand.name}`,
      description: dict.home.pathLive.desc,
      siteName: dict.brand.name,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
}

export default async function RentPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const res = await fetchProperties({ type: 'rent', limit: 60, sort: 'newest' });

  const t = {
    heroTitle:
      locale === 'th'
        ? 'เช่าคอนโดพัทยา — ไม่มีรายการผี ไม่มีค่าใช้จ่ายแอบแฝง'
        : 'Rent a Condo in Pattaya — No Ghost Listings, No Hidden Fees',
    heroSub:
      locale === 'th'
        ? 'ตอบเร็ว เงื่อนไขชัดเจน ยืนยันว่าง'
        : 'Fast replies, clear terms, and confirmed availability.',
    areaTitle: locale === 'th' ? 'คู่มือทำเลพัทยา' : 'Pattaya Area Guide',
    areaDesc:
      locale === 'th'
        ? 'ยังไม่แน่ใจว่าจะอยู่ที่ไหน? ใช้คู่มือทำเลของเราแล้วบอกลำดับความสำคัญของคุณ'
        : 'Not sure where to live? Use our quick area guide and tell us your priorities.',
    featuredTitle: locale === 'th' ? 'คอนโดเช่าแนะนำ' : 'Featured Rentals',
    includedTitle: locale === 'th' ? 'ทุกรายการเช่ารวมอะไรบ้าง' : "What's Included in Every Rental",
    includedDesc:
      locale === 'th'
        ? 'ข้อกำหนดย้ายเข้าชัดเจน • จัดการชมห้อง • ค่าใช้จ่ายโปร่งใส'
        : 'Clear move-in requirements • viewing coordination • transparent fees.',
    trustTitle: locale === 'th' ? 'ทำไมต้องเลือกเรา' : 'Why Rent Through AMP',
    trustDesc:
      locale === 'th'
        ? 'ทีมท้องถิ่น • นัดชมเร็ว • ยืนยันว่างก่อนนัดทุกครั้ง'
        : 'Local team • fast scheduling • we confirm availability before you waste time.',
    faqTitle: locale === 'th' ? 'คำถามที่พบบ่อย' : 'Frequently Asked Questions',
    faqDesc:
      locale === 'th'
        ? 'สัญญาเช่าทั่วไป เงินมัดจำ และกรอบเวลา — ถามได้เลย'
        : 'Typical lease terms, deposits, and timelines — ask us anything.',
    formTitle: locale === 'th' ? 'บอกเราว่าคุณต้องการอะไร' : "Tell Us What You're Looking For",
    formDefault:
      locale === 'th'
        ? 'ผมสนใจเช่าคอนโดพัทยา งบประมาณและทำเลที่ต้องการคือ...'
        : "I'm looking for a rental in Pattaya. My budget and preferred area are...",
  };

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{t.heroTitle}</h1>
          <p className="subhead">{t.heroSub}</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 className="section-title" style={{ marginBottom: 8 }}>{t.areaTitle}</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t.areaDesc}</p>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <h2 className="section-title" style={{ marginBottom: 16 }}>{t.featuredTitle}</h2>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 className="section-title" style={{ marginBottom: 8 }}>{t.includedTitle}</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t.includedDesc}</p>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <h2 className="section-title" style={{ marginBottom: 8 }}>{t.trustTitle}</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t.trustDesc}</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 className="section-title" style={{ marginBottom: 8 }}>{t.faqTitle}</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>{t.faqDesc}</p>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <h2 className="section-title" style={{ marginBottom: 12 }}>{t.formTitle}</h2>
          <LeadForm defaultMessage={t.formDefault} />
        </Container>
      </section>
    </main>
  );
}
