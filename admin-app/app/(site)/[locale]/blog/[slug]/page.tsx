import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { articleSchema, breadcrumbSchema } from '@/app/_lib/schema-markup';
import { getBlogPostBySlug, getGuideArticleBySlug, getGuideSlugs } from '@/app/_lib/content-hub';

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

function pickLocalizedText(value: { en: string; th: string } | undefined, locale: 'en' | 'th'): string {
  if (!value) return '';
  return (value[locale] || value.en || value.th || '').trim();
}

function pickBodyParagraphs(value: { en: string[]; th: string[] } | undefined, locale: 'en' | 'th'): string[] {
  if (!value) return [];
  const localized = value[locale] ?? value.en ?? value.th ?? [];
  return Array.isArray(localized) ? localized.map((item) => String(item).trim()).filter(Boolean) : [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const article = getBlogPostBySlug(slug);
  const title = pickLocalizedText(article?.title, locale) || slug.replace(/-/g, ' ');
  const paragraphs = pickBodyParagraphs(article?.body, locale);
  const desc = paragraphs[0] || pickLocalizedText(article?.excerpt, locale) || 'Practical guidance for Pattaya property decisions.';
  return makePageMetadata(locale, `blog/${slug}`, title, desc, dict.brand.name);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug, locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const article = getBlogPostBySlug(slug);

  if (!article) {
    notFound();
  }

  const title = pickLocalizedText(article.title, locale) || slug.replace(/-/g, ' ');
  const category = pickLocalizedText(article.category, locale) || (locale === 'th' ? 'บทความ' : 'Article');
  const paragraphs = pickBodyParagraphs(article.body, locale);
  const relatedGuides = (article.relatedGuides ?? []).map((guideSlug) => ({
    slug: guideSlug,
    title: pickLocalizedText(getGuideArticleBySlug(guideSlug)?.title, locale) || guideSlug,
  })).filter((item) => getGuideSlugs().includes(item.slug));

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: locale === 'th' ? 'บล็อก' : 'Blog', href: `/${locale}/blog` },
    { label: title, href: `/${locale}/blog/${slug}` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  const articleJsonLd = articleSchema({
    headline: title,
    description: paragraphs[0] || pickLocalizedText(article.excerpt, locale) || title,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    url: `${siteUrl}/${locale}/blog/${slug}`,
  });

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleJsonLd, breadcrumbJsonLd]) }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="section">
        <Container>
          <article>
            <div className="article-meta">
              <span className="article-category">{category}</span>
              <time dateTime={article.publishedAt}>{article.publishedAt}</time>
            </div>
            <h1 className="headline">{title}</h1>
            <div className="article-body">
              {paragraphs.length ? paragraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              )) : (
                <p>
                  {locale === 'th'
                    ? 'เนื้อหาบทความกำลังอัปเดตในระบบ (TODO: เติม body content ให้ครบ)'
                    : 'Article body is being updated in the system (TODO: add complete body content).'}
                </p>
              )}
            </div>
          </article>

          {relatedGuides.length ? (
            <section className="mt-8" aria-labelledby="related-guides-title">
              <h2 id="related-guides-title" className="section-title">{locale === 'th' ? 'คู่มือที่เกี่ยวข้อง' : 'Related guides'}</h2>
              <ul className="bullet-list mt-3">
                {relatedGuides.map((guide) => (
                  <li key={guide.slug}>
                    <Link href={withLocale(locale, `/guides/${guide.slug}`)}>{guide.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="article-cta">
            <div className="cta-panel">
              <div>
                <h2 className="cta-title">
                  {locale === 'th' ? 'ต้องการคำแนะนำเพิ่มเติม?' : 'Need Expert Advice?'}
                </h2>
                <p className="cta-body">
                  {locale === 'th'
                    ? 'ทีมที่ปรึกษาพร้อมช่วยคุณตัดสินใจอย่างมั่นใจ'
                    : 'Our advisory team is ready to help you make informed decisions.'}
                </p>
              </div>
              <div className="cta-panel__form">
                <LeadForm
                  defaultMessage={
                    locale === 'th'
                      ? `สนใจข้อมูลเพิ่มเติมเกี่ยวกับ: ${title}`
                      : `I'd like to learn more about: ${title}`
                  }
                />
              </div>
            </div>
          </div>

          <Link
            href={`/${locale}/blog`}
            className="btn btn-tertiary"
          >
            &larr; {locale === 'th' ? 'กลับไปบล็อก' : 'Back to Blog'}
          </Link>
        </Container>
      </section>
    </main>
  );
}
