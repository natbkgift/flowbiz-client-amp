import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('buy page locale parity', () => {
  it('keeps the Thai buy hero and form headings localized instead of reusing the English heading', () => {
    const page = read('app/(site)/[locale]/buy/page.tsx');

    expect(page).toContain("locale === 'th' ? 'รายการซื้อสำหรับผู้ซื้อต่างชาติที่พร้อมไปต่อได้ง่ายขึ้น'");
    expect(page).toContain("const buyFormHeading = locale === 'th' ? 'ส่งบรีฟฝั่งซื้อของคุณ'");
    expect(page).toContain("locale === 'th' ? 'เริ่มจากโหมดสแกน' : 'Scan mode first'");
    expect(page).toContain("locale === 'th' ? 'โซนตัดสินใจจากการ์ด' : 'Card decision zone'");
    expect(page).not.toContain("locale === 'th' ? 'Foreign-buyer inventory that is easier to act on' : 'Foreign-buyer inventory that is easier to act on'");
  });
});
