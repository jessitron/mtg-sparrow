/**
 * Arc 22 verification: End screen row layout
 *
 * Tests:
 * 1. Bundle confirms end.layout_version / rows_v1 and version 0.19.0
 * 2. Three-panel row structure: summary | wheel | flavor per guild row
 * 3. Flavor panel shows guild name on hover (guild-column-flavor-name)
 * 4. Color wheel hover still works (highlight + list item)
 * 5. Desktop layout: three-column grid (computed styles)
 * 6. Mobile layout: single-column stacked (narrow viewport)
 * 7. Existing functionality: buttons, settings gear, progression state
 * 8. Span flush for Honeycomb + Honeycomb check for end.layout_version = 'rows_v1'
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
    // PHASE 1: Bundle confirms telemetry markers for rows_v1
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Bundle confirms telemetry markers (rows_v1) ===\n');
    {
      const page = await browser.newPage();

      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js builds and is served (HTTP 200)');

      const bundleText = await response.text();
      assert(bundleText.includes('0.19.0'), 'end.js contains version "0.19.0"');
      assert(bundleText.includes('end.layout_version'), 'end.js contains "end.layout_version" attribute key');
      assert(
        bundleText.includes('rows_v1'),
        'end.js contains "rows_v1" layout version value',
      );
      assert(bundleText.includes('session.summary'), 'end.js contains "session.summary" span name');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Row structure — three panels per guild row (desktop)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Row structure — three panels per guild row ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Container: flex column stacking rows
      const container = await page.$('.guild-columns');
      assert(container !== null, '.guild-columns container is present');

      // Allied row: has all three panels
      const alliedSummary = await page.$('.guild-column--allied .guild-column-summary');
      assert(alliedSummary !== null, 'Allied row has .guild-column-summary panel');

      const alliedWheel = await page.$('.guild-column--allied .guild-column-wheel');
      assert(alliedWheel !== null, 'Allied row has .guild-column-wheel panel');

      const alliedFlavor = await page.$('.guild-column--allied .guild-column-flavor');
      assert(alliedFlavor !== null, 'Allied row has .guild-column-flavor panel');

      // Enemy row: has all three panels
      const enemySummary = await page.$('.guild-column--enemy .guild-column-summary');
      assert(enemySummary !== null, 'Enemy row has .guild-column-summary panel');

      const enemyWheel = await page.$('.guild-column--enemy .guild-column-wheel');
      assert(enemyWheel !== null, 'Enemy row has .guild-column-wheel panel');

      const enemyFlavor = await page.$('.guild-column--enemy .guild-column-flavor');
      assert(enemyFlavor !== null, 'Enemy row has .guild-column-flavor panel');

      // Each column should have exactly 3 direct children when unlocked
      const alliedChildCount = await page.evaluate(() => {
        const col = document.querySelector('.guild-column--allied');
        return col ? col.children.length : -1;
      });
      assert(alliedChildCount === 3, `Allied row has 3 child panels (got: ${alliedChildCount})`);

      const enemyChildCount = await page.evaluate(() => {
        const col = document.querySelector('.guild-column--enemy');
        return col ? col.children.length : -1;
      });
      assert(enemyChildCount === 3, `Enemy row has 3 child panels (got: ${enemyChildCount})`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Desktop CSS grid layout — three columns
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Desktop CSS grid — three-column layout ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied'],
          completedSubgroups: ['allied'],
        }));
      });

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const gridInfo = await page.evaluate(() => {
        const col = document.querySelector('.guild-column--allied');
        if (!col) return null;
        const styles = window.getComputedStyle(col);
        return {
          display: styles.display,
          gridTemplateColumns: styles.gridTemplateColumns,
        };
      });

      assert(gridInfo !== null, 'Allied column element is present for style check');
      assert(
        gridInfo && gridInfo.display === 'grid',
        `Allied column uses display:grid on desktop (got: ${gridInfo?.display})`,
      );

      // Three-column grid: browser resolves to pixel values like "341px 320px 341px"
      // Split by space — resolved values don't contain spaces inside values
      const columnCount = gridInfo?.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length ?? 0;
      assert(
        columnCount === 3,
        `Allied column grid has 3 template columns on desktop (got: ${columnCount} in "${gridInfo?.gridTemplateColumns}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Mobile layout — stacked single column
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Mobile layout — stacked single column ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 400, height: 800 });

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied'],
          completedSubgroups: ['allied'],
        }));
      });

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const mobileGridInfo = await page.evaluate(() => {
        const col = document.querySelector('.guild-column--allied');
        if (!col) return null;
        const styles = window.getComputedStyle(col);
        return {
          display: styles.display,
          gridTemplateColumns: styles.gridTemplateColumns,
        };
      });

      assert(mobileGridInfo !== null, 'Allied column present at mobile viewport');

      // At mobile, grid-template-columns should collapse to a single column
      const mobileColumnCount = mobileGridInfo?.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length ?? 0;
      assert(
        mobileColumnCount === 1,
        `Mobile layout stacks to 1 column (got: ${mobileColumnCount} in "${mobileGridInfo?.gridTemplateColumns}")`,
      );

      // All three panels should still be present even on mobile
      const summaryPresent = await page.$('.guild-column--allied .guild-column-summary') !== null;
      const wheelPresent = await page.$('.guild-column--allied .guild-column-wheel') !== null;
      const flavorPresent = await page.$('.guild-column--allied .guild-column-flavor') !== null;
      assert(summaryPresent && wheelPresent && flavorPresent, 'All three panels present on mobile (just stacked)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Flavor panel — shows guild name on hover
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Flavor panel shows guild name on highlight ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied'],
          completedSubgroups: ['allied'],
        }));
      });

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.allied-color-wheel', { timeout: 5000 });

      // Flavor name should be empty before hover
      const flavorNameBefore = await page.textContent('.guild-column--allied .guild-column-flavor-name');
      assert(
        flavorNameBefore === '' || flavorNameBefore === null,
        `Flavor name is empty before hover (got: "${flavorNameBefore}")`,
      );

      // Hover over white-blue line to trigger Azorius highlight
      const lineGroup = await page.$('#line-white-blue');
      assert(lineGroup !== null, '#line-white-blue exists in allied SVG');

      if (lineGroup) {
        await lineGroup.hover();
        await page.waitForTimeout(300);

        // Flavor name should now show "Azorius"
        const flavorNameAfter = await page.textContent('.guild-column--allied .guild-column-flavor-name');
        assert(
          flavorNameAfter && flavorNameAfter.includes('Azorius'),
          `Flavor name shows "Azorius" on hover (got: "${flavorNameAfter?.trim()}")`,
        );

        // Guild column should have --has-highlight class (which drives opacity)
        const hasHighlight = await page.$('.guild-column--allied.guild-column--has-highlight');
        assert(hasHighlight !== null, 'Allied column gains .guild-column--has-highlight class on hover');

        // Move mouse away — flavor name should clear
        await page.mouse.move(0, 0);
        await page.waitForTimeout(300);

        const flavorNameCleared = await page.textContent('.guild-column--allied .guild-column-flavor-name');
        assert(
          flavorNameCleared === '' || flavorNameCleared === null,
          `Flavor name clears when mouse leaves (got: "${flavorNameCleared}")`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Color wheel hover still works (line + list item highlight)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Color wheel hover — line + list item highlight ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied'],
          completedSubgroups: ['allied'],
        }));
      });

      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.allied-color-wheel', { timeout: 5000 });

      const lineGroup = await page.$('#line-white-blue');
      if (lineGroup) {
        await lineGroup.hover();
        await page.waitForTimeout(200);

        const lineHighlighted = await page.$('#line-white-blue.highlight');
        assert(lineHighlighted !== null, '#line-white-blue gains .highlight class on hover');

        const listItemHighlighted = await page.$('[data-guild-id="azorius"].highlight');
        assert(listItemHighlighted !== null, 'Azorius guild list item gains .highlight on hover');

        await page.mouse.move(0, 0);
        await page.waitForTimeout(200);

        const lineUnhighlighted = await page.$('#line-white-blue.highlight');
        assert(lineUnhighlighted === null, '#line-white-blue loses .highlight class on mouse leave');
      } else {
        assert(false, '#line-white-blue exists for hover test');
      }

      // Test enemy wheel too — reload with both subgroups unlocked
      await page.close();
      const page2 = await browser.newPage();
      await page2.setViewportSize({ width: 1200, height: 800 });
      await page2.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });
      await page2.goto(END_URL_BARE);
      await page2.waitForLoadState('domcontentloaded');
      await page2.waitForSelector('.enemy-color-wheel', { timeout: 5000 });

      const enemyLine = await page2.$('#line-white-black');
      assert(enemyLine !== null, '#line-white-black exists in enemy SVG');
      if (enemyLine) {
        await enemyLine.hover();
        await page2.waitForTimeout(200);
        const enemyLineHighlighted = await page2.$('#line-white-black.highlight');
        assert(enemyLineHighlighted !== null, '#line-white-black gains .highlight class on hover');
      }

      await page2.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Existing functionality — buttons, settings gear, locked state
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Existing functionality preserved ===\n');
    {
      const page = await browser.newPage();

      // Test locked state (no progression)
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      const alliedLocked = await page.$('.guild-column--allied.guild-column--locked');
      assert(alliedLocked !== null, 'Allied column locked when no localStorage progression');

      const enemyLocked = await page.$('.guild-column--enemy.guild-column--locked');
      assert(enemyLocked !== null, 'Enemy column locked when no localStorage progression');

      // Locked columns still have buttons
      const alliedBtn = await page.$('.guild-column--allied .next-session-button');
      assert(alliedBtn !== null, 'Allied locked column still has a navigation button');

      await page.close();

      // Settings gear
      const page2 = await browser.newPage();
      await page2.goto(END_URL_BARE);
      await page2.waitForLoadState('domcontentloaded');
      await page2.waitForTimeout(300);

      const gearVisible = await page2.isVisible('#settings-gear-btn');
      assert(gearVisible, 'Settings gear button is visible');

      await page2.click('#settings-gear-btn');
      await page2.waitForSelector('#settings-panel:not([hidden])', { timeout: 5000 });
      const panelVisible = await page2.isVisible('#settings-panel');
      assert(panelVisible, 'Settings panel opens');

      const versionText = await page2.textContent('#settings-version');
      assert(
        versionText && versionText.includes('0.19.0'),
        `Settings version shows "0.19.0" (got: "${versionText?.trim()}")`,
      );

      await page2.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: Span flush — wait for OTel batch timer
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: Span flush (wait 35s for OTel batch timer) ===\n');
    {
      const page = await browser.newPage();

      await page.goto(END_URL);
      await page.waitForLoadState('domcontentloaded');

      console.log('  End page loaded with URL params, waiting 35s for OTel batch timer...');
      await page.waitForTimeout(35000);
      console.log('  Wait complete — spans should be exported to Honeycomb.');

      await page.close();
    }

  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------------------
  // Summary (Honeycomb check performed separately via MCP)
  // -----------------------------------------------------------------------
  console.log('\n=== Summary ===');
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${failures}`);
  console.log(`  Total:  ${passes + failures}`);

  if (failures > 0) {
    console.error(`\nArc 22 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 22 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
