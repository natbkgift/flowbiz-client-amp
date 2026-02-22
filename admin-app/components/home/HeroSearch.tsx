'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type HeroSearchProps = {
  locale: 'en' | 'th';
  placeholder: string;
};

type SearchResult = {
  id: string;
  title: string;
  slug: string | null;
  price: number;
  type: string;
  address: string;
};

function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '';
  return `฿${Math.round(price).toLocaleString()}`;
}

export function HeroSearch({ locale, placeholder }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/properties?search=${encodeURIComponent(term)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        const items: SearchResult[] = (data.data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          title: p.title as string,
          slug: p.slug as string | null,
          price: Number(p.price),
          type: p.type as string,
          address: p.address as string,
        }));
        setResults(items);
        setOpen(items.length > 0);
      }
    } catch {
      // Silently fail — search is enhancement, not critical path
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    const href = result.slug
      ? `/${locale}/property/${encodeURIComponent(result.slug)}`
      : `/${locale}/buy`;
    router.push(href);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      setOpen(false);
      router.push(`/${locale}/buy?search=${encodeURIComponent(query.trim())}`);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="hero-search" role="search">
      <form onSubmit={handleSubmit} className="hero-search__form">
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="hero-search__input"
          aria-label={placeholder}
          autoComplete="off"
        />
        <button type="submit" className="hero-search__btn" aria-label="Search">
          {loading ? (
            <span className="hero-search__spinner" aria-hidden="true" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </button>
      </form>

      {open && results.length > 0 ? (
        <ul className="hero-search__results" role="listbox">
          {results.map((r) => (
            <li key={r.id} role="option" aria-selected={false}>
              <button
                type="button"
                className="hero-search__result"
                onClick={() => handleSelect(r)}
              >
                <div className="hero-search__result-title">{r.title}</div>
                <div className="hero-search__result-meta">
                  <span>{formatPrice(r.price)}</span>
                  {r.type ? (
                    <span className="hero-search__result-type">
                      {r.type === 'rent'
                        ? (locale === 'th' ? 'เช่า' : 'Rent')
                        : (locale === 'th' ? 'ขาย' : 'Sale')}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
