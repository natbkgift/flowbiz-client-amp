import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ContactPage from '@/app/(site)/[locale]/contact/page';

describe('contact page shell', () => {
  it('keeps the route chooser visible on the generic contact route', async () => {
    const { container } = render(
      await ContactPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByRole('heading', { name: /start from the route that fits/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /send your request/i }).getAttribute('href')).toBe('#contact-form');
    expect(container.querySelector('.split.split--form-priority')).not.toBeNull();
  });

  it('hides the route chooser when a compare handoff is already in place', async () => {
    render(
      await ContactPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({
          intent: 'project_compare',
          source: 'compare_hero',
          projects: 'alpha,beta',
        }),
      }),
    );

    expect(screen.queryByRole('heading', { name: /start from the route that fits/i })).toBeNull();
    expect(screen.getByRole('link', { name: /continue with this compare brief/i }).getAttribute('href')).toBe('#contact-form');
    expect(screen.getByRole('heading', { name: /lead handoff summary/i })).toBeTruthy();
  });
});
