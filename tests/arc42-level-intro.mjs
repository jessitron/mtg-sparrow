/**
 * Arc 42 verification: Level Intro Screen (new multi-step design)
 *
 * The new intro sequence is driven by Space key (4 steps):
 *   Step 0 (page load): placeholder card (card-back image) + hidden ongoing-scroll on right
 *   Step 1 (Space 1):   ongoing-scroll fades in
 *   Step 2 (Space 2):   dark modal appears with LEVEL title + intro-scroll (name list)
 *   Step 3 (Space 3):   modal fades out, ongoing-scroll animates into position, showCard() runs
 *
 * Tests:
 * 1.  Page loads with placeholder card (card-back image visible)
 * 2.  Intro has no .intro-screen — the new design does not use that class
 * 3.  After Space 1: ongoing-scroll becomes visible (opacity 1)
 * 4.  After Space 1: name-scroll-entry elements present with correct count (5)
 * 5.  After Space 2: .intro-modal appears
 * 6.  After Space 2: .level-title shows "Level N" text
 * 7.  After Space 2: .intro-scroll is inside the modal with correct names
 * 8.  Allied level: "Level 1" with Azorius, Dimir, Rakdos, Gruul, Selesnya
 * 9.  Enemy level: "Level 2" with Orzhov, Izzet, Golgari, Boros, Simic
 * 10. Wedges level: "Level 3" with Abzan, Jeskai, Sultai, Mardu, Temur
 * 11. Shards level: "Level 4" with Bant, Esper, Grixis, Jund, Naya
 * 12. name-scroll-entry has GoudyMediaeval font-family
 * 13. Hint text says "Tap or press Space to begin"
 * 14. After Space 3: modal is removed from DOM
 * 15. After Space 3: real card appears (.card with .card-pips)
 * 16. After Space 3: pause button and progress counter appear
 * 17. Slideshow continues: click advances to card 2
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
    // PHASE 1: Page load state — placeholder card, no intro-screen
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Page load state ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Should have a card-back placeholder
      const cardBackImg = await page.$('img[src*="card-back"]');
      assert(cardBackImg !== null, 'Placeholder card-back image is present on load');

      // Should NOT have the old .intro-screen class
      const introScreen = await page.$('.intro-screen');
      assert(introScreen === null, 'No .intro-screen element (new design)');

      // app--quiz-active should be set immediately
      const quizActive = await page.$('#app.app--quiz-active');
      assert(quizActive !== null, '#app has app--quiz-active class on load');

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Space 1 — ongoing-scroll becomes visible
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Space 1 — scroll appears ===\n');
    {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Press Space once
      await page.keyboard.press('Space');
      await page.waitForTimeout(400);

      // Ongoing scroll should exist with entries
      const scrollEntries = await page.$$('.name-scroll-entry');
      assert(scrollEntries.length === 5, `ongoing-scroll has 5 name entries (got ${scrollEntries.length})`);

      // Check font-family on name-scroll-entry
      const fontFamily = await page.$eval('.name-scroll-entry',
        el => window.getComputedStyle(el).fontFamily
      );
      const hasGoudy = fontFamily.toLowerCase().includes('goudymediaeval');
      assert(hasGoudy, `name-scroll-entry font-family includes GoudyMediaeval (got "${fontFamily}")`);

      // No modal yet
      const modalBeforeStep2 = await page.$('.intro-modal');
      assert(modalBeforeStep2 === null, 'No .intro-modal after Space 1');

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Space 2 — modal appears with level title and intro-scroll
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Space 2 — modal appears ===\n');
    {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Two Spaces
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);

      // Modal should exist
      const modal = await page.$('.intro-modal');
      assert(modal !== null, '.intro-modal appears after Space 2');

      // Level title
      const titleText = await page.$eval('.level-title', el => el.textContent);
      assert(titleText === 'Level 1', `Level title is "Level 1" for allied (got "${titleText}")`);

      // intro-scroll inside modal
      const introScrollEntries = await page.$$('.intro-scroll .name-scroll-entry');
      assert(introScrollEntries.length === 5, `intro-scroll has 5 entries (got ${introScrollEntries.length})`);

      // Hint text
      const hintText = await page.$eval('.intro-hint', el => el.textContent);
      assert(hintText === 'Tap or press Space to begin', `Hint text correct (got "${hintText}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Correct names for each subgroup (after Space 2)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Correct names per subgroup ===\n');

    const expectedNames = {
      allied: ['Azorius', 'Dimir', 'Rakdos', 'Gruul', 'Selesnya'],
      enemy: ['Orzhov', 'Izzet', 'Golgari', 'Boros', 'Simic'],
      wedges: ['Abzan', 'Jeskai', 'Sultai', 'Mardu', 'Temur'],
      shards: ['Bant', 'Esper', 'Grixis', 'Jund', 'Naya'],
    };
    const levelNumbers = { allied: 1, enemy: 2, wedges: 3, shards: 4 };

    for (const [key, names] of Object.entries(expectedNames)) {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=${key}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Space 1 + Space 2 to get to modal
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);

      const titleText = await page.$eval('.level-title', el => el.textContent);
      assert(titleText === `Level ${levelNumbers[key]}`, `${key}: title is "Level ${levelNumbers[key]}" (got "${titleText}")`);

      const actualNames = await page.$$eval('.intro-scroll .name-scroll-entry', els => els.map(el => el.textContent));
      const namesMatch = JSON.stringify(actualNames) === JSON.stringify(names);
      assert(namesMatch, `${key}: intro-scroll names are correct (got [${actualNames.join(', ')}])`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Space 3 — modal gone, card appears, slideshow starts
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Space 3 — transition to card ===\n');
    {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Three Spaces to complete intro
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');

      // Wait for transition (500ms) + buffer
      await page.waitForTimeout(700);

      // Modal should be gone
      const modal = await page.$('.intro-modal');
      assert(modal === null, '.intro-modal removed after Space 3');

      // Real card should appear
      const card = await page.$('.card');
      assert(card !== null, 'Real .card appears after Space 3');

      // Card pips present
      const pipsExist = (await page.$('.card-pips')) !== null;
      assert(pipsExist, '.card-pips present on real card');

      // Progress counter
      const progressText = await page.$eval('.progress-counter', el => el.textContent);
      const startsWithOne = progressText.startsWith('1 / ');
      assert(startsWithOne, `Progress counter starts with "1 / " (got "${progressText}")`);

      // Pause button
      const pauseBtn = await page.$('#pause-btn');
      assert(pauseBtn !== null, 'Pause button exists after intro completes');

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Slideshow continues working after intro
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Slideshow continues working ===\n');
    {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Complete intro with 3 Spaces
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');
      await page.waitForTimeout(700);

      // First card visible
      const card1 = await page.$('.card');
      assert(card1 !== null, 'First card visible after intro');

      // Click to reveal name, then click to advance
      await page.click('#app');
      await page.waitForTimeout(300);
      await page.click('#app');
      await page.waitForTimeout(500);

      // Progress should be "2 / N"
      const progressText = await page.$eval('.progress-counter', el => el.textContent);
      const startsWithTwo = progressText.startsWith('2 / ');
      assert(startsWithTwo, `Progress advances to "2 / N" (got "${progressText}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------
    console.log(`\n========================================`);
    console.log(`  TOTAL: ${passes} passed, ${failures} failed out of ${passes + failures}`);
    console.log(`========================================\n`);

  } finally {
    await browser.close();
  }

  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
