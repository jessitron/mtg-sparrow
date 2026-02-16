import { chromium } from 'playwright';

const TOTAL_CARDS = 50;

let failures = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    console.error(`FAIL: ${message}`);
    failures++;
  }
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('=== Arc 2b Verification: Cycle Through a Deck ===\n');
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.card', { timeout: 5000 });

  // 1. Version check
  const footerText = await page.textContent('#app-version');
  assert(footerText === 'v0.3.0', `Footer shows v0.3.0 (got "${footerText}")`);

  // 2. First card renders with hidden name (auto-reveal not yet fired)
  const nameHidden = await page.$eval('.card-name', el =>
    el.classList.contains('card-name-hidden')
  );
  assert(nameHidden, 'Card name starts hidden (opacity 0, waiting for auto-reveal)');

  // 3. Progress counter shows "Card 1 / 50"
  const progressText = await page.textContent('.progress-counter');
  assert(
    progressText === `Card 1 / ${TOTAL_CARDS}`,
    `Progress counter shows "Card 1 / ${TOTAL_CARDS}" (got "${progressText}")`
  );

  // 4. Wait for auto-reveal (~2.5s)
  console.log('\nWaiting 2.7s for auto-reveal...');
  await page.waitForTimeout(2700);

  const nameVisible = await page.$eval('.card-name', el =>
    !el.classList.contains('card-name-hidden')
  );
  assert(nameVisible, 'Card name becomes visible after ~2.5s reveal delay');

  const firstCardName = await page.textContent('.card-name');
  console.log(`  First card: "${firstCardName}"`);

  // 5. Wait for auto-advance (~1s more) and verify card 2 appears
  console.log('Waiting 1.2s for auto-advance...');
  await page.waitForTimeout(1200);

  const progress2 = await page.textContent('.progress-counter');
  assert(
    progress2 === `Card 2 / ${TOTAL_CARDS}`,
    `Auto-advance works: progress shows "Card 2 / ${TOTAL_CARDS}" (got "${progress2}")`
  );

  // 6. Test early advance via click
  const nameBeforeClick = await page.$eval('.card-name', el =>
    el.classList.contains('card-name-hidden')
  );
  assert(nameBeforeClick, 'Card 2 name starts hidden');

  await page.click('#app');
  await page.waitForTimeout(100);

  const progress3 = await page.textContent('.progress-counter');
  assert(
    progress3 === `Card 3 / ${TOTAL_CARDS}`,
    `Click advances early: progress shows "Card 3 / ${TOTAL_CARDS}" (got "${progress3}")`
  );

  // 7. Test early advance via spacebar
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const progress4 = await page.textContent('.progress-counter');
  assert(
    progress4 === `Card 4 / ${TOTAL_CARDS}`,
    `Spacebar advances early: progress shows "Card 4 / ${TOTAL_CARDS}" (got "${progress4}")`
  );

  // 8. Click through remaining cards quickly to reach session end
  console.log(`\nClicking through remaining cards...`);
  const seenNames = new Set();

  for (let i = 4; i <= TOTAL_CARDS; i++) {
    const cardName = await page.$('.card-name');
    if (!cardName) break; // session ended
    const name = await cardName.textContent();
    seenNames.add(name);
    await page.click('#app');
    await page.waitForTimeout(80);
  }

  // 9. Verify session end screen
  await page.waitForSelector('.session-end', { timeout: 5000 });
  const endScreen = await page.$('.session-end');
  assert(endScreen !== null, 'Session end screen appears after all cards shown');

  const endCount = await page.textContent('.session-end-count');
  assert(
    endCount === `${TOTAL_CARDS} cards`,
    `Session end shows "${TOTAL_CARDS} cards" (got "${endCount}")`
  );

  const endLabel = await page.textContent('.session-end-label');
  assert(
    endLabel === 'Session complete',
    `Session end shows "Session complete" (got "${endLabel}")`
  );

  // 10. Verify all 10 guilds appeared in the session
  console.log(`\nUnique guilds seen: ${seenNames.size} - ${[...seenNames].join(', ')}`);
  assert(seenNames.size === 10, `All 10 guilds appeared in ${TOTAL_CARDS}-card session (saw ${seenNames.size})`);

  // 11. Click on session end screen should not advance (session is complete)
  await page.click('#app');
  await page.waitForTimeout(100);
  const stillEnd = await page.$('.session-end');
  assert(stillEnd !== null, 'Clicking after session end does not restart or advance');

  // Take screenshot of session end
  await page.screenshot({ path: 'scripts/arc2b-screenshot-end.png', fullPage: true });
  console.log('\nScreenshot saved to scripts/arc2b-screenshot-end.png');

  // 12. Wait for Honeycomb SDK to flush spans
  console.log('\nWaiting 12s for Honeycomb SDK span flush...');
  await page.waitForTimeout(12000);

  await browser.close();

  console.log(`\n=== ${failures === 0 ? 'ALL TESTS PASSED' : `${failures} TEST(S) FAILED`} ===`);
  if (failures > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
