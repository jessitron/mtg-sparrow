/**
 * Arc 11 verification: Card Images on Slides
 *
 * Tests that allied guild slides show a Scryfall card image on the left,
 * and that enemy guild slides continue to work as before (no image).
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

async function run() {
  console.log('=== Arc 11: Card Images on Slides ===\n');

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  try {
    // =========================================================
    // Phase 1: Allied guild session — card image appears on slide
    // =========================================================
    console.log('\n--- Phase 1: Allied guild session — card image visible before reveal ---\n');

    const page = await context.newPage();
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // Clear progression so we can start fresh
    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Click the start button to begin allied session
    await page.waitForSelector('#start-button', { timeout: 5000 });
    await page.click('#start-button');

    // Wait for the card to appear
    await page.waitForSelector('.card', { timeout: 8000 });

    // Check: card has .card--with-image class (two-column layout)
    const cardHasImageClass = await page.$('.card.card--with-image');
    assert(cardHasImageClass !== null, 'Allied guild card has .card--with-image class');

    // Check: card image column exists
    const imgColumn = await page.$('.card-image-column');
    assert(imgColumn !== null, '.card-image-column is present');

    // Check: quiz column exists
    const quizColumn = await page.$('.card-quiz-column');
    assert(quizColumn !== null, '.card-quiz-column is present');

    // Check: the img element with class .mtg-card-img is present
    const mtgImg = await page.$('.mtg-card-img');
    assert(mtgImg !== null, '.mtg-card-img element is present on allied guild slide');

    // Check: the src is a Scryfall URL
    const imgSrc = mtgImg ? await mtgImg.getAttribute('src') : '';
    assert(
      imgSrc && imgSrc.includes('cards.scryfall.io'),
      `Card image src is from cards.scryfall.io (got: ${imgSrc ? imgSrc.substring(0, 60) + '...' : 'null'})`
    );

    // Check: img has empty alt (card name not exposed as text)
    const imgAlt = mtgImg ? await mtgImg.getAttribute('alt') : 'not-empty';
    assert(imgAlt === '', `Card image alt is empty (got: "${imgAlt}")`);

    // Check: guild name is hidden (card-name-hidden class present)
    const nameHidden = await page.$('.card-name.card-name-hidden');
    assert(nameHidden !== null, 'Guild name is initially hidden (.card-name-hidden present)');

    await page.screenshot({ path: 'tests/arc11-before-reveal.png', fullPage: false });
    console.log('  Screenshot: tests/arc11-before-reveal.png');

    // =========================================================
    // Phase 2: Card image still visible after name reveal
    // =========================================================
    console.log('\n--- Phase 2: Card image still visible after name reveal ---\n');

    // Tap the card to reveal the name early
    await page.click('#app');
    // Wait a moment for reveal animation
    await page.waitForTimeout(300);

    // Check: guild name is now revealed (card-name-hidden class removed)
    const nameRevealed = await page.$('.card-name:not(.card-name-hidden)');
    assert(nameRevealed !== null, 'Guild name is revealed after tap (.card-name-hidden removed)');

    // Check: card image is still visible after reveal
    const imgAfterReveal = await page.$('.mtg-card-img');
    assert(imgAfterReveal !== null, '.mtg-card-img is still visible after name reveal');

    // Check: src is still a Scryfall URL after reveal
    const imgSrcAfterReveal = imgAfterReveal ? await imgAfterReveal.getAttribute('src') : '';
    assert(
      imgSrcAfterReveal && imgSrcAfterReveal.includes('cards.scryfall.io'),
      'Card image src still points to cards.scryfall.io after reveal'
    );

    await page.screenshot({ path: 'tests/arc11-after-reveal.png', fullPage: false });
    console.log('  Screenshot: tests/arc11-after-reveal.png');

    // =========================================================
    // Phase 3: Enemy guild session — no card image, original layout
    // =========================================================
    console.log('\n--- Phase 3: Enemy guild session — no card image, original layout ---\n');

    // Set up progression so enemy guild button is visible
    // (allied completed unlocks enemy button)
    await page.evaluate(() => {
      localStorage.setItem('sparrow-deck.progression', JSON.stringify({
        unlockedSubgroups: ['allied'],
        completedSubgroups: ['allied'],
      }));
    });

    // Navigate to end screen, find enemy guild button and click it
    await page.goto(`${BASE_URL}/?screen=end`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.guild-column--enemy .guild-column-button', { timeout: 8000 });

    const enemyBtn = await page.$('.guild-column--enemy .guild-column-button');
    assert(enemyBtn !== null, 'Enemy guild button is present on end screen');
    if (enemyBtn) {
      await enemyBtn.click();
    }

    // Wait for card
    await page.waitForSelector('.card', { timeout: 8000 });

    // Check: no .card--with-image (enemy guilds have no cards data)
    const enemyCardHasImageClass = await page.$('.card.card--with-image');
    assert(enemyCardHasImageClass === null, 'Enemy guild card does NOT have .card--with-image class');

    // Check: no .mtg-card-img
    const enemyMtgImg = await page.$('.mtg-card-img');
    assert(enemyMtgImg === null, 'Enemy guild slide has no .mtg-card-img element');

    // Check: no .card-image-column
    const enemyImgColumn = await page.$('.card-image-column');
    assert(enemyImgColumn === null, 'Enemy guild slide has no .card-image-column');

    // Check: card-name-hidden still works (original layout still functional)
    const enemyNameHidden = await page.$('.card-name.card-name-hidden');
    assert(enemyNameHidden !== null, 'Enemy guild slide has guild name initially hidden');

    await page.screenshot({ path: 'tests/arc11-enemy-guild.png', fullPage: false });
    console.log('  Screenshot: tests/arc11-enemy-guild.png');

    // =========================================================
    // Phase 4: Multiple allied slides all have card images
    // =========================================================
    console.log('\n--- Phase 4: Multiple allied slides — consistent card images ---\n');

    // Go back to a fresh allied session
    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#start-button', { timeout: 5000 });
    await page.click('#start-button');

    // Check 3 consecutive cards all have images
    for (let i = 1; i <= 3; i++) {
      await page.waitForSelector('.card', { timeout: 8000 });

      const cardImg = await page.$('.mtg-card-img');
      const src = cardImg ? await cardImg.getAttribute('src') : null;
      assert(
        src && src.includes('cards.scryfall.io'),
        `Slide ${i}: card image present with Scryfall src`
      );

      // Advance to next card (tap twice: once to reveal, once to advance if needed)
      await page.click('#app');
      await page.waitForTimeout(200);
      await page.click('#app');
      // Wait for transition to next card (advance delay + some buffer)
      await page.waitForTimeout(600);
    }

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
