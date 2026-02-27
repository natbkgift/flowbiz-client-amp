import type { Metadata } from 'next';

import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { EmptyStateCard } from '@/components/ui/StateBlocks';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';
import { getGuideArticles } from '@/app/_lib/content-hub';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const title = locale === 'th' ? 'คู่มืออสังหาฯ พัทยา' : 'Pattaya Property Guides';
  const desc = locale === 'th'
    ? 'คู่มือการซื้อ-ลงทุน-การใช้ชีวิตในพัทยา พร้อมลิงก์ไปยังหน้าที่เกี่ยวข้อง'
    : 'Guides for buying, investing, and living in Pattaya, with practical links to listings.';
  return makePageMetadata(locale, 'guides', title, desc, dict.brand.name);
}

type GuideLink = { slug: string; titleEn: string; titleTh: string };

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

export default async function GuidesIndexPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = toStringParam(resolvedSearchParams?.q).toLowerCase();
  const sort = toStringParam(resolvedSearchParams?.sort) || 'newest';
  const page = Math.max(Number.parseInt(toStringParam(resolvedSearchParams?.page) || '1', 10) || 1, 1);
  const pageSize = 6;

  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const entities = await getGuideArticles();

  const filtered = entities.filter((item) => {
    if (!query) return true;
    const title = pickLocalizedText(item.title, locale).toLowerCase();
    const summary = pickLocalizedText(item.summary, locale).toLowerCase();
    return title.includes(query) || summary.includes(query) || item.slug.includes(query);
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
    { label: locale === 'th' ? 'คู่มือ' : 'Guides', href: `/${locale}/guides` },
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
          <h1 className="headline">{locale === 'th' ? 'คู่มืออสังหาฯ พัทยา' : 'Pattaya Property Guides'}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'อ่านคู่มือแบบย่อยง่าย แล้วต่อด้วยการดูโครงการ/อสังหาฯ ที่เกี่ยวข้อง'
              : 'Read the guides, then jump into relevant projects and listings.'}
          </p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/buy/condo-pattaya')}>
              {locale === 'th' ? 'ดูคอนโดขายพัทยา' : 'Condo for Sale Pattaya'}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/buy/villa-pattaya')}>
              {locale === 'th' ? 'ดูวิลล่าขายพัทยา' : 'Villas Pattaya'}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <form className="mb-6 grid gap-3 md:grid-cols-[2fr_1fr_auto]" role="search" aria-label={locale === 'th' ? 'ค้นหาคู่มือ' : 'Search guides'}>
            <label className="sr-only" htmlFor="guide-search">{locale === 'th' ? 'ค้นหา' : 'Search'}</label>
            <input
              id="guide-search"
              name="q"
              defaultValue={toStringParam(resolvedSearchParams?.q)}
              placeholder={locale === 'th' ? 'ค้นหาจากหัวข้อหรือคีย์เวิร์ด' : 'Search by title or keyword'}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-2"
            />
            <label className="sr-only" htmlFor="guide-sort">{locale === 'th' ? 'เรียงลำดับ' : 'Sort order'}</label>
            <select id="guide-sort" name="sort" defaultValue={sort} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-3 py-2">
              <option value="newest">{locale === 'th' ? 'ล่าสุดก่อน' : 'Newest first'}</option>
              <option value="oldest">{locale === 'th' ? 'เก่าสุดก่อน' : 'Oldest first'}</option>
            </select>
            <button className="btn btn-secondary" type="submit">{locale === 'th' ? 'ใช้งานตัวกรอง' : 'Apply'}</button>
          </form>

          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'บทความแนะนำ' : 'Featured Articles'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'เริ่มจากหัวข้อยอดนิยม แล้วค่อยปรับเส้นทางตามเป้าหมาย (ซื้อ/ลงทุน/อยู่เอง)'
                : 'Start with the popular topics, then follow the path based on your goal (buy, invest, live).'}
            </p>
          </div>

          {items.length === 0 ? (
            <EmptyStateCard
              title={locale === 'th' ? 'ไม่พบคู่มือตามเงื่อนไข' : 'No guides found for this filter'}
              body={locale === 'th' ? 'ลองเปลี่ยนคำค้นหา หรือกลับไปดูคู่มือทั้งหมด' : 'Try another keyword or browse all guides.'}
              action={<Link href={withLocale(locale, '/guides')} className="btn btn-cta">{locale === 'th' ? 'ดูคู่มือทั้งหมด' : 'Browse all guides'}</Link>}
            />
          ) : null}

          <div className="grid grid-2">
            {items.map((guide) => (
              <Link key={guide.slug} href={withLocale(locale, `/guides/${guide.slug}`)} className="card">
                <div className="card-title">{pickLocalizedText(guide.title, locale) || guide.slug}</div>
                <div className="card-subtitle">
                  {pickLocalizedText(guide.summary, locale)
                    || (locale === 'th'
                      ? 'สรุปคู่มือกำลังอัปเดต (TODO: เติม guide summary)'
                      : 'Guide summary is being updated (TODO: add guide summary).')}
                </div>
              </Link>
            ))}
          </div>

          <nav className="mt-6 flex items-center justify-between" aria-label={dict.listing.paginationLabel}>
            <Link
              className={`btn btn-secondary ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              href={withLocale(locale, `/guides?page=${Math.max(1, currentPage - 1)}&sort=${encodeURIComponent(sort)}${query ? `&q=${encodeURIComponent(query)}` : ''}`)}
            >
              {dict.listing.previousPage}
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {dict.listing.pageOf.replace('{page}', String(currentPage)).replace('{total}', String(totalPages))}
            </p>
            <Link
              className={`btn btn-secondary ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
              href={withLocale(locale, `/guides?page=${Math.min(totalPages, currentPage + 1)}&sort=${encodeURIComponent(sort)}${query ? `&q=${encodeURIComponent(query)}` : ''}`)}
            >
              {dict.listing.nextPage}
            </Link>
          </nav>

          <div className="cta-strip">
            <div className="cta-strip__text">
              {locale === 'th'
                ? 'อยากได้คำแนะนำเฉพาะงบ/ทำเล? คุยกับที่ปรึกษาได้เลย'
                : 'Want advice tailored to your budget and area? Talk to an advisor.'}
            </div>
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
          </div>
        </Container>
      </section>
    </main>
  );
}
