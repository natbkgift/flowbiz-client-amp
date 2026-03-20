import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { BuyingCostEstimatorShell } from './_components/BuyingCostEstimatorShell';

export const revalidate = 300;

function getPageCopy(locale: 'en' | 'th') {
  if (locale === 'th') {
    return {
      title: 'Buying Cost Estimator',
      description: 'ดูภาพรวมค่าโอน ค่าใช้จ่ายปิดการซื้อ และเงินสดที่ควรเตรียมก่อนคุยรายละเอียดต่อกับ advisor',
      subtitle: 'เช็กภาพรวมค่าโอน ค่าใช้จ่ายปิดการซื้อ และประเด็นที่ยังต้องยืนยันเพิ่มเติมสำหรับดีลที่คุณกำลังพิจารณา',
    };
  }

  return {
    title: 'Buying Cost Estimator',
    description: 'Review transfer fees, closing costs, and the cash you may need before speaking with an advisor.',
    subtitle: 'Check the current fee picture, estimated cash needed, and the open questions worth clarifying for your purchase.',
  };
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = getPageCopy(locale);
  return makePageMetadata(locale, 'buying-cost-estimator', copy.title, copy.description, dict.brand.name);
}

export default async function BuyingCostEstimatorPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = getPageCopy(locale);

  return (
    <main id="main-content" className="decision-page decision-page--buying-cost">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: copy.title, href: `/${locale}/buying-cost-estimator` },
        ]}
      />

      <section className="section">
        <Container>
          <div className="section-header">
            <h1 className="section-title">{copy.title}</h1>
            <p className="section-subtitle">{copy.subtitle}</p>
          </div>

          <BuyingCostEstimatorShell locale={locale} />
        </Container>
      </section>
    </main>
  );
}