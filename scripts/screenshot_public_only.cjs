const { chromium } = require('/home/z/.npm-global/lib/node_modules/playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize } = require('node:path');

const ROOT = '/home/z/my-project/frontend/dist';
const PORT = 4323;

(async () => {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const fp = normalize(join(ROOT, p));
      if (!fp.startsWith(ROOT)) { res.statusCode = 403; return res.end('forbidden'); }
      const data = await readFile(fp);
      const ext = extname(fp).slice(1);
      const types = { html: 'text/html', js: 'application/javascript', css: 'text/css', webp: 'image/webp', svg: 'image/svg+xml', json: 'application/json' };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
      res.end(data);
    } catch (e) {
      res.statusCode = 404;
      res.end('not found');
    }
  });
  await new Promise(r => server.listen(PORT, r));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  // Clear any leftover localStorage from previous runs (so we test public site, not auto-admin)
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Hero screenshot (above the fold)
  await page.screenshot({ path: '/home/z/my-project/scripts/public-hero.png', fullPage: false });
  console.log('Hero screenshot saved.');

  // Full page screenshot
  await page.screenshot({ path: '/home/z/my-project/scripts/public-full.png', fullPage: true });
  console.log('Full page screenshot saved.');

  // Body bg color
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const rootBg = await page.evaluate(() => {
    const root = document.querySelector('.min-h-screen');
    return root ? getComputedStyle(root).backgroundColor : null;
  });
  console.log('Body bg:', bodyBg);
  console.log('Root bg:', rootBg);

  await browser.close();
  server.close();
  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
