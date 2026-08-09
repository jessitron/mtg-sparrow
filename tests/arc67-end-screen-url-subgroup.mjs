/**
 * Arc 67 verification: End screen URL updates on section switch
 *
 * What changed:
 * - In src/ui/guild-columns.ts, history.replaceState now sets ?subgroup=<label>
 *   whenever the user navigates between sections (via reel nav buttons or scroll)
 *   and when the page first loads.
 *
 * Section labels: allied, enemy, wedges, shards, colleges, share
 *
 * Acceptance Criteria:
 * 1. Loading /end with no params shows Allied Guilds and URL updates to ?subgroup=allied
 * 2. Clicking the down nav button changes the URL to ?subgroup=enemy
 * 3. Navigating further changes to ?subgroup=wedges, etc.
 * 4. Loading /end?subgroup=enemy starts on the Enemy Guilds section
 * 5. Loading /end?subgroup=shards starts on the Shards section
 * 6. Copy-pasting a URL with ?subgroup=wedges lands on the correct section
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

function getSubgroupParam(urlString) {
  try {
    const url = new URL(urlString);
    return url.searchParams.get('subgroup');
  } catch {
    return null;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // --- Test 1: Loading /end with no params → URL gets ?subgroup=allied ---
    console.log('\nTest 1 — Loading /end with no params sets URL to ?subgroup=allied');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const subgroup = getSubgroupParam(page.url());
      assert(subgroup === 'allied', `URL has ?subgroup=allied on initial load (got: "${subgroup}")`);

      await context.close();
    }

    // --- Test 2: Click down nav button → URL updates to ?subgroup=enemy ---
    console.log('\nTest 2 — Clicking down nav button updates URL to ?subgroup=enemy');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const bottomBtn = page.locator('.reel-nav-btn--bottom');
      await bottomBtn.click();
      await sleep(700); // wait for reel animation

      const subgroup = getSubgroupParam(page.url());
      assert(subgroup === 'enemy', `URL has ?subgroup=enemy after clicking down button (got: "${subgroup}")`);

      await context.close();
    }

    // --- Test 3: Navigating further updates URL to ?subgroup=wedges ---
    console.log('\nTest 3 — Navigating further updates URL to ?subgroup=wedges');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      // Navigate twice (allied → enemy → wedges)
      const bottomBtn = page.locator('.reel-nav-btn--bottom');
      await bottomBtn.click();
      await sleep(700);
      await bottomBtn.click();
      await sleep(700);

      const subgroup = getSubgroupParam(page.url());
      assert(subgroup === 'wedges', `URL has ?subgroup=wedges after two down-nav clicks (got: "${subgroup}")`);

      await context.close();
    }

    // --- Test 4: Loading /end?subgroup=enemy starts on the Enemy Guilds section ---
    console.log('\nTest 4 — Loading /end?subgroup=enemy starts on Enemy Guilds');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end?subgroup=enemy`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const subgroup = getSubgroupParam(page.url());
      assert(subgroup === 'enemy', `URL still has ?subgroup=enemy after loading with that param (got: "${subgroup}")`);

      // Verify correct section content: the up-nav button should be visible (not at top)
      const topBtn = page.locator('.reel-nav-btn--top');
      const topBtnHidden = await topBtn.evaluate(el => el.classList.contains('reel-nav-btn--hidden'));
      assert(!topBtnHidden, 'Top nav button is visible (not at first section) when starting on enemy');

      await context.close();
    }

    // --- Test 5: Loading /end?subgroup=shards starts on the Shards section ---
    console.log('\nTest 5 — Loading /end?subgroup=shards starts on the Shards section');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end?subgroup=shards`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const subgroup = getSubgroupParam(page.url());
      assert(subgroup === 'shards', `URL has ?subgroup=shards when loaded with shards param (got: "${subgroup}")`);

      // Shards is index 3 (allied=0, enemy=1, wedges=2, shards=3, colleges=4, share=5)
      // so top button should be visible and bottom button should not be hidden (colleges/share come after)
      const topBtn = page.locator('.reel-nav-btn--top');
      const topBtnHidden = await topBtn.evaluate(el => el.classList.contains('reel-nav-btn--hidden'));
      assert(!topBtnHidden, 'Top nav button is visible (not at first section) when starting on shards');

      await context.close();
    }

    // --- Test 6: Copy-pasted URL with ?subgroup=wedges lands on correct section ---
    console.log('\nTest 6 — Navigating to URL with ?subgroup=wedges lands on the Wedges section');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end?subgroup=wedges`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const subgroup = getSubgroupParam(page.url());
      assert(subgroup === 'wedges', `URL has ?subgroup=wedges when loaded with wedges param (got: "${subgroup}")`);

      // Wedges is index 2, so top button should be visible
      const topBtn = page.locator('.reel-nav-btn--top');
      const topBtnHidden = await topBtn.evaluate(el => el.classList.contains('reel-nav-btn--hidden'));
      assert(!topBtnHidden, 'Top nav button is visible (not at first section) when starting on wedges');

      // Also confirm bottom button is visible (shards and share come after)
      const bottomBtn = page.locator('.reel-nav-btn--bottom');
      const bottomBtnHidden = await bottomBtn.evaluate(el => el.classList.contains('reel-nav-btn--hidden'));
      assert(!bottomBtnHidden, 'Bottom nav button is visible (not at last section) when starting on wedges');

      await context.close();
    }

    // --- Test 7: Navigate all the way to 'share' section and verify URL ---
    console.log('\nTest 7 — Navigating through all sections ends at ?subgroup=share');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const bottomBtn = page.locator('.reel-nav-btn--bottom');

      // Navigate through allied → enemy → wedges → shards → colleges → share (5 clicks)
      for (let i = 0; i < 6; i++) {
        const hidden = await bottomBtn.evaluate(el => el.classList.contains('reel-nav-btn--hidden'));
        if (hidden) break;
        await bottomBtn.click();
        await sleep(700);
      }

      const subgroup = getSubgroupParam(page.url());
      assert(
        subgroup === 'share',
        `URL has ?subgroup=share after navigating to last section (got: "${subgroup}")`
      );

      // Bottom nav should now be hidden (at last section)
      const bottomBtnHidden = await bottomBtn.evaluate(el => el.classList.contains('reel-nav-btn--hidden'));
      assert(bottomBtnHidden, 'Bottom nav button is hidden at the last section (share)');

      await context.close();
    }

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
