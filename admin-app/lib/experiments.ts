/**
 * UAAS Experiment Intelligence Engine
 *
 * Provides:
 * - Feature flag registry with typed experiment definitions
 * - Deterministic variant assignment via FNV-1a session hashing
 * - Two-proportion z-test statistical significance calculator
 * - Experiment promotion evaluation engine
 * - Client-side assignment persistence (localStorage)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VariantId = string;

export interface ExperimentVariant {
  id: VariantId;
  /** Weight 0-100. All variant weights within an experiment must sum to 100. */
  weight: number;
  label: string;
}

export interface ExperimentDefinition {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'promoted' | 'archived';
  variants: ExperimentVariant[];
  /** Glob-style page paths this experiment targets (matched against pathname). */
  targetPages: string[];
  promotionRules: {
    minSampleSize: number;
    /** Minimum confidence level (0–1) required before promotion. */
    minConfidence: number;
    /** Minimum relative improvement percentage required. */
    minImprovementPct: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: VariantId;
  assignedAt: number;
}

// ---------------------------------------------------------------------------
// Experiment Registry
// ---------------------------------------------------------------------------

const ASSIGNMENTS_KEY = 'amp_exp_assignments_v1';

/**
 * Active experiment registry.
 * Add or modify experiments here. The evolution loop manages promotion/archival.
 */
export const EXPERIMENT_REGISTRY: ExperimentDefinition[] = [
  {
    id: 'hero_cta_copy',
    name: 'Hero CTA Copy Test',
    description:
      'Test whether "Start Your Journey" outperforms "Explore Investment" as primary hero CTA',
    status: 'active',
    variants: [
      { id: 'control', weight: 50, label: 'Explore Investment (Control)' },
      { id: 'variant_a', weight: 50, label: 'Start Your Journey' },
    ],
    targetPages: ['/en', '/th', '/en/', '/th/'],
    promotionRules: {
      minSampleSize: 100,
      minConfidence: 0.95,
      minImprovementPct: 5,
    },
    createdAt: '2026-02-19T12:00:00Z',
    updatedAt: '2026-02-19T12:00:00Z',
  },
  {
    id: 'social_proof_position',
    name: 'Social Proof Placement',
    description:
      'Test social-proof snippet placement near CTAs vs. standalone section',
    status: 'active',
    variants: [
      { id: 'control', weight: 50, label: 'Standalone section (Control)' },
      { id: 'variant_a', weight: 50, label: 'Inline near CTA' },
    ],
    targetPages: ['/en', '/th', '/en/', '/th/'],
    promotionRules: {
      minSampleSize: 200,
      minConfidence: 0.95,
      minImprovementPct: 3,
    },
    createdAt: '2026-02-19T12:00:00Z',
    updatedAt: '2026-02-19T12:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Deterministic Variant Assignment (FNV-1a hash)
// ---------------------------------------------------------------------------

/**
 * Hash a string to an integer 0–99 using the FNV-1a algorithm.
 * Produces a stable, well-distributed bucket for traffic splitting.
 */
function hashToPercent(input: string): number {
  let hash = 2166136261; // FNV offset basis (32-bit)
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // FNV prime, keep unsigned 32-bit
  }
  return hash % 100;
}

/**
 * Assign a variant deterministically for a given session + experiment pair.
 * The same session ID always maps to the same variant.
 */
export function assignVariant(
  experiment: ExperimentDefinition,
  sessionId: string,
): VariantId {
  if (experiment.status !== 'active') {
    return experiment.variants[0]?.id ?? 'control';
  }

  const bucket = hashToPercent(`${sessionId}:${experiment.id}`);
  let cumulative = 0;

  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant.id;
    }
  }

  // Fallback to last variant (should not happen if weights sum to 100).
  return experiment.variants[experiment.variants.length - 1]?.id ?? 'control';
}

// ---------------------------------------------------------------------------
// Statistical Significance Calculator (Two-Proportion Z-Test)
// ---------------------------------------------------------------------------

/**
 * Abramowitz & Stegun approximation of the standard-normal CDF.
 */
function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const abs = Math.abs(x);
  const t = 1.0 / (1.0 + p * abs);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-abs * abs);
  return 0.5 * (1.0 + sign * y);
}

export interface SignificanceResult {
  zScore: number;
  pValue: number;
  significant: boolean;
  confidenceLevel: number;
  relativeImprovement: number;
}

/**
 * Two-proportion z-test comparing variant conversion rate against control.
 *
 * @returns Statistics including z-score, p-value, confidence level, and relative improvement.
 */
export function calculateSignificance(
  controlConversions: number,
  controlTotal: number,
  variantConversions: number,
  variantTotal: number,
  confidenceThreshold = 0.95,
): SignificanceResult {
  if (controlTotal === 0 || variantTotal === 0) {
    return {
      zScore: 0,
      pValue: 1,
      significant: false,
      confidenceLevel: 0,
      relativeImprovement: 0,
    };
  }

  const p1 = controlConversions / controlTotal;
  const p2 = variantConversions / variantTotal;
  const pPooled =
    (controlConversions + variantConversions) / (controlTotal + variantTotal);

  const se = Math.sqrt(
    pPooled * (1 - pPooled) * (1 / controlTotal + 1 / variantTotal),
  );

  if (se === 0) {
    return {
      zScore: 0,
      pValue: 1,
      significant: false,
      confidenceLevel: 0,
      relativeImprovement: 0,
    };
  }

  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore))); // two-tailed
  const confidenceLevel = 1 - pValue;
  const relativeImprovement = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

  return {
    zScore: Math.round(zScore * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    significant: confidenceLevel >= confidenceThreshold,
    confidenceLevel: Math.round(confidenceLevel * 10000) / 10000,
    relativeImprovement: Math.round(relativeImprovement * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Experiment Promotion Engine
// ---------------------------------------------------------------------------

export interface PromotionEvaluation {
  experimentId: string;
  eligible: boolean;
  reason: string;
  winningVariant: VariantId | null;
  stats: SignificanceResult | null;
}

/**
 * Evaluate whether an experiment has gathered enough data to promote a winner.
 */
export function evaluatePromotion(
  experiment: ExperimentDefinition,
  controlConversions: number,
  controlTotal: number,
  variantConversions: number,
  variantTotal: number,
): PromotionEvaluation {
  const totalSample = controlTotal + variantTotal;

  if (totalSample < experiment.promotionRules.minSampleSize) {
    return {
      experimentId: experiment.id,
      eligible: false,
      reason: `Insufficient sample: ${totalSample}/${experiment.promotionRules.minSampleSize}`,
      winningVariant: null,
      stats: null,
    };
  }

  const stats = calculateSignificance(
    controlConversions,
    controlTotal,
    variantConversions,
    variantTotal,
    experiment.promotionRules.minConfidence,
  );

  if (!stats.significant) {
    return {
      experimentId: experiment.id,
      eligible: false,
      reason: `Not significant: ${(stats.confidenceLevel * 100).toFixed(1)}% < ${(experiment.promotionRules.minConfidence * 100).toFixed(1)}%`,
      winningVariant: null,
      stats,
    };
  }

  if (stats.relativeImprovement < experiment.promotionRules.minImprovementPct) {
    return {
      experimentId: experiment.id,
      eligible: false,
      reason: `Improvement ${stats.relativeImprovement.toFixed(1)}% < min ${experiment.promotionRules.minImprovementPct}%`,
      winningVariant: null,
      stats,
    };
  }

  const winner =
    stats.relativeImprovement > 0
      ? experiment.variants[1]?.id ?? 'variant_a'
      : experiment.variants[0]?.id ?? 'control';

  return {
    experimentId: experiment.id,
    eligible: true,
    reason: `Winner: ${winner} — +${stats.relativeImprovement.toFixed(1)}% at ${(stats.confidenceLevel * 100).toFixed(1)}% confidence`,
    winningVariant: winner,
    stats,
  };
}

// ---------------------------------------------------------------------------
// Client-Side LocalStorage Helpers
// ---------------------------------------------------------------------------

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

/** Read all persisted experiment assignments. */
export function getAssignments(): Record<string, ExperimentAssignment> {
  const w = safeWindow();
  if (!w) return {};
  try {
    const stored = w.localStorage.getItem(ASSIGNMENTS_KEY);
    return stored ? (JSON.parse(stored) as Record<string, ExperimentAssignment>) : {};
  } catch {
    return {};
  }
}

/** Persist a single experiment assignment. */
export function saveAssignment(assignment: ExperimentAssignment): void {
  const w = safeWindow();
  if (!w) return;
  try {
    const existing = getAssignments();
    existing[assignment.experimentId] = assignment;
    w.localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(existing));
  } catch {
    // storage full or unavailable — degrade silently
  }
}

/** Return only experiments with status === 'active'. */
export function getActiveExperiments(): ExperimentDefinition[] {
  return EXPERIMENT_REGISTRY.filter((e) => e.status === 'active');
}

/**
 * Retrieve (or create) the variant assignment for a specific experiment.
 * Returns null if the experiment is not active or not found.
 */
export function getOrAssignVariant(
  experimentId: string,
  sessionId: string,
): ExperimentAssignment | null {
  const experiment = EXPERIMENT_REGISTRY.find((e) => e.id === experimentId);
  if (!experiment || experiment.status !== 'active') return null;

  const assignments = getAssignments();
  const existing = assignments[experimentId];
  if (existing) return existing;

  const variantId = assignVariant(experiment, sessionId);
  const assignment: ExperimentAssignment = {
    experimentId,
    variantId,
    assignedAt: Date.now(),
  };
  saveAssignment(assignment);
  return assignment;
}

/**
 * Track an experiment outcome event.
 * Call this when a user completes a goal (e.g., form submission, CTA click)
 * to attribute the conversion to the assigned experiment variant.
 *
 * @param metric - The outcome metric name (e.g., 'form_submit', 'cta_click')
 * @param value - The outcome value (1 for binary conversion, or numeric value)
 * @param trackFn - The analytics trackEvent function
 * @param page - Current page path
 */
export function trackExperimentOutcomes(
  metric: string,
  value: number,
  trackFn: (eventType: string, page: string, payload?: Record<string, unknown>) => void,
  page: string,
): void {
  const assignments = getAssignments();
  const activeExperiments = getActiveExperiments();

  for (const experiment of activeExperiments) {
    const assignment = assignments[experiment.id];
    if (!assignment) continue;

    trackFn('experiment_outcome', page, {
      experiment_id: experiment.id,
      variant_id: assignment.variantId,
      metric,
      value,
    });
  }
}

// ---------------------------------------------------------------------------
// Experiment Outcomes Analysis
// ---------------------------------------------------------------------------

/**
 * Structured report for a single experiment's performance.
 */
export interface ExperimentReport {
  /** Experiment identifier. */
  experimentId: string;
  /** Current experiment status. */
  status: ExperimentDefinition['status'];
  /** Per-variant performance breakdown. */
  variants: Array<{
    id: string;
    label: string;
    conversions: number;
    total: number;
    conversionRate: number;
  }>;
  /** Statistical significance analysis (null if insufficient data). */
  significance: SignificanceResult | null;
  /** Promotion eligibility. */
  promotion: PromotionEvaluation | null;
  /** Recommended action based on current data. */
  recommendation: 'continue' | 'promote_winner' | 'stop_no_effect' | 'insufficient_data';
}

/**
 * Analyse an experiment's outcomes and produce a structured report.
 *
 * This is the main entry point for experiment intelligence. It combines
 * assignment counts, conversion data, statistical testing, and promotion
 * evaluation into a single actionable report.
 *
 * @param experimentId     - ID of the experiment to analyse.
 * @param controlConversions - Total conversions attributed to the control variant.
 * @param controlTotal       - Total exposures of the control variant.
 * @param variantConversions - Total conversions attributed to the test variant.
 * @param variantTotal       - Total exposures of the test variant.
 * @returns A structured {@link ExperimentReport} with recommendation.
 */
export function analyzeExperiment(
  experimentId: string,
  controlConversions: number,
  controlTotal: number,
  variantConversions: number,
  variantTotal: number,
): ExperimentReport {
  const experiment = EXPERIMENT_REGISTRY.find((e) => e.id === experimentId);
  if (!experiment) {
    return {
      experimentId,
      status: 'archived',
      variants: [],
      significance: null,
      promotion: null,
      recommendation: 'insufficient_data',
    };
  }

  const controlRate = controlTotal > 0 ? controlConversions / controlTotal : 0;
  const variantRate = variantTotal > 0 ? variantConversions / variantTotal : 0;

  const variants = [
    {
      id: experiment.variants[0]?.id ?? 'control',
      label: experiment.variants[0]?.label ?? 'Control',
      conversions: controlConversions,
      total: controlTotal,
      conversionRate: Math.round(controlRate * 10000) / 100,
    },
    {
      id: experiment.variants[1]?.id ?? 'variant_a',
      label: experiment.variants[1]?.label ?? 'Variant A',
      conversions: variantConversions,
      total: variantTotal,
      conversionRate: Math.round(variantRate * 10000) / 100,
    },
  ];

  const totalSample = controlTotal + variantTotal;
  if (totalSample < 20) {
    return {
      experimentId,
      status: experiment.status,
      variants,
      significance: null,
      promotion: null,
      recommendation: 'insufficient_data',
    };
  }

  const significance = calculateSignificance(
    controlConversions,
    controlTotal,
    variantConversions,
    variantTotal,
  );

  const promotion = evaluatePromotion(
    experiment,
    controlConversions,
    controlTotal,
    variantConversions,
    variantTotal,
  );

  let recommendation: ExperimentReport['recommendation'];
  if (promotion.eligible) {
    recommendation = 'promote_winner';
  } else if (significance.significant && significance.relativeImprovement < 1) {
    recommendation = 'stop_no_effect';
  } else {
    recommendation = 'continue';
  }

  return {
    experimentId,
    status: experiment.status,
    variants,
    significance,
    promotion,
    recommendation,
  };
}

/**
 * Generate reports for all registered experiments.
 *
 * @param getOutcomeData - Callback to retrieve conversion data for each experiment.
 * @returns Array of {@link ExperimentReport} objects, one per registered experiment.
 */
export function getAllExperimentReports(
  getOutcomeData: (experimentId: string) => {
    controlConversions: number;
    controlTotal: number;
    variantConversions: number;
    variantTotal: number;
  },
): ExperimentReport[] {
  return EXPERIMENT_REGISTRY.map((experiment) => {
    const data = getOutcomeData(experiment.id);
    return analyzeExperiment(
      experiment.id,
      data.controlConversions,
      data.controlTotal,
      data.variantConversions,
      data.variantTotal,
    );
  });
}
