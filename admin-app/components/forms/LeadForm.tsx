'use client';

import { useMemo, useState } from 'react';

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
  const [status, setStatus] = useState<LeadFormStatus>({ state: 'idle' });

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!message.trim()) return false;
    if (!email.trim() && !phone.trim()) return false;
    return status.state !== 'submitting';
  }, [email, message, name, phone, status.state]);

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
          source_page: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`);
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
            href="https://wa.me/66634533526"
            target="_blank"
            rel="noreferrer"
          >
            ClickWhatsApp
          </a>
          <a className="btn btn-secondary" href="https://line.me/ti/p/~@554dksqb" target="_blank" rel="noreferrer">
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
