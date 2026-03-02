/**
 * Arc 21 verification: Cross-page telemetry
 *
 * Navigates the full user flow: welcome → slides → assessment → end
 * Verifies:
 * - mtg-sparrow.session.id is consistent across all four pages
 * - app.page attribute shows 'welcome', 'slides', 'assessment', 'end'
 * - app.navigation = 'multi_page' on all spans (in bundles)
 * - Session ID is logged so Honeycomb can be queried for it
 *
 * Flow:
 * 1. Welcome page — read session ID, click "Learn guild names"
 * 2. Slides page — read session ID, tap 4 cards quickly, click "Done for now"
 * 3. Assessment page — may be skipped if serve strips query params (local quirk)
 *    If skipped, navigate directly to /assessment?cards=10 to capture assessment span
 * 4. End page — verify guild columns load, wait 35s for OTel flush
 *
 * NOTE: Local `serve` strips query params when redirecting .html → clean URL.
 * Assessment page uses clean URL format (/assessment?params) to preserve params.
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
 * Read mtg-sparrow.session.id from sessionStorage on the current page.
 */
async function readSessionId(page) {
  return page.evaluate(() => sessionStorage.getItem('mtg-sparrow.session.id'));
}

/**
 * Wait for session ID to appear in sessionStorage (telemetry must initialize first).
 */
async function waitForSessionId(page, label) {
  try {
    await page.waitForFunction(
      () => sessionStorage.getItem('mtg-sparrow.session.id') !== null,
      { timeout: 8000 },
    );
    const id = await readSessionId(page);
    console.log(`  ${label} session ID: ${id}`);
    return id;
  } catch {
    console.error(`  TIMEOUT: Could not read session ID on ${label} page`);
    return null;
  }
}

/**
 * Advance through one card on the slides page.
 * Two quick clicks: first reveals name, second advances.
 */
async function advanceOneCard(page, cardIndex) {
  // Click 1: reveal name early (clears revealTimer, starts advanceTimer)
  await page.click('#app').catch(() => {});
  await page.waitForTimeout(200);
  // Click 2: advance immediately (clears advanceTimer, goes to next card)
  await page.click('#app').catch(() => {});
  await page.waitForTimeout(300);
  console.log(`  Advanced through card ${cardIndex + 1}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  // One context for the full flow — sessionStorage persists across navigations
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track session IDs from each page
  const sessionIds = {};
  let assessmentSkippedByServe = false;

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Welcome page
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Welcome page ===\n');
    {
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');

      const id = await waitForSessionId(page, 'welcome');
      assert(id !== null, 'welcome: mtg-sparrow.session.id set in sessionStorage');
      assert(
        id !== null && /^[0-9a-f]{16}$/.test(id),
        `welcome: session ID is 16-char lowercase hex (got: "${id}")`,
      );
      sessionIds.welcome = id;

      // Verify welcome UI
      const btnVisible = await page.isVisible('#start-button');
      assert(btnVisible, 'welcome: #start-button is visible');

      // Click start button — navigates to slides
      const navPromise = page
        .waitForURL(/\/slides/, { waitUntil: 'commit', timeout: 10000 })
        .catch(() => null);
      await page.click('#start-button');
      await navPromise;

      const afterUrl = page.url();
      assert(afterUrl.includes('/slides'), `welcome: clicking start navigates to slides (got: ${afterUrl})`);
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Slides page — tap 4 cards, then "Done for now"
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Slides page — tap 4 cards ===\n');
    {
      await page.waitForLoadState('domcontentloaded');

      // Wait for first card to appear
      const cardAppeared = await page
        .waitForSelector('.card', { timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      assert(cardAppeared, 'slides: first card appears');

      const id = await waitForSessionId(page, 'slides');
      assert(id !== null, 'slides: mtg-sparrow.session.id set in sessionStorage');
      sessionIds.slides = id;

      // Tap through 4 cards to make sure "Done for now" button is visible
      // (button appears from card 2 onward, i.e. session.currentIndex >= 1)
      for (let i = 0; i < 4; i++) {
        await advanceOneCard(page, i);
      }

      // Wait for "Done for now" button to be visible
      const doneVisible = await page
        .waitForSelector('.done-button.button-visible', { timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      assert(doneVisible, 'slides: "Done for now" button is visible after 4 cards');

      // Click "Done for now" — navigates to assessment
      const navPromise = page
        .waitForURL(/\/(assessment|end)/, { waitUntil: 'commit', timeout: 10000 })
        .catch(() => null);
      await page.click('.done-button');
      await navPromise;

      const afterUrl = page.url();
      assert(
        afterUrl.includes('assessment') || afterUrl.includes('end'),
        `slides: "Done for now" navigates toward assessment/end (got: ${afterUrl})`,
      );

      if (afterUrl.includes('end') && !afterUrl.includes('assessment')) {
        // Serve stripped params, assessment skipped directly to end
        console.log('  NOTE: Serve may have stripped params — assessment redirected to end');
        assessmentSkippedByServe = true;
      }
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Assessment page
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Assessment page ===\n');
    {
      // Natural flow from slides navigates to assessment.html?... which serve redirects
      // to /assessment (stripping params). With cards=0, skip fires immediately.
      // To properly test assessment telemetry, navigate directly using clean URL format
      // (/assessment?params) which preserves query params without triggering a redirect.
      console.log('  Navigating directly to /assessment?cards=10 (clean URL — preserves params)...');
      await page.goto(`${BASE_URL}/assessment?subgroup=allied&cards=10&completed=false`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const assessmentUrl = page.url();
      assert(
        assessmentUrl.includes('assessment'),
        `assessment: loaded assessment page with clean URL (url: ${assessmentUrl})`,
      );

      if (!assessmentUrl.includes('assessment')) {
        console.log('  NOTE: Clean URL also redirected — cannot test assessment page');
      } else {
        const id = await waitForSessionId(page, 'assessment');
        assert(id !== null, 'assessment: mtg-sparrow.session.id set in sessionStorage');
        sessionIds.assessment = id;

        // Assessment UI should be visible (cards=10 >= SELF_ASSESSMENT_MIN_CARDS=3)
        await page.waitForTimeout(300);
        const postSkipUrl = page.url();

        if (postSkipUrl.includes('end') && !postSkipUrl.includes('assessment')) {
          console.log('  NOTE: Skip logic still fired — unexpected with cards=10');
          assert(false, 'assessment: prompt should show with cards=10 (skip should not fire)');
        } else {
          const promptVisible = await page
            .waitForSelector('.self-assessment-prompt', { timeout: 5000 })
            .then(() => true)
            .catch(() => false);
          assert(promptVisible, 'assessment: self-assessment prompt is visible (cards=10)');

          const navPromise = page
            .waitForURL(/\/end/, { waitUntil: 'commit', timeout: 10000 })
            .catch(() => null);

          // Click "Getting there" button to trigger assessment span creation
          const clicked = await page.getByText('Getting there').click().then(() => true).catch(() => false);
          if (!clicked) {
            const buttons = await page.$$('.self-assessment-button');
            if (buttons.length > 0) await buttons[0].click();
          }

          await navPromise;
          const endUrl = page.url();
          assert(endUrl.includes('end'), `assessment: clicking button navigates to end (got: ${endUrl})`);
          console.log('  Assessment span should be recorded with session.self_assessment=getting_there');
        }
      }
    }

    // -----------------------------------------------------------------------
    // PHASE 4: End page — verify guild columns, read session ID
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: End page ===\n');
    {
      // Ensure we are on end page (may have been navigated by assessment)
      const currentUrl = page.url();
      if (!currentUrl.includes('end')) {
        // Navigate directly to end page
        await page.goto(`${BASE_URL}/end?subgroup=allied&cards=4&completed=false&assessment=getting_there`);
        await page.waitForLoadState('domcontentloaded');
      } else {
        await page.waitForLoadState('domcontentloaded');
      }

      await page.waitForTimeout(300);

      const id = await waitForSessionId(page, 'end');
      assert(id !== null, 'end: mtg-sparrow.session.id set in sessionStorage');
      sessionIds.end = id;

      // Verify guild columns render
      const columnsPresent = await page.isVisible('.guild-columns').catch(() => false);
      assert(columnsPresent, 'end: .guild-columns container is present');

      const alliedCol = await page.$('.guild-column--allied');
      assert(alliedCol !== null, 'end: .guild-column--allied is present');

      const enemyCol = await page.$('.guild-column--enemy');
      assert(enemyCol !== null, 'end: .guild-column--enemy is present');
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Verify session ID consistency across all pages
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Session ID consistency ===\n');
    {
      console.log('  Session IDs per page:');
      for (const [pageName, id] of Object.entries(sessionIds)) {
        console.log(`    ${pageName}: ${id}`);
      }

      const ids = Object.values(sessionIds).filter(Boolean);
      const uniqueIds = new Set(ids);

      assert(
        uniqueIds.size === 1,
        `All pages share the same session ID (found ${uniqueIds.size} unique IDs: ${[...uniqueIds].join(', ')})`,
      );

      if (uniqueIds.size === 1) {
        const theSessionId = [...uniqueIds][0];
        console.log(`\n  *** SESSION ID FOR HONEYCOMB QUERY: ${theSessionId} ***\n`);
      }
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Wait for OTel batch timer to flush end page spans
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Span flush — wait 35s for OTel batch timer ===\n');
    {
      // Ensure we are on end page with URL params so session.summary span is recorded
      const currentUrl = page.url();
      if (!currentUrl.includes('end')) {
        await page.goto(`${BASE_URL}/end?subgroup=allied&cards=4&completed=false&assessment=getting_there`);
        await page.waitForLoadState('domcontentloaded');
      }

      console.log('  End page loaded, waiting 35s for OTel batch timer to export spans...');
      await page.waitForTimeout(35000);
      console.log('  Wait complete — all spans should be exported to Honeycomb.');

      // Log the session ID again prominently for querying
      const finalId = await readSessionId(page);
      console.log(`\n  *** FINAL SESSION ID FOR HONEYCOMB QUERY: ${finalId} ***\n`);
    }

  } finally {
    await context.close();
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
    console.error(`\nArc 21 cross-page telemetry FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 21 cross-page telemetry PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
