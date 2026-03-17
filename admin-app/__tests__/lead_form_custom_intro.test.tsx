import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LeadForm } from '@/components/forms/LeadForm';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}));

describe('LeadForm custom intro', () => {
  it('renders custom heading, description, and form id when provided', () => {
    const { container } = render(
      <LeadForm
        formId="custom-consultation-form"
        heading="Custom consultation heading"
        description="Custom consultation description"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Custom consultation heading' })).toBeInTheDocument();
    expect(screen.getByText('Custom consultation description')).toBeInTheDocument();
    expect(document.querySelector('form#custom-consultation-form')).not.toBeNull();
    expect(container.querySelector('[aria-label="lead-form-support-links"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LINE' })).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-label="lead-form-support-links"] .btn')).toHaveLength(0);
  });
});