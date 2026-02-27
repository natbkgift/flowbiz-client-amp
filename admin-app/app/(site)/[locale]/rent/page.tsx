import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { LeadForm } from '@/components/forms/LeadForm';
import { fetchAreas, fetchDevelopers, fetchProjects, fetchProperties } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makeListingPageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return makeListingPageMetadata(locale, 'rent', dict.nav.live, dict.home.pathLive.desc, dict.brand.name, resolvedSearchParams);
}

export default async function RentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.live, href: `/${locale}/rent` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  let areas: Awaited<ReturnType<typeof fetchAreas>> = [];
  let developers: Awaited<ReturnType<typeof fetchDevelopers>> = [];
  let projects: Awaited<ReturnType<typeof fetchProjects>> = [];
  try {
    [res, areas, developers, projects] = await Promise.all([
      fetchProperties({ type: 'rent', limit: 200, sort: 'newest' }),
      fetchAreas(),
      fetchDevelopers(),
      fetchProjects({ limit: 200, page: 1, status_filter: 'published' }),
    ]);
  } catch {
    res = { data: [], meta: { page: 1, limit: 200, total: 0 } };
  }

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.name })).sort((a, b) => a.label.localeCompare(b.label));
  const developerOptions = developers.map((d) => ({ value: d.id, label: d.name })).sort((a, b) => a.label.localeCompare(b.label));
  const allowedProjectIds = new Set((res.data ?? []).map((item) => item.project_id).filter((id): id is string => !!id));
  const projectOptions = projects
    .filter((p) => allowedProjectIds.has(p.id))
    .map((p) => ({ value: p.id, label: p.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const th = locale === 'th';

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{dict.rent.heroTitle}</h1>
          <p className="subhead">{dict.rent.heroSub}</p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/area-guide')}>
              {dict.nav.areaGuide}
            </a>
          </div>
        </Container>
      </section>

      {/* Rental Process */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {th ? 'ขั้นตอนการเช่า' : 'How Renting Works in Pattaya'}
            </h2>
            <p className="section-subtitle">
              {th
                ? 'กระบวนการง่ายๆ 3 ขั้นตอน เราดูแลทุกอย่างให้คุณ'
                : 'A simple 3-step process — we handle everything for you.'}
            </p>
          </div>
          <div className="grid grid-3">
            <div className="card">
              <h3 className="card-title">{th ? '1. บอกเงื่อนไข' : '1. Share Criteria'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'ระบุงบรายเดือน โซนที่ต้องการ จำนวนห้องนอน และระยะเวลาเช่า'
                  : 'Tell us your monthly budget, preferred zone, bedrooms, and lease duration.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? '2. รับ shortlist' : '2. Receive Shortlist'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'เราจัดรายการ 3-7 ยูนิตที่ตรงเงื่อนไข พร้อมรูปและรายละเอียด'
                  : 'We curate 3-7 matching units with photos, details, and pricing.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? '3. ดูห้อง + เซ็นสัญญา' : '3. View & Sign'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'นัดดูห้องจริง เจรจาเงื่อนไข และเซ็นสัญญาเช่า'
                  : 'Schedule viewings, negotiate terms, and sign the lease agreement.'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Typical Costs */}
      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {th ? 'ค่าใช้จ่ายที่ควรรู้' : 'Rental Costs to Expect'}
            </h2>
            <p className="section-subtitle">
              {th
                ? 'ค่าใช้จ่ายเมื่อทำสัญญาเช่าในพัทยา'
                : 'Standard costs when signing a rental agreement in Pattaya.'}
            </p>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <h3 className="card-title">{th ? 'เงินประกัน' : 'Security Deposit'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'ปกติ 2 เดือน (คืนเมื่อสิ้นสุดสัญญา หากไม่มีความเสียหาย)'
                  : 'Typically 2 months (refundable at end of lease if no damage).'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'ค่าเช่าล่วงหน้า' : 'Advance Rent'}</h3>
              <p className="card-subtitle">
                {th
                  ? '1 เดือนล่วงหน้า ชำระพร้อมเงินประกันตอนเซ็นสัญญา'
                  : '1 month in advance, paid together with deposit at signing.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'ค่าน้ำ/ค่าไฟ' : 'Utilities'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'ปกติผู้เช่าจ่ายตามจริง ค่าไฟ ~7-9 ฿/หน่วย ค่าน้ำ ~20-40 ฿/หน่วย'
                  : 'Usually paid by tenant. Electricity ~7-9 ฿/unit, water ~20-40 ฿/unit.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'ค่าส่วนกลาง' : 'Common Area Fee'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'คอนโด: ปกติรวมในค่าเช่าแล้ว | บ้าน: ผู้เช่าจ่ายเอง 1,000-5,000 ฿/เดือน'
                  : 'Condo: usually included in rent | House: tenant pays 1,000-5,000 ฿/month.'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Browse by Type */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.rent.areaTitle}</h2>
            <p className="section-subtitle">{dict.rent.areaDesc}</p>
          </div>
          <div className="grid grid-3">
            <a className="card card--link" href={withLocale(locale, '/rent/condo-pattaya')}>
              <h3 className="card-title">{th ? 'คอนโดเช่า' : 'Condo Rental'}</h3>
              <p className="card-subtitle">{th ? 'คอนโดพร้อมเฟอร์' : 'Furnished condos'}</p>
            </a>
            <a className="card card--link" href={withLocale(locale, '/rent/villa-pattaya')}>
              <h3 className="card-title">{th ? 'วิลล่าเช่า' : 'Villa Rental'}</h3>
              <p className="card-subtitle">{th ? 'พูลวิลล่า' : 'Pool villas'}</p>
            </a>
            <a className="card card--link" href={withLocale(locale, '/rent/house-pattaya')}>
              <h3 className="card-title">{th ? 'บ้านเช่า' : 'House Rental'}</h3>
              <p className="card-subtitle">{th ? 'บ้านเดี่ยว/ทาวน์เฮาส์' : 'Houses & townhouses'}</p>
            </a>
            <a className="card card--link" href={withLocale(locale, '/rent/hotel-pattaya')}>
              <h3 className="card-title">{th ? 'โรงแรมเช่า' : 'Hotel Rental'}</h3>
              <p className="card-subtitle">{th ? 'โรงแรม/เซอร์วิส' : 'Hotels & serviced'}</p>
            </a>
            <a className="card card--link" href={withLocale(locale, '/rent/shop-pattaya')}>
              <h3 className="card-title">{th ? 'ร้านค้าเช่า' : 'Shop Rental'}</h3>
              <p className="card-subtitle">{th ? 'อาคารพาณิชย์' : 'Shophouses & retail'}</p>
            </a>
            <a className="card card--link" href={withLocale(locale, '/rent/office-pattaya')}>
              <h3 className="card-title">{th ? 'สำนักงานเช่า' : 'Office Rental'}</h3>
              <p className="card-subtitle">{th ? 'สำนักงาน/โคเวิร์ก' : 'Office & co-working'}</p>
            </a>
          </div>
        </Container>
      </section>

      {/* Featured Listings */}
      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.rent.featuredTitle}</h2>
          </div>
          <ListingGrid
            items={res.data ?? []}
            areaOptions={areaOptions}
            developerOptions={developerOptions}
            projectOptions={projectOptions}
            preset={{ type: 'rent', status: 'active' }}
            listingSource="rent"
          />
        </Container>
      </section>

      {/* What's Included */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.rent.includedTitle}</h2>
            <p className="section-subtitle">{dict.rent.includedDesc}</p>
          </div>
        </Container>
      </section>

      {/* Trust */}
      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.rent.trustTitle}</h2>
            <p className="section-subtitle">{dict.rent.trustDesc}</p>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.rent.faqTitle}</h2>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <h3 className="card-title">{th ? 'สัญญาเช่าขั้นต่ำ?' : 'Minimum lease period?'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'ส่วนใหญ่ 6-12 เดือน แต่มีตัวเลือกรายเดือนสำหรับบางยูนิต'
                  : 'Most leases are 6-12 months, but monthly options exist for select units.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'จ่ายค่าเช่าอย่างไร?' : 'How to pay rent?'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'โอนบัญชีรายเดือน บางเจ้าของรับบัตรเครดิตหรือ PromptPay'
                  : 'Monthly bank transfer. Some landlords accept credit card or PromptPay.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'ต่างชาติเช่าได้ไหม?' : 'Can foreigners rent?'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'ได้ ไม่มีข้อจำกัดสำหรับการเช่า ต่างจากการซื้อที่มีโควต้า'
                  : 'Yes. Unlike buying, there are no foreign quota restrictions for renting.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'เฟอร์นิเจอร์ครบไหม?' : 'Furnished or unfurnished?'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'คอนโดส่วนใหญ่เฟอร์ครบ บ้าน/วิลล่ามีทั้งแบบเฟอร์ครบและไม่เฟอร์'
                  : 'Most condos are fully furnished. Houses/villas come both furnished and unfurnished.'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{dict.rent.formTitle}</h2>
              <p className="cta-body">{dict.rent.faqDesc}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={dict.rent.formDefault} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
