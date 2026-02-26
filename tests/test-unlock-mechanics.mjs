/**
 * Arc verification: Generalize Unlock Mechanics (v0.9.x)
 *
 * Tests that allied and enemy guild columns use consistent lock/unlock behavior
 * driven by unlockedSubgroups[] in progression state.
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

async function clearProgression(page) {
  await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
}

async function setProgression(page, data) {
  await page.evaluate((d) => {
    localStorage.setItem('sparrow-deck.progression', JSON.stringify(d));
  }, data);
}

/**
 * Navigate to ?screen=end with given localStorage state.
 * Returns after the end screen is visible.
 */
async function goToEndScreen(page, progressionData) {
  // Load base URL first so we have the right origin for localStorage
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  if (progressionData === null) {
    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
  } else {
    await page.evaluate((d) => {
      localStorage.setItem('sparrow-deck.progression', JSON.stringify(d));
    }, progressionData);
  }
  // Navigate to ?screen=end — app reads localStorage on load
  await page.goto(`${BASE_URL}/?screen=end`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  // Wait for guild columns container to appear
  await page.waitForSelector('.guild-columns', { timeout: 8000 });
}

/**
 * Click through cards quickly enough to stop a session.
 * Clicks the Stop button after a couple cards.
 */
async function runAndStopSession(page) {
  // Click through 2 cards then hit Stop
  for (let i = 0; i < 2; i++) {
    await page.waitForSelector('.card', { timeout: 5000 });
    await page.click('#app');
    await page.waitForTimeout(200);
    await page.click('#app');
    await page.waitForTimeout(400);
  }
  // Click Stop button
  const stopBtn = await page.$('.control-button:last-child');
  if (stopBtn) {
    await stopBtn.click();
  }
  await page.waitForTimeout(300);
  // Dismiss self-assessment if it appears
  const assessBtns = await page.$$('.self-assessment-button');
  if (assessBtns.length > 0) {
    await assessBtns[0].click();
    await page.waitForTimeout(500);
  }
  // Wait for guild columns
  await page.waitForSelector('.guild-columns', { timeout: 5000 });
}

async function run() {
  console.log('=== Unlock Mechanics — Generalized unlockedSubgroups[] ===\n');

  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    // =========================================================
    // Check 1: Fresh user — allied column is locked
    // =========================================================
    console.log('\n--- Check 1: Fresh user — allied column locked ---\n');

    const page = await context.newPage();
    await goToEndScreen(page, null);

    const alliedLocked = await page.$('.guild-column--allied.guild-column--locked');
    assert(alliedLocked !== null, 'Allied column has .guild-column--locked when no progression');

    const alliedHeader = await page.$('.guild-column--allied .guild-column-header');
    assert(alliedHeader === null, 'Allied column has NO .guild-column-header when locked');

    const alliedSvg = await page.$('.guild-column--allied svg');
    assert(alliedSvg === null, 'Allied column has NO svg when locked');

    const alliedGuildList = await page.$('.guild-column--allied .guild-list');
    assert(alliedGuildList === null, 'Allied column has NO .guild-list when locked');

    const alliedExplanation = await page.$('.guild-column--allied .guild-column-explanation');
    assert(alliedExplanation === null, 'Allied column has NO .guild-column-explanation when locked');

    const alliedBtn = await page.$('.guild-column--allied .guild-column-button');
    assert(alliedBtn !== null, 'Allied column DOES have a button when locked');

    const alliedBtnText = await alliedBtn?.textContent();
    assert(
      alliedBtnText && alliedBtnText.includes('Learn allied guilds'),
      `Allied locked button reads "Learn allied guilds" (got "${alliedBtnText}")`
    );

    await page.screenshot({ path: 'tests/check1-fresh-both-locked.png', fullPage: true });
    console.log('  Screenshot: tests/check1-fresh-both-locked.png');

    // =========================================================
    // Check 2: Fresh user — enemy column is also locked
    // =========================================================
    console.log('\n--- Check 2: Fresh user — enemy column locked ---\n');

    const enemyLocked = await page.$('.guild-column--enemy.guild-column--locked');
    assert(enemyLocked !== null, 'Enemy column has .guild-column--locked when no progression');

    const enemyHeader = await page.$('.guild-column--enemy .guild-column-header');
    assert(enemyHeader === null, 'Enemy column has NO .guild-column-header when locked');

    const enemySvg = await page.$('.guild-column--enemy svg');
    assert(enemySvg === null, 'Enemy column has NO svg when locked');

    const enemyGuildList = await page.$('.guild-column--enemy .guild-list');
    assert(enemyGuildList === null, 'Enemy column has NO .guild-list when locked');

    // =========================================================
    // Check 3: After allied session — allied column unlocked
    // =========================================================
    console.log('\n--- Check 3: After allied session — allied column unlocked ---\n');

    // Go to welcome, start an allied (default) session, stop it
    await page.goto(BASE_URL);
    await clearProgression(page);
    await page.reload();
    await page.waitForSelector('#start-button', { timeout: 5000 });
    await page.click('#start-button');
    await page.waitForSelector('.card', { timeout: 5000 });
    await runAndStopSession(page);

    // Now on end screen — allied should be unlocked
    const alliedUnlockedAfterSession = await page.$('.guild-column--allied:not(.guild-column--locked)');
    assert(
      alliedUnlockedAfterSession !== null,
      'Allied column is NOT locked after completing an allied session'
    );

    const alliedHeaderAfter = await page.$('.guild-column--allied .guild-column-header');
    assert(alliedHeaderAfter !== null, 'Allied column has .guild-column-header after allied session');

    const alliedSvgAfter = await page.$('.guild-column--allied svg');
    assert(alliedSvgAfter !== null, 'Allied column has svg after allied session');

    const alliedGuildListAfter = await page.$('.guild-column--allied .guild-list');
    assert(alliedGuildListAfter !== null, 'Allied column has .guild-list after allied session');

    const alliedExplanationAfter = await page.$('.guild-column--allied .guild-column-explanation');
    assert(alliedExplanationAfter !== null, 'Allied column has .guild-column-explanation after allied session');

    await page.screenshot({ path: 'tests/check3-allied-unlocked.png', fullPage: true });
    console.log('  Screenshot: tests/check3-allied-unlocked.png');

    // =========================================================
    // Check 4: After allied session — enemy column still locked
    // =========================================================
    console.log('\n--- Check 4: After allied session — enemy column still locked ---\n');

    const enemyStillLocked = await page.$('.guild-column--enemy.guild-column--locked');
    assert(enemyStillLocked !== null, 'Enemy column is still locked after only an allied session');

    // =========================================================
    // Check 5: Backward compatibility — old {enemyUnlocked: true} migrates
    // =========================================================
    console.log('\n--- Check 5: Backward compat — old enemyUnlocked:true migrates ---\n');

    await goToEndScreen(page, { enemyUnlocked: true });

    const enemyUnlockedMigrated = await page.$('.guild-column--enemy:not(.guild-column--locked)');
    assert(
      enemyUnlockedMigrated !== null,
      'Enemy column is unlocked when old {enemyUnlocked:true} is in localStorage'
    );

    const enemyHeaderMigrated = await page.$('.guild-column--enemy .guild-column-header');
    assert(enemyHeaderMigrated !== null, 'Enemy column has .guild-column-header after migration');

    const enemySvgMigrated = await page.$('.guild-column--enemy svg');
    assert(enemySvgMigrated !== null, 'Enemy column has svg after migration from old format');

    await page.screenshot({ path: 'tests/check5-enemy-unlocked-migrated.png', fullPage: true });
    console.log('  Screenshot: tests/check5-enemy-unlocked-migrated.png');

    // =========================================================
    // Check 6: ?screen=end respects unlock state — both locked
    // =========================================================
    console.log('\n--- Check 6: ?screen=end — fresh user sees both locked ---\n');

    await goToEndScreen(page, null);

    const alliedLockedShortcut = await page.$('.guild-column--allied.guild-column--locked');
    assert(alliedLockedShortcut !== null, '?screen=end shows allied locked for fresh user');

    const enemyLockedShortcut = await page.$('.guild-column--enemy.guild-column--locked');
    assert(enemyLockedShortcut !== null, '?screen=end shows enemy locked for fresh user');

    // =========================================================
    // Check 7: ?screen=end with unlockedSubgroups:['allied'] — allied unlocked only
    // =========================================================
    console.log('\n--- Check 7: ?screen=end with unlockedSubgroups:[allied] ---\n');

    await goToEndScreen(page, { unlockedSubgroups: ['allied'] });

    const alliedUnlockedShortcut = await page.$('.guild-column--allied:not(.guild-column--locked)');
    assert(
      alliedUnlockedShortcut !== null,
      '?screen=end shows allied unlocked when unlockedSubgroups includes "allied"'
    );

    const enemyLockedWhenOnlyAllied = await page.$('.guild-column--enemy.guild-column--locked');
    assert(
      enemyLockedWhenOnlyAllied !== null,
      '?screen=end shows enemy locked when only "allied" in unlockedSubgroups'
    );

    await page.screenshot({ path: 'tests/check7-allied-unlocked-enemy-locked.png', fullPage: true });
    console.log('  Screenshot: tests/check7-allied-unlocked-enemy-locked.png');

    // =========================================================
    // Check 8: ?screen=end with unlockedSubgroups:['enemy'] — enemy unlocked only
    // =========================================================
    console.log('\n--- Check 8: ?screen=end with unlockedSubgroups:[enemy] ---\n');

    await goToEndScreen(page, { unlockedSubgroups: ['enemy'] });

    const enemyUnlockedShortcut = await page.$('.guild-column--enemy:not(.guild-column--locked)');
    assert(
      enemyUnlockedShortcut !== null,
      '?screen=end shows enemy unlocked when unlockedSubgroups includes "enemy"'
    );

    const alliedLockedWhenOnlyEnemy = await page.$('.guild-column--allied.guild-column--locked');
    assert(
      alliedLockedWhenOnlyEnemy !== null,
      '?screen=end shows allied locked when only "enemy" in unlockedSubgroups'
    );

    await page.screenshot({ path: 'tests/check8-enemy-unlocked-allied-locked.png', fullPage: true });
    console.log('  Screenshot: tests/check8-enemy-unlocked-allied-locked.png');

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
