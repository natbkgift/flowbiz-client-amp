'use client';

import { useEffect } from 'react';

export function ScrollReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('reveal--in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '50px 0px -5% 0px', threshold: 0.01 }
    );

    for (const el of elements) {
      // Elements already in viewport on load (above fold) — reveal immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('reveal--in');
      } else {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
