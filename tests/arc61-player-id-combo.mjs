/**
 * Arc 61 verification: player.id on Combo Page Telemetry
 *
 * What changed:
 * - src/combo-telemetry.ts now includes 'mtg-sparrow.player.id' as a resource attribute
 * - Uses the same localStorage key and generation pattern as the main app
 * - Combo page spans/logs will carry a persistent player ID across sessions
 *
 * Acceptance Criteria:
 * 1. Combo pages still load and function correctly (combo name visible)
 * 2. localStorage has 'mtg-sparrow.player.id' set after a combo page loads
 * 3. The same player.id persists when loading a second combo page (same browser context)
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const PLAYER_ID_KEY = 'mtg-sparrow.player.id';

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

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // --- Phase 1: Azorius loads correctly ---
    console.log('\nPhase 1 — Azorius combo page loads correctly');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/combo/azorius.html`);
      await page.waitForLoadState('networkidle');

      const comboName = page.locator('h1.combo-name');
      const count = await comboName.count();
      assert(count > 0, 'Combo name heading (.combo-name) is present on Azorius page');

      if (count > 0) {
        const text = await comboName.innerText();
        assert(text.trim().toLowerCase().includes('azorius'), `Combo name contains "azorius" (got: "${text.trim()}")`);
      }

      await page.close();
      await context.close();
    }

    // --- Phase 2: player.id is written to localStorage after page load ---
    console.log('\nPhase 2 — player.id is set in localStorage after combo page loads');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/combo/azorius.html`);
      await page.waitForLoadState('networkidle');

      const playerId = await page.evaluate((key) => localStorage.getItem(key), PLAYER_ID_KEY);

      assert(playerId !== null, `localStorage has '${PLAYER_ID_KEY}' after page load`);
      assert(
        typeof playerId === 'string' && playerId.length === 16,
        `player.id is a 16-char hex string (got: "${playerId}")`
      );
      assert(
        /^[0-9a-f]{16}$/.test(playerId),
        `player.id matches hex pattern [0-9a-f]{16} (got: "${playerId}")`
      );

      // --- Phase 3: Same player.id persists on a second combo page (same context) ---
      console.log('\nPhase 3 — Same player.id persists across combo pages in the same browser context');

      await page.goto(`${BASE_URL}/combo/dimir.html`);
      await page.waitForLoadState('networkidle');

      const playerIdOnDimir = await page.evaluate((key) => localStorage.getItem(key), PLAYER_ID_KEY);

      assert(playerIdOnDimir !== null, `localStorage still has '${PLAYER_ID_KEY}' on second combo page`);
      assert(
        playerIdOnDimir === playerId,
        `player.id is unchanged across combo pages (first: "${playerId}", second: "${playerIdOnDimir}")`
      );

      await page.close();
      await context.close();
    }

    // --- Phase 4: New browser context gets a new (different) player.id ---
    console.log('\nPhase 4 — Fresh browser context starts with no pre-existing player.id, generates one on load');
    {
      const freshContext = await browser.newContext();
      const page = await freshContext.newPage();
      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('networkidle');

      const freshPlayerId = await page.evaluate((key) => localStorage.getItem(key), PLAYER_ID_KEY);

      assert(freshPlayerId !== null, `Fresh context: localStorage has '${PLAYER_ID_KEY}' after page load`);
      assert(
        typeof freshPlayerId === 'string' && freshPlayerId.length === 16,
        `Fresh context: player.id is a 16-char hex string (got: "${freshPlayerId}")`
      );

      await page.close();
      await freshContext.close();
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
