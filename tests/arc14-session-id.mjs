/**
 * Arc 14 verification: mtg-sparrow.session.id telemetry
 *
 * Tests:
 * 1. sessionStorage contains 'mtg-sparrow.session.id' after page load
 * 2. Value is a 16-character lowercase hex string
 * 3. Reloading the page preserves the same session ID
 * 4. A fresh browser context gets a different session ID
 * 5. app.navigation attribute is 'single_page' (verified via DOM/bundle inspection)
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';

let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passes++;
  } else {
    console.error(`  FAIL: ${message}`);
    failures++;
  }
}

async function loadApp(page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  // Wait for telemetry to initialize (bundle executes synchronously at load)
  await page.waitForFunction(() => sessionStorage.getItem('mtg-sparrow.session.id') !== null, {
    timeout: 5000,
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Session ID is set in sessionStorage after page load
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Session ID in sessionStorage ===\n');
    {
      const page = await browser.newPage();
      await loadApp(page);

      const sessionId = await page.evaluate(() =>
        sessionStorage.getItem('mtg-sparrow.session.id'),
      );

      console.log(`  Session ID: "${sessionId}"`);
      assert(sessionId !== null, 'mtg-sparrow.session.id is set in sessionStorage');
      assert(
        sessionId !== null && /^[0-9a-f]{16}$/.test(sessionId),
        `Session ID is a 16-char lowercase hex string (got: "${sessionId}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Session ID persists across a page reload
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Session ID persists on reload ===\n');
    {
      const page = await browser.newPage();
      await loadApp(page);

      const idBefore = await page.evaluate(() =>
        sessionStorage.getItem('mtg-sparrow.session.id'),
      );

      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      const idAfter = await page.evaluate(() =>
        sessionStorage.getItem('mtg-sparrow.session.id'),
      );

      console.log(`  ID before reload: "${idBefore}"`);
      console.log(`  ID after reload:  "${idAfter}"`);
      assert(idBefore === idAfter, 'Session ID is the same after page reload');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Fresh browser context gets a different session ID
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Fresh context generates new session ID ===\n');
    {
      const ctx1 = await browser.newContext();
      const page1 = await ctx1.newPage();
      await loadApp(page1);
      const id1 = await page1.evaluate(() => sessionStorage.getItem('mtg-sparrow.session.id'));
      await ctx1.close();

      const ctx2 = await browser.newContext();
      const page2 = await ctx2.newPage();
      await loadApp(page2);
      const id2 = await page2.evaluate(() => sessionStorage.getItem('mtg-sparrow.session.id'));
      await ctx2.close();

      console.log(`  Context 1 ID: "${id1}"`);
      console.log(`  Context 2 ID: "${id2}"`);
      assert(id1 !== id2, 'Fresh browser context generates a different session ID');
    }

    // -----------------------------------------------------------------------
    // PHASE 4: app.navigation attribute present in bundled code
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: app.navigation = single_page in bundle ===\n');
    {
      const page = await browser.newPage();
      await loadApp(page);

      // Verify the bundle contains the expected string (cheapest way to confirm
      // the attribute was compiled in, without intercepting OTel export)
      const response = await page.request.get(`${BASE_URL}/dist/bundle.js`);
      const bundleText = await response.text();

      assert(
        bundleText.includes('single_page'),
        'Bundle contains "single_page" (app.navigation attribute)',
      );
      assert(
        bundleText.includes('mtg-sparrow.session.id'),
        'Bundle contains "mtg-sparrow.session.id" attribute key',
      );

      await page.close();
    }
  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n=== Summary ===');
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${failures}`);
  console.log(`  Total:  ${passes + failures}`);

  if (failures > 0) {
    console.error(`\nArc 14 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 14 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
