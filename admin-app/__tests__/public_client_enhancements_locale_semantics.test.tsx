import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicClientEnhancements } from '@/components/layout/PublicClientEnhancements';

let mockedPathname = '/en';

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
}));

vi.mock('next/dynamic', () => ({
  default: () => {
    const Stub = () => null;
    return Stub;
  },
}));

describe('PublicClientEnhancements locale semantics', () => {
  it('syncs html lang with the current locale pathname', () => {
    mockedPathname = '/en';
    const { rerender } = render(<PublicClientEnhancements />);

    expect(document.documentElement.getAttribute('lang')).toBe('en');

    mockedPathname = '/th';
    rerender(<PublicClientEnhancements />);

    expect(document.documentElement.getAttribute('lang')).toBe('th');
  });
});
