/**
 * Learn vs Practice Button Text + Locked Enemy Column Verification
 *
 * Acceptance criteria:
 * 1. Locked enemy column shows ONLY the "Learn enemy guilds" button, vertically centered (no teaser text)
 * 2. After completing one allied session, allied button says "Practice allied guilds"
 * 3. Enemy button says "Learn enemy guilds" until an enemy session has been done
 * 4. After completing an enemy session, enemy button says "Practice enemy guilds"
 * 5. 8px line thickness and centered headers from previous tweaks are still intact
 * 6. Hover highlighting still works
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PORT = 8087;
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
  const server = spawn('npx', ['http-server', '.', '-p', String(PORT), '-s', '--cors'], {
    cwd: '/Users/jessitron/code/jessitron/sparrow-deck',
    stdio: 'ignore',
  });
  return server;
}

async function clickThroughCards(page, count) {
  for (let i = 0; i < count; i++) {
    await page.waitForSelector('.card', { timeout: 5000 });
    await page.click('#app');
    await page.waitForTimeout(200);
    await page.click('#app');
    await page.waitForTimeout(400);
  }
}

async function runSession(page) {
  await page.waitForSelector('.card', { timeout: 5000 });

  // Click through 4 cards
  await clickThroughCards(page, 4);

  // Click Stop
  await page.waitForSelector('.control-button', { timeout: 5000 });
  const controlBtns = await page.$$('.control-button');
  const stopBtn = controlBtns[controlBtns.length - 1];
  await stopBtn.click();

  // Complete self-assessment
  await page.waitForSelector('.self-assessment', { timeout: 3000 });
  const assessBtns = await page.$$('.self-assessment-button');
  assert(assessBtns.length > 0, 'Self-assessment buttons present');
  await assessBtns[1].click();
  await page.waitForTimeout(600);

  // Wait for guild columns
  await page.waitForSelector('.guild-columns', { timeout: 3000 });
}

async function run() {
  console.log('=== Learn vs Practice Button Text Verification ===\n');

  const server = startServer();
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  try {
    const page = await context.newPage();

    // =========================================================
    // PHASE 1: Fresh state — complete first allied session
    // =========================================================
    console.log('\n--- Phase 1: Fresh state — first allied session ---\n');

    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
    await page.reload();
    await page.waitForTimeout(500);

    const startBtn = await page.$('#start-button');
    assert(startBtn !== null, 'Welcome screen has start button');
    await startBtn.click();

    await runSession(page);

    // 1a. Locked enemy column: no <p> elements
    const lockedCol = await page.$('.guild-column--locked');
    assert(lockedCol !== null, 'Enemy column is locked (.guild-column--locked)');

    const pElements = await page.$$('.guild-column--locked p');
    console.log(`  <p> elements in locked column: ${pElements.length}`);
    assert(pElements.length === 0, `Locked enemy column has NO <p> elements (found ${pElements.length})`);

    const lockedExplanation = await page.$('.guild-column--locked .guild-column-explanation');
    assert(lockedExplanation === null, 'Locked enemy column has no .guild-column-explanation');

    // 1b. Locked enemy column button present
    const enemyBtn = await page.$('.guild-column--locked .next-session-button');
    assert(enemyBtn !== null, 'Locked enemy column has a button');
    const enemyBtnText = await enemyBtn?.textContent();
    assert(enemyBtnText === 'Learn enemy guilds', `Enemy button says "Learn enemy guilds" (got "${enemyBtnText}")`);

    // 1c. Button is vertically centered in locked column
    const colBox = await page.$eval('.guild-column--locked', el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    });
    const btnBox = await page.$eval('.guild-column--locked .next-session-button', el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    });
    const btnMid = (btnBox.top + btnBox.bottom) / 2;
    const colMid = (colBox.top + colBox.bottom) / 2;
    const offset = Math.abs(btnMid - colMid);
    const tolerance = colBox.height * 0.20; // within 20% of column height
    console.log(`  Column mid: ${colMid.toFixed(1)}, Button mid: ${btnMid.toFixed(1)}, Offset: ${offset.toFixed(1)}, Tolerance: ${tolerance.toFixed(1)}`);
    assert(
      offset <= tolerance,
      `Enemy button is vertically centered in locked column (offset ${offset.toFixed(1)}px ≤ tolerance ${tolerance.toFixed(1)}px)`
    );

    // Also check computed flex alignment
    const lockedJustify = await page.$eval('.guild-column--locked', el =>
      window.getComputedStyle(el).justifyContent
    );
    console.log(`  Locked column computed justify-content: "${lockedJustify}"`);
    assert(lockedJustify === 'center', `Locked column has justify-content: center (got "${lockedJustify}")`);

    // 1d. After first allied session completes, allied button should now say "Practice allied guilds"
    //     (markSubgroupCompleted fires on showSessionEnd before building columns)
    const alliedBtnAfterFirst = await page.$('.guild-column--allied .next-session-button');
    assert(alliedBtnAfterFirst !== null, 'Allied column has a button after first session');
    const alliedBtnTextAfterFirst = await alliedBtnAfterFirst?.textContent();
    assert(
      alliedBtnTextAfterFirst === 'Practice allied guilds',
      `After first allied session, allied button says "Practice allied guilds" (got "${alliedBtnTextAfterFirst}")`
    );

    // 1e. Enemy button is still "Learn enemy guilds"
    assert(enemyBtnText === 'Learn enemy guilds', `Enemy button still says "Learn enemy guilds" after allied session (got "${enemyBtnText}")`);

    await page.screenshot({ path: 'scripts/learn-practice-phase1.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/learn-practice-phase1.png');

    // =========================================================
    // PHASE 2: Second allied session — "Practice" persists
    // =========================================================
    console.log('\n--- Phase 2: Second allied session — Practice persists ---\n');

    // Click "Practice allied guilds" to start another session
    await alliedBtnAfterFirst.click();
    await runSession(page);

    const alliedBtnAfterSecond = await page.$('.guild-column--allied .next-session-button');
    const alliedBtnTextAfterSecond = await alliedBtnAfterSecond?.textContent();
    assert(
      alliedBtnTextAfterSecond === 'Practice allied guilds',
      `After second allied session, allied button still says "Practice allied guilds" (got "${alliedBtnTextAfterSecond}")`
    );

    const enemyBtnAfterSecond = await page.$('.guild-column--locked .next-session-button');
    const enemyBtnTextAfterSecond = await enemyBtnAfterSecond?.textContent();
    assert(
      enemyBtnTextAfterSecond === 'Learn enemy guilds',
      `After second allied session, enemy button still says "Learn enemy guilds" (got "${enemyBtnTextAfterSecond}")`
    );

    await page.screenshot({ path: 'scripts/learn-practice-phase2.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/learn-practice-phase2.png');

    // =========================================================
    // PHASE 3: Simulate completed enemy session → "Practice enemy guilds"
    // =========================================================
    console.log('\n--- Phase 3: Simulate completed enemy session — Practice enemy guilds ---\n');

    // Set localStorage to simulate enemy unlocked AND enemy subgroup completed
    await page.evaluate(() => {
      localStorage.setItem('sparrow-deck.progression', JSON.stringify({
        enemyUnlocked: true,
        completedSubgroups: ['allied', 'enemy'],
      }));
    });
    await page.reload();
    await page.waitForTimeout(500);

    // Start a session to reach the end screen
    const startBtnReloaded = await page.$('#start-button');
    assert(startBtnReloaded !== null, 'Welcome screen present after reload');
    await startBtnReloaded.click();
    await runSession(page);

    // Enemy column should be unlocked now
    const enemyUnlockedCol = await page.$('.guild-column--enemy');
    const noLockClass = await page.$('.guild-column--locked');
    assert(noLockClass === null, 'Enemy column is NOT locked after simulated enemy completion');

    const enemyBtnUnlocked = await page.$('.guild-column--enemy .next-session-button');
    assert(enemyBtnUnlocked !== null, 'Unlocked enemy column has a button');
    const enemyBtnTextUnlocked = await enemyBtnUnlocked?.textContent();
    assert(
      enemyBtnTextUnlocked === 'Practice enemy guilds',
      `After enemy session completed, enemy button says "Practice enemy guilds" (got "${enemyBtnTextUnlocked}")`
    );

    const alliedBtnPhase3 = await page.$('.guild-column--allied .next-session-button');
    const alliedBtnTextPhase3 = await alliedBtnPhase3?.textContent();
    assert(
      alliedBtnTextPhase3 === 'Practice allied guilds',
      `Allied button still says "Practice allied guilds" in phase 3 (got "${alliedBtnTextPhase3}")`
    );

    await page.screenshot({ path: 'scripts/learn-practice-phase3.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/learn-practice-phase3.png');

    // =========================================================
    // PHASE 4: Structural checks (8px lines, centered header, hover)
    // =========================================================
    console.log('\n--- Phase 4: Structural checks ---\n');

    // 4a. Allied lines have stroke-width="8"
    const alliedLineWidths = await page.$$eval('.ally-line-vis', lines =>
      lines.map(l => l.getAttribute('stroke-width'))
    );
    console.log(`  Found ${alliedLineWidths.length} .ally-line-vis elements: ${alliedLineWidths.join(', ')}`);
    assert(alliedLineWidths.length > 0, `At least one .ally-line-vis element present`);
    const allEight = alliedLineWidths.every(w => w === '8');
    assert(allEight, `All .ally-line-vis elements have stroke-width="8" (got: ${alliedLineWidths.join(', ')})`);

    // 4b. Allied column header is centered
    const alliedHeader = await page.$('.guild-column--allied .guild-column-header');
    assert(alliedHeader !== null, '.guild-column-header present in allied column');
    const headerTextAlign = await page.$eval('.guild-column--allied .guild-column-header', el =>
      window.getComputedStyle(el).textAlign
    );
    console.log(`  Allied column header computed text-align: "${headerTextAlign}"`);
    assert(
      headerTextAlign === 'center',
      `Allied Guilds header has computed text-align: center (got "${headerTextAlign}")`
    );

    // 4c. Hover highlighting works on at least one SVG line
    console.log('\n  Testing hover highlighting on first line group...');
    const firstLineLocator = page.locator('#line-white-blue');
    const firstLineExists = await firstLineLocator.count();
    assert(firstLineExists > 0, 'SVG line #line-white-blue is present');

    if (firstLineExists > 0) {
      await firstLineLocator.hover({ force: true });
      await page.waitForTimeout(150);

      const lineClass = await firstLineLocator.getAttribute('class');
      assert(lineClass && lineClass.includes('highlight'), '#line-white-blue gets .highlight class on hover');

      const colClass = await page.locator('.guild-column--allied').getAttribute('class');
      assert(colClass && colClass.includes('guild-column--has-highlight'), '.guild-column--allied gets .guild-column--has-highlight on line hover');

      // Move away
      await page.mouse.move(640, 800);
      await page.waitForTimeout(150);

      const lineClassAfter = await firstLineLocator.getAttribute('class');
      assert(!lineClassAfter || !lineClassAfter.includes('highlight'), '#line-white-blue highlight clears after mouse leave');
    }

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
