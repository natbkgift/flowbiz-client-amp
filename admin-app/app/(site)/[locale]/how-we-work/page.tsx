import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { fetchCompanyInfoBySlug, fetchPublishedTeamMembers } from '@/app/_lib/public-api-server';
import { resolveCmsText, splitIntoParagraphs } from '@/app/_lib/public-content';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  },
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const processInfo = await fetchCompanyInfoBySlug('how-we-work').catch(() => null);
  return makePageMetadata(
    locale,
    'how-we-work',
    processInfo?.meta_title || (locale === 'th' ? 'How we work' : 'How we work'),
    processInfo?.meta_description || dict.about.heroSubtitle,
    dict.brand.name,
  );
}

export default async function HowWeWorkPage(
  props: {
    params: Promise<{ locale: string }>;
  },
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  const [processInfo, teamMembers] = await Promise.all([
    fetchCompanyInfoBySlug('how-we-work').catch(() => null),
    fetchPublishedTeamMembers().catch(() => []),
  ]);

  const paragraphs = splitIntoParagraphs(
    resolveCmsText(processInfo?.content, locale)
      || [
        locale === 'th'
          ? 'ทุก engagement เริ่มจาก brief ที่ชัดเจนเพื่อคุมทิศทางของ shortlist, budget และ next step ให้ตรงกันก่อน'
          : 'Every engagement starts with a clear brief so the shortlist, budget lens, and next step stay aligned from the start.',
        locale === 'th'
          ? 'จากนั้นทีมจะคัดตัวเลือก ตรวจ context ที่ต้องใช้ และพาไปยังขั้นตอนถัดไปที่ทำได้จริงโดยไม่ยืด loop เกินจำเป็น'
          : 'The team then curates options, verifies the context that matters, and moves the conversation to the next practical step without stretching the loop.',
      ].join('\n\n'),
  );

  const processCards = [
    {
      title: locale === 'th' ? '1. รับ brief ให้ชัด' : '1. Clarify the brief',
      body: locale === 'th'
        ? 'เริ่มจากงบ เป้าหมาย ทำเล และ timeframe ก่อน เพื่อไม่ให้ shortlist หลุดโจทย์'
        : 'Budget, goal, area, and timeframe are locked first so the shortlist stays on brief.',
    },
    {
      title: locale === 'th' ? '2. คัด shortlist พร้อม trade-offs' : '2. Curate with trade-offs',
      body: locale === 'th'
        ? 'ทีมจะคัดตัวเลือกที่เหมาะจริง พร้อมบอกสิ่งที่ควรยอมรับและสิ่งที่ควรเลี่ยง'
        : 'The team narrows the field and explains the trade-offs worth accepting or avoiding.',
    },
    {
      title: locale === 'th' ? '3. พาไปยัง next step ที่ทำได้จริง' : '3. Move into the real next step',
      body: locale === 'th'
        ? 'เมื่อ shortlist เริ่มนิ่งแล้ว ค่อยไปต่อที่ compare, viewing, หรือ consultation ที่ชัดขึ้น'
        : 'Once the shortlist is shaped, the flow moves into compare, viewing, or a tighter consultation step.',
    },
  ];

  return (
    <main id="main-content" className="page-template--narrative">
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={processInfo?.title || (locale === 'th' ? 'How we work' : 'How we work')}
        subtitle={paragraphs[0] || dict.about.heroSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'คนที่ต้องการเข้าใจ flow ก่อนคุยเรื่องยูนิต' : 'People who want the workflow before unit-level talk',
            body: locale === 'th'
              ? 'หน้านี้อธิบายลำดับการทำงานของทีมเมื่อรับ brief จริง'
              : 'This page explains the operating sequence the team follows on live briefs.',
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ดู flow แล้วค่อยไปต่อที่ about หรือ contact' : 'Review the flow, then move to about or contact',
            body: locale === 'th'
              ? 'เมื่อเข้าใจวิธีทำงานแล้ว จะตัดสินใจได้ง่ายขึ้นว่าควรส่ง brief ตอนนี้หรือกลับไปดูทีมก่อน'
              : 'Once the operating model is clear, it becomes easier to decide whether to brief the team now or review the about page first.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'อ้างอิงจาก record how-we-work จริงใน CMS' : 'Sourced from the live how-we-work CMS record',
            body: locale === 'th'
              ? 'ข้อความส่วนนี้อัปเดตตาม company content ที่จัดการจากหลังบ้าน'
              : 'This copy is updated from the company content record managed in backadmin.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'consultation', source: 'how_we_work' }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'speak_to_advisor', from: 'how_we_work_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/about#team-section'),
          label: locale === 'th' ? 'กลับไปดูทีม' : 'See the team',
          eventPayload: { cta: 'see_team', from: 'how_we_work_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

      <section className="section">
        <Container variant="readable">
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'ลำดับการทำงาน' : 'Operating sequence'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ข้อความด้านล่างดึงจาก record how-we-work ที่เผยแพร่ในระบบ'
                : 'The content below is resolved from the published how-we-work record in the system.'}
            </p>
          </div>
          <div className="content-article">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="grid grid-3">
            {processCards.map((card) => (
              <article key={card.title} className="card reveal">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-subtitle">{card.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--cta">
        <Container variant="readable">
          <div className="cta-panel reveal">
            <div>
              <h2 className="cta-title">
                {locale === 'th'
                  ? `ทีมที่เผยแพร่แล้วตอนนี้ ${teamMembers.length} คน`
                  : `${teamMembers.length} live team profile${teamMembers.length === 1 ? '' : 's'} available now`}
              </h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'เมื่อพร้อมส่ง brief ให้ทีม ให้ข้ามไปที่ contact หรือตรวจรายชื่อทีมที่เผยแพร่แล้วในหน้า about'
                  : 'When you are ready to brief the team, move into contact or review the published team roster on the about page.'}
              </p>
            </div>
            <div className="cta-row">
              <TrackedLink
                className="btn btn-cta"
                href={withLocale(locale, '/contact')}
                eventType="cta_click"
                eventPayload={{ cta: 'open_contact', from: 'how_we_work' }}
              >
                {dict.cta.speakToAdvisor}
              </TrackedLink>
              <TrackedLink
                className="btn btn-secondary"
                href={withLocale(locale, '/about#team-section')}
                eventType="cta_click"
                eventPayload={{ cta: 'open_about_team', from: 'how_we_work' }}
              >
                {locale === 'th' ? 'กลับไปดูทีม' : 'Back to the team'}
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
