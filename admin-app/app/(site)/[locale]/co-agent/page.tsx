import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { CTA } from '@/app/_lib/public-cta';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const title = locale === 'th'
    ? 'ร่วมเป็นพาร์ทเนอร์กับ AMP Pattaya'
    : 'Partner with AMP Pattaya';
  const desc = locale === 'th'
    ? 'เข้าร่วมเป็น co-agent กับ AMP Pattaya ขยายฐานลูกค้าด้วยแพลตฟอร์มอสังหาฯ ที่ทันสมัย'
    : 'Join AMP Pattaya as a co-agent partner. Expand your client base with our modern property platform.';
  return makePageMetadata(locale, 'co-agent', title, desc, dict.brand.name);
}

export default function CoAgentPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const th = locale === 'th';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: th ? 'พาร์ทเนอร์' : 'Partner', href: `/${locale}/co-agent` },
  ];
  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">
            {th ? 'ร่วมเป็นพาร์ทเนอร์กับ AMP Pattaya' : 'Partner with AMP Pattaya'}
          </h1>
          <p className="subhead">
            {th
              ? 'ขยายฐานลูกค้าของคุณด้วยแพลตฟอร์มอสังหาริมทรัพย์ที่เน้นข้อมูลและความโปร่งใส'
              : 'Expand your client base with a data-driven, transparent property platform.'}
          </p>
          <div className="cta-row">
            <a className="btn btn-cta" href="#partner-form">
              {th ? 'สมัครเป็นพาร์ทเนอร์' : 'Apply to Partner'}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/about')}>
              {dict.nav.about}
            </a>
          </div>
        </Container>
      </section>

      {/* Why Partner */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {th ? 'ทำไมต้องเป็นพาร์ทเนอร์กับเรา' : 'Why Partner with Us'}
            </h2>
            <p className="section-subtitle">
              {th
                ? 'AMP Pattaya มอบเครื่องมือ ข้อมูล และลูกค้าที่มีคุณภาพให้กับเอเจนท์พาร์ทเนอร์'
                : 'AMP Pattaya provides tools, data, and qualified leads to our agent partners.'}
            </p>
          </div>
          <div className="grid grid-3">
            <div className="card">
              <h3 className="card-title">{th ? 'ลูกค้าคุณภาพ' : 'Qualified Leads'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'รับลูกค้าต่างชาติที่ผ่านการกรองแล้ว พร้อมงบประมาณและไทม์ไลน์ที่ชัดเจน'
                  : 'Receive pre-qualified international buyers with clear budgets and timelines.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'แพลตฟอร์มเทคโนโลยี' : 'Technology Platform'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'เข้าถึงเครื่องมือวิเคราะห์ ROI, Smart Finder, และระบบจัดการรายการทรัพย์สิน'
                  : 'Access ROI analysis tools, Smart Finder, and property management systems.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'ค่าคอมมิชชั่นที่ยุติธรรม' : 'Fair Commission'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'โครงสร้างค่าตอบแทนที่โปร่งใส จ่ายตรงเวลา ไม่มีค่าใช้จ่ายแอบแฝง'
                  : 'Transparent commission structure, on-time payments, no hidden fees.'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {th ? 'ขั้นตอนการเป็นพาร์ทเนอร์' : 'How the Partnership Works'}
            </h2>
            <p className="section-subtitle">
              {th
                ? 'กระบวนการง่ายๆ 3 ขั้นตอน เริ่มต้นได้ภายใน 48 ชั่วโมง'
                : 'A simple 3-step process. Get started within 48 hours.'}
            </p>
          </div>
          <div className="grid grid-3">
            <div className="card">
              <h3 className="card-title">{th ? '1. สมัคร' : '1. Apply'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'กรอกแบบฟอร์มด้านล่าง แจ้งประสบการณ์ พื้นที่เชี่ยวชาญ และประเภททรัพย์สินที่สนใจ'
                  : 'Fill out the form below with your experience, area of expertise, and property types.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? '2. ตรวจสอบ' : '2. Review'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'ทีมเราตรวจสอบใบสมัครและนัดประชุมเพื่อพูดคุยรายละเอียดความร่วมมือ'
                  : 'Our team reviews your application and schedules a call to discuss the partnership.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? '3. เริ่มงาน' : '3. Start'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'เข้าถึงระบบ รับ leads แรก และเริ่มทำงานร่วมกันทันที'
                  : 'Get platform access, receive your first leads, and start collaborating right away.'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* What We Look For */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">
              {th ? 'คุณสมบัติที่เรามองหา' : 'What We Look For'}
            </h2>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <h3 className="card-title">{th ? 'ความรู้ตลาดท้องถิ่น' : 'Local Market Knowledge'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'เข้าใจตลาดอสังหาฯ พัทยาและพื้นที่โดยรอบ รู้ราคาและแนวโน้มปัจจุบัน'
                  : 'Understanding of the Pattaya property market, pricing, and current trends.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'ทักษะภาษา' : 'Language Skills'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'สื่อสารได้ทั้งภาษาไทยและอังกฤษ (หรือภาษาอื่นเพิ่มเติม) เพื่อรองรับลูกค้าต่างชาติ'
                  : 'Thai and English communication skills (additional languages are a plus).'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'ใบอนุญาต' : 'Licensed Agent'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'มีใบอนุญาตนายหน้าอสังหาริมทรัพย์หรือประสบการณ์ที่เทียบเท่า'
                  : 'Registered real estate agent license or equivalent professional experience.'}
              </p>
            </div>
            <div className="card">
              <h3 className="card-title">{th ? 'มุ่งเน้นลูกค้า' : 'Client-First Approach'}</h3>
              <p className="card-subtitle">
                {th
                  ? 'ให้ความสำคัญกับประโยชน์ของลูกค้าเป็นอันดับแรก ทำงานด้วยความโปร่งใส'
                  : 'Prioritise client interests, work transparently, and provide honest guidance.'}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA + Form */}
      <section id="partner-form" className="section section--alt">
        <Container>
          <div className="split">
            <aside className="split__aside">
              <h2 className="section-title">
                {th ? 'พร้อมเริ่มต้นหรือยัง?' : 'Ready to Get Started?'}
              </h2>
              <p className="section-subtitle">
                {th
                  ? 'กรอกแบบฟอร์มเพื่อสมัครเป็นพาร์ทเนอร์ ทีมเราจะตอบกลับภายใน 48 ชั่วโมง'
                  : 'Fill out the form to apply. Our team responds within 48 hours.'}
              </p>

              <div className="cta-row">
                <a className="btn btn-cta" href={CTA.whatsAppUrl} target="_blank" rel="noreferrer">
                  {dict.cta.whatsapp}
                </a>
                <a className="btn btn-secondary" href={CTA.lineUrl} target="_blank" rel="noreferrer">
                  {dict.cta.line}
                </a>
              </div>

              <div className="trust-box">
                <h3 className="trust-box__title">
                  {th ? 'สิ่งที่พาร์ทเนอร์ได้รับ' : 'Partner Benefits'}
                </h3>
                <ul className="bullet-list">
                  <li>{th ? 'ลูกค้าต่างชาติที่ผ่านการคัดกรอง' : 'Pre-screened international buyer leads'}</li>
                  <li>{th ? 'เครื่องมือวิเคราะห์และ CRM' : 'Analytics tools and CRM access'}</li>
                  <li>{th ? 'การฝึกอบรมและสนับสนุน' : 'Training and ongoing support'}</li>
                  <li>{th ? 'ค่าตอบแทนโปร่งใส จ่ายตรงเวลา' : 'Transparent, on-time commission payments'}</li>
                </ul>
              </div>
            </aside>

            <div className="split__main">
              <LeadForm
                heading={th ? 'สมัครเป็นพาร์ทเนอร์' : 'Apply for Partnership'}
                defaultMessage={
                  th
                    ? 'สนใจเป็น co-agent กับ AMP Pattaya ประสบการณ์ของผม/ดิฉันคือ...'
                    : 'I am interested in partnering with AMP Pattaya. My experience includes...'
                }
              />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
