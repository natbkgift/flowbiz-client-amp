import type { ReactNode } from 'react';

export function Container({
  children,
  variant,
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'wide' | 'full' | 'readable';
  className?: string;
}) {
  const cls =
    variant === 'wide'
      ? 'container--wide'
      : variant === 'full'
        ? 'container--full'
        : variant === 'readable'
          ? 'container--readable'
        : 'container';
  return <div className={`${cls} ${className ?? ''}`.trim()}>{children}</div>;
}
