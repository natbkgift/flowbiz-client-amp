import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { EmptyStateCard } from '@/components/ui/StateBlocks';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makeListingPageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';
import { getBlogPosts } from '@/app/_lib/content-hub';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toStringParam(input: string | string[] | undefined): string {
  if (Array.isArray(input)) return (input[0] ?? '').trim();
  return (input ?? '').trim();
}

function pickLocalizedText(value: { en: string; th: string } | undefined, locale: 'en' | 'th'): string {
  if (!value) return '';
  return (value[locale] || value.en || value.th || '').trim();
}

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

export default async function BlogIndexPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = toStringParam(resolvedSearchParams?.q).toLowerCase();
  const sort = toStringParam(resolvedSearchParams?.sort) || 'newest';
  const page = Math.max(Number.parseInt(toStringParam(resolvedSearchParams?.page) || '1', 10) || 1, 1);
  const pageSize = 6;

  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const entities = getBlogPosts();

  const filtered = entities.filter((item) => {
    if (!query) return true;
    const title = pickLocalizedText(item.title, locale).toLowerCase();
    const excerpt = pickLocalizedText(item.excerpt, locale).toLowerCase();
    const category = pickLocalizedText(item.category, locale).toLowerCase();
    return title.includes(query) || excerpt.includes(query) || category.includes(query) || item.slug.includes(query);
  });

  const sorted = [...filtered].sort((left, right) => {
    const l = Date.parse(left.publishedAt || '') || 0;
    const r = Date.parse(right.publishedAt || '') || 0;
    return sort === 'oldest' ? l - r : r - l;
  });

  const totalPages = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const items = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
          <form className="mb-6 grid gap-3 md:grid-cols-[2fr_1fr_auto]" role="search" aria-label={locale === 'th' ? 'ค้นหาบทความ' : 'Search articles'}>
            <label className="sr-only" htmlFor="blog-search">{locale === 'th' ? 'ค้นหา' : 'Search'}</label>
            <input
              id="blog-search"
              name="q"
              defaultValue={toStringParam(resolvedSearchParams?.q)}
              placeholder={locale === 'th' ? 'ค้นหาจากหัวข้อหรือคีย์เวิร์ด' : 'Search by title or keyword'}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2"
            />
            <label className="sr-only" htmlFor="blog-sort">{locale === 'th' ? 'เรียงลำดับ' : 'Sort order'}</label>
            <select id="blog-sort" name="sort" defaultValue={sort} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-2">
              <option value="newest">{locale === 'th' ? 'ล่าสุดก่อน' : 'Newest first'}</option>
              <option value="oldest">{locale === 'th' ? 'เก่าสุดก่อน' : 'Oldest first'}</option>
            </select>
            <button className="btn btn-secondary" type="submit">{locale === 'th' ? 'ใช้งานตัวกรอง' : 'Apply'}</button>
          </form>

          {items.length === 0 ? (
            <EmptyStateCard
              title={locale === 'th' ? 'ไม่พบบทความตามเงื่อนไข' : 'No articles found for this filter'}
              body={locale === 'th' ? 'ลองเปลี่ยนคำค้นหา หรือกลับไปดูบทความทั้งหมด' : 'Try a different keyword or browse all articles.'}
              action={<Link href={withLocale(locale, '/blog')} className="btn btn-cta">{locale === 'th' ? 'ดูบทความทั้งหมด' : 'Browse all articles'}</Link>}
            />
          ) : null}

          <div className="grid grid-2">
            {items.map((article) => (
              <article key={article.slug} className="card reveal">
                <div className="article-meta">
                  <span className="article-category">{pickLocalizedText(article.category, locale) || (locale === 'th' ? 'บทความ' : 'Article')}</span>
                  <time dateTime={article.publishedAt}>{article.publishedAt}</time>
                  <span>{pickLocalizedText(article.readTime, locale) || (locale === 'th' ? 'อ่านสั้น' : 'Quick read')}</span>
                </div>
                <h2 className="card-title">
                  <Link
                    href={withLocale(locale, `/blog/${article.slug}`)}
                    className="card-link"
                  >
                    {pickLocalizedText(article.title, locale) || article.slug}
                  </Link>
                </h2>
                <p className="card-subtitle">
                  {pickLocalizedText(article.excerpt, locale)
                    || (locale === 'th'
                      ? 'เนื้อหาบทความกำลังอัปเดตในระบบ (TODO: เติม excerpt)'
                      : 'Article content is being updated in the system (TODO: add excerpt).')}
                </p>
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

          <nav className="mt-6 flex items-center justify-between" aria-label={dict.listing.paginationLabel}>
            <Link
              className={`btn btn-secondary ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              href={withLocale(locale, `/blog?page=${Math.max(1, currentPage - 1)}&sort=${encodeURIComponent(sort)}${query ? `&q=${encodeURIComponent(query)}` : ''}`)}
            >
              {dict.listing.previousPage}
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {dict.listing.pageOf.replace('{page}', String(currentPage)).replace('{total}', String(totalPages))}
            </p>
            <Link
              className={`btn btn-secondary ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
              href={withLocale(locale, `/blog?page=${Math.min(totalPages, currentPage + 1)}&sort=${encodeURIComponent(sort)}${query ? `&q=${encodeURIComponent(query)}` : ''}`)}
            >
              {dict.listing.nextPage}
            </Link>
          </nav>
        </Container>
      </section>
    </main>
  );
}
