import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('public visual QA contract', () => {
  it('supports deterministic detail-route overrides and fallback slugs', () => {
    const script = read('scripts/run-public-visual-qa.mjs');

    expect(script).toContain('PUBLIC_VISUAL_PROJECT_SLUG');
    expect(script).toContain('PUBLIC_VISUAL_PROPERTY_SLUG');
    expect(script).toContain('PUBLIC_VISUAL_PROJECT_FALLBACK_SLUG');
    expect(script).toContain('PUBLIC_VISUAL_PROPERTY_FALLBACK_SLUG');
    expect(script).toContain('"visual-qa-project"');
    expect(script).toContain('"visual-qa-property"');
    expect(script).toContain('detailRouteSources');
    expect(script).toContain('detailRouteStatus');
    expect(script).toContain('"fallback"');
    expect(script).toContain('"override"');
  });

  it('ignores expected navigation aborts so the network log only keeps actionable failures', () => {
    const script = read('scripts/run-public-visual-qa.mjs');

    expect(script).toContain('function shouldIgnoreRequestFailure');
    expect(script).toContain('errorText === "net::ERR_ABORTED"');
    expect(script).toContain('if (shouldIgnoreRequestFailure(request)) return;');
  });

  it('uses a weighted scorecard with detailed dimension breakdowns and aggregate findings', () => {
    const script = read('scripts/run-public-visual-qa.mjs');

    expect(script).toContain('const SCORE_MODEL_VERSION = "public-visual-qa-v3"');
    expect(script).toContain('const SCORE_DIMENSIONS = [');
    expect(script).toContain('runtimeHealth');
    expect(script).toContain('layoutIntegrity');
    expect(script).toContain('semanticsAndLandmarks');
    expect(script).toContain('interactionReadiness');
    expect(script).toContain('mobileSafety');
    expect(script).toContain('mediaStability');
    expect(script).toContain('contentClarity');
    expect(script).toContain('localeIntegrity');
    expect(script).toContain('typographyMetrics');
    expect(script).toContain('spacingRhythm');
    expect(script).toContain('ctaHierarchy');
    expect(script).toContain('sectionAwareHomepage');
    expect(script).toContain('scoreThresholds');
    expect(script).toContain('dimensionAverages');
    expect(script).toContain('byRoute');
    expect(script).toContain('byLocale');
    expect(script).toContain('byBreakpoint');
    expect(script).toContain('topFindings');
    expect(script).toContain('warningFindings');
    expect(script).toContain('screenshotChecklist');
    expect(script).toContain('checklistSummary');
    expect(script).toContain('topChecklistConcerns');
    expect(script).toContain('dimensionScores');
    expect(script).toContain('findingCounts');
    expect(script).toContain('buildHomepageChecklist');
    expect(script).toContain('smallTapTargetCount');
    expect(script).toContain('heroTitleMetrics');
    expect(script).toContain('homepageSectionGaps');
    expect(script).toContain('cardPaddingSamples');
    expect(script).toContain('curatedEmptyStatePresent');
    expect(script).toContain('spacing-section-padding-off-scale');
    expect(script).toContain('manualReviewFile');
    expect(script).toContain('matchedCaptures');
    expect(script).toContain('unmatchedEntries');
    expect(script).toContain('PUBLIC_VISUAL_REVIEW_FILE');
    expect(script).toContain('loadManualScreenshotReviews');
    expect(script).toContain('source: "manual"');
  });
});
