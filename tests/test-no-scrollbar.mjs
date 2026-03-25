/**
 * Scrollbar verification: slides page must fit within viewport with no scrollbar.
 *
 * Checks:
 * 1. After dismissing the level intro, scrollHeight <= innerHeight (no scrollbar)
 * 2. After advancing through several cards, still no scrollbar
 * 3. The .done-zone footer's bottom edge is at or above window.innerHeight
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

async function gotoSlidesAndDismissIntro(browser) {
  const page = await browser.newPage();
  // Standard 1080p-ish viewport — representative of a desktop browser
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE_URL}/slides?subgroup=allied`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  // Dismiss level intro if present
  const introVisible = await page.isVisible('.level-intro').catch(() => false);
  if (introVisible) {
    await page.click('.level-intro');
    await page.waitForTimeout(500);
  }

  // Wait for card to appear
  await page.waitForSelector('.card', { timeout: 5000 });
  return page;
}

/**
 * Returns an object with scrollHeight, innerHeight, and whether a scrollbar is present.
 */
async function measureScroll(page) {
  return page.evaluate(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const innerHeight = window.innerHeight;
    return {
      scrollHeight,
      innerHeight,
      hasScrollbar: scrollHeight > innerHeight,
    };
  });
}

/**
 * Returns the bottom edge (in viewport px) of the .done-zone element.
 * Returns null if the element doesn't exist.
 */
async function getDoneZoneBottom(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.done-zone');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { bottom: rect.bottom, innerHeight: window.innerHeight };
  });
}

/**
 * Advance the card by clicking the card area and waiting for it to flip.
 * Based on tester notes: handleAdvance() waits ADVANCE_DELAY_MS (2000ms) before advancing.
 */
async function advanceCard(page) {
  await page.click('.card');
  await page.waitForTimeout(2500);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: No scrollbar after dismissing level intro (card 1)
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: No scrollbar on card 1 ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      const { scrollHeight, innerHeight, hasScrollbar } = await measureScroll(page);
      assert(
        !hasScrollbar,
        `No scrollbar on card 1 (scrollHeight=${scrollHeight}, innerHeight=${innerHeight})`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: No scrollbar after advancing through several cards
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: No scrollbar across cards 2–4 ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      for (let cardNum = 2; cardNum <= 4; cardNum++) {
        await advanceCard(page);

        const { scrollHeight, innerHeight, hasScrollbar } = await measureScroll(page);
        assert(
          !hasScrollbar,
          `No scrollbar on card ${cardNum} (scrollHeight=${scrollHeight}, innerHeight=${innerHeight})`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: .done-zone footer fits within viewport
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: .done-zone footer within viewport ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      const doneZone = await getDoneZoneBottom(page);
      assert(doneZone !== null, '.done-zone element exists in DOM');

      if (doneZone) {
        assert(
          doneZone.bottom <= doneZone.innerHeight,
          `.done-zone bottom edge (${Math.round(doneZone.bottom)}px) is within viewport (${doneZone.innerHeight}px)`,
        );
      }

      // Also check after advancing a couple of cards
      for (let cardNum = 2; cardNum <= 3; cardNum++) {
        await advanceCard(page);

        const dz = await getDoneZoneBottom(page);
        if (dz) {
          assert(
            dz.bottom <= dz.innerHeight,
            `.done-zone bottom (${Math.round(dz.bottom)}px) within viewport on card ${cardNum} (innerHeight=${dz.innerHeight}px)`,
          );
        }
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
    console.error(`\nScrollbar check FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nScrollbar check PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
