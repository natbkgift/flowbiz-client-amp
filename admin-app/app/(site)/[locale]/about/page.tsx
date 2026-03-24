import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import {
  fetchCompanyInfoBySlug,
  fetchPublishedTeamMembers,
  fetchPublishedTestimonials,
} from '@/app/_lib/public-api-server';
import { resolveCmsText, resolveLocalizedText, splitIntoParagraphs } from '@/app/_lib/public-content';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';

export const revalidate = 300;

function formatUpdatedAt(locale: 'en' | 'th', value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  },
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const aboutInfo = await fetchCompanyInfoBySlug('about').catch(() => null);
  return makePageMetadata(
    locale,
    'about',
    aboutInfo?.meta_title || dict.about.heroTitle,
    aboutInfo?.meta_description || dict.about.metaDescription,
    dict.brand.name,
  );
}

export default async function AboutPage(
  props: {
    params: Promise<{ locale: string }>;
  },
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  const [aboutInfo, processInfo, teamMembers, testimonials] = await Promise.all([
    fetchCompanyInfoBySlug('about').catch(() => null),
    fetchCompanyInfoBySlug('how-we-work').catch(() => null),
    fetchPublishedTeamMembers().catch(() => []),
    fetchPublishedTestimonials({ limit: 6 }).catch(() => []),
  ]);

  const aboutParagraphs = splitIntoParagraphs(
    resolveCmsText(aboutInfo?.content, locale) || dict.about.whoParagraphs.join('\n\n'),
  );
  const processParagraphs = splitIntoParagraphs(
    resolveCmsText(processInfo?.content, locale)
      || [
        locale === 'th'
          ? 'เริ่มจากการรับ brief ที่ชัดเจนก่อน จากนั้นทีมจะคัด shortlist ตามงบ ทำเล และเป้าหมายที่ตกลงกัน'
          : 'We start with a clear brief, then turn it into a shortlist matched to your budget, area, and goal.',
        locale === 'th'
          ? 'ทุกขั้นตอนเน้นข้อมูลที่ตรวจสอบได้ ความโปร่งใสของ trade-off และการพาไปยัง next step ที่ทำได้จริง'
          : 'Each step is grounded in verifiable data, transparent trade-offs, and the next action that can actually move the deal forward.',
      ].join('\n\n'),
  );

  const proofCards = [
    {
      title:
        teamMembers.length > 0
          ? locale === 'th'
            ? `${teamMembers.length} โปรไฟล์ทีมที่เผยแพร่แล้ว`
            : `${teamMembers.length} published team profiles`
          : dict.about.missionCards[0]?.title || (locale === 'th' ? 'ข้อมูลทีม' : 'Team data'),
      body:
        teamMembers.length > 0
          ? locale === 'th'
            ? 'ทีมที่แสดงในหน้านี้ดึงจาก backadmin โดยตรงและอัปเดตตามสถานะ publish จริง'
            : 'The team section is driven directly from backadmin and reflects only live published profiles.'
          : dict.about.missionCards[0]?.body || '',
    },
    {
      title:
        testimonials.length > 0
          ? locale === 'th'
            ? `${testimonials.length} รีวิวลูกค้าที่เผยแพร่แล้ว`
            : `${testimonials.length} published client reviews`
          : dict.about.missionCards[1]?.title || (locale === 'th' ? 'รีวิวลูกค้า' : 'Client reviews'),
      body:
        testimonials.length > 0
          ? locale === 'th'
            ? 'รีวิวในหน้านี้ใช้เฉพาะรายการที่ publish แล้วจากระบบหลังบ้านเท่านั้น'
            : 'The review section only uses testimonial records that are already published from the admin system.'
          : dict.about.missionCards[1]?.body || '',
    },
    {
      title:
        formatUpdatedAt(locale, processInfo?.updated_at || aboutInfo?.updated_at)
          ? locale === 'th'
            ? `อัปเดตล่าสุด ${formatUpdatedAt(locale, processInfo?.updated_at || aboutInfo?.updated_at)}`
            : `Updated ${formatUpdatedAt(locale, processInfo?.updated_at || aboutInfo?.updated_at)}`
          : dict.about.missionCards[2]?.title || (locale === 'th' ? 'วิธีทำงาน' : 'How we work'),
      body:
        processParagraphs[0]
          || dict.about.missionCards[2]?.body
          || (locale === 'th'
            ? 'ขั้นตอนการทำงานของทีมจะดึงจากเนื้อหา how-we-work ที่จัดการจาก CMS'
            : 'The working process shown here is sourced from the how-we-work CMS content.'),
    },
  ];

  return (
    <main id="main-content">
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={aboutInfo?.title || dict.about.heroTitle}
        subtitle={aboutParagraphs[0] || dict.about.heroSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อที่อยากรู้ว่าใครอยู่เบื้องหลัง shortlist นี้' : 'Buyers who want to know who is behind the shortlist',
            body: locale === 'th'
              ? 'หน้านี้รวมภาพรวมบริษัท วิธีทำงาน ทีม และ feedback ที่เผยแพร่แล้วไว้ในที่เดียว'
              : 'This page brings company context, process, live team profiles, and published feedback into one place.',
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'รู้จักทีมและวิธีทำงานก่อน แล้วค่อย handoff ไปขั้นถัดไป' : 'Meet the team and process before the next handoff',
            body: locale === 'th'
              ? 'เมื่อเข้าใจแนวทางทำงานแล้ว คุณจะไปต่อที่ contact, shortlist หรือ smart finder ได้ชัดขึ้น'
              : 'Once the operating approach is clear, it becomes easier to move into contact, shortlist, or smart finder.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'เนื้อหาส่วนนี้ผูกกับข้อมูลหลังบ้านจริง' : 'This surface is tied to real admin-managed content',
            body: locale === 'th'
              ? 'ทีม รีวิว และข้อความบริษัทที่เผยแพร่จะสะท้อนจาก record ที่จัดการใน backadmin โดยตรง'
              : 'Published company copy, team members, and testimonials are reflected directly from backadmin records.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'consultation', source: 'about_hero' }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'speak_to_advisor', from: 'about_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/how-we-work'),
          label: locale === 'th' ? 'ดูวิธีทำงาน' : 'See how we work',
          eventPayload: { cta: 'see_how_we_work', from: 'about_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

      <section className="section">
        <Container variant="readable">
          <div className="section-header">
            <h2 className="section-title">{aboutInfo?.title || dict.about.whoTitle}</h2>
            <p className="section-subtitle">
              {aboutInfo?.meta_description || dict.about.heroSubtitle}
            </p>
          </div>
          <div className="content-article">
            {aboutParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--alt" id="process-section">
        <span id="how-we-work" className="sr-only" />
        <Container>
          <div className="section-header">
            <h2 className="section-title">{processInfo?.title || (locale === 'th' ? 'How we work' : 'How we work')}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ลำดับการทำงานและหลักการตัดสินใจที่ทีมใช้เมื่อรับ brief จริง'
                : 'The operating sequence and decision principles the team uses on live briefs.'}
            </p>
          </div>
          <div className="grid md:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)] gap-6 md:gap-8">
            <article className="card reveal">
              <div className="content-article">
                {processParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
            <aside className="trust-box reveal">
              <h3 className="trust-box__title">
                {locale === 'th' ? 'ขั้นถัดไปที่เกี่ยวข้อง' : 'Related next steps'}
              </h3>
              <ul className="bullet-list">
                <li>{locale === 'th' ? 'กลับไปดูทีมและ role ที่เผยแพร่แล้ว' : 'Review the live team roster and role coverage.'}</li>
                <li>{locale === 'th' ? 'ดู feedback ที่เผยแพร่แล้วก่อนส่ง brief' : 'Read published client feedback before sending your brief.'}</li>
                <li>{locale === 'th' ? 'ไปต่อที่ contact เมื่อพร้อมอธิบายงบ เป้าหมาย และทำเล' : 'Move into contact once you are ready to share budget, area, and goal.'}</li>
              </ul>
              <div className="cta-row">
                <TrackedLink
                  className="btn btn-secondary"
                  href={withLocale(locale, '/how-we-work')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'open_how_we_work', from: 'about_process' }}
                >
                  {locale === 'th' ? 'เปิดหน้า how we work' : 'Open how we work'}
                </TrackedLink>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section className="section" id="team-section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'ทีมที่เผยแพร่แล้ว' : 'Published team'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'แสดงเฉพาะสมาชิกทีมที่ publish แล้วจาก backadmin'
                : 'Only team members published from backadmin are shown here.'}
            </p>
          </div>
          {teamMembers.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {teamMembers.map((member) => {
                const bio = resolveLocalizedText(member.bio, locale);
                return (
                  <article key={member.id} className="card reveal overflow-hidden">
                    <LocalMediaImage
                      media={{ image_url: member.photo_url }}
                      alt={member.name}
                      className="media-shell"
                      imageClassName="media-shell__img"
                      aspectRatio="4 / 3"
                    />
                    <div className="p-5 space-y-4">
                      <div>
                        <p className="public-hero__eyebrow">{member.role_title}</p>
                        <h3 className="card-title">{member.name}</h3>
                      </div>
                      <p className="card-subtitle">{bio || (locale === 'th' ? 'โปรไฟล์ทีมจะอัปเดตจาก CMS โดยตรง' : 'This profile is managed directly from CMS.')}</p>
                      {member.languages?.length ? (
                        <div className="chip-list">
                          {member.languages.map((language) => (
                            <span key={`${member.id}-${language}`} className="chip-list__item">{language}</span>
                          ))}
                        </div>
                      ) : null}
                      {member.specialties?.length ? (
                        <div className="chip-list">
                          {member.specialties.map((specialty) => (
                            <span key={`${member.id}-${specialty}`} className="chip-list__item">{specialty}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="premium-empty-state" role="status">
              <h3>{locale === 'th' ? 'ทีมจะปรากฏที่นี่เมื่อมีการ publish' : 'Published team profiles will appear here'}</h3>
              <p>{locale === 'th' ? 'เพิ่มหรือเผยแพร่ team members จาก backadmin แล้วหน้านี้จะอัปเดตตามจริง' : 'Publish team member records from backadmin and this page will update automatically.'}</p>
            </div>
          )}
        </Container>
      </section>

      <section className="section section--alt" id="proof-assets">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'Proof assets' : 'Proof assets'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'สัญญาณที่ช่วยยืนยันว่าหน้านี้ผูกกับข้อมูลที่ publish จริง'
                : 'Signals that confirm this surface is tied to genuinely published content.'}
            </p>
          </div>
          <div className="grid grid-3">
            {proofCards.map((card) => (
              <article key={card.title} className="card reveal">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-subtitle">{card.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="section" id="client-reviews">
        <span id="reviews" className="sr-only" />
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'เสียงจากลูกค้าที่เผยแพร่แล้ว' : 'Published client reviews'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ใช้เฉพาะ testimonial records ที่เผยแพร่แล้วจาก backadmin'
                : 'This section uses only testimonial records that are already published from backadmin.'}
            </p>
          </div>
          {testimonials.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {testimonials.map((item) => (
                <figure key={item.id} className="card reveal">
                  <blockquote className="card-title">&ldquo;{item.quote}&rdquo;</blockquote>
                  <figcaption className="card-subtitle mt-4">
                    <strong>{item.attribution_name || (locale === 'th' ? 'ลูกค้า AMP' : 'AMP client')}</strong>
                    <br />
                    <span>{item.context || (locale === 'th' ? 'รีวิวที่เผยแพร่แล้วจากระบบ' : 'Published feedback from the live system.')}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="premium-empty-state" role="status">
              <h3>{locale === 'th' ? 'รีวิวจะปรากฏเมื่อมีการ publish' : 'Reviews will appear when they are published'}</h3>
              <p>{locale === 'th' ? 'เผยแพร่ testimonial จากหลังบ้านแล้วส่วนนี้จะอัปเดตอัตโนมัติ' : 'Publish testimonials from the admin system and this section will update automatically.'}</p>
            </div>
          )}
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel reveal">
            <div>
              <h2 className="cta-title">{dict.about.ctaTitle}</h2>
              <p className="cta-body">{dict.about.ctaBody}</p>
            </div>
            <div className="cta-row">
              <TrackedLink
                className="btn btn-cta"
                href={withLocale(locale, '/contact')}
                eventType="cta_click"
                eventPayload={{ cta: 'speak_to_advisor', from: 'about' }}
              >
                {dict.cta.speakToAdvisor}
              </TrackedLink>
              <TrackedLink
                className="btn btn-secondary"
                href={withLocale(locale, '/projects')}
                eventType="cta_click"
                eventPayload={{ cta: 'browse_projects', from: 'about' }}
              >
                {dict.nav.projects}
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
