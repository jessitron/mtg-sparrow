/**
 * Wheel telemetry verification test (Arc 27 — accumulated deltaY approach)
 *
 * Tests:
 * 1. Bundle confirms updated wheel telemetry attribute keys
 * 2. Small wheel event (deltaY < 700 threshold) does NOT advance section
 * 3. Accumulated wheel events reaching threshold DO advance section
 * 4. Wheel on document (not just viewport) triggers navigation
 * 5. Direction change resets accumulator
 * 6. Advance to last section — bottom button hides
 * 7. Span flush — hold page alive for OTel batch timer
 *
 * Reel navigation model (reel_v1 with accumulated-delta wheel handler):
 *   - Listener is on `document`, not the viewport element
 *   - Events accumulate deltaY; advance only when |accumulated| >= 700
 *   - On direction change, accumulator resets to current event's deltaY
 *   - On advance, accumulator resets to 0
 *   - No cooldown timer — threshold is the gate
 *
 * DOM navigation proxy (headless-safe):
 *   button.reel-nav-btn--top  — hidden (reel-nav-btn--hidden) at section 0, visible at 1+
 *   button.reel-nav-btn--bottom — hidden at last section, visible otherwise
 *
 * Server must be running at http://localhost:3847. Use ./run-test-server before running.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const END_URL = `${BASE_URL}/end?subgroup=allied&cards=10&completed=true&assessment=getting_there`;

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

/** Unlock both subgroups so the reel renders allied + enemy + share sections */
function progressionScript() {
  localStorage.setItem('sparrow-deck.progression', JSON.stringify({
    unlockedSubgroups: ['allied', 'enemy'],
    completedSubgroups: ['allied', 'enemy'],
  }));
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Bundle check — new wheel telemetry attributes
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Bundle confirms accumulated-delta wheel telemetry ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js is served (HTTP 200)');

      const bundleText = await response.text();
      assert(bundleText.includes('end.wheel_event'), 'end.js contains "end.wheel_event" span event name');
      assert(bundleText.includes('wheel.action'), 'end.js contains "wheel.action" attribute key');
      assert(bundleText.includes('wheel.accumulated_deltaY'), 'end.js contains "wheel.accumulated_deltaY" attribute key');
      assert(bundleText.includes('wheel.deltaY'), 'end.js contains "wheel.deltaY" attribute key');
      assert(bundleText.includes('wheel.current_index'), 'end.js contains "wheel.current_index" attribute key');
      assert(bundleText.includes('accumulating'), 'end.js contains "accumulating" action value');
      assert(bundleText.includes('addEvent'), 'end.js contains OTel addEvent API call');
      // Confirm old cooldown approach is gone
      assert(!bundleText.includes('WHEEL_COOLDOWN_MS'), 'end.js does NOT contain old WHEEL_COOLDOWN_MS constant');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Small wheel event does NOT advance (below threshold)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Small wheel event (deltaY=100) does NOT advance section ===\n');
    {
      const page = await browser.newPage();
      await page.addInitScript(progressionScript);

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500); // wait for requestAnimationFrame setup

      // Confirm at section 0 — top button hidden
      const atSectionZero = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(atSectionZero === true, 'Top button hidden at section 0 (initial state)');

      // Dispatch a small wheel event — deltaY 100, well below 700 threshold
      await page.evaluate(() => {
        document.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
      });
      await page.waitForTimeout(800);

      // Top button should still be hidden — no advance happened
      const stillAtZero = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(stillAtZero === true, 'Top button still hidden after small wheel (below threshold, no advance)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Accumulated wheel events advance section 0 → 1
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Accumulated deltaY >= 700 advances section 0 → 1 ===\n');
    {
      const page = await browser.newPage();
      await page.addInitScript(progressionScript);

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Dispatch multiple events accumulating to >= 700
      // 7 × 120 = 840 — crosses threshold on the 6th event (720 >= 700)
      await page.evaluate(() => {
        for (let i = 0; i < 7; i++) {
          document.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
        }
      });

      // Wait for reel animation (600ms) + buffer
      await page.waitForTimeout(900);

      // Top button should now be visible — we advanced to section 1
      const advancedToOne = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? !btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(advancedToOne === true, 'Top button visible after accumulating 840 deltaY (section 0 → 1)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Wheel listener is on document (not just viewport)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Wheel on document body (outside viewport) also navigates ===\n');
    {
      const page = await browser.newPage();
      await page.addInitScript(progressionScript);

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Fire on body element to confirm listener is document-wide
      await page.evaluate(() => {
        document.body.dispatchEvent(new WheelEvent('wheel', {
          deltaY: 800, // single event over threshold
          bubbles: true,
          cancelable: true
        }));
      });

      await page.waitForTimeout(900);

      const advancedFromBody = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? !btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(advancedFromBody === true, 'Section advances via wheel on document.body (listener is document-wide)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Direction change resets accumulator
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Direction change resets accumulator ===\n');
    {
      const page = await browser.newPage();
      await page.addInitScript(progressionScript);

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Accumulate downward (600), then reverse (up -100) — should reset and not advance
      await page.evaluate(() => {
        document.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true }));
        document.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true }));
        // Direction change: accumulated was 600, now resets to -100
        document.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
      });
      await page.waitForTimeout(800);

      // Should still be at section 0 — the reverse reset the accumulator
      const stillAtZeroAfterReverse = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(stillAtZeroAfterReverse === true, 'Direction change resets accumulator — section did not advance');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Advance to section 2 then verify at last section
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Advance to section 2 (share) — bottom button hides ===\n');
    {
      const page = await browser.newPage();
      await page.addInitScript(progressionScript);

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // First advance: accumulate 840 (7 × 120) → section 1
      await page.evaluate(() => {
        for (let i = 0; i < 7; i++) {
          document.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
        }
      });
      await page.waitForTimeout(900); // animation complete, accumulator reset to 0

      // Second advance: another 840 → section 2
      await page.evaluate(() => {
        for (let i = 0; i < 7; i++) {
          document.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
        }
      });
      await page.waitForTimeout(900);

      const bottomHidden = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--bottom');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(bottomHidden === true, 'Bottom button hidden at last section (section 2 — share)');

      const topVisible = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? !btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(topVisible === true, 'Top button visible at last section (section 2)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Span flush — generate telemetry data and hold for OTel batch timer
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Span flush — generate wheel events, wait 35s for OTel ===\n');
    {
      const page = await browser.newPage();
      await page.addInitScript(progressionScript);

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Generate: accumulating events, then advance, then bounds-suppressed
      await page.evaluate(() => {
        // Small events → action: 'accumulating' (deltaY=100 each, total 200)
        document.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
        document.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
        // Continue accumulating to threshold → action: 'advance' at event 6 (total 740)
        for (let i = 0; i < 6; i++) {
          document.dispatchEvent(new WheelEvent('wheel', { deltaY: 90, bubbles: true, cancelable: true }));
        }
      });
      await page.waitForTimeout(900);

      // Advance to section 2
      await page.evaluate(() => {
        for (let i = 0; i < 7; i++) {
          document.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
        }
      });
      await page.waitForTimeout(900);

      // Try to go further down (past bounds) → action: 'suppressed_bounds'
      await page.evaluate(() => {
        document.dispatchEvent(new WheelEvent('wheel', { deltaY: 800, bubbles: true, cancelable: true }));
      });
      await page.waitForTimeout(300);

      console.log('  Wheel events dispatched (accumulating, advance, suppressed_bounds). Waiting 35s for OTel batch timer...');
      await page.waitForTimeout(35000);
      console.log('  Wait complete — spans including wheel events should be in Honeycomb.');

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
    console.error(`\nWheel telemetry verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nWheel telemetry verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
