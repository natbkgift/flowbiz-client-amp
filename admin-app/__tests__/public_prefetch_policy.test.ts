import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('public prefetch policy', () => {
  it('keeps homepage browse links and catalogue links opt-out from automatic prefetch', () => {
    const header = read('components/layout/Header.tsx');
    const footer = read('components/layout/Footer.tsx');
    const featuredProjects = read('components/home/FeaturedProjects.tsx');
    const mobileIntentRail = read('components/home/HomeMobileIntentRail.tsx');
    const homePage = read('app/(site)/[locale]/page.tsx');
    const projectsPage = read('app/(site)/[locale]/projects/page.tsx');

    expect(header).toContain('prefetch={false}');
    expect(footer).toContain('prefetch={false}');
    expect(featuredProjects).toContain('prefetch={false}');
    expect(mobileIntentRail).toContain('prefetch={false}');
    expect(homePage).toContain('prefetch={false}');
    expect(homePage).not.toContain("dynamic = 'force-dynamic'");
    expect(projectsPage).not.toContain("dynamic = 'force-dynamic'");
  });

  it('keeps hero as the only place where primary browse actions may still prefetch', () => {
    const hero = read('components/home/HomeHero.tsx');
    const projectsPage = read('app/(site)/[locale]/projects/page.tsx');

    expect(hero).toContain('prefetch');
    expect(projectsPage).toContain('prefetch: false');
    expect(projectsPage).not.toContain('tertiaryAction={{');
    expect(projectsPage).not.toContain('projects-catalogue-strip');
  });
});
