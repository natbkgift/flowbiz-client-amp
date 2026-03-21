import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LeadForm } from '@/components/forms/LeadForm';
import { SellerForm } from '@/components/forms/SellerForm';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/contact',
}));

describe('contact form validation', () => {
  it('blocks lead submission when email format is incomplete', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadForm />);

    fireEvent.focus(screen.getByPlaceholderText('Your name'));
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Email (optional if phone provided)'), { target: { value: 'alex@' } });
    fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'Need advice on available condos.' } });
    fireEvent.click(screen.getByRole('checkbox'));

    expect(screen.getByText(/complete email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    expect(fetchMock.mock.calls.some((call) => call[0] === '/api/v1/inquiries')).toBe(false);
  });

  it('blocks seller submission when phone number is too short', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<SellerForm />);

    expect(screen.getByText(/local advisor will review pricing/i)).toBeInTheDocument();
    expect(screen.getByText(/follow-up within 24 hours/i)).toBeInTheDocument();

    fireEvent.focus(screen.getByPlaceholderText('Your name'));
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Nina' } });
    fireEvent.change(screen.getByLabelText('Phone (optional if email provided)'), { target: { value: '12345' } });

    expect(screen.getByText(/7 to 15 digits/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(fetchMock.mock.calls.some((call) => call[0] === '/api/v1/sell/submit')).toBe(false);
  });
});