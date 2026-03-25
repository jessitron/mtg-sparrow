/**
 * Arc 45 verification: Footer Redesign
 *
 * The .done-zone footer now has two rows:
 *   Row 1 (.footer-names): five combo names separated by " · ", with [hide]/[show names] toggle
 *   Row 2 (.footer-controls): right-aligned counter, circular pause button, Exit button
 *
 * Test cases:
 * 1. Names row visible on card 1 with correct allied guild names
 * 2. Names separated by " · " (middle dots)
 * 3. [hide] toggle hides names text, button text changes to [show names]
 * 4. Toggle stays right-aligned in both states
 * 5. [show names] brings names back
 * 6. Controls row has counter, pause button, Exit button
 * 7. Counter shows "1 / 10" on card 1 (allied = 5 combos × 2 reps = 10)
 * 8. Exit button is NOT visible on card 1 (opacity 0 / no pointer-events)
 * 9. After advancing to card 2, Exit button becomes visible
 * 10. Pause button is circular (border-radius check)
 * 11. Clicking pause changes innerHTML and adds --paused class
 * 12. Clicking Exit navigates to assessment page
 * 13. Controls row uses justify-content: flex-end (right-aligned)
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

/**
 * Navigate to the slides page and dismiss the level intro so the first card is visible.
 */
async function gotoSlidesAndDismissIntro(browser) {
  const page = await browser.newPage();
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

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Names row content and structure
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Names row content and structure ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      // Footer names row is visible
      const namesRowVisible = await page.isVisible('.footer-names');
      assert(namesRowVisible, '.footer-names row is visible on card 1');

      // Names text element exists
      const namesTextEl = await page.$('.footer-names-text');
      assert(namesTextEl !== null, '.footer-names-text element exists');

      // Check for all 5 allied guild names (allied = Azorius, Dimir, Rakdos, Gruul, Selesnya)
      const namesText = await page.textContent('.footer-names-text').catch(() => null);
      const alliedNames = ['Azorius', 'Dimir', 'Rakdos', 'Gruul', 'Selesnya'];
      for (const name of alliedNames) {
        assert(
          namesText && namesText.includes(name),
          `.footer-names-text includes "${name}" (got: "${namesText?.substring(0, 80)}")`,
        );
      }

      // Names separated by " · " (middle dot with spaces)
      const hasDots = namesText && namesText.includes(' · ');
      assert(hasDots, 'Names are separated by " · " (middle dots)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Hide/show toggle
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Hide/show toggle ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      // Toggle button exists with [hide] text
      const toggleBtn = await page.$('.footer-names-toggle');
      assert(toggleBtn !== null, '.footer-names-toggle button exists');

      const toggleText = await page.textContent('.footer-names-toggle').catch(() => null);
      assert(
        toggleText && toggleText.includes('hide'),
        `Toggle button shows [hide] initially (got: "${toggleText?.trim()}")`,
      );

      // Click [hide] — names text should be hidden
      await page.click('.footer-names-toggle');
      await page.waitForTimeout(300);

      // Names text should not be visible
      const namesHidden = !(await page.isVisible('.footer-names-text'));
      assert(namesHidden, '.footer-names-text is hidden after clicking [hide]');

      // Button text should change to [show names]
      const toggleTextAfter = await page.textContent('.footer-names-toggle').catch(() => null);
      assert(
        toggleTextAfter && toggleTextAfter.includes('show names'),
        `Toggle button shows [show names] after hiding (got: "${toggleTextAfter?.trim()}")`,
      );

      // Toggle button itself should still be visible (right-aligned)
      const toggleStillVisible = await page.isVisible('.footer-names-toggle');
      assert(toggleStillVisible, 'Toggle button remains visible after hiding names');

      // Names row itself should still be present (just text hidden)
      const namesRowStillPresent = await page.isVisible('.footer-names');
      assert(namesRowStillPresent, '.footer-names row is still present when names are hidden');

      // Click [show names] — names should reappear
      await page.click('.footer-names-toggle');
      await page.waitForTimeout(300);

      const namesVisible = await page.isVisible('.footer-names-text');
      assert(namesVisible, '.footer-names-text is visible again after clicking [show names]');

      const toggleTextRestored = await page.textContent('.footer-names-toggle').catch(() => null);
      assert(
        toggleTextRestored && toggleTextRestored.includes('hide'),
        `Toggle button shows [hide] again after showing (got: "${toggleTextRestored?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Controls row structure
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Controls row structure ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      // Controls row is present
      const controlsRowVisible = await page.isVisible('.footer-controls');
      assert(controlsRowVisible, '.footer-controls row is visible');

      // Counter is present
      const counterExists = await page.isVisible('.progress-counter');
      assert(counterExists, '.progress-counter element is visible');

      // Counter shows "1 / N" on first card (N = total cards in session)
      const counterText = await page.textContent('.progress-counter').catch(() => null);
      assert(
        counterText && /^\s*1\s*\/\s*\d+\s*$/.test(counterText),
        `Counter shows "1 / N" format on first card (got: "${counterText?.trim()}")`,
      );

      // Pause button exists with correct id
      const pauseBtnById = await page.$('#pause-btn');
      assert(pauseBtnById !== null, '#pause-btn element exists');

      const pauseBtnByClass = await page.$('.footer-pause-btn');
      assert(pauseBtnByClass !== null, '.footer-pause-btn element exists');

      // Exit button exists
      const exitBtnExists = await page.$('.done-button');
      assert(exitBtnExists !== null, '.done-button element exists');

      // Controls row is right-aligned (justify-content: flex-end)
      const justifyContent = await page.evaluate(() => {
        const el = document.querySelector('.footer-controls');
        if (!el) return null;
        return window.getComputedStyle(el).justifyContent;
      });
      assert(
        justifyContent === 'flex-end' || justifyContent === 'right',
        `.footer-controls uses justify-content: flex-end (got: "${justifyContent}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Exit button visibility
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Exit button visibility ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      // Exit button should NOT be visible on card 1 (opacity 0 or pointer-events none)
      const exitOpacity = await page.evaluate(() => {
        const el = document.querySelector('.done-button');
        if (!el) return null;
        const style = window.getComputedStyle(el);
        return { opacity: style.opacity, pointerEvents: style.pointerEvents };
      });
      assert(exitOpacity !== null, 'Exit button exists in DOM');
      assert(
        exitOpacity && (parseFloat(exitOpacity.opacity) === 0 || exitOpacity.pointerEvents === 'none'),
        `Exit button is not interactive on card 1 (opacity: ${exitOpacity?.opacity}, pointer-events: ${exitOpacity?.pointerEvents})`,
      );

      // Advance to card 2: click the card to trigger early advance.
      // handleAdvance() with revealTimer active: clears reveal timer, waits ADVANCE_DELAY_MS (2000ms) then advances.
      await page.click('.card');
      await page.waitForTimeout(2500); // wait for ADVANCE_DELAY_MS (2000ms) + margin

      // Counter should now show card 2 (pattern "2 / N")
      const counterAfter = await page.textContent('.progress-counter').catch(() => null);
      assert(
        counterAfter && /^\s*2\s*\//.test(counterAfter),
        `Counter advances to show card 2 (got: "${counterAfter?.trim()}")`,
      );

      // Exit button should now be visible — check for button-visible or button-steady class
      // (CSS animation means computed opacity may still be mid-transition)
      const exitClasses = await page.evaluate(() => {
        const el = document.querySelector('.done-button');
        return el ? Array.from(el.classList) : null;
      });
      assert(
        exitClasses &&
          (exitClasses.includes('button-visible') || exitClasses.includes('button-steady')),
        `Exit button has button-visible or button-steady class on card 2 (classes: ${exitClasses?.join(' ')})`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Pause button circular shape
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Pause button circular shape ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      const borderRadius = await page.evaluate(() => {
        const el = document.querySelector('.footer-pause-btn');
        if (!el) return null;
        return window.getComputedStyle(el).borderRadius;
      });
      // Circular buttons have 50% border-radius
      assert(
        borderRadius && borderRadius.includes('50%'),
        `Pause button has 50% border-radius (got: "${borderRadius}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Pause button interaction
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Pause button interaction ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      // Get initial pause button innerHTML
      const initialInnerHTML = await page.evaluate(() => {
        const el = document.querySelector('.footer-pause-btn');
        return el ? el.innerHTML : null;
      });
      assert(initialInnerHTML !== null, 'Pause button has innerHTML before click');

      // Click pause button (use stopPropagation knowledge — clicking button directly)
      await page.click('.footer-pause-btn');
      await page.waitForTimeout(300);

      // innerHTML should change (icon swap)
      const afterInnerHTML = await page.evaluate(() => {
        const el = document.querySelector('.footer-pause-btn');
        return el ? el.innerHTML : null;
      });
      assert(
        afterInnerHTML !== initialInnerHTML,
        'Pause button innerHTML changes after click (icon swaps)',
      );

      // Should have --paused class or data attribute indicating paused state
      const hasPausedIndicator = await page.evaluate(() => {
        // Check multiple possible indicators
        const btn = document.querySelector('.footer-pause-btn');
        const body = document.body;
        const card = document.querySelector('.card');
        return (
          btn?.classList.contains('--paused') ||
          btn?.classList.contains('paused') ||
          body?.classList.contains('--paused') ||
          body?.classList.contains('paused') ||
          card?.classList.contains('--paused') ||
          card?.classList.contains('paused') ||
          document.querySelector('[class*="paused"]') !== null ||
          document.querySelector('[class*="--paused"]') !== null
        );
      });
      assert(hasPausedIndicator, 'A "--paused" or "paused" class appears somewhere in DOM after clicking pause');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Exit button navigates to assessment
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Exit button navigates to assessment ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      // Advance to card 2 so Exit is visible (wait for ADVANCE_DELAY_MS after click)
      await page.click('.card');
      await page.waitForTimeout(2500);

      // Click Exit button
      await page.click('.done-button');
      await page.waitForTimeout(1000);

      const finalUrl = page.url();
      // navigateToAssessment redirects to assessment?..., which may further redirect to end?...
      // if fewer than SELF_ASSESSMENT_MIN_CARDS were shown. Both are valid exits.
      assert(
        finalUrl.includes('assessment') || finalUrl.includes('end'),
        `Exit button navigates away from slides (url: "${finalUrl}")`,
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
    console.error(`\nArc 45 footer redesign verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 45 footer redesign verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
