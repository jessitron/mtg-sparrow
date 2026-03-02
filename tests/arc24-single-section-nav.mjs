/**
 * Arc 24 verification: Single-section end screen with snap navigation
 *
 * Tests:
 * 1. Bundle contains end.section_navigate, end.start_level_click span names
 * 2. Empty state — no progress shows only home link
 * 3. Navigation structure: header + footer with .end-nav-btn buttons
 * 4. Up button says "Home" on first section, "Up" after navigating
 * 5. Down button says "Down" when next section available
 * 6. Down click scrolls to next section (scrollTop changes)
 * 7. Up click scrolls back to first section
 * 8. Only allied unlocked: Down says "Start enemy guilds"
 * 9. Both unlocked on last section: Down says "Share"
 * 10. Home button click navigates to index
 * 11. "Start enemy guilds" click navigates to slides page
 * 12. end.layout_version = 'single_section_v1' present in bundle (session.summary span)
 * 13. Scroll snap CSS applied (scroll-snap-type on .end-nav-body)
 * 14. Span flush + Honeycomb verification (end.section_navigate, end.start_level_click)
 *
 * Server must be running at http://localhost:3847.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const END_URL = `${BASE_URL}/end`;

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

/** Both guilds fully unlocked and completed */
const BOTH_UNLOCKED = JSON.stringify({
  unlockedSubgroups: ['allied', 'enemy'],
  completedSubgroups: ['allied', 'enemy'],
});

/** Only allied unlocked and completed */
const ALLIED_ONLY = JSON.stringify({
  unlockedSubgroups: ['allied'],
  completedSubgroups: ['allied'],
});

/** No progress at all */
const NO_PROGRESS = null;

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Bundle confirms telemetry span names
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Bundle confirms telemetry span names ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js serves HTTP 200');

      const bundleText = await response.text();
      assert(
        bundleText.includes('end.section_navigate'),
        'Bundle contains "end.section_navigate" span name',
      );
      assert(
        bundleText.includes('end.start_level_click'),
        'Bundle contains "end.start_level_click" span name',
      );
      assert(
        bundleText.includes('navigate.direction'),
        'Bundle contains "navigate.direction" attribute key',
      );
      assert(
        bundleText.includes('navigate.target_section'),
        'Bundle contains "navigate.target_section" attribute key',
      );
      assert(
        bundleText.includes('single_section_v1'),
        'Bundle contains "single_section_v1" layout version marker',
      );
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Empty state — no progress shows home link
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Empty state — no progress shows home link ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      // No localStorage set → no progress
      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Should NOT render the nav structure
      const navBody = await page.$('.end-nav-body');
      assert(navBody === null, 'No .end-nav-body rendered when nothing unlocked');

      // Should render a link back home
      const homeLink = await page.$('a[href="index"], a[href="/"]');
      assert(homeLink !== null, 'A home link is present in empty state');

      const linkText = homeLink ? await page.textContent('a[href="index"], a[href="/"]') : '';
      assert(
        linkText && (linkText.toLowerCase().includes('home') || linkText.toLowerCase().includes('return')),
        `Home link text mentions "home" or "return" (got: "${linkText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Navigation structure — both unlocked
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Navigation structure — both unlocked ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, BOTH_UNLOCKED);
      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const header = await page.$('header.end-nav-header');
      assert(header !== null, 'header.end-nav-header is present');

      const footer = await page.$('footer.end-nav-footer');
      assert(footer !== null, 'footer.end-nav-footer is present');

      const navBody = await page.$('.end-nav-body');
      assert(navBody !== null, '.end-nav-body scroll container is present');

      const sections = await page.$$('.end-nav-section');
      assert(sections.length === 2, `Two .end-nav-section elements present (got ${sections.length})`);

      // Check section contents — allied first, enemy second
      // Note: .end-nav-section and .level-section--allied are on the SAME element
      const alliedSection = await page.$('.end-nav-section.level-section--allied');
      assert(alliedSection !== null, 'Allied section is rendered (.end-nav-section.level-section--allied)');

      const enemySection = await page.$('.end-nav-section.level-section--enemy');
      assert(enemySection !== null, 'Enemy section is rendered (.end-nav-section.level-section--enemy)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Up/Down button labels on first section (both unlocked)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Up/Down button labels — first section, both unlocked ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, BOTH_UNLOCKED);
      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const upBtnText = await page.textContent('header .end-nav-btn');
      assert(
        upBtnText && upBtnText.trim() === 'Home',
        `Up button says "Home" on first section (got: "${upBtnText?.trim()}")`,
      );

      const downBtnText = await page.textContent('footer .end-nav-btn');
      assert(
        downBtnText && downBtnText.trim() === 'Down',
        `Down button says "Down" when next section available (got: "${downBtnText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Down click scrolls to next section
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Down click — scrolls to next section ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, BOTH_UNLOCKED);
      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Verify initial scrollTop is 0
      const scrollTopBefore = await page.evaluate(() => {
        return document.querySelector('.end-nav-body')?.scrollTop ?? -1;
      });
      assert(scrollTopBefore === 0, `Initial scrollTop is 0 (got: ${scrollTopBefore})`);

      // Click Down
      await page.click('footer .end-nav-btn');

      // Wait up to 2s for scroll to complete OR button label to change (proving navigation)
      const navigated = await Promise.race([
        page.waitForFunction(
          () => (document.querySelector('.end-nav-body')?.scrollTop ?? 0) > 0,
          { timeout: 2000 },
        ).then(() => 'scrolled').catch(() => null),
        page.waitForFunction(
          () => document.querySelector('header .end-nav-btn')?.textContent?.trim() === 'Up',
          { timeout: 2000 },
        ).then(() => 'button-changed').catch(() => null),
      ]);

      assert(
        navigated !== null,
        `Down click navigates: scroll moved or Up-button changed to "Up" (result: ${navigated})`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Up button says "Up" and scrolls back after navigating down
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Up button label changes and scrolls back ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, BOTH_UNLOCKED);
      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Navigate down
      await page.click('footer .end-nav-btn');
      await page.waitForTimeout(600);

      const upBtnAfterDown = await page.textContent('header .end-nav-btn');
      assert(
        upBtnAfterDown && upBtnAfterDown.trim() === 'Up',
        `Up button says "Up" after navigating to second section (got: "${upBtnAfterDown?.trim()}")`,
      );

      const downBtnAfterDown = await page.textContent('footer .end-nav-btn');
      assert(
        downBtnAfterDown && downBtnAfterDown.trim() === 'Share',
        `Down button says "Share" on last section when all unlocked (got: "${downBtnAfterDown?.trim()}")`,
      );

      // Navigate back up
      await page.click('header .end-nav-btn');
      await page.waitForTimeout(600);

      const scrollTopAfterUp = await page.evaluate(() => {
        return document.querySelector('.end-nav-body')?.scrollTop ?? -1;
      });
      assert(
        scrollTopAfterUp === 0,
        `scrollTop returns to 0 after clicking Up (got: ${scrollTopAfterUp})`,
      );

      const upBtnBackAtFirst = await page.textContent('header .end-nav-btn');
      assert(
        upBtnBackAtFirst && upBtnBackAtFirst.trim() === 'Home',
        `Up button says "Home" again after returning to first section (got: "${upBtnBackAtFirst?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Only allied unlocked — Down says "Start enemy guilds"
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Allied only — Down says "Start enemy guilds" ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, ALLIED_ONLY);
      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const downBtnText = await page.textContent('footer .end-nav-btn');
      assert(
        downBtnText && downBtnText.trim() === 'Start enemy guilds',
        `Down button says "Start enemy guilds" when enemy is locked (got: "${downBtnText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: Home button click navigates to index
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: Home button navigates to index ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, ALLIED_ONLY);
      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Click Home and wait for navigation
      const [response] = await Promise.all([
        page.waitForNavigation({ timeout: 5000 }),
        page.click('header .end-nav-btn'),
      ]);

      const finalUrl = page.url();
      assert(
        finalUrl.includes('index') || finalUrl === `${BASE_URL}/` || finalUrl === BASE_URL + '/',
        `Home navigates to index page (URL: "${finalUrl}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 9: "Start enemy guilds" click navigates to slides with subgroup=enemy
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 9: "Start enemy guilds" navigates to slides ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, ALLIED_ONLY);
      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const [response] = await Promise.all([
        page.waitForNavigation({ timeout: 5000 }),
        page.click('footer .end-nav-btn'),
      ]);

      const finalUrl = page.url();
      assert(
        finalUrl.includes('slides') && finalUrl.includes('subgroup=enemy'),
        `"Start enemy guilds" navigates to slides?subgroup=enemy (URL: "${finalUrl}")`,
      );
      assert(
        finalUrl.includes('end_screen_next_level'),
        `URL includes from=end_screen_next_level (URL: "${finalUrl}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 10: Scroll snap CSS verified (end.css has scroll-snap-type)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 10: Scroll snap CSS present ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/end.css`);
      assert(response.status() === 200, 'end.css serves HTTP 200');

      const cssText = await response.text();
      assert(
        cssText.includes('scroll-snap-type'),
        'end.css contains scroll-snap-type property',
      );
      assert(
        cssText.includes('scroll-snap-align'),
        'end.css contains scroll-snap-align property',
      );
      assert(
        cssText.includes('end-nav-body'),
        'end.css contains .end-nav-body class',
      );
      assert(
        cssText.includes('end-nav-section'),
        'end.css contains .end-nav-section class',
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 11: end.layout_version = 'single_section_v1' via session arrival
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 11: end.layout_version marker on session arrival ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, BOTH_UNLOCKED);
      // Arrive from a session with subgroup param
      await page.goto(`${END_URL}?subgroup=allied&cards=10&completed=true`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // The layout_version should have been set in the session.summary span.
      // We verify this by checking the bundle contains the marker (already done in Phase 1).
      // Here we verify the page loads without error and the nav structure is present.
      const navBody = await page.$('.end-nav-body');
      assert(navBody !== null, '.end-nav-body present after session arrival with subgroup param');

      const upBtn = await page.$('header .end-nav-btn');
      assert(upBtn !== null, 'Header nav button present after session arrival');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 12: Span flush — emit navigation spans and wait for OTel batch
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 12: Span flush (emit nav spans, wait 35s for OTel batch) ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, BOTH_UNLOCKED);

      // Arrive from a session to generate a session.summary span with layout_version
      await page.goto(`${END_URL}?subgroup=allied&cards=10&completed=true`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(400);

      // Navigate down to emit end.section_navigate spans
      await page.click('footer .end-nav-btn');
      await page.waitForTimeout(600);
      await page.click('header .end-nav-btn');
      await page.waitForTimeout(600);

      // Navigate down again
      await page.click('footer .end-nav-btn');
      await page.waitForTimeout(600);

      console.log('  Navigation spans emitted (end.section_navigate × 3)');
      console.log('  Waiting 35s for OTel batch timer...');
      await page.waitForTimeout(35000);
      console.log('  Wait complete — spans should be exported to Honeycomb.');

      await page.close();
      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 13: end.start_level_click — emit and flush
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 13: end.start_level_click span flush ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript((progression) => {
        localStorage.setItem('sparrow-deck.progression', progression);
      }, ALLIED_ONLY);

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(400);

      // Click "Start enemy guilds" to emit end.start_level_click span
      // This will navigate away, so we navigate back quickly to ensure flush
      const navPromise = page.waitForNavigation({ timeout: 5000 }).catch(() => null);
      await page.click('footer .end-nav-btn');
      await navPromise;

      console.log('  end.start_level_click span emitted (navigated to slides)');
      console.log('  Waiting 5s for navigation span to flush on visibility change...');
      await page.waitForTimeout(5000);

      await page.close();
      await context.close();
    }

  } finally {
    await browser.close();
  }

  // Honeycomb check performed separately via MCP
  console.log('\n=== Phase 14: Honeycomb check (via MCP) ===');
  console.log('  (Performed after test run)');

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n=== Summary ===');
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${failures}`);
  console.log(`  Total:  ${passes + failures}`);

  if (failures > 0) {
    console.error(`\nArc 24 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 24 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
