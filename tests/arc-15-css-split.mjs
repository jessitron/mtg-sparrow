/**
 * Arc 15 verification: CSS split into per-page stylesheets
 *
 * Tests:
 * 1. All 5 CSS files load without 404 (style.css, welcome.css, slides.css, assessment.css, end.css)
 * 2. Welcome screen renders (heading visible, start button visible)
 * 3. Card/quiz screen renders after clicking "Learn guild names"
 * 4. Session-end screen renders after completing 4+ cards
 * 5. Settings panel opens and shows "v0.13.0"
 * 6. app.startup span has app.version = 0.13.0 (bundle inspection)
 * 7. app.startup span has css.split = true (bundle inspection)
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

async function startAlliedSession(page) {
  await page.goto(`${BASE_URL}/?screen=end`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
  await page.click('.guild-column--allied .guild-column-button');
  await page.waitForSelector('.card', { timeout: 8000 });
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
    // PHASE 1: All 5 CSS files load without 404
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: All 5 CSS files load (no 404s) ===\n');
    {
      const page = await browser.newPage();
      const cssResponses = {};

      page.on('response', (response) => {
        const url = response.url();
        const cssFiles = ['style.css', 'welcome.css', 'slides.css', 'assessment.css', 'end.css'];
        for (const file of cssFiles) {
          if (url.endsWith(`/${file}`) || url.endsWith(`\\${file}`)) {
            cssResponses[file] = response.status();
          }
        }
      });

      await loadApp(page);
      // Give a moment for all resources to load
      await page.waitForTimeout(500);

      const expectedFiles = ['style.css', 'welcome.css', 'slides.css', 'assessment.css', 'end.css'];
      for (const file of expectedFiles) {
        const status = cssResponses[file];
        assert(status !== undefined, `${file} was requested by the browser`);
        assert(status === 200, `${file} returned HTTP 200 (got: ${status})`);
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Welcome screen renders correctly
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Welcome screen renders ===\n');
    {
      const page = await browser.newPage();
      await loadApp(page);

      const headingVisible = await page.isVisible('.welcome-heading');
      assert(headingVisible, 'Welcome heading is visible');

      const headingText = await page.textContent('.welcome-heading');
      assert(
        headingText && headingText.includes('MTG Color'),
        `Heading contains "MTG Color" (got: "${headingText}")`,
      );

      const buttonVisible = await page.isVisible('#start-button');
      assert(buttonVisible, 'Start button ("Learn guild names") is visible');

      const buttonText = await page.textContent('#start-button');
      assert(
        buttonText && buttonText.trim() === 'Learn guild names',
        `Start button text is "Learn guild names" (got: "${buttonText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Card/quiz screen renders after clicking start
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Card/quiz screen renders ===\n');
    {
      // Use a fresh context to ensure clean localStorage (no saved session state)
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await loadApp(page);

      await page.click('#start-button');
      await page.waitForSelector('.card', { timeout: 8000 });

      const cardVisible = await page.isVisible('.card');
      assert(cardVisible, 'Card is visible after clicking start');

      // Done zone button exists in DOM but should NOT have button-visible class on card 1
      // (opacity: 0 until card 2 — Playwright isVisible() ignores opacity, so check class)
      const doneButtonClasses = await page.$eval('.done-button', el => el.className).catch(() => null);
      assert(
        doneButtonClasses !== null && !doneButtonClasses.includes('button-visible'),
        '"Done for now" button lacks button-visible class on card 1 (opacity: 0)',
      );

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Session-end screen renders after 4+ cards
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Session-end screen renders ===\n');
    {
      const page = await browser.newPage();
      await startAlliedSession(page);

      // Advance through 4 cards to trigger the full session-end path
      for (let i = 0; i < 4; i++) {
        await tapCard(page);
      }

      // Click "Done for now" to end session
      await page.waitForSelector('.done-button', { timeout: 5000 });
      await page.click('.done-button');

      // Wait for session-end screen
      const sessionEndVisible = await page
        .waitForSelector('.session-end', { timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      assert(sessionEndVisible, 'Session-end screen is visible after "Done for now"');

      // Verify card view is gone
      const cardGone = !(await page.isVisible('.card'));
      assert(cardGone, 'Card view is gone after session ends');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Settings panel opens and shows v0.13.0
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Settings panel shows v0.13.0 ===\n');
    {
      const page = await browser.newPage();
      await loadApp(page);

      // Open settings
      await page.click('#settings-gear-btn');
      await page.waitForSelector('#settings-panel:not([hidden])', { timeout: 5000 });

      const panelVisible = await page.isVisible('#settings-panel');
      assert(panelVisible, 'Settings panel is visible after clicking gear');

      const versionText = await page.textContent('#settings-version');
      assert(
        versionText && versionText.includes('0.13.0'),
        `Settings version shows "0.13.0" (got: "${versionText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Bundle contains css.split and app.version markers
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Bundle contains telemetry markers ===\n');
    {
      const page = await browser.newPage();
      await loadApp(page);

      const response = await page.request.get(`${BASE_URL}/dist/bundle.js`);
      const bundleText = await response.text();

      assert(
        bundleText.includes('css.split'),
        'Bundle contains "css.split" attribute key',
      );
      assert(
        bundleText.includes('0.13.0'),
        'Bundle contains "0.13.0" version string',
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
    console.error(`\nArc 15 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 15 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
