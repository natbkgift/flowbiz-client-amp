'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { en } from '@/app/_lib/i18n/en';
import { th } from '@/app/_lib/i18n/th';
import { localeFromPathname } from '@/app/_lib/i18n/routing';
import { trackEvent } from '@/lib/analytics';
import { isValidEmail, isValidPhone } from '@/lib/contact-validation';

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
  const requiredText = locale === 'th' ? '(จำเป็น)' : '(required)';
  const contactMethodHelper =
    locale === 'th'
      ? 'กรอกอีเมลหรือเบอร์โทรอย่างน้อยหนึ่งช่องทางเพื่อให้ทีมติดต่อกลับได้'
      : 'Provide at least one contact method so the team can reply.';
  const contactMethodRequiredMessage =
    locale === 'th'
      ? 'กรุณากรอกอีเมลหรือเบอร์โทรอย่างน้อยหนึ่งช่องทาง'
      : 'Enter either an email address or a phone number.';
  const emailInvalidMessage =
    locale === 'th'
      ? 'กรุณากรอกอีเมลให้ครบถ้วน เช่น name@example.com'
      : 'Enter a complete email address, for example name@example.com.';
  const phoneInvalidMessage =
    locale === 'th'
      ? 'กรุณากรอกเบอร์โทรให้มีตัวเลข 7 ถึง 15 หลัก'
      : 'Enter a phone number with 7 to 15 digits.';

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

  const emailError = email.trim() && !isValidEmail(email) ? emailInvalidMessage : null;
  const phoneError = phone.trim() && !isValidPhone(phone) ? phoneInvalidMessage : null;
  const contactMethodError = didStart && !email.trim() && !phone.trim() ? contactMethodRequiredMessage : null;
  const validationMessage = emailError ?? phoneError ?? contactMethodError;

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!email.trim() && !phone.trim()) return false;
    if (email.trim() && !isValidEmail(email)) return false;
    if (phone.trim() && !isValidPhone(phone)) return false;
    return status.state !== 'submitting';
  }, [email, name, phone, status.state]);

  function formatApiError(bodyText: string): string {
    try {
      const parsed = JSON.parse(bodyText) as { detail?: unknown };
      const detail = parsed.detail;

      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const messages = detail
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            if (!('msg' in item)) return null;
            const msg = (item as { msg?: unknown }).msg;
            return typeof msg === 'string' ? msg : null;
          })
          .filter((m): m is string => Boolean(m));
        if (messages.length) return messages.join(' | ');
      }
    } catch {
      // ignore
    }

    return bodyText || dict.errors.requestFailed;
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

    if (validationMessage) {
      setStatus({ state: 'error', message: validationMessage });
      return;
    }

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
        message: err instanceof Error ? err.message : dict.errors.failedToSubmit,
      });
    }
  }

  return (
    <form className="inquiry-form" onSubmit={(e) => e.preventDefault()}>
      <h3 className="type-h3">{heading ?? dict.common.sellerForm.headingDefault}</h3>
      <p className="form-desc">{dict.common.sellerForm.description}</p>
      <div className="form-note-box mb-4">
        <p className="form-note-box__title type-small">{dict.common.sellerForm.trustIntro}</p>
        <p className="form-note-box__copy">{dict.common.sellerForm.responsePromise}</p>
      </div>

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

        <label htmlFor="seller-name" className="form-label">
          {dict.common.leadForm.namePlaceholder} <span className="text-gray-500">{requiredText}</span>
        </label>
        <input
          className="form-input"
          id="seller-name"
          name="name"
          placeholder={dict.common.leadForm.namePlaceholder}
          aria-required="true"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <p className="form-helper form-helper--muted">{contactMethodHelper}</p>
          {contactMethodError ? (
            <p className="form-error mt-2" role="alert">
              {contactMethodError}
            </p>
          ) : null}
        </div>
        <div className="form-grid-2">
          <div>
            <label htmlFor="seller-email" className="form-label">{dict.common.leadForm.emailPlaceholder}</label>
            <input
              className="form-input"
              id="seller-email"
              name="email"
              type="email"
              placeholder={dict.common.leadForm.emailPlaceholder}
              aria-required="true"
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'seller-email-error' : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError ? (
              <p id="seller-email-error" className="form-error mt-2" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="seller-phone" className="form-label">{dict.common.leadForm.phonePlaceholder}</label>
            <input
              className="form-input"
              id="seller-phone"
              name="phone"
              type="tel"
              placeholder={dict.common.leadForm.phonePlaceholder}
              aria-required="true"
              aria-invalid={phoneError ? 'true' : 'false'}
              aria-describedby={phoneError ? 'seller-phone-error' : undefined}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phoneError ? (
              <p id="seller-phone-error" className="form-error mt-2" role="alert">
                {phoneError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label htmlFor="seller-property-type" className="sr-only">{dict.common.sellerForm.propertyTypePlaceholder}</label>
            <input
              className="form-input"
              id="seller-property-type"
              name="property_type"
              placeholder={dict.common.sellerForm.propertyTypePlaceholder}
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="seller-location" className="sr-only">{dict.common.sellerForm.locationPlaceholder}</label>
            <input
              className="form-input"
              id="seller-location"
              name="location"
              placeholder={dict.common.sellerForm.locationPlaceholder}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <label htmlFor="seller-price" className="sr-only">{dict.common.sellerForm.askingPricePlaceholder}</label>
        <input
          className="form-input"
          id="seller-price"
          name="asking_price"
          inputMode="numeric"
          placeholder={dict.common.sellerForm.askingPricePlaceholder}
          value={askingPrice}
          onChange={(e) => setAskingPrice(e.target.value)}
        />

        <label htmlFor="seller-notes" className="sr-only">{dict.common.sellerForm.notesPlaceholder}</label>
        <textarea
          className="form-textarea"
          id="seller-notes"
          name="notes"
          placeholder={dict.common.sellerForm.notesPlaceholder}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-describedby="seller-form-status"
        >
          {status.state === 'submitting' ? dict.common.leadForm.submitting : dict.common.sellerForm.submit}
        </button>

        <div id="seller-form-status" aria-live="assertive" aria-atomic="true">
          {status.state === 'success' ? (
            <p className="form-success" role="status">
              {dict.common.sellerForm.success}{status.id ? ` (id: ${status.id})` : ''} {dict.common.sellerForm.responsePromise}
            </p>
          ) : null}

          {status.state === 'error' ? (
            <p className="form-error" role="alert">
              {dict.common.leadForm.errorPrefix} {status.message}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
