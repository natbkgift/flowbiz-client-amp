import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('buy and rent lead form intent wiring', () => {
  it('preselects buy intent on the buy page CTA form', () => {
    const page = read('app/(site)/[locale]/buy/page.tsx');

    expect(page).toContain('<LeadForm defaultPurpose="buy" defaultMessage={dict.buy.advisoryCtaBody} />');
  });

  it('preselects rent intent on the rent page CTA form', () => {
    const page = read('app/(site)/[locale]/rent/page.tsx');

    expect(page).toContain('<LeadForm defaultPurpose="rent" defaultMessage={dict.rent.formDefault} />');
  });
});