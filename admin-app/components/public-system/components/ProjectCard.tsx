import Link from 'next/link';

import { SafeCoverImage } from '@/components/media/SafeCoverImage';
import { cx } from '@/components/public/cx';
import { Button } from '@/components/public-system/components/Button';
import { Chip } from '@/components/public-system/components/Chip';
import { CardBase } from '@/components/public-system/primitives/CardBase';

export type PublicProjectCardData = {
  id: string;
  name: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  location: string;
  startingPriceLabel?: string;
  completionLabel?: string;
  statusLabel?: string;
  highlights?: string[];
};

export type ProjectCardProps = {
  project: PublicProjectCardData;
  className?: string;
  ctaLabel?: string;
  fallbackImageSrc?: string;
  imagePriority?: boolean;
  imageSizes?: string;
};

const DEFAULT_PROJECT_FALLBACK = '/images/project-overview.png';

export function ProjectCard({
  project,
  className,
  ctaLabel = 'View Project',
  fallbackImageSrc = DEFAULT_PROJECT_FALLBACK,
  imagePriority = false,
  imageSizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
}: ProjectCardProps) {
  const highlights = project.highlights?.filter((item) => item.trim().length > 0) ?? [];
  const cardLabel = `${project.name}, ${project.location}`;

  return (
    <CardBase
      as="article"
      interactive
      className={cx('public-amp-card public-amp-card--interactive public-card-foundation public-project-card', className)}
      aria-label={cardLabel}
    >
      <div className="public-card-foundation__media">
        <Link href={project.href} className="public-card-foundation__media-link" aria-label={`${ctaLabel}: ${project.name}`}>
          <SafeCoverImage
            src={project.imageSrc}
            alt={project.imageAlt}
            fallbackSrc={fallbackImageSrc}
            priority={imagePriority}
            loading={imagePriority ? 'eager' : 'lazy'}
            sizes={imageSizes}
            className="public-card-foundation__image"
            ssrStartWithPrimary
          />
        </Link>

        {project.statusLabel ? (
          <div className="public-card-foundation__badges" aria-label="Project badges">
            <Chip size="sm" tone="accent" className="public-card-foundation__badge">
              {project.statusLabel}
            </Chip>
          </div>
        ) : null}
      </div>

      <div className="public-card-foundation__body">
        <div className="public-card-foundation__meta-row">
          <span className="public-card-foundation__location">{project.location}</span>
          {project.completionLabel ? <span className="public-card-foundation__type">{project.completionLabel}</span> : null}
        </div>

        <div className="public-card-foundation__headline">
          <h3 className="public-amp-card-title public-card-foundation__title">
            <Link href={project.href} className="public-card-foundation__title-link">
              {project.name}
            </Link>
          </h3>
          {project.startingPriceLabel ? <p className="public-card-foundation__price">{project.startingPriceLabel}</p> : null}
        </div>

        {highlights.length ? (
          <ul className="public-card-foundation__highlights" aria-label="Project highlights">
            {highlights.map((highlight, index) => (
              <li key={`${highlight}-${index}`} className="public-card-foundation__highlight">
                {highlight}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="public-card-foundation__footer">
          <Button href={project.href} variant="primary" className="public-card-foundation__cta">
            {ctaLabel}
          </Button>
        </div>
      </div>
    </CardBase>
  );
}
