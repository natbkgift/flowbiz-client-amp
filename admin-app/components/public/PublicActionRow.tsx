import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from './cx';

export function PublicActionRow({
  children,
  className,
  stackOnMobile = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  stackOnMobile?: boolean;
}) {
  return (
    <div
      className={cx(
        'public-action-row',
        stackOnMobile && 'public-action-row--stack-mobile',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
