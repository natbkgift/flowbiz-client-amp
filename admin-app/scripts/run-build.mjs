import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const PROJECT_FILES_TO_RESTORE = ['next-env.d.ts', 'tsconfig.json'];
const LOCAL_SAFE_CLEAN_PATHS = ['.next_public_visual', '.next_local_safe', '.next/cache', 'tsconfig.tsbuildinfo'];

function normalizeFlag(value) {
  return ['1', 'true', 'yes'].includes(String(value || '').trim().toLowerCase());
}

function shouldUseLocalSafeBuild() {
  const args = new Set(process.argv.slice(2));
  const forceFullBuild = args.has('--full') || normalizeFlag(process.env.FLOWBIZ_FORCE_FULL_BUILD);
  if (forceFullBuild) return false;

  const forceLocalSafeBuild =
    args.has('--local-safe') || normalizeFlag(process.env.FLOWBIZ_LOCAL_SAFE_BUILD);
  if (forceLocalSafeBuild) return true;

  const runningInCi = normalizeFlag(process.env.CI) || normalizeFlag(process.env.GITHUB_ACTIONS);
  return process.platform === 'win32' && !runningInCi;
}

function mergeNodeOptions(baseOptions, requiredOption) {
  const normalized = String(baseOptions || '').trim();
  if (!normalized) return requiredOption;
  if (normalized.includes(requiredOption)) return normalized;
  return `${normalized} ${requiredOption}`;
}

async function snapshotProjectFiles() {
  return Promise.all(
    PROJECT_FILES_TO_RESTORE.map(async (relativePath) => {
      const absolutePath = path.join(PROJECT_ROOT, relativePath);
      try {
        const content = await fs.readFile(absolutePath, 'utf-8');
        return { absolutePath, content };
      } catch {
        return { absolutePath, content: null };
      }
    }),
  );
}

async function restoreProjectFiles(snapshot) {
  await Promise.all(
    snapshot.map(async ({ absolutePath, content }) => {
      if (content === null) return;
      await fs.writeFile(absolutePath, content, 'utf-8');
    }),
  );
}

async function removePathIfExists(relativePath) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  await fs.rm(absolutePath, { recursive: true, force: true }).catch(() => undefined);
}

async function cleanupLocalSafeArtifacts() {
  await Promise.all(LOCAL_SAFE_CLEAN_PATHS.map((relativePath) => removePathIfExists(relativePath)));
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      resolve({ code, signal });
    });
  });
}

async function run() {
  const useLocalSafeBuild = shouldUseLocalSafeBuild();
  const nextCommand = process.platform === 'win32'
    ? path.join(PROJECT_ROOT, 'node_modules', '.bin', 'next.cmd')
    : path.join(PROJECT_ROOT, 'node_modules', '.bin', 'next');
  const snapshot = await snapshotProjectFiles();

  const env = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1',
  };

  if (useLocalSafeBuild) {
    await cleanupLocalSafeArtifacts();
    Object.assign(env, {
      NODE_OPTIONS: mergeNodeOptions(process.env.NODE_OPTIONS, '--max-old-space-size=8192'),
      NEXT_LOCAL_BUILD_STATIC_SAFE: process.env.NEXT_LOCAL_BUILD_STATIC_SAFE || '1',
      NEXT_LOCAL_CONFIG_MINIMAL: process.env.NEXT_LOCAL_CONFIG_MINIMAL || '1',
      NEXT_LOCAL_APP_ROOT_MINIMAL: process.env.NEXT_LOCAL_APP_ROOT_MINIMAL || '1',
      NEXT_LOCAL_SITE_LAYOUT_MINIMAL: process.env.NEXT_LOCAL_SITE_LAYOUT_MINIMAL || '1',
      NEXT_LOCAL_PUBLIC_HOME_MINIMAL: process.env.NEXT_LOCAL_PUBLIC_HOME_MINIMAL || '1',
      NEXT_LOCAL_DIST_DIR: process.env.NEXT_LOCAL_DIST_DIR || '.next_local_safe',
    });
    console.log('[build] Running local-safe Next build. Set FLOWBIZ_FORCE_FULL_BUILD=1 to force the raw production build.');
  } else {
    console.log('[build] Running raw Next production build.');
  }

  const child = spawn(nextCommand, ['build'], {
    cwd: PROJECT_ROOT,
    env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  try {
    const { code, signal } = await waitForExit(child);
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exitCode = code ?? 1;
  } finally {
    await restoreProjectFiles(snapshot);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
