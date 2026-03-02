/**
 * SVG Icon System — AMP Pattaya
 * Consistent stroke-based icons (Heroicons/Lucide style)
 * All icons: 24x24 viewBox, 1.5 stroke-width, round caps/joins
 */
import type { ReactNode } from 'react';

type IconProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  'aria-label'?: string;
};

function IconWrap({ size = 'md', className = '', children, ...rest }: IconProps & { children: ReactNode }) {
  const sizeClass = size === 'sm' ? 'icon--sm' : size === 'lg' ? 'icon--lg' : size === 'xl' ? 'icon--xl' : '';
  return (
    <span className={`icon ${sizeClass} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
}

export function IconBed(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7v11" />
        <path d="M21 7v11" />
        <path d="M3 18h18" />
        <path d="M3 11h18" />
        <path d="M3 11V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
        <path d="M7 11V8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />
      </svg>
    </IconWrap>
  );
}

export function IconBath(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z" />
        <path d="M6 12V5a2 2 0 0 1 2-2h3v2.25" />
        <path d="M4 21l1-1.5" />
        <path d="M20 21l-1-1.5" />
      </svg>
    </IconWrap>
  );
}

export function IconArea(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3h7v7H3z" />
        <path d="M14 3h7v7h-7z" />
        <path d="M14 14h7v7h-7z" />
        <path d="M3 14h7v7H3z" />
      </svg>
    </IconWrap>
  );
}

export function IconPrice(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    </IconWrap>
  );
}

export function IconLocation(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </IconWrap>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    </IconWrap>
  );
}

export function IconEmail(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    </IconWrap>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </IconWrap>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </IconWrap>
  );
}

export function IconShield(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </IconWrap>
  );
}

export function IconStar(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </IconWrap>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
      </svg>
    </IconWrap>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </IconWrap>
  );
}

export function IconFilter(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    </IconWrap>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </IconWrap>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </IconWrap>
  );
}

export function IconTrendingUp(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    </IconWrap>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </IconWrap>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </IconWrap>
  );
}

export function IconEye(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </IconWrap>
  );
}

export function IconSwimming(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 20c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1 2.5-1 4-1" />
        <path d="M2 16c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1 2.5-1 4-1" />
        <circle cx="9" cy="6" r="2" />
        <path d="M9 8v4l3 3" />
        <path d="M14 8h-2" />
      </svg>
    </IconWrap>
  );
}

export function IconParking(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
      </svg>
    </IconWrap>
  );
}

export function IconGym(props: IconProps) {
  return (
    <IconWrap {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 6.5h11" />
        <path d="M6.5 17.5h11" />
        <path d="M12 6.5v11" />
        <rect x="2" y="8" width="4" height="8" rx="1" />
        <rect x="18" y="8" width="4" height="8" rx="1" />
      </svg>
    </IconWrap>
  );
}
