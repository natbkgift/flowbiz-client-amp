import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/components/public/cx';
import { Heading } from '@/components/public-system/primitives/Heading';
import { Text } from '@/components/public-system/primitives/Text';

type TitleTag = 'h1' | 'h2' | 'h3' | 'h4';
type WrapperTag = 'div' | 'header';
type ParagraphProps = HTMLAttributes<HTMLParagraphElement> & {
  [key: `data-${string}`]: string | number | undefined;
};

export type SectionHeaderProps = {
  actions?: ReactNode;
  actionsClassName?: string;
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
};

export function SectionHeader({
  actions,
  actionsClassName,
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
}: SectionHeaderProps) {
  return createElement(
    as,
    {
      className: cx(
        'section-header',
        'public-section-header',
        align === 'start' && 'public-section-header--start',
        Boolean(actions) && 'public-section-header--with-actions',
        className,
      ),
    },
    <>
      <div className="public-section-header__copy">
        {kicker ? (
          <Text as="p" variant="label" className={cx('public-section-kicker', kickerClassName)} {...kickerProps}>
            {kicker}
          </Text>
        ) : null}
        <Heading as={titleAs} level={titleAs} className={cx('section-title', titleClassName)} id={titleId}>
          {title}
        </Heading>
        {subtitle ? (
          <Text
            as="p"
            variant="body"
            tone="muted"
            className={cx('section-subtitle', subtitleClassName)}
            {...subtitleProps}
          >
            {subtitle}
          </Text>
        ) : null}
      </div>
      {actions ? (
        <div className={cx('public-section-header__actions', actionsClassName)}>
          {actions}
        </div>
      ) : null}
    </>,
  );
}
