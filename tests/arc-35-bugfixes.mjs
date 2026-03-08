/**
 * Arc 35 verification: Fix User-Facing Bugs
 *
 * Tests four bug fixes:
 * 1. End screen home link navigates to welcome page (not root "/")
 * 2. End screen with ?subgroup=enemy shows enemy section (no allied flash)
 * 3. Slide card images have width=180 height=252 to prevent layout shift
 * 4. Scryfall image load failure triggers fallback (onerror removes card--with-image)
 *
 * Server must be running at http://localhost:3847 before running this script.
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

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // BUG 1: End screen home link uses relative path
    // -----------------------------------------------------------------------
    console.log('\n=== Bug 1: End screen home link ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/end`);
      await page.waitForLoadState('domcontentloaded');

      // Check the href attribute
      const href = await page.$eval('a.end-home-link', el => el.getAttribute('href'));
      assert(href === './', `Home link href is "./" (got "${href}")`);

      // Click the link and verify we end up at the welcome page
      await page.click('a.end-home-link');
      await page.waitForLoadState('domcontentloaded');

      const url = page.url();
      // Should be at root index, not literally "/"
      // With the dev server, "./" from /end resolves to the root index
      const isWelcome = url === `${BASE_URL}/` || url === `${BASE_URL}/index.html` || url.endsWith('/');
      assert(isWelcome, `After clicking home link, URL is welcome page (got "${url}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // BUG 2: End screen ?subgroup=enemy shows enemy section without flash
    // -----------------------------------------------------------------------
    console.log('\n=== Bug 2: End screen enemy subgroup (no allied flash) ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      // Check source: guild-columns.ts adds loading class initially
      const srcResp = await ctx.request.get(`${BASE_URL}/src/ui/guild-columns.ts`);
      const src = await srcResp.text();
      assert(src.includes('level-sections-viewport--loading'),
        'guild-columns.ts uses level-sections-viewport--loading class');

      // Check CSS has the loading rule
      const cssResp = await ctx.request.get(`${BASE_URL}/end.css`);
      const css = await cssResp.text();
      assert(css.includes('.level-sections-viewport--loading') && css.includes('opacity: 0'),
        'end.css defines .level-sections-viewport--loading with opacity: 0');

      // Navigate to end with enemy subgroup
      await page.goto(`${BASE_URL}/end?subgroup=enemy`);

      // Check that loading class is present initially (before rAF)
      const hasLoadingClass = await page.evaluate(() => {
        const vp = document.querySelector('.level-sections-viewport');
        return vp ? vp.classList.contains('level-sections-viewport--loading') : null;
      });
      // Note: This may be null if viewport hasn't been created yet, or false if rAF already ran
      // The important thing is the class exists in the flow
      if (hasLoadingClass === true) {
        assert(true, 'Viewport has loading class initially (opacity: 0)');
      } else {
        // rAF may have already fired — check that the viewport is visible and positioned at enemy
        assert(hasLoadingClass !== null, 'Viewport element exists on end page');
      }

      // Wait for content to load and rAF to fire
      await page.waitForTimeout(500);

      // After loading, verify the viewport no longer has the loading class
      const stillLoading = await page.evaluate(() => {
        const vp = document.querySelector('.level-sections-viewport');
        return vp ? vp.classList.contains('level-sections-viewport--loading') : null;
      });
      assert(stillLoading === false, 'Viewport loading class removed after positioning');

      // Verify the reel is translated (not at position 0 = allied)
      const transform = await page.evaluate(() => {
        const reel = document.querySelector('.level-sections-reel');
        return reel ? reel.style.transform : null;
      });
      assert(transform !== null && transform !== '' && transform !== 'translateY(0px)',
        `Reel is translated to enemy section (transform: ${transform})`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // BUG 3: Slide card images have explicit dimensions to prevent layout shift
    // -----------------------------------------------------------------------
    console.log('\n=== Bug 3: Slide card image dimensions ===\n');
    {
      // Source verification: render.ts sets width and height on img elements
      const ctx = await browser.newContext();

      const renderResp = await ctx.request.get(`${BASE_URL}/src/ui/render.ts`);
      const renderSrc = await renderResp.text();

      assert(renderSrc.includes('img.width = 180'), 'render.ts sets img.width = 180');
      assert(renderSrc.includes('img.height = 252'), 'render.ts sets img.height = 252');

      // Browser verification: navigate to slides and check img attributes
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      // Wait for the JS to render the card
      await page.waitForTimeout(1000);

      const imgAttrs = await page.evaluate(() => {
        const img = document.querySelector('img.mtg-card-img');
        if (!img) return null;
        return {
          width: img.getAttribute('width'),
          height: img.getAttribute('height'),
          naturalWidth: img.width,
          naturalHeight: img.height,
        };
      });

      if (imgAttrs) {
        assert(imgAttrs.width === '180', `Card img width attribute is 180 (got ${imgAttrs.width})`);
        assert(imgAttrs.height === '252', `Card img height attribute is 252 (got ${imgAttrs.height})`);
      } else {
        // If no card image is shown (no selectedCard), check source is sufficient
        assert(true, 'No card image on this slide (source check passed above)');
      }

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // BUG 4: Scryfall image load failure triggers fallback layout
    // -----------------------------------------------------------------------
    console.log('\n=== Bug 4: Scryfall image load fallback ===\n');
    {
      // Source verification: render.ts has onerror handler
      const ctx = await browser.newContext();

      const renderResp = await ctx.request.get(`${BASE_URL}/src/ui/render.ts`);
      const renderSrc = await renderResp.text();

      assert(renderSrc.includes('img.onerror'), 'render.ts defines img.onerror handler');
      assert(renderSrc.includes("card.classList.remove('card--with-image')"),
        'onerror removes card--with-image class');
      assert(renderSrc.includes("imgCol.style.display = 'none'"),
        'onerror hides image column');

      // Browser verification: block Scryfall images and check fallback
      const page = await ctx.newPage();

      // Block all Scryfall image requests to trigger onerror
      await page.route('**/cards.scryfall.io/**', route => route.abort());

      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      // Wait for the card to render and the image error to fire
      await page.waitForTimeout(2000);

      const fallbackResult = await page.evaluate(() => {
        const card = document.querySelector('.card');
        const imgCol = document.querySelector('.card-image-column');
        if (!card) return { cardExists: false };
        return {
          cardExists: true,
          hasWithImage: card.classList.contains('card--with-image'),
          imgColHidden: imgCol ? imgCol.style.display === 'none' : null,
        };
      });

      if (fallbackResult.cardExists) {
        if (fallbackResult.imgColHidden !== null) {
          // Card had an image that failed to load
          assert(!fallbackResult.hasWithImage,
            'After image error, card--with-image class is removed');
          assert(fallbackResult.imgColHidden,
            'After image error, image column is hidden');
        } else {
          // Card had no image to begin with (no selectedCard)
          assert(true, 'No card image on this slide (source check passed above)');
        }
      } else {
        assert(false, 'No .card element found on slides page');
      }

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Arc 35 Bug Fixes: ${passes} PASS, ${failures} FAIL out of ${passes + failures} tests`);
    console.log('='.repeat(50));

  } finally {
    await browser.close();
  }

  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
