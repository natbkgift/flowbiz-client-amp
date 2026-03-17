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
        heading="Ready to shortlist the right deal for your goal?"
        subheading="Share your budget and intent, and our advisory team will prepare a shortlist."
        primaryLabel="Book Consultation"
        primaryUrl="#home-consultation-form"
        secondaryLabel="See Investment Path"
        secondaryUrl="/en/invest"
        trustNote="Our local advisory team follows up with a shortlist matched to your goals."
        conversionNote="The primary CTA keeps you on this page and jumps straight to the consultation form so you can brief the team immediately."
        sectionId="home-consultation-section"
        formSlot={(
          <LeadForm
            formId="home-consultation-form"
            heading="Request a Private Consultation"
            description="Complete the short form and we will follow up with a curated shortlist matched to your budget."
          />
        )}
      />,
    );

    expect(screen.getByRole('link', { name: 'Book Consultation' })).toHaveAttribute('href', '#home-consultation-form');
    expect(container.querySelector('section#home-consultation-section')).not.toBeNull();
    expect(container.querySelector('section#home-consultation-section')?.getAttribute('aria-labelledby')).toBe('home-consultation-section-title');
    expect(screen.getByRole('heading', { name: 'Request a Private Consultation' })).toBeInTheDocument();
    expect(screen.getByText('Complete the short form and we will follow up with a curated shortlist matched to your budget.')).toBeInTheDocument();
    expect(screen.getByText('The primary CTA keeps you on this page and jumps straight to the consultation form so you can brief the team immediately.')).toBeInTheDocument();
    expect(container.querySelectorAll('form#home-consultation-form')).toHaveLength(1);
    expect(container.querySelectorAll('.bg-white h3')).toHaveLength(1);
  });
});