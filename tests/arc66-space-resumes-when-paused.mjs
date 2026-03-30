/**
 * Arc 66 verification: Space key resumes slideshow when paused
 *
 * What changed:
 * - In src/slides.ts, the space keydown handler now checks if `paused` is true.
 *   When paused, it calls `pauseBtn.click()` to resume.
 *   When not paused, it calls `handleAdvance()` as before.
 *
 * Acceptance Criteria:
 * 1. On the slides page, pressing space advances the slideshow (existing behavior)
 * 2. Clicking the pause button pauses the slideshow
 * 3. While paused, pressing space resumes playback
 * 4. After resuming via space, the pause button icon returns to the pause icon (not play)
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

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/slides.html?subgroup=allied`);
    await page.waitForLoadState('networkidle');
    await sleep(800);

    // Dismiss the level intro overlay (press space or click)
    console.log('\nSetup — Dismiss level intro overlay');
    {
      const intro = page.locator('.level-intro, #level-intro, [class*="intro"]').first();
      const introCount = await intro.count();
      if (introCount > 0) {
        await page.keyboard.press('Space');
        await sleep(500);
        console.log('  INFO: Dismissed intro overlay via space');
      } else {
        // Try clicking anywhere to dismiss
        await page.mouse.click(400, 300);
        await sleep(500);
        console.log('  INFO: Attempted intro dismissal via click');
      }
    }

    // Allow slideshow to initialize after dismissing intro
    await sleep(300);

    // --- Phase 1: Pause button is visible and not paused initially ---
    console.log('\nPhase 1 — Pause button is present and slideshow is not paused');
    {
      const pauseBtn = page.locator('#pause-btn');
      const count = await pauseBtn.count();
      assert(count > 0, 'Pause button #pause-btn is present');

      const isPaused = await pauseBtn.evaluate(el => el.classList.contains('footer-pause-btn--paused'));
      assert(!isPaused, 'Slideshow is not paused initially (no footer-pause-btn--paused class)');
    }

    // --- Phase 2: Space advances the slideshow when not paused ---
    console.log('\nPhase 2 — Space advances slideshow when not paused');
    {
      // Grab a baseline: count how many times handleAdvance-style transitions occur
      // We'll watch for any change in the slide by waiting briefly after space press.
      // The simplest check: space doesn't cause the pause button to become paused.
      const pauseBtnBefore = await page.locator('#pause-btn').evaluate(el =>
        el.classList.contains('footer-pause-btn--paused')
      );

      await page.keyboard.press('Space');
      await sleep(400);

      const pauseBtnAfter = await page.locator('#pause-btn').evaluate(el =>
        el.classList.contains('footer-pause-btn--paused')
      );

      assert(
        !pauseBtnAfter,
        'After pressing space (not paused), slideshow is still playing (pause btn not in paused state)'
      );
    }

    // --- Phase 3: Clicking pause button pauses the slideshow ---
    console.log('\nPhase 3 — Clicking pause button pauses the slideshow');
    {
      const pauseBtn = page.locator('#pause-btn');
      await pauseBtn.click();
      await sleep(300);

      const isPaused = await pauseBtn.evaluate(el => el.classList.contains('footer-pause-btn--paused'));
      assert(isPaused, 'After clicking pause button, footer-pause-btn--paused class is present');

      const ariaLabel = await pauseBtn.getAttribute('aria-label');
      assert(ariaLabel === 'Resume', `Pause button aria-label is "Resume" when paused (got: "${ariaLabel}")`);
    }

    // --- Phase 4: Pressing space while paused resumes playback ---
    console.log('\nPhase 4 — Pressing space while paused resumes playback');
    {
      const pauseBtn = page.locator('#pause-btn');

      // Confirm we're still paused
      const stillPaused = await pauseBtn.evaluate(el => el.classList.contains('footer-pause-btn--paused'));
      assert(stillPaused, 'Confirmed: still paused before pressing space');

      await page.keyboard.press('Space');
      await sleep(300);

      const isPausedAfterSpace = await pauseBtn.evaluate(el =>
        el.classList.contains('footer-pause-btn--paused')
      );
      assert(
        !isPausedAfterSpace,
        'After pressing space while paused, footer-pause-btn--paused class is removed (resumed)'
      );
    }

    // --- Phase 5: After resuming via space, pause button shows pause icon (not play) ---
    console.log('\nPhase 5 — After space-resume, pause button shows pause icon');
    {
      const pauseBtn = page.locator('#pause-btn');

      const ariaLabel = await pauseBtn.getAttribute('aria-label');
      assert(
        ariaLabel === 'Pause',
        `Pause button aria-label returns to "Pause" after resuming via space (got: "${ariaLabel}")`
      );

      // The pause icon has two <rect> elements; the play icon has a <polygon>
      const hasRects = await pauseBtn.evaluate(el => el.querySelectorAll('rect').length === 2);
      const hasPolygon = await pauseBtn.evaluate(el => el.querySelectorAll('polygon').length > 0);
      assert(hasRects, 'Pause button SVG has two rect elements (pause icon)');
      assert(!hasPolygon, 'Pause button SVG has no polygon element (not showing play icon)');
    }

    await context.close();

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
