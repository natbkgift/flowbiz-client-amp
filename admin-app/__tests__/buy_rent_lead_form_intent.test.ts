import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('buy and rent lead form intent wiring', () => {
  it('keeps the buy page brief form wired to buy intent and shortlist-first follow-up', () => {
    const page = read('app/(site)/[locale]/buy/page.tsx');

    expect(page).toContain('defaultPurpose="buy"');
    expect(page).toContain('defaultMessage={copy.form.defaultMessage}');
    expect(page).toContain("withLocale(locale, '/shortlist')");
    expect(page).toContain('copy.shortlistUtility.linkLabel');
  });

  it('preselects rent intent on the rent page CTA form', () => {
    const page = read('app/(site)/[locale]/rent/page.tsx');

    expect(page).toContain('defaultPurpose="rent"');
    expect(page).toContain('defaultMessage={dict.rent.formDefault}');
  });
});
