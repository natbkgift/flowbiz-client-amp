import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { articleSchema, breadcrumbSchema } from '@/app/_lib/schema-markup';

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

const articles: Record<string, { title: string; content: string; date: string; category: string }> = {
  'pattaya-real-estate-investment-guide-2025': {
    title: 'Pattaya Real Estate Investment Guide 2025',
    date: '2025-01-15',
    category: 'Investment',
    content: `Pattaya has emerged as one of Thailand's most dynamic property markets, offering investors an exceptional combination of lifestyle appeal and strong returns. The Eastern Economic Corridor (EEC) initiative continues to drive billions of baht in infrastructure investment, boosting property values across the region.

Key factors driving Pattaya's real estate market include the ongoing expansion of U-Tapao International Airport, new high-speed rail connections to Bangkok, and a diversifying economy that reduces dependence on tourism alone.

For foreign investors, Thailand offers relatively straightforward condominium ownership within the 49% foreign quota. Rental yields in prime Pattaya locations typically range from 5% to 8% annually, significantly outperforming many Western markets.

The most sought-after areas include Pratumnak Hill for luxury living, Jomtien for family-friendly beachfront properties, and Wongamat Beach for premium high-rise condominiums. Each area offers distinct advantages depending on your investment strategy.

When considering a Pattaya property investment, work with experienced local agents who understand the legal landscape, can verify title deeds, and provide accurate market valuations.`,
  },
  'buying-condo-thailand-foreigner-complete-guide': {
    title: 'How to Buy a Condo in Thailand as a Foreigner',
    date: '2025-01-10',
    category: 'Guides',
    content: `Buying a condominium in Thailand as a foreigner is entirely legal and straightforward when you understand the process. Under the Condominium Act, foreigners can own condominium units outright in their own name, provided the total foreign ownership in any given building does not exceed 49% of the total salable area.

Step 1: Research and Selection — Work with a reputable agent to identify properties that meet your budget, location preferences, and investment goals. Verify the foreign quota availability before committing.

Step 2: Due Diligence — Review the title deed (Chanote is the strongest form), check for any encumbrances, and verify the developer's track record for new builds.

Step 3: Reservation and Contract — Pay a reservation deposit (typically 50,000-200,000 THB) and review the sale contract carefully, ideally with a Thai property lawyer.

Step 4: Transfer of Funds — Funds must be transferred from overseas in foreign currency and converted to Thai Baht through a Thai bank to obtain a Foreign Exchange Transaction Form (FETF). This document is essential for registering foreign ownership.

Step 5: Registration — Complete the transfer at the local Land Office. Transfer fees are typically split between buyer and seller. Total closing costs usually amount to approximately 6-7% of the registered value.`,
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const article = articles[slug];
  const title = article?.title ?? slug.replace(/-/g, ' ');
  const desc = article
    ? article.content.slice(0, 160)
    : 'Expert guidance on Pattaya real estate.';
  return makePageMetadata(locale, `blog/${slug}`, title, desc, dict.brand.name);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug, locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const article = articles[slug];

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: locale === 'th' ? 'บล็อก' : 'Blog', href: `/${locale}/blog` },
    { label: article?.title ?? slug.replace(/-/g, ' '), href: `/${locale}/blog/${slug}` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  if (!article) {
    return (
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <Breadcrumbs items={breadcrumbItems} />
        <section className="section">
          <Container>
            <h1 className="headline">{slug.replace(/-/g, ' ')}</h1>
            <p className="subhead">
              This article provides in-depth analysis and expert guidance on the Pattaya real estate market. Our team of experienced property consultants shares practical insights to help buyers and investors make informed decisions in Thailand&apos;s dynamic Eastern Seaboard property market.
            </p>
            <p className="subhead">
              Whether you are a first-time buyer, seasoned investor, or looking to relocate, understanding the local market dynamics, legal framework, and emerging trends is essential for a successful property transaction. Contact our advisory team for personalized guidance tailored to your investment objectives.
            </p>
            <Link prefetch={false}
              href={`/${locale}/blog`}
              className="btn btn-tertiary"
            >
              &larr; Back to Blog
            </Link>
          </Container>
        </section>
      </main>
    );
  }

  const articleJsonLd = articleSchema({
    headline: article.title,
    description: article.content.slice(0, 160),
    datePublished: article.date,
    dateModified: article.date,
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
              <span className="article-category">{article.category}</span>
              <time dateTime={article.date}>{article.date}</time>
            </div>
            <h1 className="headline">{article.title}</h1>
            <div className="article-body">
              {article.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </article>

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
                      ? `สนใจข้อมูลเพิ่มเติมเกี่ยวกับ: ${article.title}`
                      : `I'd like to learn more about: ${article.title}`
                  }
                />
              </div>
            </div>
          </div>

          <Link prefetch={false}
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
