import { describe, expect, it } from 'vitest';

import { resolveHomeBottomCtaPrimaryUrl } from '@/app/_lib/home-bottom-cta';

describe('home bottom CTA primary route guard', () => {
  it('keeps the home primary CTA pinned to the on-page consultation form', () => {
    expect(resolveHomeBottomCtaPrimaryUrl('home-consultation-form')).toBe('#home-consultation-form');
    expect(resolveHomeBottomCtaPrimaryUrl('home-consultation-form', '   ')).toBe('#home-consultation-form');
    expect(resolveHomeBottomCtaPrimaryUrl('home-consultation-form', '#home-consultation-form')).toBe('#home-consultation-form');
  });

  it('rejects CMS overrides that would break the on-page conversion gate', () => {
    expect(resolveHomeBottomCtaPrimaryUrl('home-consultation-form', '/contact')).toBe('#home-consultation-form');
    expect(resolveHomeBottomCtaPrimaryUrl('home-consultation-form', '/en/contact?topic=private_tour')).toBe('#home-consultation-form');
    expect(resolveHomeBottomCtaPrimaryUrl('home-consultation-form', 'https://example.com')).toBe('#home-consultation-form');
  });
});
