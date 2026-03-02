/**
 * Accessible breadcrumb navigation for interior pages.
 *
 * Renders an ordered list inside a `<nav>` landmark with
 * `aria-label="Breadcrumb"`. The current page is marked with
 * `aria-current="page"` per WAI-ARIA best practices.
 *
 * Usage:
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/en' },
 *     { label: 'Buy', href: '/en/buy' },
 *     { label: 'Noble Ambience', href: '/en/property/noble-ambience' },
 *   ]}
 * />
 * ```
 */

import Link from 'next/link';

export interface BreadcrumbItem {
  /** Display label. */
  label: string;
  /** Absolute path (including locale prefix). */
  href: string;
}

interface BreadcrumbsProps {
  /** Ordered list of breadcrumb segments (first = root, last = current page). */
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol className="breadcrumbs-list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.href} className="breadcrumbs-item">
              {isLast ? (
                <span aria-current="page">{item.label}</span>
              ) : (
                <>
                  <Link href={item.href} className="breadcrumbs-link">
                    {item.label}
                  </Link>
                  <span className="breadcrumbs-separator" aria-hidden="true">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
