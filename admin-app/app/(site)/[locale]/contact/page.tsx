import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { LeadForm } from '@/components/forms/LeadForm';
import { CTA } from '@/app/_lib/public-cta';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { breadcrumbSchema, localBusinessSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'contact', dict.nav.contact, dict.contact.subtitle, dict.brand.name);
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const sp = searchParams ? await searchParams : undefined;
  const msg =
    (typeof sp?.msg === 'string' ? sp.msg : Array.isArray(sp?.msg) ? sp?.msg[0] : null) ??
    null;
  const defaultMessage = msg ? `${msg}` : dict.contact.advisoryBody;

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.contact, href: `/${locale}/contact` },
  ];

  const jsonLd = JSON.stringify([
    breadcrumbSchema(
      breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
    ),
    localBusinessSchema(),
  ], null, 0);

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <Breadcrumbs items={breadcrumbItems} />
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
