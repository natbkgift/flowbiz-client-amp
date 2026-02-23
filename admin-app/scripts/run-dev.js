require('./process-guard');
const { spawn, exec } = require('child_process');
const os = require('os');
const http = require('http');

console.log('[INFO] Starting Next.js Dev Server Wrapper...');

function probeHttp(url, timeoutMs) {
    return new Promise((resolve) => {
        try {
            const u = new URL(url);
            const req = http.request(
                {
                    method: 'GET',
                    hostname: u.hostname,
                    port: u.port || 80,
                    path: u.pathname + u.search,
                    timeout: timeoutMs,
                },
                (res) => {
                    // Any response means the server is up.
                    res.resume();
                    resolve(true);
                }
            );
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            req.on('error', () => resolve(false));
            req.end();
        } catch {
            resolve(false);
        }
    });
}

async function maybeEnableApiProxy() {
    if (process.env.NEXT_PUBLIC_API_PROXY_TARGET) return;

    const defaultTarget = 'http://127.0.0.1:8000';
    const ok = await probeHttp(`${defaultTarget}/v1/meta`, 500);
    if (ok) {
        process.env.NEXT_PUBLIC_API_PROXY_TARGET = defaultTarget;
        console.log(`[INFO] Detected backend at ${defaultTarget} — enabling /api proxy`);
    } else {
        console.log('[INFO] Backend not detected on http://127.0.0.1:8000 — /api proxy disabled');
    }
}

// Spawn the actual dev server utilizing UV_THREADPOOL_SIZE limitation
let dev;
maybeEnableApiProxy().then(() => {
    dev = spawn('npm', ['run', 'dev:next'], {
        stdio: 'inherit',
        shell: true,
        env: process.env,
    });

    dev.on('close', (code) => {
        console.log(`[INFO] Child dev server exited with code ${code}`);
        process.exit(code);
    });
});

function killProcessTree(pid) {
    if (os.platform() === 'win32') {
        console.log(`[INFO] Killing process tree for PID: ${pid} on Windows...`);
        exec(`taskkill /PID ${pid} /T /F`, () => { });
    } else {
        console.log(`[INFO] Killing process for PID: ${pid} on Unix...`);
        try { process.kill(-pid, 'SIGTERM'); } catch (e) { dev.kill('SIGTERM'); }
    }
}

// If wrapper exits, kill the child dev server deterministically
process.on('exit', () => {
    console.log('[INFO] Wrapper exiting, killing child dev server...');
    if (dev?.pid) killProcessTree(dev.pid);
});

process.on('SIGINT', () => {
    console.log('[INFO] Wrapper received SIGINT, killing child dev server...');
    if (dev?.pid) killProcessTree(dev.pid);
    setTimeout(() => process.exit(), 1000); // Give it a second to kill before wrapper exits
});
