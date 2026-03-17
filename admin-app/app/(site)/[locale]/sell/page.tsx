
import { SellerForm } from '@/components/forms/SellerForm';
import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { buildWhatsAppUrl } from '@/app/_lib/public-cta';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'sell', dict.sell.eyebrow, dict.sell.metaDescription, dict.brand.name);
}

export default async function SellPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <p className="eyebrow">{dict.sell.eyebrow}</p>
          <h1 className="headline">{dict.sell.headline}</h1>
          <p className="subhead">{dict.sell.subhead}</p>
          <div className="cta-row mt-4">
            <a className="btn btn-cta" href="#seller-form">
              {dict.sell.formHeading}
            </a>
            <a
              className="btn btn-secondary"
              href={buildWhatsAppUrl(
                locale === 'th'
                  ? 'สวัสดีครับ AMP Pattaya ผมต้องการส่งรายละเอียดอสังหาฯ เพื่อลงขาย'
                  : 'Hi AMP Pattaya, I want to submit a property for sale review.',
              )}
              target="_blank"
              rel="noreferrer"
            >
              {dict.cta.whatsapp}
            </a>
          </div>
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

            <div className="split__main" id="seller-form">
              <SellerForm heading={dict.sell.formHeading} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}


