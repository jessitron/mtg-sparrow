/**
 * Arc 64 verification: Pause/Fan button events on home page
 *
 * What changed:
 * - mana-gas.js dispatches CustomEvents on window when buttons are clicked:
 *   - #gas-stop-btn dispatches 'mana-gas-stop' (with detail: { paused })
 *   - #gas-fan-btn dispatches 'mana-gas-fan'
 * - welcome.ts listens for these and calls recordEvent('home.gas_stop', ...)
 *   and recordEvent('home.gas_fan')
 *
 * Acceptance Criteria:
 * 1. Clicking the pause button dispatches a 'mana-gas-stop' CustomEvent on window
 * 2. Clicking the fan button dispatches a 'mana-gas-fan' CustomEvent on window
 * 3. The page still functions (animation pauses/resumes, fan scatters particles)
 * 4. Version is 0.41.0
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await sleep(500); // allow mana-gas.js to initialize

    // --- Phase 1: Version check ---
    console.log('\nPhase 1 — Version check');
    {
      // Open the menu to reveal #settings-version element
      const menuBtn = page.locator('.hamburger-btn, [aria-label="Menu"], button[aria-label*="menu" i]').first();
      const menuBtnCount = await menuBtn.count();
      if (menuBtnCount > 0) {
        await menuBtn.click();
        await sleep(400);
      }

      const versionEl = page.locator('#settings-version');
      const versionText = await versionEl.count() > 0 ? await versionEl.textContent() : '';
      assert(
        versionText.includes('0.41.0'),
        `#settings-version shows 0.41.0 (got: "${versionText}")`
      );

      // Close the menu using the close button
      const closeBtn = page.locator('#settings-close-btn');
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await sleep(300);
      }
    }

    // --- Phase 2: pause button dispatches 'mana-gas-stop' ---
    console.log('\nPhase 2 — Pause button dispatches mana-gas-stop event');
    {
      await page.evaluate(() => {
        window.__gasStopFired = false;
        window.__gasStopDetail = null;
        window.addEventListener('mana-gas-stop', (e) => {
          window.__gasStopFired = true;
          window.__gasStopDetail = e.detail;
        });
      });

      await page.click('#gas-stop-btn');
      await sleep(100);

      const fired = await page.evaluate(() => window.__gasStopFired);
      assert(fired === true, 'mana-gas-stop event fired after clicking #gas-stop-btn');

      const detail = await page.evaluate(() => window.__gasStopDetail);
      assert(
        detail !== null && typeof detail.paused === 'boolean',
        `mana-gas-stop event has detail.paused boolean (got: ${JSON.stringify(detail)})`
      );
    }

    // --- Phase 3: pause button toggles (second click resumes) ---
    console.log('\nPhase 3 — Pause button toggle: second click fires mana-gas-stop again');
    {
      let firstPaused;
      await page.evaluate(() => {
        window.__gasStopCount = 0;
        window.__gasStopLastDetail = null;
        window.addEventListener('mana-gas-stop', (e) => {
          window.__gasStopCount++;
          window.__gasStopLastDetail = e.detail;
        });
      });

      // First click was already done in Phase 2 — click again to toggle back
      await page.click('#gas-stop-btn');
      await sleep(100);

      const count = await page.evaluate(() => window.__gasStopCount);
      const lastDetail = await page.evaluate(() => window.__gasStopLastDetail);

      assert(count >= 1, `mana-gas-stop fired on second click (count: ${count})`);
      assert(
        lastDetail !== null && typeof lastDetail.paused === 'boolean',
        `second mana-gas-stop has detail.paused boolean (got: ${JSON.stringify(lastDetail)})`
      );
    }

    // --- Phase 4: fan button dispatches 'mana-gas-fan' ---
    console.log('\nPhase 4 — Fan button dispatches mana-gas-fan event');
    {
      await page.evaluate(() => {
        window.__gasFanFired = false;
        window.addEventListener('mana-gas-fan', () => {
          window.__gasFanFired = true;
        });
      });

      await page.click('#gas-fan-btn');
      await sleep(100);

      const fired = await page.evaluate(() => window.__gasFanFired);
      assert(fired === true, 'mana-gas-fan event fired after clicking #gas-fan-btn');
    }

    // --- Phase 5: page still functional (buttons visible and interactive) ---
    console.log('\nPhase 5 — Buttons are visible and interactive');
    {
      const stopVisible = await page.locator('#gas-stop-btn').isVisible();
      assert(stopVisible, '#gas-stop-btn is visible on the page');

      const fanVisible = await page.locator('#gas-fan-btn').isVisible();
      assert(fanVisible, '#gas-fan-btn is visible on the page');
    }

    await context.close();

  } finally {
    await browser.close();
  }

  console.log(`\n--- Results: ${passes} passed, ${failures} failed ---`);
  if (failures > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
