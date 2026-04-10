import type { SelectHTMLAttributes } from 'react';

import { cx } from '@/components/public/cx';

export function SelectBase({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx('form-select', className)} {...props} />;
}
