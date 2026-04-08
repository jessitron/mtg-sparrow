/**
 * Arc 74 verification: Test Affordances
 *
 * What changed:
 * - `?no-gas` URL param on welcome page exits the mana-gas IIFE early, leaving no animation running
 * - `?paused` URL param on slides page starts the session in a paused state
 *
 * Acceptance Criteria:
 * 1. (?no-gas) canvas#gas exists in DOM but window.stopManaGas is undefined (IIFE exited early)
 * 2. (?no-gas) welcome card and BEGIN button still present
 * 3. (?paused) after dismissing intro, pause button has footer-pause-btn--paused class
 * 4. (?paused) card name stays hidden after 3 seconds (timers are stopped)
 * 5. (normal welcome) window.stopManaGas is a function (gas is running)
 * 6. (normal slides) card name reveals automatically within 8 seconds
 * 7. Version 0.45.0 shown in settings panel
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

async function dismissIntro(page) {
  await sleep(600);
  const intro = page.locator('.level-intro, #level-intro, [class*="intro"]').first();
  const introCount = await intro.count();
  if (introCount > 0) {
    await page.keyboard.press('Space');
    await sleep(500);
    console.log('  INFO: Dismissed intro overlay via space');
  } else {
    await page.mouse.click(400, 300);
    await sleep(500);
    console.log('  INFO: Attempted intro dismissal via click');
  }
  await sleep(300);
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // Check 1: ?no-gas on welcome page
    // -----------------------------------------------------------------------
    console.log('\n=== Check 1: ?no-gas on welcome page ===');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/?no-gas`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      // Canvas element should exist in DOM
      const gasCount = await page.locator('#gas').count();
      assert(gasCount > 0, 'canvas#gas element exists in DOM with ?no-gas');

      // window.stopManaGas should be undefined — IIFE returned early, never defined it
      const stopManaGasType = await page.evaluate(() => typeof window.stopManaGas);
      assert(
        stopManaGasType === 'undefined',
        `window.stopManaGas is undefined with ?no-gas (got: "${stopManaGasType}")`
      );

      // Welcome card and BEGIN button should still be present
      const beginBtn = page.locator('#begin-btn, button:has-text("BEGIN"), a:has-text("BEGIN")').first();
      const beginCount = await beginBtn.count();
      assert(beginCount > 0, 'BEGIN button is present on welcome page with ?no-gas');

      await context.close();
    }

    // -----------------------------------------------------------------------
    // Check 2: ?paused=true on slides page
    // -----------------------------------------------------------------------
    console.log('\n=== Check 2: ?paused on slides page ===');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/slides?subgroup=allied&paused`);
      await page.waitForLoadState('networkidle');

      await dismissIntro(page);

      // Pause button should have the paused class
      const pauseBtn = page.locator('#pause-btn');
      const pauseBtnCount = await pauseBtn.count();
      assert(pauseBtnCount > 0, 'Pause button #pause-btn is present');

      const isPaused = await pauseBtn.evaluate(el => el.classList.contains('footer-pause-btn--paused'));
      assert(isPaused, 'Pause button has footer-pause-btn--paused class (session started paused)');

      // Card name should still be hidden (card-name-hidden class present)
      const nameHiddenInitially = await page.evaluate(() => {
        const name = document.querySelector('.card-name');
        return name ? name.classList.contains('card-name-hidden') : null;
      });
      assert(nameHiddenInitially === true, 'Card name has card-name-hidden class immediately after pause');

      // Wait 3 seconds — name should still be hidden because timers are stopped
      await sleep(3000);

      const nameStillHidden = await page.evaluate(() => {
        const name = document.querySelector('.card-name');
        return name ? name.classList.contains('card-name-hidden') : null;
      });
      assert(nameStillHidden === true, 'Card name is still hidden after 3 seconds (timers really paused)');

      await context.close();
    }

    // -----------------------------------------------------------------------
    // Check 3a: Normal welcome page — gas IS running
    // -----------------------------------------------------------------------
    console.log('\n=== Check 3a: Normal welcome page (no ?no-gas) ===');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      await sleep(800);

      const stopManaGasType = await page.evaluate(() => typeof window.stopManaGas);
      assert(
        stopManaGasType === 'function',
        `window.stopManaGas is a function on normal welcome page (got: "${stopManaGasType}")`
      );

      await context.close();
    }

    // -----------------------------------------------------------------------
    // Check 3b: Normal slides page — card name reveals automatically
    // -----------------------------------------------------------------------
    console.log('\n=== Check 3b: Normal slides page (no ?paused) ===');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('networkidle');

      await dismissIntro(page);

      // Pause button should NOT have the paused class
      const pauseBtn = page.locator('#pause-btn');
      const isPaused = await pauseBtn.evaluate(el => el.classList.contains('footer-pause-btn--paused'));
      assert(!isPaused, 'Slideshow is NOT paused on normal load (no ?paused param)');

      // Wait up to 8 seconds for the name to reveal automatically
      let nameRevealed = false;
      for (let i = 0; i < 16; i++) {
        await sleep(500);
        nameRevealed = await page.evaluate(() => {
          const name = document.querySelector('.card-name');
          return name ? !name.classList.contains('card-name-hidden') : false;
        });
        if (nameRevealed) break;
      }
      assert(nameRevealed, 'Card name reveals automatically within 8 seconds on normal slides page');

      await context.close();
    }

    // -----------------------------------------------------------------------
    // Check 4: Version 0.45.0 in settings panel
    // -----------------------------------------------------------------------
    console.log('\n=== Check 4: Version 0.45.0 in settings panel ===');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      // Open the menu/settings panel
      const menuBtn = page.locator('#menu-btn');
      const menuBtnCount = await menuBtn.count();
      assert(menuBtnCount > 0, 'Menu button #menu-btn is present');

      if (menuBtnCount > 0) {
        await menuBtn.click();
        await sleep(300);

        const versionEl = page.locator('#settings-version');
        const versionText = await versionEl.textContent();
        assert(
          versionText && versionText.includes('0.45.0'),
          `Version 0.45.0 appears in settings panel (got: "${versionText}")`
        );
      }

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
