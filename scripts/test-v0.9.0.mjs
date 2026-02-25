/**
 * Arc 10 verification: Settings Gear Icon + Panel
 * Tests all 17 checks for v0.9.0 settings feature.
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const PORT = 8765;
const BASE_URL = `http://localhost:${PORT}`;

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
  const server = spawn('npx', ['serve', '.', '-l', String(PORT)], {
    cwd: '/Users/jessitron/code/jessitron/sparrow-deck',
    stdio: 'ignore',
  });
  return server;
}

/**
 * Click through a few cards quickly so a session is in progress.
 * Returns after clicking through `count` cards.
 */
async function clickThroughCards(page, count) {
  for (let i = 0; i < count; i++) {
    await page.waitForSelector('.card', { timeout: 5000 });
    // Click to reveal, wait a bit, click to advance
    await page.click('#app');
    await page.waitForTimeout(200);
    await page.click('#app');
    await page.waitForTimeout(400);
  }
}

async function run() {
  console.log('=== Arc 10 — Settings Gear Icon + Panel (v0.9.0) ===\n');

  const server = startServer();
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    // =========================================================
    // Phase 1: Welcome screen checks
    // =========================================================
    console.log('\n--- Phase 1: Gear icon on welcome screen ---\n');

    const page = await context.newPage();
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
    await page.reload();
    await page.waitForTimeout(500);

    // Test 1: Gear icon visible on welcome screen
    const gearBtn = await page.$('#settings-gear-btn');
    assert(gearBtn !== null, '#settings-gear-btn is present on the page');
    const gearVisible = await gearBtn?.isVisible();
    assert(gearVisible === true, '#settings-gear-btn is visible on welcome screen');

    // Test 17: Old app-version footer element is gone
    const oldFooter = await page.$('#app-version');
    assert(oldFooter === null, 'Old <footer id="app-version"> element is NOT present');

    // Test 4: Settings panel starts hidden
    const panelHiddenInitially = await page.$eval('#settings-panel', el => el.hidden);
    assert(panelHiddenInitially === true, '#settings-panel is hidden on page load');

    // Test 5: Backdrop starts hidden
    const backdropHiddenInitially = await page.$eval('#settings-backdrop', el => el.hidden);
    assert(backdropHiddenInitially === true, '#settings-backdrop is hidden on page load');

    // Test 4 (open): Click gear opens panel
    await page.click('#settings-gear-btn');
    await page.waitForTimeout(200);

    const panelAfterOpen = await page.$eval('#settings-panel', el => el.hidden);
    assert(panelAfterOpen === false, '#settings-panel becomes visible after clicking gear');

    // Test 5 (open): Backdrop visible when panel open
    const backdropAfterOpen = await page.$eval('#settings-backdrop', el => el.hidden);
    assert(backdropAfterOpen === false, '#settings-backdrop is visible when panel is open');

    // Test 9: Version text shows v0.9.0
    const versionText = await page.textContent('#settings-version');
    assert(
      versionText && versionText.includes('v0.9.0'),
      `#settings-version shows "v0.9.0" (got "${versionText}")`
    );

    // Test 10: Trace container hidden on welcome screen (no session)
    const traceContainerHidden = await page.$eval('#settings-trace-container', el => el.hidden);
    assert(traceContainerHidden === true, '#settings-trace-container is hidden on welcome screen (no active session)');

    // Test 6: Close button dismisses panel
    await page.click('#settings-close-btn');
    await page.waitForTimeout(200);
    const panelAfterClose = await page.$eval('#settings-panel', el => el.hidden);
    assert(panelAfterClose === true, '#settings-panel is hidden after clicking close button');
    const backdropAfterClose = await page.$eval('#settings-backdrop', el => el.hidden);
    assert(backdropAfterClose === true, '#settings-backdrop is hidden after clicking close button');

    // Test 8: Panel can be reopened after closing
    await page.click('#settings-gear-btn');
    await page.waitForTimeout(200);
    const panelReopened = await page.$eval('#settings-panel', el => el.hidden);
    assert(panelReopened === false, 'Settings panel can be reopened after closing');

    // Test 7: Clicking backdrop closes panel
    await page.click('#settings-backdrop');
    await page.waitForTimeout(200);
    const panelAfterBackdrop = await page.$eval('#settings-panel', el => el.hidden);
    assert(panelAfterBackdrop === true, '#settings-panel closes when clicking backdrop');

    await page.screenshot({ path: 'scripts/arc10-welcome-screen.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/arc10-welcome-screen.png');

    // =========================================================
    // Phase 2: Session in progress — gear still visible, trace link
    // =========================================================
    console.log('\n--- Phase 2: Gear during session + trace link ---\n');

    // Start a session
    const startBtn = await page.$('#start-button');
    assert(startBtn !== null, '"Learn guild names" button present');
    await startBtn.click();
    await page.waitForSelector('.card', { timeout: 5000 });

    // Test 2: Gear still visible during session
    const gearDuringSession = await page.$('#settings-gear-btn');
    assert(gearDuringSession !== null, '#settings-gear-btn present during session');
    const gearVisibleDuringSession = await gearDuringSession?.isVisible();
    assert(gearVisibleDuringSession === true, '#settings-gear-btn is visible during a session');

    // Test 16: Clicking gear does NOT advance the card (stopPropagation)
    // Record current card index before clicking gear
    const progressBefore = await page.textContent('.progress-counter');
    await page.click('#settings-gear-btn');
    await page.waitForTimeout(300);
    const progressAfterGear = await page.textContent('.progress-counter');
    assert(
      progressBefore === progressAfterGear,
      `Clicking gear does NOT advance the card (progress stayed at "${progressBefore}")`
    );
    // Close the panel again
    await page.click('#settings-close-btn');
    await page.waitForTimeout(200);

    // Test 11: After starting session, trace link container becomes visible
    // Open settings to check
    await page.click('#settings-gear-btn');
    await page.waitForTimeout(200);
    const traceContainerVisible = await page.$eval('#settings-trace-container', el => el.hidden);
    assert(
      traceContainerVisible === false,
      '#settings-trace-container is visible after starting a session'
    );

    // Test 12: Trace link has honeycomb.io href
    const traceLinkHref = await page.$eval('#settings-trace-link', el => el.getAttribute('href'));
    assert(
      traceLinkHref !== null && traceLinkHref.includes('honeycomb.io'),
      `#settings-trace-link href points to honeycomb.io (got "${traceLinkHref?.substring(0, 60)}...")`
    );

    await page.click('#settings-close-btn');
    await page.waitForTimeout(200);

    await page.screenshot({ path: 'scripts/arc10-during-session.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/arc10-during-session.png');

    // =========================================================
    // Phase 3: End screen — gear still visible
    // =========================================================
    console.log('\n--- Phase 3: Gear icon on end screen ---\n');

    // Stop the session
    const stopBtn = await page.$('.control-button:last-child');
    if (stopBtn) {
      await stopBtn.click();
    } else {
      // Navigate through cards if needed
      await clickThroughCards(page, 2);
      await page.waitForSelector('.control-button', { timeout: 5000 });
      const allBtns = await page.$$('.control-button');
      await allBtns[allBtns.length - 1].click();
    }
    await page.waitForTimeout(500);

    // Dismiss self-assessment if it appears
    const assessBtns = await page.$$('.self-assessment-button');
    if (assessBtns.length > 0) {
      await assessBtns[0].click();
      await page.waitForTimeout(500);
    }

    // Test 3: Gear still visible on end screen
    const gearOnEnd = await page.$('#settings-gear-btn');
    assert(gearOnEnd !== null, '#settings-gear-btn present on end screen');
    const gearVisibleOnEnd = await gearOnEnd?.isVisible();
    assert(gearVisibleOnEnd === true, '#settings-gear-btn is visible on end screen');

    await page.screenshot({ path: 'scripts/arc10-end-screen.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/arc10-end-screen.png');

    // =========================================================
    // Phase 4: Reset progress
    // =========================================================
    console.log('\n--- Phase 4: Reset progress ---\n');

    // Set localStorage with progression data
    await page.evaluate(() => {
      localStorage.setItem('sparrow-deck.progression', JSON.stringify({
        enemyUnlocked: true,
        completedSubgroups: ['allied', 'enemy'],
      }));
    });

    // Verify it was set
    const storageBefore = await page.evaluate(() => localStorage.getItem('sparrow-deck.progression'));
    assert(
      storageBefore !== null && storageBefore.includes('enemyUnlocked'),
      `localStorage has progression data before reset (got: "${storageBefore?.substring(0, 60)}...")`
    );

    // Open settings panel
    await page.click('#settings-gear-btn');
    await page.waitForTimeout(200);

    // Test 13: Reset button is present
    const resetBtn = await page.$('#settings-reset-btn');
    assert(resetBtn !== null, '#settings-reset-btn is present in settings panel');

    // Click reset and wait for page reload
    await page.click('#settings-reset-btn');

    // Wait for navigation/reload
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Test 14: localStorage is cleared after reset
    const storageAfter = await page.evaluate(() => localStorage.getItem('sparrow-deck.progression'));
    assert(
      storageAfter === null,
      `localStorage 'sparrow-deck.progression' is null after reset (got "${storageAfter}")`
    );

    // Test 15: Welcome screen is shown after reset
    const welcomeAfterReset = await page.$('.welcome');
    assert(welcomeAfterReset !== null, 'Welcome screen is shown after reset (.welcome element present)');

    await page.screenshot({ path: 'scripts/arc10-after-reset.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/arc10-after-reset.png');

    // =========================================================
    // Phase 5: Source code checks
    // =========================================================
    console.log('\n--- Phase 5: Source code checks ---\n');

    const mainSrc = readFileSync('/Users/jessitron/code/jessitron/sparrow-deck/src/main.ts', 'utf8');
    assert(
      mainSrc.includes("APP_VERSION = '0.9.0'"),
      "APP_VERSION = '0.9.0' in src/main.ts"
    );
    assert(
      mainSrc.includes('settings-gear-btn'),
      'settings-gear-btn referenced in main.ts (wired up)'
    );
    assert(
      mainSrc.includes('settings-reset-btn'),
      'settings-reset-btn referenced in main.ts (reset handler)'
    );
    assert(
      mainSrc.includes("localStorage.removeItem('sparrow-deck.progression')"),
      "localStorage.removeItem('sparrow-deck.progression') present in main.ts"
    );
    assert(
      mainSrc.includes('currentTraceUrl'),
      'currentTraceUrl variable present in main.ts (trace URL stored for settings)'
    );

    const htmlSrc = readFileSync('/Users/jessitron/code/jessitron/sparrow-deck/index.html', 'utf8');
    assert(
      !htmlSrc.includes('id="app-version"'),
      'index.html does NOT have id="app-version" (old footer gone)'
    );
    assert(
      htmlSrc.includes('id="settings-gear-btn"'),
      'index.html has id="settings-gear-btn"'
    );
    assert(
      htmlSrc.includes('id="settings-panel"'),
      'index.html has id="settings-panel"'
    );
    assert(
      htmlSrc.includes('id="settings-reset-btn"'),
      'index.html has id="settings-reset-btn"'
    );

    await page.close();

  } finally {
    await browser.close();
    server.kill();
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
