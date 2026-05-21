import Link from 'next/link';

import type { LocalMediaInput } from '@/app/_lib/local-media';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';
import { PublicChip } from '@/components/public/PublicChip';

type ProjectCardBadge = {
  key: string;
  label: string;
};

export type ProjectCardProps = {
  href: string;
  name: string;
  locale: 'en' | 'th';
  media: LocalMediaInput;
  fallbackImage: string;
  area?: string | null;
  price?: string | null;
  summary?: string | null;
  badges?: ProjectCardBadge[];
  facts?: string[];
  signals?: string[];
  ctaLabel: string;
  ctaClassName?: string;
  hasLocalMedia?: boolean;
  shouldPreloadMedia?: boolean;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  quality?: number;
  unoptimized?: boolean;
  prefetch?: false;
  ssrStartWithPrimary?: boolean;
};

export function ProjectCard({
  href,
  name,
  locale,
  media,
  fallbackImage,
  area,
  price,
  summary,
  badges = [],
  facts = [],
  signals = [],
  ctaLabel,
  ctaClassName,
  hasLocalMedia = false,
  shouldPreloadMedia = false,
  loading,
  fetchPriority,
  quality,
  unoptimized,
  prefetch = false,
  ssrStartWithPrimary,
}: ProjectCardProps) {
  const imageLoading = loading ?? (shouldPreloadMedia ? 'eager' : 'lazy');
  const imageFetchPriority = fetchPriority ?? (shouldPreloadMedia ? 'low' : 'auto');
  const imageQuality = quality ?? 60;
  const imageUnoptimized = unoptimized ?? false;
  const imageSsrStart = ssrStartWithPrimary ?? shouldPreloadMedia;
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className="premium-project-card reveal card-interactive public-surface-card public-surface-card--interactive public-surface-card--warm"
    >
      <div className="card-image premium-project-card__media">
        <LocalMediaImage
          media={media}
          alt={name}
          altFallback={locale === 'th' ? `ภาพประกอบโครงการ ${name}` : `Project image for ${name}`}
          className="media-shell"
          imageClassName={`absolute inset-0 h-full w-full object-cover ${hasLocalMedia ? '' : 'premium-project-card__fallback-image'}`}
          fallbackSrc={fallbackImage}
          sizes="(max-width: 767px) 92vw, (max-width: 1279px) 48vw, 31vw"
          loading={imageLoading}
          fetchPriority={imageFetchPriority}
          quality={imageQuality}
          unoptimized={imageUnoptimized}
          ssrStartWithPrimary={imageSsrStart}
        />
        <div className="premium-project-card__media-scrim" aria-hidden="true" />
        {badges.length > 0 ? (
          <div className="premium-project-card__badges" aria-label={locale === 'th' ? 'ป้ายกำกับโครงการ' : 'Project badges'}>
            {badges.map((badge) => (
              <PublicChip key={badge.key} as="span" tone="accent" size="sm" className="premium-badge">
                {badge.label}
              </PublicChip>
            ))}
          </div>
        ) : null}
      </div>
      <div className="card-content premium-project-card__body">
        <div className="premium-project-card__header">
          <h3 className="card-title premium-project-card__title">{name}</h3>
          {area ? <p className="premium-project-card__area">{area}</p> : null}
        </div>

        {price ? (
          <div className="premium-project-card__price-row">
            <span className="premium-project-card__price-label">{locale === 'th' ? 'เริ่มต้น' : 'From'}</span>
            <span className="premium-project-card__price-value">{price}</span>
          </div>
        ) : null}

        {signals.length > 0 ? (
          <div className="premium-project-card__signals" aria-label={locale === 'th' ? 'สัญญาณการตัดสินใจของโครงการ' : 'Project decision cues'}>
            {signals.map((signal) => (
              <PublicChip key={signal} as="span" size="sm" className="premium-project-card__signal">
                {signal}
              </PublicChip>
            ))}
          </div>
        ) : null}

        {summary ? (
          <p className="premium-project-card__summary line-clamp-2">
            {summary}
          </p>
        ) : null}

        {facts.length > 0 ? (
          <ul className="premium-project-card__facts" aria-label={locale === 'th' ? 'ข้อเท็จจริงของโครงการ' : 'Project facts'}>
            {facts.map((fact) => (
              <li key={fact} className="premium-project-card__fact-item">
                <span className="premium-project-card__fact-value text-left">{fact}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="premium-project-card__footer">
          <span className={ctaClassName ?? 'premium-project-card__cta'}>
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
