import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PORT = 8083;
const BASE_URL = `http://localhost:${PORT}`;

const ALLIED_GUILDS = ['Azorius', 'Dimir', 'Rakdos', 'Gruul', 'Selesnya'];
const ENEMY_GUILDS = ['Orzhov', 'Izzet', 'Golgari', 'Boros', 'Simic'];

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

function startServer() {
  const server = spawn('npx', ['http-server', '.', '-p', String(PORT), '-s', '--cors'], {
    cwd: '/Users/jessitron/code/jessitron/sparrow-deck',
    stdio: 'ignore',
  });
  return server;
}

/**
 * Click through cards quickly until we've seen at least `count` cards.
 * Advances by clicking on the app area.
 */
async function clickThroughCards(page, count) {
  const names = [];
  for (let i = 0; i < count; i++) {
    // Wait for a card to be present
    await page.waitForSelector('.card', { timeout: 5000 });

    // Capture name (may be hidden still)
    let cardName = null;

    // Click to reveal / advance
    await page.click('#app');
    await page.waitForTimeout(200);

    // Click again to advance if name was just revealed
    await page.click('#app');
    await page.waitForTimeout(400);

    // Try to get card name if visible
    try {
      cardName = await page.textContent('.card-name', { timeout: 500 });
    } catch {
      // card already advanced
    }
    if (cardName) names.push(cardName.trim());
  }
  return names;
}

async function run() {
  console.log('=== v0.8.0 Verification ===\n');

  const server = startServer();
  await new Promise(r => setTimeout(r, 1500)); // Give server time to start

  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    // =========================================================
    // PHASE 1: Fresh state — no localStorage
    // =========================================================
    console.log('\n--- Phase 1: Fresh state (no localStorage) ---\n');

    const page = await context.newPage();

    // Clear localStorage to ensure clean state
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
    await page.reload();
    await page.waitForTimeout(500);

    // 1. Welcome screen loads with v0.8.0 in footer
    const welcomeEl = await page.$('.welcome');
    assert(welcomeEl !== null, 'Welcome screen appears on load (.welcome element present)');

    const footerText = await page.textContent('#app-version');
    assert(footerText && footerText.includes('v0.8.0'), `Footer shows v0.8.0 (got "${footerText}")`);

    // 2. "Learn guild names" button present
    const startBtn = await page.$('#start-button');
    assert(startBtn !== null, '"Learn guild names" button present (#start-button)');
    const btnText = await startBtn.textContent();
    assert(btnText && btnText.trim() === 'Learn guild names', `Button text is "Learn guild names" (got "${btnText?.trim()}")`);

    // 3. Click button — session starts
    console.log('\n  Starting allied session...');
    await startBtn.click();
    await page.waitForSelector('.card', { timeout: 5000 });

    const cardEl = await page.$('.card');
    assert(cardEl !== null, 'Card session starts after clicking "Learn guild names"');

    const progressText = await page.textContent('.progress-counter');
    assert(progressText && progressText.startsWith('Card 1'), `Progress counter shows "Card 1 / ..." (got "${progressText}")`);

    // Click through 4 cards quickly
    console.log('\n  Clicking through 4 cards...');
    await clickThroughCards(page, 4);

    // 4. Click Stop button (should trigger self-assessment since >3 cards shown)
    console.log('\n  Clicking Stop...');
    // Wait for a card to be present before finding Stop
    await page.waitForSelector('.control-button', { timeout: 5000 });
    const allControlBtns = await page.$$('.control-button');
    // Stop is the last control button
    const stopBtn = allControlBtns[allControlBtns.length - 1];
    const stopBtnText = await stopBtn.textContent();
    assert(stopBtnText === 'Stop', `Last control button is "Stop" (got "${stopBtnText}")`);
    await stopBtn.click();

    // 5. Self-assessment appears
    await page.waitForSelector('.self-assessment', { timeout: 3000 });
    const assessmentPrompt = await page.$('.self-assessment-prompt');
    assert(assessmentPrompt !== null, 'Self-assessment prompt appears on session end');
    const promptText = await assessmentPrompt.textContent();
    assert(promptText === 'How did that feel?', `Assessment prompt is "How did that feel?" (got "${promptText}")`);

    // 6. Click a self-assessment button
    const assessBtns = await page.$$('.self-assessment-button');
    assert(assessBtns.length > 0, 'Self-assessment buttons present');
    await assessBtns[1].click();
    await page.waitForTimeout(500);

    // 7. Two-column layout appears
    await page.waitForSelector('.guild-columns', { timeout: 3000 });
    const guildColumns = await page.$('.guild-columns');
    assert(guildColumns !== null, '.guild-columns container present after assessment');

    // 8. Allied column structure
    const alliedCol = await page.$('.guild-column--allied');
    assert(alliedCol !== null, 'Allied column present (.guild-column--allied)');

    const alliedHeader = await page.$('.guild-column--allied h2');
    assert(alliedHeader !== null, 'Allied column has h2 header');
    const alliedHeaderText = await alliedHeader?.textContent();
    assert(alliedHeaderText === 'Allied Guilds', `Allied header text is "Allied Guilds" (got "${alliedHeaderText}")`);

    const alliedExplanation = await page.$('.guild-column--allied .guild-column-explanation');
    assert(alliedExplanation !== null, 'Allied column has explanation paragraph');
    const alliedExplanationText = await alliedExplanation?.textContent();
    assert(
      alliedExplanationText && alliedExplanationText.includes('five colors form a circle'),
      `Allied explanation mentions "five colors form a circle" (got "${alliedExplanationText?.substring(0, 60)}...")`
    );

    const alliedItems = await page.$$('.guild-column--allied .combo-summary-name');
    const alliedNames = await Promise.all(alliedItems.map(el => el.textContent()));
    const alliedNamesClean = alliedNames.map(n => n?.trim() ?? '');
    console.log(`  Allied guild items found: ${alliedNamesClean.join(', ')}`);
    assert(alliedItems.length === 5, `Allied column shows 5 guild items (got ${alliedItems.length})`);
    const allAlliedPresent = ALLIED_GUILDS.every(g => alliedNamesClean.includes(g));
    assert(allAlliedPresent, `All 5 allied guilds present (${ALLIED_GUILDS.join(', ')})`);

    const alliedBtn = await page.$('.guild-column--allied .next-session-button');
    assert(alliedBtn !== null, 'Allied column has a next-session button');
    const alliedBtnText = await alliedBtn?.textContent();
    assert(alliedBtnText === 'Learn allied guilds', `Allied button text is "Learn allied guilds" (got "${alliedBtnText}")`);

    // 9. Enemy column is LOCKED
    const enemyCol = await page.$('.guild-column--enemy');
    assert(enemyCol !== null, 'Enemy column present (.guild-column--enemy)');
    const enemyLocked = await page.$('.guild-column--locked');
    assert(enemyLocked !== null, 'Enemy column has .guild-column--locked class (state: locked)');

    // 10. Enemy column teaser text
    const enemyExplanation = await page.$('.guild-column--enemy .guild-column-explanation');
    const enemyExplanationText = await enemyExplanation?.textContent();
    assert(
      enemyExplanationText === 'Five more combinations. Ready when you are.',
      `Enemy column teaser text correct (got "${enemyExplanationText}")`
    );

    // 11. Enemy column has "Learn enemy guilds" button with primary class
    const enemyBtn = await page.$('.guild-column--enemy .next-session-button');
    assert(enemyBtn !== null, 'Enemy column has a next-session button');
    const enemyBtnText = await enemyBtn?.textContent();
    assert(enemyBtnText === 'Learn enemy guilds', `Enemy button text is "Learn enemy guilds" (got "${enemyBtnText}")`);
    const enemyBtnPrimary = await page.$('.guild-column--enemy .next-session-button--primary');
    assert(enemyBtnPrimary !== null, 'Enemy button has .next-session-button--primary class when locked');

    // 12. Enemy column does NOT have header or guild list when locked
    const enemyHeader = await page.$('.guild-column--enemy h2');
    assert(enemyHeader === null, 'Enemy column has NO h2 header when locked');
    const enemyItems = await page.$$('.guild-column--enemy .combo-summary-name');
    assert(enemyItems.length === 0, 'Enemy column has NO guild list items when locked');

    // Take screenshot of Phase 1 end screen
    await page.screenshot({ path: 'scripts/v0.8.0-screenshot-phase1-locked.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/v0.8.0-screenshot-phase1-locked.png');

    // =========================================================
    // PHASE 2: Enemy session from locked screen (verify cards are enemy)
    // =========================================================
    console.log('\n--- Phase 2: Enemy session navigation and stopped session stays locked ---\n');

    // Click "Learn enemy guilds" from the locked enemy column
    await enemyBtn.click();
    await page.waitForSelector('.card', { timeout: 5000 });

    const enemyCardEl = await page.$('.card');
    assert(enemyCardEl !== null, 'Card session starts after clicking "Learn enemy guilds"');

    // Collect a couple of card names to verify enemy pool
    console.log('  Collecting 4 enemy session card names...');
    const enemyCardsCollected = [];
    for (let i = 0; i < 4; i++) {
      await page.waitForSelector('.card', { timeout: 5000 });
      // Click to reveal name
      await page.click('#app');
      await page.waitForTimeout(300);
      try {
        const name = await page.textContent('.card-name', { timeout: 500 });
        if (name) enemyCardsCollected.push(name.trim());
      } catch {}
      // Click to advance
      await page.click('#app');
      await page.waitForTimeout(400);
    }
    console.log(`  Enemy cards collected: ${enemyCardsCollected.filter(Boolean).join(', ')}`);

    if (enemyCardsCollected.filter(Boolean).length > 0) {
      const allEnemyCards = enemyCardsCollected.filter(Boolean).every(n => ENEMY_GUILDS.includes(n));
      assert(allEnemyCards, `Cards from enemy session are all enemy guilds (got: ${enemyCardsCollected.filter(Boolean).join(', ')})`);
    } else {
      console.log('  (Could not reliably capture card names in rapid-click mode)');
    }

    // Stop the enemy session
    await page.waitForSelector('.control-button', { timeout: 5000 });
    const enemyControlBtns = await page.$$('.control-button');
    const enemyStopBtn = enemyControlBtns[enemyControlBtns.length - 1];
    await enemyStopBtn.click();

    // Assessment
    await page.waitForSelector('.self-assessment', { timeout: 3000 });
    const enemyAssessBtns = await page.$$('.self-assessment-button');
    assert(enemyAssessBtns.length > 0, 'Self-assessment buttons present on enemy session end');
    await enemyAssessBtns[0].click();
    await page.waitForTimeout(500);

    // After stopping (not completing) enemy session, enemy column should remain LOCKED
    await page.waitForSelector('.guild-columns', { timeout: 3000 });
    const enemyStillLocked = await page.$('.guild-column--locked');
    assert(
      enemyStillLocked !== null,
      'Enemy column remains locked after STOPPED (not completed) enemy session'
    );

    await page.screenshot({ path: 'scripts/v0.8.0-screenshot-phase2-still-locked.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/v0.8.0-screenshot-phase2-still-locked.png');

    // =========================================================
    // PHASE 3: Simulate enemy unlocked via localStorage
    // =========================================================
    console.log('\n--- Phase 3: Enemy unlocked via localStorage simulation ---\n');

    // Set localStorage to simulate enemy unlock
    await page.evaluate(() => {
      localStorage.setItem('sparrow-deck.progression', JSON.stringify({ enemyUnlocked: true }));
    });

    // Reload and start a new session
    await page.reload();
    await page.waitForTimeout(500);

    // Verify we're on welcome screen
    const welcomeOnReload = await page.$('.welcome');
    assert(welcomeOnReload !== null, 'Welcome screen appears after reload');

    const startBtnReload = await page.$('#start-button');
    await startBtnReload.click();
    await page.waitForSelector('.card', { timeout: 5000 });

    // Click through 4 cards
    console.log('  Clicking through 4 cards for unlocked phase...');
    await clickThroughCards(page, 4);

    // Stop session
    await page.waitForSelector('.control-button', { timeout: 5000 });
    const unlockedControlBtns = await page.$$('.control-button');
    const unlockedStopBtn = unlockedControlBtns[unlockedControlBtns.length - 1];
    await unlockedStopBtn.click();

    // Self-assessment
    await page.waitForSelector('.self-assessment', { timeout: 3000 });
    const unlockedAssessBtns = await page.$$('.self-assessment-button');
    await unlockedAssessBtns[0].click();
    await page.waitForTimeout(500);

    // Verify enemy column is now UNLOCKED
    await page.waitForSelector('.guild-columns', { timeout: 3000 });

    const enemyUnlockedEl = await page.$('.guild-column--enemy');
    assert(enemyUnlockedEl !== null, 'Enemy column present when unlocked');

    const noLockClass = await page.$('.guild-column--locked');
    assert(noLockClass === null, 'Enemy column does NOT have .guild-column--locked class when unlocked');

    // Unlocked enemy column should have header
    const enemyHeaderUnlocked = await page.$('.guild-column--enemy h2');
    assert(enemyHeaderUnlocked !== null, 'Enemy column has h2 header when unlocked');
    const enemyHeaderTextUnlocked = await enemyHeaderUnlocked?.textContent();
    assert(
      enemyHeaderTextUnlocked === 'Enemy Guilds',
      `Enemy header text is "Enemy Guilds" when unlocked (got "${enemyHeaderTextUnlocked}")`
    );

    // Unlocked enemy column should have explanation mentioning "opposite sides"
    const enemyExplanationUnlocked = await page.$('.guild-column--enemy .guild-column-explanation');
    const enemyExplanationTextUnlocked = await enemyExplanationUnlocked?.textContent();
    assert(
      enemyExplanationTextUnlocked && enemyExplanationTextUnlocked.includes('opposite sides'),
      `Enemy explanation mentions "opposite sides" when unlocked (got "${enemyExplanationTextUnlocked?.substring(0, 60)}...")`
    );

    // Unlocked enemy column should show all 5 enemy guilds
    const enemyItemsUnlocked = await page.$$('.guild-column--enemy .combo-summary-name');
    const enemyNamesUnlocked = await Promise.all(enemyItemsUnlocked.map(el => el.textContent()));
    const enemyNamesClean = enemyNamesUnlocked.map(n => n?.trim() ?? '');
    console.log(`  Enemy guild items found (unlocked): ${enemyNamesClean.join(', ')}`);
    assert(enemyItemsUnlocked.length === 5, `Enemy column shows 5 guild items when unlocked (got ${enemyItemsUnlocked.length})`);
    const allEnemyPresent = ENEMY_GUILDS.every(g => enemyNamesClean.includes(g));
    assert(allEnemyPresent, `All 5 enemy guilds present when unlocked (${ENEMY_GUILDS.join(', ')})`);

    // Unlocked enemy button should NOT have primary class
    const enemyBtnUnlocked = await page.$('.guild-column--enemy .next-session-button');
    const enemyBtnPrimaryWhenUnlocked = await page.$('.guild-column--enemy .next-session-button--primary');
    assert(enemyBtnUnlocked !== null, 'Enemy column button present when unlocked');
    assert(
      enemyBtnPrimaryWhenUnlocked === null,
      'Enemy button does NOT have .next-session-button--primary when unlocked'
    );

    // Take screenshot of unlocked state
    await page.screenshot({ path: 'scripts/v0.8.0-screenshot-phase3-unlocked.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/v0.8.0-screenshot-phase3-unlocked.png');

    // =========================================================
    // PHASE 4: Structural / version checks
    // =========================================================
    console.log('\n--- Phase 4: Version and structural checks ---\n');

    await page.reload();
    await page.waitForTimeout(500);

    const footerFinal = await page.textContent('#app-version');
    assert(
      footerFinal && footerFinal.includes('v0.8.0'),
      `Footer shows v0.8.0 after reload (got "${footerFinal}")`
    );

    // APP_VERSION in source
    const { readFileSync } = await import('fs');
    const mainSrc = readFileSync('/Users/jessitron/code/jessitron/sparrow-deck/src/main.ts', 'utf8');
    assert(
      mainSrc.includes("APP_VERSION = '0.8.0'"),
      "APP_VERSION = '0.8.0' found in src/main.ts"
    );

    // progression.ts exists
    try {
      readFileSync('/Users/jessitron/code/jessitron/sparrow-deck/src/progression.ts', 'utf8');
      assert(true, 'src/progression.ts module exists');
    } catch {
      assert(false, 'src/progression.ts module exists');
    }

    // src/progression.ts has isEnemyUnlocked and markEnemyUnlocked exports
    const progressionSrc = readFileSync('/Users/jessitron/code/jessitron/sparrow-deck/src/progression.ts', 'utf8');
    assert(progressionSrc.includes('export function isEnemyUnlocked'), 'progression.ts exports isEnemyUnlocked');
    assert(progressionSrc.includes('export function markEnemyUnlocked'), 'progression.ts exports markEnemyUnlocked');
    assert(progressionSrc.includes("'sparrow-deck.progression'"), "progression.ts uses 'sparrow-deck.progression' storage key");

    // session.enemy_unlocked telemetry attribute in main.ts
    assert(
      mainSrc.includes("'session.enemy_unlocked'"),
      "session.enemy_unlocked telemetry attribute present in main.ts"
    );

    // progression.enemy_unlocked event in main.ts
    assert(
      mainSrc.includes("'progression.enemy_unlocked'"),
      "progression.enemy_unlocked event present in main.ts"
    );

    // Wait for Honeycomb spans to flush
    console.log('\n  Waiting 12s for Honeycomb spans to flush...');
    await page.waitForTimeout(12000);

    await page.close();

  } finally {
    await browser.close();
    server.kill();
  }

  console.log(`\n=== ${failures === 0 ? 'ALL TESTS PASSED' : `${failures} TEST(S) FAILED`} ===`);
  console.log(`    ${passes} passed, ${failures} failed\n`);
  if (failures > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
