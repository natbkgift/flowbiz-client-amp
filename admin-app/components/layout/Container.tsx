import type { ReactNode } from 'react';

export function Container({
  children,
  variant,
}: {
  children: ReactNode;
  variant?: 'default' | 'wide' | 'full' | 'readable';
}) {
  const cls =
    variant === 'wide'
      ? 'container--wide'
      : variant === 'full'
        ? 'container--full'
        : variant === 'readable'
          ? 'container--readable'
        : 'container';
  return <div className={cls}>{children}</div>;
}
