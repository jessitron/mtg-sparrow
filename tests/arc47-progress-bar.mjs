/**
 * Arc 47 verification: Progress bar replaces text counter on slides page
 *
 * The text counter ("7 / 25") has been replaced with a slim inline progress bar
 * in the .footer-controls row.
 *
 * Implementation: cover-reveal approach — .progress-bar-track has a mana color
 * gradient; .progress-bar-cover sits on top and shrinks from the right to reveal
 * the gradient as the user advances through cards.
 *
 * Acceptance criteria:
 * 1. No text counter (.progress-counter) elements exist in the DOM
 * 2. No "X / Y" text pattern visible anywhere on the slides page
 * 3. A progress bar track (.progress-bar-track) exists in the footer controls row
 * 4. A progress bar cover (.progress-bar-cover) exists inside the track
 * 5. The track has role="progressbar" and appropriate aria attributes
 * 6. The cover width DECREASES as cards advance (revealing more gradient)
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
    // PHASE 1: No text counter in the DOM
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: No text counter in the DOM ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      // .progress-counter should not exist at all
      const progressCounterEl = await page.$('.progress-counter');
      assert(progressCounterEl === null, 'No .progress-counter elements exist in the DOM');

      // No visible "X / Y" pattern text on the page
      const pageText = await page.evaluate(() => document.body.innerText);
      const hasCounterPattern = /\d+\s*\/\s*\d+/.test(pageText);
      assert(
        !hasCounterPattern,
        `No "X / Y" counter text pattern visible on page (checked body.innerText)`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Progress bar elements exist
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Progress bar elements exist ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      // .progress-bar-track exists
      const trackEl = await page.$('.progress-bar-track');
      assert(trackEl !== null, '.progress-bar-track element exists in the DOM');

      // .progress-bar-cover exists inside the track
      const fillEl = await page.$('.progress-bar-track .progress-bar-cover');
      assert(fillEl !== null, '.progress-bar-cover exists inside .progress-bar-track');

      // .progress-bar-track is inside .footer-controls
      const trackInControls = await page.$('.footer-controls .progress-bar-track');
      assert(trackInControls !== null, '.progress-bar-track is inside .footer-controls row');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Accessibility attributes on the track
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Accessibility attributes ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      const ariaAttrs = await page.evaluate(() => {
        const track = document.querySelector('.progress-bar-track');
        if (!track) return null;
        return {
          role: track.getAttribute('role'),
          ariaValueNow: track.getAttribute('aria-valuenow'),
          ariaValueMin: track.getAttribute('aria-valuemin'),
          ariaValueMax: track.getAttribute('aria-valuemax'),
        };
      });

      assert(ariaAttrs !== null, '.progress-bar-track found for aria attribute check');

      if (ariaAttrs) {
        assert(
          ariaAttrs.role === 'progressbar',
          `track has role="progressbar" (got: "${ariaAttrs.role}")`,
        );
        assert(
          ariaAttrs.ariaValueMin !== null,
          `track has aria-valuemin attribute (got: "${ariaAttrs.ariaValueMin}")`,
        );
        assert(
          ariaAttrs.ariaValueMax !== null,
          `track has aria-valuemax attribute (got: "${ariaAttrs.ariaValueMax}")`,
        );
        assert(
          ariaAttrs.ariaValueNow !== null,
          `track has aria-valuenow attribute (got: "${ariaAttrs.ariaValueNow}")`,
        );

        const valueNow = parseInt(ariaAttrs.ariaValueNow, 10);
        const valueMin = parseInt(ariaAttrs.ariaValueMin, 10);
        const valueMax = parseInt(ariaAttrs.ariaValueMax, 10);

        assert(
          !isNaN(valueNow) && !isNaN(valueMin) && !isNaN(valueMax),
          `aria-value attributes are numeric (now=${valueNow}, min=${valueMin}, max=${valueMax})`,
        );
        assert(
          valueNow >= valueMin && valueNow <= valueMax,
          `aria-valuenow (${valueNow}) is within [${valueMin}, ${valueMax}]`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Cover width decreases as cards advance (revealing gradient)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Cover width decreases as cards advance ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      // Get cover width on card 1
      const coverWidthCard1 = await page.evaluate(() => {
        const cover = document.querySelector('.progress-bar-cover');
        if (!cover) return null;
        // Express as a ratio of the track width
        const track = document.querySelector('.progress-bar-track');
        const coverWidth = cover.getBoundingClientRect().width;
        const trackWidth = track ? track.getBoundingClientRect().width : 1;
        return trackWidth > 0 ? coverWidth / trackWidth : 0;
      });

      assert(coverWidthCard1 !== null, '.progress-bar-cover found for width measurement (card 1)');
      console.log(`  INFO: Cover width on card 1: ${(coverWidthCard1 * 100).toFixed(1)}% of track`);

      assert(
        coverWidthCard1 > 0,
        `Cover has nonzero width on card 1 (ratio: ${coverWidthCard1?.toFixed(4)})`,
      );

      // Advance to next card: click to reveal, wait for advance
      await page.click('.card');
      await page.waitForTimeout(2500); // wait for ADVANCE_DELAY_MS (2000ms) + margin

      // Get cover width on card 2
      const coverWidthCard2 = await page.evaluate(() => {
        const cover = document.querySelector('.progress-bar-cover');
        if (!cover) return null;
        const track = document.querySelector('.progress-bar-track');
        const coverWidth = cover.getBoundingClientRect().width;
        const trackWidth = track ? track.getBoundingClientRect().width : 1;
        return trackWidth > 0 ? coverWidth / trackWidth : 0;
      });

      assert(coverWidthCard2 !== null, '.progress-bar-cover found for width measurement (card 2)');
      console.log(`  INFO: Cover width on card 2: ${(coverWidthCard2 * 100).toFixed(1)}% of track`);

      assert(
        coverWidthCard2 < coverWidthCard1,
        `Cover width decreased from card 1 to card 2 (${(coverWidthCard1 * 100).toFixed(1)}% → ${(coverWidthCard2 * 100).toFixed(1)}%), revealing more gradient`,
      );

      // Also check that aria-valuenow updated
      const ariaValueNowCard2 = await page.evaluate(() => {
        const track = document.querySelector('.progress-bar-track');
        return track ? track.getAttribute('aria-valuenow') : null;
      });
      assert(
        ariaValueNowCard2 !== null && parseInt(ariaValueNowCard2, 10) >= 2,
        `aria-valuenow updated on card 2 (got: "${ariaValueNowCard2}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Progress bar is visually in the footer controls row
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Progress bar is visible in footer ===\n');
    {
      const page = await gotoSlidesAndDismissIntro(browser);

      const trackVisible = await page.isVisible('.progress-bar-track');
      assert(trackVisible, '.progress-bar-track is visible on the page');

      // Track should have some height (it's a slim bar, but > 0)
      const trackHeight = await page.evaluate(() => {
        const track = document.querySelector('.progress-bar-track');
        if (!track) return 0;
        return track.getBoundingClientRect().height;
      });
      assert(trackHeight > 0, `.progress-bar-track has visible height (${trackHeight}px)`);
      console.log(`  INFO: Track height: ${trackHeight}px`);

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
    console.error(`\nArc 47 progress bar verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 47 progress bar verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
