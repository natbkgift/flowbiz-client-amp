import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const fixtureApiScript = fs.readFileSync(
  path.join(process.cwd(), 'scripts/local-public-fixture-api.mjs'),
  'utf8',
);

describe('local public fixture API contract', () => {
  it('serves the public API routes needed by data-backed visual QA', () => {
    expect(fixtureApiScript).toContain('"/v1/projects"');
    expect(fixtureApiScript).toContain('"/v1/properties"');
    expect(fixtureApiScript).toContain('"/v1/areas"');
    expect(fixtureApiScript).toContain('"/v1/content/blog-posts"');
    expect(fixtureApiScript).toContain('"/v1/seo/resolve"');
    expect(fixtureApiScript).toContain('/^\\/v1\\/projects\\/slug\\/([^/]+)$/');
    expect(fixtureApiScript).toContain('/^\\/v1\\/projects\\/([^/]+)\\/evaluation$/');
    expect(fixtureApiScript).toContain('/^\\/v1\\/properties\\/slug\\/([^/]+)$/');
    expect(fixtureApiScript).toContain('/^\\/v1\\/properties\\/([^/]+)$/');
  });

  it('covers the Phase 3A project data states without Claude prototype sample data', () => {
    expect(fixtureApiScript).toContain('skyline-ocean-premier');
    expect(fixtureApiScript).toContain('jomtien-horizon-under-construction');
    expect(fixtureApiScript).toContain('pratumnak-quiet-residence');
    expect(fixtureApiScript).toContain('status: "under_construction"');
    expect(fixtureApiScript).toContain('starting_price: null');
    expect(fixtureApiScript).toContain('developer: null');
  });

  it('covers the Phase 3B property data states needed for data-backed public QA', () => {
    expect(fixtureApiScript).toContain('central-pattaya-1br-rent-complete');
    expect(fixtureApiScript).toContain('wongamat-gallery-3br-many-images');
    expect(fixtureApiScript).toContain('naklua-compact-no-media-fallback');
    expect(fixtureApiScript).toContain('pratumnak-resale-quiet-2br');
    expect(fixtureApiScript).toContain('images: null');
    expect(fixtureApiScript).toContain('description: null');
    expect(fixtureApiScript).toContain('buildCurrentShortlist');
    expect(fixtureApiScript).toContain('shortlist_phase3b_fixture');
    expect(fixtureApiScript).toContain('fixture: "amp-public-phase3b"');
  });

  it('keeps Phase 3C visual baseline fixture states addressable by slug and shortlist id', () => {
    expect(fixtureApiScript).toContain('skyline-ocean-premier-2br-sea-view');
    expect(fixtureApiScript).toContain('central-pattaya-1br-rent-complete');
    expect(fixtureApiScript).toContain('naklua-compact-no-media-fallback');
    expect(fixtureApiScript).toContain('prop_skyline_2br_sea_view');
    expect(fixtureApiScript).toContain('prop_rent_central_1br_complete');
    expect(fixtureApiScript).toContain('prop_naklua_compact_no_media');
    expect(fixtureApiScript).toContain('buildShortlistItem');
    expect(fixtureApiScript).toContain('const propertyIdMatch = normalizedPath.match(/^\\/v1\\/properties\\/([^/]+)$/);');
  });
});
