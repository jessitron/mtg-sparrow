/**
 * Debug mode feature verification
 *
 * Tests:
 * 1. Default state: trace container hidden when debug mode is off
 * 2. Turn debug on: ?debug=on sets localStorage, reloads, trace container visible
 * 3. Debug persists across pages (slides page shows trace container)
 * 4. Turn debug off: ?debug=off clears localStorage, reloads, trace container hidden
 * 5. Console logging: [debug] messages logged when ?debug param is processed
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';

let passes = 0;
let failures = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passes++;
  } else {
    console.error(`  FAIL: ${message}`);
    failures++;
  }
}

async function openMenu(page) {
  const menuBtn = await page.$('#menu-btn');
  if (!menuBtn) {
    console.error('  ERROR: #menu-btn not found');
    return false;
  }
  await menuBtn.click();
  await page.waitForTimeout(300);
  return true;
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Default state — trace container hidden
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Default state — trace container hidden ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(800);

      // Confirm no debug in localStorage
      const debugVal = await page.evaluate(() => localStorage.getItem('mtg-sparrow.debug'));
      assert(debugVal !== 'true', `localStorage debug is not 'true' by default (got "${debugVal}")`);

      await openMenu(page);

      // Trace container should be hidden
      const traceContainer = await page.$('#settings-trace-container');
      assert(traceContainer !== null, '#settings-trace-container exists in the menu');

      if (traceContainer) {
        const isHidden = await traceContainer.evaluate(el => el.hidden);
        assert(isHidden === true, '#settings-trace-container has hidden attribute in default state');
      }

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Turn debug on via ?debug=on
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Turn debug on via ?debug=on ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      // Capture console messages to verify [debug] logging
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));

      // Navigate to ?debug=on — this should trigger a reload
      await page.goto(`${BASE_URL}/?debug=on`);

      // The page reloads via location.replace() stripping ?debug — wait for stable URL
      await page.waitForURL(url => !url.toString().includes('debug='), { timeout: 5000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(800);

      // URL should not contain ?debug
      const finalUrl = page.url();
      assert(!finalUrl.includes('debug='), `URL no longer contains ?debug after reload (got "${finalUrl}")`);

      // localStorage should have debug = 'true'
      const debugVal = await page.evaluate(() => localStorage.getItem('mtg-sparrow.debug'));
      assert(debugVal === 'true', `localStorage['mtg-sparrow.debug'] = 'true' after ?debug=on (got "${debugVal}")`);

      // Open menu — trace container should be visible
      await openMenu(page);

      const traceContainer = await page.$('#settings-trace-container');
      assert(traceContainer !== null, '#settings-trace-container exists');

      if (traceContainer) {
        const isHidden = await traceContainer.evaluate(el => el.hidden);
        assert(isHidden === false, '#settings-trace-container is visible when debug mode is on');
      }

      // Trace link should have a Honeycomb href
      const traceLink = await page.$('#settings-trace-link');
      assert(traceLink !== null, '#settings-trace-link exists');

      if (traceLink) {
        const href = await traceLink.evaluate(el => el.href);
        assert(href.includes('honeycomb.io'), `#settings-trace-link href contains 'honeycomb.io' (got "${href}")`);
      }

      // Console should include [debug] messages
      const debugLogs = consoleLogs.filter(msg => msg.includes('[debug]'));
      console.log(`  INFO: [debug] console messages: ${JSON.stringify(debugLogs)}`);
      assert(debugLogs.length > 0, `Console includes [debug] messages when ?debug=on is processed (found ${debugLogs.length})`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Debug persists across pages
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Debug mode persists across page navigation ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      // First, turn debug on
      await page.goto(`${BASE_URL}/?debug=on`);
      await page.waitForURL(url => !url.toString().includes('debug='), { timeout: 5000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Navigate to slides page (without ?debug param)
      await page.goto(`${BASE_URL}/slides`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(800);

      // localStorage should still have debug = 'true'
      const debugVal = await page.evaluate(() => localStorage.getItem('mtg-sparrow.debug'));
      assert(debugVal === 'true', `localStorage debug persists on slides page (got "${debugVal}")`);

      // Open menu — trace container should still be visible
      await openMenu(page);

      const traceContainer = await page.$('#settings-trace-container');
      assert(traceContainer !== null, '#settings-trace-container exists on slides page');

      if (traceContainer) {
        const isHidden = await traceContainer.evaluate(el => el.hidden);
        assert(isHidden === false, '#settings-trace-container is visible on slides page when debug mode persists');
      }

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Turn debug off via ?debug=off
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Turn debug off via ?debug=off ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      // Capture console messages
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));

      // First, set debug = on in localStorage directly (simulates persisted state)
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('domcontentloaded');
      await page.evaluate(() => localStorage.setItem('mtg-sparrow.debug', 'true'));

      // Now navigate to ?debug=off
      await page.goto(`${BASE_URL}/?debug=off`);
      await page.waitForURL(url => !url.toString().includes('debug='), { timeout: 5000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(800);

      // URL should not contain ?debug
      const finalUrl = page.url();
      assert(!finalUrl.includes('debug='), `URL no longer contains ?debug after ?debug=off reload (got "${finalUrl}")`);

      // localStorage debug should now be null/gone
      const debugVal = await page.evaluate(() => localStorage.getItem('mtg-sparrow.debug'));
      assert(debugVal === null, `localStorage['mtg-sparrow.debug'] is null after ?debug=off (got "${debugVal}")`);

      // Open menu — trace container should be hidden again
      await openMenu(page);

      const traceContainer = await page.$('#settings-trace-container');
      assert(traceContainer !== null, '#settings-trace-container exists');

      if (traceContainer) {
        const isHidden = await traceContainer.evaluate(el => el.hidden);
        assert(isHidden === true, '#settings-trace-container is hidden again after ?debug=off');
      }

      // Console should include [debug] messages about the off switch
      const debugLogs = consoleLogs.filter(msg => msg.includes('[debug]'));
      console.log(`  INFO: [debug] console messages: ${JSON.stringify(debugLogs)}`);
      assert(debugLogs.length > 0, `Console includes [debug] messages when ?debug=off is processed (found ${debugLogs.length})`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Console log emitted for unknown ?debug values
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Console log for unknown ?debug value (status report) ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      // Capture console messages
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));

      await page.goto(`${BASE_URL}/?debug=info`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // A status report log should appear (not a reload)
      const debugLogs = consoleLogs.filter(msg => msg.includes('[debug]'));
      console.log(`  INFO: [debug] console messages: ${JSON.stringify(debugLogs)}`);
      assert(debugLogs.length > 0, `Console includes [debug] status message for unknown ?debug value (found ${debugLogs.length})`);

      // URL should still contain the param (no reload for unknown values)
      const currentUrl = page.url();
      assert(currentUrl.includes('debug=info'), `URL still contains ?debug=info (no reload for unknown value)`);

      await ctx.close();
    }

  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Debug Mode: ${passes} PASS, ${failures} FAIL out of ${passes + failures} tests`);
  console.log('='.repeat(60));

  if (failures > 0) {
    console.error(`\nDebug mode verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nDebug mode verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
