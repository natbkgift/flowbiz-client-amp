import { spawnSync } from 'node:child_process';
import process from 'node:process';

function run(args) {
  const res = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (res.error) {
    // eslint-disable-next-line no-console
    console.error(res.error);
    return 1;
  }
  return res.status ?? 1;
}

const outDir = 'ops/logs/phase1';
const url = process.env.LH_URL ?? 'https://amppattaya.com/en/';
const runs = process.env.LH_RUNS ?? '5';

const mobile = run(['ops/lighthouse/run-lh.mjs', '--url', url, '--runs', runs, '--preset', 'mobile', '--outDir', outDir]);
const desktop = run(['ops/lighthouse/run-lh.mjs', '--url', url, '--runs', runs, '--preset', 'desktop', '--outDir', outDir]);

process.exit(mobile === 0 && desktop === 0 ? 0 : 1);
