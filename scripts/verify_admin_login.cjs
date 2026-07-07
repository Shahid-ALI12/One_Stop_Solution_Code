const { chromium } = require('/home/z/.npm-global/lib/node_modules/playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize } = require('node:path');

const ROOT = '/home/z/my-project/frontend/dist';
const PORT = 4322;

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
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`PAGE_ERROR: ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error' || m.type() === 'warning') {
      errors.push(`${m.type().toUpperCase()}: ${m.text().slice(0, 200)}`);
    }
  });

  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.evaluate(() => { window.location.hash = '#admin'; });
  await page.waitForTimeout(800);

  const modal = page.locator('#admin-login-overlay');
  console.log('Modal visible:', await modal.count() > 0);

  await modal.locator('input[type="text"]').first().fill('admin');
  await modal.locator('input[type="password"]').first().fill('admin123');
  console.log('Submitting login form...');
  await modal.locator('button[type="submit"]').click();

  // Poll for admin dashboard to appear (check every 1s for 30s)
  for (let i = 1; i <= 30; i++) {
    await page.waitForTimeout(1000);
    const adminVisible = await page.locator('text=Analytics, text=Services, text=Reviews, text=Dashboard, text=Team').count();
    const modalStillOpen = await modal.count();
    if (adminVisible > 0) {
      console.log(`✓ Admin dashboard visible after ${i}s`);
      break;
    }
    if (i % 5 === 0) console.log(`  waited ${i}s... admin=${adminVisible}, modal=${modalStillOpen}`);
  }

  // Screenshot
  await page.screenshot({ path: '/home/z/my-project/scripts/admin-after-login.png', fullPage: false });

  // Check localStorage for demo token
  const ls = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = localStorage.getItem(k)?.slice(0, 80);
    }
    return out;
  });
  console.log('localStorage:', JSON.stringify(ls, null, 2));

  console.log(`\n=== Errors (${errors.length}) ===`);
  errors.slice(0, 15).forEach(e => console.log(' ', e));

  await browser.close();
  server.close();
  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
