import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = '/home/z/my-project/frontend/dist';
const PORT = 4321;

// Tiny static file server
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

// Check Hero section
const heroText = await page.locator('h1').first().textContent().catch(() => null);
console.log('Hero H1:', JSON.stringify(heroText?.slice(0, 100)));

// Check that key sections exist
const sections = ['#hero', '#records', '#services', '#ratings', '#resources', '#team', '#faqs', '#contact'];
for (const s of sections) {
  const el = await page.locator(s).count();
  console.log(`  ${s}: ${el > 0 ? 'OK' : 'MISSING'}`);
}

// Check that services rendered (should have 6 services from mock data)
const serviceCards = await page.locator('#services [class*="rounded"]').count().catch(() => 0);
console.log(`Service cards visible: ${serviceCards}`);

// Check that ratings rendered
const ratingsSection = page.locator('#ratings');
const ratingText = await ratingsSection.textContent().catch(() => '');
const hasEleanor = ratingText.includes('Eleanor');
const hasMarcus = ratingText.includes('Marcus');
console.log(`Ratings: Eleanor=${hasEleanor}, Marcus=${hasMarcus}`);

// Check NO premium UI elements (AuroraBackground, CustomCursor, ScrollProgress should be GONE)
const aurora = await page.locator('[class*="aurora"], [class*="AuroraBackground"]').count();
const customCursor = await page.locator('[class*="custom-cursor"], [class*="cursor-dot"]').count();
const scrollProgress = await page.locator('[class*="scroll-progress"]').count();
console.log(`Premium UI (should all be 0): aurora=${aurora}, customCursor=${customCursor}, scrollProgress=${scrollProgress}`);

// Check that Body bg is the original japandi color
const bodyBg = await page.evaluate(() => {
  const bg = getComputedStyle(document.body).backgroundColor;
  return bg;
});
console.log(`Body background: ${bodyBg} (original japandi-bg #FAF9F6 = rgb(250, 249, 246))`);

// Check that no consultation calendar / portfolio grid rendered
const consultationCal = await page.locator('[class*="rdp-"], [class*="day-picker"]').count();
console.log(`ConsultationCalendar (should be 0): ${consultationCal}`);

// Test admin login via #admin hash
console.log('\n--- Testing admin login ---');
await page.evaluate(() => { window.location.hash = '#admin'; });
await page.waitForTimeout(800);
const loginModal = page.locator('#admin-login-overlay');
const modalVisible = await loginModal.count() > 0;
console.log(`Login modal opened: ${modalVisible}`);

if (modalVisible) {
  // Fill the form
  await loginModal.locator('input[type="text"]').fill('admin');
  await loginModal.locator('input[type="password"]').fill('admin123');
  await loginModal.locator('button[type="submit"]').click();
  // Wait for either admin dashboard or error
  await page.waitForTimeout(20000); // 20s for axios 15s timeout + demo-mode fallback
  const adminDashboard = await page.locator('text=Admin Dashboard, text=Dashboard, text=Analytics').count();
  console.log(`Admin dashboard loaded: ${adminDashboard > 0}`);
  const currentUrl = page.url();
  console.log(`Current URL hash: ${page.url().split('#')[1] || '(none)'}`);
}

// Screenshot for visual verification
await page.screenshot({ path: '/home/z/my-project/scripts/public-site-verify.png', fullPage: true });
console.log('\nScreenshot saved: /home/z/my-project/scripts/public-site-verify.png');

console.log(`\n=== ERRORS (${errors.length}) ===`);
errors.slice(0, 10).forEach(e => console.log(' ', e));

await browser.close();
server.close();
process.exit(errors.length > 0 ? 1 : 0);
