/**
 * Arc 80 verification: Slide card width is consistent across all college names
 *
 * What changed:
 * - Previously only the current slide's name was rendered (hidden with opacity:0)
 * - "Witherbloom" being wider than other names caused the card to widen on that slide
 * - Fix: ALL pool names are rendered in a .card-name-stack CSS grid, stacked in the same
 *   cell (grid-area: 1/1). Only the active name is visibility:visible.
 *   The widest name always determines the card width, so widths never change between slides.
 *
 * Acceptance criteria:
 * 1. Card width is identical across at least 4 slides
 * 2. The name DOES appear after the reveal delay (fix didn't break reveal)
 * 3. .card-name-stack element exists in the DOM
 * 4. 5 .card-name elements exist inside .card-name-stack (one per college in pool)
 * 5. Bundle contains version 0.49.0
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
// Each card cycle: 3s pips + 2s name = 5s, plus 300ms buffer for crossfade/rendering
const CARD_CYCLE_MS = 5300;
// How long to wait after navigation before first measurement
const INITIAL_WAIT_MS = 800;
// How many slides to measure
const SLIDES_TO_MEASURE = 4;

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

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Bundle version is 0.49.0
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Bundle version is 0.49.0 ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/slides.js`);
      assert(response.status() === 200, 'dist/slides.js is served (HTTP 200)');
      const text = await response.text();
      assert(text.includes('0.49.0'), 'slides.js bundle contains "0.49.0"');
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: DOM structure — .card-name-stack with 5 .card-name elements
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: DOM structure — .card-name-stack with 5 names ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=colleges`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(INITIAL_WAIT_MS);

      // Dismiss the level intro
      const intro = page.locator('.level-intro');
      if (await intro.isVisible()) {
        await intro.click();
        await sleep(700);
      }

      // Wait for a card to appear
      await page.waitForSelector('.card', { timeout: 5000 });

      const stackCount = await page.locator('.card-name-stack').count();
      assert(stackCount > 0, '.card-name-stack element exists in the DOM');

      const nameCount = await page.locator('.card-name-stack .card-name').count();
      assert(nameCount === 5, `.card-name-stack contains exactly 5 .card-name elements (found ${nameCount})`);

      // Check that exactly one name is marked active
      const activeCount = await page.locator('.card-name-stack .card-name[data-active="true"]').count();
      assert(activeCount === 1, `Exactly 1 .card-name has data-active="true" (found ${activeCount})`);

      // Check all non-active names have visibility: hidden (set via CSS)
      // We verify the active one is visible after reveal delay
      console.log('  Waiting for name reveal (~3s)...');
      await sleep(3500);

      const activeName = page.locator('.card-name[data-active="true"]');
      const activeVisible = await activeName.isVisible();
      assert(activeVisible, 'Active name is visible after reveal delay');

      // Check active name has no card-name-hidden class (opacity revealed)
      const hasHiddenClass = await activeName.evaluate(el => el.classList.contains('card-name-hidden'));
      assert(!hasHiddenClass, 'Active name does NOT have card-name-hidden class after reveal');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Card width is consistent across multiple slides
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Card width consistency across slides ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=colleges`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(INITIAL_WAIT_MS);

      // Dismiss the level intro
      const intro = page.locator('.level-intro');
      if (await intro.isVisible()) {
        await intro.click();
        await sleep(700);
      }

      // Wait for first card
      await page.waitForSelector('.card', { timeout: 5000 });

      const widths = [];
      const names = [];

      for (let i = 0; i < SLIDES_TO_MEASURE; i++) {
        // Wait until partway through the reveal cycle to measure width
        // (after pips show but doesn't matter — width should be same at any point)
        await sleep(1500);

        // Measure card width
        const cardBox = await page.locator('.card').first().boundingBox();
        const activeName = await page.locator('.card-name[data-active="true"]').first().textContent().catch(() => 'unknown');

        if (cardBox) {
          const width = Math.round(cardBox.width);
          widths.push(width);
          names.push(activeName?.trim() ?? 'unknown');
          console.log(`  Slide ${i + 1}: "${activeName?.trim()}" — card width = ${width}px`);
        } else {
          console.error(`  FAIL: Could not measure card width on slide ${i + 1}`);
          failures++;
        }

        // Wait for the rest of this card cycle before the next slide appears
        await sleep(CARD_CYCLE_MS - 1500);
      }

      // All widths should be identical
      if (widths.length >= 2) {
        const first = widths[0];
        const allSame = widths.every(w => w === first);
        assert(
          allSame,
          `All ${widths.length} card widths are identical (${widths.join('px, ')}px) — names: ${names.join(', ')}`,
        );

        if (!allSame) {
          const min = Math.min(...widths);
          const max = Math.max(...widths);
          console.error(`  Width range: ${min}px – ${max}px (delta = ${max - min}px)`);

          // Additional diagnosis: flag which slides had different widths
          for (let i = 0; i < widths.length; i++) {
            if (widths[i] !== first) {
              console.error(`  Slide ${i + 1} ("${names[i]}") had different width: ${widths[i]}px vs expected ${first}px`);
            }
          }
        }
      } else {
        console.error('  FAIL: Could not collect enough width measurements');
        failures++;
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Non-active names are visually hidden (visibility: hidden)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Non-active names are visually hidden ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=colleges`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(INITIAL_WAIT_MS);

      // Dismiss the level intro
      const intro = page.locator('.level-intro');
      if (await intro.isVisible()) {
        await intro.click();
        await sleep(700);
      }

      await page.waitForSelector('.card', { timeout: 5000 });

      // Check that non-active names are not visible (hidden via CSS visibility:hidden)
      const nonActiveVisible = await page.evaluate(() => {
        const nonActiveNames = document.querySelectorAll('.card-name-stack .card-name:not([data-active="true"])');
        let anyVisible = false;
        for (const el of nonActiveNames) {
          const style = window.getComputedStyle(el);
          if (style.visibility !== 'hidden') {
            anyVisible = true;
          }
        }
        return anyVisible;
      });

      assert(!nonActiveVisible, 'Non-active .card-name elements have visibility:hidden (not leaking into view)');

      // Check the active name IS visible (visibility: visible from CSS)
      const activeNameVisible = await page.evaluate(() => {
        const activeEl = document.querySelector('.card-name-stack .card-name[data-active="true"]');
        if (!activeEl) return false;
        return window.getComputedStyle(activeEl).visibility === 'visible';
      });

      assert(activeNameVisible, 'Active .card-name has visibility:visible');

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
    console.error(`\nArc 80 slide-width verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 80 slide-width verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
