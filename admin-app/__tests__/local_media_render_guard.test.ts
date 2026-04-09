import { describe, expect, it } from 'vitest';

import {
  isKnownStalePublicMediaPath,
  pickRenderableLocalMedia,
  resolveRenderableLocalMediaPath,
  toRuntimeLocalMediaPath,
} from '@/app/_lib/local-media';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';

describe('public media render guard', () => {
  it('suppresses the known stale home media paths before they hit the browser', () => {
    expect(isKnownStalePublicMediaPath('/media/library/1abee367-4ebc-4adc-b49d-4220c8df5cd5.png')).toBe(true);
    expect(resolveRenderableLocalMediaPath('/media/library/a03637e4-6436-493f-9dce-bdb182b4f96a.png?v=batch3')).toBeNull();
    expect(resolveRenderableLocalMediaPath('/media/project-covers/the-riviera-palm-beach/cover_1789e74af538.jpg')).toBeNull();
    expect(resolveRenderableLocalMediaPath('/media/project-covers/the-riviera-beverly-hills/cover_7cdacbe8818f.webp')).toBeNull();
    expect(resolveRenderableLocalMediaPath('/media/import-assets/units-buy/amp-s010126-arom-jomtien/asset_243dee6db6de.jpg')).toBeNull();
    expect(resolveRenderableLocalMediaPath('/media/import-assets/units-buy/amp-s020126-grand-solaire-pattaya/asset_519ffbb705c0.jpg')).toBeNull();
    expect(resolveImageUrl('/media/library/1abee367-4ebc-4adc-b49d-4220c8df5cd5.png')).toBeNull();
  });

  it('falls through to the next healthy local media candidate', () => {
    expect(pickRenderableLocalMedia({
      cover_image: '/media/library/1abee367-4ebc-4adc-b49d-4220c8df5cd5.png',
      images: ['/media/system/a2-probe.avif'],
    })).toBe('/api/media/system/a2-probe.avif');
  });

  it('keeps healthy local media renderable', () => {
    expect(toRuntimeLocalMediaPath('/media/system/a2-probe.avif')).toBe('/api/media/system/a2-probe.avif');
    expect(resolveRenderableLocalMediaPath('/media/system/a2-probe.avif')).toBe('/api/media/system/a2-probe.avif');
    expect(resolveImageUrl('/media/project-covers/the-orient-jomtien/cover_6359a2b6dcc5.webp')).toBe(
      '/api/media/project-covers/the-orient-jomtien/cover_6359a2b6dcc5.webp',
    );
  });
});
