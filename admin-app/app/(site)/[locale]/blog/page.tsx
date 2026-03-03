import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { PAGE_REVALIDATE_SECONDS } from '@/app/_lib/constants';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { fetchBlogPosts, type ContentLocalizedText } from '@/app/_lib/public-api-server';

export const revalidate = PAGE_REVALIDATE_SECONDS;

function pageCopy(locale: 'en' | 'th') {
  if (locale === 'th') {
    return {
      title: 'บทความ',
      subtitle: 'สรุปข้อมูลจากคอนเทนต์ที่เผยแพร่แล้ว',
      description: 'รายการบทความที่เผยแพร่แล้วของ AMP Pattaya',
      empty: 'ยังไม่มีบทความที่เผยแพร่',
      publishedAt: 'เผยแพร่',
      updatedAt: 'อัปเดต',
    };
  }
  return {
    title: 'Blog',
    subtitle: 'Published insights and practical guides.',
    description: 'Published blog posts from AMP Pattaya.',
    empty: 'No published blog posts yet.',
    publishedAt: 'Published',
    updatedAt: 'Updated',
  };
}

function localizeText(locale: 'en' | 'th', value: ContentLocalizedText | null | undefined): string {
  if (!value) return '';
  return locale === 'th' ? value.th : value.en;
}

function formatDate(locale: 'en' | 'th', value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const formatter = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return formatter.format(date);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = pageCopy(locale);
  return makePageMetadata(locale, 'blog', copy.title, copy.description, dict.brand.name);
}

export default async function BlogPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const copy = pageCopy(locale);

  const posts = await fetchBlogPosts().catch(() => []);
  const rows = [...posts].sort((a, b) => {
    const left = Date.parse(a.published_at ?? a.updated_at ?? '');
    const right = Date.parse(b.published_at ?? b.updated_at ?? '');
    return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
  });

  return (
    <main className="section" id="main-content">
      <Container>
        <div className="section-header mb-6">
          <h1 className="section-title">{copy.title}</h1>
          <p className="section-subtitle">{copy.subtitle}</p>
        </div>

        {rows.length ? (
          <div className="grid grid-3">
            {rows.map((post) => {
              const title = localizeText(locale, post.title) || post.slug;
              const excerpt = localizeText(locale, post.excerpt ?? null);
              const publishedText = formatDate(locale, post.published_at);
              const updatedText = formatDate(locale, post.updated_at);
              return (
                <article key={post.slug} className="card">
                  <h2 className="card-title">{title}</h2>
                  {excerpt ? <p className="card-subtitle">{excerpt}</p> : null}
                  <p className="card-subtitle">
                    {copy.publishedAt}: {publishedText || '-'}
                  </p>
                  <p className="card-subtitle">
                    {copy.updatedAt}: {updatedText || '-'}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p>{copy.empty}</p>
        )}
      </Container>
    </main>
  );
}
