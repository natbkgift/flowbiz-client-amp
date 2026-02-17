'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CTA } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';
import { trackEvent } from '../../lib/analytics';
import { readAttribution } from '../../lib/attribution';

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
  const [status, setStatus] = useState<LeadFormStatus>({ state: 'idle' });

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!message.trim()) return false;
    if (!email.trim() && !phone.trim()) return false;
    return status.state !== 'submitting';
  }, [email, message, name, phone, status.state]);

  function safeSourcePage(): string | null {
    if (typeof window === 'undefined') return null;
    const url = window.location.href;
    if (url.length <= 500) return url;
    return url.slice(0, 500);
  }

  function formatApiError(bodyText: string): string {
    try {
      const parsed = JSON.parse(bodyText) as { detail?: unknown };
      const detail = (parsed as any)?.detail;

      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        // FastAPI / Pydantic validation errors
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

  async function onSubmit() {
    if (!canSubmit) return;

    const submitIso = new Date().toISOString();
    const attribution = readAttribution();

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
          property_id: propertyId ?? null,
          name,
          email: email.trim() || null,
          phone: phone.trim() || null,
          message,
          source_page: safeSourcePage(),
          website: website.trim() || null,
          utm_source: attribution.utm_source ?? null,
          utm_medium: attribution.utm_medium ?? null,
          utm_campaign: attribution.utm_campaign ?? null,
          utm_content: attribution.utm_content ?? null,
          referrer: attribution.referrer ?? null,
          device: attribution.device ?? null,
          first_touch_timestamp: attribution.first_touch_timestamp ?? null,
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
    } catch (err) {
      trackEvent('form_error', pathname, {
        property_id: propertyId ?? null,
        message: err instanceof Error ? err.message : 'Failed',
      });
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit lead',
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
        <textarea
          className="form-textarea"
          name="message"
          placeholder={dict.common.leadForm.messagePlaceholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onSubmit}
          disabled={!canSubmit}
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

        {status.state === 'success' ? (
          <p className="form-success">{dict.common.leadForm.success}{status.id ? ` (id: ${status.id})` : ''}</p>
        ) : null}

        {status.state === 'error' ? (
          <p className="form-error">{dict.common.leadForm.errorPrefix} {status.message}</p>
        ) : null}
      </div>
    </form>
  );
}
