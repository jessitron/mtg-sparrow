/**
 * Arc 16 verification: Extract guild-columns, self-assessment, and settings modules
 *
 * Arc 16 was a pure structural refactor — no behavioral changes.
 * Three modules extracted from main.ts:
 *   - src/ui/guild-columns.ts — guild columns, color wheels, hover wiring
 *   - src/ui/self-assessment.ts — self-assessment rendering
 *   - src/ui/settings.ts — settings panel wiring
 *
 * Tests:
 * 1. App loads — welcome screen appears with "Learn guild names" button
 * 2. Settings panel — gear opens panel, close button closes it, version shows "v0.14.0"
 * 3. Session runs — cards appear with pip and name elements
 * 4. Session ends — clicking "Done for now" shows session-end screen
 * 5. Self-assessment — "How did that feel?" prompt with three buttons
 * 6. Guild columns — allied/enemy sections with guild column buttons
 * 7. Color wheels — SVG color wheels present in guild columns
 * 8. Bundle confirms app.version=0.14.0, app.module_structure=extracted, css.split=true
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
  await page.waitForSelector('.welcome-heading', { timeout: 5000 });
}

async function tapCard(page) {
  // First tap reveals the guild name; second tap skips the advance delay
  await page.click('.card');
  await page.waitForTimeout(100);
  await page.click('.card').catch(() => {});
  await page.waitForTimeout(300);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: App loads — welcome screen
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: App loads — welcome screen ===\n');
    {
      const page = await browser.newPage();
      await loadApp(page);

      const headingVisible = await page.isVisible('.welcome-heading');
      assert(headingVisible, 'Welcome heading is visible');

      const buttonVisible = await page.isVisible('#start-button');
      assert(buttonVisible, '"Learn guild names" button is visible');

      const buttonText = await page.textContent('#start-button');
      assert(
        buttonText && buttonText.trim() === 'Learn guild names',
        `Start button text is "Learn guild names" (got: "${buttonText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Settings panel — gear opens, close closes, version = v0.14.0
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Settings panel ===\n');
    {
      const page = await browser.newPage();
      await loadApp(page);

      // Open settings
      await page.click('#menu-btn');
      await page.waitForSelector('#settings-panel:not([hidden])', { timeout: 5000 });

      const panelVisible = await page.isVisible('#settings-panel');
      assert(panelVisible, 'Settings panel is visible after clicking gear');

      const versionText = await page.textContent('#settings-version');
      assert(
        versionText && versionText.includes('0.14.0'),
        `Settings version shows "0.14.0" (got: "${versionText?.trim()}")`,
      );

      // Close settings
      await page.click('#settings-close-btn');
      await page.waitForSelector('#settings-panel', { state: 'hidden', timeout: 3000 });

      const panelHidden = !(await page.isVisible('#settings-panel'));
      assert(panelHidden, 'Settings panel is hidden after clicking close');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Session runs — cards appear with pips and name elements
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Session runs — cards render ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await loadApp(page);

      await page.click('#start-button');
      await page.waitForSelector('.card', { timeout: 8000 });

      const cardVisible = await page.isVisible('.card');
      assert(cardVisible, 'Card is visible after clicking start');

      // Check for pips (color pips rendered by pips module)
      const pipsExist = await page.$('.card-pips') !== null;
      assert(pipsExist, '.card-pips element exists on card');

      // Check for guild name element
      const nameExists = await page.$('.card-name') !== null;
      assert(nameExists, '.card-name element exists on card');

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Session ends — "Done for now" shows session-end screen
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Session ends ===\n');
    {
      // Use ?screen=end to start from the end/guild-column screen, then start a fresh session
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
      await page.click('.guild-column--allied .guild-column-button');
      await page.waitForSelector('.card', { timeout: 8000 });

      // Tap 4 cards to get past the threshold
      for (let i = 0; i < 4; i++) {
        await tapCard(page);
      }

      // Click "Done for now"
      await page.waitForSelector('.done-button', { timeout: 5000 });
      await page.click('.done-button');

      const sessionEndVisible = await page
        .waitForSelector('.session-end', { timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      assert(sessionEndVisible, 'Session-end screen visible after "Done for now"');

      const cardGone = !(await page.isVisible('.card'));
      assert(cardGone, 'Card view is gone after session ends');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Self-assessment — "How did that feel?" prompt appears
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Self-assessment prompt ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
      await page.click('.guild-column--allied .guild-column-button');
      await page.waitForSelector('.card', { timeout: 8000 });

      // Tap 4 cards to trigger full session-end with self-assessment
      for (let i = 0; i < 4; i++) {
        await tapCard(page);
      }

      await page.waitForSelector('.done-button', { timeout: 5000 });
      await page.click('.done-button');
      await page.waitForSelector('.session-end', { timeout: 8000 });

      // Self-assessment prompt should appear
      const selfAssessVisible = await page
        .waitForSelector('.self-assessment', { timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      assert(selfAssessVisible, 'Self-assessment section is visible');

      // Check for "How did that feel?" text
      const promptText = await page.textContent('.self-assessment').catch(() => '');
      assert(
        promptText.includes('feel'),
        `Self-assessment text contains "feel" (got: "${promptText.slice(0, 80)}")`,
      );

      // Three rating buttons
      const ratingButtons = await page.$$('.self-assessment button, .assessment-button');
      assert(
        ratingButtons.length >= 3,
        `At least 3 assessment buttons present (found: ${ratingButtons.length})`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Guild columns render with allied/enemy sections
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Guild columns ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');

      const alliedSection = await page
        .waitForSelector('.guild-column--allied', { timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      assert(alliedSection, 'Allied guild column section is present');

      const enemySection = await page
        .waitForSelector('.guild-column--enemy', { timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      assert(enemySection, 'Enemy guild column section is present');

      const columnButtons = await page.$$('.guild-column-button');
      assert(
        columnButtons.length >= 2,
        `Guild column buttons are present (found: ${columnButtons.length})`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: SVG color wheels in guild columns
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: SVG color wheels ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied', { timeout: 8000 });

      const svgCount = await page.$$eval('svg', (els) => els.length);
      assert(svgCount > 0, `SVG color wheels are present (found: ${svgCount})`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: Bundle confirms telemetry markers for Arc 16
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: Bundle contains Arc 16 telemetry markers ===\n');
    {
      const page = await browser.newPage();
      await loadApp(page);

      const response = await page.request.get(`${BASE_URL}/dist/bundle.js`);
      const bundleText = await response.text();

      assert(
        bundleText.includes('0.14.0'),
        'Bundle contains "0.14.0" version string',
      );
      assert(
        bundleText.includes('app.module_structure'),
        'Bundle contains "app.module_structure" attribute key',
      );
      assert(
        bundleText.includes('extracted'),
        'Bundle contains "extracted" as module_structure value',
      );
      assert(
        bundleText.includes('css.split'),
        'Bundle contains "css.split" attribute key (from Arc 15)',
      );
      assert(
        bundleText.includes('app.startup'),
        'Bundle contains "app.startup" span name',
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
    console.error(`\nArc 16 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 16 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
