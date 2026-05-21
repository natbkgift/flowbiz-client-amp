import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const runtimeAuditScript = fs.readFileSync(
  path.join(process.cwd(), 'scripts/run-public-runtime-audit.mjs'),
  'utf8',
);

describe('public runtime audit CTA heuristic contract', () => {
  it('treats project advisory handoff CTAs as contact actions, not browse actions', () => {
    expect(runtimeAuditScript).toContain('isAdvisorHandoffLabel');
    expect(runtimeAuditScript).toContain('request.{0,24}guidance');
    expect(runtimeAuditScript).toContain('pressure[- ]test');
    expect(runtimeAuditScript).toContain('ขอคำแนะนำ');
    expect(runtimeAuditScript).toContain('เช็กสมมติฐาน');
    expect(runtimeAuditScript).toContain('&& !isAdvisorHandoffLabel');
    expect(runtimeAuditScript).toContain('hasHashTarget');
    expect(runtimeAuditScript).toContain('shortlist|compare|smart-finder');
    expect(runtimeAuditScript).toContain('(?:ทีม|ที่ปรึกษา).{0,16}คัด');
  });
});
