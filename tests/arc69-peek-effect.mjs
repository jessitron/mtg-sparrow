/**
 * Arc 69 verification: End screen window peek effect
 *
 * What changed:
 * - PEEK_PX = 60 added to viewport height calculation
 * - First section: bottom peek only (30px)
 * - Last section: top peek only (30px)
 * - Middle sections: both top and bottom peek (60px total)
 * - CSS mask gradient widened from 5%/95% to 12%/88% for fade effect
 *
 * Acceptance Criteria:
 * 1. The end screen loads and reel navigation still works
 * 2. The viewport is taller than section content by ~30px for first section
 * 3. Middle sections have viewport ~60px taller than section content
 * 4. Navigation between sections still works smoothly
 * 5. The first section doesn't show peek above (top nav hidden)
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const PEEK_PX = 60;

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

function assertApprox(actual, expected, tolerance, message) {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    console.log(`  PASS: ${message} (got ${actual}, expected ~${expected})`);
    passes++;
  } else {
    console.error(`  FAIL: ${message} (got ${actual}, expected ~${expected} ±${tolerance})`);
    failures++;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getHeights(page) {
  return page.evaluate(() => {
    const viewport = document.querySelector('.level-sections-viewport');
    const section = document.querySelector('.level-section');
    return {
      viewportHeight: viewport ? viewport.offsetHeight : null,
      sectionHeight: section ? section.offsetHeight : null,
    };
  });
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // --- Test 1: End screen loads and renders the reel viewport ---
    console.log('\nTest 1 — End screen loads and reel viewport is present');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const viewportExists = await page.locator('.level-sections-viewport').count();
      assert(viewportExists > 0, 'level-sections-viewport element is present');

      const sectionExists = await page.locator('.level-section').count();
      assert(sectionExists > 0, 'At least one level-section is present');

      await context.close();
    }

    // --- Test 2: First section — viewport is taller than section by ~PEEK_PX/2 (30px) ---
    console.log('\nTest 2 — First section: viewport is taller than section by ~30px (bottom peek only)');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const { viewportHeight, sectionHeight } = await getHeights(page);
      assert(viewportHeight !== null, 'viewport height is measurable');
      assert(sectionHeight !== null, 'section height is measurable');

      if (viewportHeight !== null && sectionHeight !== null) {
        const diff = viewportHeight - sectionHeight;
        // First section: peek bottom only = PEEK_PX / 2 = 30
        assertApprox(diff, PEEK_PX / 2, 5,
          `Viewport is taller than section by ~${PEEK_PX / 2}px at first section`);
      }

      await context.close();
    }

    // --- Test 3: First section top nav button is hidden ---
    console.log('\nTest 3 — First section: top nav button is hidden (nothing above to peek at)');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const topBtnHidden = await page.locator('.reel-nav-btn--top').evaluate(
        el => el.classList.contains('reel-nav-btn--hidden')
      );
      assert(topBtnHidden, 'Top nav button is hidden on first section');

      await context.close();
    }

    // --- Test 4: Navigation works — clicking down nav moves to next section ---
    console.log('\nTest 4 — Navigation works: clicking down button advances to next section');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      // Record initial viewport height before navigation
      const before = await getHeights(page);

      const bottomBtn = page.locator('.reel-nav-btn--bottom');
      await bottomBtn.click();
      await sleep(700); // wait for animation

      // Top nav should now be visible
      const topBtnHidden = await page.locator('.reel-nav-btn--top').evaluate(
        el => el.classList.contains('reel-nav-btn--hidden')
      );
      assert(!topBtnHidden, 'Top nav button is visible after moving to second section');

      await context.close();
    }

    // --- Test 5: Middle section — viewport is taller than section by ~PEEK_PX (60px) ---
    console.log('\nTest 5 — Middle section: viewport is taller than section by ~60px (peek top and bottom)');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      // Start at /end and navigate to the second section (enemy guilds — middle)
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const bottomBtn = page.locator('.reel-nav-btn--bottom');
      await bottomBtn.click();
      await sleep(700);

      // Now we're at section 1 (enemy guilds), which has sections before and after it
      // Use evaluate to measure both the viewport and *this* section's height
      const { viewportHeight, sectionHeight } = await page.evaluate(() => {
        const viewport = document.querySelector('.level-sections-viewport');
        // All sections, find the one currently in view by checking reel transform
        const sections = Array.from(document.querySelectorAll('.level-section'));
        // The active section height — check actual sections array
        // Use the second section (index 1)
        const section = sections[1];
        return {
          viewportHeight: viewport ? viewport.offsetHeight : null,
          sectionHeight: section ? section.offsetHeight : null,
        };
      });

      assert(viewportHeight !== null, 'viewport height is measurable at middle section');
      assert(sectionHeight !== null, 'section height is measurable at middle section');

      if (viewportHeight !== null && sectionHeight !== null) {
        const diff = viewportHeight - sectionHeight;
        // Middle section: peek top + peek bottom = PEEK_PX / 2 + PEEK_PX / 2 = PEEK_PX = 60
        assertApprox(diff, PEEK_PX, 5,
          `Viewport is taller than section by ~${PEEK_PX}px at middle section`);
      }

      await context.close();
    }

    // --- Test 6: Navigate all the way to last section — bottom nav hidden, peek top only ---
    console.log('\nTest 6 — Last section: bottom nav is hidden and viewport has top peek only');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const bottomBtn = page.locator('.reel-nav-btn--bottom');

      // Navigate to last section
      for (let i = 0; i < 10; i++) {
        const hidden = await bottomBtn.evaluate(el => el.classList.contains('reel-nav-btn--hidden'));
        if (hidden) break;
        await bottomBtn.click();
        await sleep(700);
      }

      // Bottom nav should be hidden
      const bottomBtnHidden = await bottomBtn.evaluate(
        el => el.classList.contains('reel-nav-btn--hidden')
      );
      assert(bottomBtnHidden, 'Bottom nav button is hidden at last section');

      // Top nav should still be visible
      const topBtnHidden = await page.locator('.reel-nav-btn--top').evaluate(
        el => el.classList.contains('reel-nav-btn--hidden')
      );
      assert(!topBtnHidden, 'Top nav button is still visible at last section');

      // Viewport should be taller than the last section by ~PEEK_PX/2 (top peek only)
      const { viewportHeight } = await getHeights(page);
      const lastSectionHeight = await page.evaluate(() => {
        const sections = Array.from(document.querySelectorAll('.level-section'));
        const last = sections[sections.length - 1];
        return last ? last.offsetHeight : null;
      });

      if (viewportHeight !== null && lastSectionHeight !== null) {
        const diff = viewportHeight - lastSectionHeight;
        assertApprox(diff, PEEK_PX / 2, 5,
          `Viewport is taller than last section by ~${PEEK_PX / 2}px (top peek only)`);
      }

      await context.close();
    }

    // --- Test 7: Navigation up works after going down ---
    console.log('\nTest 7 — Navigation up works: clicking up button goes back to previous section');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      // Go down to second section
      const bottomBtn = page.locator('.reel-nav-btn--bottom');
      await bottomBtn.click();
      await sleep(700);

      // Confirm we're not at top (top btn visible)
      const topBtnHiddenAfterDown = await page.locator('.reel-nav-btn--top').evaluate(
        el => el.classList.contains('reel-nav-btn--hidden')
      );
      assert(!topBtnHiddenAfterDown, 'Top nav button visible after navigating down');

      // Now go back up
      const topBtn = page.locator('.reel-nav-btn--top');
      await topBtn.click();
      await sleep(700);

      // Should be back at first section, top btn hidden again
      const topBtnHiddenAfterUp = await page.locator('.reel-nav-btn--top').evaluate(
        el => el.classList.contains('reel-nav-btn--hidden')
      );
      assert(topBtnHiddenAfterUp, 'Top nav button hidden again after navigating back up to first section');

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
