import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { YieldCalculator } from './_components/YieldCalculator';

export const revalidate = 300;

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const title = locale === 'th' ? 'เครื่องมือคำนวณผลตอบแทนการลงทุน' : 'Investment Calculator';
  const description = locale === 'th'
    ? 'เครื่องมือคำนวณอัตราผลตอบแทนเบื้องต้นสำหรับใช้ต่อยอดไปยัง compare และคุยกับที่ปรึกษา'
    : 'A quick gross and net yield calculator for advisory conversations.';
  return makePageMetadata(locale, 'calculator', title, description, dict.brand.name);
}

export default async function CalculatorPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);

  return (
    <main className="section" id="main-content">
      <Container>
        <div className="section-header">
          <h1 id="calculator-page-title" className="section-title">{locale === 'th' ? 'เครื่องมือคำนวณผลตอบแทนการลงทุน' : 'Investment Calculator'}</h1>
          <p className="section-subtitle">
            {locale === 'th'
              ? 'คำนวณผลตอบแทนเบื้องต้นก่อนนำตัวเลขไปคุยต่อใน compare, หน้าโครงการ, หรือกับที่ปรึกษา'
              : 'Run a quick yield check before taking the numbers into compare, project detail, or an advisor conversation.'}
          </p>
        </div>

        <YieldCalculator locale={locale} />
      </Container>
    </main>
  );
}