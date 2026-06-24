import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicClientEnhancements } from '@/components/layout/PublicClientEnhancements';

let mockedPathname = '/en';

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
}));

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<unknown>) => {
    const source = String(loader);
    const testId = source.includes('StickyMobileCTA')
      ? 'sticky-mobile-cta'
      : source.includes('AIChatWidget')
        ? 'ai-chat-widget'
        : 'dynamic-component';
    const Stub = () => <div data-testid={testId} />;
    return Stub;
  },
}));

afterEach(() => {
  vi.useRealTimers();
});

describe('PublicClientEnhancements locale semantics', () => {
  it('syncs html lang with the current locale pathname', () => {
    mockedPathname = '/en';
    const { rerender } = render(<PublicClientEnhancements />);

    expect(document.documentElement.getAttribute('lang')).toBe('en');

    mockedPathname = '/th';
    rerender(<PublicClientEnhancements />);

    expect(document.documentElement.getAttribute('lang')).toBe('th');
  });

  it('suppresses sticky mobile CTA and AI chat on the English preview route with trailing slash', async () => {
    vi.useFakeTimers();
    mockedPathname = '/en/v2-preview/';

    render(<PublicClientEnhancements />);

    expect(screen.queryByTestId('sticky-mobile-cta')).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByTestId('ai-chat-widget')).toBeNull();
  });

  it('does not treat normal public routes as the preview surface', () => {
    mockedPathname = '/en/projects';

    render(<PublicClientEnhancements />);

    expect(screen.getByTestId('sticky-mobile-cta')).toBeInTheDocument();
  });
});
