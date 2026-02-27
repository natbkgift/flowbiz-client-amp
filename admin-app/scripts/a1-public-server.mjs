import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

const host = process.env.A1_HOST || '127.0.0.1';
const port = Number(process.env.A1_PORT || 3000);

const cssPath = path.join(process.cwd(), 'app', 'globals.css');
const cssText = await fs.readFile(cssPath, 'utf8');

function sendJson(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendHtml(res, code, html) {
  res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

function buildHtml(routePath, locale) {
  const title = `${locale.toUpperCase()} ${routePath === '/' ? 'home' : routePath.slice(1)}`;
  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${cssText}</style>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="header">
      <div class="container header-shell">
        <a class="brand locale-safe" href="/${locale}">FlowBiz</a>
        <button class="btn btn-secondary nav-toggle" type="button" aria-label="Toggle navigation">Menu</button>
        <nav class="nav" aria-label="Primary">
          <a class="nav-link locale-safe" href="/${locale}/about">About</a>
          <a class="nav-link locale-safe" href="/${locale}/projects">Projects</a>
          <a class="nav-link locale-safe" href="/${locale}/property/sample-property">Properties</a>
          <a class="nav-link locale-safe" href="/${locale}/contact">Contact</a>
        </nav>
      </div>
    </header>
    <main id="main-content" class="container content-stack">
      <section class="content-measure locale-safe">
        <h1>${title}</h1>
        <p>Public route: ${routePath}</p>
      </section>
      <article class="card">
        <h2 class="locale-safe">Shared UI Card</h2>
        <h3 class="locale-safe">Typography H3 Example</h3>
        <p class="locale-safe">Button, input and card states are shared globally for every route.</p>
        <div class="card-actions">
          <button class="btn" type="button">Primary action</button>
          <button class="btn btn-secondary" type="button">Secondary action</button>
          <button class="btn" type="button" disabled>Disabled action</button>
        </div>
        <label class="field locale-safe">
          <span>Search properties</span>
          <input type="text" placeholder="Type a keyword" />
        </label>
        <img class="cover-media" src="/media/placeholders/property-cover.webp" alt="Local media example" loading="lazy" />
      </article>
      <section class="state-grid">
        <div class="state-empty locale-safe">Empty state: no items found for this section.</div>
        <div class="state-loading locale-safe">Loading state</div>
        <div class="state-error locale-safe">Error state: unable to load data. Please retry.</div>
      </section>
    </main>
    <footer class="footer" role="contentinfo">
      <div class="container footer-grid">
        <section class="footer-nap locale-safe" aria-label="Contact details">
          <h3>FlowBiz Pattaya</h3>
          <p>123 Beach Road, Pattaya, Chonburi 20150</p>
          <p>+66 38 000 000</p>
          <p>hello@flowbiz.co</p>
        </section>
        <nav class="footer-links" aria-label="Footer links">
          <a href="/${locale}/about">About</a>
          <a href="/${locale}/projects">Projects</a>
          <a href="/${locale}/property/sample-property">Properties</a>
          <a href="/${locale}/contact">Contact</a>
        </nav>
        <nav class="footer-social" aria-label="Social links">
          <a href="https://facebook.com/flowbiz">Facebook</a>
          <a href="https://instagram.com/flowbiz">Instagram</a>
          <a href="https://youtube.com/@flowbiz">YouTube</a>
        </nav>
      </div>
      <div class="container footer-legal">
        <a href="/${locale}/privacy">Privacy Policy</a>
        <a href="/${locale}/terms">Terms of Service</a>
        <span>Copyright 2026 FlowBiz</span>
      </div>
    </footer>
  </body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  const pathname = url.pathname;

  if (pathname === '/healthz') {
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/v1/projects') {
    return sendJson(res, 200, { data: [{ slug: 'sample-project' }] });
  }
  if (pathname === '/api/v1/properties') {
    return sendJson(res, 200, { data: [{ slug: 'sample-property' }] });
  }
  if (pathname === '/api/v1/content/blog-posts/' || pathname === '/api/v1/content/blog-posts') {
    return sendJson(res, 200, [{ slug: 'sample-blog' }]);
  }
  if (pathname === '/api/v1/content/guides/' || pathname === '/api/v1/content/guides') {
    return sendJson(res, 200, [{ slug: 'sample-guide' }]);
  }
  if (pathname === '/api/v1/areas') {
    return sendJson(res, 200, [{ slug: 'sample-area' }]);
  }
  if (pathname === '/api/v1/developers') {
    return sendJson(res, 200, [{ slug: 'sample-developer' }]);
  }

  const parts = pathname.split('/').filter(Boolean);
  const locale = parts[0] === 'th' ? 'th' : 'en';
  const routePath = parts.length ? `/${parts.slice(1).join('/')}` || '/' : '/';
  return sendHtml(res, 200, buildHtml(routePath, locale));
});

server.listen(port, host, () => {
  console.log(`A1 public server listening at http://${host}:${port}`);
});
