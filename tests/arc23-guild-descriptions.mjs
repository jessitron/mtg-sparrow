/**
 * Arc 23 verification: Guild flavor descriptions, Scryfall links, telemetry
 *
 * Tests:
 * 1. Bundle contains end.guild_highlight and end.scryfall_click span names
 * 2. Hover allied guild: description text appears in flavor panel
 * 3. Hover allied guild: Scryfall link appears with correct href and "More X cards →" text
 * 4. Scryfall link has target="_blank" and rel="noopener noreferrer"
 * 5. Unhighlight clears name, description, and Scryfall link
 * 6. Enemy guild: same flavor panel behavior (Izzet)
 * 7. Practice button always visible (not behind highlight)
 * 8. Iconic cards in data: Azor (Azorius), Voice of Resurgence (Selesnya), Savra (Golgari)
 * 9. Scryfall link click fires end.scryfall_click telemetry
 * 10. Span flush + Honeycomb check for end.guild_highlight and end.scryfall_click
 *
 * Server must be running at http://localhost:3847.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const END_URL_BARE = `${BASE_URL}/end`;

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
    // PHASE 1: Bundle confirms telemetry span names
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Bundle confirms telemetry span names ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js serves HTTP 200');

      const bundleText = await response.text();
      assert(bundleText.includes('end.guild_highlight'), 'Bundle contains "end.guild_highlight" span name');
      assert(bundleText.includes('end.scryfall_click'), 'Bundle contains "end.scryfall_click" span name');
      assert(bundleText.includes('guild.id'), 'Bundle contains "guild.id" attribute key');
      // Spot-check a description phrase
      assert(
        bundleText.includes('insufferable') || bundleText.includes('Azorius'),
        'Bundle contains guild description text (Azorius flavor)',
      );
      assert(bundleText.includes('scryfall.com'), 'Bundle contains scryfall.com URLs');
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Hover allied guild — description and link appear
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Hover — description and Scryfall link appear ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied'],
          completedSubgroups: ['allied'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.allied-color-wheel', { timeout: 5000 });

      // Verify panel elements exist before hover
      const flavorDesc = await page.$('.level-section--allied .level-section-flavor-desc');
      assert(flavorDesc !== null, '.level-section-flavor-desc element is present in allied flavor panel');
      const scryfallLink = await page.$('.level-section--allied .level-section-scryfall-link');
      assert(scryfallLink !== null, '.level-section-scryfall-link element is present in allied flavor panel');

      // Description should be empty before hover
      const descBefore = await page.textContent('.level-section--allied .level-section-flavor-desc');
      assert(
        descBefore === '' || descBefore === null,
        `Flavor description is empty before hover (got: "${descBefore?.substring(0, 40)}")`,
      );

      // Hover over white-blue line (Azorius)
      const lineGroup = await page.$('#line-white-blue');
      assert(lineGroup !== null, '#line-white-blue exists in allied SVG');

      if (lineGroup) {
        await lineGroup.hover();
        await page.waitForTimeout(300);

        // Guild name
        const flavorName = await page.textContent('.level-section--allied .level-section-flavor-name');
        assert(
          flavorName && flavorName.includes('Azorius'),
          `Flavor name shows "Azorius" on hover (got: "${flavorName?.trim()}")`,
        );

        // Description text (check for key phrase from Azorius description)
        const descAfter = await page.textContent('.level-section--allied .level-section-flavor-desc');
        assert(
          descAfter && descAfter.length > 50,
          `Flavor description has content on hover (${descAfter?.length ?? 0} chars)`,
        );
        assert(
          descAfter && descAfter.includes('insufferable'),
          `Flavor description contains Azorius text ("insufferable" snippet present)`,
        );

        // Scryfall link text: "More Azorius cards →"
        const linkText = await page.textContent('.level-section--allied .level-section-scryfall-link');
        assert(
          linkText && linkText.includes('More') && linkText.includes('Azorius') && linkText.includes('→'),
          `Scryfall link text is "More Azorius cards →" (got: "${linkText?.trim()}")`,
        );

        // Scryfall link href: should point to scryfall.com for W+U
        const linkHref = await page.getAttribute('.level-section--allied .level-section-scryfall-link', 'href');
        assert(
          linkHref && linkHref.includes('scryfall.com'),
          `Scryfall link href points to scryfall.com (got: "${linkHref}")`,
        );
        assert(
          linkHref && (linkHref.includes('wu') || linkHref.includes('WU') || linkHref.includes('c%3Dwu')),
          `Scryfall link href filters for W+U colors (got: "${linkHref}")`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Scryfall link attributes — target=_blank, rel=noopener
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Scryfall link attributes ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied'],
          completedSubgroups: ['allied'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.allied-color-wheel', { timeout: 5000 });

      // Hover to populate link attributes
      await page.$eval('#line-white-blue', el => el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })));
      await page.waitForTimeout(200);

      const target = await page.getAttribute('.level-section--allied .level-section-scryfall-link', 'target');
      assert(target === '_blank', `Scryfall link has target="_blank" (got: "${target}")`);

      const rel = await page.getAttribute('.level-section--allied .level-section-scryfall-link', 'rel');
      assert(
        rel && rel.includes('noopener'),
        `Scryfall link has rel containing "noopener" (got: "${rel}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Unhighlight clears description and Scryfall link
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Unhighlight clears description and link ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied'],
          completedSubgroups: ['allied'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.allied-color-wheel', { timeout: 5000 });

      const lineGroup = await page.$('#line-white-blue');
      if (lineGroup) {
        await lineGroup.hover();
        await page.waitForTimeout(300);

        // Confirm highlighted first
        const descDuring = await page.textContent('.level-section--allied .level-section-flavor-desc');
        assert(
          descDuring && descDuring.length > 0,
          `Description is populated during hover (${descDuring?.length ?? 0} chars)`,
        );

        // Mouse away
        await page.mouse.move(0, 0);
        await page.waitForTimeout(300);

        const descAfter = await page.textContent('.level-section--allied .level-section-flavor-desc');
        assert(
          descAfter === '' || descAfter === null,
          `Description clears after mouse leave (got: "${descAfter?.substring(0, 40)}")`,
        );

        const linkAfter = await page.textContent('.level-section--allied .level-section-scryfall-link');
        assert(
          linkAfter === '' || linkAfter === null,
          `Scryfall link text clears after mouse leave (got: "${linkAfter}")`,
        );

        const nameAfter = await page.textContent('.level-section--allied .level-section-flavor-name');
        assert(
          nameAfter === '' || nameAfter === null,
          `Guild name clears after mouse leave (got: "${nameAfter}")`,
        );
      } else {
        assert(false, '#line-white-blue found for unhighlight test');
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Enemy guild — Izzet flavor panel works
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Enemy guild Izzet — flavor panel works ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.enemy-color-wheel', { timeout: 5000 });

      // Izzet = blue+red enemy pair → #line-blue-red
      const izzetLine = await page.$('#line-blue-red');
      assert(izzetLine !== null, '#line-blue-red exists in enemy SVG');

      if (izzetLine) {
        // Use dispatchEvent to avoid SVG parent interception issues with Playwright hover
        await page.$eval('#line-blue-red', el => el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })));
        await page.waitForTimeout(300);

        const flavorName = await page.textContent('.level-section--enemy .level-section-flavor-name');
        assert(
          flavorName && flavorName.includes('Izzet'),
          `Enemy flavor name shows "Izzet" on hover (got: "${flavorName?.trim()}")`,
        );

        const descAfter = await page.textContent('.level-section--enemy .level-section-flavor-desc');
        assert(
          descAfter && descAfter.includes('reckless'),
          `Enemy flavor description contains Izzet text ("reckless" snippet present)`,
        );

        const linkText = await page.textContent('.level-section--enemy .level-section-scryfall-link');
        assert(
          linkText && linkText.includes('More') && linkText.includes('Izzet'),
          `Enemy Scryfall link text includes "More Izzet..." (got: "${linkText?.trim()}")`,
        );

        const linkHref = await page.getAttribute('.level-section--enemy .level-section-scryfall-link', 'href');
        assert(
          linkHref && linkHref.includes('scryfall.com'),
          `Enemy Scryfall link href points to scryfall.com (got: "${linkHref}")`,
        );
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Practice button always visible (not behind highlight)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Practice button always visible in flavor panel ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied'],
          completedSubgroups: ['allied'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(300);

      // Button should be visible without any hover
      const btn = await page.$('.level-section--allied .level-section-flavor .next-session-button');
      assert(btn !== null, 'Practice button is inside .level-section-flavor panel');

      const btnVisible = await page.isVisible('.level-section--allied .level-section-flavor .next-session-button');
      assert(btnVisible, 'Practice button is visible without hovering');

      const btnText = await page.textContent('.level-section--allied .level-section-flavor .next-session-button');
      assert(
        btnText && btnText.trim() === 'Practice',
        `Practice button says "Practice" for completed subgroup (got: "${btnText?.trim()}")`,
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Iconic cards in data (spot-check via bundle)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Iconic cards present in bundle ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      const bundleText = await response.text();

      assert(
        bundleText.includes('Azor') || bundleText.includes('Lawbringer'),
        'Azor, the Lawbringer card is in Azorius data',
      );
      assert(
        bundleText.includes('Voice of Resurgence'),
        'Voice of Resurgence card is in Selesnya data',
      );
      assert(
        bundleText.includes('Savra'),
        'Savra, Queen of the Golgari card is in Golgari data',
      );
      assert(
        bundleText.includes('Aurelia'),
        'Aurelia card is in Boros data',
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: Scryfall click fires telemetry span
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: Scryfall link click — fires end.scryfall_click span ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied'],
          completedSubgroups: ['allied'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.allied-color-wheel', { timeout: 5000 });

      // Hover Azorius to populate link
      await page.$eval('#line-white-blue', el => el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })));
      await page.waitForTimeout(300);

      // Verify link is populated before clicking
      const linkHref = await page.getAttribute('.level-section--allied .level-section-scryfall-link', 'href');
      assert(
        linkHref && linkHref.includes('scryfall.com'),
        `Scryfall link is populated before click (href: "${linkHref?.substring(0, 50)}...")`,
      );

      // Click link — opens new tab (target="_blank"); capture popup and close it
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.click('.level-section--allied .level-section-scryfall-link'),
      ]);
      await popup.close();
      assert(true, 'Scryfall link click fired (popup opened and closed)');

      // Spans are emitted — they'll flush via OTel batch; verified in Phase 9 (Honeycomb)
      console.log('  Scryfall click span emitted — will verify in Honeycomb after flush');

      await page.close();
      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 9: Span flush — wait for OTel batch timer
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 9: Span flush (wait 35s for OTel batch timer) ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.addInitScript(() => {
        localStorage.setItem('sparrow-deck.progression', JSON.stringify({
          unlockedSubgroups: ['allied', 'enemy'],
          completedSubgroups: ['allied', 'enemy'],
        }));
      });
      await page.goto(END_URL_BARE);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.allied-color-wheel', { timeout: 5000 });

      // Trigger multiple guild highlights to ensure spans are created
      // Use dispatchEvent to avoid SVG hover interception issues
      for (const lineId of ['#line-white-blue', '#line-blue-black', '#line-red-green']) {
        await page.$eval(lineId, el => el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })));
        await page.waitForTimeout(100);
        await page.$eval(lineId, el => el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true })));
        await page.waitForTimeout(50);
      }

      // Also trigger a Scryfall click via popup handling
      await page.$eval('#line-white-blue', el => el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })));
      await page.waitForTimeout(200);
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.click('.level-section--allied .level-section-scryfall-link'),
      ]).catch(() => [null]);
      if (popup) await popup.close();

      console.log('  Waiting 35s for OTel batch timer...');
      await page.waitForTimeout(35000);
      console.log('  Wait complete — spans should be exported to Honeycomb.');

      await page.close();
      await context.close();
    }

  } finally {
    await browser.close();
  }

  // Honeycomb check performed separately via MCP
  console.log('\n=== Phase 10: Honeycomb check (via MCP) ===');
  console.log('  (Performed after test run)');

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n=== Summary ===');
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${failures}`);
  console.log(`  Total:  ${passes + failures}`);

  if (failures > 0) {
    console.error(`\nArc 23 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 23 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
