import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PORT = 8086;
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

async function run() {
  console.log('=== UI Tweaks Verification ===\n');
  console.log('Checking:');
  console.log('  1. Allied lines are 8px thick (stroke-width="8" on .ally-line-vis)');
  console.log('  2. Column header "Allied Guilds" is center-aligned');
  console.log('  3. Locked enemy column shows only the button (no teaser text), vertically centered\n');

  const server = startServer();
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

    // Clear localStorage for a clean locked state
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
    await page.reload();
    await page.waitForTimeout(500);

    // Start a session
    const startBtn = await page.$('#start-button');
    assert(startBtn !== null, 'Welcome screen present with start button');
    await startBtn.click();
    await page.waitForSelector('.card', { timeout: 5000 });

    // Click through 4+ cards
    console.log('\n  Clicking through 4 cards...');
    await clickThroughCards(page, 4);

    // Click Stop
    console.log('\n  Clicking Stop...');
    await page.waitForSelector('.control-button', { timeout: 5000 });
    const controlBtns = await page.$$('.control-button');
    const stopBtn = controlBtns[controlBtns.length - 1];
    await stopBtn.click();

    // Complete self-assessment
    await page.waitForSelector('.self-assessment', { timeout: 3000 });
    const assessBtns = await page.$$('.self-assessment-button');
    assert(assessBtns.length > 0, 'Self-assessment buttons present');
    await assessBtns[1].click();
    await page.waitForTimeout(500);

    // Wait for guild columns
    await page.waitForSelector('.guild-columns', { timeout: 3000 });
    console.log('\n--- Check 1: Allied line stroke-width ---\n');

    // 1. Check all .ally-line-vis elements have stroke-width="8"
    const alliedLineWidths = await page.$$eval('.ally-line-vis', lines =>
      lines.map(l => l.getAttribute('stroke-width'))
    );
    console.log(`  Found ${alliedLineWidths.length} .ally-line-vis elements: ${alliedLineWidths.join(', ')}`);
    assert(alliedLineWidths.length > 0, `At least one .ally-line-vis element present (found ${alliedLineWidths.length})`);
    const allEight = alliedLineWidths.every(w => w === '8');
    assert(allEight, `All .ally-line-vis elements have stroke-width="8" (got: ${alliedLineWidths.join(', ')})`);

    console.log('\n--- Check 2: Column header center alignment ---\n');

    // 2. Check .guild-column-header has text-align: center (computed style)
    const alliedHeaderExists = await page.$('.guild-column--allied .guild-column-header');
    assert(alliedHeaderExists !== null, '.guild-column-header present in allied column');

    const headerTextAlign = await page.$eval('.guild-column--allied .guild-column-header', el => {
      return window.getComputedStyle(el).textAlign;
    });
    console.log(`  Computed text-align on .guild-column-header: "${headerTextAlign}"`);
    assert(
      headerTextAlign === 'center',
      `Allied Guilds header has computed text-align: center (got "${headerTextAlign}")`
    );

    console.log('\n--- Check 3: Locked enemy column — no teaser text, button only, vertically centered ---\n');

    // 3a. Locked enemy column should have NO <p> elements
    const lockedCol = await page.$('.guild-column--locked');
    assert(lockedCol !== null, 'Locked enemy column present (.guild-column--locked)');

    const pElements = await page.$$('.guild-column--locked p');
    console.log(`  <p> elements in locked column: ${pElements.length}`);
    assert(pElements.length === 0, `Locked enemy column has NO <p> elements (found ${pElements.length})`);

    // 3b. Also check no .guild-column-explanation in locked column
    const explanation = await page.$('.guild-column--locked .guild-column-explanation');
    assert(explanation === null, 'Locked enemy column has no .guild-column-explanation element');

    // 3c. Button should be present
    const enemyBtn = await page.$('.guild-column--locked .next-session-button');
    assert(enemyBtn !== null, 'Locked enemy column has the "Learn enemy guilds" button');
    const enemyBtnText = await enemyBtn?.textContent();
    assert(enemyBtnText === 'Learn enemy guilds', `Button text is "Learn enemy guilds" (got "${enemyBtnText}")`);

    // 3d. Check locked column is vertically centered (justify-content: center via CSS)
    const lockedJustify = await page.$eval('.guild-column--locked', el => {
      return window.getComputedStyle(el).justifyContent;
    });
    const lockedAlignItems = await page.$eval('.guild-column--locked', el => {
      return window.getComputedStyle(el).alignItems;
    });
    console.log(`  Locked column computed justify-content: "${lockedJustify}", align-items: "${lockedAlignItems}"`);
    assert(
      lockedJustify === 'center',
      `Locked column has justify-content: center (got "${lockedJustify}")`
    );
    assert(
      lockedAlignItems === 'center',
      `Locked column has align-items: center (got "${lockedAlignItems}")`
    );

    // 3e. Verify button is roughly vertically centered in the column
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
    const tolerance = colBox.height * 0.15; // within 15% of column height
    console.log(`  Column mid: ${colMid.toFixed(1)}, Button mid: ${btnMid.toFixed(1)}, Offset: ${offset.toFixed(1)}, Tolerance: ${tolerance.toFixed(1)}`);
    assert(
      offset <= tolerance,
      `Button is vertically centered in locked column (offset ${offset.toFixed(1)}px ≤ tolerance ${tolerance.toFixed(1)}px)`
    );

    // Take screenshot
    await page.screenshot({ path: 'scripts/ui-tweaks-screenshot.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/ui-tweaks-screenshot.png');

    // Allow spans to flush
    console.log('\n  Waiting 3s for spans to flush...');
    await page.waitForTimeout(3000);

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
