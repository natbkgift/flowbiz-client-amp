import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomeBottomCta } from '@/components/home/HomeBottomCta';
import { LeadForm } from '@/components/forms/LeadForm';

vi.mock('@/components/analytics/TrackedLink', () => ({
  TrackedLink: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}));

describe('HomeBottomCta conversion gate', () => {
  it('keeps the primary CTA on-page and renders a single form intro via LeadForm props', () => {
    const { container } = render(
      <HomeBottomCta
        heading="Share your brief"
        subheading="Name, contact, and a short note are enough for the first reply."
        benefits={[]}
        primaryLabel="Send brief"
        primaryUrl="#home-consultation-form"
        secondaryLabel="View all projects"
        secondaryUrl="/en/projects?source=home_bottom_secondary"
        trustNote="The Pattaya team replies with a focused first set."
        sectionId="home-consultation-section"
        formSlot={(
          <LeadForm
            formId="home-consultation-form"
            heading="Your requirements"
            description="A short form is enough to start the first shortlist."
            variant="compact"
          />
        )}
      />,
    );

    expect(screen.getByRole('link', { name: 'Send brief' })).toHaveAttribute('href', '#home-consultation-form');
    expect(container.querySelector('section#home-consultation-section')).not.toBeNull();
    expect(container.querySelector('section#home-consultation-section')?.getAttribute('aria-labelledby')).toBe('home-consultation-section-title');
    expect(screen.getByRole('heading', { name: 'Your requirements' })).toBeInTheDocument();
    expect(screen.getByText('A short form is enough to start the first shortlist.')).toBeInTheDocument();
    expect(screen.getByText('The Pattaya team replies with a focused first set.')).toBeInTheDocument();
    expect(container.querySelectorAll('form#home-consultation-form')).toHaveLength(1);
    expect(container.querySelectorAll('.bg-white h3')).toHaveLength(1);
    expect(screen.queryByLabelText('Preferred area')).toBeNull();
    expect(screen.queryByLabelText('Timeframe')).toBeNull();
  });
});
