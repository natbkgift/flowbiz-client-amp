import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { median } from './median.mjs';

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

function toNum(x) {
  return typeof x === 'number' && Number.isFinite(x) ? x : null;
}

function extractMetrics(json) {
  const perfScore = toNum(json?.categories?.performance?.score);
  const lcp = toNum(json?.audits?.['largest-contentful-paint']?.numericValue);
  const tbt = toNum(json?.audits?.['total-blocking-time']?.numericValue);
  const cls = toNum(json?.audits?.['cumulative-layout-shift']?.numericValue);
  const dom =
    toNum(json?.audits?.['dom-size-insight']?.numericValue)
    ?? toNum(json?.audits?.['dom-size']?.numericValue);
  return {
    perfScore: perfScore == null ? null : perfScore * 100,
    lcp,
    tbt,
    cls,
    dom,
  };
}

function extractConsoleErrors(json) {
  const audit = json?.audits?.['errors-in-console'];
  const items = audit?.details?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => {
      const description = typeof it?.description === 'string' ? it.description : '';
      const url = typeof it?.sourceLocation?.url === 'string' ? it.sourceLocation.url : '';
      const line = Number.isFinite(it?.sourceLocation?.line) ? it.sourceLocation.line : null;
      const col = Number.isFinite(it?.sourceLocation?.column) ? it.sourceLocation.column : null;
      return { description, url, line, col };
    })
    .filter((e) => e.description);
}

function countHydrationSignals(consoleErrors) {
  const re = /hydration|did not match|text content|server-rendered html|expected server html|hydrating|mismatch/i;
  return consoleErrors.filter((e) => re.test(e.description)).length;
}

function upsertPresetBlock(filePath, preset, blockLines) {
  const start = `### PRESET: ${preset}`;
  const end = `### END PRESET: ${preset}`;
  const block = [start, ...blockLines, end].join('\n') + '\n';

  let existing = '';
  if (existsSync(filePath)) {
    existing = readFileSync(filePath, 'utf8');
  }

  const re = new RegExp(`^### PRESET: ${preset}\\n[\\s\\S]*?^### END PRESET: ${preset}\\n?`, 'm');
  const next = re.test(existing) ? existing.replace(re, block) : (existing + (existing.endsWith('\n') || existing === '' ? '' : '\n') + block);
  writeFileSync(filePath, next);
}

function runOne({ url, preset, outPath }) {
  const chromeFlags = ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'];
  const args = [
    '--yes',
    'lighthouse',
    url,
    '--output=json',
    `--output-path=${outPath}`,
    '--quiet',
    `--chrome-flags=${chromeFlags.join(' ')}`,
  ];
  if (preset === 'desktop') args.push('--preset=desktop');

  const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const res = spawnSync(npxBin, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: process.platform === 'win32',
  });

  if (res.error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to spawn lighthouse via ${npxBin}:`, res.error.message);
    return 1;
  }
  return res.status ?? 1;
}

function gateFailReasons(meds, gates) {
  const reasons = [];
  if (meds.perfScoreMed < gates.perfScoreMin) reasons.push(`perf<${gates.perfScoreMin}`);
  if (meds.lcpMed > gates.lcpMax) reasons.push(`lcp>${gates.lcpMax}`);
  if (meds.tbtMed > gates.tbtMax) reasons.push(`tbt>${gates.tbtMax}`);
  if (meds.clsMed > gates.clsMax) reasons.push(`cls>${gates.clsMax}`);
  if (meds.domMed > gates.domMax) reasons.push(`dom>${gates.domMax}`);
  if (meds.hydrationSignals > 0) reasons.push('hydration');
  return reasons;
}

function main() {
  const args = parseArgs(process.argv);
  const url = args.url;
  if (!url) {
    console.error('Usage: node ops/lighthouse/run-lh.mjs --url <url> --runs 5 --preset mobile|desktop --outDir ops/logs/phase1');
    process.exit(2);
  }

  const runs = Number(args.runs ?? 5);
  const preset = String(args.preset ?? 'mobile');
  if (!['mobile', 'desktop'].includes(preset)) {
    console.error(`Invalid --preset: ${preset}`);
    process.exit(2);
  }

  const outDir = String(args.outDir ?? 'ops/logs/phase1');
  mkdirSync(outDir, { recursive: true });

  // Phase 1 default gates (can override via CLI if needed later)
  const gates = {
    perfScoreMin: preset === 'desktop' ? 97 : 92,
    lcpMax: 2500,
    tbtMax: 200,
    clsMax: 0,
    domMax: 900,
  };

  const perRun = [];
  let attempt = 0;
  const maxAttempts = runs + 3;

  while (perRun.length < runs && attempt < maxAttempts) {
    attempt += 1;
    const bust = Date.now();
    const runIdx = String(perRun.length + 1).padStart(2, '0');
    const file = `lh-${preset}-run${runIdx}.json`;
    const outPath = path.join(outDir, file);
    const runUrl = url.includes('?') ? `${url}&lh=${bust}` : `${url}?lh=${bust}`;

    const status = runOne({ url: runUrl, preset, outPath });
    if (!existsSync(outPath)) {
      perRun.push({ file, status, runtimeError: `lighthouse did not write output (exit=${status})` });
      continue;
    }

    const json = JSON.parse(readFileSync(outPath, 'utf8'));
    if (json?.runtimeError) {
      perRun.push({ file, runtimeError: json.runtimeError?.message ?? 'runtimeError' });
      continue;
    }
    const m = extractMetrics(json);
    const consoleErrors = extractConsoleErrors(json);
    const hydrationSignals = countHydrationSignals(consoleErrors);
    perRun.push({ file, status, ...m, consoleErrorsCount: consoleErrors.length, hydrationSignals, consoleErrors });
  }

  const valid = perRun.filter((r) => !r.runtimeError && Number.isFinite(r.perfScore) && Number.isFinite(r.lcp) && Number.isFinite(r.tbt) && Number.isFinite(r.cls) && Number.isFinite(r.dom));
  if (valid.length < runs) {
    console.error(`Not enough valid runs: ${valid.length}/${runs}`);
    process.exit(1);
  }

  const meds = {
    perfScoreMed: median(valid.map((r) => r.perfScore)),
    lcpMed: median(valid.map((r) => r.lcp)),
    tbtMed: median(valid.map((r) => r.tbt)),
    clsMed: median(valid.map((r) => r.cls)),
    domMed: median(valid.map((r) => r.dom)),
    hydrationSignals: valid.reduce((sum, r) => sum + (Number.isFinite(r.hydrationSignals) ? r.hydrationSignals : 0), 0),
  };

  const reasons = gateFailReasons(meds, gates);
  const ok = reasons.length === 0;

  const summary = {
    url,
    preset,
    runs,
    gates,
    medians: meds,
    ok,
    failReasons: reasons,
    perRun,
  };

  const summaryPath = path.join(outDir, `lh-${preset}.json`);
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  // Hydration evidence (shared file required by Phase 1 gate contract)
  const hydLines = [];
  hydLines.push(`timestamp: ${new Date().toISOString()}`);
  hydLines.push(`url: ${url}`);
  hydLines.push(`preset: ${preset}`);
  hydLines.push(`runs: ${runs}`);
  hydLines.push(`hydrationSignals(total): ${meds.hydrationSignals}`);
  for (const r of valid) {
    hydLines.push(`- ${r.file} consoleErrors=${r.consoleErrorsCount ?? 0} hydrationSignals=${r.hydrationSignals ?? 0}`);
    if (Array.isArray(r.consoleErrors) && r.consoleErrors.length) {
      for (const e of r.consoleErrors.slice(0, 10)) {
        const loc = e.url ? ` @ ${e.url}${Number.isFinite(e.line) ? `:${e.line}` : ''}${Number.isFinite(e.col) ? `:${e.col}` : ''}` : '';
        hydLines.push(`  - ${e.description.replace(/\s+/g, ' ').slice(0, 240)}${loc}`);
      }
      if (r.consoleErrors.length > 10) hydLines.push(`  - ... (${r.consoleErrors.length - 10} more)`);
    }
  }
  upsertPresetBlock(path.join(outDir, 'hydration.txt'), preset, hydLines);

  const lines = [];
  lines.push(`URL: ${url}`);
  lines.push(`Preset: ${preset}`);
  lines.push(`Medians: perf=${Math.round(meds.perfScoreMed)} lcp=${Math.round(meds.lcpMed)} tbt=${Math.round(meds.tbtMed)} cls=${meds.clsMed} dom=${Math.round(meds.domMed)}`);
  lines.push(`Gates: perf>=${gates.perfScoreMin} lcp<=${gates.lcpMax} tbt<=${gates.tbtMax} cls<=${gates.clsMax} dom<=${gates.domMax}`);
  lines.push(`Result: ${ok ? 'PASS' : `FAIL (${reasons.join(', ')})`}`);
  lines.push('Runs:');
  for (const r of valid) {
    lines.push(`- ${r.file} perf=${Math.round(r.perfScore)} lcp=${Math.round(r.lcp)} tbt=${Math.round(r.tbt)} cls=${r.cls} dom=${Math.round(r.dom)}`);
  }
  writeFileSync(path.join(outDir, `lh-${preset}.txt`), lines.join('\n') + '\n');

  process.exit(ok ? 0 : 1);
}

main();
