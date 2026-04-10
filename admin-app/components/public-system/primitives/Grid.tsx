import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/components/public/cx';
import type { PublicGridColumns, PublicGridGap } from '@/components/public-system/tokens/publicUiTokens';
import {
  publicGridColumnClassNames,
  publicGridGapClassNames,
} from '@/components/public-system/tokens/publicUiTokens';

type GridElement = 'div' | 'section';

export function Grid({
  as = 'div',
  children,
  className,
  columns = 2,
  gap = 'default',
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: GridElement;
  children: ReactNode;
  columns?: PublicGridColumns;
  gap?: PublicGridGap;
}) {
  return createElement(
    as,
    {
      className: cx(
        'public-grid',
        publicGridColumnClassNames[columns],
        publicGridGapClassNames[gap],
        className,
      ),
      ...props,
    },
    children,
  );
}
