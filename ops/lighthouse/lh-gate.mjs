import { spawnSync } from 'node:child_process';
import process from 'node:process';

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const v = argv[i + 1];
    if (v && !v.startsWith('--')) {
      out[k] = v;
      i += 1;
    } else {
      out[k] = true;
    }
  }
  return out;
}

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
const args = parseArgs(process.argv);
const mode = String(args.preset ?? process.env.LH_PRESET ?? 'both').toLowerCase();

if (!['mobile', 'desktop', 'both'].includes(mode)) {
  console.error(`Invalid preset mode: ${mode}. Expected mobile|desktop|both`);
  process.exit(2);
}

const shouldRunMobile = mode === 'both' || mode === 'mobile';
const shouldRunDesktop = mode === 'both' || mode === 'desktop';

let mobile = 0;
let desktop = 0;

if (shouldRunMobile) {
  mobile = run(['ops/lighthouse/run-lh.mjs', '--url', url, '--runs', runs, '--preset', 'mobile', '--outDir', outDir]);
}
if (shouldRunDesktop) {
  desktop = run(['ops/lighthouse/run-lh.mjs', '--url', url, '--runs', runs, '--preset', 'desktop', '--outDir', outDir]);
}
process.exit(mobile === 0 && desktop === 0 ? 0 : 1);
