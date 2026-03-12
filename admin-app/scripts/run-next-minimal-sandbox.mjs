import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const SANDBOX_DIR = path.join(ROOT, ".tmp-next-runtime-sandbox");
const LOG_PATH = path.join(ROOT, "artifacts", "runtime-forensics", "minimal-sandbox.log");
const SUMMARY_PATH = path.join(ROOT, "artifacts", "runtime-forensics", "minimal-sandbox-summary.json");
const BASE_URL = process.env.RUNTIME_FORENSICS_BASE_URL || "http://localhost:3010";
const TIMEOUT_MS = Number.parseInt(process.env.RUNTIME_FORENSICS_TIMEOUT_MS || "90000", 10) || 90000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe(url, timeoutMs = 5000) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return {
      ok: response.ok,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      body: await response.text(),
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      elapsedMs: Date.now() - startedAt,
      body: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function appendLog(content) {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.appendFile(LOG_PATH, `${content}\n`, "utf8");
}

async function prepareSandbox() {
  await fs.rm(SANDBOX_DIR, { recursive: true, force: true });
  await fs.mkdir(path.join(SANDBOX_DIR, "app"), { recursive: true });
  await fs.writeFile(
    path.join(SANDBOX_DIR, "package.json"),
    JSON.stringify(
      {
        name: "next-runtime-sandbox",
        private: true,
        scripts: {
          dev: "next dev -p 3010",
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  await fs.writeFile(
    path.join(SANDBOX_DIR, "next.config.js"),
    "module.exports = { reactStrictMode: true };\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(SANDBOX_DIR, "jsconfig.json"),
    JSON.stringify({ compilerOptions: { baseUrl: "." } }, null, 2),
    "utf8",
  );
  await fs.writeFile(
    path.join(SANDBOX_DIR, "app", "layout.js"),
    "export default function RootLayout({ children }) { return <html><body>{children}</body></html>; }\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(SANDBOX_DIR, "app", "page.js"),
    "export default function Page() { return <main>minimal sandbox ok</main>; }\n",
    "utf8",
  );
}

async function run() {
  await prepareSandbox();
  await fs.writeFile(LOG_PATH, "", "utf8");
  const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], {
    cwd: SANDBOX_DIR,
    shell: process.platform === "win32",
    env: {
      ...process.env,
      NODE_PATH: path.join(ROOT, "node_modules"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", async (chunk) => appendLog(`[stdout ${new Date().toISOString()}]\n${String(chunk)}`));
  child.stderr.on("data", async (chunk) => appendLog(`[stderr ${new Date().toISOString()}]\n${String(chunk)}`));

  const deadline = Date.now() + TIMEOUT_MS;
  let result = null;
  while (Date.now() < deadline) {
    result = await probe(BASE_URL);
    if (result.ok) break;
    await wait(1000);
  }

  const summary = {
    baseUrl: BASE_URL,
    timeoutMs: TIMEOUT_MS,
    result,
    childPid: child.pid,
  };
  await fs.writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  child.kill("SIGTERM");
  if (!result?.ok) process.exitCode = 1;
}

run().catch(async (error) => {
  await appendLog(`[fatal ${new Date().toISOString()}]\n${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exitCode = 1;
});
