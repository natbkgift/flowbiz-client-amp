import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/components/public/cx';
import type {
  PublicCardPadding,
  PublicCardTone,
} from '@/components/public-system/tokens/publicUiTokens';
import {
  publicCardPaddingClassNames,
  publicCardToneClassNames,
} from '@/components/public-system/tokens/publicUiTokens';

type SurfaceElement = 'div' | 'section' | 'article' | 'aside';

export type CardBaseProps = HTMLAttributes<HTMLElement> & {
  as?: SurfaceElement;
  children: ReactNode;
  interactive?: boolean;
  padding?: PublicCardPadding;
  tone?: PublicCardTone;
};

export function CardBase({
  as = 'div',
  children,
  className,
  interactive = false,
  padding = 'none',
  tone = 'light',
  ...props
}: CardBaseProps) {
  return createElement(
    as,
    {
      className: cx(
        'public-surface-card',
        publicCardToneClassNames[tone],
        interactive && 'public-surface-card--interactive',
        publicCardPaddingClassNames[padding],
        className,
      ),
      ...props,
    },
    children,
  );
}
