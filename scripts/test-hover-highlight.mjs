/**
 * Hover Highlight Verification
 *
 * Verifies bidirectional hover highlighting on the Allied Guilds section
 * of the session end screen. Tests both SVG line hover and guild list item
 * hover, for all 5 allied pairs.
 */
import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PORT = 8085;
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
  // Load app with clean state
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));
  await page.reload();
  await page.waitForTimeout(500);

  // Start session
  const startBtn = await page.$('#start-button');
  await startBtn.click();
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
  await assessBtns[1].click();
  await page.waitForTimeout(600);

  // Wait for guild columns to appear
  await page.waitForSelector('.guild-columns', { timeout: 3000 });
  await page.waitForSelector('.allied-color-wheel', { timeout: 3000 });
}

async function run() {
  console.log('=== Hover Highlight Verification ===\n');

  const server = startServer();
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  try {
    const page = await context.newPage();
    await getToSessionEndScreen(page);

    console.log('\n--- Phase 1: Layout structure present ---\n');

    const alliedCol = await page.$('.guild-column--allied');
    assert(alliedCol !== null, 'Allied column (.guild-column--allied) is present');

    const svgEl = await page.$('.allied-color-wheel');
    assert(svgEl !== null, 'Allied color wheel SVG (.allied-color-wheel) is present');

    const guildList = await page.$('.guild-column-list');
    assert(guildList !== null, 'Guild list (.guild-column-list) is present');

    // Verify all 5 line groups exist in the SVG
    console.log('\n--- Phase 2: SVG line groups and node elements present ---\n');
    for (const [aId, bId, , guildName] of ALLIED_PAIRS) {
      const lineId = `line-${aId}-${bId}`;
      const lineEl = await page.$(`#${lineId}`);
      assert(lineEl !== null, `Line group #${lineId} present (${guildName})`);

      // Check for visible and hit lines inside the group
      const hitLine = await page.$(`#${lineId} .ally-line-hit`);
      assert(hitLine !== null, `#${lineId} has wide hit-area line (.ally-line-hit)`);

      const visLine = await page.$(`#${lineId} .ally-line-vis`);
      assert(visLine !== null, `#${lineId} has visible line (.ally-line-vis)`);
    }

    // Verify all 5 color nodes exist
    for (const colorId of ['white', 'blue', 'black', 'red', 'green']) {
      const nodeEl = await page.$(`#node-${colorId}`);
      assert(nodeEl !== null, `Color node #node-${colorId} present`);
    }

    // Verify all 5 guild list items exist
    for (const [, , guildId, guildName] of ALLIED_PAIRS) {
      const listItem = await page.$(`[data-guild-id="${guildId}"]`);
      assert(listItem !== null, `Guild list item [data-guild-id="${guildId}"] present (${guildName})`);
    }

    console.log('\n--- Phase 3: No highlights active on initial load ---\n');

    // Verify no highlight classes are active initially
    const hasHighlightCol = await page.$('.guild-column--has-highlight');
    assert(hasHighlightCol === null, 'No .guild-column--has-highlight on initial load');

    const initialHighlightedLine = await page.$('.ally-line.highlight');
    assert(initialHighlightedLine === null, 'No .ally-line.highlight on initial load');

    const initialHighlightedNode = await page.$('.color-node.highlight');
    assert(initialHighlightedNode === null, 'No .color-node.highlight on initial load');

    const initialHighlightedItem = await page.$('.guild-column-item.highlight');
    assert(initialHighlightedItem === null, 'No .guild-column-item.highlight on initial load');

    console.log('\n--- Phase 4: Hover on SVG line groups ---\n');

    let screenshotTaken = false;

    for (const [aId, bId, guildId, guildName] of ALLIED_PAIRS) {
      const lineId = `line-${aId}-${bId}`;
      console.log(`\n  Testing line hover: ${guildName} (${lineId})`);

      // Hover the line group element
      const lineLocator = page.locator(`#${lineId}`);
      await lineLocator.hover({ force: true });
      await page.waitForTimeout(150);

      // Check highlight on the line itself
      const lineClass = await page.locator(`#${lineId}`).getAttribute('class');
      assert(lineClass && lineClass.includes('highlight'), `#${lineId} has .highlight class on hover`);

      // Check highlight on both endpoint nodes
      const nodeAClass = await page.locator(`#node-${aId}`).getAttribute('class');
      assert(nodeAClass && nodeAClass.includes('highlight'), `#node-${aId} has .highlight class when hovering ${guildName} line`);

      const nodeBClass = await page.locator(`#node-${bId}`).getAttribute('class');
      assert(nodeBClass && nodeBClass.includes('highlight'), `#node-${bId} has .highlight class when hovering ${guildName} line`);

      // Check highlight on matching guild list item
      const listItemClass = await page.locator(`[data-guild-id="${guildId}"]`).getAttribute('class');
      assert(listItemClass && listItemClass.includes('highlight'), `[data-guild-id="${guildId}"] has .highlight class when hovering ${guildName} line`);

      // Check that guild-column--has-highlight is set
      const colClass = await page.locator('.guild-column--allied').getAttribute('class');
      assert(colClass && colClass.includes('guild-column--has-highlight'), `.guild-column--allied has .guild-column--has-highlight during ${guildName} line hover`);

      // Take one screenshot during a highlighted state (first pair)
      if (!screenshotTaken) {
        await page.screenshot({ path: 'scripts/hover-highlight-screenshot-line.png', fullPage: true });
        console.log('  Screenshot saved: scripts/hover-highlight-screenshot-line.png');
        screenshotTaken = true;
      }

      // Move away from the line
      await page.mouse.move(640, 800);
      await page.waitForTimeout(150);

      // Verify highlight clears
      const lineClassAfter = await page.locator(`#${lineId}`).getAttribute('class');
      assert(!lineClassAfter || !lineClassAfter.includes('highlight'), `#${lineId} .highlight clears after mouse leave`);

      const colClassAfter = await page.locator('.guild-column--allied').getAttribute('class');
      assert(!colClassAfter || !colClassAfter.includes('guild-column--has-highlight'), `.guild-column--has-highlight clears after leaving ${guildName} line`);

      // Verify no stuck highlights on other nodes
      const stuckNodeA = await page.locator(`#node-${aId}`).getAttribute('class');
      assert(!stuckNodeA || !stuckNodeA.includes('highlight'), `#node-${aId} highlight cleared after leave`);

      const stuckNodeB = await page.locator(`#node-${bId}`).getAttribute('class');
      assert(!stuckNodeB || !stuckNodeB.includes('highlight'), `#node-${bId} highlight cleared after leave`);

      const stuckItem = await page.locator(`[data-guild-id="${guildId}"]`).getAttribute('class');
      assert(!stuckItem || !stuckItem.includes('highlight'), `[data-guild-id="${guildId}"] highlight cleared after leave`);
    }

    console.log('\n--- Phase 5: Hover on guild list items ---\n');

    let listScreenshotTaken = false;

    for (const [aId, bId, guildId, guildName] of ALLIED_PAIRS) {
      const lineId = `line-${aId}-${bId}`;
      console.log(`\n  Testing list item hover: ${guildName} ([data-guild-id="${guildId}"])`);

      // Hover the list item
      const listItemLocator = page.locator(`[data-guild-id="${guildId}"]`);
      await listItemLocator.hover({ force: true });
      await page.waitForTimeout(150);

      // Check highlight on the list item itself
      const listItemClass = await listItemLocator.getAttribute('class');
      assert(listItemClass && listItemClass.includes('highlight'), `[data-guild-id="${guildId}"] has .highlight on hover (${guildName})`);

      // Check highlight on matching line
      const lineClass = await page.locator(`#${lineId}`).getAttribute('class');
      assert(lineClass && lineClass.includes('highlight'), `#${lineId} has .highlight when hovering ${guildName} list item`);

      // Check highlight on both endpoint nodes
      const nodeAClass = await page.locator(`#node-${aId}`).getAttribute('class');
      assert(nodeAClass && nodeAClass.includes('highlight'), `#node-${aId} has .highlight when hovering ${guildName} list item`);

      const nodeBClass = await page.locator(`#node-${bId}`).getAttribute('class');
      assert(nodeBClass && nodeBClass.includes('highlight'), `#node-${bId} has .highlight when hovering ${guildName} list item`);

      // Check guild-column--has-highlight is set
      const colClass = await page.locator('.guild-column--allied').getAttribute('class');
      assert(colClass && colClass.includes('guild-column--has-highlight'), `.guild-column--allied has .guild-column--has-highlight during ${guildName} list hover`);

      // Take one screenshot of list item hover state
      if (!listScreenshotTaken) {
        await page.screenshot({ path: 'scripts/hover-highlight-screenshot-list.png', fullPage: true });
        console.log('  Screenshot saved: scripts/hover-highlight-screenshot-list.png');
        listScreenshotTaken = true;
      }

      // Move away
      await page.mouse.move(640, 800);
      await page.waitForTimeout(150);

      // Verify highlight clears
      const listItemClassAfter = await listItemLocator.getAttribute('class');
      assert(!listItemClassAfter || !listItemClassAfter.includes('highlight'), `[data-guild-id="${guildId}"] .highlight clears after leave`);

      const lineClassAfter = await page.locator(`#${lineId}`).getAttribute('class');
      assert(!lineClassAfter || !lineClassAfter.includes('highlight'), `#${lineId} .highlight clears after leaving ${guildName} list item`);

      const colClassAfter = await page.locator('.guild-column--allied').getAttribute('class');
      assert(!colClassAfter || !colClassAfter.includes('guild-column--has-highlight'), `.guild-column--has-highlight clears after leaving ${guildName} list item`);
    }

    console.log('\n--- Phase 6: No stuck highlights after all hovers ---\n');

    // Final check: no stuck highlights anywhere
    const finalHighlightLines = await page.$$('.ally-line.highlight');
    assert(finalHighlightLines.length === 0, 'No stuck .ally-line.highlight after all tests');

    const finalHighlightNodes = await page.$$('.color-node.highlight');
    assert(finalHighlightNodes.length === 0, 'No stuck .color-node.highlight after all tests');

    const finalHighlightItems = await page.$$('.guild-column-item.highlight');
    assert(finalHighlightItems.length === 0, 'No stuck .guild-column-item.highlight after all tests');

    const finalColHighlight = await page.$('.guild-column--has-highlight');
    assert(finalColHighlight === null, 'No stuck .guild-column--has-highlight after all tests');

    console.log('\n--- Phase 7: Layout integrity after hover testing ---\n');

    // Both columns still render correctly
    const alliedHeader = await page.textContent('.guild-column--allied h2');
    assert(alliedHeader === 'Allied Guilds', `Allied column header still reads "Allied Guilds" (got "${alliedHeader}")`);

    const alliedItems = await page.$$('.guild-column--allied .guild-column-item');
    assert(alliedItems.length === 5, `Allied column still shows 5 guild items (got ${alliedItems.length})`);

    const enemyCol = await page.$('.guild-column--enemy');
    assert(enemyCol !== null, 'Enemy column still present after hover testing');

    console.log('\n--- Phase 8: Wide hitbox verification ---\n');

    // Verify hit-area lines have wide stroke-width (should be 16px)
    for (const [aId, bId, , guildName] of ALLIED_PAIRS) {
      const lineId = `line-${aId}-${bId}`;
      const strokeWidth = await page.locator(`#${lineId} .ally-line-hit`).getAttribute('stroke-width');
      assert(
        strokeWidth !== null && Number(strokeWidth) >= 12,
        `#${lineId} hit-area stroke-width is ${strokeWidth}px (>= 12px for easy hover) (${guildName})`
      );
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
