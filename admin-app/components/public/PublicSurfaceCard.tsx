import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from './cx';

type SurfaceElement = 'div' | 'section' | 'article' | 'aside';

export function PublicSurfaceCard({
  as = 'div',
  children,
  className,
  interactive = false,
  tone = 'light',
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: SurfaceElement;
  children: ReactNode;
  interactive?: boolean;
  tone?: 'light' | 'warm' | 'deep';
}) {
  return createElement(
    as,
    {
      className: cx(
        'public-surface-card',
        tone === 'warm' && 'public-surface-card--warm',
        tone === 'deep' && 'public-surface-card--deep',
        interactive && 'public-surface-card--interactive',
        className,
      ),
      ...props,
    },
    children,
  );
}
