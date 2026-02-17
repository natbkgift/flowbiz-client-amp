import type { Metadata } from 'next';

import { SellerForm } from '@/components/forms/SellerForm';
import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return {
    title: `Sell | ${dict.brand.name}`,
    description: 'Submit your property for review.',
  };
}

export default function SellPage({ params }: { params: { locale: string } }) {
  normalizeLocale(params.locale);

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <p className="eyebrow">Sell</p>
          <h1 className="headline">List your property</h1>
          <p className="subhead">Submit your details and we’ll review it for listing.</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="split">
            <aside className="split__aside">
              <h2 className="section-title">What happens next</h2>
              <ul className="bullet-list">
                <li>We review your submission.</li>
                <li>If approved, we create a draft listing for you.</li>
                <li>Our team follows up to confirm details.</li>
              </ul>
            </aside>

            <div className="split__main">
              <SellerForm heading="Seller submission" />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
