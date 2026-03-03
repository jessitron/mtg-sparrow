/**
 * Arc 30 verification: Wedge section on end screen reel
 *
 * Tests:
 * 1. Bundle contains 'wedges' in SECTION_LABELS and wedge combo ids
 * 2. .level-section--wedges renders when wedges subgroup is unlocked
 * 3. Wedge section has summary | wheel | flavor three-panel structure
 * 4. Triangle wheel SVG: 5 triangles (polygon groups) rendered in wedge SVG
 * 5. Hover wedge triangle → highlights triangle, list item, flavor name (Abzan)
 * 6. Unhighlight clears triangle, list item, flavor name
 * 7. Wedge section reachable by reel navigation (down from enemy section)
 * 8. initialSubgroup=wedges → reel starts at wedge section
 * 9. Locked state: no wedges progression → button shown, no triangle wheel
 * 10. Telemetry: end.guild_highlight with guild.id set on wedge highlight
 * 11. Span flush + Honeycomb check
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const END_URL_BARE = `${BASE_URL}/end`;
const END_URL_WEDGE = `${BASE_URL}/end?subgroup=wedges&cards=25&completed=true&assessment=getting_there`;

const ALL_UNLOCKED = JSON.stringify({
  unlockedSubgroups: ['allied', 'enemy', 'wedges'],
  completedSubgroups: ['allied', 'enemy', 'wedges'],
});

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
    // PHASE 1: Bundle confirms wedge section presence
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Bundle confirms wedge section content ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js serves HTTP 200');

      const bundleText = await response.text();
      assert(bundleText.includes('wedges'), 'Bundle contains "wedges" subgroup label');
      assert(bundleText.includes('abzan'), 'Bundle contains "abzan" wedge combo id');
      assert(bundleText.includes('jeskai'), 'Bundle contains "jeskai" wedge combo id');
      assert(bundleText.includes('sultai'), 'Bundle contains "sultai" wedge combo id');
      assert(bundleText.includes('mardu'), 'Bundle contains "mardu" wedge combo id');
      assert(bundleText.includes('temur'), 'Bundle contains "temur" wedge combo id');
      assert(bundleText.includes('wedge-color-wheel'), 'Bundle contains "wedge-color-wheel" CSS class');
      assert(bundleText.includes('wedge-triangle'), 'Bundle contains "wedge-triangle" CSS class');
      assert(bundleText.includes("don't naturally agree"), 'Bundle contains wedge section explanation text');
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Wedge section structure — three panels present
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Wedge section three-panel structure ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy', 'wedges'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const wedgeSection = await page.$('.level-section--wedges');
      assert(wedgeSection !== null, '.level-section--wedges is present in DOM');

      const wedgeSummary = await page.$('.level-section--wedges .level-section-summary');
      assert(wedgeSummary !== null, 'Wedge section has .level-section-summary panel');

      const wedgeWheel = await page.$('.level-section--wedges .level-section-wheel');
      assert(wedgeWheel !== null, 'Wedge section has .level-section-wheel panel');

      const wedgeFlavor = await page.$('.level-section--wedges .level-section-flavor');
      assert(wedgeFlavor !== null, 'Wedge section has .level-section-flavor panel');

      const wedgeHeader = await page.textContent('.level-section--wedges .level-section-header');
      assert(wedgeHeader && wedgeHeader.includes('Wedges'), `Wedge header says "Wedges" (got: "${wedgeHeader?.trim()}")`);

      // 5 wedge entries in the list
      const listItems = await page.$$('.level-section--wedges .level-section-item');
      assert(listItems.length === 5, `Wedge list has 5 items (got: ${listItems.length})`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Triangle wheel — 5 triangle groups in SVG
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Triangle wheel SVG — 5 triangle polygon groups ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy', 'wedges'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.wedge-color-wheel', { timeout: 5000 });

      const triangleCount = await page.evaluate(() => {
        return document.querySelectorAll('.wedge-color-wheel .wedge-triangle').length;
      });
      assert(triangleCount === 5, `Wedge SVG has 5 triangle groups (got: ${triangleCount})`);

      // Verify the Abzan triangle group exists: white, black, green
      const abzanTri = await page.$('#tri-white-black-green');
      assert(abzanTri !== null, '#tri-white-black-green (Abzan) exists in wedge SVG');

      // Verify the Temur triangle group exists: green, blue, red
      const temurTri = await page.$('#tri-green-blue-red');
      assert(temurTri !== null, '#tri-green-blue-red (Temur) exists in wedge SVG');

      // Verify 5 mana nodes are still present in wheel
      const nodeCount = await page.evaluate(() => {
        return document.querySelectorAll('.wedge-color-wheel .color-node').length;
      });
      assert(nodeCount === 5, `Wedge SVG has 5 color-node images (got: ${nodeCount})`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Triangle hover — Abzan (white-black-green)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Triangle hover — Abzan highlight ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy', 'wedges'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.wedge-color-wheel', { timeout: 5000 });

      // Hover via dispatchEvent (avoids SVG bounding-box interception issues)
      await page.$eval('#tri-white-black-green', el =>
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      );
      await page.waitForTimeout(300);

      // Triangle group gains .highlight
      const triHighlighted = await page.$('#tri-white-black-green.highlight');
      assert(triHighlighted !== null, '#tri-white-black-green gains .highlight class on hover');

      // Abzan list item gains .highlight
      const listItemHighlighted = await page.$('[data-guild-id="abzan"].highlight');
      assert(listItemHighlighted !== null, 'Abzan list item gains .highlight on hover');

      // Column gains --has-highlight
      const hasHighlight = await page.$('.level-section--wedges.level-section--has-highlight');
      assert(hasHighlight !== null, '.level-section--wedges gains .level-section--has-highlight');

      // The Abzan flavor entry should have .active class
      const abzanEntryActive = await page.$('.level-section--wedges .level-section-flavor-entry[data-guild-id="abzan"].active');
      assert(abzanEntryActive !== null, 'Abzan flavor entry has .active class on hover');

      // Flavor description has Abzan text (read from the active entry)
      const flavorDesc = await page.textContent('.level-section--wedges .level-section-flavor-entry[data-guild-id="abzan"] .level-section-flavor-desc');
      assert(
        flavorDesc && flavorDesc.length > 50,
        `Abzan flavor description has content (${flavorDesc?.length ?? 0} chars)`,
      );

      // Dispatch mouseleave to clear highlight
      await page.$eval('#tri-white-black-green', el =>
        el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
      );
      await page.waitForTimeout(300);

      const triUnhighlighted = await page.$('#tri-white-black-green.highlight');
      assert(triUnhighlighted === null, '#tri-white-black-green loses .highlight after mouseleave');

      // Check that no flavor entry has .active class (all are hidden)
      const activeEntry = await page.$('.level-section--wedges .level-section-flavor-entry.active');
      assert(activeEntry === null, 'No flavor entry is .active after mouseleave');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: List item hover — Temur (by clicking the list item)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Wedge list item hover — Temur ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy', 'wedges'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.wedge-color-wheel', { timeout: 5000 });

      // Hover the Temur list item
      await page.$eval('[data-guild-id="temur"]', el =>
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      );
      await page.waitForTimeout(300);

      const listItemHighlighted = await page.$('[data-guild-id="temur"].highlight');
      assert(listItemHighlighted !== null, 'Temur list item gains .highlight on hover');

      // Temur triangle is green-blue-red
      const triHighlighted = await page.$('#tri-green-blue-red.highlight');
      assert(triHighlighted !== null, '#tri-green-blue-red gains .highlight when Temur list item hovered');

      // Check that the Temur flavor entry has the .active class
      const temurEntryActive = await page.$('.level-section--wedges .level-section-flavor-entry[data-guild-id="temur"].active');
      assert(temurEntryActive !== null, 'Temur flavor entry has .active class when list item hovered');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Reel navigation — wedge is reachable by scrolling down from enemy
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Reel navigation — wedge section reachable ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy', 'wedges'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Navigate down twice: allied → enemy → wedges
      const bottomBtn = await page.$('.reel-nav-btn--bottom');
      assert(bottomBtn !== null, 'Bottom nav button is present');

      if (bottomBtn) {
        // Use dispatchEvent to avoid <main> interception of pointer events
        await page.$eval('.reel-nav-btn--bottom', el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        await page.waitForTimeout(800); // wait for reel animation

        await page.$eval('.reel-nav-btn--bottom', el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        await page.waitForTimeout(800);

        // Verify we're at the wedge section by checking the button label changes
        // When at wedge (index 2), down button should be visible (share is next)
        const bottomHidden = await page.$('.reel-nav-btn--bottom.reel-nav-btn--hidden');
        assert(bottomHidden === null, 'Bottom nav button visible when wedge section is showing (share is next)');

        const topHidden = await page.$('.reel-nav-btn--top.reel-nav-btn--hidden');
        assert(topHidden === null, 'Top nav button visible when wedge section is showing (enemy is previous)');
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: initialSubgroup=wedges → reel starts at wedge section
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: initialSubgroup=wedges — reel starts at wedge index ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy', 'wedges'],
        }));
      });
      // Navigate with subgroup=wedges in the URL
      await page.goto(`${BASE_URL}/end?subgroup=wedges&cards=25&completed=true`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // At wedge index (2), top button should be visible, bottom button should be visible
      const topHidden = await page.$('.reel-nav-btn--top.reel-nav-btn--hidden');
      assert(topHidden === null, 'Top nav button visible when starting at wedge (can go back to enemy)');

      const bottomHidden = await page.$('.reel-nav-btn--bottom.reel-nav-btn--hidden');
      assert(bottomHidden === null, 'Bottom nav button visible when starting at wedge (share is next)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: Locked state — wedge not unlocked → shows button, no triangle wheel
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: Locked wedge section — button visible, no triangle wheel ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      // No wedges in progression
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const wedgeLocked = await page.$('.level-section--wedges.level-section--locked');
      assert(wedgeLocked !== null, '.level-section--wedges has .level-section--locked class when not unlocked');

      const lockedBtn = await page.$('.level-section--wedges .next-session-button');
      assert(lockedBtn !== null, 'Locked wedge section has a navigation button');

      const lockedBtnText = await page.textContent('.level-section--wedges .next-session-button');
      assert(
        lockedBtnText && lockedBtnText.includes('wedge'),
        `Locked wedge button text references "wedge" (got: "${lockedBtnText?.trim()}")`,
      );

      const triangleWheel = await page.$('.level-section--wedges .wedge-color-wheel');
      assert(triangleWheel === null, 'No .wedge-color-wheel rendered in locked wedge section');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 9: Span flush — trigger highlights and wait for OTel export
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 9: Span flush (wait 35s for OTel batch timer) ===\n');
    {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy', 'wedges'],
        }));
      });
      await page.goto(END_URL_WEDGE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.wedge-color-wheel', { timeout: 5000 });

      // Navigate to wedge section first (starts at allied by default)
      await page.waitForTimeout(500);
      // Use dispatchEvent to avoid <main> interception of pointer events
      await page.$eval('.reel-nav-btn--bottom', el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await page.waitForTimeout(800);
      await page.$eval('.reel-nav-btn--bottom', el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await page.waitForTimeout(800);

      // Trigger several wedge highlights
      for (const triId of ['#tri-white-black-green', '#tri-green-blue-red', '#tri-blue-red-white']) {
        const el = await page.$(triId);
        if (el) {
          await page.$eval(triId, el => el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })));
          await page.waitForTimeout(150);
          await page.$eval(triId, el => el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true })));
          await page.waitForTimeout(100);
        }
      }

      console.log('  Waiting 35s for OTel batch timer...');
      await page.waitForTimeout(35000);
      console.log('  Wait complete — spans should be exported to Honeycomb.');

      await page.close();
    }

  } finally {
    await browser.close();
  }

  // Honeycomb verification performed separately via MCP after flush
  console.log('\n=== Phase 10: Honeycomb check (via MCP) ===');
  console.log('  (Performed after test run)');

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n=== Summary ===');
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${failures}`);
  console.log(`  Total:  ${passes + failures}`);

  if (failures > 0) {
    console.error(`\nArc 30 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 30 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
