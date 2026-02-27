import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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

const args = parseArgs(process.argv);
const threshold = Number(args.threshold ?? process.env.LH_BISECT_PERF_THRESHOLD ?? 96);
const url = String(args.url ?? process.env.LH_URL ?? 'https://amppattaya.com/en/');
const outDir = String(args.outDir ?? 'ops/logs/phase1');
const summaryPath = `${outDir}/lh-desktop-probe.json`;

const runArgs = [
  'ops/lighthouse/run-lh.mjs',
  '--url', url,
  '--runs', '5',
  '--preset', 'desktop',
  '--outDir', outDir,
  '--enforceGates', 'false',
  '--summaryBaseName', 'lh-desktop-probe',
];

const run = spawnSync(process.execPath, runArgs, { stdio: 'inherit' });
if (run.error) {
  console.error(`desktop_probe spawn error: ${run.error.message}`);
  process.exit(1);
}
if ((run.status ?? 1) !== 0) {
  console.error(`desktop_probe run-lh failed with exit=${run.status ?? 1}`);
  process.exit(1);
}

if (!existsSync(summaryPath)) {
  console.error(`desktop_probe missing summary file: ${summaryPath}`);
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const perfMed = Number(summary?.medians?.perfScoreMed);
if (!Number.isFinite(perfMed)) {
  console.error('desktop_probe missing medians.perfScoreMed');
  process.exit(1);
}

const isGood = perfMed >= threshold;
const decision = isGood ? 'GOOD' : 'BAD';
console.log(`desktop_probe perfMed=${Math.round(perfMed)} threshold=${threshold} decision=${decision}`);
process.exit(isGood ? 0 : 1);
