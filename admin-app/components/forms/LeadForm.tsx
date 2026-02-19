'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CTA } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';
import { trackEvent } from '../../lib/analytics';
import { trackExperimentOutcomes } from '../../lib/experiments';

type LeadFormProps = {
  heading?: string;
  propertyId?: string | null;
  defaultMessage?: string;
};

type LeadFormStatus =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'success'; id?: string }
  | { state: 'error'; message: string };

export function LeadForm({ heading, propertyId, defaultMessage }: LeadFormProps) {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  const [didStart, setDidStart] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(defaultMessage ?? '');
  const [website, setWebsite] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<LeadFormStatus>({ state: 'idle' });

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!message.trim()) return false;
    if (!email.trim() && !phone.trim()) return false;
    if (!consent) return false;
    return status.state !== 'submitting';
  }, [email, message, name, phone, consent, status.state]);

  function safeSourcePage(): string | null {
    if (typeof window === 'undefined') return null;
    const url = window.location.href;
    if (url.length <= 500) return url;
    return url.slice(0, 500);
  }

  function formatApiError(bodyText: string): string {
    try {
      const parsed = JSON.parse(bodyText) as { detail?: unknown };
      const detail = parsed.detail;

      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        // FastAPI / Pydantic validation errors
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

  async function onSubmit() {
    if (!canSubmit) return;

    const submitIso = new Date().toISOString();

    trackEvent('form_submit', pathname, {
      property_id: propertyId ?? null,
      has_email: Boolean(email.trim()),
      has_phone: Boolean(phone.trim()),
    });

    setStatus({ state: 'submitting' });

    try {
      const res = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Core 5 data fields (PDPA/GDPR minimization)
          name,
          email: email.trim() || null,
          phone: phone.trim() || null,
          message,
          consent_given: true,
          // Operational metadata (not user PII)
          property_id: propertyId ?? null,
          source_page: safeSourcePage(),
          website: website.trim() || null,
          submit_timestamp: submitIso,
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
      trackEvent('form_success', pathname, { property_id: propertyId ?? null });
      // Attribute conversion to active experiments
      trackExperimentOutcomes('form_submit', 1, trackEvent, pathname);
    } catch (err) {
      trackEvent('form_error', pathname, {
        property_id: propertyId ?? null,
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
      <h3>{heading ?? dict.common.leadForm.headingDefault}</h3>
      <p className="form-desc">{dict.common.leadForm.description}</p>

      <div
        className="form-grid"
        onFocusCapture={() => {
          if (didStart) return;
          setDidStart(true);
          trackEvent('form_start', pathname, { property_id: propertyId ?? null });
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

        <label htmlFor="lead-name" className="sr-only">
          {dict.common.leadForm.namePlaceholder}
        </label>
        <input
          id="lead-name"
          className="form-input"
          name="name"
          placeholder={dict.common.leadForm.namePlaceholder}
          aria-required="true"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="form-grid-2">
          <div>
            <label htmlFor="lead-email" className="sr-only">
              {dict.common.leadForm.emailPlaceholder}
            </label>
            <input
              id="lead-email"
              className="form-input"
              name="email"
              type="email"
              placeholder={dict.common.leadForm.emailPlaceholder}
              aria-required="true"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="lead-phone" className="sr-only">
              {dict.common.leadForm.phonePlaceholder}
            </label>
            <input
              id="lead-phone"
              className="form-input"
              name="phone"
              type="tel"
              placeholder={dict.common.leadForm.phonePlaceholder}
              aria-required="true"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <label htmlFor="lead-message" className="sr-only">
          {dict.common.leadForm.messagePlaceholder}
        </label>
        <textarea
          id="lead-message"
          className="form-textarea"
          name="message"
          placeholder={dict.common.leadForm.messagePlaceholder}
          aria-required="true"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        <label className="form-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-required="true"
          />
          <span className="form-consent__text">
            {dict.common.leadForm.consentText ?? 'I agree to the processing of my personal data in accordance with the Privacy Policy (PDPA/GDPR).'}
          </span>
        </label>

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-describedby="lead-form-status"
        >
          {status.state === 'submitting' ? dict.common.leadForm.submitting : dict.common.leadForm.submit}
        </button>

        <div className="cta-row">
          <a
            className="btn btn-secondary"
            href={CTA.whatsAppUrl}
            target="_blank"
            rel="noreferrer"
          >
            {dict.cta.whatsapp}
          </a>
          <a className="btn btn-secondary" href={CTA.lineUrl} target="_blank" rel="noreferrer">
            {dict.cta.line}
          </a>
        </div>

        <div id="lead-form-status" aria-live="assertive" aria-atomic="true">
          {status.state === 'success' ? (
            <p className="form-success" role="status">{dict.common.leadForm.success}{status.id ? ` (id: ${status.id})` : ''}</p>
          ) : null}

          {status.state === 'error' ? (
            <p className="form-error" role="alert">{dict.common.leadForm.errorPrefix} {status.message}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
