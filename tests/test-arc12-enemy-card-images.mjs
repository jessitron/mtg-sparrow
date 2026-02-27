/**
 * Arc 12 verification: Enemy Guild Card Images on Slides
 *
 * Tests that enemy guild slides now show a Scryfall card image in the
 * side-by-side layout, matching the Arc 11 behavior for allied guilds.
 *
 * Also confirms allied guild slides still work (regression check).
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';

let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passes++;
  } else {
    console.error(`  FAIL: ${message}`);
    failures++;
  }
}

async function navigateToEnemySession(page) {
  // Set progression so enemy guild button is visible (allied completed unlocks it)
  await page.evaluate(() => {
    localStorage.setItem('sparrow-deck.progression', JSON.stringify({
      unlockedSubgroups: ['allied'],
      completedSubgroups: ['allied'],
    }));
  });

  // Navigate to end screen and click the enemy guild button
  await page.goto(`${BASE_URL}/?screen=end`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.guild-column--enemy .guild-column-button', { timeout: 8000 });
  await page.click('.guild-column--enemy .guild-column-button');

  // Wait for card to appear
  await page.waitForSelector('.card', { timeout: 8000 });
}

async function run() {
  console.log('=== Arc 12: Enemy Guild Card Images ===\n');

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  try {
    // =========================================================
    // Phase 1: Enemy guild session — card image visible before reveal
    // =========================================================
    console.log('\n--- Phase 1: Enemy guild card image before reveal ---\n');

    const page = await context.newPage();
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // Clear any stale progression
    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await navigateToEnemySession(page);

    // Check: card has .card--with-image class (two-column layout)
    const cardHasImageClass = await page.$('.card.card--with-image');
    assert(cardHasImageClass !== null, 'Enemy guild card has .card--with-image class');

    // Check: card image column exists
    const imgColumn = await page.$('.card-image-column');
    assert(imgColumn !== null, '.card-image-column is present on enemy guild slide');

    // Check: quiz column exists
    const quizColumn = await page.$('.card-quiz-column');
    assert(quizColumn !== null, '.card-quiz-column is present on enemy guild slide');

    // Check: the img element with class .mtg-card-img is present
    const mtgImg = await page.$('.mtg-card-img');
    assert(mtgImg !== null, '.mtg-card-img element is present on enemy guild slide');

    // Check: the src is a Scryfall URL
    const imgSrc = mtgImg ? await mtgImg.getAttribute('src') : '';
    assert(
      imgSrc && imgSrc.includes('cards.scryfall.io'),
      `Enemy guild card image src is from cards.scryfall.io (got: ${imgSrc ? imgSrc.substring(0, 60) + '...' : 'null'})`
    );

    // Check: img has empty alt (card name not exposed as text)
    const imgAlt = mtgImg ? await mtgImg.getAttribute('alt') : 'not-empty';
    assert(imgAlt === '', `Enemy guild card image alt is empty (got: "${imgAlt}")`);

    // Check: guild name is hidden before reveal
    const nameHidden = await page.$('.card-name.card-name-hidden');
    assert(nameHidden !== null, 'Enemy guild name is initially hidden (.card-name-hidden present)');

    await page.screenshot({ path: 'tests/arc12-enemy-before-reveal.png', fullPage: false });
    console.log('  Screenshot: tests/arc12-enemy-before-reveal.png');

    // =========================================================
    // Phase 2: Card image still visible after name reveal
    // =========================================================
    console.log('\n--- Phase 2: Enemy guild card image persists after name reveal ---\n');

    // Tap to reveal the name
    await page.click('#app');
    await page.waitForTimeout(300);

    // Check: guild name is now revealed
    const nameRevealed = await page.$('.card-name:not(.card-name-hidden)');
    assert(nameRevealed !== null, 'Enemy guild name is revealed after tap (.card-name-hidden removed)');

    // Check: card image is still visible after reveal
    const imgAfterReveal = await page.$('.mtg-card-img');
    assert(imgAfterReveal !== null, '.mtg-card-img is still visible after name reveal on enemy guild');

    // Check: src is still a Scryfall URL after reveal
    const imgSrcAfterReveal = imgAfterReveal ? await imgAfterReveal.getAttribute('src') : '';
    assert(
      imgSrcAfterReveal && imgSrcAfterReveal.includes('cards.scryfall.io'),
      'Enemy guild card image src still points to cards.scryfall.io after reveal'
    );

    await page.screenshot({ path: 'tests/arc12-enemy-after-reveal.png', fullPage: false });
    console.log('  Screenshot: tests/arc12-enemy-after-reveal.png');

    // =========================================================
    // Phase 3: Multiple enemy guild slides all have card images
    // =========================================================
    console.log('\n--- Phase 3: Multiple consecutive enemy guild slides have images ---\n');

    // Start a fresh enemy session
    await page.evaluate(() => {
      localStorage.setItem('sparrow-deck.progression', JSON.stringify({
        unlockedSubgroups: ['allied'],
        completedSubgroups: ['allied'],
      }));
    });
    await page.goto(`${BASE_URL}/?screen=end`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.guild-column--enemy .guild-column-button', { timeout: 8000 });
    await page.click('.guild-column--enemy .guild-column-button');

    // Check 3 consecutive cards all have images
    for (let i = 1; i <= 3; i++) {
      await page.waitForSelector('.card', { timeout: 8000 });

      const cardImg = await page.$('.mtg-card-img');
      const src = cardImg ? await cardImg.getAttribute('src') : null;
      assert(
        src && src.includes('cards.scryfall.io'),
        `Enemy slide ${i}: card image present with Scryfall src`
      );

      // Advance to next card (tap twice: once to reveal, once to advance)
      await page.click('#app');
      await page.waitForTimeout(200);
      await page.click('#app');
      await page.waitForTimeout(600);
    }

    // =========================================================
    // Phase 4: Allied guild slides still work (regression check)
    // =========================================================
    console.log('\n--- Phase 4: Allied guild slides still have card images (regression) ---\n');

    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#start-button', { timeout: 5000 });
    await page.click('#start-button');
    await page.waitForSelector('.card', { timeout: 8000 });

    const alliedImgColumn = await page.$('.card-image-column');
    assert(alliedImgColumn !== null, 'Allied guild slide still has .card-image-column (no regression)');

    const alliedMtgImg = await page.$('.mtg-card-img');
    const alliedSrc = alliedMtgImg ? await alliedMtgImg.getAttribute('src') : null;
    assert(
      alliedSrc && alliedSrc.includes('cards.scryfall.io'),
      'Allied guild card image still from cards.scryfall.io (no regression)'
    );

    await page.screenshot({ path: 'tests/arc12-allied-regression.png', fullPage: false });
    console.log('  Screenshot: tests/arc12-allied-regression.png');

    await page.close();

  } finally {
    await browser.close();
  }

  const total = passes + failures;
  console.log(`\n=== ${failures === 0 ? 'ALL TESTS PASSED' : `${failures} TEST(S) FAILED`} ===`);
  console.log(`    ${passes}/${total} passed\n`);
  if (failures > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
