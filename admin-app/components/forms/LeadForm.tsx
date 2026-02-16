'use client';

import { useMemo, useState } from 'react';

import { CTA } from '../../app/_lib/public-cta';

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
    } catch (err) {
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit lead',
      });
    }
  }

  return (
    <form className="inquiry-form" onSubmit={(e) => e.preventDefault()}>
      <h3>{heading ?? 'Tell us what you need'}</h3>
      <p style={{ color: 'var(--color-gray-600)', marginBottom: 16, fontSize: 14 }}>
        SubmitLead — We reply fast. Leave email or phone so we can reach you.
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {/* Honeypot field (must remain hidden). */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none' }}
        />

        <input
          className="form-input"
          name="name"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input
            className="form-input"
            name="email"
            placeholder="Email (optional if phone provided)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="form-input"
            name="phone"
            placeholder="Phone (optional if email provided)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <textarea
          className="form-textarea"
          name="message"
          placeholder="Message"
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
          {status.state === 'submitting' ? 'Submitting…' : 'Submit'}
        </button>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            className="btn btn-secondary"
            href={CTA.whatsAppUrl}
            target="_blank"
            rel="noreferrer"
          >
            ClickWhatsApp
          </a>
          <a className="btn btn-secondary" href={CTA.lineUrl} target="_blank" rel="noreferrer">
            LINE Chat
          </a>
        </div>

        {status.state === 'success' ? (
          <p style={{ color: 'var(--color-success)' }}>
            Thanks — we got your request{status.id ? ` (id: ${status.id})` : ''}.
          </p>
        ) : null}

        {status.state === 'error' ? (
          <p style={{ color: 'var(--color-error)' }}>
            Failed: {status.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
