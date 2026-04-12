/**
 * Arc 77 verification: Level Abstraction (structural refactor)
 *
 * What changed:
 * - New src/levels.ts defines LEVELS array + LevelDefinition interface
 * - src/session.ts uses LEVELS.find() for pool lookup instead of local poolMap
 * - src/slides.ts derives level number, title, combo names from LEVELS
 * - src/ui/guild-columns.ts iterates UI_LEVELS instead of calling 4 builders by name
 * - src/end.ts simplified call, no more 4 boolean params
 * - src/version.ts bumped to 0.46.0
 *
 * Acceptance criteria:
 * 1. All 4 levels still work: allied guilds, enemy guilds, wedges, shards
 * 2. Level intro shows correct level numbers (1-4), correct titles, correct combo names
 * 3. End page shows all 4 level sections with correct titles and descriptions
 * 4. The share section is still present at the bottom (not a level)
 * 5. Version 0.46.0 is present in the settings panel
 * 6. Build bundle contains 0.46.0 version string
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

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Build bundle contains version 0.46.0
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Bundle contains version 0.46.0 ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/slides.js`);
      assert(response.status() === 200, 'dist/slides.js is served (HTTP 200)');
      const text = await response.text();
      assert(text.includes('0.46.0'), 'slides.js bundle contains "0.46.0"');
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Level intro — all 4 subgroups show correct level number and title
    // -----------------------------------------------------------------------
    const levelCases = [
      {
        subgroup: 'allied',
        levelNum: 'LEVEL 1',
        title: 'Allied Guilds',
        names: ['Azorius', 'Dimir', 'Rakdos', 'Gruul', 'Selesnya'],
      },
      {
        subgroup: 'enemy',
        levelNum: 'LEVEL 2',
        title: 'Enemy Guilds',
        names: ['Orzhov', 'Izzet', 'Golgari', 'Boros', 'Simic'],
      },
      {
        subgroup: 'wedges',
        levelNum: 'LEVEL 3',
        title: 'Wedges',
        names: ['Abzan', 'Jeskai', 'Sultai', 'Mardu', 'Temur'],
      },
      {
        subgroup: 'shards',
        levelNum: 'LEVEL 4',
        title: 'Shards',
        names: ['Bant', 'Esper', 'Grixis', 'Jund', 'Naya'],
      },
    ];

    for (const { subgroup, levelNum, title, names } of levelCases) {
      console.log(`\n=== Phase 2 — Level intro: ${subgroup} ===\n`);
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=${subgroup}`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(500);

      const introVisible = await page.isVisible('.level-intro');
      assert(introVisible, `.level-intro is visible for subgroup=${subgroup}`);

      const levelNumber = await page.textContent('.level-intro-number').catch(() => null);
      assert(
        levelNumber && levelNumber.includes(levelNum),
        `.level-intro-number shows "${levelNum}" (got: "${levelNumber?.trim()}")`,
      );

      const subtitle = await page.textContent('.level-intro-subtitle').catch(() => null);
      assert(
        subtitle && subtitle.includes(title),
        `.level-intro-subtitle shows "${title}" (got: "${subtitle?.trim()}")`,
      );

      const namesText = await page.textContent('.level-intro-names').catch(() => null);
      for (const name of names) {
        assert(
          namesText && namesText.includes(name),
          `.level-intro-names includes "${name}"`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: End page — all 4 level sections + share section present
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: End page — all 4 level sections + share section ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Unlock all subgroups so all sections are visible
      await page.addInitScript((state) => {
        localStorage.setItem(state.key, JSON.stringify(state.value));
      }, {
        key: STORAGE_KEY,
        value: {
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: [],
        },
      });

      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      // Check all 4 level section headers
      const expectedHeaders = ['Allied Guilds', 'Enemy Guilds', 'Wedges', 'Shards'];
      const allHeaders = await page.$$eval('.level-section-header', els =>
        els.map(el => el.textContent?.trim() ?? '')
      );

      for (const expected of expectedHeaders) {
        assert(
          allHeaders.some(h => h.includes(expected)),
          `End page has a section header containing "${expected}" (found: ${JSON.stringify(allHeaders)})`,
        );
      }

      // Check descriptions from levels.ts are present in the page
      const descriptions = [
        'Allied guilds are pairs of neighboring colors',
        'Enemy guilds pair colors from opposite sides',
        'Wedges combine one color with the two across from it',
        'Shards combine one color with the two on either side',
      ];
      const bodyText = await page.textContent('body');
      for (const desc of descriptions) {
        assert(
          bodyText && bodyText.includes(desc),
          `End page body includes description: "${desc.substring(0, 40)}..."`,
        );
      }

      // Share section — present (not a level)
      const shareHeaders = allHeaders.filter(h => h.toLowerCase().includes('share'));
      assert(
        shareHeaders.length > 0,
        `End page has a share section header (found headers: ${JSON.stringify(allHeaders)})`,
      );

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Version 0.46.0 in settings panel
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Version 0.46.0 in settings panel ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(500);

      // Open settings/menu
      const menuBtn = page.locator('#menu-btn');
      await menuBtn.click();
      await sleep(300);

      const versionEl = page.locator('#settings-version');
      const versionText = await versionEl.textContent().catch(() => null);
      assert(
        versionText && versionText.includes('0.46.0'),
        `Settings panel shows version 0.46.0 (got: "${versionText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Slides page actually loads cards for each subgroup
    //          (verifies LEVELS.find() pool lookup works for all 4)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Slides page loads cards after intro dismissal ===\n');
    for (const subgroup of ['allied', 'enemy', 'wedges', 'shards']) {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=${subgroup}`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(500);

      // Dismiss intro by clicking on it
      const intro = page.locator('.level-intro');
      if (await intro.isVisible()) {
        await intro.click();
        await sleep(700);
      }

      const cardVisible = await page.isVisible('.card').catch(() => false);
      assert(cardVisible, `After dismissing intro for ${subgroup}, a .card is visible`);

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
    console.error(`\nArc 77 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 77 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
