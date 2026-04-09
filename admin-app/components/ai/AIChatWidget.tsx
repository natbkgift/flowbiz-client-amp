'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { buildWhatsAppUrl, shouldRenderStickyMobileCta } from '@/app/_lib/public-cta';
import { getOrCreateSessionId, trackEvent } from '@/lib/analytics';
import { inferDeviceType } from '@/lib/conversion';
import { SHORTLIST_UPDATED_EVENT, readCachedShortlist } from '@/lib/shortlist';

import {
  buildAiRuntimeContext,
  isUuidLike,
  quickRepliesForQuestion,
  readAiPageMarker,
  type AIChatResponse,
  type AILeadProfile,
  type AISessionMemory,
  type AIWidgetMessage,
} from './ai-runtime';
import {
  emptyAiSessionMemory,
  hydrateAiPersistedSession,
  markAiConversationOutcome,
  readAiPersistedSession,
  rememberAiAction,
  rememberAiResponse,
  writeAiPersistedSession,
} from './ai-session-memory';

type AIFunnelEvent = 'ai_chat_open' | 'ai_chat_message' | 'ai_recommendation_view' | 'ai_handoff_prompt';

type LeadCaptureState = {
  name: string;
  email: string;
  phone: string;
  nationality: string;
};

const COPY = {
  en: {
    fabLabel: 'Ask AMP AI',
    leadHeading: 'Book viewing or get advisor follow-up',
    leadBody: 'Leave a name and one contact route. The AI summary goes into the existing inquiry workflow.',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    nationality: 'Nationality',
    namePlaceholder: 'Your name',
    emailPlaceholder: 'Email',
    phonePlaceholder: 'Phone or WhatsApp number',
    nationalityPlaceholder: 'e.g. Thai, British, Chinese',
    send: 'Send',
    sending: 'Sending',
    ask: 'Ask',
    thinking: 'Thinking',
    nextSteps: 'Suggested next steps',
    shortlist: 'Recommended now',
    openChat: 'Open AI sales chat',
    closeChat: 'Close AI sales chat',
    bookViewing: 'Book viewing',
    talkWhatsApp: 'Continue on WhatsApp',
    captureLead: 'Send to advisor',
    contactNotice: 'Name plus one contact route is required.',
    submitSuccess: 'Lead created. Follow-up is already queued for the sales team.',
    submitError: 'Unable to create the lead right now. Try WhatsApp or send again.',
    chatError: 'AI chat is unavailable right now. Use WhatsApp or try again.',
    assistant: 'AMP AI',
    highIntent: 'High-intent lead detected',
  },
  th: {
    fabLabel: 'คุยกับ AMP AI',
    leadHeading: 'นัดดูหรือต่อให้ advisor',
    leadBody: 'ทิ้งชื่อและช่องทางติดต่อไว้หนึ่งช่องทาง ระบบจะส่ง AI summary เข้า inquiry เดิมทันที',
    name: 'ชื่อ',
    email: 'อีเมล',
    phone: 'โทรศัพท์',
    nationality: 'สัญชาติ',
    namePlaceholder: 'ชื่อของคุณ',
    emailPlaceholder: 'อีเมล',
    phonePlaceholder: 'เบอร์โทรหรือ WhatsApp',
    nationalityPlaceholder: 'เช่น ไทย อังกฤษ จีน',
    send: 'ส่ง',
    sending: 'กำลังส่ง',
    ask: 'ถาม',
    thinking: 'กำลังคิด',
    nextSteps: 'ทางเลือกถัดไป',
    shortlist: 'ตัวเลือกที่ควรดูต่อ',
    openChat: 'เปิด AI sales chat',
    closeChat: 'ปิด AI sales chat',
    bookViewing: 'นัดดู',
    talkWhatsApp: 'คุยต่อทาง WhatsApp',
    captureLead: 'ส่งต่อให้ advisor',
    contactNotice: 'ต้องมีชื่อและช่องทางติดต่ออย่างน้อยหนึ่งช่องทาง',
    submitSuccess: 'สร้าง lead แล้ว และ follow-up ถูกเข้าคิวให้ทีมขายเรียบร้อย',
    submitError: 'ยังสร้าง lead ไม่สำเร็จ ลองใหม่หรือคุยต่อทาง WhatsApp',
    chatError: 'AI chat ใช้งานไม่ได้ชั่วคราว ลองใหม่หรือใช้ WhatsApp แทน',
    assistant: 'AMP AI',
    highIntent: 'พบสัญญาณ lead ร้อนแรง',
  },
} as const;

function normalizeText(value: string | null | undefined): string | null {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function buildLeadScore(response: AIChatResponse | null): number {
  if (response?.conversion_signal.tier === 'hot') return 92;
  if (response?.conversion_signal.tier === 'warm') return 78;
  return 58;
}

function buildAiInquiryMessage(
  locale: 'en' | 'th',
  sourcePage: string,
  messages: AIWidgetMessage[],
  response: AIChatResponse | null,
  leadProfile: AILeadProfile,
): string {
  const recentUserMessages = messages
    .filter((message) => message.role === 'user')
    .slice(-3)
    .map((message) => message.content.trim())
    .filter(Boolean);
  const recommendationLines = response?.recommendation_preview?.items?.slice(0, 3).map((item, index) => {
    const parts = [item.title, item.project, item.price_text, item.href].filter(Boolean);
    return `${index + 1}. ${parts.join(' — ')}`;
  }) ?? [];

  const summaryLines = [
    locale === 'th' ? 'AI qualification summary' : 'AI qualification summary',
    `${locale === 'th' ? 'หน้า' : 'Surface'}: ${sourcePage}`,
    response?.handoff_preview?.recommended_intent
      ? `${locale === 'th' ? 'Intent' : 'Intent'}: ${response.handoff_preview.recommended_intent}`
      : null,
    leadProfile.buyer_type
      ? `${locale === 'th' ? 'Buyer fit' : 'Buyer fit'}: ${leadProfile.buyer_type}`
      : null,
    leadProfile.budget_range
      ? `${locale === 'th' ? 'Budget' : 'Budget'}: ${leadProfile.budget_range}`
      : null,
    leadProfile.timeframe
      ? `${locale === 'th' ? 'Timeline' : 'Timeline'}: ${leadProfile.timeframe}`
      : null,
    leadProfile.preferred_area
      ? `${locale === 'th' ? 'Area' : 'Area'}: ${leadProfile.preferred_area}`
      : null,
    leadProfile.property_type
      ? `${locale === 'th' ? 'Property type' : 'Property type'}: ${leadProfile.property_type}`
      : null,
    response?.conversion_signal?.summary
      ? `${locale === 'th' ? 'Signal' : 'Signal'}: ${response.conversion_signal.summary}`
      : null,
  ].filter((item): item is string => Boolean(item));

  const sections = [
    recentUserMessages.length
      ? `${locale === 'th' ? 'Recent buyer brief' : 'Recent buyer brief'}:\n${recentUserMessages.join('\n')}`
      : null,
    response?.handoff_preview?.summary_lines?.length
      ? `${locale === 'th' ? 'Handoff context' : 'Handoff context'}:\n${response.handoff_preview.summary_lines.join('\n')}`
      : null,
    summaryLines.join('\n'),
    recommendationLines.length
      ? `${locale === 'th' ? 'Recommended properties' : 'Recommended properties'}:\n${recommendationLines.join('\n')}`
      : null,
  ].filter((item): item is string => Boolean(item));

  return sections.join('\n\n');
}

function buildInquiryTags(response: AIChatResponse | null, sourceRoute: string): string[] {
  const recommendationTags = response?.recommendation_preview?.items?.slice(0, 3).map((item) => `recommended_property:${item.slug}`) ?? [];
  return Array.from(
    new Set([
      'lead_source:ai_widget',
      `source_route:${sourceRoute}`,
      ...(response?.handoff_preview?.tags ?? []),
      ...(response?.conversion_signal?.signals ?? []).map((signal) => `ai_signal:${signal}`),
      ...(response?.conversion_signal?.tier ? [`lead_tier:${response.conversion_signal.tier}`] : []),
      ...recommendationTags,
    ]),
  );
}

export function AIChatWidget() {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.toString() ?? '';
  const analyticsSessionId = useMemo(() => getOrCreateSessionId(), []);
  const [shortlistTick, setShortlistTick] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIWidgetMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [leadProfile, setLeadProfile] = useState<AILeadProfile>({});
  const [sessionMemory, setSessionMemory] = useState<AISessionMemory>(emptyAiSessionMemory());
  const [lastResponse, setLastResponse] = useState<AIChatResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [capture, setCapture] = useState<LeadCaptureState>({
    name: '',
    email: '',
    phone: '',
    nationality: '',
  });
  const trackedResponseKeyRef = useRef<string | null>(null);
  const trackedHandoffKeyRef = useRef<string | null>(null);

  const runtimeContext = useMemo(() => {
    void shortlistTick;
    const search = searchQuery ? `?${searchQuery}` : '';
    const marker = typeof document !== 'undefined' ? readAiPageMarker(document) : null;
    const shortlist = readCachedShortlist();
    return buildAiRuntimeContext(pathname, search, marker, shortlist);
  }, [pathname, searchQuery, shortlistTick]);
  const copy = COPY[runtimeContext.locale];
  const stickyTrayVisible = shouldRenderStickyMobileCta(pathname);
  const quickReplies = quickRepliesForQuestion(
    runtimeContext.locale,
    lastResponse?.next_question_key,
    runtimeContext.quickReplies,
  ).slice(0, 3);

  function applyPersistedSession(nextSession: { ai_session_id: string | null; memory: AISessionMemory }, nextLeadProfile?: AILeadProfile) {
    writeAiPersistedSession(analyticsSessionId, runtimeContext.locale, nextSession);
    setSessionId(nextSession.ai_session_id);
    setSessionMemory(nextSession.memory);
    setLeadProfile(nextLeadProfile ?? nextSession.memory.lead_profile ?? {});
  }

  function currentPersistedSession() {
    return {
      ai_session_id: sessionId,
      memory: sessionMemory,
    };
  }

  async function trackAiFunnelEvent(
    eventType: AIFunnelEvent,
    extraPayload?: Record<string, unknown>,
    overrideAiSessionId?: string | null,
  ) {
    const extraContext = typeof extraPayload?.context === 'object' && extraPayload?.context
      ? extraPayload.context as Record<string, unknown>
      : {};
    const payload = { ...(extraPayload ?? {}) };
    delete payload.context;

    return trackEvent(eventType, pathname, {
      source_route: runtimeContext.pageContext.source_route,
      entity_type: runtimeContext.pageContext.entity_type ?? undefined,
      entity_id: runtimeContext.pageContext.entity_id ?? undefined,
      user_intent: leadProfile.intent ?? undefined,
      locale: runtimeContext.locale,
      context: {
        ai_session_id: overrideAiSessionId ?? sessionId ?? undefined,
        analytics_session_id: analyticsSessionId,
        ai_page_type: runtimeContext.pageContext.page_type,
        ai_entity_slug: runtimeContext.pageContext.entity_slug ?? null,
        ai_message_count: sessionMemory.message_count,
        ai_conversation_outcome: sessionMemory.conversation_outcome ?? null,
        ai_last_recommendation_slugs: sessionMemory.last_recommendation_slugs,
        ...extraContext,
      },
      ...payload,
    });
  }

  useEffect(() => {
    const persisted = hydrateAiPersistedSession(
      readAiPersistedSession(analyticsSessionId, runtimeContext.locale),
      runtimeContext,
    );
    writeAiPersistedSession(analyticsSessionId, runtimeContext.locale, persisted);
    setMessages([{ id: `intro-${runtimeContext.pageContext.source_page}`, role: 'assistant', content: runtimeContext.intro }]);
    setInput('');
    setSessionId(persisted.ai_session_id);
    setLeadProfile(persisted.memory.lead_profile ?? {});
    setSessionMemory(persisted.memory);
    setLastResponse(null);
    setSubmitState('idle');
    setSubmitNotice(null);
    setShowLeadCapture(false);
    setCapture({
      name: '',
      email: '',
      phone: '',
      nationality: String(persisted.memory.lead_profile.nationality ?? ''),
    });
    trackedResponseKeyRef.current = null;
    trackedHandoffKeyRef.current = null;
  }, [analyticsSessionId, runtimeContext]);

  useEffect(() => {
    const onShortlistUpdated = () => {
      setShortlistTick((value) => value + 1);
      const nextSession = rememberAiAction(
        {
          ai_session_id: sessionId,
          memory: sessionMemory,
        },
        runtimeContext,
        'shortlist_add',
      );
      writeAiPersistedSession(analyticsSessionId, runtimeContext.locale, nextSession);
      setSessionId(nextSession.ai_session_id);
      setSessionMemory(nextSession.memory);
      setLeadProfile(leadProfile);
    };
    window.addEventListener(SHORTLIST_UPDATED_EVENT, onShortlistUpdated);
    return () => window.removeEventListener(SHORTLIST_UPDATED_EVENT, onShortlistUpdated);
  }, [analyticsSessionId, leadProfile, runtimeContext, sessionId, sessionMemory]);

  function toggleOpen() {
    setIsOpen((value) => {
      const nextValue = !value;
      if (nextValue) {
        const nextSession = rememberAiAction(currentPersistedSession(), runtimeContext, 'ai_chat_open');
        applyPersistedSession(nextSession, leadProfile);
        void trackAiFunnelEvent('ai_chat_open', {
          context: {
            trigger: 'widget_open',
          },
        });
      }
      return nextValue;
    });
  }

  function updateCaptureField(field: keyof LeadCaptureState, value: string) {
    setCapture((current) => ({ ...current, [field]: value }));
  }

  async function sendMessage(messageText: string) {
    const normalizedMessage = normalizeText(messageText);
    if (!normalizedMessage || isSending) return;

    const nextUserMessage: AIWidgetMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: normalizedMessage,
    };

    const history = messages.slice(-10).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((current) => [...current, nextUserMessage]);
    setInput('');
    setIsSending(true);
    setSubmitNotice(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          locale: runtimeContext.locale,
          page_context: runtimeContext.pageContext,
          lead_profile: leadProfile,
          session_memory: sessionMemory,
          message: normalizedMessage,
          history,
        }),
      });
      if (!response.ok) {
        throw new Error(`chat_failed:${response.status}`);
      }

      const payload = await response.json() as AIChatResponse;
      const nextSession = rememberAiResponse(currentPersistedSession(), runtimeContext, payload);
      applyPersistedSession(nextSession, payload.lead_profile ?? {});
      setLastResponse(payload);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: payload.reply,
        },
      ]);
      setCapture((current) => ({
        ...current,
        email: current.email || String(payload.lead_profile?.email ?? ''),
        phone: current.phone || String(payload.lead_profile?.phone ?? ''),
        nationality: current.nationality || String(payload.lead_profile?.nationality ?? ''),
      }));

      void trackAiFunnelEvent(
        'ai_chat_message',
        {
          next_question_key: payload.next_question_key ?? null,
          captured_fields: payload.captured_fields,
          has_recommendations: Boolean(payload.recommendation_preview?.items?.length),
          ai_status: payload.status,
          context: {
            ai_reply_status: payload.status,
          },
        },
        payload.session_id,
      );

      if (payload.recommendation_preview?.items?.length) {
        const recommendationKey = [payload.session_id, ...payload.recommendation_preview.items.map((item) => item.slug)].join(':');
        if (trackedResponseKeyRef.current !== recommendationKey) {
          trackedResponseKeyRef.current = recommendationKey;
          void trackAiFunnelEvent(
            'ai_recommendation_view',
            {
              recommendation_count: payload.recommendation_preview.items.length,
              recommendation_slugs: payload.recommendation_preview.items.map((item) => item.slug),
            },
            payload.session_id,
          );
        }
      }

      if (payload.conversion_signal?.should_prompt_contact_capture) {
        setShowLeadCapture(true);
        const handoffSession = rememberAiAction(nextSession, runtimeContext, 'ai_handoff_prompt');
        applyPersistedSession(handoffSession, payload.lead_profile ?? {});
        const handoffKey = `${payload.session_id}:prompt`;
        if (trackedHandoffKeyRef.current !== handoffKey) {
          trackedHandoffKeyRef.current = handoffKey;
          void trackAiFunnelEvent(
            'ai_handoff_prompt',
            {
              ai_conversion_tier: payload.conversion_signal?.tier ?? null,
            },
            payload.session_id,
          );
        }
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: copy.chatError,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function submitLead() {
    const name = normalizeText(capture.name);
    const email = normalizeText(capture.email);
    const phone = normalizeText(capture.phone);
    const nationality = normalizeText(capture.nationality) ?? normalizeText(leadProfile.nationality);

    if (!name || (!email && !phone)) {
      setSubmitState('error');
      setSubmitNotice(copy.contactNotice);
      return;
    }

    setSubmitState('submitting');
    setSubmitNotice(null);

    try {
      const receipt = await trackEvent('submit_lead', pathname, {
        source_route: runtimeContext.pageContext.source_route,
        entity_type: runtimeContext.pageContext.entity_type ?? undefined,
        entity_id: runtimeContext.pageContext.entity_id ?? undefined,
        user_intent: lastResponse?.handoff_preview?.recommended_intent ?? leadProfile.intent ?? undefined,
        context: {
          ai_session_id: sessionId ?? getOrCreateSessionId(),
          ai_page_type: runtimeContext.pageContext.page_type,
          ai_conversion_tier: lastResponse?.conversion_signal?.tier ?? null,
          ai_signals: lastResponse?.conversion_signal?.signals ?? [],
        },
      });

      const inquiryResponse = await fetch('/api/v1/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          nationality,
          message: buildAiInquiryMessage(
            runtimeContext.locale,
            runtimeContext.pageContext.source_page,
            messages,
            lastResponse,
            leadProfile,
          ),
          intent: lastResponse?.handoff_preview?.recommended_intent ?? leadProfile.intent ?? 'general',
          budget_range: normalizeText(leadProfile.budget_range),
          timeline: normalizeText(leadProfile.timeframe),
          property_id: isUuidLike(runtimeContext.crmContext.propertyId)
            ? runtimeContext.crmContext.propertyId
            : null,
          project_id: isUuidLike(runtimeContext.crmContext.projectId)
            ? runtimeContext.crmContext.projectId
            : null,
          area_id: isUuidLike(runtimeContext.crmContext.areaId)
            ? runtimeContext.crmContext.areaId
            : null,
          source_page: runtimeContext.pageContext.source_page,
          session_id: sessionId,
          last_action: receipt?.event_name ?? 'submit_lead',
          last_event_id: receipt?.event_id ?? null,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
          device: inferDeviceType(typeof window !== 'undefined' ? window.innerWidth : null),
          locale: runtimeContext.locale,
          persona: normalizeText(leadProfile.buyer_type),
          lead_score: buildLeadScore(lastResponse),
          tags: buildInquiryTags(lastResponse, runtimeContext.pageContext.source_route),
        }),
      });
      if (!inquiryResponse.ok) {
        throw new Error(`inquiry_failed:${inquiryResponse.status}`);
      }

      const inquiryPayload = await inquiryResponse.json() as {
        sales_automation?: {
          confirmation_title?: string;
          confirmation_body?: string;
        };
      };
      const confirmation = inquiryPayload.sales_automation?.confirmation_body ?? copy.submitSuccess;
      const convertedSession = markAiConversationOutcome(currentPersistedSession(), 'converted');

      setSubmitState('success');
      setSubmitNotice(confirmation);
      setShowLeadCapture(true);
      applyPersistedSession(convertedSession, leadProfile);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-success-${Date.now()}`,
          role: 'assistant',
          content: confirmation,
        },
      ]);
    } catch {
      setSubmitState('error');
      setSubmitNotice(copy.submitError);
    }
  }

  return (
    <div className={`ai-widget-shell${stickyTrayVisible ? ' ai-widget-shell--raised' : ''}`}>
      {isOpen ? (
        <section className="ai-widget-panel" aria-label={copy.fabLabel}>
          <header className="ai-widget-panel__header">
            <div>
              <p className="ai-widget-panel__eyebrow">{copy.assistant}</p>
              <h2 className="ai-widget-panel__title">{runtimeContext.subtitle}</h2>
            </div>
            <button
              type="button"
              className="ai-widget-panel__close"
              aria-label={copy.closeChat}
              onClick={toggleOpen}
            >
              ×
            </button>
          </header>

          <div className="ai-widget-panel__body">
            <div className="ai-widget-thread" aria-live="polite">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`ai-widget-message ai-widget-message--${message.role}`}
                >
                  <p>{message.content}</p>
                </article>
              ))}
              {isSending ? (
                <article className="ai-widget-message ai-widget-message--assistant ai-widget-message--pending">
                  <p>{copy.thinking}…</p>
                </article>
              ) : null}
            </div>

            <div className="ai-widget-chip-row" role="group" aria-label={copy.nextSteps}>
              {quickReplies.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="ai-widget-chip"
                  onClick={() => void sendMessage(item)}
                  disabled={isSending}
                >
                  {item}
                </button>
              ))}
            </div>

            {lastResponse?.suggested_actions?.length ? (
              <div className="ai-widget-actions">
                <p className="ai-widget-actions__label">{copy.nextSteps}</p>
                <div className="ai-widget-actions__row">
                  {lastResponse.suggested_actions.slice(0, 3).map((action) => (
                    action.href ? (
                      <a key={`${action.type}-${action.href}`} className="btn btn-secondary" href={action.href}>
                        {action.label}
                      </a>
                    ) : (
                      <button
                        key={`${action.type}-${action.label}`}
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          if (action.type === 'handoff') {
                            const nextSession = rememberAiAction(currentPersistedSession(), runtimeContext, 'ai_handoff_prompt');
                            applyPersistedSession(nextSession, leadProfile);
                            setShowLeadCapture(true);
                            void trackAiFunnelEvent('ai_handoff_prompt', {
                              ai_conversion_tier: lastResponse?.conversion_signal?.tier ?? null,
                            });
                          }
                        }}
                      >
                        {action.label}
                      </button>
                    )
                  ))}
                </div>
              </div>
            ) : null}

            {lastResponse?.recommendation_preview?.items?.length ? (
              <div className="ai-widget-recommendations">
                <p className="ai-widget-actions__label">{copy.shortlist}</p>
                <div className="ai-widget-recommendations__list">
                  {lastResponse.recommendation_preview.items.slice(0, 3).map((item) => (
                    <a key={item.slug} className="ai-widget-recommendations__card" href={item.href}>
                      <strong>{item.title}</strong>
                      <span>{[item.project, item.price_text].filter(Boolean).join(' · ')}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {(showLeadCapture || lastResponse?.conversion_signal?.should_prompt_contact_capture) ? (
              <div className="ai-widget-lead-card">
                {lastResponse?.conversion_signal?.is_high_intent ? (
                  <p className="ai-widget-lead-card__flag">{copy.highIntent}</p>
                ) : null}
                <h3>{copy.leadHeading}</h3>
                <p>{copy.leadBody}</p>
                <div className="ai-widget-lead-card__actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void submitLead()}
                    disabled={submitState === 'submitting'}
                  >
                    {submitState === 'submitting'
                      ? copy.sending
                      : (lastResponse?.conversion_signal?.is_high_intent ? copy.bookViewing : copy.captureLead)}
                  </button>
                  <a className="btn btn-secondary" href={lastResponse?.conversion_signal?.is_high_intent
                    ? buildWhatsAppUrl(
                        runtimeContext.locale === 'th'
                          ? `สวัสดี AMP Pattaya ผมต้องการนัดดู ${runtimeContext.pageContext.entity_name ?? 'รายการนี้'} และคุยต่อจาก AI brief`
                          : `Hi AMP Pattaya, I want to book a viewing for ${runtimeContext.pageContext.entity_name ?? 'this option'} and continue from the AI brief.`,
                      )
                    : runtimeContext.whatsAppMessage}
                  target="_blank"
                  rel="noreferrer">
                    {copy.talkWhatsApp}
                  </a>
                </div>
                <div className="ai-widget-lead-card__grid">
                  <input
                    className="form-input"
                    placeholder={copy.namePlaceholder}
                    value={capture.name}
                    onChange={(event) => updateCaptureField('name', event.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder={copy.emailPlaceholder}
                    value={capture.email}
                    onChange={(event) => updateCaptureField('email', event.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder={copy.phonePlaceholder}
                    value={capture.phone}
                    onChange={(event) => updateCaptureField('phone', event.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder={copy.nationalityPlaceholder}
                    value={capture.nationality}
                    onChange={(event) => updateCaptureField('nationality', event.target.value)}
                  />
                </div>
                {submitNotice ? (
                  <p className={`ai-widget-lead-card__notice ai-widget-lead-card__notice--${submitState}`}>
                    {submitNotice}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <form
            className="ai-widget-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              className="ai-widget-composer__input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={runtimeContext.inputPlaceholder}
            />
            <button type="submit" className="ai-widget-composer__button" disabled={isSending}>
              {copy.ask}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="ai-widget-trigger"
        aria-label={isOpen ? copy.closeChat : copy.openChat}
        onClick={toggleOpen}
      >
        <span className="ai-widget-trigger__badge">AI</span>
        <span>{copy.fabLabel}</span>
      </button>
    </div>
  );
}