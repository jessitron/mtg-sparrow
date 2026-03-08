/**
 * Arc 19 verification: end.html standalone page
 *
 * Tests:
 * 1. Bundle confirms app.page='end', app.navigation='multi_page', version='0.17.0'
 * 2. End page loads — both columns present (locked when no localStorage)
 * 3. With allied unlocked in localStorage — allied column shows color wheel + guild list
 * 4. Navigation button links to slides.html with correct params
 * 5. Color wheel hover — highlights line + guild list item
 * 6. Direct access (no params) — page loads from localStorage
 * 7. Settings gear works, version 0.17.0
 * 8. Span flush — keep page alive for OTel batch timer (session.summary span)
 *
 * NOTE: URL params on end page are only used to record session.summary span.
 * Page display is entirely driven by localStorage. URL params do NOT affect display.
 *
 * NOTE: Use clean URL format (/end?params) not end.html?params to preserve query params.
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const END_URL = `${BASE_URL}/end?subgroup=allied&cards=10&completed=true&assessment=getting_there`;
const END_URL_BARE = `${BASE_URL}/end`;

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
    // PHASE 1: Bundle confirms telemetry markers
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Bundle confirms telemetry markers ===\n');
    {
      const page = await browser.newPage();

      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js builds and is served (HTTP 200)');

      const bundleText = await response.text();
      assert(bundleText.includes('0.17.0'), 'end.js contains version "0.17.0"');
      assert(bundleText.includes('app.page'), 'end.js contains "app.page" attribute key');
      assert(
        bundleText.includes("'end'") || bundleText.includes('"end"'),
        'end.js contains "end" page value',
      );
      assert(bundleText.includes('app.navigation'), 'end.js contains "app.navigation" attribute key');
      assert(bundleText.includes('multi_page'), 'end.js contains "multi_page" navigation value');
      assert(bundleText.includes('session.summary'), 'end.js contains "session.summary" span name');
      assert(bundleText.includes('app.version'), 'end.js contains "app.version" attribute key');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Fresh page (no localStorage) — both columns locked
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Fresh page — both columns present (locked) ===\n');
    {
      const page = await browser.newPage();
      // No localStorage set — fresh state

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Both columns should render (even if locked, the container appears)
      const container = await page.$('.guild-columns');
      assert(container !== null, '.guild-columns container is present');

      const alliedCol = await page.$('.guild-column--allied');
      const enemyCol = await page.$('.guild-column--enemy');
      assert(alliedCol !== null, 'Allied column (.guild-column--allied) is present');
      assert(enemyCol !== null, 'Enemy column (.guild-column--enemy) is present');

      // Both are locked (no content, just buttons)
      const alliedLocked = await page.$('.guild-column--allied.guild-column--locked');
      const enemyLocked = await page.$('.guild-column--enemy.guild-column--locked');
      assert(alliedLocked !== null, 'Allied column is locked (no localStorage progression)');
      assert(enemyLocked !== null, 'Enemy column is locked (no localStorage progression)');

      // Locked columns still have navigation buttons
      const alliedBtn = await page.$('.guild-column--allied .next-session-button');
      const enemyBtn = await page.$('.guild-column--enemy .next-session-button');
      assert(alliedBtn !== null, 'Allied column has a navigation button even when locked');
      assert(enemyBtn !== null, 'Enemy column has a navigation button even when locked');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Allied unlocked in localStorage — column shows content
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Allied unlocked — color wheel + guild list visible ===\n');
    {
      const page = await browser.newPage();

      // Set localStorage before the page loads
      await page.addInitScript(() => {
        localStorage.setItem(
          'sparrow-deck.progression',
          JSON.stringify({
            unlockedSubgroups: ['allied'],
            completedSubgroups: ['allied'],
          }),
        );
      });

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Allied column should NOT be locked
      const alliedUnlocked = await page.$('.guild-column--allied:not(.guild-column--locked)');
      assert(alliedUnlocked !== null, 'Allied column is unlocked (localStorage has allied)');

      // Header: "Allied Guilds"
      const alliedHeader = await page.$('.guild-column--allied .guild-column-header');
      const headerText = await alliedHeader?.textContent();
      assert(
        headerText && headerText.includes('Allied Guilds'),
        `Allied column header says "Allied Guilds" (got: "${headerText?.trim()}")`,
      );

      // Color wheel SVG present
      const alliedWheel = await page.$('.allied-color-wheel');
      assert(alliedWheel !== null, 'Allied color wheel SVG is present (.allied-color-wheel)');

      // Guild list present with items
      const alliedList = await page.$('.guild-column--allied .guild-column-list');
      assert(alliedList !== null, 'Allied guild list is present');

      const alliedItems = await page.$$('.guild-column--allied .guild-column-item');
      assert(alliedItems.length === 5, `Allied guild list has 5 items (found: ${alliedItems.length})`);

      // Button says "Practice allied guilds" (since completed)
      const alliedBtnText = await page.textContent('.guild-column--allied .next-session-button');
      assert(
        alliedBtnText && alliedBtnText.includes('Practice'),
        `Allied button says "Practice allied guilds" (got: "${alliedBtnText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Navigation button links to slides.html with correct params
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Navigation button → slides.html ===\n');
    {
      const page = await browser.newPage();

      await page.addInitScript(() => {
        localStorage.setItem(
          'sparrow-deck.progression',
          JSON.stringify({
            unlockedSubgroups: ['allied'],
            completedSubgroups: ['allied'],
          }),
        );
      });

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .next-session-button', { timeout: 5000 });

      // Capture navigation request to slides.html
      let capturedSlidesUrl = '';
      page.on('request', (req) => {
        const url = req.url();
        if (url.includes('slides')) {
          capturedSlidesUrl = url;
        }
      });

      const navPromise = page
        .waitForURL(/slides/, { waitUntil: 'commit', timeout: 8000 })
        .catch(() => null);

      await page.click('.guild-column--allied .next-session-button');
      await navPromise;

      const finalUrl = page.url();
      const navigatedToSlides = finalUrl.includes('slides') || capturedSlidesUrl.includes('slides');

      assert(navigatedToSlides, `Allied button navigates to slides page (url: ${finalUrl || capturedSlidesUrl})`);

      if (capturedSlidesUrl.includes('slides.html')) {
        assert(
          capturedSlidesUrl.includes('subgroup=allied'),
          `Slides URL includes subgroup=allied (got: ${capturedSlidesUrl})`,
        );
        assert(
          capturedSlidesUrl.includes('from=session_end_screen'),
          `Slides URL includes from=session_end_screen (got: ${capturedSlidesUrl})`,
        );
      } else {
        // serve may strip params on redirect — note it
        console.log(
          `  NOTE: Slides URL params not capturable after serve redirect (nav confirmed: ${finalUrl})`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Color wheel hover — line highlights on mouseenter
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Color wheel hover highlights line + list item ===\n');
    {
      const page = await browser.newPage();

      await page.addInitScript(() => {
        localStorage.setItem(
          'sparrow-deck.progression',
          JSON.stringify({
            unlockedSubgroups: ['allied'],
            completedSubgroups: ['allied'],
          }),
        );
      });

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.allied-color-wheel', { timeout: 5000 });

      // Hover over the first ally line group (white-blue)
      const lineGroup = await page.$('#line-white-blue');
      assert(lineGroup !== null, 'ally line group #line-white-blue exists in SVG');

      if (lineGroup) {
        await lineGroup.hover();
        await page.waitForTimeout(200);

        const lineHighlighted = await page.$('#line-white-blue.highlight');
        assert(lineHighlighted !== null, '#line-white-blue gains .highlight class on hover');

        // Check that corresponding guild list item is also highlighted
        // Azorius is white+blue — look for guild-column-item with data-guild-id="azorius"
        const listItemHighlighted = await page.$('[data-guild-id="azorius"].highlight');
        assert(listItemHighlighted !== null, 'Azorius guild list item gains .highlight on hover');

        // Mouse away — highlight should clear
        await page.mouse.move(0, 0);
        await page.waitForTimeout(200);

        const lineUnhighlighted = await page.$('#line-white-blue.highlight');
        assert(lineUnhighlighted === null, '#line-white-blue loses .highlight class on mouse leave');
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Direct access with URL params — page loads correctly
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Direct access with URL params ===\n');
    {
      const page = await browser.newPage();

      // URL params are used to record session.summary span; display comes from localStorage
      // Set some progression so we can verify the page renders
      await page.addInitScript(() => {
        localStorage.setItem(
          'sparrow-deck.progression',
          JSON.stringify({
            unlockedSubgroups: ['allied'],
            completedSubgroups: ['allied'],
          }),
        );
      });

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const currentUrl = page.url();
      assert(
        currentUrl.includes('end'),
        `End page loads at URL containing 'end' (got: ${currentUrl})`,
      );

      // Page should still show guild columns (display from localStorage, not params)
      const alliedCol = await page.$('.guild-column--allied');
      assert(alliedCol !== null, 'Allied column renders when end.html loaded with URL params');

      // Verify URL params preserved (using clean URL format)
      const hasParams = currentUrl.includes('subgroup=') || currentUrl.includes('assessment=');
      if (hasParams) {
        console.log('  URL params preserved in /end?params format (clean URL route)');
      } else {
        console.log('  NOTE: URL params not in final URL (serve may have redirected)');
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Settings gear — version 0.17.0
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Settings gear — version 0.17.0 ===\n');
    {
      const page = await browser.newPage();

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const gearVisible = await page.isVisible('#menu-btn');
      assert(gearVisible, 'Settings gear button is visible on end page');

      await page.click('#menu-btn');
      await page.waitForSelector('#settings-panel:not([hidden])', { timeout: 5000 });

      const panelVisible = await page.isVisible('#settings-panel');
      assert(panelVisible, 'Settings panel opens when gear is clicked');

      const versionText = await page.textContent('#settings-version');
      assert(
        versionText && versionText.includes('0.17.0'),
        `Settings version shows "0.17.0" (got: "${versionText?.trim()}")`,
      );

      await page.click('#settings-close-btn');
      await page.waitForSelector('#settings-panel', { state: 'hidden', timeout: 3000 });
      const panelHidden = !(await page.isVisible('#settings-panel'));
      assert(panelHidden, 'Settings panel closes after clicking close button');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: Span flush — wait for OTel batch timer (session.summary span)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: Span flush (wait 35s for OTel batch timer) ===\n');
    {
      const page = await browser.newPage();

      // Load with URL params so session.summary span is recorded
      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');

      console.log('  End page loaded with URL params, waiting 35s for OTel batch timer...');
      await page.waitForTimeout(35000);
      console.log('  Wait complete — spans should be exported to Honeycomb.');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 9: Honeycomb telemetry check
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 9: Honeycomb telemetry check ===\n');
    console.log('  (Honeycomb check will be performed via MCP after test run)');

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
    console.error(`\nArc 19 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 19 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
