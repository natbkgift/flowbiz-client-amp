import { createElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { Container } from '@/components/layout/Container';
import { cx } from '@/components/public/cx';
import type { PublicContainerVariant, PublicSectionTone } from '@/components/public-system/tokens/publicUiTokens';
import { publicSectionToneClassNames } from '@/components/public-system/tokens/publicUiTokens';

type SectionElement = 'section' | 'div' | 'aside';

export function Section({
  as = 'section',
  children,
  className,
  container = 'default',
  contentClassName,
  tone = 'default',
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: SectionElement;
  children: ReactNode;
  container?: PublicContainerVariant | 'none';
  contentClassName?: string;
  tone?: PublicSectionTone;
}) {
  const Tag = as;
  const content = container === 'none'
    ? children
    : (
        <Container variant={container}>
          {contentClassName ? <div className={contentClassName}>{children}</div> : children}
        </Container>
      );

  return createElement(
    Tag,
    {
      className: cx(publicSectionToneClassNames[tone], className),
      ...props,
    },
    content,
  );
}
