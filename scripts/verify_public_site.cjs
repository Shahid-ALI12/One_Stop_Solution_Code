const { chromium } = require('/home/z/.npm-global/lib/node_modules/playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize } = require('node:path');

const ROOT = '/home/z/my-project/frontend/dist';
const PORT = 4321;

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
  console.log(`Static server on http://localhost:${PORT}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`PAGE_ERROR: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`CONSOLE_ERROR: ${m.text()}`); });

  console.log('Loading public site...');
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  const heroText = await page.locator('h1').first().textContent().catch(() => null);
  console.log('Hero H1:', JSON.stringify(heroText?.slice(0, 100)));

  const sections = ['#hero', '#records', '#services', '#ratings', '#resources', '#team', '#faqs', '#contact'];
  for (const s of sections) {
    const el = await page.locator(s).count();
    console.log(`  ${s}: ${el > 0 ? 'OK' : 'MISSING'}`);
  }

  const ratingsSection = page.locator('#ratings');
  const ratingText = await ratingsSection.textContent().catch(() => '');
  console.log(`Ratings Eleanor=${ratingText.includes('Eleanor')}, Marcus=${ratingText.includes('Marcus')}, Sana=${ratingText.includes('Sana')}`);

  const teamText = await page.locator('#team').textContent().catch(() => '');
  console.log(`Team Sophia=${teamText.includes('Sophia')}, Marcus=${teamText.includes('Marcus')}, Victoria=${teamText.includes('Victoria')}`);

  const aurora = await page.locator('[class*="aurora"], [class*="AuroraBackground"]').count();
  const customCursor = await page.locator('[class*="custom-cursor"], [class*="cursor-dot"], [class*="cursor-ring"]').count();
  const scrollProgress = await page.locator('[class*="scroll-progress"], [class*="ScrollProgress"]').count();
  console.log(`Premium UI removed (should all be 0): aurora=${aurora}, customCursor=${customCursor}, scrollProgress=${scrollProgress}`);

  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log(`Body bg: ${bodyBg} (japandi-bg #FAF9F6 = rgb(250, 249, 246))`);

  const rdp = await page.locator('[class*="rdp-"], [class*="day-picker"]').count();
  console.log(`ConsultationCalendar removed (should be 0): ${rdp}`);

  console.log('\n--- Testing admin login ---');
  await page.evaluate(() => { window.location.hash = '#admin'; });
  await page.waitForTimeout(800);
  const loginModal = page.locator('#admin-login-overlay');
  const modalVisible = await loginModal.count() > 0;
  console.log(`Login modal opened: ${modalVisible}`);

  if (modalVisible) {
    await loginModal.locator('input[type="text"]').first().fill('admin');
    await loginModal.locator('input[type="password"]').first().fill('admin123');
    await loginModal.locator('button[type="submit"]').click();
    await page.waitForTimeout(25000);
    const adminLoaded = await page.locator('text=Analytics, text=Services, text=Reviews, text=Dashboard').count();
    console.log(`Admin dashboard loaded: ${adminLoaded > 0}`);
  }

  await page.screenshot({ path: '/home/z/my-project/scripts/public-site-verify.png', fullPage: true });
  console.log('\nScreenshot saved: /home/z/my-project/scripts/public-site-verify.png');

  console.log(`\n=== ERRORS (${errors.length}) ===`);
  errors.slice(0, 10).forEach(e => console.log(' ', e));

  await browser.close();
  server.close();
  process.exit(errors.length > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
