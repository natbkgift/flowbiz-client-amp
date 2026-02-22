import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'privacy', `Privacy Policy | ${dict.brand.name}`, 'Privacy Policy & Data Protection', dict.brand.name);
}

export default function PrivacyPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = normalizeLocale(params.locale);
  const isTh = locale === 'th';
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: isTh ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy', href: `/${locale}/privacy` },
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
          <h1 className="headline">{isTh ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}</h1>
          <p className="hero-subtitle">
            {isTh
              ? 'ข้อมูลเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคลตาม PDPA และ GDPR'
              : 'How we collect, use, and protect your personal data under PDPA and GDPR'}
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="content-article">
            <h2>{isTh ? 'การเก็บรวบรวมข้อมูล' : 'Data Collection'}</h2>
            <p>
              {isTh
                ? 'เราเก็บรวบรวมข้อมูลส่วนบุคคลเฉพาะที่จำเป็นสำหรับการให้บริการที่ปรึกษาด้านอสังหาริมทรัพย์ ข้อมูลที่เก็บได้แก่: ชื่อ, อีเมล, หมายเลขโทรศัพท์, และข้อมูลเกี่ยวกับความสนใจในอสังหาริมทรัพย์ของท่าน'
                : 'We collect only personal data necessary for providing our real estate advisory services. This includes: name, email, phone number, and your property interest preferences.'}
            </p>

            <h2>{isTh ? 'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)' : 'PDPA Compliance'}</h2>
            <p>
              {isTh
                ? 'เราปฏิบัติตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ของประเทศไทย ท่านมีสิทธิ์ในการเข้าถึง แก้ไข ลบ หรือถอนความยินยอมในการใช้ข้อมูลส่วนบุคคลของท่านได้ตลอดเวลา'
                : 'We comply with Thailand\'s Personal Data Protection Act (PDPA) B.E. 2562. You have the right to access, correct, delete, or withdraw consent for the use of your personal data at any time.'}
            </p>

            <h2>{isTh ? 'การปฏิบัติตาม GDPR' : 'GDPR Compliance'}</h2>
            <p>
              {isTh
                ? 'สำหรับลูกค้าในสหภาพยุโรป เราปฏิบัติตามข้อบังคับ General Data Protection Regulation (GDPR) ท่านมีสิทธิ์ในการร้องขอให้ลบข้อมูล การเคลื่อนย้ายข้อมูล และการจำกัดการประมวลผล'
                : 'For our European clients, we comply with the General Data Protection Regulation (GDPR). You have the right to request data erasure, data portability, and restriction of processing.'}
            </p>

            <h2>{isTh ? 'การใช้ข้อมูล' : 'Data Usage'}</h2>
            <ul className="bullet-list">
              <li>{isTh ? 'ให้บริการที่ปรึกษาด้านอสังหาริมทรัพย์ตามที่ท่านร้องขอ' : 'Providing property advisory services as requested'}</li>
              <li>{isTh ? 'ส่งข้อมูลโครงการที่ตรงกับความสนใจของท่าน' : 'Sending relevant project information matching your interests'}</li>
              <li>{isTh ? 'ปรับปรุงประสบการณ์การใช้งานเว็บไซต์' : 'Improving website experience through first-party analytics'}</li>
            </ul>

            <h2>{isTh ? 'การถอนความยินยอม' : 'Consent Withdrawal'}</h2>
            <p>
              {isTh
                ? 'ท่านสามารถถอนความยินยอมได้ทุกเมื่อโดยติดต่อเราที่ info@amppattaya.com หรือผ่านแบบฟอร์มติดต่อบนเว็บไซต์'
                : 'You may withdraw your consent at any time by contacting us at info@amppattaya.com or through our contact form.'}
            </p>

            <h2>{isTh ? 'การเก็บรักษาข้อมูล' : 'Data Retention'}</h2>
            <p>
              {isTh
                ? 'เราเก็บรักษาข้อมูลส่วนบุคคลของท่านเฉพาะเท่าที่จำเป็นสำหรับวัตถุประสงค์ที่ระบุ หรือตามที่กฎหมายกำหนด'
                : 'We retain your personal data only as long as necessary for the stated purposes or as required by law.'}
            </p>

            <h2>{isTh ? 'ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล' : 'Contact Data Protection Officer'}</h2>
            <p>
              {isTh
                ? 'หากท่านมีคำถามเกี่ยวกับความเป็นส่วนตัวหรือต้องการใช้สิทธิ์ของท่าน กรุณาติดต่อ: info@amppattaya.com'
                : 'For privacy questions or to exercise your rights, please contact: info@amppattaya.com'}
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
