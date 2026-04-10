import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/components/public/cx';
import type {
  PublicTextTone,
  PublicTextVariant,
} from '@/components/public-system/tokens/publicUiTokens';
import {
  publicTextToneClassNames,
  publicTextVariantClassNames,
} from '@/components/public-system/tokens/publicUiTokens';

type TextElement = 'p' | 'span' | 'div';

export function Text({
  as = 'p',
  children,
  className,
  tone = 'default',
  variant = 'body',
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: TextElement;
  children: ReactNode;
  tone?: PublicTextTone;
  variant?: PublicTextVariant;
}) {
  return createElement(
    as,
    {
      className: cx(
        publicTextVariantClassNames[variant],
        publicTextToneClassNames[tone],
        className,
      ),
      ...props,
    },
    children,
  );
}
