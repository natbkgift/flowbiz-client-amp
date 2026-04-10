import type { ReactNode } from 'react';

import { cx } from '@/components/public/cx';
import { Section } from '@/components/public-system/primitives/Section';
import { Stack } from '@/components/public-system/primitives/Stack';
import { SectionHeader, type SectionHeaderProps } from '@/components/public-system/components/SectionHeader';
import type {
  PublicContainerVariant,
  PublicSectionTone,
} from '@/components/public-system/tokens/publicUiTokens';

export function SectionIntroBlock({
  children,
  container = 'wide',
  contentClassName,
  headerClassName,
  sectionClassName,
  title,
  tone = 'default',
  ...headerProps
}: Omit<SectionHeaderProps, 'className' | 'title'> & {
  children: ReactNode;
  container?: PublicContainerVariant;
  contentClassName?: string;
  headerClassName?: string;
  sectionClassName?: string;
  title: ReactNode;
  tone?: PublicSectionTone;
}) {
  return (
    <Section className={sectionClassName} container={container} tone={tone}>
      <Stack gap="relaxed" className={cx('public-section-block__content', contentClassName)}>
        <SectionHeader className={headerClassName} title={title} {...headerProps} />
        {children}
      </Stack>
    </Section>
  );
}
