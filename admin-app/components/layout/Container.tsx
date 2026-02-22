import type { ReactNode } from 'react';

export function Container({
  children,
  variant,
}: {
  children: ReactNode;
  variant?: 'default' | 'wide' | 'full';
}) {
  const cls =
    variant === 'wide'
      ? 'container--wide'
      : variant === 'full'
        ? 'container--full'
        : 'container';
  return <div className={cls}>{children}</div>;
}
