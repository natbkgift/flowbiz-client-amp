import { cx } from '@/components/public/cx';

export const PUBLIC_CONTAINER_VARIANTS = ['default', 'wide', 'full', 'readable'] as const;
export type PublicContainerVariant = (typeof PUBLIC_CONTAINER_VARIANTS)[number];

export const publicSectionToneClassNames = {
  default: 'section',
  alt: 'section section--alt',
  cta: 'section section--cta',
} as const;

export type PublicSectionTone = keyof typeof publicSectionToneClassNames;

export const publicStackGapClassNames = {
  compact: 'public-stack--compact',
  default: 'public-stack--default',
  relaxed: 'public-stack--relaxed',
} as const;

export type PublicStackGap = keyof typeof publicStackGapClassNames;

export const publicGridColumnClassNames = {
  1: 'public-grid--cols-1',
  2: 'public-grid--cols-2',
  3: 'public-grid--cols-3',
} as const;

export type PublicGridColumns = keyof typeof publicGridColumnClassNames;
export type PublicGridGap = PublicStackGap;

export const publicGridGapClassNames = {
  compact: 'public-grid--compact',
  default: 'public-grid--default',
  relaxed: 'public-grid--relaxed',
} as const;

export const publicButtonVariantClassNames = {
  cta: 'btn-cta',
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  tertiary: 'btn-tertiary',
  link: 'btn-tertiary',
  coral: 'btn-coral',
  ink: 'btn-ink',
  paper: 'btn-paper',
} as const;

export type PublicButtonVariant = keyof typeof publicButtonVariantClassNames;
export type PublicButtonSize = 'md' | 'sm';

export function getPublicButtonClassName({
  className,
  fullWidth = false,
  size = 'md',
  variant = 'primary',
}: {
  className?: string;
  fullWidth?: boolean;
  size?: PublicButtonSize;
  variant?: PublicButtonVariant;
} = {}): string {
  return cx(
    'btn',
    publicButtonVariantClassNames[variant],
    size === 'sm' && 'btn-sm',
    fullWidth && 'btn-block',
    className,
  );
}

export const publicCardToneClassNames = {
  light: null,
  warm: 'public-surface-card--warm',
  deep: 'public-surface-card--deep',
  premium: 'public-surface-card--premium',
  flat: 'public-surface-card--flat',
} as const;

export type PublicCardTone = keyof typeof publicCardToneClassNames;

export const publicCardPaddingClassNames = {
  none: null,
  compact: 'public-card-base--pad-compact',
  default: 'public-card-base--pad-default',
  relaxed: 'public-card-base--pad-relaxed',
} as const;

export type PublicCardPadding = keyof typeof publicCardPaddingClassNames;

export const publicTextVariantClassNames = {
  body: 'type-body',
  lead: 'type-body public-text--lead',
  small: 'type-small',
  label: 'type-label',
  caption: 'type-caption',
} as const;

export type PublicTextVariant = keyof typeof publicTextVariantClassNames;

export const publicTextToneClassNames = {
  default: null,
  muted: 'public-text--muted',
  meta: 'public-text--meta',
  inverse: 'public-text--inverse',
} as const;

export type PublicTextTone = keyof typeof publicTextToneClassNames;

export const publicHeadingClassNames = {
  h1: 'type-h1',
  h2: 'type-h2',
  h3: 'type-h3',
  h4: 'type-h4',
} as const;

export type PublicHeadingLevel = keyof typeof publicHeadingClassNames;
