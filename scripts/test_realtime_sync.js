// Cross-tab real-time sync test
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:4173/';

async function main() {
  const browser = await chromium.launch();

  // IMPORTANT: Both tabs must share the SAME browser context so they share
  // localStorage. Real users have admin + public site open in the same
  // browser, just different tabs.
  const ctx = await browser.newContext();

  // --- Tab A: public site ---
  const pageA = await ctx.newPage();
  await pageA.goto(BASE_URL);
  await pageA.waitForLoadState('networkidle');
  await pageA.waitForTimeout(800);

  // Wait for ratings section to render
  await pageA.waitForSelector('#ratings .glass-card', { timeout: 10000 });

  const initial = await pageA.evaluate(() => {
    const cards = document.querySelectorAll('#ratings .glass-card');
    return {
      count: cards.length,
      allNames: Array.from(cards).map(c => c.querySelector('h4')?.textContent?.trim())
    };
  });
  console.log('[Tab A] INITIAL reviews:', JSON.stringify(initial));

  if (initial.count === 0) {
    throw new Error('Public site has no reviews to test with');
  }

  // --- Tab B: admin (SAME context, different page/tab) ---
  const pageB = await ctx.newPage();
  await pageB.goto(BASE_URL + '#admin');
  await pageB.waitForLoadState('networkidle');
  await pageB.waitForSelector('#admin-login-overlay input[type="password"]', { timeout: 10000 });

  // Fill form by typing into the inputs (use scoped locator inside modal)
  const overlay = pageB.locator('#admin-login-overlay');
  await overlay.locator('input[type="text"]').first().fill('admin');
  await overlay.locator('input[type="password"]').first().fill('admin');

  // Submit the form via Enter key on the password input — bypasses any
  // pointer-event interception from the backdrop.
  await overlay.locator('input[type="password"]').first().press('Enter');

  // Wait for AdminDashboard to render
  await pageB.waitForSelector('text=Workspace Panel Active', { timeout: 15000 });
  console.log('[Tab B] Admin dashboard loaded.');

  // Navigate to Reviews tab
  await pageB.locator('button:has-text("Client Feedback Hub")').click();
  await pageB.waitForTimeout(800);

  // Verify admin shows same reviews as public site (sanity check)
  const adminReviewsBefore = await pageB.evaluate(() => {
    const nameSpans = document.querySelectorAll('span.font-bold.text-slate-200.text-sm.leading-none');
    return Array.from(nameSpans).map(s => s.textContent?.trim());
  });
  console.log('[Tab B] Admin reviews BEFORE delete:', JSON.stringify(adminReviewsBefore));

  // Delete the FIRST review in admin
  await pageB.locator('button[title="Instantly Delete testimony"]').first().click();
  console.log('[Tab B] Clicked delete on first review.');
  await pageB.waitForTimeout(500);

  const adminReviewsAfter = await pageB.evaluate(() => {
    const nameSpans = document.querySelectorAll('span.font-bold.text-slate-200.text-sm.leading-none');
    return Array.from(nameSpans).map(s => s.textContent?.trim());
  });
  console.log('[Tab B] Admin reviews AFTER delete:', JSON.stringify(adminReviewsAfter));

  // --- Verify Tab A updates in real time via storage event ---
  let updated = null;
  let attempts = 0;
  for (; attempts < 30; attempts++) {
    await pageA.waitForTimeout(200);
    updated = await pageA.evaluate(() => {
      const cards = document.querySelectorAll('#ratings .glass-card');
      return {
        count: cards.length,
        allNames: Array.from(cards).map(c => c.querySelector('h4')?.textContent?.trim())
      };
    });
    if (updated.count !== initial.count) break;
  }
  console.log(`[Tab A] UPDATED reviews after ${attempts * 200}ms:`, JSON.stringify(updated));

  // Screenshot evidence
  await pageA.screenshot({ path: '/home/z/my-project/scripts/after-admin-delete.png' });
  await pageB.screenshot({ path: '/home/z/my-project/scripts/admin-after-delete.png' });

  await browser.close();

  const pass = updated && updated.count === initial.count - 1;
  if (pass) {
    console.log('\n✅ PASS: Public site updated in REAL TIME — count went', initial.count, '→', updated.count);
    process.exit(0);
  } else {
    console.log('\n❌ FAIL: Public site count unchanged (still', updated?.count, 'vs initial', initial.count, ')');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test crashed:', err.message);
  process.exit(2);
});
