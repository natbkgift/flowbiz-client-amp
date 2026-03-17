import type { Metadata } from 'next';
import Link from 'next/link';

import { getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { ogLocale, withLocale } from '@/app/_lib/i18n/routing';
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
  const description = post ? localizeText(locale, post.excerpt ?? null) : dict.brand.tagline;
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
  const allPosts = await fetchBlogPosts().catch(() => []);

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
  const relatedPosts = allPosts
    .filter((item) => item.slug !== post.slug)
    .sort((left, right) => {
      const leftDate = Date.parse(left.published_at ?? left.updated_at ?? '');
      const rightDate = Date.parse(right.published_at ?? right.updated_at ?? '');
      return (Number.isFinite(rightDate) ? rightDate : 0) - (Number.isFinite(leftDate) ? leftDate : 0);
    })
    .slice(0, 3);
  const nextStepLinks = [
    {
      href: withLocale(locale, '/investment'),
      title: locale === 'th' ? 'อ่านมุมมองการลงทุนต่อ' : 'Continue into investment guidance',
      body: locale === 'th' ? 'ใช้บทความนี้เป็นบริบท แล้วต่อไปยังหน้ามุมมองการลงทุนเพื่อดูกรอบการคัดสินทรัพย์' : 'Use this article as context, then continue into the investment page for a clearer shortlist framework.',
    },
    {
      href: withLocale(locale, '/area-guide'),
      title: locale === 'th' ? 'ลงลึกต่อที่คู่มือทำเล' : 'Drill deeper with area guides',
      body: locale === 'th' ? 'ถ้าประเด็นนี้ผูกกับทำเล ให้ไปต่อที่คู่มือทำเลเพื่อดูภาพระดับย่อยของพื้นที่' : 'If this topic is location-sensitive, move into the area guides to compare Pattaya zones with more context.',
    },
    {
      href: withLocaleQuery(locale, '/contact', { intent: 'content_consultation', article: post.slug }),
      title: locale === 'th' ? 'ส่งบรีฟให้ที่ปรึกษา' : 'Send the brief to an advisor',
      body: locale === 'th' ? 'แปลงสิ่งที่อ่านเป็นรายการคัดไว้ โดยส่งงบ จุดประสงค์ และทำเลที่กำลังพิจารณา' : 'Turn the article into a shortlist conversation by sharing your budget, purpose, and preferred area.',
    },
  ];

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
            title: locale === 'th' ? 'ต่อไปยังรายการคัดไว้หรือหน้าติดต่อ' : 'Continue into shortlist or advisor contact',
            body: locale === 'th'
              ? 'หากเนื้อหานี้ตรงโจทย์ ให้ส่งบรีฟของคุณเพื่อให้ทีมคัดรายการที่เหมาะสม'
              : 'If this topic matches your brief, send your requirements and let the team translate it into a tighter shortlist.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'content_consultation', article: post.slug }),
          id: 'blog_consultation_primary',
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'content_consultation', from: 'blog_article', article: post.slug },
        }}
        secondaryAction={{
          href: withLocale(locale, '/blog'),
          id: 'blog_index_secondary',
          label: locale === 'th' ? 'บทความทั้งหมด' : 'All articles',
          eventPayload: { cta: 'back_to_blog', from: 'blog_article', article: post.slug },
        }}
      />

      <section className="section" id="blog-article-content">
        <Container>
          <div className="detail-layout advisory-detail-layout">
            <div className="detail-stack">
              <div className="authority-card reveal" id="blog-article-body">
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
                <div className="authority-card reveal" id="blog-related-links">
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

              {relatedPosts.length ? (
                <div className="authority-card reveal" id="blog-related-articles">
                  <h2 className="card-title">{locale === 'th' ? 'อ่านต่อจากบทความนี้' : 'Continue reading'}</h2>
                  <div className="insight-list mt-3">
                    {relatedPosts.map((item) => {
                      const relatedTitle = localizeText(locale, item.title) || item.slug;
                      const relatedExcerpt = localizeText(locale, item.excerpt ?? null);
                      return (
                        <Link
                          key={item.slug}
                          href={withLocale(locale, `/blog/${encodeURIComponent(item.slug)}`)}
                          className="insight-list__item"
                        >
                          <span className="insight-list__title">{relatedTitle}</span>
                          <span className="insight-list__body">{relatedExcerpt || (locale === 'th' ? 'เปิดอ่านบทความฉบับเต็ม' : 'Open the full article.')}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="detail-sidebar detail-stack">
              <div className="page-rail-card reveal" id="blog-next-step-links">
                <h2 className="card-title">{locale === 'th' ? 'ไปต่อแบบมีบริบท' : 'Move forward with context'}</h2>
                <div className="insight-list mt-3">
                  {nextStepLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="insight-list__item">
                      <span className="insight-list__title">{item.title}</span>
                      <span className="insight-list__body">{item.body}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="page-rail-card reveal" id="blog-advisor-brief">
                <h2 className="card-title">{locale === 'th' ? 'แปลงบทความเป็นแผนต่อ' : 'Turn the article into a next-step brief'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ส่งงบ วัตถุประสงค์ และทำเลที่สนใจ แล้วทีมจะสรุปขั้นตอนถัดไปให้ตรงขึ้น'
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