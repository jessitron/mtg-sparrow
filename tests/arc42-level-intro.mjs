/**
 * Arc 42 verification: Level Intro Screen
 *
 * Tests:
 * 1.  Allied intro screen: "Level 1" title appears with 5 guild names
 * 2.  Enemy intro screen: "Level 2" title appears with 5 guild names
 * 3.  Wedges intro screen: "Level 3" title appears with 5 wedge names
 * 4.  Shards intro screen: "Level 4" title appears with 5 shard names
 * 5.  Allied names are correct (Azorius, Dimir, Rakdos, Gruul, Selesnya)
 * 6.  Enemy names are correct (Orzhov, Izzet, Golgari, Boros, Simic)
 * 7.  Wedge names are correct (Abzan, Jeskai, Sultai, Mardu, Temur)
 * 8.  Shard names are correct (Bant, Esper, Grixis, Jund, Naya)
 * 9.  name-scroll-entry has GoudyMediaeval font-family
 * 10. Hint text says "Tap or press Space to begin"
 * 11. Click triggers transition: title fades, scroll slides
 * 12. After click transition, card appears (slideshow starts)
 * 13. Space key triggers transition
 * 14. After transition, pause button and progress counter appear
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
    // PHASE 1: Intro screen appears for each subgroup with correct level number
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Level titles and name counts ===\n');

    const subgroups = [
      { key: 'allied', level: 1 },
      { key: 'enemy', level: 2 },
      { key: 'wedges', level: 3 },
      { key: 'shards', level: 4 },
    ];

    for (const { key, level } of subgroups) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=${key}`);
      await page.waitForSelector('.intro-screen', { timeout: 5000 });

      const titleText = await page.$eval('.level-title', el => el.textContent);
      assert(titleText === `Level ${level}`, `${key}: title is "Level ${level}" (got "${titleText}")`);

      const nameCount = await page.$$eval('.name-scroll-entry', els => els.length);
      assert(nameCount === 5, `${key}: has 5 name entries (got ${nameCount})`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Correct names for each subgroup
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Correct names per subgroup ===\n');

    const expectedNames = {
      allied: ['Azorius', 'Dimir', 'Rakdos', 'Gruul', 'Selesnya'],
      enemy: ['Orzhov', 'Izzet', 'Golgari', 'Boros', 'Simic'],
      wedges: ['Abzan', 'Jeskai', 'Sultai', 'Mardu', 'Temur'],
      shards: ['Bant', 'Esper', 'Grixis', 'Jund', 'Naya'],
    };

    for (const [key, names] of Object.entries(expectedNames)) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=${key}`);
      await page.waitForSelector('.intro-screen', { timeout: 5000 });

      const actualNames = await page.$$eval('.name-scroll-entry', els => els.map(el => el.textContent));
      const namesMatch = JSON.stringify(actualNames) === JSON.stringify(names);
      assert(namesMatch, `${key}: names are ${names.join(', ')} (got ${actualNames.join(', ')})`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Font and hint text
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Font and hint text ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForSelector('.intro-screen', { timeout: 5000 });

      // Check computed font-family on name-scroll-entry
      const fontFamily = await page.$eval('.name-scroll-entry',
        el => window.getComputedStyle(el).fontFamily
      );
      const hasGoudy = fontFamily.toLowerCase().includes('goudymediaeval');
      assert(hasGoudy, `name-scroll-entry font-family includes GoudyMediaeval (got "${fontFamily}")`);

      // Check hint text
      const hintText = await page.$eval('.intro-hint', el => el.textContent);
      assert(hintText === 'Tap or press Space to begin', `Hint text is correct (got "${hintText}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Click triggers transition, then card appears
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Click transition ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForSelector('.intro-screen', { timeout: 5000 });

      // Click the intro screen
      await page.click('.intro-screen');

      // Title should get fading class
      const hasFadingClass = await page.$eval('.level-title', el =>
        el.classList.contains('level-title--fading')
      );
      assert(hasFadingClass, 'Click adds level-title--fading class');

      // Scroll should get sliding class
      const hasSlidingClass = await page.$eval('.name-scroll', el =>
        el.classList.contains('name-scroll--sliding')
      );
      assert(hasSlidingClass, 'Click adds name-scroll--sliding class');

      // Wait for transition (500ms in code) + a bit extra
      await page.waitForTimeout(700);

      // Card should now be visible
      const cardExists = await page.$('.card');
      assert(cardExists !== null, 'Card appears after click transition');

      // Progress counter should show "1 / N" (N = total cards in session, typically 25 for 5 combos x 5 cards)
      const progressText = await page.$eval('.progress-counter', el => el.textContent);
      const startsWithOne = progressText.startsWith('1 / ');
      assert(startsWithOne, `Progress counter starts with "1 / " (got "${progressText}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Space key triggers transition
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Space key transition ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=enemy`);
      await page.waitForSelector('.intro-screen', { timeout: 5000 });

      // Press space
      await page.keyboard.press('Space');

      // Title should get fading class
      const hasFadingClass = await page.$eval('.level-title', el =>
        el.classList.contains('level-title--fading')
      );
      assert(hasFadingClass, 'Space adds level-title--fading class');

      // Wait for transition
      await page.waitForTimeout(700);

      // Card should now be visible
      const cardExists = await page.$('.card');
      assert(cardExists !== null, 'Card appears after space transition');

      // Pause button should exist
      const pauseBtn = await page.$('#pause-btn');
      assert(pauseBtn !== null, 'Pause button exists after transition');

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Slideshow continues after intro
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Slideshow continues working ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForSelector('.intro-screen', { timeout: 5000 });

      // Click to dismiss intro
      await page.click('.intro-screen');
      await page.waitForTimeout(700);

      // First card should be showing
      const card1 = await page.$('.card');
      assert(card1 !== null, 'First card visible after intro');

      // Click to advance (reveals name early)
      await page.click('#app');
      await page.waitForTimeout(100);

      // Click again to advance to next card
      await page.click('#app');
      await page.waitForTimeout(500);

      // Progress should now show "2 / N"
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
