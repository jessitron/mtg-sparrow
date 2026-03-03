/**
 * Arc 31 verification: Shard section on end screen reel
 *
 * Tests:
 * 1. Bundle contains 'shards' in SECTION_LABELS and shard combo ids
 * 2. end.layout_version = 'reel_v2' in bundle
 * 3. .level-section--shards renders when shards subgroup is unlocked
 * 4. Shard section has summary | wheel | flavor three-panel structure
 * 5. Triangle wheel SVG: 5 triangles (polygon groups) rendered in shard SVG
 * 6. Hover shard triangle → highlights triangle, list item, flavor name (Bant)
 * 7. Unhighlight clears triangle, list item, flavor name
 * 8. Shard section reachable by reel navigation (down from wedge section)
 * 9. initialSubgroup=shards → reel starts at shard section
 * 10. Locked state: no shards progression → button shown, no triangle wheel
 * 11. Telemetry: end.guild_highlight with guild.id set on shard highlight
 * 12. Span flush + Honeycomb check
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const END_URL_BARE = `${BASE_URL}/end`;
const END_URL_SHARD = `${BASE_URL}/end?subgroup=shards&cards=25&completed=true&assessment=getting_there`;

const ALL_UNLOCKED = JSON.stringify({
  unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
  completedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
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
    // PHASE 1: Bundle confirms shard section presence
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Bundle confirms shard section content ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js serves HTTP 200');

      const bundleText = await response.text();
      assert(bundleText.includes('shards'), 'Bundle contains "shards" subgroup label');
      assert(bundleText.includes('bant'), 'Bundle contains "bant" shard combo id');
      assert(bundleText.includes('esper'), 'Bundle contains "esper" shard combo id');
      assert(bundleText.includes('grixis'), 'Bundle contains "grixis" shard combo id');
      assert(bundleText.includes('jund'), 'Bundle contains "jund" shard combo id');
      assert(bundleText.includes('naya'), 'Bundle contains "naya" shard combo id');
      assert(bundleText.includes('shard-color-wheel'), 'Bundle contains "shard-color-wheel" CSS class');
      assert(bundleText.includes('shard-triangle'), 'Bundle contains "shard-triangle" CSS class');
      assert(bundleText.includes('reel_v2'), 'Bundle contains "reel_v2" layout version');
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Shard section structure — three panels present
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Shard section three-panel structure ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const shardSection = await page.$('.level-section--shards');
      assert(shardSection !== null, '.level-section--shards is present in DOM');

      const shardSummary = await page.$('.level-section--shards .level-section-summary');
      assert(shardSummary !== null, 'Shard section has .level-section-summary panel');

      const shardWheel = await page.$('.level-section--shards .level-section-wheel');
      assert(shardWheel !== null, 'Shard section has .level-section-wheel panel');

      const shardFlavor = await page.$('.level-section--shards .level-section-flavor');
      assert(shardFlavor !== null, 'Shard section has .level-section-flavor panel');

      const shardHeader = await page.textContent('.level-section--shards .level-section-header');
      assert(shardHeader && shardHeader.includes('Shard'), `Shard header says "Shard" (got: "${shardHeader?.trim()}")`);

      // 5 shard entries in the list
      const listItems = await page.$$('.level-section--shards .level-section-item');
      assert(listItems.length === 5, `Shard list has 5 items (got: ${listItems.length})`);

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
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.shard-color-wheel', { timeout: 5000 });

      const triangleCount = await page.evaluate(() => {
        return document.querySelectorAll('.shard-color-wheel .shard-triangle').length;
      });
      assert(triangleCount === 5, `Shard SVG has 5 triangle groups (got: ${triangleCount})`);

      // Verify the Bant triangle group exists: green, white, blue
      const bantTri = await page.$('#tri-green-white-blue');
      assert(bantTri !== null, '#tri-green-white-blue (Bant) exists in shard SVG');

      // Verify the Naya triangle group exists: red, green, white
      const nayaTri = await page.$('#tri-red-green-white');
      assert(nayaTri !== null, '#tri-red-green-white (Naya) exists in shard SVG');

      // Verify 5 mana nodes are still present in wheel
      const nodeCount = await page.evaluate(() => {
        return document.querySelectorAll('.shard-color-wheel .color-node').length;
      });
      assert(nodeCount === 5, `Shard SVG has 5 color-node images (got: ${nodeCount})`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Triangle hover — Bant (green-white-blue)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Triangle hover — Bant highlight ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.shard-color-wheel', { timeout: 5000 });

      // Hover via dispatchEvent (avoids SVG bounding-box interception issues)
      await page.$eval('#tri-green-white-blue', el =>
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      );
      await page.waitForTimeout(300);

      // Triangle group gains .highlight
      const triHighlighted = await page.$('#tri-green-white-blue.highlight');
      assert(triHighlighted !== null, '#tri-green-white-blue gains .highlight class on hover');

      // Bant list item gains .highlight
      const listItemHighlighted = await page.$('[data-guild-id="bant"].highlight');
      assert(listItemHighlighted !== null, 'Bant list item gains .highlight on hover');

      // Column gains --has-highlight
      const hasHighlight = await page.$('.level-section--shards.level-section--has-highlight');
      assert(hasHighlight !== null, '.level-section--shards gains .level-section--has-highlight');

      // The Bant flavor entry should have .active class
      const bantEntryActive = await page.$('.level-section--shards .level-section-flavor-entry[data-guild-id="bant"].active');
      assert(bantEntryActive !== null, 'Bant flavor entry has .active class on hover');

      // Flavor description has Bant text (read from the active entry)
      const flavorDesc = await page.textContent('.level-section--shards .level-section-flavor-entry[data-guild-id="bant"] .level-section-flavor-desc');
      assert(
        flavorDesc && flavorDesc.length > 50,
        `Bant flavor description has content (${flavorDesc?.length ?? 0} chars)`,
      );

      // Dispatch mouseleave to clear highlight
      await page.$eval('#tri-green-white-blue', el =>
        el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
      );
      await page.waitForTimeout(300);

      const triUnhighlighted = await page.$('#tri-green-white-blue.highlight');
      assert(triUnhighlighted === null, '#tri-green-white-blue loses .highlight after mouseleave');

      // Check that no flavor entry has .active class (all are hidden)
      const activeEntry = await page.$('.level-section--shards .level-section-flavor-entry.active');
      assert(activeEntry === null, 'No flavor entry is .active after mouseleave');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: List item hover — Grixis (by hovering list item)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Shard list item hover — Grixis ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.shard-color-wheel', { timeout: 5000 });

      // Hover the Grixis list item
      await page.$eval('[data-guild-id="grixis"]', el =>
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      );
      await page.waitForTimeout(300);

      const listItemHighlighted = await page.$('[data-guild-id="grixis"].highlight');
      assert(listItemHighlighted !== null, 'Grixis list item gains .highlight on hover');

      // Grixis triangle is blue-black-red
      const triHighlighted = await page.$('#tri-blue-black-red.highlight');
      assert(triHighlighted !== null, '#tri-blue-black-red gains .highlight when Grixis list item hovered');

      // Check that the Grixis flavor entry has the .active class
      const grixisEntryActive = await page.$('.level-section--shards .level-section-flavor-entry[data-guild-id="grixis"].active');
      assert(grixisEntryActive !== null, 'Grixis flavor entry has .active class when list item hovered');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Cross-column deselect — clicking shard then wedge clears shard
    // -----------------------------------------------------------------------
    // onActivate is called on click (not hover), which triggers clearXxx() for other columns
    console.log('\n=== Phase 6: Cross-column deselect — click shard then click wedge ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        }));
      });
      await page.goto(END_URL_SHARD);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.shard-color-wheel', { timeout: 5000 });

      // Click a shard triangle (Bant) to select it
      await page.$eval('#tri-green-white-blue', el =>
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      );
      await page.waitForTimeout(200);

      const shardHighlighted = await page.$('#tri-green-white-blue.highlight');
      assert(shardHighlighted !== null, 'Shard triangle is selected (highlighted) after click');

      // Now click a wedge triangle — onActivate for wedge calls clearShard()
      const wedgeTri = await page.$('#tri-white-black-green');
      assert(wedgeTri !== null, '#tri-white-black-green (Abzan wedge) exists in DOM');

      if (wedgeTri) {
        await page.$eval('#tri-white-black-green', el =>
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        );
        await page.waitForTimeout(300);

        // Shard selection should be cleared
        const shardStillHighlighted = await page.$('#tri-green-white-blue.highlight');
        assert(shardStillHighlighted === null, 'Shard selection cleared after wedge triangle clicked');

        // Wedge should be selected
        const wedgeHighlighted = await page.$('#tri-white-black-green.highlight');
        assert(wedgeHighlighted !== null, 'Wedge triangle is now selected (highlighted)');
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Reel navigation — shard is reachable by scrolling down from wedge
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Reel navigation — shard section reachable ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Navigate down 3 times: allied → enemy → wedges → shards
      const bottomBtn = await page.$('.reel-nav-btn--bottom');
      assert(bottomBtn !== null, 'Bottom nav button is present');

      if (bottomBtn) {
        for (let i = 0; i < 3; i++) {
          await page.$eval('.reel-nav-btn--bottom', el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
          await page.waitForTimeout(800);
        }

        // At shards index (3): top visible, bottom visible (share is next)
        const bottomHidden = await page.$('.reel-nav-btn--bottom.reel-nav-btn--hidden');
        assert(bottomHidden === null, 'Bottom nav button visible when shard section is showing (share is next)');

        const topHidden = await page.$('.reel-nav-btn--top.reel-nav-btn--hidden');
        assert(topHidden === null, 'Top nav button visible when shard section is showing (wedge is previous)');
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: initialSubgroup=shards → reel starts at shard section
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: initialSubgroup=shards — reel starts at shard index ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        }));
      });
      // Navigate with subgroup=shards in the URL
      await page.goto(`${BASE_URL}/end?subgroup=shards&cards=25&completed=true`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // At shard index (3), top button should be visible, bottom button should be visible
      const topHidden = await page.$('.reel-nav-btn--top.reel-nav-btn--hidden');
      assert(topHidden === null, 'Top nav button visible when starting at shards (can go back to wedges)');

      const bottomHidden = await page.$('.reel-nav-btn--bottom.reel-nav-btn--hidden');
      assert(bottomHidden === null, 'Bottom nav button visible when starting at shards (share is next)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 9: Locked state — shard not unlocked → shows button, no triangle wheel
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 9: Locked shard section — button visible, no triangle wheel ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      // No shards in progression
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy', 'wedges'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const shardLocked = await page.$('.level-section--shards.level-section--locked');
      assert(shardLocked !== null, '.level-section--shards has .level-section--locked class when not unlocked');

      const lockedBtn = await page.$('.level-section--shards .next-session-button');
      assert(lockedBtn !== null, 'Locked shard section has a navigation button');

      const lockedBtnText = await page.textContent('.level-section--shards .next-session-button');
      assert(
        lockedBtnText && lockedBtnText.toLowerCase().includes('shard'),
        `Locked shard button text references "shard" (got: "${lockedBtnText?.trim()}")`,
      );

      const triangleWheel = await page.$('.level-section--shards .shard-color-wheel');
      assert(triangleWheel === null, 'No .shard-color-wheel rendered in locked shard section');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 10: Span flush — trigger highlights and wait for OTel export
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 10: Span flush (wait 35s for OTel batch timer) ===\n');
    {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        }));
      });
      await page.goto(END_URL_SHARD);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.shard-color-wheel', { timeout: 5000 });

      // Navigate to shard section first (starts at allied by default, or shards via URL param)
      await page.waitForTimeout(500);

      // Trigger several shard highlights
      for (const triId of ['#tri-green-white-blue', '#tri-blue-black-red', '#tri-red-green-white']) {
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
  console.log('\n=== Phase 11: Honeycomb check (via MCP) ===');
  console.log('  (Performed after test run)');

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n=== Summary ===');
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${failures}`);
  console.log(`  Total:  ${passes + failures}`);

  if (failures > 0) {
    console.error(`\nArc 31 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 31 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
