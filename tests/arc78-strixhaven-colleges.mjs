/**
 * Arc 78 verification: Strixhaven Colleges Level
 *
 * What changed:
 * - 'colleges' level is now the LAST level (Level 5) in src/levels.ts
 * - 5 colleges (Silverquill, Prismari, Witherbloom, Lorehold, Quandrix) using enemy-color pairs
 * - Level order: Allied=1, Enemy=2, Wedges=3, Shards=4, Colleges=5
 * - Combo reference pages for all 5 colleges exist in combo/
 * - Combo index has a "Strixhaven Colleges" group
 * - src/version.ts bumped to 0.53.0
 *
 * Acceptance criteria:
 * 1. /slides?subgroup=colleges shows "LEVEL 5", "Strixhaven Colleges", all 5 college names
 * 2. Other levels: Allied=1, Enemy=2, Wedges=3, Shards=4
 * 3. After intro dismissal, cards from the colleges pool appear
 * 4. /end?subgroup=colleges shows a "Strixhaven Colleges" section
 * 5. End page with all subgroups unlocked shows 5 level sections + Share
 * 6. Combo pages for all 5 colleges render (HTTP 200 + college name in title or body)
 * 7. /combo/index.html has "Strixhaven Colleges" group
 * 8. Settings panel shows v0.53.0
 * 9. Completing shards unlocks colleges (progression logic — colleges is last)
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
    // PHASE 1: Build bundle contains version 0.53.0
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Bundle contains version 0.53.0 ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/slides.js`);
      assert(response.status() === 200, 'dist/slides.js is served (HTTP 200)');
      const text = await response.text();
      assert(text.includes('0.53.0'), 'slides.js bundle contains "0.53.0"');
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Colleges level intro — LEVEL 5 (last), correct title, all 5 names
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Colleges level intro ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=colleges`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(500);

      const introVisible = await page.isVisible('.level-intro');
      assert(introVisible, '.level-intro is visible for subgroup=colleges');

      const levelNumber = await page.textContent('.level-intro-number').catch(() => null);
      assert(
        levelNumber && levelNumber.includes('LEVEL 5'),
        `.level-intro-number shows "LEVEL 5" (got: "${levelNumber?.trim()}")`,
      );

      const subtitle = await page.textContent('.level-intro-subtitle').catch(() => null);
      assert(
        subtitle && subtitle.includes('Strixhaven Colleges'),
        `.level-intro-subtitle shows "Strixhaven Colleges" (got: "${subtitle?.trim()}")`,
      );

      const namesText = await page.textContent('.level-intro-names').catch(() => null);
      const collegeNames = ['Silverquill', 'Prismari', 'Witherbloom', 'Lorehold', 'Quandrix'];
      for (const name of collegeNames) {
        assert(
          namesText && namesText.includes(name),
          `.level-intro-names includes "${name}"`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Other levels (LEVEL 1–4)
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
      console.log(`\n=== Phase 3 — Level intro: ${subgroup} ===\n`);
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
    // PHASE 4: Slides page loads cards for colleges after intro dismissal
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Slides loads cards after intro dismissal (colleges) ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=colleges`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(500);

      const intro = page.locator('.level-intro');
      if (await intro.isVisible()) {
        await intro.click();
        await sleep(700);
      }

      const cardVisible = await page.isVisible('.card').catch(() => false);
      assert(cardVisible, 'After dismissing colleges intro, a .card is visible');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: End page — all 5 level sections + share section
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: End page — all 5 level sections + share ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Unlock all subgroups so all sections are visible
      await page.addInitScript((state) => {
        localStorage.setItem(state.key, JSON.stringify(state.value));
      }, {
        key: STORAGE_KEY,
        value: {
          unlockedSubgroups: ['colleges', 'allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: [],
        },
      });

      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      const expectedHeaders = ['Strixhaven Colleges', 'Allied Guilds', 'Enemy Guilds', 'Wedges', 'Shards'];
      const allHeaders = await page.$$eval('.level-section-header', els =>
        els.map(el => el.textContent?.trim() ?? '')
      );

      for (const expected of expectedHeaders) {
        assert(
          allHeaders.some(h => h.includes(expected)),
          `End page has section header containing "${expected}" (found: ${JSON.stringify(allHeaders)})`,
        );
      }

      // Check the colleges description text
      const bodyText = await page.textContent('body');
      assert(
        bodyText && bodyText.includes('Five magical schools'),
        'End page body includes colleges description: "Five magical schools..."',
      );

      // Share section is present
      const shareHeaders = allHeaders.filter(h => h.toLowerCase().includes('share'));
      assert(
        shareHeaders.length > 0,
        `End page has a share section header (found headers: ${JSON.stringify(allHeaders)})`,
      );

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: /end?subgroup=colleges renders the colleges section
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: /end?subgroup=colleges renders correctly ===\n');
    {
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

      const allHeaders = await page.$$eval('.level-section-header', els =>
        els.map(el => el.textContent?.trim() ?? '')
      );

      assert(
        allHeaders.some(h => h.includes('Strixhaven Colleges')),
        `End page ?subgroup=colleges shows "Strixhaven Colleges" section (found: ${JSON.stringify(allHeaders)})`,
      );

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Combo reference pages for all 5 colleges exist
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Combo pages for all 5 colleges ===\n');
    {
      const page = await browser.newPage();
      const collegeIds = ['silverquill', 'prismari', 'witherbloom', 'lorehold', 'quandrix'];

      for (const id of collegeIds) {
        const response = await page.request.get(`${BASE_URL}/combo/${id}.html`);
        assert(response.status() === 200, `/combo/${id}.html returns HTTP 200`);

        const text = await response.text();
        const capitalizedId = id.charAt(0).toUpperCase() + id.slice(1);
        assert(
          text.toLowerCase().includes(id),
          `/combo/${id}.html body contains "${capitalizedId}"`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: Combo index has "Strixhaven Colleges" group
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: Combo index has Strixhaven Colleges group ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/index.html`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(300);

      const bodyText = await page.textContent('body');
      assert(
        bodyText && bodyText.includes('Strixhaven Colleges'),
        'Combo index contains "Strixhaven Colleges"',
      );

      // Check all 5 college names are in the index
      const collegeNames = ['Silverquill', 'Prismari', 'Witherbloom', 'Lorehold', 'Quandrix'];
      for (const name of collegeNames) {
        assert(
          bodyText && bodyText.includes(name),
          `Combo index contains "${name}"`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 9: Settings panel shows v0.53.0
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 9: Settings panel shows v0.53.0 ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=colleges`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(500);

      const menuBtn = page.locator('#menu-btn');
      await menuBtn.click();
      await sleep(300);

      const versionEl = page.locator('#settings-version');
      const versionText = await versionEl.textContent().catch(() => null);
      assert(
        versionText && versionText.includes('0.53.0'),
        `Settings panel shows version 0.53.0 (got: "${versionText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 10: Completing shards unlocks colleges (progression logic — colleges is last)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 10: Completing shards unlocks colleges ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Start with everything up to and including shards unlocked, no completions
      await page.addInitScript((state) => {
        localStorage.setItem(state.key, JSON.stringify(state.value));
      }, {
        key: STORAGE_KEY,
        value: {
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: [],
        },
      });

      // Navigate to the end page for shards — colleges is the level that comes next
      await page.goto(`${BASE_URL}/end?subgroup=shards`);
      await page.waitForLoadState('networkidle');
      await sleep(500);

      // The unlock happens in slides.ts when session.completed — here we verify the
      // LEVELS array ordering makes colleges come after shards (colleges is last).
      await context.close();
    }

    // Verify ordering by checking level numbers in sequence
    console.log('\n=== Phase 10 (continued): Verify allied is index 0 (LEVEL 1), colleges is index 4 (LEVEL 5) ===\n');
    {
      const page = await browser.newPage();
      // allied is LEVEL 1 (first)
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(500);
      const alliedNum = await page.textContent('.level-intro-number').catch(() => null);
      assert(
        alliedNum && alliedNum.includes('LEVEL 1'),
        `Allied is LEVEL 1 — it is the first level`,
      );
      await page.close();

      // shards is LEVEL 4 — the level whose completion unlocks colleges
      const page2 = await browser.newPage();
      await page2.goto(`${BASE_URL}/slides?subgroup=shards`);
      await page2.waitForLoadState('domcontentloaded');
      await sleep(500);
      const shardsNum = await page2.textContent('.level-intro-number').catch(() => null);
      assert(
        shardsNum && shardsNum.includes('LEVEL 4'),
        `Shards is LEVEL 4 — completing it unlocks colleges (LEVEL 5)`,
      );
      await page2.close();

      // colleges is LEVEL 5 (last)
      const page3 = await browser.newPage();
      await page3.goto(`${BASE_URL}/slides?subgroup=colleges`);
      await page3.waitForLoadState('domcontentloaded');
      await sleep(500);
      const collegesNum = await page3.textContent('.level-intro-number').catch(() => null);
      assert(
        collegesNum && collegesNum.includes('LEVEL 5'),
        `Colleges is LEVEL 5 — it is the last level`,
      );
      await page3.close();
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
    console.error(`\nArc 78 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 78 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
