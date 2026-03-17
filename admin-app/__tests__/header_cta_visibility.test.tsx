import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { en } from '@/app/_lib/i18n/en';
import { Header } from '@/components/layout/Header';

let mockedPathname = '/en/projects';
const mockedPush = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  useRouter: () => ({ push: mockedPush }),
}));

describe('Header CTA visibility', () => {
  it('keeps global header CTAs visible on generic inner routes', () => {
    mockedPathname = '/en/projects';

    const { container } = render(<Header locale="en" dict={en} />);

    expect(container.querySelector('.header-cta-group')).not.toBeNull();
    expect(container.querySelector('.mobile-nav__cta')).not.toBeNull();
  });

  it('suppresses global header CTAs when the current route owns the primary conversion action', () => {
    mockedPathname = '/en/contact';

    const { container } = render(<Header locale="en" dict={en} />);

    expect(container.querySelector('.header-cta-group')).toBeNull();
    expect(container.querySelector('.mobile-nav__cta')).toBeNull();
  });
});