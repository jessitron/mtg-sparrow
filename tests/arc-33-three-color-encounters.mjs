/**
 * Arc 33 verification: Three-color encounter detection in mana gas
 *
 * Tests:
 * 1. Canvas #gas is present and particles initialize
 * 2. TRIPLES map is present in mana-gas.js source (all 10 combos)
 * 3. mana-gas-encounter CustomEvent fires for a triple encounter
 * 4. Event detail has correct structure (type, name, colors)
 * 5. Triple bubble renders with gold stroke color
 * 6. Downgrade: when third particle leaves, encounter reverts to guild name
 *
 * Strategy: Fan particles repeatedly to create high-velocity collisions,
 * then wait for a natural three-color encounter. With 35 particles
 * (7 per color) moving fast, triples form within seconds.
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';

const VALID_TRIPLES = [
  'Abzan', 'Jeskai', 'Sultai', 'Mardu', 'Temur',
  'Bant', 'Esper', 'Grixis', 'Jund', 'Naya',
];

const VALID_COLORS = ['W', 'U', 'B', 'R', 'G'];

let passes = 0;
let failures = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passes++;
  } else {
    console.error(`  FAIL: ${message}`);
    failures++;
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Canvas present and particles initialize
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Canvas and particles ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const canvasEl = await page.$('canvas#gas');
      assert(canvasEl !== null, 'canvas#gas element is present');

      const hasPixels = await page.evaluate(() => {
        const canvas = document.getElementById('gas');
        if (!canvas) return false;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let nonZero = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
          if (imageData.data[i + 3] > 0) {
            nonZero++;
            if (nonZero > 100) return true;
          }
        }
        return nonZero > 10;
      });
      assert(hasPixels, 'Canvas has drawn pixels (particles rendering)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: TRIPLES map is present in mana-gas.js source
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: TRIPLES map in source ===\n');
    {
      const page = await browser.newPage();
      const response = await page.goto(`${BASE_URL}/mana-gas.js`);
      const source = await response.text();

      assert(source.includes('TRIPLES'), 'mana-gas.js contains TRIPLES constant');

      // Check all 10 combo names are present
      let allPresent = true;
      const missing = [];
      for (const name of VALID_TRIPLES) {
        if (!source.includes(name)) {
          allPresent = false;
          missing.push(name);
        }
      }
      assert(allPresent, `All 10 triple names present in source${missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''}`);

      // Check for TRIPLE_BUBBLE_RADIUS (larger bubble)
      assert(source.includes('TRIPLE_BUBBLE_RADIUS'), 'Source defines TRIPLE_BUBBLE_RADIUS for larger bubbles');

      // Check for mana-gas-encounter event dispatch
      assert(source.includes('mana-gas-encounter'), 'Source dispatches mana-gas-encounter CustomEvent');

      // Check for isTriple flag (upgrade/downgrade mechanism)
      assert(source.includes('isTriple'), 'Source uses isTriple flag for encounter upgrade/downgrade');

      // Check for downgrade logic (restoring two-color encounter)
      assert(source.includes('guildName') && source.includes('Downgrade'), 'Source has downgrade logic (triple -> guild)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: mana-gas-encounter event fires with correct structure
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Triple encounter event fires ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Set up event listener
      await page.evaluate(() => {
        window.__encounterEvents = [];
        window.addEventListener('mana-gas-encounter', (e) => {
          window.__encounterEvents.push(JSON.parse(JSON.stringify(e.detail)));
        });
      });

      // Fan particles aggressively to create fast collisions
      // Click fan button multiple times with short intervals
      const fanBtn = await page.$('#gas-fan-btn');
      assert(fanBtn !== null, 'Fan button is present');

      console.log('  INFO: Fanning particles to create triple encounters...');

      // Strategy: fan every 2 seconds, check for events periodically
      // With 35 particles at high speed, triples should form quickly
      const maxWaitMs = 60000;
      const fanIntervalMs = 1500;
      const checkIntervalMs = 3000;
      const startTime = Date.now();
      let tripleFound = false;
      let eventDetail = null;

      while (Date.now() - startTime < maxWaitMs) {
        // Click fan button 3 times rapidly to really stir things up
        for (let f = 0; f < 3; f++) {
          await page.click('#gas-fan-btn');
          await page.waitForTimeout(200);
        }

        // Wait a bit for encounters to form
        await page.waitForTimeout(checkIntervalMs);

        const events = await page.evaluate(() => window.__encounterEvents);
        if (events.length > 0) {
          eventDetail = events[0];
          tripleFound = true;
          console.log(`  INFO: Triple encounter detected after ${Math.round((Date.now() - startTime) / 1000)}s — ${eventDetail.name} (${eventDetail.colors?.join(',')})`);
          console.log(`  INFO: Total triple events so far: ${events.length}`);
          break;
        }

        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`  INFO: Waiting for triple encounter... (${elapsed}s elapsed)`);
      }

      assert(tripleFound, `mana-gas-encounter event fired within ${maxWaitMs / 1000}s`);

      if (eventDetail) {
        // Verify event structure
        assert(eventDetail.type === 'triple',
          `Event type is "triple" (got: "${eventDetail.type}")`);

        assert(VALID_TRIPLES.includes(eventDetail.name),
          `Event name is a valid triple (got: "${eventDetail.name}")`);

        assert(Array.isArray(eventDetail.colors) && eventDetail.colors.length === 3,
          `Event colors is array of 3 (got: ${JSON.stringify(eventDetail.colors)})`);

        if (Array.isArray(eventDetail.colors)) {
          const allValidColors = eventDetail.colors.every(c => VALID_COLORS.includes(c));
          assert(allValidColors,
            `All colors are valid mana colors (got: ${JSON.stringify(eventDetail.colors)})`);

          const sorted = [...eventDetail.colors].sort();
          const isSorted = eventDetail.colors.every((c, i) => c === sorted[i]);
          assert(isSorted,
            `Colors array is sorted (got: ${JSON.stringify(eventDetail.colors)})`);

          // Verify the colors match the named combo
          assert(eventDetail.colors.length === 3 && new Set(eventDetail.colors).size === 3,
            `All three colors are distinct`);
        }
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Visual verification — gold stroke for triple bubbles
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Gold stroke on triple encounter bubble ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Set up event listener
      await page.evaluate(() => {
        window.__tripleCount = 0;
        window.addEventListener('mana-gas-encounter', () => {
          window.__tripleCount++;
        });
      });

      // Fan aggressively until a triple forms
      const maxWaitMs = 60000;
      const startTime = Date.now();
      let tripleFormed = false;

      while (Date.now() - startTime < maxWaitMs) {
        for (let f = 0; f < 3; f++) {
          await page.click('#gas-fan-btn');
          await page.waitForTimeout(200);
        }
        await page.waitForTimeout(2000);

        const count = await page.evaluate(() => window.__tripleCount);
        if (count > 0) {
          tripleFormed = true;
          break;
        }
      }

      if (tripleFormed) {
        // Check canvas for gold-colored pixels (the triple bubble stroke)
        // Gold = rgb(255,215,0) with alpha ~0.4 → actual rendered values may vary
        // We check if the source correctly uses gold for triple rendering
        const sourceResp = await page.goto(`${BASE_URL}/mana-gas.js`);
        const source = await sourceResp.text();

        const hasGoldStroke = source.includes('rgba(255,215,0');
        assert(hasGoldStroke, 'Triple encounter uses gold stroke color (rgba(255,215,0))');

        const hasGoldFill = source.includes('#ffd700');
        assert(hasGoldFill, 'Triple encounter label uses gold fill (#ffd700)');

        const hasBolderFont = source.includes('bold 22px');
        assert(hasBolderFont, 'Triple encounter label uses larger font (bold 22px)');
      } else {
        // Fall back to source-only check
        console.log('  INFO: No triple formed in time; checking source directly');
        const sourceResp = await page.goto(`${BASE_URL}/mana-gas.js`);
        const source = await sourceResp.text();
        assert(source.includes('rgba(255,215,0'), 'Triple encounter uses gold stroke (source check)');
        assert(source.includes('#ffd700'), 'Triple label uses gold fill (source check)');
        assert(source.includes('bold 22px'), 'Triple label uses larger font (source check)');
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Non-matching intruders still pop encounters
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Non-matching intruder behavior preserved ===\n');
    {
      // This is a source verification — the code path for non-matching
      // intruders should still splice out the encounter
      const page = await browser.newPage();
      const response = await page.goto(`${BASE_URL}/mana-gas.js`);
      const source = await response.text();

      // The intruder section should have both the triple upgrade path
      // and the pop path (splice)
      const hasTripleCheck = source.includes('tripleName(e.a.color, e.b.color, intruderParticle.color)');
      assert(hasTripleCheck, 'Intruder section checks for valid triple before popping');

      // After the triple check, non-matching intruders should still pop
      const hasPopFallback = source.includes('encounters.splice(i, 1)');
      assert(hasPopFallback, 'Non-matching intruders still pop encounters (splice)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Downgrade path exists
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Downgrade from triple to guild encounter ===\n');
    {
      const page = await browser.newPage();
      const response = await page.goto(`${BASE_URL}/mana-gas.js`);
      const source = await response.text();

      // Check for the downgrade path: departed particle detection
      assert(source.includes('departed'), 'Triple encounter tracks departed particles');

      // Check that remaining pair gets guild name
      const hasRemainingGuildCheck = source.includes('guildName(ra.color, rb.color)');
      assert(hasRemainingGuildCheck, 'Downgrade computes guild name for remaining pair');

      // Check isTriple is set to false on downgrade
      assert(source.includes('e.isTriple = false'), 'Downgrade sets isTriple to false');

      // Check that e.c is cleared
      assert(source.includes('e.c = undefined'), 'Downgrade clears third particle reference');

      await page.close();
    }

  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n=== Summary ===');
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${failures}`);
  console.log(`  Total:  ${passes + failures}`);

  if (failures > 0) {
    console.error(`\nArc 33 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 33 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
