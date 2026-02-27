import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';
import { getBlogPostBySlug, getGuideArticleBySlug } from '@/app/_lib/content-hub';

export const revalidate = 300;

function humanize(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function pickLocalizedText(value: { en: string; th: string } | undefined, locale: 'en' | 'th'): string {
  if (!value) return '';
  return (value[locale] || value.en || value.th || '').trim();
}

function pickLocalizedList(value: { en: string[]; th: string[] } | undefined, locale: 'en' | 'th'): string[] {
  if (!value) return [];
  const localized = value[locale] ?? value.en ?? value.th ?? [];
  return Array.isArray(localized) ? localized.map((item) => String(item).trim()).filter(Boolean) : [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const guide = await getGuideArticleBySlug(slug);
  const guideTitle = pickLocalizedText(guide?.title, locale) || humanize(slug);
  const title = locale === 'th' ? `คู่มือ: ${guideTitle}` : `Guide: ${guideTitle}`;
  const desc = locale === 'th'
    ? 'สรุปแนวทาง + เช็กลิสต์ เพื่อช่วยตัดสินใจก่อนคุยกับที่ปรึกษา'
    : 'A practical summary and checklist to prepare before speaking with an advisor.';
  return makePageMetadata(locale, `guides/${slug}`, title, desc, dict.brand.name);
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  const guide = await getGuideArticleBySlug(slug);
  if (!guide) {
    notFound();
  }

  const guideTitle = pickLocalizedText(guide.title, locale) || humanize(slug);
  const h1 = locale === 'th' ? `คู่มือ: ${guideTitle}` : guideTitle;
  const lead = pickLocalizedText(guide.summary, locale) || (locale === 'th'
    ? 'เนื้อหาคู่มือกำลังอัปเดตในระบบ (TODO: เติม summary)'
    : 'Guide content is being updated in the system (TODO: add summary).');

  const checklist = pickLocalizedList(guide.checklist, locale);
  const relatedBlogPosts = (await Promise.all(
    (guide.relatedBlogPosts ?? []).map(async (blogSlug) => {
      const post = await getBlogPostBySlug(blogSlug);
      return {
        slug: blogSlug,
        title: pickLocalizedText(post?.title, locale) || blogSlug,
      };
    })
  )).filter((item) => Boolean(item.slug));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/guides/${encodeURIComponent(slug)}`;

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: locale === 'th' ? 'คู่มือ' : 'Guides', href: `/${locale}/guides` },
    { label: h1, href: `/${locale}/guides/${encodeURIComponent(slug)}` },
  ];
  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  const jsonLd = JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: h1,
        inLanguage: locale,
        url: canonicalUrl,
        publisher: {
          '@type': 'Organization',
          name: dict.brand.name,
          url: siteUrl,
        },
      },
      breadcrumbJsonLd,
    ],
    null,
    0,
  );

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{h1}</h1>
          <p className="subhead">{lead}</p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/projects')}>
              {dict.nav.projects}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'เช็กลิสต์ (สั้น ๆ)' : 'Quick Checklist'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ใช้เป็นคำถามตั้งต้นก่อนดู shortlist และก่อนนัดคุย'
                : 'Use these questions before reviewing a shortlist or scheduling a call.'}
            </p>
          </div>

          <ul className="bullet-list">
            {checklist.length ? checklist.map((item) => <li key={item}>{item}</li>) : (
              <li>
                {locale === 'th'
                  ? 'เช็กลิสต์กำลังอัปเดตในระบบ (TODO: เติม checklist ใน guide entity)'
                  : 'Checklist is being updated in the system (TODO: add checklist in guide entity).'}
              </li>
            )}
          </ul>

          {relatedBlogPosts.length ? (
            <div className="mt-6" aria-labelledby="related-blog-title">
              <h2 id="related-blog-title" className="section-title">{locale === 'th' ? 'บทความที่เกี่ยวข้อง' : 'Related blog posts'}</h2>
              <ul className="bullet-list mt-3">
                {relatedBlogPosts.map((item) => (
                  <li key={item.slug}>
                    <Link href={withLocale(locale, `/blog/${item.slug}`)}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="cta-strip">
            <div className="cta-strip__text">
              {locale === 'th'
                ? 'ฝากเงื่อนไขมาได้เลย แล้วเราจะส่ง shortlist พร้อมคำอธิบายให้'
                : 'Share your criteria and we will send a shortlist with reasoning.'}
            </div>
            <a className="btn btn-cta" href={withLocale(locale, '/buy/condo-pattaya')}>
              {locale === 'th' ? 'เริ่มจากคอนโดขายพัทยา' : 'Start with Condo Pattaya'}
            </a>
          </div>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอ shortlist จากที่ปรึกษา' : 'Request a Shortlist'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'บอกงบ + ทำเล + เป้าหมาย แล้วเราจะตอบกลับพร้อมตัวเลือก 3–7 ยูนิต'
                  : 'Share budget, area, and goal. We will reply with 3–7 options.'}
              </p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={h1} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
