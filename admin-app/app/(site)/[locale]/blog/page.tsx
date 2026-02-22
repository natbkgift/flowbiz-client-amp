import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makeListingPageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

const articles = [
  {
    slug: 'pattaya-real-estate-investment-guide-2025',
    title: 'Pattaya Real Estate Investment Guide 2025',
    excerpt:
      'Discover why Pattaya remains one of the top destinations for property investors in Southeast Asia, with strong rental yields and growing infrastructure.',
    date: '2025-01-15',
    category: 'Investment',
    readTime: '8 min read',
  },
  {
    slug: 'buying-condo-thailand-foreigner-complete-guide',
    title: 'How to Buy a Condo in Thailand as a Foreigner',
    excerpt:
      'A comprehensive guide covering foreign ownership quotas, legal requirements, financing options, and step-by-step buying process in Thailand.',
    date: '2025-01-10',
    category: 'Guides',
    readTime: '12 min read',
  },
  {
    slug: 'top-areas-pattaya-investment-2025',
    title: 'Top 5 Areas in Pattaya for Property Investment',
    excerpt:
      'From Pratumnak Hill to Wongamat Beach, explore the most promising neighborhoods for both rental income and capital appreciation.',
    date: '2024-12-20',
    category: 'Market Analysis',
    readTime: '6 min read',
  },
  {
    slug: 'pattaya-rental-yield-analysis',
    title: 'Pattaya Rental Yield Analysis: What Returns to Expect',
    excerpt:
      'An in-depth analysis of rental yields across different property types in Pattaya, including condos, villas, and commercial properties.',
    date: '2024-12-10',
    category: 'Investment',
    readTime: '10 min read',
  },
];

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const title = locale === 'th' ? 'บล็อกอสังหาริมทรัพย์' : 'Real Estate Blog';
  const desc =
    locale === 'th'
      ? 'บทความ การวิเคราะห์ตลาด และคู่มือสำหรับผู้ซื้อและนักลงทุนอสังหาริมทรัพย์ในพัทยา'
      : 'Expert insights, market analysis, and guides for property buyers and investors in Pattaya.';
  return makeListingPageMetadata(locale, 'blog', title, desc, dict.brand.name, resolvedSearchParams);
}

export default async function BlogIndexPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: locale === 'th' ? 'บล็อก' : 'Blog', href: `/${locale}/blog` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">
            {locale === 'th' ? 'บล็อกอสังหาริมทรัพย์' : 'Real Estate Blog'}
          </h1>
          <p className="subhead">
            {locale === 'th'
              ? 'บทความ การวิเคราะห์ตลาด และคู่มือสำหรับผู้ซื้อและนักลงทุนอสังหาริมทรัพย์ในพัทยา'
              : 'Expert insights, market analysis, and guides for property buyers and investors in Pattaya.'}
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="grid grid-2">
            {articles.map((article) => (
              <article key={article.slug} className="card reveal">
                <div className="article-meta">
                  <span className="article-category">{article.category}</span>
                  <time dateTime={article.date}>{article.date}</time>
                  <span>{article.readTime}</span>
                </div>
                <h2 className="card-title">
                  <Link
                    href={withLocale(locale, `/blog/${article.slug}`)}
                    className="card-link"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="card-subtitle">{article.excerpt}</p>
                <div className="card-actions">
                  <Link
                    href={withLocale(locale, `/blog/${article.slug}`)}
                    className="btn btn-tertiary"
                  >
                    {locale === 'th' ? 'อ่านต่อ →' : 'Read more →'}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
