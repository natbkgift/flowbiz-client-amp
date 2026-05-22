import fs from 'node:fs/promises';
import path from 'node:path';

async function run() {
  const file = 'd:/FlowBiz/flowbiz-client-amp/admin-app/artifacts/public-visual-qa/run-20260522-161912/summary.json';
  const data = JSON.parse(await fs.readFile(file, 'utf-8'));
  const th1440 = data.captures.find(c => c.route === '/th' && c.width === 1440);
  if (th1440) {
    console.log(JSON.stringify(th1440, null, 2));
  } else {
    console.log("No th1440 found");
  }
}
run().catch(console.error);
