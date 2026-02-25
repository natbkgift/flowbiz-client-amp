'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CTA } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';
import { trackEvent } from '../../lib/analytics';
import { trackExperimentOutcomes } from '../../lib/experiments';
import { calculateLeadScore } from '../../lib/lead-scoring';

type LeadFormProps = {
  heading?: string;
  propertyId?: string | null;
  defaultMessage?: string;
  variant?: 'default' | 'home';
};

type LeadFormStatus =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'success'; id?: string }
  | { state: 'error'; message: string };

export function LeadForm({ heading, propertyId, defaultMessage, variant = 'default' }: LeadFormProps) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  const utm = useMemo(() => {
    const get = (key: string) => {
      const v = searchParams?.get(key);
      return v && v.trim() ? v.trim().slice(0, 200) : null;
    };
    return {
      utm_source: get('utm_source'),
      utm_medium: get('utm_medium'),
      utm_campaign: get('utm_campaign'),
      utm_term: get('utm_term'),
      utm_content: get('utm_content'),
    };
  }, [searchParams]);

  const [didStart, setDidStart] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState(defaultMessage ?? '');
  const [website, setWebsite] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<LeadFormStatus>({ state: 'idle' });

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!email.trim() && !phone.trim()) return false;
    if (variant === 'home') {
      if (!budget.trim()) return false;
      if (!purpose.trim()) return false;
    } else if (!message.trim()) {
      return false;
    }
    if (!consent) return false;
    return status.state !== 'submitting';
  }, [email, message, name, phone, consent, status.state, budget, purpose, variant]);

  const homePurposeOptions = [
    { value: 'invest', label: locale === 'th' ? 'ลงทุน' : 'Invest' },
    { value: 'buy', label: locale === 'th' ? 'ซื้อ' : 'Buy' },
    { value: 'rent', label: locale === 'th' ? 'เช่า' : 'Rent' },
  ];

  const budgetOptions = [
    { value: '<3m', label: locale === 'th' ? 'ต่ำกว่า 3 ล้านบาท' : 'Under THB 3M' },
    { value: '3-5m', label: locale === 'th' ? '3–5 ล้านบาท' : 'THB 3M–5M' },
    { value: '5-8m', label: locale === 'th' ? '5–8 ล้านบาท' : 'THB 5M–8M' },
    { value: '8m+', label: locale === 'th' ? 'มากกว่า 8 ล้านบาท' : 'THB 8M+' },
    { value: 'not_sure', label: locale === 'th' ? 'ยังไม่แน่ใจ' : 'Not sure yet' },
  ];

  function buildSubmissionMessage(): string {
    if (variant !== 'home') return message.trim();

    const selectedPurpose = homePurposeOptions.find((item) => item.value === purpose)?.label ?? purpose;
    const selectedBudget = budgetOptions.find((item) => item.value === budget)?.label ?? budget;
    const freeText = message.trim();

    const lines = [
      locale === 'th' ? `วัตถุประสงค์: ${selectedPurpose}` : `Purpose: ${selectedPurpose}`,
      locale === 'th' ? `งบประมาณ: ${selectedBudget}` : `Budget: ${selectedBudget}`,
    ];

    if (freeText) {
      lines.push(locale === 'th' ? `รายละเอียดเพิ่มเติม: ${freeText}` : `Additional notes: ${freeText}`);
    } else {
      lines.push(locale === 'th' ? 'รายละเอียดเพิ่มเติม: -' : 'Additional notes: -');
    }

    return lines.join('\n');
  }

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
    const finalMessage = buildSubmissionMessage();

    trackEvent('form_submit', pathname, {
      property_id: propertyId ?? null,
      has_email: Boolean(email.trim()),
      has_phone: Boolean(phone.trim()),
      variant,
      purpose: purpose || null,
      budget: budget || null,
    });

    // Compute lead quality score for CRM enrichment
    const leadScore = calculateLeadScore({
      name,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      message: finalMessage,
      propertyId: propertyId ?? undefined,
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
          message: finalMessage,
          consent_given: true,
          // Operational metadata (not user PII)
          property_id: propertyId ?? null,
          source_page: safeSourcePage(),
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          utm_term: utm.utm_term,
          utm_content: utm.utm_content,
          website: website.trim() || null,
          submit_timestamp: submitIso,
          // Lead quality score (0–100 + tier)
          lead_score: leadScore.total,
          lead_tier: leadScore.tier,
          extra_budget: variant === 'home' ? budget : null,
          extra_purpose: variant === 'home' ? purpose : null,
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
      trackEvent('form_success', pathname, {
        property_id: propertyId ?? null,
        variant,
        purpose: purpose || null,
        budget: budget || null,
      });
      // Attribute conversion to active experiments
      trackExperimentOutcomes('form_submit', 1, trackEvent, pathname);
    } catch (err) {
      trackEvent('form_error', pathname, {
        property_id: propertyId ?? null,
        message: err instanceof Error ? err.message : 'Failed',
        variant,
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
      <p className="form-desc">
        {variant === 'home'
          ? (locale === 'th'
            ? 'แจ้งงบประมาณและช่วงเวลาที่ต้องการ เราจะส่ง shortlist ที่ตรงเป้าหมายของคุณ'
            : 'Tell us your budget and timeline — we will send a curated shortlist that fits your goals.')
          : dict.common.leadForm.description}
      </p>

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

        {/* UTM capture (for attribution). */}
        <input type="hidden" name="utm_source" value={utm.utm_source ?? ''} />
        <input type="hidden" name="utm_medium" value={utm.utm_medium ?? ''} />
        <input type="hidden" name="utm_campaign" value={utm.utm_campaign ?? ''} />
        <input type="hidden" name="utm_term" value={utm.utm_term ?? ''} />
        <input type="hidden" name="utm_content" value={utm.utm_content ?? ''} />

        <div className="form-helper" aria-live="polite">
          {status.state === 'error'
            ? (locale === 'th' ? 'กรุณาตรวจสอบข้อมูลที่จำเป็นและลองอีกครั้ง' : 'Please check required fields and try again.')
            : '\u00A0'}
        </div>

        <label htmlFor="lead-name" className={variant === 'home' ? 'form-label' : 'sr-only'}>
          {locale === 'th' ? 'ชื่อ' : 'Name'}
        </label>
        <input
          id="lead-name"
          className="form-input"
          name="name"
          placeholder={dict.common.leadForm.namePlaceholder}
          aria-required="true"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="form-grid-2">
          <div>
            <label htmlFor="lead-email" className={variant === 'home' ? 'form-label' : 'sr-only'}>
              {locale === 'th' ? 'อีเมล' : 'Email'}
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
            <label htmlFor="lead-phone" className={variant === 'home' ? 'form-label' : 'sr-only'}>
              {locale === 'th' ? 'WhatsApp/โทรศัพท์' : 'WhatsApp/Phone'}
            </label>
            <input
              id="lead-phone"
              className="form-input"
              name="phone"
              type="tel"
              placeholder={variant === 'home' ? (locale === 'th' ? 'WhatsApp หรือเบอร์โทร' : 'WhatsApp or phone number') : dict.common.leadForm.phonePlaceholder}
              aria-required="true"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {variant === 'home' ? (
          <div className="form-grid-2">
            <div>
              <label htmlFor="lead-budget" className="form-label">{locale === 'th' ? 'งบประมาณ' : 'Budget'}</label>
              <select
                id="lead-budget"
                className="form-select"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
              >
                <option value="">{locale === 'th' ? 'เลือกงบประมาณ' : 'Select budget'}</option>
                {budgetOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-purpose" className="form-label">{locale === 'th' ? 'วัตถุประสงค์' : 'Purpose'}</label>
              <select
                id="lead-purpose"
                className="form-select"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              >
                <option value="">{locale === 'th' ? 'เลือกวัตถุประสงค์' : 'Select purpose'}</option>
                {homePurposeOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <label htmlFor="lead-message" className={variant === 'home' ? 'form-label' : 'sr-only'}>
          {variant === 'home'
            ? (locale === 'th' ? 'ข้อความเพิ่มเติม (ไม่บังคับ)' : 'Additional message (optional)')
            : dict.common.leadForm.messagePlaceholder}
        </label>
        <textarea
          id="lead-message"
          className="form-textarea"
          name="message"
          placeholder={variant === 'home'
            ? (locale === 'th' ? 'ความต้องการพิเศษ/โครงการที่สนใจ (ถ้ามี)' : 'Special requirements or preferred projects (optional)')
            : dict.common.leadForm.messagePlaceholder}
          aria-required={variant === 'home' ? 'false' : 'true'}
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

        <p className="form-trust-note">
          {variant === 'home'
            ? (locale === 'th'
              ? 'ทีมที่ปรึกษาของเราจะติดต่อกลับพร้อม shortlist ตามงบประมาณและช่วงเวลาที่แจ้งไว้'
              : 'Our advisory team will follow up with a curated shortlist based on your budget and timeline.')
            : (locale === 'th'
              ? 'เราใช้ข้อมูลของคุณเพื่อการติดต่อและคัดเลือกข้อเสนอที่เหมาะสมเท่านั้น'
              : 'Your details are used only to contact you and curate relevant options.')}
        </p>

        <div className="cta-row cta-row--contacts">
          <a
            className="form-contact-link"
            href={CTA.whatsAppUrl}
            target="_blank"
            rel="noreferrer"
            data-amp-event-type="cta_click"
            data-amp-event-payload={JSON.stringify({ cta: 'leadform_whatsapp', from: 'form_secondary_contact', variant })}
          >
            {dict.cta.whatsapp}
          </a>
          <a
            className="form-contact-link"
            href={CTA.lineUrl}
            target="_blank"
            rel="noreferrer"
            data-amp-event-type="cta_click"
            data-amp-event-payload={JSON.stringify({ cta: 'leadform_line', from: 'form_secondary_contact', variant })}
          >
            {dict.cta.line}
          </a>
        </div>

        <div id="lead-form-status" className="form-status-slot" aria-live="assertive" aria-atomic="true">
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
