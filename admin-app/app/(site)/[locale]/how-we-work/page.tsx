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

function buildHowWeWorkClarifyLines(locale: 'en' | 'th'): string[] {
  return [
    locale === 'th'
      ? 'งบ เป้าหมาย ทำเล และช่วงเวลาควรถูกล็อกก่อนทุกครั้ง ก่อนที่รายการคัดไว้จะถูกขยายหรือพาไปดูยูนิต'
      : 'Budget, goal, area, and timeframe should be locked before the shortlist widens or the conversation moves into units.',
    locale === 'th'
      ? 'ข้อแลกเปลี่ยนต้องถูกอธิบายตรงไปตรงมา เพื่อให้คุณรู้ว่ากำลังยอมอะไร ไม่ใช่เห็นแต่สิ่งที่ดูน่าสนใจ'
      : 'Trade-offs should be named plainly so you know what you are accepting, not just what looks attractive.',
    locale === 'th'
      ? 'ขั้นถัดไปควรแคบลงเป็นหน้าเปรียบเทียบ การนัดดู หรือการคุยกับที่ปรึกษาที่ชัดขึ้น ไม่ใช่การเปิดดูแบบกว้าง ๆ อีกครั้ง'
      : 'The next step should tighten into compare, viewing, or a sharper advisor review, not another broad browse.',
  ];
}

function buildHowWeWorkReplyLines(locale: 'en' | 'th', liveTeamCount: number): string[] {
  return [
    locale === 'th'
      ? 'รายละเอียดชุดเดียวควรพาบริบทเดิมไปต่อได้ในทุกช่องทาง โดยไม่ต้องเล่าโจทย์ใหม่ทุกครั้ง'
      : 'One brief should carry the same context forward across channels so you do not have to rebuild the story each time.',
    liveTeamCount > 0
      ? (locale === 'th'
        ? `ตอนนี้มี ${liveTeamCount} โปรไฟล์ทีมที่เผยแพร่แล้วรองรับหน้านี้ ดังนั้นการตอบกลับควรเป็นการรับช่วงที่ชัด ไม่ใช่ข้อความกลาง ๆ`
        : `${liveTeamCount} live team profile${liveTeamCount === 1 ? '' : 's'} currently back this route, so the reply should feel like a clearly owned handoff rather than generic copy.`)
      : (locale === 'th'
        ? 'แม้โปรไฟล์ทีมบนหน้าเว็บจะยังบาง การตอบกลับก็ควรยังเป็นการรับช่วงที่ชัด ไม่ใช่ข้อความกลาง ๆ'
        : 'Even when public team coverage is still thin, the reply should still feel like a clearly owned handoff rather than generic copy.'),
    locale === 'th'
      ? 'ถ้ารายละเอียดยังไม่พร้อม ทีมควรบอกให้ชัดว่าต้องยืนยันอะไรต่อก่อนเสียเวลาไปกับการนัดดูหรือการต่อรอง'
      : 'If the brief is not ready yet, the team should say exactly what needs verification before you spend time on viewings or negotiations.',
  ];
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
          ? 'ทุกการทำงานเริ่มจากรายละเอียดที่ชัดเจน เพื่อคุมทิศทางของรายการคัดไว้ งบ และขั้นถัดไปให้ตรงกันก่อน'
          : 'Every engagement starts with a clear brief so the shortlist, budget lens, and next step stay aligned from the start.',
        locale === 'th'
          ? 'จากนั้นทีมจะคัดตัวเลือก ตรวจ context ที่ต้องใช้ และพาไปยังขั้นตอนถัดไปที่ทำได้จริงโดยไม่ยืด loop เกินจำเป็น'
          : 'The team then curates options, verifies the context that matters, and moves the conversation to the next practical step without stretching the loop.',
      ].join('\n\n'),
  );

  const processCards = [
    {
      title: locale === 'th' ? '1. รับรายละเอียดให้ชัด' : '1. Clarify the brief',
      body: locale === 'th'
        ? 'เริ่มจากงบ เป้าหมาย ทำเล และช่วงเวลาก่อน เพื่อไม่ให้รายการคัดไว้หลุดโจทย์'
        : 'Budget, goal, area, and timeframe are locked first so the shortlist stays on brief.',
    },
    {
      title: locale === 'th' ? '2. คัดรายการพร้อมข้อแลกเปลี่ยน' : '2. Curate with trade-offs',
      body: locale === 'th'
        ? 'ทีมจะคัดตัวเลือกที่เหมาะจริง พร้อมบอกสิ่งที่ควรยอมรับและสิ่งที่ควรเลี่ยง'
        : 'The team narrows the field and explains the trade-offs worth accepting or avoiding.',
    },
    {
      title: locale === 'th' ? '3. พาไปยังขั้นถัดไปที่ทำได้จริง' : '3. Move into the real next step',
      body: locale === 'th'
        ? 'เมื่อรายการคัดไว้เริ่มนิ่งแล้ว ค่อยไปต่อที่หน้าเปรียบเทียบ การนัดดู หรือการคุยที่ชัดขึ้น'
        : 'Once the shortlist is shaped, the flow moves into compare, viewing, or a tighter consultation step.',
    },
  ];
  const clarifyLines = buildHowWeWorkClarifyLines(locale);
  const replyLines = buildHowWeWorkReplyLines(locale, teamMembers.length);

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
            title: locale === 'th' ? 'คนที่ต้องการเข้าใจลำดับงานก่อนคุยเรื่องยูนิต' : 'People who want the workflow before unit-level talk',
            body: locale === 'th'
              ? 'หน้านี้อธิบายลำดับการทำงานของทีมเมื่อรับรายละเอียดจริง'
              : 'This page explains the operating sequence the team follows on live briefs.',
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ดูลำดับงานแล้วค่อยไปต่อที่หน้าทีมหรือหน้าติดต่อ' : 'Review the flow, then move to about or contact',
            body: locale === 'th'
              ? 'เมื่อเข้าใจวิธีทำงานแล้ว จะตัดสินใจได้ง่ายขึ้นว่าควรส่งรายละเอียดตอนนี้หรือกลับไปดูทีมก่อน'
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

      <section className="section">
        <Container>
          <div id="how-we-work-confidence-grid" className="signal-grid signal-grid--two-up reveal">
            <article className="authority-card">
              <h2 className="card-title">{locale === 'th' ? 'อะไรควรถูกเคลียร์ก่อน shortlist จะขยับต่อ' : 'What gets clarified before the shortlist moves'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ใช้ชั้นนี้เพื่อดูว่าทีมควรทำให้โจทย์นิ่งลงตรงไหน ก่อนจะพาไปยังหน้าเปรียบเทียบ การนัดชม หรือการคุยต่อที่จริงจังขึ้น'
                  : 'Use this layer to see which parts of the brief should become clearer before the flow moves into compare, viewing, or a more serious inquiry.'}
              </p>
              <div className="insight-list mt-3">
                {clarifyLines.map((item) => (
                  <div key={item} className="insight-list__item">
                    <span className="insight-list__body">{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="authority-card">
              <h2 className="card-title">{locale === 'th' ? 'คำตอบกลับที่ดีควรให้ความรู้สึกแบบไหน' : 'What the reply should feel like'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'เป้าหมายของ flow นี้คือให้คำตอบกลับเป็น next step ที่ใช้ต่อได้จริง ไม่ใช่วงสนทนาที่กว้างขึ้นแต่ไม่คมขึ้น'
                  : 'The goal of this flow is a reply you can act on immediately, not a wider conversation that still feels vague.'}
              </p>
              <div className="insight-list mt-3">
                {replyLines.map((item) => (
                  <div key={item} className="insight-list__item">
                    <span className="insight-list__body">{item}</span>
                  </div>
                ))}
              </div>
            </article>
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
                  ? 'เมื่อพร้อมส่งรายละเอียดให้ทีม ให้ข้ามไปที่หน้าติดต่อ หรือตรวจรายชื่อทีมที่เผยแพร่แล้วในหน้าแนะนำทีม'
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
