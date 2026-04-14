/**
 * Arc 81 verification: Sharp edges at scroll boundaries on the end page.
 *
 * What changed:
 * - The end page reel viewport uses a CSS mask gradient to fade top/bottom edges.
 * - New contextual behavior:
 *     at-top  class → top edge is sharp (no fade), bottom fades
 *     at-end  class → bottom edge is sharp (no fade), top fades
 *     neither → both edges fade (middle of reel)
 *     both    → no fading (only 1 section)
 *
 * Acceptance criteria:
 * 1. Page is version 0.50.0
 * 2. On load (index 0 = colleges): viewport has at-top, does NOT have at-end
 * 3. Top mask starts with black (sharp top), bottom fades to transparent
 * 4. After clicking bottom nav to advance past the first section: at-top is removed
 * 5. After advancing to the last section (share): at-end is present, at-top is not
 * 6. Bottom mask ends with black (sharp bottom) at the last section, top fades
 * 7. reel-nav-btn--hidden class is applied to correct buttons at boundaries
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
// The reel transition is 600ms — wait 800ms to be safe
const TRANSITION_WAIT_MS = 800;

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

/**
 * Returns the computed mask-image string for the viewport element.
 * Tries -webkit-mask-image as a fallback (Chromium exposes both).
 */
async function getMaskImage(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.level-sections-viewport');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    return style.maskImage || style.webkitMaskImage || null;
  });
}

async function getViewportClasses(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.level-sections-viewport');
    if (!el) return [];
    return Array.from(el.classList);
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Version is 0.50.0
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Bundle version is 0.50.0 ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js is served (HTTP 200)');
      const text = await response.text();
      assert(text.includes('0.50.0'), 'end.js bundle contains "0.50.0"');
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Initial state (at-top, not at-end)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Initial state — at-top class, not at-end ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('domcontentloaded');

      // Wait for the reel to render
      await page.waitForSelector('.level-sections-viewport', { timeout: 8000 });
      await sleep(500);

      const classes = await getViewportClasses(page);
      console.log(`  Viewport classes: ${classes.join(', ')}`);

      assert(classes.includes('at-top'), 'viewport has at-top class on initial load');
      assert(!classes.includes('at-end'), 'viewport does NOT have at-end class on initial load');

      // Top nav button should be hidden at the top
      const topBtnHidden = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(topBtnHidden === true, 'top nav button is hidden when at-top');

      // Bottom nav button should be visible at the top (more sections below)
      const bottomBtnHidden = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--bottom');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(bottomBtnHidden === false, 'bottom nav button is visible when at-top (not at end)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Mask CSS at initial position (top should start sharp = black)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Mask at initial position — top edge sharp ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForSelector('.level-sections-viewport', { timeout: 8000 });
      await sleep(500);

      const mask = await getMaskImage(page);
      console.log(`  Computed mask-image: ${mask}`);

      // The at-top mask starts with "black 0%" meaning the top edge is sharp.
      // We check the mask does NOT start with "transparent" (which would be the default fading top).
      assert(mask !== null, 'mask-image is set on viewport');

      if (mask) {
        // At-top mask: starts with "black 0%" (or close equivalent), ends with transparent
        // Default mask: starts with "transparent 0%"
        const startsSharp = !mask.startsWith('linear-gradient(to bottom, transparent') &&
                            !mask.includes('rgba(0, 0, 0, 0) 0%');
        assert(startsSharp, 'at-top: mask top edge starts sharp (black), not transparent');

        // Bottom should fade: mask ends with transparent
        const endsTransparent = mask.includes('transparent 100%') ||
                                mask.includes('rgba(0, 0, 0, 0) 100%');
        assert(endsTransparent, 'at-top: mask bottom edge fades to transparent');
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: After one advance — at-top removed
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: After advancing from top — at-top removed ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForSelector('.level-sections-viewport', { timeout: 8000 });
      await sleep(500);

      // Click the bottom nav button to advance one section
      const bottomBtn = page.locator('.reel-nav-btn--bottom');
      await bottomBtn.click();
      console.log('  Clicked bottom nav button...');
      await sleep(TRANSITION_WAIT_MS);

      const classes = await getViewportClasses(page);
      console.log(`  Viewport classes after 1 advance: ${classes.join(', ')}`);

      assert(!classes.includes('at-top'), 'at-top removed after advancing from first section');

      // With 6 sections total (5 levels + share), index 1 is not the end
      assert(!classes.includes('at-end'), 'at-end is not present at index 1 (not at last section)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Navigate to the last section — at-end present, at-top absent
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Navigate to last section — at-end class, not at-top ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForSelector('.level-sections-viewport', { timeout: 8000 });
      await sleep(500);

      // Click bottom nav until it gets the hidden class (we are at the last section)
      let attempts = 0;
      const MAX_ADVANCES = 10;

      while (attempts < MAX_ADVANCES) {
        const bottomHidden = await page.evaluate(() => {
          const btn = document.querySelector('.reel-nav-btn--bottom');
          return btn ? btn.classList.contains('reel-nav-btn--hidden') : true;
        });

        if (bottomHidden) {
          console.log(`  Reached last section after ${attempts} advances.`);
          break;
        }

        await page.locator('.reel-nav-btn--bottom').click();
        attempts++;
        console.log(`  Advance ${attempts}...`);
        await sleep(TRANSITION_WAIT_MS);
      }

      if (attempts >= MAX_ADVANCES) {
        console.error('  FAIL: Could not reach last section within max attempts');
        failures++;
      }

      const classes = await getViewportClasses(page);
      console.log(`  Viewport classes at last section: ${classes.join(', ')}`);

      assert(classes.includes('at-end'), 'viewport has at-end class at the last section');
      assert(!classes.includes('at-top'), 'viewport does NOT have at-top class at the last section');

      // Top nav button should be visible (can go back up)
      const topBtnHidden = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(topBtnHidden === false, 'top nav button is visible when at last section');

      // Bottom nav button should be hidden at the last section
      const bottomBtnHidden = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--bottom');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(bottomBtnHidden === true, 'bottom nav button is hidden when at-end');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Mask CSS at last section (bottom should end sharp = black)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Mask at last section — bottom edge sharp ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForSelector('.level-sections-viewport', { timeout: 8000 });
      await sleep(500);

      // Navigate to last section
      let attempts = 0;
      while (attempts < 10) {
        const bottomHidden = await page.evaluate(() => {
          const btn = document.querySelector('.reel-nav-btn--bottom');
          return btn ? btn.classList.contains('reel-nav-btn--hidden') : true;
        });
        if (bottomHidden) break;
        await page.locator('.reel-nav-btn--bottom').click();
        attempts++;
        await sleep(TRANSITION_WAIT_MS);
      }

      const mask = await getMaskImage(page);
      console.log(`  Computed mask-image at last section: ${mask}`);

      assert(mask !== null, 'mask-image is set on viewport at last section');

      if (mask) {
        // At-end mask: top fades (starts with transparent), bottom is sharp (black 100%)
        const topFades = mask.startsWith('linear-gradient(to bottom, transparent') ||
                         mask.includes('rgba(0, 0, 0, 0) 0%');
        assert(topFades, 'at-end: mask top edge fades (starts transparent)');

        const bottomSharp = mask.includes('black 100%') ||
                            mask.includes('rgb(0, 0, 0) 100%') ||
                            mask.includes('rgba(0, 0, 0, 1) 100%');
        assert(bottomSharp, 'at-end: mask bottom edge is sharp (black 100%)');
      }

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
    console.error(`\nArc 81 sharp-scroll-edges verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 81 sharp-scroll-edges verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
