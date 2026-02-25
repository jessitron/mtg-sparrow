import { chromium } from 'playwright';

const TOTAL_CARDS = 50;

const ALLIED_GUILDS = ['Azorius', 'Dimir', 'Rakdos', 'Gruul', 'Selesnya'];
const ENEMY_GUILDS = ['Orzhov', 'Izzet', 'Golgari', 'Boros', 'Simic'];

let failures = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    console.error(`FAIL: ${message}`);
    failures++;
  }
}

/**
 * Wait for auto-reveal (name becomes visible) and auto-advance (next card).
 * Returns the card name that was shown, if collectible.
 */
async function waitForRevealAndAdvance(page, expectedCardNum) {
  // Wait for name to reveal
  try {
    await page.waitForFunction(
      () => {
        const name = document.querySelector('.card-name');
        return name && !name.classList.contains('card-name-hidden');
      },
      { timeout: 3500 }
    );
  } catch {
    assert(false, `Card ${expectedCardNum} name auto-reveals (timed out)`);
    return null;
  }

  // Capture the name while visible
  const cardName = await page.textContent('.card-name');

  // Wait for auto-advance
  await page.waitForTimeout(1700);
  return cardName;
}

async function collectCardsFromSession(page, count) {
  const names = [];
  for (let i = 0; i < count; i++) {
    const name = await waitForRevealAndAdvance(page, i + 1);
    if (name) names.push(name.trim());
  }
  return names;
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('=== v0.7.0 Verification ===\n');
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);

  // --- 1. Welcome screen loads ---
  const welcomeEl = await page.$('.welcome');
  assert(welcomeEl !== null, 'Welcome screen appears on load (.welcome element present)');

  const cardEl = await page.$('.card');
  assert(cardEl === null, 'No card session shown on load (.card element absent)');

  // --- 2. Version footer shows v0.7.0 ---
  const footerText = await page.textContent('#app-version');
  assert(footerText && footerText.includes('v0.7.0'), `Footer shows v0.7.0 (got "${footerText}")`);

  // --- 3. "Learn guild names" button present ---
  const welcomeBtn = await page.$('.welcome-button');
  assert(welcomeBtn !== null, '"Learn guild names" button present (.welcome-button)');
  const btnText = await welcomeBtn.textContent();
  assert(btnText === 'Learn guild names', `Button text is "Learn guild names" (got "${btnText}")`);

  // --- 4. Click "Learn guild names" — starts allied session (default) ---
  console.log('\nClicking "Learn guild names" to start allied session...');
  await welcomeBtn.click();
  await page.waitForSelector('.card', { timeout: 5000 });

  const cardAfterBtn = await page.$('.card');
  assert(cardAfterBtn !== null, 'Card session starts after clicking "Learn guild names"');

  const welcomeGone = await page.$('.welcome');
  assert(welcomeGone === null, 'Welcome screen disappears after starting session');

  // --- 5. Progress counter starts at Card 1 / 50 ---
  const progressText = await page.textContent('.progress-counter');
  assert(
    progressText === `Card 1 / ${TOTAL_CARDS}`,
    `Progress counter shows "Card 1 / ${TOTAL_CARDS}" (got "${progressText}")`
  );

  // --- 6. Collect a few card names — should all be allied guilds ---
  console.log('\nCollecting 4 card names to verify allied guild pool...');
  const collectedNames = await collectCardsFromSession(page, 4);
  console.log(`  Cards seen: ${collectedNames.join(', ')}`);

  const allAllied = collectedNames.every(name => ALLIED_GUILDS.includes(name));
  const anyEnemy = collectedNames.some(name => ENEMY_GUILDS.includes(name));
  assert(allAllied, `All 4 cards are allied guilds (got: ${collectedNames.join(', ')})`);
  assert(!anyEnemy, `No enemy guilds appear in allied session (got: ${collectedNames.join(', ')})`);

  // --- 7. Stop session ---
  console.log('\nStopping allied session...');
  const allButtons = await page.$$('.control-button');
  const stopBtn = allButtons[1];
  await stopBtn.click();
  await page.waitForSelector('.session-end', { timeout: 3000 });

  const endLabel = await page.textContent('.session-end-label');
  assert(endLabel === 'Session stopped', `Session end shows "Session stopped" (got "${endLabel}")`);

  // --- 8. Self-assessment prompt ---
  const assessmentPrompt = await page.$('.self-assessment-prompt');
  assert(assessmentPrompt !== null, 'Self-assessment prompt appears on session end');
  const promptText = await assessmentPrompt.textContent();
  assert(promptText === 'How did that feel?', `Assessment prompt is "How did that feel?" (got "${promptText}")`);

  // --- 9. Click assessment option ---
  const assessmentButtons = await page.$$('.self-assessment-button');
  assert(assessmentButtons.length > 0, 'Self-assessment buttons are present');
  await assessmentButtons[1].click();
  await page.waitForTimeout(500);

  const assessmentGone = await page.$('.self-assessment');
  assert(assessmentGone === null, 'Self-assessment UI removed after selection');

  // --- 10. Combo summary shows only allied guilds ---
  const comboSummary = await page.$('.combo-summary');
  assert(comboSummary !== null, 'Combo summary appears after assessment');

  const summaryItems = await page.$$('.combo-summary-name');
  const summaryNames = await Promise.all(summaryItems.map(el => el.textContent()));
  console.log(`  Combo summary shows: ${summaryNames.join(', ')}`);

  const onlyAlliedInSummary = summaryNames.every(name => ALLIED_GUILDS.includes(name.trim()));
  const noEnemyInSummary = !summaryNames.some(name => ENEMY_GUILDS.includes(name.trim()));
  assert(onlyAlliedInSummary, `Combo summary contains only allied guilds (got: ${summaryNames.join(', ')})`);
  assert(noEnemyInSummary, `Combo summary has no enemy guilds`);

  // --- 11. "You practiced allied guilds." label present ---
  await page.waitForTimeout(300);
  const nextLabel = await page.$('.session-next-label');
  assert(nextLabel !== null, '.session-next-label element present');
  const nextLabelText = await nextLabel.textContent();
  assert(
    nextLabelText === 'You practiced allied guilds.',
    `Label is "You practiced allied guilds." (got "${nextLabelText}")`
  );

  // --- 12. Next-session buttons: "Enemy guilds" (primary) and "Allied guilds" (second) ---
  const nextBtns = await page.$$('.next-session-button');
  assert(nextBtns.length === 2, `Two next-session buttons present (got ${nextBtns.length})`);

  const nextBtnTexts = await Promise.all(nextBtns.map(b => b.textContent()));
  assert(
    nextBtnTexts[0] === 'Enemy guilds',
    `First next-session button is "Enemy guilds" (primary) (got "${nextBtnTexts[0]}")`
  );
  assert(
    nextBtnTexts[1] === 'Allied guilds',
    `Second next-session button is "Allied guilds" (got "${nextBtnTexts[1]}")`
  );

  const primaryBtn = await page.$('.next-session-button--primary');
  assert(primaryBtn !== null, 'Primary next-session button has class next-session-button--primary');
  const primaryText = await primaryBtn.textContent();
  assert(primaryText === 'Enemy guilds', `Primary button is "Enemy guilds" (got "${primaryText}")`);

  // Take screenshot of allied session end
  await page.screenshot({ path: 'scripts/v0.7.0-screenshot-allied-end.png', fullPage: true });
  console.log('\nScreenshot saved to scripts/v0.7.0-screenshot-allied-end.png');

  // --- 13. Click "Enemy guilds" — starts enemy session ---
  console.log('\nClicking "Enemy guilds" to start enemy session...');
  await nextBtns[0].click();
  await page.waitForSelector('.card', { timeout: 5000 });

  const cardInEnemySession = await page.$('.card');
  assert(cardInEnemySession !== null, 'Card session starts after clicking "Enemy guilds"');

  // --- 14. Collect a few cards — should be enemy guilds ---
  console.log('\nCollecting 4 card names to verify enemy guild pool...');
  const enemyNames = await collectCardsFromSession(page, 4);
  console.log(`  Cards seen: ${enemyNames.join(', ')}`);

  const allEnemy = enemyNames.every(name => ENEMY_GUILDS.includes(name));
  const anyAllied = enemyNames.some(name => ALLIED_GUILDS.includes(name));
  assert(allEnemy, `All 4 cards are enemy guilds (got: ${enemyNames.join(', ')})`);
  assert(!anyAllied, `No allied guilds appear in enemy session (got: ${enemyNames.join(', ')})`);

  // --- 15. Stop enemy session ---
  console.log('\nStopping enemy session...');
  const enemyButtons = await page.$$('.control-button');
  const enemyStopBtn = enemyButtons[1];
  await enemyStopBtn.click();
  await page.waitForSelector('.session-end', { timeout: 3000 });

  // --- 16. Click assessment for enemy session ---
  const enemyAssessmentBtns = await page.$$('.self-assessment-button');
  assert(enemyAssessmentBtns.length > 0, 'Self-assessment buttons present on enemy session end');
  await enemyAssessmentBtns[0].click();
  await page.waitForTimeout(500);

  // --- 17. "You practiced enemy guilds." label present ---
  const enemyNextLabel = await page.$('.session-next-label');
  assert(enemyNextLabel !== null, '.session-next-label element present on enemy session end');
  const enemyNextLabelText = await enemyNextLabel.textContent();
  assert(
    enemyNextLabelText === 'You practiced enemy guilds.',
    `Label is "You practiced enemy guilds." (got "${enemyNextLabelText}")`
  );

  // --- 18. Buttons swapped: "Allied guilds" (primary) and "Enemy guilds" (second) ---
  const enemyNextBtns = await page.$$('.next-session-button');
  assert(enemyNextBtns.length === 2, `Two next-session buttons on enemy session end (got ${enemyNextBtns.length})`);

  const enemyNextBtnTexts = await Promise.all(enemyNextBtns.map(b => b.textContent()));
  assert(
    enemyNextBtnTexts[0] === 'Allied guilds',
    `First button on enemy session end is "Allied guilds" (primary) (got "${enemyNextBtnTexts[0]}")`
  );
  assert(
    enemyNextBtnTexts[1] === 'Enemy guilds',
    `Second button on enemy session end is "Enemy guilds" (got "${enemyNextBtnTexts[1]}")`
  );

  const enemyPrimaryBtn = await page.$('.next-session-button--primary');
  assert(enemyPrimaryBtn !== null, 'Primary next-session button present on enemy session end');
  const enemyPrimaryText = await enemyPrimaryBtn.textContent();
  assert(
    enemyPrimaryText === 'Allied guilds',
    `Primary button on enemy session end is "Allied guilds" (got "${enemyPrimaryText}")`
  );

  // --- 19. Combo summary shows only enemy guilds ---
  const enemyComboItems = await page.$$('.combo-summary-name');
  const enemyComboNames = await Promise.all(enemyComboItems.map(el => el.textContent()));
  console.log(`  Enemy combo summary shows: ${enemyComboNames.join(', ')}`);

  const onlyEnemyInSummary = enemyComboNames.every(name => ENEMY_GUILDS.includes(name.trim()));
  assert(onlyEnemyInSummary, `Combo summary contains only enemy guilds (got: ${enemyComboNames.join(', ')})`);

  // Take screenshot of enemy session end
  await page.screenshot({ path: 'scripts/v0.7.0-screenshot-enemy-end.png', fullPage: true });
  console.log('\nScreenshot saved to scripts/v0.7.0-screenshot-enemy-end.png');

  // --- 20. Reload page — welcome screen reappears ---
  console.log('\nReloading to verify welcome screen on fresh load...');
  await page.reload();
  await page.waitForTimeout(500);

  const welcomeOnReload = await page.$('.welcome');
  assert(welcomeOnReload !== null, 'Welcome screen appears after page reload');

  const cardOnReload = await page.$('.card');
  assert(cardOnReload === null, 'No card session on reload (welcome screen shows first)');

  // Verify version still shows correctly after reload
  const footerOnReload = await page.textContent('#app-version');
  assert(
    footerOnReload && footerOnReload.includes('v0.7.0'),
    `Footer still shows v0.7.0 after reload (got "${footerOnReload}")`
  );

  // --- 21. Wait for Honeycomb spans to flush ---
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
