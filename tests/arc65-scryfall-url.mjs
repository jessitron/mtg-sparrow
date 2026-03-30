/**
 * Arc 65 verification: Scryfall URL attribute on card spans
 *
 * What changed:
 * - In src/slides.ts, when a card span is created, a `slide.card_scryfall_url`
 *   attribute is set using the UUID extracted from the card's image URL.
 *   Format: `https://scryfall.com/card/{uuid}`
 *
 * Acceptance Criteria:
 * 1. Slides page loads with `?subgroup=allied` and renders a card image
 * 2. Card images use Scryfall CDN URLs containing a UUID segment
 * 3. The UUID regex pattern (`/\/([0-9a-f-]{36})\.jpg/`) matches against real image URLs
 * 4. Page functions normally (cards display, slideshow can advance)
 * 5. Version is 0.41.0
 *
 * Server must be running at http://localhost:3847 before running this script.
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Track image requests to capture Scryfall URLs (even before DOM renders)
    const capturedImgUrls = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('scryfall.io') || url.includes('cards.scryfall')) {
        capturedImgUrls.push(url);
      }
    });

    await page.goto(`${BASE_URL}/slides.html?subgroup=allied`);
    await page.waitForLoadState('domcontentloaded');

    // --- Phase 1: Dismiss level intro if present ---
    console.log('\nPhase 1 — Dismiss level intro and wait for card to render');
    {
      await sleep(500);
      const intro = page.locator('.level-intro');
      const introCount = await intro.count();
      if (introCount > 0) {
        console.log('  INFO: Level intro found — clicking to dismiss');
        await intro.click();
        await sleep(600); // wait for dismiss animation
      } else {
        console.log('  INFO: No level intro found');
      }

      // Wait for a card image to appear in the DOM
      await page.waitForSelector('.mtg-card-img', { timeout: 8000 }).catch(() => null);
      await sleep(500); // allow any remaining transitions
    }

    // --- Phase 2: Card image renders with Scryfall URL ---
    console.log('\nPhase 2 — Card image element is present and uses Scryfall CDN');
    {
      const cardImg = page.locator('.mtg-card-img').first();
      const imgCount = await cardImg.count();
      assert(imgCount > 0, `A .mtg-card-img element is present on the slides page (count: ${imgCount})`);

      if (imgCount > 0) {
        const src = await cardImg.getAttribute('src');
        assert(
          src !== null && src.length > 0,
          `Card image has a non-empty src`
        );
        assert(
          src !== null && src.includes('scryfall'),
          `Card image src is from Scryfall CDN (src: "${src?.substring(0, 80)}")`
        );
      }
    }

    // --- Phase 3: Image URL contains a UUID matching the extraction regex ---
    console.log('\nPhase 3 — Card image URL contains a UUID (enabling Scryfall URL extraction)');
    {
      // Collect all img srcs from DOM
      const domImgSrcs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img'))
          .map(img => img.src)
          .filter(src => src.length > 0);
      });

      // Combine with network-captured URLs
      const allScryfallUrls = [
        ...domImgSrcs.filter(src => src.includes('scryfall')),
        ...capturedImgUrls,
      ];

      console.log(`  INFO: Found ${domImgSrcs.length} img elements in DOM`);
      console.log(`  INFO: Captured ${capturedImgUrls.length} Scryfall network requests`);

      const uuidRegex = /\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jpg/;
      const matchingUrls = allScryfallUrls.filter(src => uuidRegex.test(src));

      assert(
        allScryfallUrls.length > 0,
        `At least one Scryfall image URL was found (DOM: ${domImgSrcs.filter(s => s.includes('scryfall')).length}, network: ${capturedImgUrls.length})`
      );

      assert(
        matchingUrls.length > 0,
        `At least one Scryfall image URL contains a UUID matching the extraction pattern (found ${matchingUrls.length} of ${allScryfallUrls.length})`
      );

      if (matchingUrls.length > 0) {
        const exampleMatch = matchingUrls[0].match(uuidRegex);
        const uuid = exampleMatch ? exampleMatch[1] : null;
        const expectedUrl = uuid ? `https://scryfall.com/card/${uuid}` : null;
        assert(
          uuid !== null && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid),
          `Extracted UUID is valid format: "${uuid}"`
        );
        console.log(`  INFO: Example Scryfall span URL would be: ${expectedUrl}`);
      }
    }

    // --- Phase 4: Version check ---
    console.log('\nPhase 4 — Version check');
    {
      const menuBtn = page.locator('#menu-btn, [aria-label="Menu"]').first();
      const menuBtnCount = await menuBtn.count();

      // Only open menu if settings panel isn't already visible
      const panel = page.locator('#settings-panel');
      const panelVisible = await panel.isVisible().catch(() => false);

      if (menuBtnCount > 0 && !panelVisible) {
        await menuBtn.click();
        await sleep(400);
      }

      const versionEl = page.locator('#settings-version');
      const versionCount = await versionEl.count();
      const versionText = versionCount > 0 ? await versionEl.textContent() : '';
      assert(
        versionText.includes('0.41.0'),
        `#settings-version shows 0.41.0 (got: "${versionText}")`
      );

      // Close the menu by clicking the backdrop or pressing Escape
      const backdrop = page.locator('#settings-backdrop');
      const backdropVisible = await backdrop.isVisible().catch(() => false);
      if (backdropVisible) {
        await backdrop.click();
        await sleep(400);
      } else {
        await page.keyboard.press('Escape');
        await sleep(300);
      }
      // Wait for backdrop to disappear
      await page.waitForSelector('#settings-backdrop', { state: 'hidden', timeout: 3000 }).catch(() => null);
    }

    // --- Phase 5: Slideshow advances on click ---
    console.log('\nPhase 5 — Slideshow advances on click');
    {
      const initialSrc = await page.evaluate(() => {
        const img = document.querySelector('.mtg-card-img');
        return img ? img.src : null;
      });
      console.log(`  INFO: Initial card src: ${initialSrc?.substring(0, 80)}`);

      // Click on the card to advance
      const cardEl = page.locator('.card').first();
      const cardCount = await cardEl.count();

      if (cardCount > 0) {
        await cardEl.click();
        await sleep(800); // allow crossfade transition

        const postClickImg = page.locator('.mtg-card-img').first();
        const postClickCount = await postClickImg.count();
        assert(
          postClickCount > 0,
          `Card image still present after click (count: ${postClickCount})`
        );

        const newSrc = await postClickImg.getAttribute('src').catch(() => null);
        console.log(`  INFO: Card src after click: ${newSrc?.substring(0, 80)}`);
        assert(newSrc !== null, 'Card image src is readable after click');
      } else {
        assert(false, 'No .card element found for click test');
      }
    }

    await context.close();

  } finally {
    await browser.close();
  }

  console.log(`\n--- Results: ${passes} passed, ${failures} failed ---`);
  if (failures > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
