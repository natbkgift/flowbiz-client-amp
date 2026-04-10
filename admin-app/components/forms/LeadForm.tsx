'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CTA } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname, withLocale } from '../../app/_lib/i18n/routing';
import { getOrCreateSessionId, trackEvent } from '../../lib/analytics';
import { isValidEmail, isValidPhone } from '../../lib/contact-validation';
import {
  buildLeadAnalyticsPayload,
  buildLeadHandoffSummary,
  buildLeadHandoffTags,
  inferDeviceType,
  inferSourceRouteFromPath,
  type LeadAnalyticsOptions,
  type LeadHandoff,
} from '../../lib/conversion';
import { trackExperimentOutcomes } from '../../lib/experiments';
import { calculateLeadScore } from '../../lib/lead-scoring';
import { Button } from '@/components/public-system/components/Button';
import { CTAGroup } from '@/components/public-system/components/CTAGroup';
import { InputBase } from '@/components/public-system/components/InputBase';
import { SelectBase } from '@/components/public-system/components/SelectBase';
import { TextAreaBase } from '@/components/public-system/components/TextAreaBase';
import { FieldShell } from '@/components/public-system/primitives/FieldShell';

type LeadFormProps = {
  locale?: 'en' | 'th';
  heading?: string;
  description?: string;
  submitLabel?: string;
  variant?: 'default' | 'compact';
  formId?: string;
  propertyId?: string | null;
  projectId?: string | null;
  areaId?: string | null;
  defaultMessage?: string;
  defaultPreferredArea?: string;
  defaultBudgetBand?: string;
  defaultPurpose?: string;
  defaultTimeframe?: string;
  inquiryIntent?: string;
  inquirySource?: string;
  inquiryTags?: string[];
  contextSummary?: string[];
  handoff?: LeadHandoff;
};

type LeadFormStatus =
  | { state: 'idle' }
  | { state: 'submitting' }
  | {
      state: 'success';
      id?: string;
      confirmationTitle?: string;
      confirmationBody?: string;
      autoResponseMessage?: string;
      responseChannel?: string;
      responseSlaSeconds?: number;
    }
  | { state: 'error'; message: string };

type InquirySuccessPayload = {
  id?: string;
  sales_automation?: {
    confirmation_title?: string;
    confirmation_body?: string;
    auto_response_message?: string;
    response_channel?: string;
    response_sla_seconds?: number;
  };
};

function normalizeTagToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function uniqueLines(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const value of values) {
    const text = String(value || '').trim();
    if (!text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    lines.push(text);
  }

  return lines;
}

function normalizeRoutePath(pathname: string): string {
  const normalized = pathname.replace(/^\/(en|th)(?=\/|$)/, '');
  return normalized || '/';
}

function inferRoutePurpose(pathname: string): string | undefined {
  const routePath = normalizeRoutePath(pathname);

  if (routePath === '/buy') return 'buy';
  if (routePath === '/rent') return 'rent';
  if (routePath === '/invest' || routePath === '/investment' || routePath === '/investor') return 'invest';

  return undefined;
}

function inferRouteTimeframe(pathname: string): string | undefined {
  const routePath = normalizeRoutePath(pathname);

  if (
    routePath === '/buy'
    || routePath === '/rent'
    || routePath === '/invest'
    || routePath === '/investment'
    || routePath === '/investor'
    || routePath === '/area-guide'
    || routePath.startsWith('/areas/')
  ) {
    return 'flexible';
  }

  return undefined;
}

function inferRouteLeadSource(pathname: string): string | undefined {
  const routePath = normalizeRoutePath(pathname);

  if (routePath === '/') return 'home_form';
  if (routePath === '/contact') return 'contact_form';
  if (routePath === '/buy') return 'buy_form';
  if (routePath === '/rent') return 'rent_form';
  if (routePath === '/area-guide') return 'area_guide_form';
  if (routePath.startsWith('/areas/')) return 'area_detail_form';
  if (routePath.startsWith('/projects/')) return 'project_detail_form';
  if (routePath.startsWith('/property/')) return 'property_detail_form';
  if (routePath.startsWith('/blog/')) return 'blog_form';

  const segments = routePath.split('/').filter(Boolean);
  if (!segments.length) return undefined;

  return `${normalizeTagToken(segments[0])}_form`;
}

function inferPurposeFromHandoff(handoff: LeadHandoff | undefined): string | undefined {
  if (!handoff?.userIntent) return undefined;
  if (handoff.userIntent === 'buy' || handoff.userIntent === 'invest') return handoff.userIntent;
  return undefined;
}

function findOptionLabel(
  options: Array<{ value: string; label: string }>,
  value: string,
): string | null {
  return options.find((option) => option.value === value)?.label ?? null;
}

export function LeadForm({
  locale: explicitLocale,
  heading,
  description,
  submitLabel,
  variant = 'default',
  formId,
  propertyId,
  projectId,
  areaId,
  defaultMessage,
  defaultPreferredArea,
  defaultBudgetBand,
  defaultPurpose,
  defaultTimeframe,
  inquiryIntent,
  inquirySource,
  inquiryTags,
  contextSummary,
  handoff,
}: LeadFormProps) {
  const pathname = usePathname() ?? '/';
  const locale = explicitLocale ?? localeFromPathname(pathname);
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
  const handoffArea = typeof handoff?.context?.area === 'string' ? handoff.context.area : undefined;
  const resolvedDefaultBudgetBand = defaultBudgetBand ?? handoff?.budgetRange ?? '';
  const resolvedDefaultPurpose = defaultPurpose ?? inferPurposeFromHandoff(handoff) ?? inferRoutePurpose(pathname) ?? '';
  const resolvedDefaultPreferredArea = defaultPreferredArea ?? handoff?.location ?? handoffArea ?? '';
  const resolvedDefaultTimeframe = defaultTimeframe ?? inferRouteTimeframe(pathname) ?? '';
  const resolvedInquirySource = (inquirySource ?? inferRouteLeadSource(pathname))?.trim() || undefined;
  const resolvedSourceRoute = handoff?.sourceRoute ?? inferSourceRouteFromPath(pathname);
  const qualificationPreviewBody = locale === 'th'
    ? 'บริบทนี้จะถูกแนบไปกับคำขอ เพื่อให้ทีมคัดกรองและตอบกลับด้วยขั้นตอนถัดไปที่ชัดขึ้น'
    : 'This context travels with your request so the team can qualify the clearest next step faster.';
  const nationalityLabel = locale === 'th' ? 'สัญชาติ' : 'Nationality';
  const nationalityPlaceholder = locale === 'th' ? 'เช่น ไทย อังกฤษ จีน' : 'e.g. Thai, British, Chinese';

  const [didStart, setDidStart] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [budgetBand, setBudgetBand] = useState(resolvedDefaultBudgetBand);
  const [purpose, setPurpose] = useState(resolvedDefaultPurpose);
  const [preferredArea, setPreferredArea] = useState(resolvedDefaultPreferredArea);
  const [timeframe, setTimeframe] = useState(resolvedDefaultTimeframe);
  const [message, setMessage] = useState(defaultMessage ?? '');
  const [website, setWebsite] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<LeadFormStatus>({ state: 'idle' });
  const isCompact = variant === 'compact';
  const contactHelperId = `${formId ?? 'lead-form'}-contact-helper`;
  const contactErrorId = `${formId ?? 'lead-form'}-contact-error`;
  const emailErrorId = `${formId ?? 'lead-form'}-email-error`;
  const phoneErrorId = `${formId ?? 'lead-form'}-phone-error`;

  const emailError = email.trim() && !isValidEmail(email) ? emailInvalidMessage : null;
  const phoneError = phone.trim() && !isValidPhone(phone) ? phoneInvalidMessage : null;
  const contactMethodError = didStart && !email.trim() && !phone.trim() ? contactMethodRequiredMessage : null;
  const validationMessage = emailError ?? phoneError ?? contactMethodError;
  const emailDescribedBy = [contactHelperId, contactMethodError ? contactErrorId : null, emailError ? emailErrorId : null]
    .filter(Boolean)
    .join(' ') || undefined;
  const phoneDescribedBy = [contactHelperId, contactMethodError ? contactErrorId : null, phoneError ? phoneErrorId : null]
    .filter(Boolean)
    .join(' ') || undefined;
  const emailInvalid = Boolean(emailError || contactMethodError);
  const phoneInvalid = Boolean(phoneError || contactMethodError);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!message.trim()) return false;
    if (!email.trim() && !phone.trim()) return false;
    if (email.trim() && !isValidEmail(email)) return false;
    if (phone.trim() && !isValidPhone(phone)) return false;
    if (!consent) return false;
    return status.state !== 'submitting';
  }, [email, message, name, phone, consent, status.state]);

  const handoffSummaryLines = useMemo(() => uniqueLines([
    ...buildLeadHandoffSummary(locale, handoff),
    ...(contextSummary ?? []),
  ]), [contextSummary, handoff, locale]);
  const resolvedProjectId = projectId ?? (handoff?.entityType === 'project' ? handoff.entityId ?? null : null);
  const resolvedAreaId = areaId ?? (handoff?.entityType === 'area' ? handoff.entityId ?? null : null);

  const qualificationPreviewLines = useMemo(() => {
    const previewLines = uniqueLines([
      budgetBand
        ? `${dict.common.leadForm.budgetLabel}: ${findOptionLabel(dict.common.leadForm.budgetOptions, budgetBand) ?? budgetBand}`
        : null,
      purpose
        ? `${dict.common.leadForm.purposeLabel}: ${findOptionLabel(dict.common.leadForm.purposeOptions, purpose) ?? purpose}`
        : null,
      preferredArea.trim() ? `${dict.common.leadForm.preferredAreaLabel}: ${preferredArea.trim()}` : null,
      timeframe
        ? `${dict.common.leadForm.timeframeLabel}: ${findOptionLabel(dict.common.leadForm.timeframeOptions, timeframe) ?? timeframe}`
        : null,
      ...handoffSummaryLines,
    ]);

    return previewLines.length >= 2 ? previewLines.slice(0, 6) : [];
  }, [budgetBand, dict.common.leadForm.budgetLabel, dict.common.leadForm.budgetOptions, dict.common.leadForm.preferredAreaLabel, dict.common.leadForm.purposeLabel, dict.common.leadForm.purposeOptions, dict.common.leadForm.timeframeLabel, dict.common.leadForm.timeframeOptions, handoffSummaryLines, preferredArea, purpose, timeframe]);

  function describeResponseChannel(value: string | undefined): string | null {
    if (!value) return null;
    if (locale === 'th') {
      if (value === 'email_if_connected') return 'ทีมจะเริ่มจากอีเมลก่อนหากช่องทางส่งอัตโนมัติพร้อมใช้งาน';
      if (value === 'email_and_whatsapp_if_connected') return 'ทีมสามารถ follow up ต่อได้ทั้งทางอีเมลและ WhatsApp เมื่อช่องทางส่งอัตโนมัติพร้อมใช้งาน';
      if (value === 'phone_priority_if_connected') return 'ทีมจะให้ความสำคัญกับการโทรหรือ WhatsApp ก่อนเมื่อช่องทางส่งอัตโนมัติพร้อมใช้งาน';
      if (value === 'whatsapp_or_line_if_connected') return 'ทีมจะเริ่มจาก WhatsApp หรือ LINE หากช่องทางส่งอัตโนมัติพร้อมใช้งาน';
      if (value === 'on_page_confirmation') return 'ตอนนี้การยืนยันแรกเกิดขึ้นบนหน้านี้ทันที';
    }
    if (value === 'email_if_connected') return 'The team will start with email when the automated sender is connected.';
    if (value === 'email_and_whatsapp_if_connected') return 'The team can continue on email and WhatsApp when the automated sender is connected.';
    if (value === 'phone_priority_if_connected') return 'The team will prioritize a phone call or WhatsApp when the automated sender is connected.';
    if (value === 'whatsapp_or_line_if_connected') return 'The team will start with WhatsApp or LINE when the automated sender is connected.';
    if (value === 'on_page_confirmation') return 'The first response is confirmed on this page immediately.';
    return value;
  }

  function safeSourcePage(): string | null {
    if (typeof window === 'undefined') return null;
    const url = window.location.href;
    if (url.length <= 500) return url;
    return url.slice(0, 500);
  }

  function buildLeadEventPayload(overrides: LeadAnalyticsOptions = {}) {
    const currentIntent = inquiryIntent?.trim() || purpose || resolvedDefaultPurpose || 'general';

    return buildLeadAnalyticsPayload(locale, handoff, {
      sourceRoute: resolvedSourceRoute,
      propertyId: propertyId ?? undefined,
      leadSource: resolvedInquirySource,
      budgetRange: budgetBand || undefined,
      purpose: purpose || resolvedDefaultPurpose || undefined,
      timeframe: timeframe || undefined,
      preferredArea: preferredArea.trim() || undefined,
      inquiryIntent: currentIntent,
      hasEmail: Boolean(email.trim()),
      hasPhone: Boolean(phone.trim()),
      ...overrides,
    });
  }

  function buildSuccessActions(): Array<{ href: string; label: string; external?: boolean; primary?: boolean }> {
    const normalizedPurpose = (purpose || inquiryIntent || '').trim().toLowerCase();
    const browseHref = withLocale(locale, normalizedPurpose === 'rent' ? '/rent' : '/buy');
    const browseLabel =
      locale === 'th'
        ? normalizedPurpose === 'rent'
          ? 'ดูรายการเช่าสำหรับขั้นตอนถัดไป'
          : 'ดูตัวเลือกที่เหมาะต่อ'
        : normalizedPurpose === 'rent'
          ? 'Browse rental options'
          : 'Browse matching listings';

    return [
      { href: browseHref, label: browseLabel, primary: true },
      {
        href: withLocale(locale, '/shortlist'),
        label: locale === 'th' ? 'เปิดรายการคัดไว้ของคุณ' : 'Open your shortlist',
      },
      {
        href: CTA.whatsAppUrl,
        label: locale === 'th' ? 'คุยต่อทาง WhatsApp' : 'Continue on WhatsApp',
        external: true,
      },
    ];
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

    if (validationMessage) {
      setStatus({ state: 'error', message: validationMessage });
      return;
    }

    const submitIso = new Date().toISOString();
    const effectiveInquiryIntent = inquiryIntent?.trim() || purpose || resolvedDefaultPurpose || 'general';

    const leadScore = calculateLeadScore({
      name,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      message,
      propertyId: propertyId ?? undefined,
      budgetBand: budgetBand || undefined,
      purpose: purpose || resolvedDefaultPurpose || undefined,
      timeframe: timeframe || undefined,
      preferredArea: preferredArea.trim() || undefined,
      inquiryIntent: effectiveInquiryIntent,
    });

    const leadEventPayload = buildLeadEventPayload({
      leadTier: leadScore.tier,
      leadScore: leadScore.total,
    });
    const sessionId = getOrCreateSessionId();

    void trackEvent('form_submit', pathname, leadEventPayload);
    const submitEvent = await trackEvent('submit_lead', pathname, leadEventPayload);

    setStatus({ state: 'submitting' });

    const briefLines = [
      budgetBand ? `${dict.common.leadForm.budgetLabel}: ${dict.common.leadForm.budgetOptions.find((item) => item.value === budgetBand)?.label ?? budgetBand}` : null,
      purpose ? `${dict.common.leadForm.purposeLabel}: ${dict.common.leadForm.purposeOptions.find((item) => item.value === purpose)?.label ?? purpose}` : null,
      preferredArea.trim() ? `${dict.common.leadForm.preferredAreaLabel}: ${preferredArea.trim()}` : null,
      timeframe ? `${dict.common.leadForm.timeframeLabel}: ${dict.common.leadForm.timeframeOptions.find((item) => item.value === timeframe)?.label ?? timeframe}` : null,
    ].filter((item): item is string => Boolean(item));

    const handoffBlock = handoffSummaryLines.length
      ? `${locale === 'th' ? 'บริบทที่ส่งต่อ' : 'Lead context'}:\n${handoffSummaryLines.join('\n')}`
      : null;

    const composedSections = [
      message.trim(),
      handoffBlock,
      briefLines.length ? `${dict.common.leadForm.detailsHeading}:\n${briefLines.join('\n')}` : null,
    ].filter((item): item is string => Boolean(item));
    const composedMessage = composedSections.join('\n\n');

    const normalizedPreferredArea = normalizeTagToken(preferredArea);
    const normalizedContextTags = (inquiryTags ?? []).map((item) => item.trim()).filter(Boolean);
    const normalizedHandoffTags = buildLeadHandoffTags(
      handoff
        ? {
            ...handoff,
            budgetRange: handoff.budgetRange ?? (budgetBand || undefined),
            location: handoff.location ?? (preferredArea.trim() || undefined),
          }
        : undefined,
    );
    const dedupedInquiryTags = Array.from(new Set([
      normalizedPreferredArea ? `preferred_area:${normalizedPreferredArea}` : null,
      purpose ? `purpose:${normalizeTagToken(purpose)}` : null,
      effectiveInquiryIntent ? `intent:${normalizeTagToken(effectiveInquiryIntent)}` : null,
      resolvedInquirySource ? `lead_source:${normalizeTagToken(resolvedInquirySource)}` : null,
      `lead_tier:${leadScore.tier}`,
      ...normalizedHandoffTags,
      ...normalizedContextTags,
    ].filter((item): item is string => Boolean(item))));

    try {
      const res = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Core 5 data fields (PDPA/GDPR minimization)
          name,
          email: email.trim() || null,
          phone: phone.trim() || null,
          message: composedMessage,
          consent_given: true,
          intent: effectiveInquiryIntent,
          budget_range: budgetBand || null,
          nationality: nationality.trim() || null,
          timeline: timeframe || null,
          // Operational metadata (not user PII)
          property_id: propertyId ?? null,
          project_id: resolvedProjectId ?? null,
          area_id: resolvedAreaId ?? null,
          source_page: safeSourcePage(),
          session_id: sessionId,
          last_action: submitEvent?.event_name ?? 'submit_lead',
          last_event_id: submitEvent?.event_id ?? null,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
          device: inferDeviceType(typeof window !== 'undefined' ? window.innerWidth : null),
          website: website.trim() || null,
          submit_timestamp: submitIso,
          locale,
          source_platform: 'website',
          tags: dedupedInquiryTags,
          // Lead quality score (0–100 + tier)
          lead_score: leadScore.total,
          lead_tier: leadScore.tier,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(formatApiError(text) || `HTTP ${res.status}`);
      }

      let parsed: InquirySuccessPayload | null = null;
      try {
        parsed = JSON.parse(text) as InquirySuccessPayload;
      } catch {
        // ignore
      }

      setStatus({
        state: 'success',
        id: parsed?.id,
        confirmationTitle: parsed?.sales_automation?.confirmation_title,
        confirmationBody: parsed?.sales_automation?.confirmation_body,
        autoResponseMessage: parsed?.sales_automation?.auto_response_message,
        responseChannel: parsed?.sales_automation?.response_channel,
        responseSlaSeconds: parsed?.sales_automation?.response_sla_seconds,
      });
      trackEvent('form_success', pathname, buildLeadEventPayload({
        leadTier: leadScore.tier,
        leadScore: leadScore.total,
        responseChannel: parsed?.sales_automation?.response_channel,
        responseSlaSeconds: parsed?.sales_automation?.response_sla_seconds,
      }));
      // Attribute conversion to active experiments
      trackExperimentOutcomes('form_submit', 1, (eventType, page, payload) => {
        void trackEvent(eventType, page, payload);
      }, pathname);
    } catch (err) {
      trackEvent('form_error', pathname, buildLeadEventPayload({
        leadTier: leadScore.tier,
        leadScore: leadScore.total,
        errorMessage: err instanceof Error ? err.message : 'Failed',
      }));
      setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : dict.errors.failedToSubmit,
      });
    }
  }

  const successActions = buildSuccessActions();

  return (
    <form
      id={formId}
      className="inquiry-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <h3 className="type-h3">{heading ?? dict.common.leadForm.headingDefault}</h3>
      <p className="form-desc">{description ?? dict.common.leadForm.description}</p>

      {qualificationPreviewLines.length ? (
        <div className="form-note-box mb-4" aria-label="lead-form-qualification-preview">
          <p className="form-note-box__title type-small">{dict.common.leadForm.detailsHeading}</p>
          <p className="form-note-box__copy">{qualificationPreviewBody}</p>
          <div className="insight-list mt-1">
            {qualificationPreviewLines.map((line) => (
              <div key={line} className="insight-list__item">
                <span className="insight-list__body">{line}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className="form-grid"
        onFocusCapture={() => {
          if (didStart) return;
          setDidStart(true);
          trackEvent('form_start', pathname, buildLeadEventPayload());
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

        <FieldShell
          label={dict.common.leadForm.namePlaceholder}
          labelFor="lead-name"
          requiredMark={requiredText}
        >
          <InputBase
            id="lead-name"
            name="name"
            placeholder={dict.common.leadForm.namePlaceholder}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FieldShell>
        <div>
          <p id={contactHelperId} className="form-helper form-helper--muted">{contactMethodHelper}</p>
          {contactMethodError ? (
            <p id={contactErrorId} className="form-error mt-2" role="alert">
              {contactMethodError}
            </p>
          ) : null}
        </div>
        <div className="form-grid-2">
          <FieldShell
            error={emailError}
            errorId={emailErrorId}
            label={dict.common.leadForm.emailPlaceholder}
            labelFor="lead-email"
          >
            <InputBase
              id="lead-email"
              name="email"
              type="email"
              placeholder={dict.common.leadForm.emailPlaceholder}
              aria-invalid={emailInvalid ? 'true' : 'false'}
              aria-describedby={emailDescribedBy}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FieldShell>
          <FieldShell
            error={phoneError}
            errorId={phoneErrorId}
            label={dict.common.leadForm.phonePlaceholder}
            labelFor="lead-phone"
          >
            <InputBase
              id="lead-phone"
              name="phone"
              type="tel"
              placeholder={dict.common.leadForm.phonePlaceholder}
              aria-invalid={phoneInvalid ? 'true' : 'false'}
              aria-describedby={phoneDescribedBy}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FieldShell>
        </div>
        <FieldShell label={nationalityLabel} labelFor="lead-nationality">
          <InputBase
            id="lead-nationality"
            name="nationality"
            placeholder={nationalityPlaceholder}
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          />
        </FieldShell>
        {isCompact ? (
          <FieldShell label={dict.common.leadForm.purposeLabel} labelFor="lead-purpose">
            <SelectBase
              id="lead-purpose"
              name="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="">{dict.common.leadForm.purposePlaceholder}</option>
              {dict.common.leadForm.purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectBase>
          </FieldShell>
        ) : (
          <>
            <div className="form-grid-2">
              <FieldShell label={dict.common.leadForm.budgetLabel} labelFor="lead-budget">
                <SelectBase
                  id="lead-budget"
                  name="budget"
                  value={budgetBand}
                  onChange={(e) => setBudgetBand(e.target.value)}
                >
                  <option value="">{dict.common.leadForm.budgetPlaceholder}</option>
                  {dict.common.leadForm.budgetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectBase>
              </FieldShell>
              <FieldShell label={dict.common.leadForm.purposeLabel} labelFor="lead-purpose">
                <SelectBase
                  id="lead-purpose"
                  name="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option value="">{dict.common.leadForm.purposePlaceholder}</option>
                  {dict.common.leadForm.purposeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectBase>
              </FieldShell>
            </div>
            <div className="form-grid-2">
              <FieldShell label={dict.common.leadForm.preferredAreaLabel} labelFor="lead-preferred-area">
                <InputBase
                  id="lead-preferred-area"
                  name="preferred_area"
                  placeholder={dict.common.leadForm.preferredAreaPlaceholder}
                  value={preferredArea}
                  onChange={(e) => setPreferredArea(e.target.value)}
                />
              </FieldShell>
              <FieldShell label={dict.common.leadForm.timeframeLabel} labelFor="lead-timeframe">
                <SelectBase
                  id="lead-timeframe"
                  name="timeframe"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option value="">{dict.common.leadForm.timeframePlaceholder}</option>
                  {dict.common.leadForm.timeframeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectBase>
              </FieldShell>
            </div>
          </>
        )}
        <FieldShell
          label={dict.common.leadForm.messagePlaceholder}
          labelFor="lead-message"
          requiredMark={requiredText}
        >
          <TextAreaBase
            id="lead-message"
            name="message"
            placeholder={dict.common.leadForm.messagePlaceholder}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </FieldShell>

        <label className="form-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <span className="form-consent__text">
            {dict.common.leadForm.consentText ?? 'I agree to the processing of my personal data in accordance with the Privacy Policy (PDPA/GDPR).'}{' '}
            <span className="text-gray-500">{requiredText}</span>
          </span>
        </label>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!canSubmit}
          aria-describedby="lead-form-status"
        >
          {status.state === 'submitting' ? dict.common.leadForm.submitting : (submitLabel ?? dict.common.leadForm.submit)}
        </Button>

        <div className="mt-4 border-t border-gray-200 pt-4" aria-label="lead-form-support-links">
          <p className="lead-form__support-copy mb-2">
            {locale === 'th'
              ? 'ถ้าคุณอยากคุยก่อน ติดต่อเราได้ทาง WhatsApp หรือ LINE'
              : 'Prefer to talk first? Reach us on WhatsApp or LINE.'}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              className="font-medium text-gray-700 underline-offset-4 hover:text-gray-900 hover:underline lead-form__support-link"
              href={CTA.whatsAppUrl}
              target="_blank"
              rel="noreferrer"
            >
              {dict.cta.whatsapp}
            </a>
            <a
              className="font-medium text-gray-700 underline-offset-4 hover:text-gray-900 hover:underline lead-form__support-link"
              href={CTA.lineUrl}
              target="_blank"
              rel="noreferrer"
            >
              {dict.cta.line}
            </a>
          </div>
        </div>

        <div id="lead-form-status" aria-live="assertive" aria-atomic="true">
          {status.state === 'success' ? (
            <div className="form-success" role="status">
              <p><strong>{status.confirmationTitle ?? dict.common.leadForm.success}</strong>{status.id ? ` (id: ${status.id})` : ''}</p>
              {status.confirmationBody ? <p>{status.confirmationBody}</p> : null}
              {status.autoResponseMessage ? <p>{status.autoResponseMessage}</p> : null}
              {status.responseSlaSeconds ? (
                <p>
                  {locale === 'th'
                    ? `ระบบยืนยันคำขอนี้ภายใน ${status.responseSlaSeconds} วินาทีตาม SLA ของ sales layer`
                    : `This request was confirmed within the ${status.responseSlaSeconds}-second sales-layer SLA.`}
                </p>
              ) : null}
              {describeResponseChannel(status.responseChannel) ? <p>{describeResponseChannel(status.responseChannel)}</p> : null}
              <CTAGroup className="mt-4" aria-label="lead-success-actions">
                {successActions.map((action) => {
                  if (action.external) {
                    return (
                      <Button
                        key={action.label}
                        external
                        href={action.href}
                        rel="noreferrer"
                        target="_blank"
                        variant={action.primary ? 'primary' : 'secondary'}
                      >
                        {action.label}
                      </Button>
                    );
                  }

                  return (
                    <Button key={action.label} href={action.href} variant={action.primary ? 'primary' : 'secondary'}>
                      {action.label}
                    </Button>
                  );
                })}
              </CTAGroup>
            </div>
          ) : null}

          {status.state === 'error' ? (
            <p className="form-error" role="alert">{dict.common.leadForm.errorPrefix} {status.message}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
