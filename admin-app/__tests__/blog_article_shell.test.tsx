import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import BlogArticlePage from '@/app/(site)/[locale]/blog/[slug]/page';

vi.mock('@/app/_lib/public-api-server', () => ({
  fetchBlogPostBySlug: vi.fn(async () => ({
    slug: 'pattaya-yields',
    title: { en: 'Pattaya Yield Read', th: 'วิธีอ่านยีลด์พัทยา' },
    excerpt: { en: 'Yield context for Pattaya buyers.', th: 'บริบทยีลด์สำหรับผู้ซื้อในพัทยา' },
    category: { en: 'Investment', th: 'การลงทุน' },
    read_time: { en: '5 min read', th: 'อ่าน 5 นาที' },
    body: {
      en: ['Body paragraph one.'],
      th: ['ย่อหน้าแรกของบทความ'],
    },
    links: [],
    published_at: '2026-03-10T00:00:00.000Z',
    updated_at: '2026-03-12T00:00:00.000Z',
  })),
  fetchBlogPosts: vi.fn(async () => ([
    {
      slug: 'pattaya-yields',
      title: { en: 'Pattaya Yield Read', th: 'วิธีอ่านยีลด์พัทยา' },
      excerpt: { en: 'Yield context for Pattaya buyers.', th: 'บริบทยีลด์สำหรับผู้ซื้อในพัทยา' },
      category: { en: 'Investment', th: 'การลงทุน' },
      read_time: { en: '5 min read', th: 'อ่าน 5 นาที' },
      published_at: '2026-03-10T00:00:00.000Z',
      updated_at: '2026-03-12T00:00:00.000Z',
    },
    {
      slug: 'jomtien-market',
      title: { en: 'Jomtien Market Read', th: 'อ่านตลาดจอมเทียน' },
      excerpt: { en: 'Area context.', th: 'บริบทของทำเล' },
      category: { en: 'Area Guide', th: 'คู่มือทำเล' },
      read_time: { en: '4 min read', th: 'อ่าน 4 นาที' },
      published_at: '2026-03-11T00:00:00.000Z',
      updated_at: '2026-03-11T00:00:00.000Z',
    },
  ])),
}));

describe('blog article shell', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the article route on a page-owned advisory CTA model in Thai', async () => {
    const markup = renderToStaticMarkup(
      await BlogArticlePage({
        params: Promise.resolve({ locale: 'th', slug: 'pattaya-yields' }),
      }),
    );

    expect(markup).toContain('blog_consultation_primary');
    expect(markup).toContain('blog-next-step-links');
    expect(markup).toContain('ส่งบรีฟให้ที่ปรึกษา');
    expect(markup).toContain('แปลงบทความเป็นแผนต่อ');
    expect(markup).not.toContain('btn btn-tertiary');
  });
});