import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { fetchBlogPosts, type ContentLocalizedText } from '@/app/_lib/public-api-server';

export const revalidate = 300;

function pageCopy(locale: 'en' | 'th') {
  if (locale === 'th') {
    return {
      title: 'บทความ',
      subtitle: 'สรุปข้อมูลจากคอนเทนต์ที่เผยแพร่แล้ว',
      description: 'รายการบทความที่เผยแพร่แล้วของ AMP Pattaya',
      empty: 'ยังไม่มีบทความที่เผยแพร่',
      publishedAt: 'เผยแพร่',
      updatedAt: 'อัปเดต',
      readTime: 'เวลาอ่าน',
      readArticle: 'อ่านบทความ',
    };
  }
  return {
    title: 'Blog',
    subtitle: 'Published insights and practical guides.',
    description: 'Published blog posts from AMP Pattaya.',
    empty: 'No published blog posts yet.',
    publishedAt: 'Published',
    updatedAt: 'Updated',
    readTime: 'Read time',
    readArticle: 'Read article',
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

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = pageCopy(locale);
  return makePageMetadata(locale, 'blog', copy.title, copy.description, dict.brand.name);
}

export default async function BlogPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
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
          <div className="editorial-grid editorial-grid--three-up">
            {rows.map((post) => {
              const title = localizeText(locale, post.title) || post.slug;
              const excerpt = localizeText(locale, post.excerpt ?? null);
              const category = localizeText(locale, post.category ?? null);
              const readTime = localizeText(locale, post.read_time ?? null);
              const publishedText = formatDate(locale, post.published_at);
              const updatedText = formatDate(locale, post.updated_at);
              return (
                <article key={post.slug} className="editorial-card reveal">
                  <div className="editorial-card__meta">
                    {category ? <span>{category}</span> : null}
                    {readTime ? <span>{copy.readTime}: {readTime}</span> : null}
                  </div>
                  <h2 className="editorial-card__title">
                    <Link href={`/${locale}/blog/${encodeURIComponent(post.slug)}`}>
                      {title}
                    </Link>
                  </h2>
                  {excerpt ? <p className="editorial-card__excerpt">{excerpt}</p> : null}
                  <div className="editorial-card__footer">
                    <div>
                      <p className="card-subtitle">{copy.publishedAt}: {publishedText || '-'}</p>
                      <p className="card-subtitle">{copy.updatedAt}: {updatedText || '-'}</p>
                    </div>
                    <Link className="btn btn-secondary" href={`/${locale}/blog/${encodeURIComponent(post.slug)}`}>
                      {copy.readArticle}
                    </Link>
                  </div>
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

