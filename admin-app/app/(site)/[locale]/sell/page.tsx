import dynamic from 'next/dynamic';

const SellerForm = dynamic(
  () => import('@/components/forms/SellerForm').then((m) => m.SellerForm),
  { ssr: false },
);
import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { PAGE_REVALIDATE_SECONDS } from '@/app/_lib/constants';

export const revalidate = PAGE_REVALIDATE_SECONDS;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'sell', dict.sell.eyebrow, dict.sell.metaDescription, dict.brand.name);
}

export default function SellPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <p className="eyebrow">{dict.sell.eyebrow}</p>
          <h1 className="headline">{dict.sell.headline}</h1>
          <p className="subhead">{dict.sell.subhead}</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="split">
            <aside className="split__aside">
              <h2 className="section-title">{dict.sell.whatHappensNext}</h2>
              <ul className="bullet-list">
                {dict.sell.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </aside>

            <div className="split__main">
              <SellerForm heading={dict.sell.formHeading} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
