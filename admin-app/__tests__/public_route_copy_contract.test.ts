import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('public route copy contract', () => {
  it('keeps the projects route shell on the dictionary contract', () => {
    const page = read('app/(site)/[locale]/projects/page.tsx');

    expect(page).toContain('const copy = dict.projectsPage;');
    expect(page).toContain('title={copy.hero.title}');
    expect(page).toContain('copy.empty.cardTitle');
    expect(page).not.toContain("locale === 'th' ? 'โครงการพัทยา' : 'Pattaya projects'");
  });

  it('keeps the about route shell on the dictionary contract', () => {
    const page = read('app/(site)/[locale]/about/page.tsx');

    expect(page).toContain('const heroSignals = dict.about.heroSignals.map');
    expect(page).toContain('dict.about.processSection.title');
    expect(page).toContain('dict.about.teamSection.title');
    expect(page).toContain('dict.about.reviewsSection.title');
    expect(page).not.toContain("locale === 'th' ? 'ทีมที่เผยแพร่แล้ว' : 'Published team'");
  });

  it('keeps the contact route shell on the dictionary contract', () => {
    const page = read('app/(site)/[locale]/contact/page.tsx');

    expect(page).toContain('const metadataCopy = dict.contact.metadata;');
    expect(page).toContain('const contactCopy = dict.contact;');
    expect(page).toContain('const heroCopy = contactCopy.hero;');
    expect(page).toContain('contactCopy.routeChooser.title');
    expect(page).toContain('contactCopy.summaryTitles.buyingCost');
    expect(page).not.toContain("locale === 'th' ? 'คุยกับ AMP Pattaya เพื่อไปขั้นถัดไปที่ชัดกว่า'");
  });
});