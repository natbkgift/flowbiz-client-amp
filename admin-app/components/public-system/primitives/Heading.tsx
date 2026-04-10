import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/components/public/cx';
import type { PublicHeadingLevel } from '@/components/public-system/tokens/publicUiTokens';
import { publicHeadingClassNames } from '@/components/public-system/tokens/publicUiTokens';

type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';

export function Heading({
  as = 'h2',
  children,
  className,
  level = as === 'p' || as === 'div' ? 'h2' : as,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: HeadingElement;
  children: ReactNode;
  level?: PublicHeadingLevel;
}) {
  return createElement(
    as,
    {
      className: cx(publicHeadingClassNames[level], className),
      ...props,
    },
    children,
  );
}
