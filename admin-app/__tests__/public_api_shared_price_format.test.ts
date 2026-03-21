import { describe, expect, it } from 'vitest';

import { formatPriceTHB } from '@/app/_lib/public-api-shared';

describe('formatPriceTHB', () => {
  it('shows THB explicitly for English surfaces', () => {
    expect(formatPriceTHB(6500000, 'en')).toBe('THB 6,500,000');
  });

  it('keeps the compact baht symbol for Thai surfaces', () => {
    expect(formatPriceTHB(6500000, 'th')).toBe('฿6,500,000');
  });
});