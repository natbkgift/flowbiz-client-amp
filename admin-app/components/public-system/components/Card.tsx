import type { ReactNode } from 'react';

import { cx } from '@/components/public/cx';
import { CardBase } from '@/components/public-system/primitives/CardBase';
import { Heading } from '@/components/public-system/primitives/Heading';
import { Stack } from '@/components/public-system/primitives/Stack';
import { Text } from '@/components/public-system/primitives/Text';
import type {
  PublicCardPadding,
  PublicCardTone,
} from '@/components/public-system/tokens/publicUiTokens';

export function Card({
  children,
  className,
  description,
  eyebrow,
  footer,
  interactive = false,
  padding = 'default',
  title,
  titleAs = 'h3',
  tone = 'light',
}: {
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  interactive?: boolean;
  padding?: PublicCardPadding;
  title?: ReactNode;
  titleAs?: 'h2' | 'h3' | 'h4';
  tone?: PublicCardTone;
}) {
  return (
    <CardBase className={cx('public-card', className)} interactive={interactive} padding={padding} tone={tone}>
      <Stack gap="compact">
        {eyebrow ? <Text as="p" variant="label" tone="meta">{eyebrow}</Text> : null}
        {title ? <Heading as={titleAs} level={titleAs} className="card-title">{title}</Heading> : null}
        {description ? <Text as="p" variant="small" tone="muted" className="card-subtitle">{description}</Text> : null}
        {children}
        {footer ? <div className="public-card__footer">{footer}</div> : null}
      </Stack>
    </CardBase>
  );
}
