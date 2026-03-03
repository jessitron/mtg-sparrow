/**
 * Wheel telemetry verification test
 *
 * Tests:
 * 1. Bundle confirms end.wheel_event in source
 * 2. Wheel down on .level-sections-viewport advances from section 0 to section 1
 *    (verified by top nav button becoming visible — hidden at index 0, visible at index 1)
 * 3. Wait additional cooldown, wheel down again — now at section 2 (share), bottom button hidden
 * 4. Span flush — hold page alive for OTel batch timer
 * 5. Honeycomb verification (via MCP after test completes)
 *
 * Relies on reel_v1 DOM structure:
 *   button.reel-nav-btn--top  (hidden when at section 0, visible when reelIndex > 0)
 *   div.level-sections-viewport  (wheel target)
 *   button.reel-nav-btn--bottom  (hidden when at last section)
 *
 * Notes:
 * - Use button visibility as navigation proxy (scroll position unreliable in headless mode).
 * - localStorage must have both allied and enemy unlocked so sections render fully.
 * - Server must be running at http://localhost:3847. Use ./run-test-server before running.
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

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Bundle check — end.wheel_event in source
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Bundle confirms end.wheel_event attribute key ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js is served (HTTP 200)');

      const bundleText = await response.text();
      assert(bundleText.includes('end.wheel_event'), 'end.js contains "end.wheel_event" span event name');
      assert(bundleText.includes('wheel.action'), 'end.js contains "wheel.action" attribute key');
      assert(bundleText.includes('wheel.current_index'), 'end.js contains "wheel.current_index" attribute key');
      assert(bundleText.includes('wheel.cooldown_suppressed'), 'end.js contains "wheel.cooldown_suppressed" attribute key');
      assert(bundleText.includes('addEvent'), 'end.js contains "addEvent" (OTel span event API call)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Wheel navigation — advance from section 0 to section 1
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Wheel down advances section 0 → 1 ===\n');
    {
      const page = await browser.newPage();

      // Unlock both allied and enemy so the reel has two real sections
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      // Wait for requestAnimationFrame setup (viewport height + wheel listener wired)
      await page.waitForTimeout(500);

      // At section 0 (allied): top button should be hidden (reel-nav-btn--hidden class)
      const topBtnHiddenAtStart = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(topBtnHiddenAtStart === true, 'Top nav button is hidden at section 0 (initial state)');

      const bottomBtnVisibleAtStart = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--bottom');
        return btn ? !btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(bottomBtnVisibleAtStart === true, 'Bottom nav button is visible at section 0 (sections remain)');

      // Dispatch a wheel-down event on the viewport
      const viewport = await page.$('.level-sections-viewport');
      assert(viewport !== null, '.level-sections-viewport exists');

      if (viewport) {
        await viewport.dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
      }

      // Wait for the 600ms reel animation to complete
      await page.waitForTimeout(800);

      // At section 1 (enemy): top button should now be VISIBLE
      const topBtnVisibleAfterScroll = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? !btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(topBtnVisibleAfterScroll === true, 'Top nav button becomes visible after wheel-down (now at section 1)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Cooldown suppression — rapid second wheel ignored
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Rapid wheel suppressed by cooldown ===\n');
    {
      const page = await browser.newPage();

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const viewport = await page.$('.level-sections-viewport');
      assert(viewport !== null, '.level-sections-viewport exists for cooldown test');

      if (viewport) {
        // First wheel — should advance
        await viewport.dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
        // Immediately second wheel — within cooldown window, should be suppressed
        await page.waitForTimeout(100);
        await viewport.dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
      }

      // Wait for animation to complete
      await page.waitForTimeout(700);

      // Should be at section 1, not section 2 — bottom button still visible
      const bottomBtnVisible = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--bottom');
        return btn ? !btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(bottomBtnVisible === true, 'Bottom nav button still visible after suppressed rapid scroll (stopped at section 1)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Advance to section 2 after cooldown — bottom button hides
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: After cooldown, wheel-down to section 2 → bottom button hides ===\n');
    {
      const page = await browser.newPage();

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const viewport = await page.$('.level-sections-viewport');

      if (viewport) {
        // First wheel to section 1
        await viewport.dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
        await page.waitForTimeout(1000); // animation + cooldown
        // Second wheel to section 2 (share)
        await viewport.dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
        await page.waitForTimeout(800);
      }

      // At section 2 (last section): bottom button should be hidden
      const bottomBtnHiddenAtEnd = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--bottom');
        return btn ? btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(bottomBtnHiddenAtEnd === true, 'Bottom nav button hidden after reaching last section (section 2)');

      // Top button should remain visible
      const topBtnVisibleAtEnd = await page.evaluate(() => {
        const btn = document.querySelector('.reel-nav-btn--top');
        return btn ? !btn.classList.contains('reel-nav-btn--hidden') : null;
      });
      assert(topBtnVisibleAtEnd === true, 'Top nav button visible at last section (section 2)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Span flush — load page with URL params, hold for OTel batch timer
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Span flush (wheel events + section spans → Honeycomb) ===\n');
    {
      const page = await browser.newPage();

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Dispatch wheel events to generate telemetry data
      const viewport = await page.$('.level-sections-viewport');
      if (viewport) {
        // Advance to section 1
        await viewport.dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
        await page.waitForTimeout(800);
        // Try rapid scroll (should be suppressed — generates suppressed_cooldown event)
        await viewport.dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
        await page.waitForTimeout(200);
        // Advance to section 2
        await viewport.dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
        await page.waitForTimeout(800);
      }

      console.log('  Wheel events dispatched. Waiting 35s for OTel batch timer...');
      await page.waitForTimeout(35000);
      console.log('  Wait complete — spans including wheel events should be exported to Honeycomb.');

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
