import {
  inferDeviceType,
  inferLocaleFromPath,
  sanitizeConversionPayload,
  type ConversionPayload,
} from './conversion';

export type EventType =
  | 'page_view'
  | 'path_entry_click'
  | 'cta_click'
  | 'lead_submit'
  | 'shortlist_action'
  | 'compare_action'
  | 'smart_finder_result_click'
  | 'featured_click'
  | 'form_start'
  | 'form_submit'
  | 'form_error'
  | 'form_success'
  | 'experiment_exposure'
  | 'experiment_outcome'
  | 'segment_entry_click'
  | 'home_intent_selector_click'
  | 'home_trust_proof_click'
  | 'home_advisory_content_click'
  | 'home_final_cta_click';

const SESSION_KEY = 'amp_session_id_v1';
const DEDUPE_WINDOW_MS = 1200;
const recentEvents = new Map<string, number>();

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

/**
 * Retrieve the current analytics session ID or create a new one.
 *
 * The session ID is persisted in `localStorage` under the key
 * `amp_session_id_v1` and reused across page views within the same
 * browser session. Falls back to `'server'` during SSR and `'unknown'`
 * if localStorage is unavailable.
 *
 * @returns A UUID string identifying the current session.
 */
export function getOrCreateSessionId(): string {
  const w = safeWindow();
  if (!w) return 'server';

  try {
    const existing = w.localStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 8) return existing;

    const id = w.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    w.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return 'unknown';
  }
}

/**
 * Read active experiment variant assignments from localStorage.
 * Returns a map of experimentId → variantId for payload enrichment.
 */
function getExperimentContext(): Record<string, string> {
  const w = safeWindow();
  if (!w) return {};
  try {
    const raw = w.localStorage.getItem('amp_exp_assignments_v1');
    if (!raw) return {};
    const assignments = JSON.parse(raw) as Record<string, { variantId: string }>;
    const ctx: Record<string, string> = {};
    for (const [expId, a] of Object.entries(assignments)) {
      if (a?.variantId) ctx[expId] = a.variantId;
    }
    return ctx;
  } catch {
    return {};
  }
}

function getLocale(pathname: string): 'en' | 'th' {
  return inferLocaleFromPath(pathname);
}

function buildNormalizedPayload(
  eventName: EventType,
  page: string,
  payload?: Record<string, unknown>,
): ConversionPayload {
  const base = sanitizeConversionPayload(payload ?? {});
  const context = sanitizeConversionPayload({
    ...(typeof base.context === 'object' && base.context ? base.context as Record<string, unknown> : {}),
  });
  const device = inferDeviceType(safeWindow()?.innerWidth ?? null);
  const locale = typeof base.locale === 'string' ? (base.locale as 'en' | 'th') : getLocale(page);

  return {
    ...base,
    source_route: typeof base.source_route === 'string' ? base.source_route : 'shared',
    locale,
    device: (base.device as ConversionPayload['device']) ?? device,
    timestamp: new Date().toISOString(),
    context,
    debug_event_type: eventName,
  } as ConversionPayload;
}

function shouldSkipDuplicate(eventName: EventType, page: string, payload: ConversionPayload): boolean {
  const fingerprint = JSON.stringify([eventName, page, payload]);
  const now = Date.now();
  const previous = recentEvents.get(fingerprint);
  recentEvents.set(fingerprint, now);

  for (const [key, timestamp] of recentEvents.entries()) {
    if (now - timestamp > DEDUPE_WINDOW_MS) {
      recentEvents.delete(key);
    }
  }

  return typeof previous === 'number' && now - previous < DEDUPE_WINDOW_MS;
}

/**
 * Send an analytics event to the backend tracking endpoint.
 *
 * Events are POSTed to `/telemetry` with `keepalive: true` so they
 * survive page navigations. Every event is automatically enriched with
 * the current session ID and active experiment variant assignments.
 *
 * @param event_type - One of the {@link EventType} discriminators.
 * @param page       - The pathname of the page where the event occurred.
 * @param payload    - Optional key-value bag merged into the event body.
 */
export async function trackEvent(event_type: EventType, page: string, payload?: Record<string, unknown>) {
  const w = safeWindow();
  if (!w) return;

  const session_id = getOrCreateSessionId();
  const normalizedPayload = buildNormalizedPayload(event_type, page, payload);
  if (shouldSkipDuplicate(event_type, page, normalizedPayload)) return;

  // Enrich every event with active experiment assignments for downstream analysis
  const experiments = getExperimentContext();
  const source = sanitizeConversionPayload({
    page,
    locale: normalizedPayload.locale,
    route: normalizedPayload.source_route,
    event_type,
  });
  const actor = sanitizeConversionPayload({
    anonymous_id: session_id,
    session_id,
    device: normalizedPayload.device,
    user_agent: w.navigator?.userAgent ?? null,
  });
  const context = sanitizeConversionPayload({
    ...(typeof normalizedPayload.context === 'object' && normalizedPayload.context
      ? normalizedPayload.context as Record<string, unknown>
      : {}),
    ...(Object.keys(experiments).length > 0 ? { experiments } : {}),
  });

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[TRACK]', event_type, normalizedPayload);
    }

    const response = await fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: event_type,
        path: page,
        locale: normalizedPayload.locale,
        source,
        actor,
        context,
        payload: normalizedPayload,
      }),
      keepalive: true,
    });
    if (!response.ok && process.env.NODE_ENV !== 'production') {
      console.warn('[TRACK_FAIL]', event_type, response.status);
    }
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[TRACK_FAIL]', event_type, normalizedPayload);
    }
  }
}
