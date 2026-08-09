/**
 * Arc 82 verification: College Crests
 *
 * What changed:
 * - 5 Strixhaven college crest SVGs added at images/strixhaven/{id}.svg
 * - End-screen wheel (colleges section): hover/click resolves crest via crestSrcForId()
 *   which returns images/strixhaven/${id}.svg for colleges, images/${id}.png for guilds
 * - Combo pages for colleges emit <img class="combo-guild-logo"> with strixhaven SVG path
 *   and nav crests via <img class="combo-nav-logo">
 *
 * Acceptance criteria:
 * 1. End-screen Colleges column — clicking Silverquill pair shows college crest at correct path
 * 2. End-screen Colleges column — crest href resolves to images/strixhaven/silverquill.svg
 * 3. That SVG file actually returns HTTP 200
 * 4. End-screen Enemy Guilds column — clicking Orzhov pair shows guild crest at images/orzhov.png (regression)
 * 5. Combo silverquill.html — combo-guild-logo src is images/strixhaven/silverquill.svg
 * 6. Combo silverquill.html — combo-guild-logo alt is "Silverquill college crest"
 * 7. Combo silverquill.html — a combo-nav-logo exists with strixhaven crest path
 * 8. Combo orzhov.html — combo-guild-logo src is images/orzhov.png (regression)
 * 9. Combo orzhov.html — combo-guild-logo alt is "Orzhov guild crest" (regression)
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const STORAGE_KEY = 'sparrow-deck.progression';

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: End-screen Colleges column — click Silverquill pair, crest appears
    //
    // Silverquill = white+black = enemy-pair line with id "line-white-black"
    // The colleges column uses the enemy-color wheel (same SVG structure)
    // with the crest image id "crest-image-enemy"
    //
    // We unlock colleges so the column renders with full content.
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: End-screen Colleges wheel — Silverquill crest appears on click ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Unlock colleges so the column renders
      await page.addInitScript((state) => {
        localStorage.setItem(state.key, JSON.stringify(state.value));
      }, {
        key: STORAGE_KEY,
        value: {
          unlockedSubgroups: ['colleges'],
          completedSubgroups: [],
        },
      });

      await page.goto(`${BASE_URL}/end?subgroup=colleges`);
      await page.waitForLoadState('networkidle');
      await sleep(600);

      // Colleges is the last reel section (index 4); loading ?subgroup=colleges makes it
      // the initial visible section. Find the colleges level-section and its SVG wheel.
      const collegesSection = page.locator('.level-section--colleges');
      await collegesSection.waitFor({ timeout: 8000 });

      // Click the Silverquill pair line (white-black enemy pair)
      const whitBlackLine = collegesSection.locator('#line-white-black');
      const lineExists = await whitBlackLine.count();
      assert(lineExists > 0, 'Silverquill pair line (line-white-black) exists in colleges column');

      if (lineExists > 0) {
        await whitBlackLine.click();
        await sleep(300);

        // The crest image id is "crest-image-enemy" (reused for colleges column)
        const crestOpacity = await collegesSection.evaluate(() => {
          const img = document.querySelector('.level-section--colleges #crest-image-enemy');
          return img ? img.getAttribute('opacity') : null;
        });
        assert(crestOpacity === '1', `Colleges crest opacity is 1 after clicking Silverquill pair (got: "${crestOpacity}")`);

        // Check the href attribute
        const crestHref = await collegesSection.evaluate(() => {
          const img = document.querySelector('.level-section--colleges #crest-image-enemy');
          if (!img) return null;
          return img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        });
        console.log(`  Crest href: ${crestHref}`);
        assert(
          crestHref && crestHref.includes('images/strixhaven/silverquill.svg'),
          `Colleges crest href points to images/strixhaven/silverquill.svg (got: "${crestHref}")`,
        );
      }

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: SVG file actually loads (HTTP 200, valid SVG content)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: College SVG files return HTTP 200 with SVG content ===\n');
    {
      const page = await browser.newPage();

      const collegeIds = ['silverquill', 'prismari', 'witherbloom', 'lorehold', 'quandrix'];
      for (const id of collegeIds) {
        const response = await page.request.get(`${BASE_URL}/images/strixhaven/${id}.svg`);
        assert(response.status() === 200, `images/strixhaven/${id}.svg returns HTTP 200`);

        const text = await response.text();
        const isSvg = text.includes('<svg') || text.includes('<?xml');
        assert(isSvg, `images/strixhaven/${id}.svg content looks like SVG`);
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: End-screen Enemy Guilds column — Orzhov crest uses .png (regression)
    //
    // Unlock enemy so that column renders with full content.
    // White+black is Orzhov in the enemy guilds mapping (not Silverquill).
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: End-screen Enemy Guilds column — Orzhov crest is .png (regression) ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Unlock colleges + enemy so both columns render
      await page.addInitScript((state) => {
        localStorage.setItem(state.key, JSON.stringify(state.value));
      }, {
        key: STORAGE_KEY,
        value: {
          unlockedSubgroups: ['colleges', 'allied', 'enemy'],
          completedSubgroups: ['colleges', 'allied'],
        },
      });

      // Navigate to the enemy section directly
      await page.goto(`${BASE_URL}/end?subgroup=enemy`);
      await page.waitForLoadState('networkidle');
      await sleep(600);

      const enemySection = page.locator('.level-section--enemy');
      await enemySection.waitFor({ timeout: 8000 });

      // Click the white-black line (Orzhov in enemy guilds)
      const whiteBlackLine = enemySection.locator('#line-white-black');
      const lineExists = await whiteBlackLine.count();
      assert(lineExists > 0, 'Orzhov pair line (line-white-black) exists in enemy column');

      if (lineExists > 0) {
        await whiteBlackLine.click();
        await sleep(300);

        const crestHref = await enemySection.evaluate(() => {
          const img = document.querySelector('.level-section--enemy #crest-image-enemy');
          if (!img) return null;
          return img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        });
        console.log(`  Enemy (Orzhov) crest href: ${crestHref}`);
        assert(
          crestHref && crestHref.includes('images/orzhov.png'),
          `Enemy Orzhov crest href uses .png path (got: "${crestHref}")`,
        );

        const crestOpacity = await enemySection.evaluate(() => {
          const img = document.querySelector('.level-section--enemy #crest-image-enemy');
          return img ? img.getAttribute('opacity') : null;
        });
        assert(crestOpacity === '1', `Enemy Orzhov crest opacity is 1 on hover (got: "${crestOpacity}")`);
      }

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Combo silverquill.html — combo-guild-logo has correct src and alt
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Combo silverquill.html — guild logo src and alt ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/silverquill.html`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(300);

      const logoSrc = await page.evaluate(() => {
        const img = document.querySelector('img.combo-guild-logo');
        return img ? img.getAttribute('src') : null;
      });
      console.log(`  combo-guild-logo src: ${logoSrc}`);
      assert(
        logoSrc && logoSrc.includes('images/strixhaven/silverquill.svg'),
        `combo/silverquill.html guild logo src is strixhaven SVG (got: "${logoSrc}")`,
      );

      const logoAlt = await page.evaluate(() => {
        const img = document.querySelector('img.combo-guild-logo');
        return img ? img.getAttribute('alt') : null;
      });
      console.log(`  combo-guild-logo alt: ${logoAlt}`);
      assert(
        logoAlt === 'Silverquill college crest',
        `combo/silverquill.html guild logo alt is "Silverquill college crest" (got: "${logoAlt}")`,
      );

      // Check nav logos use strixhaven SVG path (next = Prismari, no prev since Silverquill is first college)
      const navLogoSrcs = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img.combo-nav-logo'));
        return imgs.map(img => img.getAttribute('src'));
      });
      console.log(`  combo-nav-logo srcs: ${JSON.stringify(navLogoSrcs)}`);
      const hasStrixhavenNavLogo = navLogoSrcs.some(src => src && src.includes('images/strixhaven/'));
      assert(hasStrixhavenNavLogo, `combo/silverquill.html has at least one nav logo pointing to strixhaven SVG`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Combo orzhov.html — combo-guild-logo uses .png path (regression)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Combo orzhov.html — guild logo is .png (regression) ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/orzhov.html`);
      await page.waitForLoadState('domcontentloaded');
      await sleep(300);

      const logoSrc = await page.evaluate(() => {
        const img = document.querySelector('img.combo-guild-logo');
        return img ? img.getAttribute('src') : null;
      });
      console.log(`  combo-guild-logo src: ${logoSrc}`);
      assert(
        logoSrc && logoSrc.includes('images/orzhov.png'),
        `combo/orzhov.html guild logo src is .png (got: "${logoSrc}")`,
      );

      const logoAlt = await page.evaluate(() => {
        const img = document.querySelector('img.combo-guild-logo');
        return img ? img.getAttribute('alt') : null;
      });
      console.log(`  combo-guild-logo alt: ${logoAlt}`);
      assert(
        logoAlt === 'Orzhov guild crest',
        `combo/orzhov.html guild logo alt is "Orzhov guild crest" (got: "${logoAlt}")`,
      );

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
    console.error(`\nArc 82 college-crests verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 82 college-crests verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
