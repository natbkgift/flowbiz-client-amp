import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { LeadForm } from '@/components/forms/LeadForm';
import { CTA } from '@/app/_lib/public-cta';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
 

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'contact', dict.nav.contact, dict.contact.subtitle, dict.brand.name);
}

export default function ContactPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const msg =
    (typeof searchParams?.msg === 'string' ? searchParams.msg : Array.isArray(searchParams?.msg) ? searchParams?.msg[0] : null) ??
    null;
  const defaultMessage = msg ? `${msg}` : dict.contact.advisoryBody;

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.contact, href: `/${locale}/contact` },
        ]}
      />
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{dict.contact.title}</h1>
          <p className="subhead">{dict.contact.subtitle}</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="split">
            <aside className="split__aside">
              <h2 className="section-title">{dict.contact.advisoryTitle}</h2>
              <p className="section-subtitle">{dict.contact.advisoryBody}</p>

              <div className="cta-row">
                <a className="btn btn-cta" href={CTA.whatsAppUrl} target="_blank" rel="noreferrer">
                  {dict.cta.whatsapp}
                </a>
                <a className="btn btn-secondary" href={CTA.lineUrl} target="_blank" rel="noreferrer">
                  {dict.cta.line}
                </a>
              </div>

              <a className="btn btn-tertiary" href={CTA.phoneTel}>
                {CTA.phoneTel}
              </a>

              <div className="trust-box">
                <h3 className="trust-box__title">{dict.contact.trustTitle}</h3>
                <ul className="bullet-list">
                  {dict.contact.trustBullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="split__main">
              <LeadForm heading={dict.contact.formTitle} defaultMessage={defaultMessage} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
