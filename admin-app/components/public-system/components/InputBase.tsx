import type { InputHTMLAttributes } from 'react';

import { cx } from '@/components/public/cx';

export function InputBase({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('form-input', className)} {...props} />;
}
