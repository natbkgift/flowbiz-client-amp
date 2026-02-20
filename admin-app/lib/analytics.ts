/**
 * All tracked event types in the AMP analytics pipeline.
 *
 * - `page_view`           — Fires on every client-side navigation.
 * - `path_entry_click`    — User clicks an investment-path entry (invest/buy/rent).
 * - `cta_click`           — Any call-to-action interaction.
 * - `featured_click`      — Click on a featured project card.
 * - `form_start`          — User focuses the first field in LeadForm.
 * - `form_submit`         — LeadForm submission attempt.
 * - `form_error`          — Server rejected the form submission.
 * - `form_success`        — LeadForm submission succeeded.
 * - `experiment_exposure`  — User was shown an experiment variant.
 * - `experiment_outcome`   — Conversion attributed to an experiment.
 * - `segment_entry_click`  — User clicks a buyer-segment entry card.
 */
export type EventType =
  | 'page_view'
  | 'path_entry_click'
  | 'cta_click'
  | 'featured_click'
  | 'form_start'
  | 'form_submit'
  | 'form_error'
  | 'form_success'
  | 'experiment_exposure'
  | 'experiment_outcome'
  | 'segment_entry_click';

const SESSION_KEY = 'amp_session_id_v1';

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

/**
 * Send an analytics event to the backend tracking endpoint.
 *
 * Events are POSTed to `/api/v1/events` with `keepalive: true` so they
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

  // Enrich every event with active experiment assignments for downstream analysis
  const experiments = getExperimentContext();

  try {
    await fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type,
        page,
        session_id,
        payload: {
          ...(payload ?? {}),
          ...(Object.keys(experiments).length > 0 ? { _experiments: experiments } : {}),
        },
      }),
      keepalive: true,
    });
  } catch {
    // best-effort only
  }
}
