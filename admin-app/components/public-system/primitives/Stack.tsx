import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/components/public/cx';
import type { PublicStackGap } from '@/components/public-system/tokens/publicUiTokens';
import { publicStackGapClassNames } from '@/components/public-system/tokens/publicUiTokens';

type StackElement = 'div' | 'section' | 'article' | 'aside';

export function Stack({
  as = 'div',
  children,
  className,
  gap = 'default',
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: StackElement;
  children: ReactNode;
  gap?: PublicStackGap;
}) {
  return createElement(
    as,
    {
      className: cx('public-stack', publicStackGapClassNames[gap], className),
      ...props,
    },
    children,
  );
}
