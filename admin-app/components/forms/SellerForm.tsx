'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { en } from '@/app/_lib/i18n/en';
import { th } from '@/app/_lib/i18n/th';
import { localeFromPathname } from '@/app/_lib/i18n/routing';
import { trackEvent } from '@/lib/analytics';

type SellerFormProps = {
  heading?: string;
};

type SellerFormStatus =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'success'; id?: string }
  | { state: 'error'; message: string };

export function SellerForm({ heading }: SellerFormProps) {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  const [didStart, setDidStart] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<SellerFormStatus>({ state: 'idle' });

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!email.trim() && !phone.trim()) return false;
    return status.state !== 'submitting';
  }, [email, name, phone, status.state]);

  function formatApiError(bodyText: string): string {
    try {
      const parsed = JSON.parse(bodyText) as { detail?: unknown };
      const detail = (parsed as any)?.detail;

      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const messages = detail
          .map((d) => (typeof d?.msg === 'string' ? d.msg : null))
          .filter(Boolean);
        if (messages.length) return messages.join(' | ');
      }
    } catch {
      // ignore
    }

    return bodyText || 'Request failed';
  }

  function parseAskingPrice(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(/,/g, '');
    const n = Number(normalized);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  async function onSubmit() {
    if (!canSubmit) return;

    // Honeypot: bots that fill this should be ignored without revealing behavior.
    if (website.trim()) {
      setStatus({ state: 'success' });
      return;
    }

    trackEvent('form_submit', pathname, {
      form_type: 'seller',
      has_email: Boolean(email.trim()),
      has_phone: Boolean(phone.trim()),
    });

    setStatus({ state: 'submitting' });

    try {
      const res = await fetch('/api/v1/sell/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim() || null,
          phone: phone.trim() || null,
          property_type: propertyType.trim() || null,
          location: location.trim() || null,
          asking_price: parseAskingPrice(askingPrice),
          notes: notes.trim() || null,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(formatApiError(text) || `HTTP ${res.status}`);
      }

      let id: string | undefined;
      try {
        const parsed = JSON.parse(text) as { id?: string };
        id = parsed.id;
      } catch {
        // ignore
      }

      setStatus({ state: 'success', id });
      trackEvent('form_success', pathname, { form_type: 'seller' });
    } catch (err) {
      trackEvent('form_error', pathname, {
        form_type: 'seller',
        message: err instanceof Error ? err.message : 'Failed',
      });
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit',
      });
    }
  }

  return (
    <form className="inquiry-form" onSubmit={(e) => e.preventDefault()}>
      <h3>{heading ?? 'Sell with us'}</h3>
      <p className="form-desc">Submit your property details for review by our team.</p>

      <div
        className="form-grid"
        onFocusCapture={() => {
          if (didStart) return;
          setDidStart(true);
          trackEvent('form_start', pathname, { form_type: 'seller' });
        }}
      >
        {/* Honeypot field (must remain hidden). */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="form-honeypot"
        />

        <input
          className="form-input"
          name="name"
          placeholder={dict.common.leadForm.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="form-grid-2">
          <input
            className="form-input"
            name="email"
            placeholder={dict.common.leadForm.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="form-input"
            name="phone"
            placeholder={dict.common.leadForm.phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="form-grid-2">
          <input
            className="form-input"
            name="property_type"
            placeholder="Property type (condo / house / land)"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          />
          <input
            className="form-input"
            name="location"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <input
          className="form-input"
          name="asking_price"
          inputMode="numeric"
          placeholder="Asking price (THB)"
          value={askingPrice}
          onChange={(e) => setAskingPrice(e.target.value)}
        />

        <textarea
          className="form-textarea"
          name="notes"
          placeholder="Notes / details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          {status.state === 'submitting' ? dict.common.leadForm.submitting : 'Submit for review'}
        </button>

        {status.state === 'success' ? (
          <p className="form-success">
            Thanks — your submission was received.{status.id ? ` (id: ${status.id})` : ''}
          </p>
        ) : null}

        {status.state === 'error' ? (
          <p className="form-error">
            {dict.common.leadForm.errorPrefix} {status.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
