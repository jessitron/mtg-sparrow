/**
 * Arc 79 verification: College end-page bug fixes
 *
 * Bug 1: College descriptions not appearing on hover/click
 *   - Was: looking up enemy guild IDs (orzhov etc.) instead of college IDs
 *   - Fixed: wireCollegesHover passes collegePairToId override map
 *
 * Bug 2: (RETIRED) Originally asserted no crest appears for colleges. Arc 82
 *   deliberately superseded this by wiring college crest images onto the wheel,
 *   so college crests now show at opacity=1. That behavior is covered by
 *   arc-082-college-crests.mjs; the old Bug 2 phase has been removed here.
 *
 * Regression: Enemy guilds section still works correctly.
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const STORAGE_KEY = 'sparrow-deck.progression';

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

/** Make a fresh page with colleges unlocked, navigated to /end?subgroup=colleges */
async function makeCollegesPage(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript((state) => {
    localStorage.setItem(state.key, JSON.stringify(state.value));
  }, {
    key: STORAGE_KEY,
    value: {
      unlockedSubgroups: ['colleges'],
      completedSubgroups: ['colleges'],
    },
  });
  await page.goto(`${BASE_URL}/end?subgroup=colleges`);
  await page.waitForLoadState('networkidle');
  await sleep(500);
  return { context, page };
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Version check — expect 0.53.0
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Bundle version is 0.53.0 ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js is served (HTTP 200)');
      const text = await response.text();
      assert(text.includes('0.53.0'), 'end.js bundle contains "0.53.0"');
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: College descriptions appear on click (Bug 1 fix)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: College descriptions appear on click (Bug 1 fix) ===\n');
    {
      const { context, page } = await makeCollegesPage(browser);
      const collegeSection = page.locator('.level-section--colleges');
      assert(await collegeSection.count() > 0, 'Colleges section is present on end page');

      // Click the first star line to check that a college entry activates
      const firstLine = collegeSection.locator('.enemy-line').first();
      assert(await firstLine.count() > 0, 'Colleges section has enemy-line elements in SVG');

      await firstLine.click({ force: true });
      await sleep(300);

      const activeEntry = collegeSection.locator('.level-section-flavor-entry.active');
      assert(await activeEntry.count() > 0, 'A flavor entry is active after clicking a college line');

      if (await activeEntry.count() > 0) {
        const guildId = await activeEntry.getAttribute('data-guild-id');
        const collegeIds = ['silverquill', 'prismari', 'witherbloom', 'lorehold', 'quandrix'];
        const enemyGuildIds = ['orzhov', 'izzet', 'golgari', 'boros', 'simic'];

        assert(
          collegeIds.includes(guildId),
          `Active entry data-guild-id is a college ID: "${guildId}"`,
        );
        assert(
          !enemyGuildIds.includes(guildId),
          `Active entry data-guild-id is NOT an enemy guild ID (bug 1 test): "${guildId}"`,
        );

        const descText = await activeEntry.locator('.level-section-flavor-desc').textContent().catch(() => null);
        assert(
          descText && descText.trim().length > 0,
          `Active entry has non-empty description text: "${descText?.trim().slice(0, 60)}..."`,
        );

        const nameText = await activeEntry.locator('.level-section-flavor-name').textContent().catch(() => null);
        const collegeNames = ['Silverquill', 'Prismari', 'Witherbloom', 'Lorehold', 'Quandrix'];
        assert(
          nameText && collegeNames.some(n => nameText.includes(n)),
          `Active entry name is a college name: "${nameText?.trim()}"`,
        );
      }

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2b: All 5 college star lines map to distinct college IDs
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2b: All 5 college lines map to college IDs ===\n');
    {
      const { context, page } = await makeCollegesPage(browser);
      const collegeSection = page.locator('.level-section--colleges');
      const allLines = await collegeSection.locator('.enemy-line').all();
      const foundCollegeIds = new Set();

      // Click each line sequentially; clicking a new line auto-deselects the previous
      for (const lineEl of allLines) {
        await lineEl.click({ force: true });
        await sleep(200);

        const activeEnt = collegeSection.locator('.level-section-flavor-entry.active');
        if (await activeEnt.count() > 0) {
          const gid = await activeEnt.getAttribute('data-guild-id');
          if (gid) foundCollegeIds.add(gid);
        }
      }

      assert(
        foundCollegeIds.size === 5,
        `All 5 college lines activate unique entries (found ${foundCollegeIds.size}: ${[...foundCollegeIds].join(', ')})`,
      );
      for (const id of ['silverquill', 'prismari', 'witherbloom', 'lorehold', 'quandrix']) {
        assert(
          foundCollegeIds.has(id),
          `College line for "${id}" was found active`,
        );
      }

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Regression — enemy guilds section still works
    //
    // (The former Bug 2 phase — asserting no crest appears for colleges — was
    // retired: Arc 82 intentionally wires college crests onto the wheel, so
    // college crests now show at opacity=1. See arc-082-college-crests.mjs.)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Regression — enemy guilds descriptions still work ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.addInitScript((state) => {
        localStorage.setItem(state.key, JSON.stringify(state.value));
      }, {
        key: STORAGE_KEY,
        value: {
          unlockedSubgroups: ['colleges', 'allied', 'enemy'],
          completedSubgroups: ['colleges', 'allied', 'enemy'],
        },
      });

      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const enemySection = page.locator('.level-section--enemy');
      assert(await enemySection.count() > 0, 'Enemy guilds section is present on end page');

      const firstLine = enemySection.locator('.enemy-line').first();
      assert(await firstLine.count() > 0, 'Enemy guilds section has enemy-line elements');

      await firstLine.click({ force: true });
      await sleep(300);

      const activeEntry = enemySection.locator('.level-section-flavor-entry.active');
      assert(await activeEntry.count() > 0, 'A flavor entry is active after clicking an enemy guild line');

      if (await activeEntry.count() > 0) {
        const guildId = await activeEntry.getAttribute('data-guild-id');
        const enemyGuildIds = ['orzhov', 'izzet', 'golgari', 'boros', 'simic'];
        assert(
          enemyGuildIds.includes(guildId),
          `Enemy guilds: active entry data-guild-id is an enemy guild ID: "${guildId}"`,
        );

        const descText = await activeEntry.locator('.level-section-flavor-desc').textContent().catch(() => null);
        assert(
          descText && descText.trim().length > 0,
          `Enemy guild active entry has non-empty description: "${descText?.trim().slice(0, 60)}..."`,
        );

        // Enemy guilds should show the crest image (this is expected correct behavior)
        const crestImg = enemySection.locator('[id="crest-image-enemy"]');
        if (await crestImg.count() > 0) {
          const opacity = await crestImg.getAttribute('opacity');
          assert(
            opacity === '1',
            `Enemy guild crest image has opacity=1 when line is highlighted (got: "${opacity}")`,
          );
        }
      }

      await context.close();
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
    console.error(`\nArc 79 bug-fix verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 79 bug-fix verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
