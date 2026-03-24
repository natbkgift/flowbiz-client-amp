import { describe, expect, it } from 'vitest';

import { resolveCmsText, resolveLocalizedText, splitIntoParagraphs } from '@/app/_lib/public-content';

describe('public content resolution helpers', () => {
  it('resolves nested localized objects into readable text', () => {
    const result = resolveLocalizedText(
      {
        en: {
          title: 'Advisory process',
          body: 'Built from live CMS data.',
        },
        th: {
          title: 'ขั้นตอนการทำงาน',
          body: 'ดึงจาก CMS จริง',
        },
      },
      'en',
    );

    expect(result).toContain('Advisory process');
    expect(result).toContain('Built from live CMS data.');
  });

  it('parses JSON-stringified CMS documents before resolving locale text', () => {
    const result = resolveCmsText(
      JSON.stringify({
        en: { headline: 'Published team', description: 'Rendered from admin content.' },
      }),
      'en',
    );

    expect(result).toContain('Published team');
    expect(result).toContain('Rendered from admin content.');
  });

  it('splits multiline content into display paragraphs without duplicates', () => {
    expect(
      splitIntoParagraphs('First paragraph\n\nSecond paragraph\n\nSecond paragraph'),
    ).toEqual(['First paragraph', 'Second paragraph']);
  });
});
