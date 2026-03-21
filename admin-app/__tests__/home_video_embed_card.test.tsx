import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomeVideoEmbedCard } from '@/components/home/HomeVideoEmbedCard';

vi.mock('@/components/analytics/TrackedLink', () => ({
  TrackedLink: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/components/media/SafeCoverImage', () => ({
  SafeCoverImage: ({ alt, className }: { alt: string; className?: string }) => (
    <img alt={alt} className={className} src="/poster.jpg" />
  ),
}));

describe('HomeVideoEmbedCard', () => {
  it('mounts the iframe only after the poster button is clicked', () => {
    const { container } = render(
      <HomeVideoEmbedCard
        locale="en"
        title={'Safe title <script>alert(1)</script>'}
        topic="Process"
        caption="Walkthrough"
        thumbSrc="https://img.youtube.com/vi/test/hqdefault.jpg"
        ytId="abc123_DEF4"
        relatedHref="/en/blog"
        actionLabel="Read next"
        nextStepPayload={{ cta: 'video_next_step' }}
        youtubePayload={{ cta: 'watch_on_youtube' }}
      />,
    );

    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /play video/i }));
    expect(container.querySelector('iframe')).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123_DEF4?autoplay=1&rel=0');
  });
});