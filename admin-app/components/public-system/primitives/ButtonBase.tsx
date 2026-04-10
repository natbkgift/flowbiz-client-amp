import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { getPublicButtonClassName, type PublicButtonSize, type PublicButtonVariant } from '@/components/public-system/tokens/publicUiTokens';

export function ButtonBase({
  children,
  className,
  fullWidth,
  size,
  type = 'button',
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  fullWidth?: boolean;
  size?: PublicButtonSize;
  variant?: PublicButtonVariant;
}) {
  return (
    <button
      className={getPublicButtonClassName({ className, fullWidth, size, variant })}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
