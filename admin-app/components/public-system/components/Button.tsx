import Link from 'next/link';
import type { LinkProps } from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import type { PublicButtonSize, PublicButtonVariant } from '@/components/public-system/tokens/publicUiTokens';
import { getPublicButtonClassName } from '@/components/public-system/tokens/publicUiTokens';

type CommonProps = {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  size?: PublicButtonSize;
  variant?: PublicButtonVariant;
};

type ButtonAsButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined;
};

type ButtonAsLinkProps = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & Pick<LinkProps, 'prefetch'> & {
  external?: boolean;
  href: string;
};

export function Button(props: ButtonAsButtonProps | ButtonAsLinkProps) {
  const {
    children,
    className,
    fullWidth,
    size,
    variant,
    ...restProps
  } = props;

  const resolvedClassName = getPublicButtonClassName({ className, fullWidth, size, variant });

  if ('href' in restProps && typeof restProps.href === 'string') {
    const { external = false, href, prefetch = false, ...linkProps } = restProps;

    if (external) {
      return (
        <a className={resolvedClassName} href={href} {...linkProps}>
          {children}
        </a>
      );
    }

    return (
      <Link className={resolvedClassName} href={href} prefetch={prefetch} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { type = 'button', ...buttonProps } = restProps;
  return (
    <button className={resolvedClassName} type={type} {...buttonProps}>
      {children}
    </button>
  );
}
