import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, '/terms', `Terms of Service | ${dict.brand.name}`, 'Terms of Service', dict.brand.name);
}

export default async function TermsPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const isTh = locale === 'th';

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container variant="readable">
          <h1 className="headline">{isTh ? 'ข้อกำหนดการใช้บริการ' : 'Terms of Service'}</h1>
          <p className="hero-subtitle">
            {isTh ? 'เงื่อนไขการใช้งานเว็บไซต์และบริการ' : 'Conditions for using our website and services'}
          </p>
        </Container>
      </section>

      <section className="section">
        <Container variant="readable">
          <div className="content-article">
            <h2>{isTh ? 'ลักษณะการบริการ' : 'Nature of Services'}</h2>
            <p>
              {isTh
                ? 'AMP Pattaya ให้บริการเป็นที่ปรึกษาด้านอสังหาริมทรัพย์ ข้อมูลบนเว็บไซต์นี้จัดทำขึ้นเพื่อเป็นข้อมูลทั่วไปเท่านั้น ไม่ถือเป็นคำแนะนำด้านกฎหมายหรือการลงทุน'
                : 'AMP Pattaya provides real estate advisory services. Information on this website is for general guidance only and does not constitute legal or investment advice.'}
            </p>

            <h2>{isTh ? 'ข้อจำกัดความรับผิดชอบ' : 'Disclaimer'}</h2>
            <p>
              {isTh
                ? 'ข้อมูลราคา ผลตอบแทน และรายละเอียดโครงการอาจเปลี่ยนแปลงได้โดยไม่ต้องแจ้งให้ทราบล่วงหน้า ผลตอบแทนในอดีตไม่รับประกันผลตอบแทนในอนาคต'
                : 'Prices, returns, and project details are subject to change without notice. Past performance does not guarantee future returns.'}
            </p>

            <h2>{isTh ? 'ทรัพย์สินทางปัญญา' : 'Intellectual Property'}</h2>
            <p>
              {isTh
                ? 'เนื้อหา ภาพ และข้อมูลทั้งหมดบนเว็บไซต์นี้เป็นทรัพย์สินของ AMP Pattaya ห้ามทำซ้ำหรือเผยแพร่โดยไม่ได้รับอนุญาต'
                : 'All content, images, and information on this website are the property of AMP Pattaya. Reproduction or distribution without permission is prohibited.'}
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}

