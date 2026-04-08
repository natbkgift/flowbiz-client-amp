import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('buy page locale parity', () => {
  it('sources the buy route shell from the dictionary contract instead of inline locale branches', () => {
    const page = read('app/(site)/[locale]/buy/page.tsx');

    expect(page).toContain('const copy = dict.buy.route;');
    expect(page).toContain('title={copy.heroTitle}');
    expect(page).toContain('heading={copy.form.heading}');
    expect(page).toContain('aria-label={copy.scanMode.ariaLabel}');
    expect(page).not.toContain("locale === 'th' ? 'รายการซื้อสำหรับผู้ซื้อต่างชาติที่พร้อมไปต่อได้ง่ายขึ้น'");
    expect(page).not.toContain("const buyFormHeading = locale === 'th'");
  });
});
