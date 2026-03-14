import type { Metadata } from 'next';
import Link from 'next/link';

import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { ogLocale, withLocale, withLocaleQuery } from '@/app/_lib/i18n/routing';
import { type BlogPostDetailApi, type ContentLocalizedText, fetchBlogPostBySlug, fetchBlogPosts } from '@/app/_lib/public-api-server';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;

function localizeText(locale: 'en' | 'th', value: ContentLocalizedText | null | undefined): string {
  if (!value) return '';
  return locale === 'th' ? value.th : value.en;
}

function formatDate(locale: 'en' | 'th', value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function getBodyParagraphs(locale: 'en' | 'th', post: BlogPostDetailApi): string[] {
  return locale === 'th' ? post.body.th : post.body.en;
}

export async function generateStaticParams() {
  const posts = await fetchBlogPosts().catch(() => []);
  return posts.flatMap((post) => ([
    { locale: 'en', slug: post.slug },
    { locale: 'th', slug: post.slug },
  ]));
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const post = await fetchBlogPostBySlug(params.slug).catch(() => null);
  const title = post ? localizeText(locale, post.title) : dict.brand.name;
  const description = post ? localizeText(locale, post.excerpt ?? null) : dict.brand.description;
  const canonical = `/${locale}/blog/${encodeURIComponent(params.slug)}`;

  return {
    title: `${title} | ${dict.brand.name}`,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/blog/${encodeURIComponent(params.slug)}`,
        th: `/th/blog/${encodeURIComponent(params.slug)}`,
      },
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title: `${title} | ${dict.brand.name}`,
      description,
      siteName: dict.brand.name,
      locale: ogLocale(locale),
    },
  };
}

export default async function BlogArticlePage(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
  const advisoryLabels = getAdvisoryLabels(locale);
  const post = await fetchBlogPostBySlug(params.slug).catch(() => null);

  if (!post) {
    return (
      <main className="section" id="main-content">
        <Container>
          <h1 className="section-title">{locale === 'th' ? 'ไม่พบบทความ' : 'Article not found'}</h1>
          <p className="section-subtitle">
            {locale === 'th' ? 'บทความนี้อาจถูกย้ายหรือยังไม่เผยแพร่' : 'This article may have moved or is not published.'}
          </p>
          <div className="cta-row mt-4">
            <Link className="btn btn-cta" href={withLocale(locale, '/blog')}>
              {locale === 'th' ? 'กลับไปหน้าบทความ' : 'Back to blog'}
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  const title = localizeText(locale, post.title);
  const excerpt = localizeText(locale, post.excerpt ?? null);
  const category = localizeText(locale, post.category ?? null);
  const readTime = localizeText(locale, post.read_time ?? null);
  const publishedText = formatDate(locale, post.published_at);
  const updatedText = formatDate(locale, post.updated_at);
  const bodyParagraphs = getBodyParagraphs(locale, post);

  return (
    <main id="main-content">
      <PublicAdvisoryHero
        eyebrow={category || dict.advisory.heroEyebrow}
        title={title}
        subtitle={excerpt || (locale === 'th' ? 'บทความเชิงปฏิบัติสำหรับการตัดสินใจในตลาดพัทยา' : 'Practical guidance for Pattaya market decisions.')}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: locale === 'th' ? 'ตีความให้ใช้งานได้' : 'Built for action',
            title: locale === 'th' ? 'อ่านแล้วไปต่อได้ทันที' : 'Read it, then move directly into the next step',
            body: locale === 'th'
              ? 'บทความนี้ออกแบบมาเพื่อช่วยให้คุณคุยกับที่ปรึกษา, เทียบตัวเลือก, หรือขอ shortlist ได้ต่อทันที'
              : 'This article is meant to shorten the distance between reading, comparing options, and asking for an advisor-led shortlist.',
            icon: 'check',
          },
          {
            kicker: locale === 'th' ? 'บริบทของตลาด' : 'Market context',
            title: readTime ? `${readTime}` : (locale === 'th' ? 'อ่านสั้น กระชับ' : 'Concise editorial read'),
            body: locale === 'th'
              ? 'ใช้บทความนี้เป็นบริบทก่อนเข้าสู่โครงการ, ทำเล, หรือบทสนทนากับทีม'
              : 'Use this as context before moving into project pages, area pages, or a direct advisory conversation.',
            icon: 'building',
          },
          {
            kicker: locale === 'th' ? 'จังหวะถัดไป' : 'Next move',
            title: locale === 'th' ? 'ต่อไปยัง shortlist หรือ contact' : 'Continue into shortlist or advisor contact',
            body: locale === 'th'
              ? 'หากเนื้อหานี้ตรงโจทย์ ให้ส่ง brief ของคุณเพื่อให้ทีมคัดรายการที่เหมาะสม'
              : 'If this topic matches your brief, send your requirements and let the team translate it into a tighter shortlist.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'content_consultation', article: post.slug }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'content_consultation', from: 'blog_article', article: post.slug },
        }}
        secondaryAction={{
          href: withLocale(locale, '/blog'),
          label: locale === 'th' ? 'บทความทั้งหมด' : 'All articles',
          eventPayload: { cta: 'back_to_blog', from: 'blog_article', article: post.slug },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

      <section className="section">
        <Container>
          <div className="detail-layout advisory-detail-layout">
            <div className="detail-stack">
              <div className="authority-card reveal">
                <div className="editorial-card__meta">
                  {publishedText ? <span>{locale === 'th' ? 'เผยแพร่' : 'Published'}: {publishedText}</span> : null}
                  {updatedText ? <span>{locale === 'th' ? 'อัปเดต' : 'Updated'}: {updatedText}</span> : null}
                  {readTime ? <span>{readTime}</span> : null}
                </div>
                <article className="content-article mt-4">
                  {bodyParagraphs.map((paragraph, index) => (
                    <p key={`${post.slug}-${index}`}>{paragraph}</p>
                  ))}
                </article>
              </div>

              {post.links?.length ? (
                <div className="authority-card reveal">
                  <h2 className="card-title">{locale === 'th' ? 'ลิงก์ที่เกี่ยวข้อง' : 'Related links'}</h2>
                  <div className="insight-list mt-3">
                    {post.links.map((link) => {
                      const label = localizeText(locale, link.label);
                      return (
                        <a key={`${post.slug}-${link.href}`} className="insight-list__item" href={link.href} target="_blank" rel="noreferrer">
                          <span className="insight-list__title">{label || link.href}</span>
                          <span className="insight-list__body">{link.href}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="detail-sidebar detail-stack">
              <div className="page-rail-card reveal">
                <h2 className="card-title">{locale === 'th' ? 'แปลงบทความเป็นแผนต่อ' : 'Turn the article into a next-step brief'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ส่งงบ วัตถุประสงค์ และทำเลที่สนใจ แล้วทีมจะสรุป next step ให้ตรงขึ้น'
                    : 'Send your budget, purpose, and preferred area so the team can turn this topic into a concrete next step.'}
                </p>
              </div>
              <LeadForm
                heading={locale === 'th' ? 'คุยต่อจากบทความนี้' : 'Continue from this article'}
                defaultMessage={locale === 'th' ? `ขอคำแนะนำต่อจากบทความ: ${title}` : `I want advice related to this article: ${title}`}
              />
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}