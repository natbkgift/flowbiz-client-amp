import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '@/components/public/cx';

export type CTAGroupProps = HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'center';
  children: ReactNode;
  stackOnMobile?: boolean;
};

export function CTAGroup({
  align = 'start',
  children,
  className,
  stackOnMobile = false,
  ...props
}: CTAGroupProps) {
  return (
    <div
      className={cx(
        'public-action-row',
        align === 'center' && 'public-action-row--center',
        stackOnMobile && 'public-action-row--stack-mobile',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
