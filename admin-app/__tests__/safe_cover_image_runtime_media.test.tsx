import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SafeCoverImage } from '@/components/media/SafeCoverImage';

const imagePropsLog: Array<Record<string, unknown>> = [];

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    imagePropsLog.push(props);
    return <img alt={String(props.alt ?? '')} data-testid="safe-cover-image" />;
  },
}));

describe('SafeCoverImage runtime media handling', () => {
  beforeEach(() => {
    imagePropsLog.length = 0;
  });

  it('bypasses Next image optimization for runtime media routes even when optimization is requested', () => {
    render(
      <SafeCoverImage
        src="/media/system/a2-probe.avif"
        alt="Runtime media"
        unoptimized={false}
        ssrStartWithPrimary
      />,
    );

    const latestProps = imagePropsLog.at(-1);
    expect(latestProps?.src).toBe('/api/media/system/a2-probe.avif');
    expect(latestProps?.unoptimized).toBe(true);
    expect(typeof latestProps?.loader).toBe('function');
  });

  it('keeps static image optimization enabled for public assets when requested', () => {
    render(
      <SafeCoverImage
        src="/images/project-overview.png"
        alt="Static media"
        unoptimized={false}
        ssrStartWithPrimary
      />,
    );

    const latestProps = imagePropsLog.at(-1);
    expect(latestProps?.src).toBe('/images/project-overview.png');
    expect(latestProps?.unoptimized).toBe(false);
    expect(latestProps?.loader).toBeUndefined();
  });
});
