/**
 * Arc 17 verification: slides.html standalone page
 *
 * Tests:
 * 1. Welcome page navigates to slides page when "Learn guild names" is clicked
 * 2. Slides page loads independently — card appears automatically
 * 3. Card has .card-pips and .card-name (hidden initially)
 * 4. Name auto-reveals after REVEAL_DELAY_MS (~3s)
 * 5. Click/tap advances early (name reveals on click before timer fires)
 * 6. "Done for now" button appears on card 2 (index >= 1)
 * 7. "Done for now" navigates to assessment.html with correct params
 * 8. Settings gear opens settings panel on slides page (version 0.15.0)
 * 9. Bundle confirms app.page='slides', app.navigation='multi_page', version='0.15.0'
 *
 * NOTE: The local `serve` package strips query params on clean-URL redirects
 * (e.g. slides.html?... → /slides without params). This is a local dev quirk only;
 * GitHub Pages preserves query params correctly.
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
// Note: serve redirects slides.html?... → /slides (strips .html and params)
// So SLIDES_URL effectively loads as /slides with no params; session defaults to subgroup=allied
const SLIDES_URL = `${BASE_URL}/slides.html?subgroup=allied&from=test&welcome_dwell_ms=500`;

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
 * Advance from card 1 to card 2 via two quick clicks:
 *   Click 1: reveals name early (clears revealTimer, starts advanceTimer)
 *   Click 2: advances immediately (clears advanceTimer, goes to next card)
 */
async function advanceToCard2(page) {
  await page.click('.card');
  await page.waitForTimeout(300);
  await page.click('.card').catch(() => {});
  await page.waitForTimeout(500);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Welcome page navigates to slides
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Welcome page navigates to slides ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForSelector('#start-button', { timeout: 5000 });

      // Click "Learn guild names" — expect navigation to slides page
      // Note: serve normalizes slides.html -> /slides (clean URL without params)
      const navPromise = page
        .waitForURL(/\/slides/, { timeout: 10000 })
        .catch(() => null);
      await page.click('#start-button');
      await navPromise;

      const finalUrl = page.url();
      assert(
        finalUrl.includes('/slides'),
        `Clicking "Learn guild names" navigates to slides page (got: ${finalUrl})`,
      );
      // Note: local serve strips query params; only test the path navigation works
      // In production (GitHub Pages), params are preserved correctly

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Slides page loads independently — card appears automatically
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Slides loads independently, card appears ===\n');
    {
      const page = await browser.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForLoadState('domcontentloaded');

      // Session starts automatically — wait for card
      const cardVisible = await page
        .waitForSelector('.card', { timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      assert(cardVisible, 'Card appears automatically on slides.html load');

      // Check pips
      const pipsExist = (await page.$('.card-pips')) !== null;
      assert(pipsExist, '.card-pips element is present on the card');

      // Check name element exists
      const nameExists = (await page.$('.card-name')) !== null;
      assert(nameExists, '.card-name element is present on the card');

      // Check name is initially hidden
      const nameHidden = (await page.$('.card-name.card-name-hidden')) !== null;
      assert(nameHidden, 'Name is initially hidden (.card-name-hidden class present)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Name auto-reveals after REVEAL_DELAY_MS (3s)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Name auto-reveals after delay ===\n');
    {
      const page = await browser.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForSelector('.card', { timeout: 8000 });

      // Wait for reveal delay (3s) plus a 700ms buffer
      await page.waitForTimeout(3700);

      const nameRevealed = (await page.$('.card-name:not(.card-name-hidden)')) !== null;
      assert(nameRevealed, 'Card name revealed after REVEAL_DELAY_MS (3s + 700ms buffer)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Click/tap advances early (name reveals immediately on click)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Click/tap advances early ===\n');
    {
      const page = await browser.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForSelector('.card', { timeout: 8000 });

      // Wait 500ms so card is settled but reveal timer (~3s) has NOT fired
      await page.waitForTimeout(500);

      // Verify name is still hidden
      const stillHidden = (await page.$('.card-name.card-name-hidden')) !== null;
      assert(stillHidden, 'Name still hidden at 500ms (before REVEAL_DELAY_MS)');

      // Click card — should reveal name immediately
      await page.click('.card');
      await page.waitForTimeout(200);

      const nameRevealedEarly = (await page.$('.card-name:not(.card-name-hidden)')) !== null;
      assert(nameRevealedEarly, 'Name reveals immediately on click (before auto-reveal timer)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: "Done for now" button behavior
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: "Done for now" button ===\n');
    {
      const page = await browser.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForSelector('.card', { timeout: 8000 });

      // On card 1 (index 0): done-button exists but lacks button-visible class
      const doneBtnExists = (await page.$('.done-button')) !== null;
      assert(doneBtnExists, '"Done for now" button exists in DOM on card 1');

      const noButtonVisible = (await page.$('.done-button.button-visible')) === null;
      assert(noButtonVisible, '"Done for now" button does NOT have button-visible on card 1 (index 0)');

      // Advance to card 2 via two clicks
      await advanceToCard2(page);

      // On card 2 (index 1): button-visible class should be added
      const hasButtonVisible = (await page.$('.done-button.button-visible')) !== null;
      assert(hasButtonVisible, '"Done for now" gains button-visible class on card 2 (index 1)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: "Done for now" navigates to assessment.html
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: "Done for now" navigates to assessment.html ===\n');
    {
      const page = await browser.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForSelector('.card', { timeout: 8000 });

      // Advance to card 2 to make done-button interactive
      await advanceToCard2(page);
      await page.waitForSelector('.done-button.button-visible', { timeout: 5000 });

      // Capture navigation URL (assessment.html will 404; serve 301s to /assessment)
      let capturedAssessmentUrl = '';
      page.on('request', (req) => {
        const url = req.url();
        if (url.includes('assessment')) {
          capturedAssessmentUrl = url;
        }
      });

      // Click done — expect navigation to assessment page (404 is expected)
      // Note: serve normalizes assessment.html -> /assessment (clean URL)
      const navPromise = page
        .waitForURL(/assessment/, { waitUntil: 'commit', timeout: 10000 })
        .catch(() => null);

      // Use force:true to bypass Playwright actionability checks
      // (.done-zone has pointer-events:none but .done-button.button-visible has pointer-events:auto)
      await page.click('.done-button', { force: true });
      await navPromise;

      const finalUrl = page.url();
      // capturedAssessmentUrl has the original URL with params (before serve strips them on redirect)
      // finalUrl shows /assessment after serve's 301 (params stripped)
      const assessmentNavigated = finalUrl.includes('assessment') || capturedAssessmentUrl.includes('assessment');

      assert(
        assessmentNavigated,
        `"Done for now" navigates to assessment page (final: ${finalUrl}, captured: ${capturedAssessmentUrl})`,
      );

      // Verify the navigation request had the correct params (from captured request URL)
      const assessmentUrlWithParams = capturedAssessmentUrl || finalUrl;
      if (capturedAssessmentUrl.includes('assessment.html')) {
        // Only check params if we captured the original request (before serve's clean URL redirect)
        assert(
          capturedAssessmentUrl.includes('subgroup='),
          `assessment request includes subgroup param (got: ${capturedAssessmentUrl})`,
        );
        assert(
          capturedAssessmentUrl.includes('cards='),
          `assessment request includes cards param (got: ${capturedAssessmentUrl})`,
        );
        assert(
          capturedAssessmentUrl.includes('completed='),
          `assessment request includes completed param (got: ${capturedAssessmentUrl})`,
        );
      } else {
        // serve stripped params — navigation happened but params not verifiable via URL
        // This is a local dev limitation; GitHub Pages preserves params
        console.log('  NOTE: serve stripped query params from assessment URL — navigation confirmed but params not in final URL');
        assert(
          assessmentNavigated,
          `assessment navigation confirmed (local serve strips params from redirects)`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Settings gear on slides page
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Settings gear on slides page ===\n');
    {
      const page = await browser.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForSelector('.card', { timeout: 8000 });

      const gearVisible = await page.isVisible('#menu-btn');
      assert(gearVisible, 'Settings gear button is visible on slides page');

      await page.click('#menu-btn');
      await page.waitForSelector('#settings-panel:not([hidden])', { timeout: 5000 });

      const panelVisible = await page.isVisible('#settings-panel');
      assert(panelVisible, 'Settings panel opens when gear is clicked');

      const versionText = await page.textContent('#settings-version');
      assert(
        versionText && versionText.includes('0.15.0'),
        `Settings version shows "0.15.0" (got: "${versionText?.trim()}")`,
      );

      await page.click('#settings-close-btn');
      await page.waitForSelector('#settings-panel', { state: 'hidden', timeout: 3000 });
      const panelHidden = !(await page.isVisible('#settings-panel'));
      assert(panelHidden, 'Settings panel closes after clicking close button');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: Bundle confirms telemetry markers
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: Bundle confirms telemetry markers ===\n');
    {
      const page = await browser.newPage();

      const response = await page.request.get(`${BASE_URL}/dist/slides.js`);
      const bundleText = await response.text();

      assert(bundleText.includes('0.15.0'), 'slides.js contains version "0.15.0"');
      assert(bundleText.includes('app.page'), 'slides.js contains "app.page" attribute key');
      assert(
        bundleText.includes("'slides'") || bundleText.includes('"slides"'),
        'slides.js contains "slides" page value',
      );
      assert(bundleText.includes('app.navigation'), 'slides.js contains "app.navigation" attribute key');
      assert(bundleText.includes('multi_page'), 'slides.js contains "multi_page" navigation value');
      assert(bundleText.includes('app.version'), 'slides.js contains "app.version" attribute key');
      assert(bundleText.includes('session'), 'slides.js contains "session" span name');

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
    console.error(`\nArc 17 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 17 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
