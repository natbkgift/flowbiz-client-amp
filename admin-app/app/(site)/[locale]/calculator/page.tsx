import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { YieldCalculator } from './_components/YieldCalculator';

export const revalidate = 300;

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const title = locale === 'th' ? 'Investment Calculator' : 'Investment Calculator';
  const description = locale === 'th'
    ? 'เครื่องมือคำนวณ gross yield และ net yield แบบเร็วสำหรับใช้ประกอบการคุยกับ advisor'
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
          <h1 className="section-title">{locale === 'th' ? 'Investment Calculator' : 'Investment Calculator'}</h1>
          <p className="section-subtitle">
            {locale === 'th'
              ? 'คำนวณผลตอบแทนเบื้องต้นก่อนนำตัวเลขไปคุยต่อใน compare, project detail หรือกับ advisor'
              : 'Run a quick yield check before taking the numbers into compare, project detail, or an advisor conversation.'}
          </p>
        </div>

        <YieldCalculator locale={locale} />

        <div className="cta-row mt-8">
          <Link className="btn btn-secondary" href={withLocale(locale, '/compare')}>
            {locale === 'th' ? 'ไปที่ compare' : 'Go to compare'}
          </Link>
          <Link className="btn btn-tertiary" href={withLocale(locale, '/contact')}>
            {locale === 'th' ? 'คุยกับ advisor' : 'Talk to an advisor'}
          </Link>
        </div>
      </Container>
    </main>
  );
}