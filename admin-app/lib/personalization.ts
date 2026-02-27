/**
 * UAAS Personalization Layer
 *
 * Provides:
 * - Return visitor recognition via localStorage fingerprint
 * - Behavioral intent detection from navigation patterns
 * - Locale-aware visitor segmentation
 * - Visit history for downstream content prioritization
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VisitorIntent = 'invest' | 'buy' | 'rent' | 'explore' | 'unknown';
/** Engagement segment based on session count and recency. */
export type VisitorSegment = 'new' | 'returning' | 'engaged';

export interface VisitorProfile {
  /** Unique visitor identifier (persisted across sessions). */
  visitorId: string;
  /** First visit timestamp (ISO 8601). */
  firstVisitAt: string;
  /** Last visit timestamp (ISO 8601). */
  lastVisitAt: string;
  /** Total number of sessions. */
  sessionCount: number;
  /** Detected primary intent based on navigation. */
  intent: VisitorIntent;
  /** Visitor engagement segment. */
  segment: VisitorSegment;
  /** Pages visited in current session (last 20). */
  recentPages: string[];
  /** Preferred locale (last used). */
  preferredLocale: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VISITOR_KEY = 'amp_visitor_v1';
const MAX_RECENT_PAGES = 20;

// Intent detection: page path patterns → intent mapping
const INTENT_PATTERNS: Array<{ pattern: RegExp; intent: VisitorIntent }> = [
  { pattern: /\/invest/i, intent: 'invest' },
  { pattern: /\/buy/i, intent: 'buy' },
  { pattern: /\/rent/i, intent: 'rent' },
  { pattern: /\/projects?\//i, intent: 'invest' },
  { pattern: /\/property\//i, intent: 'buy' },
  { pattern: /\/smart-finder/i, intent: 'explore' },
  { pattern: /\/investment/i, intent: 'invest' },
  { pattern: /\/investor/i, intent: 'invest' },
  { pattern: /\/european/i, intent: 'buy' },
  { pattern: /\/holiday-home/i, intent: 'buy' },
  { pattern: /\/luxury/i, intent: 'buy' },
  { pattern: /\/general/i, intent: 'buy' },
];

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

function generateVisitorId(): string {
  const w = safeWindow();
  if (w?.crypto?.randomUUID) return w.crypto.randomUUID();
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Read the persisted visitor profile from localStorage. */
export function readVisitorProfile(): VisitorProfile | null {
  const w = safeWindow();
  if (!w) return null;
  try {
    const raw = w.localStorage.getItem(VISITOR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VisitorProfile;
  } catch {
    return null;
  }
}

/** Persist the visitor profile to localStorage. */
function writeVisitorProfile(profile: VisitorProfile): void {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.setItem(VISITOR_KEY, JSON.stringify(profile));
  } catch {
    // storage full — degrade silently
  }
}

/**
 * Detect the primary intent from a list of visited pages.
 * Returns the most frequently signaled intent.
 */
function detectIntent(pages: string[]): VisitorIntent {
  const counts: Record<VisitorIntent, number> = {
    invest: 0,
    buy: 0,
    rent: 0,
    explore: 0,
    unknown: 0,
  };

  for (const page of pages) {
    let matched = false;
    for (const { pattern, intent } of INTENT_PATTERNS) {
      if (pattern.test(page)) {
        counts[intent]++;
        matched = true;
        break;
      }
    }
    if (!matched) counts.explore++;
  }

  // Return the intent with the highest count (excluding 'explore' as default)
  const candidates = (['invest', 'buy', 'rent'] as const).filter((k) => counts[k] > 0);
  if (candidates.length === 0) return 'explore';
  return candidates.reduce((a, b) => (counts[a] >= counts[b] ? a : b));
}

/** Determine visitor segment based on session count. */
function resolveSegment(sessionCount: number): VisitorSegment {
  if (sessionCount <= 1) return 'new';
  if (sessionCount <= 3) return 'returning';
  return 'engaged';
}

/**
 * Record a page visit and update the visitor profile.
 * Creates a new profile on first visit.
 *
 * @param pathname - Current page pathname (e.g., "/en/invest")
 * @param isNewSession - Whether this is the first page view of a new session
 * @returns The updated visitor profile
 */
export function recordVisit(
  pathname: string,
  isNewSession: boolean,
): VisitorProfile {
  const now = new Date().toISOString();
  const existing = readVisitorProfile();

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/(en|th)/);
  const locale = localeMatch?.[1] ?? 'en';

  if (!existing) {
    // First-time visitor
    const profile: VisitorProfile = {
      visitorId: generateVisitorId(),
      firstVisitAt: now,
      lastVisitAt: now,
      sessionCount: 1,
      intent: 'unknown',
      segment: 'new',
      recentPages: [pathname],
      preferredLocale: locale,
    };
    writeVisitorProfile(profile);
    return profile;
  }

  // Returning visitor
  const updatedPages = [...existing.recentPages, pathname].slice(-MAX_RECENT_PAGES);
  const sessionCount = isNewSession
    ? existing.sessionCount + 1
    : existing.sessionCount;

  const profile: VisitorProfile = {
    visitorId: existing.visitorId,
    firstVisitAt: existing.firstVisitAt,
    lastVisitAt: now,
    sessionCount,
    intent: detectIntent(updatedPages),
    segment: resolveSegment(sessionCount),
    recentPages: updatedPages,
    preferredLocale: locale,
  };

  writeVisitorProfile(profile);
  return profile;
}

/**
 * Get the current visitor profile without recording a new visit.
 * Returns null on server or if no profile exists.
 */
export function getVisitorProfile(): VisitorProfile | null {
  return readVisitorProfile();
}

/**
 * Check if the current visitor is a return visitor.
 */
export function isReturnVisitor(): boolean {
  const profile = readVisitorProfile();
  return profile !== null && profile.sessionCount > 1;
}

/**
 * Get the visitor's detected primary intent.
 */
export function getVisitorIntent(): VisitorIntent {
  const profile = readVisitorProfile();
  return profile?.intent ?? 'unknown';
}

/**
 * Funnel stages for the AMP advisory journey.
 *
 * - `awareness`    — First-time visitor, browsing landing pages.
 * - `interest`     — Explored a specific path (invest/buy/rent) or visited 3+ pages.
 * - `consideration`— Viewed property details or used the guided finder.
 * - `intent`       — Started the lead form (form_start event).
 * - `conversion`   — Submitted the lead form (form_success event).
 */
export type FunnelStage = 'awareness' | 'interest' | 'consideration' | 'intent' | 'conversion';

/**
 * Determine the visitor's current funnel stage based on their profile.
 *
 * This is a heuristic based on visit count, pages viewed, and detected
 * intent. It does NOT track form interactions — those are layered on top
 * by the analytics module when `form_start` / `form_success` events fire.
 *
 * @returns The highest funnel stage the visitor has reached.
 */
export function getFunnelStage(): FunnelStage {
  const profile = readVisitorProfile();
  if (!profile) return 'awareness';

  // If they've navigated to a property detail page or used guided finder
  const hasViewedProperty = profile.recentPages.some(
    (p) => /\/property\//.test(p) || /\/projects?\//.test(p),
  );
  const hasUsedGuidedFinder = profile.recentPages.some(
    (p) => /guided=1/.test(p),
  );

  if (hasViewedProperty || hasUsedGuidedFinder) return 'consideration';

  // If they have a clear intent or visited 3+ distinct pages
  if (profile.intent !== 'unknown' && profile.intent !== 'explore') return 'interest';
  if (profile.recentPages.length >= 3) return 'interest';

  return 'awareness';
}

// ---------------------------------------------------------------------------
// Content Recommendations
// ---------------------------------------------------------------------------

/**
 * A content recommendation based on the visitor's intent, funnel stage,
 * and engagement segment. Used by downstream components to prioritise
 * content blocks, CTAs, or featured sections.
 */
export interface ContentRecommendation {
  /** Primary content emphasis key (maps to a section or CTA variant). */
  emphasis: 'roi_data' | 'buying_process' | 'lifestyle' | 'advisory' | 'general';
  /** Suggested CTA label key from the dictionary. */
  suggestedCta: 'exploreInvestment' | 'speakToAdvisor' | 'viewListings' | 'startGuided';
  /** Whether to show social proof (e.g., testimonials). */
  showSocialProof: boolean;
  /** Whether to show the guided finder prompt. */
  showGuidedPrompt: boolean;
  /** Short reason for the recommendation (useful for analytics). */
  reason: string;
}

/**
 * Generate a content recommendation based on the current visitor's profile.
 *
 * The recommendation combines intent detection, funnel stage, and engagement
 * segment to produce an actionable content strategy for the current page view.
 *
 * @returns A {@link ContentRecommendation} for personalising the page.
 *
 * @example
 * ```ts
 * const rec = getContentRecommendation();
 * if (rec.emphasis === 'roi_data') {
 *   // Show investment ROI section prominently
 * }
 * ```
 */
export function getContentRecommendation(): ContentRecommendation {
  const profile = readVisitorProfile();
  const intent = profile?.intent ?? 'unknown';
  const funnel = getFunnelStage();
  const segment = profile?.segment ?? 'new';

  // Investors: emphasise ROI data and market analysis
  if (intent === 'invest') {
    return {
      emphasis: 'roi_data',
      suggestedCta: 'exploreInvestment',
      showSocialProof: funnel === 'consideration' || segment === 'returning',
      showGuidedPrompt: funnel === 'awareness',
      reason: `intent=invest, funnel=${funnel}, segment=${segment}`,
    };
  }

  // Buyers: emphasise the buying process and property search
  if (intent === 'buy') {
    return {
      emphasis: 'buying_process',
      suggestedCta: funnel === 'consideration' ? 'speakToAdvisor' : 'viewListings',
      showSocialProof: true,
      showGuidedPrompt: funnel === 'awareness' || funnel === 'interest',
      reason: `intent=buy, funnel=${funnel}, segment=${segment}`,
    };
  }

  // Renters: emphasise lifestyle and area guides
  if (intent === 'rent') {
    return {
      emphasis: 'lifestyle',
      suggestedCta: 'viewListings',
      showSocialProof: false,
      showGuidedPrompt: funnel === 'awareness',
      reason: `intent=rent, funnel=${funnel}, segment=${segment}`,
    };
  }

  // Returning/engaged visitors who haven't shown specific intent: advisory
  if (segment === 'returning' || segment === 'engaged') {
    return {
      emphasis: 'advisory',
      suggestedCta: 'speakToAdvisor',
      showSocialProof: true,
      showGuidedPrompt: false,
      reason: `intent=${intent}, funnel=${funnel}, segment=${segment}`,
    };
  }

  // Default: general content with guided prompt for new visitors
  return {
    emphasis: 'general',
    suggestedCta: 'startGuided',
    showSocialProof: false,
    showGuidedPrompt: true,
    reason: `intent=${intent}, funnel=${funnel}, segment=${segment}`,
  };
}
