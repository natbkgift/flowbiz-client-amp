import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from './cx';

type TitleTag = 'h1' | 'h2' | 'h3';
type WrapperTag = 'div' | 'header';
type ParagraphProps = HTMLAttributes<HTMLParagraphElement> & {
  [key: `data-${string}`]: string | number | undefined;
};

export function PublicSectionHeader({
  align = 'center',
  as = 'div',
  className,
  kicker,
  kickerClassName,
  kickerProps,
  subtitle,
  subtitleClassName,
  subtitleProps,
  title,
  titleAs = 'h2',
  titleClassName,
  titleId,
}: {
  align?: 'center' | 'start';
  as?: WrapperTag;
  className?: string;
  kicker?: ReactNode;
  kickerClassName?: string;
  kickerProps?: ParagraphProps;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  subtitleProps?: ParagraphProps;
  title: ReactNode;
  titleAs?: TitleTag;
  titleClassName?: string;
  titleId?: string;
}) {
  const WrapperTag = as;
  const TitleTag = titleAs;

  return createElement(
    WrapperTag,
    {
      className: cx(
        'section-header',
        'public-section-header',
        align === 'start' && 'public-section-header--start',
        className,
      ),
    },
    <>
      {kicker ? (
        <p className={cx('public-section-kicker', kickerClassName)} {...kickerProps}>
          {kicker}
        </p>
      ) : null}
      {createElement(
        TitleTag,
        {
          id: titleId,
          className: cx('section-title', titleClassName),
        },
        title,
      )}
      {subtitle ? (
        <p className={cx('section-subtitle', subtitleClassName)} {...subtitleProps}>
          {subtitle}
        </p>
      ) : null}
    </>,
  );
}
