import dynamic from 'next/dynamic';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
const LeadForm = dynamic(() => import('@/components/forms/LeadForm').then(m => m.LeadForm), {
  loading: () => <div className="animate-pulse h-48 rounded bg-slate-100" />,
});
import { CTA } from '@/app/_lib/public-cta';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'contact', dict.nav.contact, dict.contact.subtitle, dict.brand.name);
}

export default async function ContactPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
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
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={dict.contact.title}
        subtitle={dict.contact.subtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อ นักลงทุน และผู้เช่าที่ต้องการ next step ชัด' : 'Buyers, investors, and renters who need the next step',
            body: locale === 'th'
              ? 'ใช้หน้านี้เมื่อคุณพร้อมอธิบายงบประมาณ เป้าหมาย และทำเล เพื่อให้ทีมตอบกลับแบบมีทิศทาง'
              : 'Use this when you are ready to share budget, goals, and preferred areas so the team can respond with direction.',
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เลือกช่องทางที่สะดวกที่สุดได้เลย' : 'Choose the channel that fits your pace',
            body: locale === 'th'
              ? 'กรอกฟอร์มไว้ให้ทีมคัด shortlist ต่อ หรือเปิด WhatsApp / LINE เพื่อเริ่มคุยทันที'
              : 'Use the form for a structured request, or message the team directly through WhatsApp or LINE.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ทีมตอบกลับพร้อม action ไม่ใช่ข้อความทั่วไป' : 'Responses are action-oriented, not generic',
            body: locale === 'th'
              ? 'เราออกแบบช่องทางนี้เพื่อส่งต่อไปสู่ shortlist, tour, หรือ consultation ที่ชัดเจน'
              : 'The goal is to turn your request into a concrete shortlist, tour plan, or consultation step.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: '#contact-form',
          label: dict.contact.formTitle,
          eventPayload: { cta: 'open_contact_form', from: 'contact_hero' },
        }}
        secondaryAction={{
          href: withLocaleQuery(locale, '/smart-finder', { source: 'contact_hero' }),
          label: dict.advisory.useSmartFinder,
          eventPayload: { cta: 'use_smart_finder', from: 'contact_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

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

            <div className="split__main" id="contact-form">
              <LeadForm heading={dict.contact.formTitle} defaultMessage={defaultMessage} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

