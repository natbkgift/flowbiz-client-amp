import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf-8');
}

describe('A1 shared foundation guards', () => {
  it('keeps global focus-visible and overflow-x protections', () => {
    const css = read('app/globals.css');

    expect(css).toContain(':focus-visible');
    expect(css).toContain('outline: 3px solid var(--color-primary);');
    expect(css).toContain('overflow-x: hidden;');
  });

  it('keeps shared typography, spacing, container and 4K readability rules', () => {
    const css = read('app/globals.css');

    expect(css).toContain('--type-h1');
    expect(css).toContain('--type-h2');
    expect(css).toContain('--type-h3');
    expect(css).toContain('--type-body');
    expect(css).toContain('--container-padding');
    expect(css).toContain('--measure-max');
    expect(css).toContain('.container');
    expect(css).toContain('@media (min-width: 2560px)');
    expect(css).toContain('@media (min-width: 1920px)');
  });

  it('keeps semantic header/footer landmarks, NAP and legal/social links', () => {
    const header = read('components/layout/Header.tsx');
    const footer = read('components/layout/Footer.tsx');

    expect(header).toContain('href="#main-content"');
    expect(header).toContain('<header className="header">');
    expect(header).toContain('<nav className="nav"');
    expect(header).toContain('className="nav-link locale-safe"');

    expect(footer).toContain('role="contentinfo"');
    expect(footer).toContain('footer-nap');
    expect(footer).toContain('Privacy Policy');
    expect(footer).toContain('facebook.com/flowbiz');
  });

  it('keeps shared controls and state styles for buttons, inputs, cards and global states', () => {
    const css = read('app/globals.css');

    expect(css).toContain('.btn');
    expect(css).toContain('.btn:hover');
    expect(css).toContain('.btn:active');
    expect(css).toContain('.btn:disabled');
    expect(css).toContain('input,');
    expect(css).toContain('.card');
    expect(css).toContain('.state-empty');
    expect(css).toContain('.state-loading');
    expect(css).toContain('.state-error');
    expect(css).toContain('.locale-safe');
  });

  it('keeps local media-first fallback components', () => {
    const localMedia = read('components/media/LocalMediaImage.tsx');
    const safeCover = read('components/media/SafeCoverImage.tsx');

    expect(localMedia).toContain('raw.startsWith("/media/")');
    expect(localMedia).toContain('raw.startsWith("/storage/")');
    expect(localMedia).toContain('/media/placeholders/image-fallback.webp');
    expect(safeCover).toContain('/media/placeholders/property-cover.webp');
  });
});
