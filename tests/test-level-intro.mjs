/**
 * Arc 44 verification: Level Intro Slide
 *
 * Tests that before the quiz cards appear, users see a title card showing
 * "LEVEL N" and the five combo names for that level.
 *
 * Test cases:
 * 1. Allied (Level 1) — .level-intro visible, LEVEL 1, Allied Guilds, all 5 names, CTA hint
 * 2. Enemy (Level 2)  — LEVEL 2, Enemy Guilds, Orzhov/Izzet/Golgari/Boros/Simic
 * 3. Wedges (Level 3) — LEVEL 3, Wedges, Abzan/Jeskai/Sultai/Mardu/Temur
 * 4. Shards (Level 4) — LEVEL 4, Shards, Bant/Esper/Grixis/Jund/Naya
 * 5. Spacebar dismissal — Space key dismisses intro and shows card
 * 6. No card before dismissal — .card does not exist while intro is showing
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

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Allied (Level 1)
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Allied (Level 1) ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Level intro should be visible
      const introVisible = await page.isVisible('.level-intro');
      assert(introVisible, '.level-intro element is visible');

      // Level number
      const levelNumber = await page.textContent('.level-intro-number').catch(() => null);
      assert(
        levelNumber && levelNumber.includes('LEVEL 1'),
        `.level-intro-number shows "LEVEL 1" (got: "${levelNumber?.trim()}")`,
      );

      // Subtitle
      const subtitle = await page.textContent('.level-intro-subtitle').catch(() => null);
      assert(
        subtitle && subtitle.includes('Allied Guilds'),
        `.level-intro-subtitle shows "Allied Guilds" (got: "${subtitle?.trim()}")`,
      );

      // All 5 guild names
      const namesText = await page.textContent('.level-intro-names').catch(() => null);
      const alliedNames = ['Azorius', 'Dimir', 'Rakdos', 'Gruul', 'Selesnya'];
      for (const name of alliedNames) {
        assert(
          namesText && namesText.includes(name),
          `.level-intro-names includes "${name}"`,
        );
      }

      // CTA hint text
      const ctaExists = (await page.$('.level-intro-cta')) !== null;
      assert(ctaExists, '.level-intro-cta element is present');

      // No card while intro is showing (Phase 6 check here too for allied)
      const cardExists = (await page.$('.card')) !== null;
      assert(!cardExists, 'No .card element exists while level intro is showing');

      // Click to dismiss
      await page.click('.level-intro');
      await page.waitForTimeout(500);

      // Intro should be gone, card should appear
      const introGone = !(await page.isVisible('.level-intro'));
      assert(introGone, '.level-intro disappears after clicking');

      const cardVisible = await page.isVisible('.card').catch(() => false);
      assert(cardVisible, '.card appears after dismissing the intro');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Enemy (Level 2)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Enemy (Level 2) ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=enemy`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const levelNumber = await page.textContent('.level-intro-number').catch(() => null);
      assert(
        levelNumber && levelNumber.includes('LEVEL 2'),
        `.level-intro-number shows "LEVEL 2" (got: "${levelNumber?.trim()}")`,
      );

      const subtitle = await page.textContent('.level-intro-subtitle').catch(() => null);
      assert(
        subtitle && subtitle.includes('Enemy Guilds'),
        `.level-intro-subtitle shows "Enemy Guilds" (got: "${subtitle?.trim()}")`,
      );

      const namesText = await page.textContent('.level-intro-names').catch(() => null);
      const enemyNames = ['Orzhov', 'Izzet', 'Golgari', 'Boros', 'Simic'];
      for (const name of enemyNames) {
        assert(
          namesText && namesText.includes(name),
          `.level-intro-names includes "${name}"`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Wedges (Level 3)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Wedges (Level 3) ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=wedges`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const levelNumber = await page.textContent('.level-intro-number').catch(() => null);
      assert(
        levelNumber && levelNumber.includes('LEVEL 3'),
        `.level-intro-number shows "LEVEL 3" (got: "${levelNumber?.trim()}")`,
      );

      const subtitle = await page.textContent('.level-intro-subtitle').catch(() => null);
      assert(
        subtitle && subtitle.includes('Wedges'),
        `.level-intro-subtitle shows "Wedges" (got: "${subtitle?.trim()}")`,
      );

      const namesText = await page.textContent('.level-intro-names').catch(() => null);
      const wedgeNames = ['Abzan', 'Jeskai', 'Sultai', 'Mardu', 'Temur'];
      for (const name of wedgeNames) {
        assert(
          namesText && namesText.includes(name),
          `.level-intro-names includes "${name}"`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Shards (Level 4)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Shards (Level 4) ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=shards`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const levelNumber = await page.textContent('.level-intro-number').catch(() => null);
      assert(
        levelNumber && levelNumber.includes('LEVEL 4'),
        `.level-intro-number shows "LEVEL 4" (got: "${levelNumber?.trim()}")`,
      );

      const subtitle = await page.textContent('.level-intro-subtitle').catch(() => null);
      assert(
        subtitle && subtitle.includes('Shards'),
        `.level-intro-subtitle shows "Shards" (got: "${subtitle?.trim()}")`,
      );

      const namesText = await page.textContent('.level-intro-names').catch(() => null);
      const shardNames = ['Bant', 'Esper', 'Grixis', 'Jund', 'Naya'];
      for (const name of shardNames) {
        assert(
          namesText && namesText.includes(name),
          `.level-intro-names includes "${name}"`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Spacebar dismissal
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Spacebar dismissal ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Confirm intro is showing
      const introVisible = await page.isVisible('.level-intro');
      assert(introVisible, '.level-intro is visible before spacebar press');

      // Press Space to dismiss
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);

      const introGone = !(await page.isVisible('.level-intro'));
      assert(introGone, '.level-intro disappears after pressing Space');

      const cardVisible = await page.isVisible('.card').catch(() => false);
      assert(cardVisible, '.card appears after spacebar dismissal');

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
    console.error(`\nArc 44 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 44 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
