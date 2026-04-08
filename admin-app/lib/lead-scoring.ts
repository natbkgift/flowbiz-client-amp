/**
 * Lead Scoring & Intent Scoring Module
 *
 * Provides deterministic numeric scoring for:
 * - **Lead quality** — multi-dimensional score (0–100) combining behavioral
 *   signals, form completeness, and engagement depth.
 * - **Intent strength** — numeric score (0–100) derived from navigation
 *   patterns and funnel stage.
 *
 * Consumed by LeadForm on submission and by the personalization layer for
 * dynamic content prioritization.
 *
 * @module lead-scoring
 */

import {
  type FunnelStage,
  type VisitorIntent,
  type VisitorProfile,
  type VisitorSegment,
  getFunnelStage,
  readVisitorProfile,
} from './personalization';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Weights for each scoring dimension (must sum to 100). */
interface ScoringWeights {
  intentClarity: number;
  engagementDepth: number;
  formCompleteness: number;
  funnelProgress: number;
  recencySignal: number;
}

/** Full lead score breakdown returned by `calculateLeadScore`. */
export interface LeadScoreResult {
  /** Composite score 0–100 (higher = more qualified). */
  total: number;
  /** Individual dimension scores. */
  dimensions: {
    intentClarity: number;
    engagementDepth: number;
    formCompleteness: number;
    funnelProgress: number;
    recencySignal: number;
  };
  /** Qualitative tier derived from total score. */
  tier: 'hot' | 'warm' | 'cool' | 'cold';
  /** ISO timestamp when the score was computed. */
  scoredAt: string;
}

/** Numeric intent score result. */
export interface IntentScoreResult {
  /** Numeric intent strength 0–100. */
  intentScore: number;
  /** Detected intent category. */
  intent: VisitorIntent;
  /** Confidence level based on signal count. */
  confidence: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS: ScoringWeights = {
  intentClarity: 30,
  engagementDepth: 20,
  formCompleteness: 25,
  funnelProgress: 15,
  recencySignal: 10,
};

/** Maps intent categories to base intent-clarity scores. */
const INTENT_BASE_SCORE: Record<VisitorIntent, number> = {
  invest: 90,
  buy: 85,
  rent: 70,
  sell: 78,
  explore: 40,
  unknown: 10,
};

/** Maps funnel stages to progression multipliers (0–1). */
const FUNNEL_MULTIPLIER: Record<FunnelStage, number> = {
  awareness: 0.2,
  interest: 0.4,
  consideration: 0.7,
  intent: 0.9,
  conversion: 1.0,
};

/** Maps visitor segments to engagement scores. */
const SEGMENT_SCORE: Record<VisitorSegment, number> = {
  new: 30,
  returning: 65,
  engaged: 95,
};

/** Tier thresholds. */
const TIER_HOT = 75;
const TIER_WARM = 50;
const TIER_COOL = 25;

// ---------------------------------------------------------------------------
// Intent Score
// ---------------------------------------------------------------------------

/**
 * Compute a numeric intent score (0–100) from the visitor's navigation
 * patterns and funnel stage.
 *
 * The score combines:
 * - Base intent value (from detected intent category)
 * - Funnel stage progression multiplier
 * - Visit depth bonus (more pages = stronger signal)
 *
 * @returns An {@link IntentScoreResult} with numeric score and confidence.
 */
export function getIntentScore(): IntentScoreResult {
  const profile = readVisitorProfile();
  if (!profile) {
    return { intentScore: 0, intent: 'unknown', confidence: 'low' };
  }
  return computeIntentScore(profile);
}

/**
 * Pure computation of intent score from a visitor profile.
 * Exported for testability.
 */
export function computeIntentScore(profile: VisitorProfile): IntentScoreResult {
  const intent = profile.intent;
  const funnel = getFunnelStage();
  const baseScore = INTENT_BASE_SCORE[intent];
  const funnelBoost = FUNNEL_MULTIPLIER[funnel];

  // Visit depth bonus: +1 per page visited, capped at +15
  const depthBonus = Math.min(profile.recentPages.length, 15);

  // Raw score: base × funnel weight + depth bonus
  const raw = baseScore * funnelBoost + depthBonus;
  const intentScore = Math.min(Math.round(raw), 100);

  // Confidence: based on number of intent-matching pages
  const intentPages = profile.recentPages.filter((p) =>
    /\/(invest|buy|rent|sell|property|projects?)\b/i.test(p),
  ).length;
  const confidence: IntentScoreResult['confidence'] =
    intentPages >= 3 ? 'high' : intentPages >= 1 ? 'medium' : 'low';

  return { intentScore, intent, confidence };
}

// ---------------------------------------------------------------------------
// Lead Score
// ---------------------------------------------------------------------------

/** Form data used for completeness scoring. */
export interface LeadFormData {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  propertyId?: string | null;
  budgetBand?: string | null;
  purpose?: string | null;
  timeframe?: string | null;
  preferredArea?: string | null;
  inquiryIntent?: string | null;
}

/**
 * Calculate a composite lead quality score (0–100).
 *
 * Combines five weighted dimensions:
 * 1. **Intent clarity** — How clear is the visitor's purchase/investment intent?
 * 2. **Engagement depth** — Session count, pages viewed, segment maturity.
 * 3. **Form completeness** — How much data did the lead provide?
 * 4. **Funnel progress** — How far through the advisory funnel?
 * 5. **Recency signal** — How recently did the visitor engage?
 *
 * @param formData - Data from the lead form submission.
 * @param weights  - Optional custom dimension weights.
 * @returns A fully itemized {@link LeadScoreResult}.
 *
 * @example
 * ```ts
 * const score = calculateLeadScore({
 *   name: 'John',
 *   email: 'john@example.com',
 *   message: 'Interested in a condo investment',
 * });
 * console.log(score.total); // 0–100
 * console.log(score.tier);  // 'hot' | 'warm' | 'cool' | 'cold'
 * ```
 */
export function calculateLeadScore(
  formData: LeadFormData = {},
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): LeadScoreResult {
  const profile = readVisitorProfile();
  const funnel = getFunnelStage();

  // --- Dimension 1: Intent Clarity (0–100) ---
  const intentClarity = scoreIntentClarity(profile, formData);

  // --- Dimension 2: Engagement Depth (0–100) ---
  const engagementDepth = profile ? SEGMENT_SCORE[profile.segment] : 10;

  // --- Dimension 3: Form Completeness (0–100) ---
  const formCompleteness = scoreFormCompleteness(formData);

  // --- Dimension 4: Funnel Progress (0–100) ---
  const funnelProgress = Math.round(FUNNEL_MULTIPLIER[funnel] * 100);

  // --- Dimension 5: Recency Signal (0–100) ---
  const recencySignal = profile ? scoreRecency(profile.lastVisitAt) : 20;

  // Weighted total
  const total = Math.min(
    100,
    Math.round(
      (intentClarity * weights.intentClarity +
        engagementDepth * weights.engagementDepth +
        formCompleteness * weights.formCompleteness +
        funnelProgress * weights.funnelProgress +
        recencySignal * weights.recencySignal) /
        100,
    ),
  );

  const tier = deriveTier(total);

  return {
    total,
    dimensions: {
      intentClarity,
      engagementDepth,
      formCompleteness,
      funnelProgress,
      recencySignal,
    },
    tier,
    scoredAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Score form completeness (0–100) based on provided fields. */
function scoreFormCompleteness(data: LeadFormData): number {
  let score = 0;
  if (data.name?.trim()) score += 20;
  if (data.email?.trim()) score += 25;
  if (data.phone?.trim()) score += 20;
  if (data.message?.trim()) {
    // Longer messages indicate higher intent
    const wordCount = data.message.trim().split(/\s+/).length;
    score += wordCount >= 10 ? 25 : wordCount >= 3 ? 15 : 5;
  }
  if (data.propertyId) score += 10;
  const budgetBand = normalizeToken(data.budgetBand);
  if (budgetBand) score += budgetBand === 'not_sure' ? 3 : 8;
  if (normalizeToken(data.purpose)) score += 10;
  const timeframe = normalizeToken(data.timeframe);
  if (timeframe) score += timeframe === 'flexible' ? 4 : 8;
  if (data.preferredArea?.trim()) score += 7;
  return Math.min(score, 100);
}

function scoreIntentClarity(profile: VisitorProfile | null, data: LeadFormData): number {
  const behavioralScore = profile ? computeIntentScore(profile).intentScore : 0;
  const declaredScore = scoreDeclaredIntent(data);

  if (behavioralScore <= 0 && declaredScore <= 0) return 10;
  if (behavioralScore <= 0) return Math.max(declaredScore, 10);
  if (declaredScore <= 0) return behavioralScore;

  return Math.min(100, Math.round(behavioralScore * 0.55 + declaredScore * 0.45));
}

function scoreDeclaredIntent(data: LeadFormData): number {
  const declaredIntent =
    normalizeToken(data.inquiryIntent) ?? normalizeToken(data.purpose);

  let score =
    declaredIntent && declaredIntent in DECLARED_INTENT_SCORE
      ? DECLARED_INTENT_SCORE[declaredIntent as keyof typeof DECLARED_INTENT_SCORE]
      : 0;

  if (score <= 0) return 0;

  const timeframe = normalizeToken(data.timeframe);
  if (timeframe) {
    score += DECLARED_TIMEFRAME_BONUS[timeframe] ?? 0;
  }

  const budgetBand = normalizeToken(data.budgetBand);
  if (budgetBand) {
    score += budgetBand === 'not_sure' ? 2 : 6;
  }

  if (data.preferredArea?.trim()) score += 4;
  if (hasUrgencySignal(data.message)) score += 6;

  return Math.min(score, 100);
}

function hasUrgencySignal(message: string | undefined): boolean {
  const text = String(message || '').toLowerCase();
  if (!text.trim()) return false;
  return /\b(today|urgent|ready|schedule|viewing|visit|book|availability|available|compare|shortlist|roi|return)\b/i.test(
    text,
  );
}

function normalizeToken(value: string | null | undefined): string | null {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;

  return text.replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '') || null;
}

/** Score recency of last visit (0–100). More recent = higher. */
function scoreRecency(lastVisitIso: string): number {
  try {
    const now = Date.now();
    const last = new Date(lastVisitIso).getTime();
    const hoursAgo = (now - last) / (1000 * 60 * 60);

    if (hoursAgo <= 1) return 100;
    if (hoursAgo <= 6) return 85;
    if (hoursAgo <= 24) return 70;
    if (hoursAgo <= 72) return 50;
    if (hoursAgo <= 168) return 30;
    return 10; // > 1 week
  } catch {
    return 20;
  }
}

/** Map total score to qualitative tier. */
function deriveTier(total: number): LeadScoreResult['tier'] {
  if (total >= TIER_HOT) return 'hot';
  if (total >= TIER_WARM) return 'warm';
  if (total >= TIER_COOL) return 'cool';
  return 'cold';
}

const DECLARED_INTENT_SCORE = {
  invest: 90,
  buy: 82,
  rent: 68,
  sell: 76,
  project_consultation: 85,
  project_availability_check: 86,
  project_investment_check: 90,
  project_shortlist: 90,
  project_compare: 88,
  general: 35,
  general_inquiry: 35,
} as const;

const DECLARED_TIMEFRAME_BONUS: Record<string, number> = {
  '0_3m': 12,
  '3_6m': 8,
  '6m_plus': 4,
  flexible: 2,
};
