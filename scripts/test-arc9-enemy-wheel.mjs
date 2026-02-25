/**
 * Arc 9 Verification — Enemy Color Wheel (Star Pattern)
 *
 * Verifies the enemy guild column on the session end screen now has
 * an interactive SVG color wheel with star-pattern lines, matching
 * the allied column's pentagon wheel behavior.
 *
 * Prerequisites:
 *   - Run `npm run build` before executing this script.
 *   - http-server is started automatically.
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PORT = 8090;
const BASE_URL = `http://localhost:${PORT}`;

// Allied pairs for regression checks
const ALLIED_PAIRS = [
  ['white', 'blue',   'azorius',  'Azorius'],
  ['blue',  'black',  'dimir',    'Dimir'],
  ['black', 'red',    'rakdos',   'Rakdos'],
  ['red',   'green',  'gruul',    'Gruul'],
  ['green', 'white',  'selesnya', 'Selesnya'],
];

// Enemy pairs: star (non-adjacent) connections
const ENEMY_PAIRS = [
  ['white', 'black',  'orzhov',   'Orzhov'],
  ['blue',  'red',    'izzet',    'Izzet'],
  ['black', 'green',  'golgari',  'Golgari'],
  ['red',   'white',  'boros',    'Boros'],
  ['green', 'blue',   'simic',    'Simic'],
];

let failures = 0;
let passes = 0;

function startServer() {
  return spawn('npx', ['http-server', '.', '-p', String(PORT), '-s', '--cors'], {
    cwd: '/Users/jessitron/code/jessitron/sparrow-deck',
    stdio: 'ignore',
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passes++;
  } else {
    console.error(`  FAIL: ${message}`);
    failures++;
  }
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

/**
 * Navigate to the session end screen with the enemy column locked
 * (no enemyUnlocked in localStorage).
 */
async function getToSessionEndScreen_locked(page) {
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
}

/**
 * Navigate to the session end screen with the enemy column UNLOCKED
 * (enemyUnlocked: true in localStorage).
 */
async function getToSessionEndScreen_unlocked(page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.setItem('sparrow-deck.progression', JSON.stringify({
      enemyUnlocked: true,
      completedSubgroups: ['allied', 'enemy'],
    }));
  });
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
  await page.waitForSelector('.enemy-color-wheel', { timeout: 3000 });
}

async function run() {
  console.log('=== Arc 9 — Enemy Color Wheel (Star Pattern) Verification ===\n');

  const server = startServer();
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });

  try {

    // =========================================================
    // PHASE 1: Allied column still has pentagon wheel (regression)
    // =========================================================
    console.log('\n--- Phase 1: Allied column still has pentagon wheel ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_locked(page);

      const alliedWheel = await page.$('.allied-color-wheel');
      assert(alliedWheel !== null, '.allied-color-wheel SVG present in allied column');

      // All 5 ally-line groups present
      for (const [aId, bId, , name] of ALLIED_PAIRS) {
        const lineEl = await page.$(`#line-${aId}-${bId}`);
        assert(lineEl !== null, `#line-${aId}-${bId} (${name}) present in allied wheel`);
      }

      // Pentagon lines use ally-line / ally-line-vis / ally-line-hit classes
      const firstAllyLine = await page.$('.ally-line');
      assert(firstAllyLine !== null, '.ally-line class present on pentagon line group');

      const firstAllyLineVis = await page.$('.ally-line-vis');
      assert(firstAllyLineVis !== null, '.ally-line-vis class present');

      const firstAllyLineHit = await page.$('.ally-line-hit');
      assert(firstAllyLineHit !== null, '.ally-line-hit class present');

      // Hover on an allied line still works
      await page.locator('#line-white-blue').hover({ force: true });
      await page.waitForTimeout(200);
      const azoriusClass = await page.locator('#line-white-blue').getAttribute('class');
      assert(azoriusClass && azoriusClass.includes('highlight'), 'Allied line gets .highlight on hover (regression)');

      const crestHref = await page.locator('#crest-image').getAttribute('href');
      assert(crestHref === 'images/azorius.png', '#crest-image shows azorius.png on allied hover (regression)');

      // Tap-to-select still works on allied column
      await page.mouse.move(640, 900);
      await page.waitForTimeout(200);
      await page.locator('#line-green-white').click({ force: true });
      await page.waitForTimeout(200);
      const selesnyaSelected = await page.locator('#line-green-white').getAttribute('class');
      assert(selesnyaSelected && selesnyaSelected.includes('highlight'), 'Allied tap-to-select still works (selesnya stays highlighted after click)');

      await page.mouse.move(640, 900);
      await page.waitForTimeout(200);
      const selesnyaStays = await page.locator('#line-green-white').getAttribute('class');
      assert(selesnyaStays && selesnyaStays.includes('highlight'), 'Allied tap selection persists after mouseleave (regression)');

      await page.screenshot({ path: 'scripts/arc9-phase1-allied-regression.png', fullPage: true });
      console.log('  Screenshot: scripts/arc9-phase1-allied-regression.png');

      await page.close();
    }

    // =========================================================
    // PHASE 2: Locked enemy column has no wheel
    // =========================================================
    console.log('\n--- Phase 2: Locked enemy column has no wheel ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_locked(page);

      const enemyLocked = await page.$('.guild-column--locked');
      assert(enemyLocked !== null, 'Enemy column has .guild-column--locked class when not unlocked');

      const enemyWheel = await page.$('.enemy-color-wheel');
      assert(enemyWheel === null, '.enemy-color-wheel is NOT present in locked enemy column');

      const enemyGuildItems = await page.$$('.guild-column--locked .guild-column-item');
      assert(enemyGuildItems.length === 0, 'No guild items in locked enemy column');

      await page.close();
    }

    // =========================================================
    // PHASE 3: Unlocked enemy column has wheel with star lines
    // =========================================================
    console.log('\n--- Phase 3: Unlocked enemy column has star wheel ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_unlocked(page);

      const enemyWheel = await page.$('.enemy-color-wheel');
      assert(enemyWheel !== null, '.enemy-color-wheel SVG present in unlocked enemy column');

      // All 5 enemy-line groups present with correct IDs
      for (const [aId, bId, , name] of ENEMY_PAIRS) {
        const lineEl = await page.$(`#line-${aId}-${bId}`);
        assert(lineEl !== null, `#line-${aId}-${bId} (${name}) present in enemy wheel`);
      }

      // Enemy lines use enemy-line / enemy-line-vis / enemy-line-hit classes
      const firstEnemyLine = await page.$('.enemy-line');
      assert(firstEnemyLine !== null, '.enemy-line class present on star line group');

      const firstEnemyLineVis = await page.$('.enemy-line-vis');
      assert(firstEnemyLineVis !== null, '.enemy-line-vis class present');

      const firstEnemyLineHit = await page.$('.enemy-line-hit');
      assert(firstEnemyLineHit !== null, '.enemy-line-hit class present');

      // 5 enemy guild list items
      const enemyItems = await page.$$('.guild-column--enemy .guild-column-item');
      assert(enemyItems.length === 5, `Enemy column shows 5 guild items (got ${enemyItems.length})`);

      // Enemy guild crest image element exists, initially hidden
      const enemyCrest = await page.$('#crest-image-enemy');
      assert(enemyCrest !== null, '#crest-image-enemy present in enemy SVG');

      const enemyCrestOpacity = await page.locator('#crest-image-enemy').getAttribute('opacity');
      assert(enemyCrestOpacity === '0', '#crest-image-enemy initial opacity is "0"');

      await page.screenshot({ path: 'scripts/arc9-phase3-enemy-wheel.png', fullPage: true });
      console.log('  Screenshot: scripts/arc9-phase3-enemy-wheel.png');

      await page.close();
    }

    // =========================================================
    // PHASE 4: Enemy hover on line highlights line, nodes, list item, shows crest
    // =========================================================
    console.log('\n--- Phase 4: Enemy hover on line ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_unlocked(page);

      for (const [aId, bId, guildId, name] of ENEMY_PAIRS) {
        const lineId = `line-${aId}-${bId}`;
        console.log(`\n  Testing enemy line hover: ${name} (#${lineId})`);

        // Hover the line
        await page.locator(`#${lineId}`).hover({ force: true });
        await page.waitForTimeout(200);

        // Line has .highlight
        const lineClass = await page.locator(`#${lineId}`).getAttribute('class');
        assert(lineClass && lineClass.includes('highlight'), `#${lineId} gets .highlight on hover`);

        // Both endpoint nodes highlighted — scope to enemy SVG to avoid duplicate ID collision
        const nodeA = await page.locator(`.enemy-color-wheel #node-${aId}`).getAttribute('class');
        assert(nodeA && nodeA.includes('highlight'), `#node-${aId} (enemy SVG) gets .highlight on ${name} hover`);

        const nodeB = await page.locator(`.enemy-color-wheel #node-${bId}`).getAttribute('class');
        assert(nodeB && nodeB.includes('highlight'), `#node-${bId} (enemy SVG) gets .highlight on ${name} hover`);

        // Guild list item highlighted
        const listItemClass = await page.locator(`.guild-column--enemy [data-guild-id="${guildId}"]`).getAttribute('class');
        assert(listItemClass && listItemClass.includes('highlight'), `[data-guild-id="${guildId}"] gets .highlight on ${name} line hover`);

        // Crest image shown
        const crestOpacity = await page.locator('#crest-image-enemy').getAttribute('opacity');
        assert(crestOpacity === '1', `#crest-image-enemy opacity "1" on ${name} hover`);

        const crestHref = await page.locator('#crest-image-enemy').getAttribute('href');
        assert(crestHref === `images/${guildId}.png`, `#crest-image-enemy shows ${guildId}.png on ${name} hover (got "${crestHref}")`);

        // Move away — everything clears
        await page.mouse.move(640, 950);
        await page.waitForTimeout(200);

        const lineClassAfter = await page.locator(`#${lineId}`).getAttribute('class');
        assert(!lineClassAfter || !lineClassAfter.includes('highlight'), `#${lineId} .highlight cleared after unhover`);

        const crestOpacityAfter = await page.locator('#crest-image-enemy').getAttribute('opacity');
        assert(crestOpacityAfter === '0', `#crest-image-enemy opacity "0" after unhover of ${name}`);
      }

      await page.screenshot({ path: 'scripts/arc9-phase4-enemy-hover.png', fullPage: true });
      console.log('  Screenshot: scripts/arc9-phase4-enemy-hover.png');

      await page.close();
    }

    // =========================================================
    // PHASE 5: Enemy hover on list item highlights line, nodes, crest
    // =========================================================
    console.log('\n--- Phase 5: Enemy hover on list item ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_unlocked(page);

      for (const [aId, bId, guildId, name] of ENEMY_PAIRS) {
        const lineId = `line-${aId}-${bId}`;
        console.log(`\n  Testing enemy list item hover: ${name}`);

        // Hover the list item
        await page.locator(`.guild-column--enemy [data-guild-id="${guildId}"]`).hover({ force: true });
        await page.waitForTimeout(200);

        // Line highlighted
        const lineClass = await page.locator(`#${lineId}`).getAttribute('class');
        assert(lineClass && lineClass.includes('highlight'), `#${lineId} gets .highlight on ${name} list item hover`);

        // Both nodes highlighted — scope to enemy SVG to avoid duplicate ID collision
        const nodeA = await page.locator(`.enemy-color-wheel #node-${aId}`).getAttribute('class');
        assert(nodeA && nodeA.includes('highlight'), `#node-${aId} (enemy SVG) gets .highlight on ${name} list item hover`);

        const nodeB = await page.locator(`.enemy-color-wheel #node-${bId}`).getAttribute('class');
        assert(nodeB && nodeB.includes('highlight'), `#node-${bId} (enemy SVG) gets .highlight on ${name} list item hover`);

        // Crest shown
        const crestOpacity = await page.locator('#crest-image-enemy').getAttribute('opacity');
        assert(crestOpacity === '1', `#crest-image-enemy visible on ${name} list hover`);

        const crestHref = await page.locator('#crest-image-enemy').getAttribute('href');
        assert(crestHref === `images/${guildId}.png`, `#crest-image-enemy shows ${guildId}.png on ${name} list hover`);

        // Move away — clears
        await page.mouse.move(640, 950);
        await page.waitForTimeout(200);

        const lineClassAfter = await page.locator(`#${lineId}`).getAttribute('class');
        assert(!lineClassAfter || !lineClassAfter.includes('highlight'), `#${lineId} highlight cleared after ${name} list item unhover`);
      }

      await page.close();
    }

    // =========================================================
    // PHASE 6: Enemy tap-to-select — click line persists highlight
    // =========================================================
    console.log('\n--- Phase 6: Enemy tap-to-select ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_unlocked(page);

      // Click izzet line (blue-red)
      const izzetLine = '#line-blue-red';
      await page.locator(izzetLine).click({ force: true });
      await page.waitForTimeout(200);

      const izzetClass = await page.locator(izzetLine).getAttribute('class');
      assert(izzetClass && izzetClass.includes('highlight'), `${izzetLine} highlighted after click`);

      const izzetCrestHref = await page.locator('#crest-image-enemy').getAttribute('href');
      assert(izzetCrestHref === 'images/izzet.png', `#crest-image-enemy shows izzet.png after click (got "${izzetCrestHref}")`);

      // Mouse away — highlight stays
      await page.mouse.move(640, 950);
      await page.waitForTimeout(200);

      const izzetAfterLeave = await page.locator(izzetLine).getAttribute('class');
      assert(izzetAfterLeave && izzetAfterLeave.includes('highlight'), `${izzetLine} highlight STAYS after mouseleave (tap selected)`);

      const izzetCrestAfterLeave = await page.locator('#crest-image-enemy').getAttribute('opacity');
      assert(izzetCrestAfterLeave === '1', `#crest-image-enemy stays visible after mouseleave when selected`);

      await page.screenshot({ path: 'scripts/arc9-phase6-enemy-selected.png', fullPage: true });
      console.log('  Screenshot: scripts/arc9-phase6-enemy-selected.png');

      // Click same line again — deselects
      await page.locator(izzetLine).click({ force: true });
      await page.waitForTimeout(200);

      const izzetDeselected = await page.locator(izzetLine).getAttribute('class');
      assert(!izzetDeselected || !izzetDeselected.includes('highlight'), `${izzetLine} deselected after clicking same line again`);

      const izzetCrestDeselected = await page.locator('#crest-image-enemy').getAttribute('opacity');
      assert(izzetCrestDeselected === '0', `#crest-image-enemy opacity "0" after deselect`);

      await page.close();
    }

    // =========================================================
    // PHASE 7: Enemy deselect by clicking background
    // =========================================================
    console.log('\n--- Phase 7: Enemy deselect by clicking background ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_unlocked(page);

      // Select simic (green-blue)
      await page.locator('#line-green-blue').click({ force: true });
      await page.waitForTimeout(200);

      const simicSelected = await page.locator('#line-green-blue').getAttribute('class');
      assert(simicSelected && simicSelected.includes('highlight'), '#line-green-blue selected before deselect test');

      // Click the enemy column header — outside lines/items
      const enemyHeader = await page.$('.guild-column--enemy .guild-column-header');
      if (enemyHeader) {
        await enemyHeader.click();
      } else {
        await page.locator('.guild-column--enemy').click({ position: { x: 10, y: 10 } });
      }
      await page.waitForTimeout(200);

      const simicAfterBgClick = await page.locator('#line-green-blue').getAttribute('class');
      assert(!simicAfterBgClick || !simicAfterBgClick.includes('highlight'), '#line-green-blue deselected after clicking enemy column background');

      const crestAfterBgClick = await page.locator('#crest-image-enemy').getAttribute('opacity');
      assert(crestAfterBgClick === '0', '#crest-image-enemy opacity "0" after background deselect');

      await page.close();
    }

    // =========================================================
    // PHASE 8: Enemy tap-to-select via list item
    // =========================================================
    console.log('\n--- Phase 8: Enemy tap-to-select via list item ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_unlocked(page);

      const golgariItem = page.locator('.guild-column--enemy [data-guild-id="golgari"]');
      await golgariItem.click({ force: true });
      await page.waitForTimeout(200);

      const golgariItemClass = await golgariItem.getAttribute('class');
      assert(golgariItemClass && golgariItemClass.includes('highlight'), 'Golgari list item highlighted after click');

      const golgariLineClass = await page.locator('#line-black-green').getAttribute('class');
      assert(golgariLineClass && golgariLineClass.includes('highlight'), '#line-black-green highlighted after clicking golgari list item');

      const golgariCrestHref = await page.locator('#crest-image-enemy').getAttribute('href');
      assert(golgariCrestHref === 'images/golgari.png', '#crest-image-enemy shows golgari.png (got "${golgariCrestHref}")');

      // Mouse away — stays selected
      await page.mouse.move(640, 950);
      await page.waitForTimeout(200);

      const golgariAfterLeave = await golgariItem.getAttribute('class');
      assert(golgariAfterLeave && golgariAfterLeave.includes('highlight'), 'Golgari list item selection persists after mouseleave');

      // Click same item to deselect
      await golgariItem.click({ force: true });
      await page.waitForTimeout(200);

      const golgariDeselected = await golgariItem.getAttribute('class');
      assert(!golgariDeselected || !golgariDeselected.includes('highlight'), 'Golgari list item deselected after second click');

      await page.close();
    }

    // =========================================================
    // PHASE 9: Both wheels are independent — allied does not affect enemy
    // =========================================================
    console.log('\n--- Phase 9: Allied and enemy wheels are independent ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_unlocked(page);

      // Select azorius in allied wheel
      await page.locator('#line-white-blue').click({ force: true });
      await page.waitForTimeout(200);

      const azoriusSelected = await page.locator('#line-white-blue').getAttribute('class');
      assert(azoriusSelected && azoriusSelected.includes('highlight'), 'Azorius (allied) selected');

      // Enemy wheel should have nothing highlighted
      const enemyHighlightedLines = await page.$$('.enemy-line.highlight');
      assert(enemyHighlightedLines.length === 0, 'No enemy lines highlighted when allied selection active');

      const enemyCrestOpacity = await page.locator('#crest-image-enemy').getAttribute('opacity');
      assert(enemyCrestOpacity === '0', '#crest-image-enemy not visible when only allied selection active');

      // Now select izzet in enemy wheel
      await page.locator('#line-blue-red').click({ force: true });
      await page.waitForTimeout(200);

      const izzetSelected = await page.locator('#line-blue-red').getAttribute('class');
      assert(izzetSelected && izzetSelected.includes('highlight'), 'Izzet (enemy) selected independently');

      // Allied azorius should still be selected
      const azoriusStillSelected = await page.locator('#line-white-blue').getAttribute('class');
      assert(azoriusStillSelected && azoriusStillSelected.includes('highlight'), 'Allied azorius still selected while enemy izzet is also selected');

      // Both crests visible
      const alliedCrestOpacity = await page.locator('#crest-image').getAttribute('opacity');
      assert(alliedCrestOpacity === '1', '#crest-image (allied) still visible while enemy is selected');

      const enemyCrestOpacity2 = await page.locator('#crest-image-enemy').getAttribute('opacity');
      assert(enemyCrestOpacity2 === '1', '#crest-image-enemy visible after enemy selection');

      // Allied crest still correct
      const alliedCrestHref = await page.locator('#crest-image').getAttribute('href');
      assert(alliedCrestHref === 'images/azorius.png', '#crest-image still shows azorius.png (allied unaffected by enemy)');

      // Enemy crest correct
      const enemyCrestHref = await page.locator('#crest-image-enemy').getAttribute('href');
      assert(enemyCrestHref === 'images/izzet.png', '#crest-image-enemy shows izzet.png');

      await page.screenshot({ path: 'scripts/arc9-phase9-both-selected.png', fullPage: true });
      console.log('  Screenshot: scripts/arc9-phase9-both-selected.png');

      await page.close();
    }

    // =========================================================
    // PHASE 10: Structural checks
    // =========================================================
    console.log('\n--- Phase 10: Structural checks ---\n');

    {
      const page = await context.newPage();
      await getToSessionEndScreen_unlocked(page);

      // Enemy wheel has 5 enemy-line groups
      const enemyLineCount = await page.$$('.enemy-line');
      assert(enemyLineCount.length === 5, `Enemy wheel has exactly 5 .enemy-line groups (got ${enemyLineCount.length})`);

      // Enemy wheel has 5 enemy-line-vis elements
      const enemyLineVisCount = await page.$$('.enemy-line-vis');
      assert(enemyLineVisCount.length === 5, `Enemy wheel has exactly 5 .enemy-line-vis elements (got ${enemyLineVisCount.length})`);

      // No enemy lines accidentally have ally-line class
      const aliasedLines = await page.$$('.allied-color-wheel .enemy-line');
      assert(aliasedLines.length === 0, 'No .enemy-line elements inside .allied-color-wheel');

      const alliedEnemyMix = await page.$$('.enemy-color-wheel .ally-line');
      assert(alliedEnemyMix.length === 0, 'No .ally-line elements inside .enemy-color-wheel');

      // Enemy column header present
      const enemyHeader = await page.textContent('.guild-column--enemy h2');
      assert(enemyHeader === 'Enemy Guilds', `Enemy column h2 is "Enemy Guilds" (got "${enemyHeader}")`);

      // Enemy explanation mentions "opposite sides"
      const enemyExplanation = await page.textContent('.guild-column--enemy .guild-column-explanation');
      assert(enemyExplanation && enemyExplanation.includes('opposite'), `Enemy explanation mentions "opposite" (got "${enemyExplanation?.slice(0, 60)}...")`);

      // Allied wheel not broken: 5 ally-lines
      const alliedLineCount = await page.$$('.ally-line');
      assert(alliedLineCount.length === 5, `Allied wheel still has exactly 5 .ally-line groups (got ${alliedLineCount.length})`);

      // No stuck highlights at end
      const stuckEnemyLines = await page.$$('.enemy-line.highlight');
      assert(stuckEnemyLines.length === 0, 'No stuck .enemy-line.highlight at test start');

      const stuckAllyLines = await page.$$('.ally-line.highlight');
      assert(stuckAllyLines.length === 0, 'No stuck .ally-line.highlight at test start');

      await page.close();
    }

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
