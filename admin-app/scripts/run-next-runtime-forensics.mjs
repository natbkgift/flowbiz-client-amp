import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const ARTIFACT_DIR = path.resolve(ROOT, process.env.RUNTIME_FORENSICS_DIR || path.join("artifacts", "runtime-forensics"));
const BASE_URL = process.env.RUNTIME_FORENSICS_BASE_URL || "http://localhost:3000";
const READY_PATHS = (process.env.RUNTIME_FORENSICS_PATHS || "/api/health,/admin/dashboard?lang=th")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const STARTUP_TIMEOUT_MS = Number.parseInt(process.env.RUNTIME_FORENSICS_TIMEOUT_MS || "180000", 10) || 180000;
const LOG_PATH = path.join(ARTIFACT_DIR, "runtime-forensics.log");
const SUMMARY_PATH = path.join(ARTIFACT_DIR, "runtime-forensics-summary.json");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function appendLog(lines) {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  await fs.appendFile(LOG_PATH, `${lines.join("\n")}\n`, "utf8");
}

async function probe(url, timeoutMs = 5000) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    return {
      ok: response.ok || response.status === 307 || response.status === 308,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function run() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  await fs.writeFile(LOG_PATH, "", "utf8");

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(npmCommand, ["run", "dev"], {
    cwd: ROOT,
    shell: process.platform === "win32",
    env: {
      ...process.env,
      NEXT_LOCAL_FONT_FALLBACK: process.env.NEXT_LOCAL_FONT_FALLBACK || "1",
      NEXT_LOCAL_RUNTIME_MINIMAL: process.env.NEXT_LOCAL_RUNTIME_MINIMAL || "1",
      NEXT_LOCAL_CONFIG_MINIMAL: process.env.NEXT_LOCAL_CONFIG_MINIMAL || "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", async (chunk) => {
    await appendLog([`[stdout ${new Date().toISOString()}]`, String(chunk)]);
  });
  child.stderr.on("data", async (chunk) => {
    await appendLog([`[stderr ${new Date().toISOString()}]`, String(chunk)]);
  });

  const summary = {
    baseUrl: BASE_URL,
    startedAt: new Date().toISOString(),
    startupTimeoutMs: STARTUP_TIMEOUT_MS,
    probes: [],
    childPid: child.pid,
    reachedAny: false,
  };

  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    for (const route of READY_PATHS) {
      const url = new URL(route, BASE_URL).toString();
      const result = await probe(url);
      summary.probes.push({
        timestamp: new Date().toISOString(),
        url,
        ...result,
      });
      if (result.ok) {
        summary.reachedAny = true;
        await fs.writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
        child.kill("SIGTERM");
        return;
      }
    }
    await wait(1000);
  }

  await fs.writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  child.kill("SIGTERM");
  process.exitCode = 1;
}

run().catch(async (error) => {
  await appendLog([`[fatal ${new Date().toISOString()}]`, error instanceof Error ? error.stack || error.message : String(error)]);
  process.exitCode = 1;
});
