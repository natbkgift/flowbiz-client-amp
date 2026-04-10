'use client';

import { useMemo, useState } from 'react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { SafeCoverImage } from '@/components/media/SafeCoverImage';

function normalizeYouTubeId(value: string): string | null {
  const trimmed = value.trim();
  return /^[A-Za-z0-9_-]{6,20}$/.test(trimmed) ? trimmed : null;
}

export function HomeVideoEmbedCard({
  locale,
  title,
  topic,
  caption,
  thumbSrc,
  ytId,
  relatedHref,
  actionLabel,
  nextStepPayload,
  youtubePayload,
}: {
  locale: 'en' | 'th';
  title: string;
  topic: string;
  caption: string;
  thumbSrc: string;
  ytId: string;
  relatedHref: string;
  actionLabel: string;
  nextStepPayload: Record<string, unknown>;
  youtubePayload: Record<string, unknown>;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const copy = locale === 'th'
    ? {
        playVideo: `เล่นวิดีโอ ${title}`,
        tapToPlay: 'แตะเพื่อเล่นวิดีโอ',
        curatedMedia: 'วิดีโอแนะนำจากทีม',
        openYoutube: 'เปิดบน YouTube',
      }
    : {
        playVideo: `Play video ${title}`,
        tapToPlay: 'Tap to play video',
        curatedMedia: 'Curated advisory media',
        openYoutube: 'Open on YouTube',
      };
  const safeYtId = useMemo(() => normalizeYouTubeId(ytId), [ytId]);
  const embedSrc = safeYtId
    ? `https://www.youtube.com/embed/${safeYtId}?autoplay=1&rel=0`
    : null;
  const watchHref = safeYtId ? `https://www.youtube.com/watch?v=${safeYtId}` : 'https://www.youtube.com/@AssetManagementProperty';

  return (
    <figure className="home-video-card rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
      <div className="relative aspect-video bg-gray-900">
        {embedSrc && isLoaded ? (
          <iframe
            className="w-full h-full"
            src={embedSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            className="home-video-card__embed-trigger"
            onClick={() => setIsLoaded(true)}
            aria-label={copy.playVideo}
            disabled={!embedSrc}
          >
            <SafeCoverImage
              src={thumbSrc}
              alt={title}
              className="home-video-card__poster"
              sizes="(max-width: 767px) 100vw, 50vw"
              fallbackSrc="/images/project-overview.png"
              unoptimized={false}
            />
            <span className="home-video-card__embed-scrim" aria-hidden="true" />
            <span className="home-video-card__play-badge" aria-hidden="true">▶</span>
            <span className="home-video-card__play-copy">{copy.tapToPlay}</span>
          </button>
        )}
      </div>
      <figcaption className="home-video-card__body type-small px-5 py-4 text-gray-600 min-h-[72px]">
        <div className="home-video-card__meta">
          <span>{topic}</span>
          <span>{copy.curatedMedia}</span>
        </div>
        <h3 className="home-video-card__title type-h3">{title}</h3>
        <p>{caption}</p>
        <div className="home-video-card__actions">
          <TrackedLink
            className="home-video-card__link"
            href={relatedHref}
            eventType="home_advisory_content_click"
            eventPayload={nextStepPayload}
          >
            {actionLabel}
          </TrackedLink>
          <TrackedLink
            className="home-video-card__link home-video-card__link--secondary"
            href={watchHref}
            eventType="home_advisory_content_click"
            eventPayload={youtubePayload}
          >
            {copy.openYoutube}
          </TrackedLink>
        </div>
      </figcaption>
    </figure>
  );
}
