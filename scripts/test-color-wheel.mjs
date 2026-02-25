import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PORT = 8084;
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
  console.log('=== Color Wheel Verification ===\n');

  const server = startServer();
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

    // Start fresh
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
    await page.reload();
    await page.waitForTimeout(500);

    // Verify welcome screen
    const welcomeEl = await page.$('.welcome');
    assert(welcomeEl !== null, 'Welcome screen loads');

    // Start a session
    const startBtn = await page.$('#start-button');
    assert(startBtn !== null, 'Start button present');
    await startBtn.click();
    await page.waitForSelector('.card', { timeout: 5000 });

    // Click through 4 cards
    console.log('\n  Clicking through 4 cards...');
    await clickThroughCards(page, 4);

    // Stop the session
    console.log('\n  Stopping session...');
    await page.waitForSelector('.control-button', { timeout: 5000 });
    const controlBtns = await page.$$('.control-button');
    const stopBtn = controlBtns[controlBtns.length - 1];
    const stopBtnText = await stopBtn.textContent();
    assert(stopBtnText === 'Stop', `Stop button found (got "${stopBtnText}")`);
    await stopBtn.click();

    // Complete self-assessment
    await page.waitForSelector('.self-assessment', { timeout: 3000 });
    const assessBtns = await page.$$('.self-assessment-button');
    assert(assessBtns.length > 0, 'Self-assessment buttons present');
    await assessBtns[1].click();
    await page.waitForTimeout(500);

    // Wait for guild columns
    await page.waitForSelector('.guild-columns', { timeout: 3000 });
    console.log('\n--- Verifying Color Wheel ---\n');

    // =========================================================
    // AC1: Color wheel appears in the Allied Guilds column
    // =========================================================
    const colorWheel = await page.$('.guild-column--allied .allied-color-wheel');
    assert(colorWheel !== null, 'AC1: .allied-color-wheel SVG element is present in the allied column');

    // Verify it is positioned after explanation and before guild list
    const alliedColHtml = await page.$eval('.guild-column--allied', el => el.innerHTML);
    const explanationPos = alliedColHtml.indexOf('guild-column-explanation');
    const wheelPos = alliedColHtml.indexOf('allied-color-wheel');
    const guildListPos = alliedColHtml.indexOf('guild-column-list');
    assert(
      explanationPos < wheelPos && wheelPos < guildListPos,
      `AC1: Color wheel appears between explanation and guild list (positions: explanation=${explanationPos}, wheel=${wheelPos}, guildList=${guildListPos})`
    );

    // =========================================================
    // AC2: 5 mana symbol <image> elements visible
    // =========================================================
    const imageCount = await page.$$eval(
      '.guild-column--allied .allied-color-wheel image',
      imgs => imgs.length
    );
    assert(imageCount === 5, `AC2: Exactly 5 <image> elements inside SVG (got ${imageCount})`);

    // Check all 5 mana symbol sources are present
    const imageSrcs = await page.$$eval(
      '.guild-column--allied .allied-color-wheel image',
      imgs => imgs.map(img => img.getAttribute('href') || img.getAttribute('xlink:href') || '')
    );
    console.log(`  Image hrefs found: ${imageSrcs.join(', ')}`);
    const expectedSrcs = ['images/W.svg', 'images/U.svg', 'images/B.svg', 'images/R.svg', 'images/G.svg'];
    const allImagesPresent = expectedSrcs.every(src => imageSrcs.includes(src));
    assert(
      allImagesPresent,
      `AC2: All 5 mana symbol images present (W, U, B, R, G) — found: ${imageSrcs.join(', ')}`
    );

    // =========================================================
    // AC3: 5 allied lines with class ally-line
    // =========================================================
    const allyLineCount = await page.$$eval(
      '.guild-column--allied .allied-color-wheel line.ally-line',
      lines => lines.length
    );
    assert(allyLineCount === 5, `AC3: Exactly 5 lines with class .ally-line (got ${allyLineCount})`);

    // Verify lines have stroke color (gold/warm colored)
    const lineStrokes = await page.$$eval(
      '.guild-column--allied .allied-color-wheel line.ally-line',
      lines => lines.map(l => l.getAttribute('stroke'))
    );
    console.log(`  Line stroke colors: ${[...new Set(lineStrokes)].join(', ')}`);
    const allGoldStroke = lineStrokes.every(s => s === '#c8b88a');
    assert(allGoldStroke, `AC3: All ally lines have gold stroke color #c8b88a (found: ${[...new Set(lineStrokes)].join(', ')})`);

    // =========================================================
    // AC4: No enemy lines (no class enemy-line) anywhere in allied column
    // =========================================================
    const enemyLineCount = await page.$$eval(
      '.guild-column--allied line.enemy-line',
      lines => lines.length
    );
    assert(enemyLineCount === 0, `AC4: No .enemy-line elements in the allied column (found ${enemyLineCount})`);

    // Also confirm no pentagram diagonals — only 5 lines total
    const totalLineCount = await page.$$eval(
      '.guild-column--allied .allied-color-wheel line',
      lines => lines.length
    );
    assert(totalLineCount === 5, `AC4: Total line count in SVG is 5 (pentagon only, no diagonals) — got ${totalLineCount}`);

    // =========================================================
    // AC5: Layout — wheel is reasonably sized and centered
    // =========================================================
    const wheelBbox = await page.$eval('.guild-column--allied .allied-color-wheel', svg => {
      const rect = svg.getBoundingClientRect();
      return { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
    });
    console.log(`  SVG bounding box: ${JSON.stringify(wheelBbox)}`);
    assert(
      wheelBbox.width > 50,
      `AC5: SVG has non-trivial width (${wheelBbox.width}px > 50px)`
    );
    assert(
      wheelBbox.height > 50,
      `AC5: SVG has non-trivial height (${wheelBbox.height}px > 50px)`
    );
    assert(
      wheelBbox.width <= 600,
      `AC5: SVG width is not excessively large (${wheelBbox.width}px <= 600px)`
    );

    // Check the SVG viewBox attribute
    const viewBox = await page.$eval('.guild-column--allied .allied-color-wheel', svg => svg.getAttribute('viewBox'));
    assert(viewBox === '0 0 400 400', `AC5: SVG has correct viewBox "0 0 400 400" (got "${viewBox}")`);

    // =========================================================
    // AC6: Both columns still display correctly
    // =========================================================
    const alliedCol = await page.$('.guild-column--allied');
    assert(alliedCol !== null, 'AC6: Allied column is present');

    const alliedHeader = await page.$eval('.guild-column--allied h2', el => el.textContent);
    assert(alliedHeader === 'Allied Guilds', `AC6: Allied column header is "Allied Guilds" (got "${alliedHeader}")`);

    const alliedGuildItems = await page.$$('.guild-column--allied .combo-summary-name');
    assert(alliedGuildItems.length === 5, `AC6: Allied column shows 5 guild items (got ${alliedGuildItems.length})`);

    const enemyCol = await page.$('.guild-column--enemy');
    assert(enemyCol !== null, 'AC6: Enemy column is present');

    const enemyLocked = await page.$('.guild-column--locked');
    assert(enemyLocked !== null, 'AC6: Enemy column is locked (.guild-column--locked class present)');

    const enemyTeaserText = await page.$eval('.guild-column--enemy .guild-column-explanation', el => el.textContent);
    assert(
      enemyTeaserText === 'Five more combinations. Ready when you are.',
      `AC6: Enemy column teaser text correct (got "${enemyTeaserText}")`
    );

    // Take screenshot
    await page.screenshot({ path: 'scripts/color-wheel-screenshot.png', fullPage: true });
    console.log('\n  Screenshot saved: scripts/color-wheel-screenshot.png');

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
