import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from './cx';

type PublicChipElement = 'span' | 'div';

export function PublicChip({
  as = 'span',
  children,
  className,
  size = 'md',
  tone = 'neutral',
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: PublicChipElement;
  children: ReactNode;
  size?: 'sm' | 'md';
  tone?: 'neutral' | 'accent' | 'deep';
}) {
  return createElement(
    as,
    {
      className: cx(
        'public-chip',
        size === 'sm' && 'public-chip--sm',
        tone === 'accent' && 'public-chip--accent',
        tone === 'deep' && 'public-chip--deep',
        className,
      ),
      ...props,
    },
    children,
  );
}
