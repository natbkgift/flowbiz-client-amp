import { describe, expect, it } from 'vitest';

import {
  isKnownStalePublicMediaPath,
  pickRenderableLocalMedia,
  resolveRenderableLocalMediaPath,
} from '@/app/_lib/local-media';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';

describe('public media render guard', () => {
  it('suppresses the known stale home media paths before they hit the browser', () => {
    expect(isKnownStalePublicMediaPath('/media/library/1abee367-4ebc-4adc-b49d-4220c8df5cd5.png')).toBe(true);
    expect(resolveRenderableLocalMediaPath('/media/library/a03637e4-6436-493f-9dce-bdb182b4f96a.png?v=batch3')).toBeNull();
    expect(resolveImageUrl('/media/library/1abee367-4ebc-4adc-b49d-4220c8df5cd5.png')).toBeNull();
  });

  it('falls through to the next healthy local media candidate', () => {
    expect(pickRenderableLocalMedia({
      cover_image: '/media/library/1abee367-4ebc-4adc-b49d-4220c8df5cd5.png',
      images: ['/media/system/a2-probe.avif'],
    })).toBe('/media/system/a2-probe.avif');
  });

  it('keeps healthy local media renderable', () => {
    expect(resolveRenderableLocalMediaPath('/media/system/a2-probe.avif')).toBe('/media/system/a2-probe.avif');
    expect(resolveImageUrl('/media/project-covers/the-orient-jomtien/cover_6359a2b6dcc5.webp')).toBe(
      '/media/project-covers/the-orient-jomtien/cover_6359a2b6dcc5.webp',
    );
  });
});
