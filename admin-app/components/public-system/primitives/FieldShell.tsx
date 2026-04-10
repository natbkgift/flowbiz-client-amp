import type { ReactNode } from 'react';

import { cx } from '@/components/public/cx';

export function FieldShell({
  children,
  className,
  error,
  errorId,
  helper,
  helperClassName,
  helperId,
  label,
  labelClassName,
  labelFor,
  requiredMark,
}: {
  children: ReactNode;
  className?: string;
  error?: ReactNode;
  errorId?: string;
  helper?: ReactNode;
  helperClassName?: string;
  helperId?: string;
  label?: ReactNode;
  labelClassName?: string;
  labelFor?: string;
  requiredMark?: ReactNode;
}) {
  return (
    <div className={cx('public-field-shell', className)}>
      {label ? (
        <label htmlFor={labelFor} className={cx('form-label', 'public-field-shell__label', labelClassName)}>
          <span>{label}</span>
          {requiredMark ? <span className="public-field-required">{requiredMark}</span> : null}
        </label>
      ) : null}
      {children}
      {helper ? (
        <p id={helperId} className={cx('form-helper', 'public-field-shell__helper', helperClassName)}>
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="form-error public-field-shell__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
