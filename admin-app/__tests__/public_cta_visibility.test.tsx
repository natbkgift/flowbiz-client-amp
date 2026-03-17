import { act, fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FloatingWhatsAppCTA } from '@/components/ux/FloatingWhatsAppCTA';
import { StickyMobileCTA } from '@/components/ux/StickyMobileCTA';

let mockedPathname = '/en';
let mockedSearch = '';

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  useSearchParams: () => new URLSearchParams(mockedSearch),
}));

describe('public CTA visibility', () => {
  function setScrollY(value: number) {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value,
    });
  }

  it('keeps the sticky mobile CTA hidden on the localized home route until the visitor scrolls past the hero', () => {
    mockedPathname = '/en';
    mockedSearch = '';
    setScrollY(0);

    const { container } = render(<StickyMobileCTA />);
    const region = container.querySelector('.mobile-cta');

    expect(region).not.toBeNull();
    expect(region).not.toHaveClass('mobile-cta--visible');

    act(() => {
      setScrollY(360);
      fireEvent.scroll(window);
    });

    expect(region).toHaveClass('mobile-cta--visible');
  });

  it('suppresses the sticky mobile CTA while the guided overlay is open on the home route', () => {
    mockedPathname = '/en';
    mockedSearch = 'guided=1';
    setScrollY(500);

    const { container } = render(<StickyMobileCTA />);
    const region = container.querySelector('.mobile-cta');

    expect(region).not.toBeNull();
    expect(region).not.toHaveClass('mobile-cta--visible');
  });

  it('shows the sticky mobile CTA immediately on inner public routes', () => {
    mockedPathname = '/en/projects';
    mockedSearch = '';
    setScrollY(0);

    const { container } = render(<StickyMobileCTA />);
    const region = container.querySelector('.mobile-cta');

    expect(region).toHaveClass('mobile-cta--visible');
  });

  it('does not render the floating WhatsApp CTA on the localized home route', () => {
    mockedPathname = '/th';
    mockedSearch = '';

    const { container } = render(<FloatingWhatsAppCTA />);

    expect(container.querySelector('.floating-cta')).toBeNull();
  });

  it('renders the floating WhatsApp CTA on inner public routes', () => {
    mockedPathname = '/en/projects';
    mockedSearch = '';

    const { container } = render(<FloatingWhatsAppCTA />);
    const link = container.querySelector('.floating-cta');

    expect(link).not.toBeNull();
    expect(link).toHaveAttribute('href', 'https://wa.me/66634533526');
  });
});