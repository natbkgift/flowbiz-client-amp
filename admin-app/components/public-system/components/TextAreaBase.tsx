import type { TextareaHTMLAttributes } from 'react';

import { cx } from '@/components/public/cx';

export function TextAreaBase({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('form-textarea', className)} {...props} />;
}
