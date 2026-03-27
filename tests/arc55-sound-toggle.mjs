/**
 * Arc 55 verification: Sound Toggle UI & Persistence
 *
 * Verifies that:
 * 1. Sound toggle button is visible on the welcome page (index.html)
 * 2. Sound toggle button is visible on the slides page
 * 3. Clicking toggles the icon between speaker-on and speaker-off
 * 4. Sound preference persists in localStorage across page reload
 * 5. The button does NOT appear on other pages (combo pages, about, etc.)
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const EXPECTED_VERSION = '0.37.0';
const SOUND_KEY = 'mtg-sparrow.sound.enabled';

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

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Welcome page — button exists and is visible
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Welcome page — sound toggle button ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('domcontentloaded');

      const btn = page.locator('#sound-toggle-btn');
      const count = await btn.count();
      assert(count === 1, 'Sound toggle button exists on welcome page');

      if (count === 1) {
        const visible = await btn.isVisible();
        assert(visible, 'Sound toggle button is visible on welcome page');

        const title = await btn.getAttribute('title');
        assert(
          title !== null && title.length > 0,
          `Sound toggle button has a title attribute: "${title}"`
        );
      }

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Slides page — button exists and is visible
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Slides page — sound toggle button ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/slides`);
      await page.waitForLoadState('domcontentloaded');

      const btn = page.locator('#sound-toggle-btn');
      const count = await btn.count();
      assert(count === 1, 'Sound toggle button exists on slides page');

      if (count === 1) {
        const visible = await btn.isVisible();
        assert(visible, 'Sound toggle button is visible on slides page');
      }

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Toggle behavior — icon switches on click
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Toggle behavior — icon changes on click ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('domcontentloaded');
      // Clear localStorage so we start from default (sound ON)
      await page.evaluate((key) => localStorage.removeItem(key), SOUND_KEY);
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      const btn = page.locator('#sound-toggle-btn');

      // Default state: sound ON (no key in storage)
      const titleBefore = await btn.getAttribute('title');
      assert(
        titleBefore === 'Sound on — click to mute',
        `Default title is "Sound on — click to mute" (got: "${titleBefore}")`
      );

      const htmlBefore = await btn.innerHTML();
      // Speaker-on SVG has a <path> element with arc wave, speaker-off has <line> elements
      const hasWavesBefore = htmlBefore.includes('M15.54') || htmlBefore.includes('M19.07');
      assert(hasWavesBefore, 'Default icon shows speaker-on (has wave paths)');

      // Click to turn off
      await btn.click();

      const titleAfter = await btn.getAttribute('title');
      assert(
        titleAfter === 'Sound off — click to unmute',
        `After click title is "Sound off — click to unmute" (got: "${titleAfter}")`
      );

      const htmlAfter = await btn.innerHTML();
      const hasXAfter = htmlAfter.includes('<line');
      assert(hasXAfter, 'After click icon shows speaker-off (has X lines)');

      // Click again to turn back on
      await btn.click();
      const titleAfterSecond = await btn.getAttribute('title');
      assert(
        titleAfterSecond === 'Sound on — click to mute',
        `After second click title is back to "Sound on — click to mute"`
      );

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Persistence — localStorage survives page reload
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Persistence — localStorage across reload ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Start from a clean state — navigate first, then clear storage
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('domcontentloaded');
      await page.evaluate((key) => localStorage.removeItem(key), SOUND_KEY);

      const btn = page.locator('#sound-toggle-btn');

      // Click to turn sound OFF
      await btn.click();

      // Check localStorage was written
      const stored = await page.evaluate((key) => localStorage.getItem(key), SOUND_KEY);
      assert(stored === 'false', `localStorage[${SOUND_KEY}] = "false" after clicking off`);

      // Reload and check the state was remembered (no addInitScript, so storage persists)
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      const btnAfterReload = page.locator('#sound-toggle-btn');
      const titleAfterReload = await btnAfterReload.getAttribute('title');
      assert(
        titleAfterReload === 'Sound off — click to unmute',
        `After reload, button shows sound-off state (got: "${titleAfterReload}")`
      );

      // Now click to turn sound back ON
      await btnAfterReload.click();
      const storedAfterOn = await page.evaluate((key) => localStorage.getItem(key), SOUND_KEY);
      assert(storedAfterOn === 'true', `localStorage[${SOUND_KEY}] = "true" after clicking on`);

      // Reload again and confirm sound ON is remembered
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      const btnAfterSecondReload = page.locator('#sound-toggle-btn');
      const titleAfterSecondReload = await btnAfterSecondReload.getAttribute('title');
      assert(
        titleAfterSecondReload === 'Sound on — click to mute',
        `After second reload, button shows sound-on state`
      );

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Button NOT on combo pages
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Sound toggle NOT on combo pages ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('domcontentloaded');

      const btn = page.locator('#sound-toggle-btn');
      const count = await btn.count();
      assert(count === 0, 'Sound toggle button is NOT present on rakdos combo page');

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Button NOT on about page
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Sound toggle NOT on about page ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/about`);
      await page.waitForLoadState('domcontentloaded');

      const btn = page.locator('#sound-toggle-btn');
      const count = await btn.count();
      assert(count === 0, 'Sound toggle button is NOT present on about page');

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Version check
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Version check ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('domcontentloaded');

      // Open the menu to see the version
      const menuBtn = page.locator('#menu-btn');
      await menuBtn.click();
      await page.waitForTimeout(300);

      const versionText = await page.locator('#settings-version').textContent();
      assert(
        versionText && versionText.includes(EXPECTED_VERSION),
        `Menu shows version ${EXPECTED_VERSION} (got: "${versionText}")`
      );

      await context.close();
    }

  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passes} passed, ${failures} failed`);

  if (failures > 0) {
    console.error('\nSome checks FAILED. Arc 55 is NOT verified.');
    process.exit(1);
  } else {
    console.log('\nAll checks PASSED. Arc 55 verified.');
  }
}

run().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
