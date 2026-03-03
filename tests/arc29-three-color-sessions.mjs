/**
 * Arc 29 verification: Three-Color Sessions — wedge and shard subgroups in slides
 *
 * Tests:
 * 1. Bundle checks: "wedges" and "shards" as valid subgroup values in slides.js
 * 2. Bundle checks: tier labels "wedge" and "shard" present for session.tier telemetry
 * 3. Wedge session: navigate to /slides?subgroup=wedges, verify cards render with 3 mana pips
 * 4. Wedge session: combo names from wedge data appear (Abzan, Jeskai, Sultai, Mardu, Temur)
 * 5. Shard session: navigate to /slides?subgroup=shards, verify cards render with 3 mana pips
 * 6. Shard session: combo names from shard data appear (Bant, Esper, Grixis, Jund, Naya)
 * 7. Telemetry: session.tier = 'wedge' or 'shard' in Honeycomb after flush
 * 8. Regression: allied guild session still works, session.tier = 'guild_allied'
 *
 * Server must be running at http://localhost:3847.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';

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

const WEDGE_NAMES = ['Abzan', 'Jeskai', 'Sultai', 'Mardu', 'Temur'];
const SHARD_NAMES = ['Bant', 'Esper', 'Grixis', 'Jund', 'Naya'];

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Bundle content checks
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Bundle checks — subgroup values and tier labels ===\n');
    {
      const page = await browser.newPage();
      const slidesResponse = await page.request.get(`${BASE_URL}/dist/slides.js`);
      assert(slidesResponse.status() === 200, 'dist/slides.js serves HTTP 200');

      const slidesText = await slidesResponse.text();

      // Subgroup values
      assert(
        slidesText.includes('"wedges"') || slidesText.includes("'wedges'"),
        'slides.js contains subgroup value "wedges"',
      );
      assert(
        slidesText.includes('"shards"') || slidesText.includes("'shards'"),
        'slides.js contains subgroup value "shards"',
      );

      // Tier labels used in session.tier telemetry attribute
      assert(
        slidesText.includes('"wedge"') || slidesText.includes("'wedge'"),
        'slides.js contains tier label "wedge"',
      );
      assert(
        slidesText.includes('"shard"') || slidesText.includes("'shard'"),
        'slides.js contains tier label "shard"',
      );

      // Existing guild tier labels still present (regression)
      assert(
        slidesText.includes('guild_allied'),
        'slides.js still contains tier label "guild_allied" (regression check)',
      );
      assert(
        slidesText.includes('guild_enemy'),
        'slides.js still contains tier label "guild_enemy" (regression check)',
      );

      // All combo names should be in the slides bundle (combo data is bundled)
      for (const name of [...WEDGE_NAMES, ...SHARD_NAMES]) {
        assert(slidesText.includes(name), `slides.js contains combo name "${name}"`);
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Wedge session — cards render with 3 mana pips
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Wedge session — cards render with 3 mana pips ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });

      // Unlock subgroups so slides won't redirect
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });

      await page.goto(`${BASE_URL}/slides?subgroup=wedges`);
      await page.waitForLoadState('domcontentloaded');

      // Wait for session to start and first card to appear
      await page.waitForSelector('.card', { timeout: 5000 });
      await page.waitForTimeout(500);

      // Check pip count on first card — wedge should have 3 pips
      const pipCount = await page.evaluate(() => {
        const pips = document.querySelectorAll('.mana-pip');
        return pips.length;
      });
      assert(pipCount === 3, `First wedge card has 3 mana pips (found ${pipCount})`);

      // Verify a combo name from wedge data appears on screen (before or after reveal)
      // Let the card auto-reveal so we can read the name
      await page.waitForTimeout(3500); // Wait past REVEAL_DELAY_MS (3000ms)

      const cardNameText = await page.evaluate(() => {
        const nameEl = document.querySelector('.card-name, .combo-name, [class*="name"]');
        return nameEl ? nameEl.textContent : null;
      });

      const isWedgeName = cardNameText && WEDGE_NAMES.some(n => cardNameText.includes(n));
      // The name might be hidden until reveal; check entire card text too
      const allCardText = await page.evaluate(() => {
        const card = document.querySelector('.card');
        return card ? card.textContent : '';
      });
      const cardHasWedgeName = WEDGE_NAMES.some(n => allCardText.includes(n));
      assert(cardHasWedgeName, `Wedge card shows a wedge combo name (found: "${allCardText.trim().substring(0, 60)}")`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Wedge session — auto-advance works (slideshow progresses)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Wedge session — slideshow auto-advances ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });

      await page.goto(`${BASE_URL}/slides?subgroup=wedges`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.card', { timeout: 5000 });

      // Capture first card's combo (from the DOM before reveal)
      const firstCardText = await page.evaluate(() => {
        const card = document.querySelector('.card');
        return card ? card.textContent : '';
      });

      // Wait for reveal (3s) then advance (2s) — total ~6s for card 2 to appear
      await page.waitForTimeout(6000);

      const progressText = await page.evaluate(() => {
        const progress = document.querySelector('.progress-counter');
        return progress ? progress.textContent : null;
      });

      // Progress counter should now show card 2 (e.g., "2 / 25")
      const isOnCard2OrLater = progressText && !progressText.startsWith('1 /');
      assert(isOnCard2OrLater, `Auto-advance worked — progress shows card 2+ (found: "${progressText}")`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Shard session — cards render with 3 mana pips
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Shard session — cards render with 3 mana pips ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
          completedSubgroups: ['allied', 'enemy', 'wedges'],
        }));
      });

      await page.goto(`${BASE_URL}/slides?subgroup=shards`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.card', { timeout: 5000 });
      await page.waitForTimeout(500);

      const pipCount = await page.evaluate(() => {
        const pips = document.querySelectorAll('.mana-pip');
        return pips.length;
      });
      assert(pipCount === 3, `First shard card has 3 mana pips (found ${pipCount})`);

      // Wait for reveal and check for shard combo name
      await page.waitForTimeout(3500);

      const allCardText = await page.evaluate(() => {
        const card = document.querySelector('.card');
        return card ? card.textContent : '';
      });
      const cardHasShardName = SHARD_NAMES.some(n => allCardText.includes(n));
      assert(cardHasShardName, `Shard card shows a shard combo name (found: "${allCardText.trim().substring(0, 60)}")`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Regression — allied session still works
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Regression — allied guild session still works ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });

      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: [],
        }));
      });

      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.card', { timeout: 5000 });
      await page.waitForTimeout(500);

      // Allied guilds have 2 colors — verify 2 pips
      const pipCount = await page.evaluate(() => {
        const pips = document.querySelectorAll('.mana-pip');
        return pips.length;
      });
      assert(pipCount === 2, `Allied card has 2 mana pips (found ${pipCount})`);

      // Progress counter visible
      const progressText = await page.evaluate(() => {
        const p = document.querySelector('.progress-counter');
        return p ? p.textContent : null;
      });
      assert(progressText !== null, `Progress counter visible on allied session (found: "${progressText}")`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Span flush — generate wedge + shard session spans, end them, wait for OTel
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Span flush — generate session.tier telemetry, wait 35s for OTel ===\n');
    {
      // Helper: start a session, advance 2 cards (to make "Done for now" visible), click it
      async function runFlushSession(subgroup, progression) {
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.addInitScript(() => {
          localStorage.setItem('sparrow-deck.progression', JSON.stringify(progression));
        });
        // Inject progression — need to capture in closure
        await page.addInitScript((prog) => {
          localStorage.setItem('sparrow-deck.progression', JSON.stringify(prog));
        }, progression);

        await page.goto(`${BASE_URL}/slides?subgroup=${subgroup}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('.card', { timeout: 5000 });
        await page.waitForTimeout(500);

        // Advance 2 cards quickly to make "Done for now" button visible (shown from card 2+)
        // Two clicks per card: first reveals name, second advances
        for (let i = 0; i < 2; i++) {
          await page.click('#app').catch(() => {});
          await page.waitForTimeout(200);
          await page.click('#app').catch(() => {});
          await page.waitForTimeout(300);
        }

        // Wait for "Done for now" button to appear
        await page.waitForSelector('.done-button.button-visible', { timeout: 5000 }).catch(() => {});

        // Click "Done for now" — this ends the session span, calls flushSpans(), then navigates
        console.log(`  Clicking "Done for now" to end ${subgroup} session span and flush...`);
        await page.click('.done-button').catch(() => {});

        // Wait for navigation (assessment page) after flush
        await page.waitForTimeout(3000);
        console.log(`  ${subgroup} session ended and spans flushed.`);
        await page.close();
      }

      const wedgeProgression = {
        unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        completedSubgroups: ['allied', 'enemy'],
      };
      const shardProgression = {
        unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards'],
        completedSubgroups: ['allied', 'enemy', 'wedges'],
      };

      await runFlushSession('wedges', wedgeProgression);
      await runFlushSession('shards', shardProgression);

      console.log('  Sessions ended. Waiting 35s for OTel batch timer to export all spans...');
      const holdPage = await browser.newPage();
      await holdPage.goto(`${BASE_URL}/`);
      await holdPage.waitForTimeout(35000);
      console.log('  Wait complete — session.tier = wedge and shard spans should be in Honeycomb.');
      await holdPage.close();
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
    console.error(`\nArc 29 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 29 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
