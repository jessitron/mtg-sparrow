/**
 * Crest + Tap-to-Select Verification
 *
 * Verifies two new features on the Allied Guilds color wheel:
 * 1. Guild crest appears in center of pentagon when a guild is highlighted
 * 2. Tap-to-select for mobile — clicking/tapping a line or guild name toggles selection
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PORT = 8088;
const BASE_URL = `http://localhost:${PORT}`;

// Allied pairs: [colorA-id, colorB-id, guild-id, guild-name]
const ALLIED_PAIRS = [
  ['white', 'blue',  'azorius', 'Azorius'],
  ['blue',  'black', 'dimir',   'Dimir'],
  ['black', 'red',   'rakdos',  'Rakdos'],
  ['red',   'green', 'gruul',   'Gruul'],
  ['green', 'white', 'selesnya','Selesnya'],
];

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

async function getToSessionEndScreen(page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
  await page.reload();
  await page.waitForTimeout(500);

  const startBtn = await page.$('#start-button');
  await startBtn.click();
  await page.waitForSelector('.card', { timeout: 5000 });

  await clickThroughCards(page, 4);

  await page.waitForSelector('.control-button', { timeout: 5000 });
  const controlBtns = await page.$$('.control-button');
  const stopBtn = controlBtns[controlBtns.length - 1];
  await stopBtn.click();

  await page.waitForSelector('.self-assessment', { timeout: 3000 });
  const assessBtns = await page.$$('.self-assessment-button');
  await assessBtns[1].click();
  await page.waitForTimeout(600);

  await page.waitForSelector('.guild-columns', { timeout: 3000 });
  await page.waitForSelector('.allied-color-wheel', { timeout: 3000 });
}

async function run() {
  console.log('=== Crest + Tap-to-Select Verification ===\n');

  const server = startServer();
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  try {
    const page = await context.newPage();
    await getToSessionEndScreen(page);

    // =========================================================
    // PHASE 1: Crest element exists in SVG
    // =========================================================
    console.log('\n--- Phase 1: Crest element present ---\n');

    const crestEl = await page.$('#crest-image');
    assert(crestEl !== null, '#crest-image element present in SVG');

    const initialOpacity = await page.locator('#crest-image').getAttribute('opacity');
    assert(initialOpacity === '0', `#crest-image initial opacity is "0" (got "${initialOpacity}")`);

    // =========================================================
    // PHASE 2: Hover tests — crest appears and disappears per guild
    // =========================================================
    console.log('\n--- Phase 2: Hover crest visibility per guild ---\n');

    for (const [aId, bId, guildId, guildName] of ALLIED_PAIRS) {
      const lineId = `line-${aId}-${bId}`;
      console.log(`\n  Testing hover crest: ${guildName} (#${lineId})`);

      // Hover the line group
      await page.locator(`#${lineId}`).hover({ force: true });
      await page.waitForTimeout(200);

      // Check opacity = 1
      const opacity = await page.locator('#crest-image').getAttribute('opacity');
      assert(opacity === '1', `#crest-image opacity becomes "1" on hover of ${guildName} line (got "${opacity}")`);

      // Check href points to correct guild PNG
      const href = await page.locator('#crest-image').getAttribute('href');
      const expectedHref = `images/${guildId}.png`;
      assert(href === expectedHref, `#crest-image href is "${expectedHref}" for ${guildName} (got "${href}")`);

      // Take screenshot on first guild
      if (guildId === 'azorius') {
        await page.screenshot({ path: 'scripts/crest-tap-hover-azorius.png', fullPage: true });
        console.log('  Screenshot saved: scripts/crest-tap-hover-azorius.png');
      }

      // Unhover — move mouse away to a neutral area
      await page.mouse.move(640, 800);
      await page.waitForTimeout(200);

      // Check opacity returns to 0
      const opacityAfter = await page.locator('#crest-image').getAttribute('opacity');
      assert(opacityAfter === '0', `#crest-image opacity returns to "0" after unhover of ${guildName} (got "${opacityAfter}")`);
    }

    // =========================================================
    // PHASE 3: Correct crest per guild (color→guild mapping)
    // =========================================================
    console.log('\n--- Phase 3: Correct crest per guild (color pair mapping) ---\n');

    const colorMappings = [
      { lineId: 'line-white-blue', guildId: 'azorius', desc: 'white+blue → azorius.png' },
      { lineId: 'line-blue-black', guildId: 'dimir',   desc: 'blue+black → dimir.png' },
      { lineId: 'line-black-red',  guildId: 'rakdos',  desc: 'black+red → rakdos.png' },
      { lineId: 'line-red-green',  guildId: 'gruul',   desc: 'red+green → gruul.png' },
      { lineId: 'line-green-white',guildId: 'selesnya',desc: 'green+white → selesnya.png' },
    ];

    for (const { lineId, guildId, desc } of colorMappings) {
      await page.locator(`#${lineId}`).hover({ force: true });
      await page.waitForTimeout(150);
      const href = await page.locator('#crest-image').getAttribute('href');
      assert(href === `images/${guildId}.png`, `${desc} (got "${href}")`);
      await page.mouse.move(640, 800);
      await page.waitForTimeout(150);
    }

    // =========================================================
    // PHASE 4: Click to select — highlight persists after mouseleave
    // =========================================================
    console.log('\n--- Phase 4: Click to select — highlight persists ---\n');

    const [aId0, bId0] = ALLIED_PAIRS[0]; // white, blue
    const lineId0 = `line-${aId0}-${bId0}`;

    // Click the line
    await page.locator(`#${lineId0}`).click({ force: true });
    await page.waitForTimeout(200);

    // Verify it's highlighted
    const lineClass0 = await page.locator(`#${lineId0}`).getAttribute('class');
    assert(lineClass0 && lineClass0.includes('highlight'), `#${lineId0} has .highlight class after click`);

    // Verify crest is visible
    const crestOpacityAfterClick = await page.locator('#crest-image').getAttribute('opacity');
    assert(crestOpacityAfterClick === '1', `#crest-image opacity is "1" after clicking line (got "${crestOpacityAfterClick}")`);

    // Move mouse away — highlight and crest should STAY
    await page.mouse.move(640, 800);
    await page.waitForTimeout(200);

    const lineClassAfterLeave = await page.locator(`#${lineId0}`).getAttribute('class');
    assert(
      lineClassAfterLeave && lineClassAfterLeave.includes('highlight'),
      `#${lineId0} highlight STAYS after mouseleave when selected`
    );

    const crestOpacityAfterLeave = await page.locator('#crest-image').getAttribute('opacity');
    assert(
      crestOpacityAfterLeave === '1',
      `#crest-image stays visible (opacity "1") after mouseleave when selected (got "${crestOpacityAfterLeave}")`
    );

    await page.screenshot({ path: 'scripts/crest-tap-selected-stays.png', fullPage: true });
    console.log('  Screenshot saved: scripts/crest-tap-selected-stays.png');

    // =========================================================
    // PHASE 5: Click same line again to deselect
    // =========================================================
    console.log('\n--- Phase 5: Click same line to deselect ---\n');

    // white-blue is still selected — click again
    await page.locator(`#${lineId0}`).click({ force: true });
    await page.waitForTimeout(200);

    const lineClassDeselected = await page.locator(`#${lineId0}`).getAttribute('class');
    assert(
      !lineClassDeselected || !lineClassDeselected.includes('highlight'),
      `#${lineId0} highlight cleared after clicking same line again`
    );

    const crestOpacityDeselected = await page.locator('#crest-image').getAttribute('opacity');
    assert(
      crestOpacityDeselected === '0',
      `#crest-image opacity returns to "0" after deselecting same line (got "${crestOpacityDeselected}")`
    );

    // =========================================================
    // PHASE 6: Click different line to switch selection
    // =========================================================
    console.log('\n--- Phase 6: Click different line to switch ---\n');

    // Select white-blue first
    await page.locator(`#${lineId0}`).click({ force: true });
    await page.waitForTimeout(200);

    const lineAzoriusSelected = await page.locator(`#${lineId0}`).getAttribute('class');
    assert(lineAzoriusSelected && lineAzoriusSelected.includes('highlight'), `#${lineId0} selected before switching`);

    // Now click black-red (rakdos)
    const lineRakdos = 'line-black-red';
    await page.locator(`#${lineRakdos}`).click({ force: true });
    await page.waitForTimeout(200);

    // Original line should be UNhighlighted
    const azoriusAfterSwitch = await page.locator(`#${lineId0}`).getAttribute('class');
    assert(
      !azoriusAfterSwitch || !azoriusAfterSwitch.includes('highlight'),
      `#${lineId0} (azorius) unhighlighted after switching to rakdos`
    );

    // Rakdos line should be highlighted
    const rakdosHighlight = await page.locator(`#${lineRakdos}`).getAttribute('class');
    assert(
      rakdosHighlight && rakdosHighlight.includes('highlight'),
      `#${lineRakdos} highlighted after click`
    );

    // Crest should show rakdos
    const crestAfterSwitch = await page.locator('#crest-image').getAttribute('href');
    assert(
      crestAfterSwitch === 'images/rakdos.png',
      `#crest-image href is "images/rakdos.png" after switching to rakdos (got "${crestAfterSwitch}")`
    );

    // Deselect rakdos to reset state
    await page.locator(`#${lineRakdos}`).click({ force: true });
    await page.waitForTimeout(200);

    // =========================================================
    // PHASE 7: Click elsewhere to dismiss
    // =========================================================
    console.log('\n--- Phase 7: Click elsewhere to dismiss ---\n');

    // Select azorius
    await page.locator(`#${lineId0}`).click({ force: true });
    await page.waitForTimeout(200);

    const selectedBeforeDismiss = await page.locator(`#${lineId0}`).getAttribute('class');
    assert(selectedBeforeDismiss && selectedBeforeDismiss.includes('highlight'), `#${lineId0} selected before dismiss test`);

    // Click on the allied column background (outside lines/items)
    // Use the column header area which is definitely not a line or item
    const alliedHeader = await page.$('.guild-column--allied .guild-column-header');
    if (alliedHeader) {
      await alliedHeader.click();
    } else {
      // Fallback: click on the column element directly
      await page.locator('.guild-column--allied').click({ position: { x: 10, y: 10 } });
    }
    await page.waitForTimeout(200);

    const lineAfterDismiss = await page.locator(`#${lineId0}`).getAttribute('class');
    assert(
      !lineAfterDismiss || !lineAfterDismiss.includes('highlight'),
      `#${lineId0} highlight cleared after clicking outside lines/items`
    );

    const crestAfterDismiss = await page.locator('#crest-image').getAttribute('opacity');
    assert(
      crestAfterDismiss === '0',
      `#crest-image opacity is "0" after dismissing via outside click (got "${crestAfterDismiss}")`
    );

    // =========================================================
    // PHASE 8: Click guild list item — same select/deselect behavior
    // =========================================================
    console.log('\n--- Phase 8: Click guild list item to select ---\n');

    // Click Dimir list item
    const dimirListItem = page.locator('[data-guild-id="dimir"]');
    await dimirListItem.click({ force: true });
    await page.waitForTimeout(200);

    // Dimir list item should be highlighted
    const dimirItemClass = await dimirListItem.getAttribute('class');
    assert(dimirItemClass && dimirItemClass.includes('highlight'), `[data-guild-id="dimir"] list item highlighted after click`);

    // Dimir line should be highlighted
    const dimirLine = await page.locator('#line-blue-black').getAttribute('class');
    assert(dimirLine && dimirLine.includes('highlight'), `#line-blue-black highlighted after clicking dimir list item`);

    // Dimir crest should appear
    const dimirCrestHref = await page.locator('#crest-image').getAttribute('href');
    assert(dimirCrestHref === 'images/dimir.png', `#crest-image shows dimir.png after clicking dimir list item (got "${dimirCrestHref}")`);

    const dimirCrestOpacity = await page.locator('#crest-image').getAttribute('opacity');
    assert(dimirCrestOpacity === '1', `#crest-image opacity "1" after clicking dimir list item (got "${dimirCrestOpacity}")`);

    await page.screenshot({ path: 'scripts/crest-tap-dimir-list-selected.png', fullPage: true });
    console.log('  Screenshot saved: scripts/crest-tap-dimir-list-selected.png');

    // Move mouse away — highlight should stay
    await page.mouse.move(640, 800);
    await page.waitForTimeout(200);

    const dimirAfterLeave = await dimirListItem.getAttribute('class');
    assert(dimirAfterLeave && dimirAfterLeave.includes('highlight'), `Dimir list item highlight stays after mouseleave when selected`);

    // Click same list item again to deselect
    await dimirListItem.click({ force: true });
    await page.waitForTimeout(200);

    const dimirAfterDeselect = await dimirListItem.getAttribute('class');
    assert(!dimirAfterDeselect || !dimirAfterDeselect.includes('highlight'), `Dimir list item highlight cleared after clicking same item again`);

    // =========================================================
    // PHASE 9: Hover doesn't override selection
    // =========================================================
    console.log('\n--- Phase 9: Hover blocked by active selection ---\n');

    // Select azorius (white-blue) via click
    await page.locator(`#${lineId0}`).click({ force: true });
    await page.waitForTimeout(200);

    const azoriusSelectedForHoverTest = await page.locator(`#${lineId0}`).getAttribute('class');
    assert(azoriusSelectedForHoverTest && azoriusSelectedForHoverTest.includes('highlight'), `Azorius selected for hover-block test`);

    // Now hover a different line (gruul: red-green) — should NOT trigger highlight
    const lineGruul = 'line-red-green';
    await page.locator(`#${lineGruul}`).hover({ force: true });
    await page.waitForTimeout(200);

    // Gruul should NOT be highlighted
    const gruulClass = await page.locator(`#${lineGruul}`).getAttribute('class');
    assert(
      !gruulClass || !gruulClass.includes('highlight'),
      `#${lineGruul} does NOT get .highlight when another pair is already selected (hover blocked)`
    );

    // Azorius should still be highlighted
    const azoriusStillSelected = await page.locator(`#${lineId0}`).getAttribute('class');
    assert(
      azoriusStillSelected && azoriusStillSelected.includes('highlight'),
      `#${lineId0} (azorius) still highlighted while gruul is hovered`
    );

    // Crest should still show azorius (not gruul)
    const crestDuringHoverBlock = await page.locator('#crest-image').getAttribute('href');
    assert(
      crestDuringHoverBlock === 'images/azorius.png',
      `#crest-image still shows azorius.png while gruul hovered (got "${crestDuringHoverBlock}")`
    );

    // Move mouse away and clean up
    await page.mouse.move(640, 800);
    await page.waitForTimeout(200);

    // Deselect azorius to restore clean state
    await page.locator(`#${lineId0}`).click({ force: true });
    await page.waitForTimeout(200);

    // =========================================================
    // PHASE 10: Previous features still intact
    // =========================================================
    console.log('\n--- Phase 10: Previous features intact ---\n');

    // Allied column header
    const headerText = await page.textContent('.guild-column--allied h2');
    assert(headerText === 'Allied Guilds', `Allied column header still "Allied Guilds" (got "${headerText}")`);

    // 5 guild items in allied column
    const alliedItems = await page.$$('.guild-column--allied .guild-column-item');
    assert(alliedItems.length === 5, `Allied column still shows 5 guild items (got ${alliedItems.length})`);

    // Enemy column still locked
    const enemyLocked = await page.$('.guild-column--locked');
    assert(enemyLocked !== null, 'Enemy column still locked (.guild-column--locked present)');

    // 8px visible lines still exist
    for (const [aId, bId, , guildName] of ALLIED_PAIRS) {
      const lineId = `line-${aId}-${bId}`;
      const strokeWidth = await page.locator(`#${lineId} .ally-line-hit`).getAttribute('stroke-width');
      assert(
        strokeWidth !== null && Number(strokeWidth) >= 12,
        `#${lineId} hit-area stroke-width ${strokeWidth}px still >= 12px (${guildName})`
      );
    }

    // No stuck highlights after clean state
    const noStuckLines = await page.$$('.ally-line.highlight');
    assert(noStuckLines.length === 0, 'No stuck .ally-line.highlight at end of tests');

    const noStuckNodes = await page.$$('.color-node.highlight');
    assert(noStuckNodes.length === 0, 'No stuck .color-node.highlight at end of tests');

    const crestFinal = await page.locator('#crest-image').getAttribute('opacity');
    assert(crestFinal === '0', `#crest-image opacity is "0" at end of test suite (got "${crestFinal}")`);

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
