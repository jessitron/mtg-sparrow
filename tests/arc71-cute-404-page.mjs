/**
 * Arc 71 verification: Cute 404 page
 *
 * What was created:
 * - 404.html with MTG-themed error page
 * - 404.css with styling including mana color gradient on "404" heading
 * - Five mana pip circles (W, U, B, R, G)
 * - "Lost in the Blind Eternities" heading
 * - "Return to the Multiverse" home link
 * - Links to /combo/ and /about
 * - home-spiral nav element
 *
 * Acceptance Criteria:
 * 1. 404.html loads and renders correctly
 * 2. The "404" text is visible
 * 3. The heading "Lost in the Blind Eternities" is visible
 * 4. Five mana pip circles are visible
 * 5. Home link works (navigates to /)
 * 6. Links to /combo/ and /about are present and correct
 * 7. The home-spiral nav element is present
 * 8. Page uses the site's dark theme (dark background)
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

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // --- Test 1: 404.html loads and renders ---
    console.log('\nTest 1 — 404.html loads and renders');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/404.html`);
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      assert(title.includes('404'), `Page title includes "404" (got: "${title}")`);

      const notFound = await page.locator('.not-found').count();
      assert(notFound > 0, '.not-found container is present');

      await context.close();
    }

    // --- Test 2: "404" number text is visible ---
    console.log('\nTest 2 — "404" number heading is visible');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/404.html`);
      await page.waitForLoadState('networkidle');

      const numberEl = page.locator('.not-found-number');
      const count = await numberEl.count();
      assert(count > 0, '.not-found-number element is present');

      if (count > 0) {
        const text = await numberEl.textContent();
        assert(text.trim() === '404', `"404" number text is correct (got: "${text.trim()}")`);

        const visible = await numberEl.isVisible();
        assert(visible, '.not-found-number is visible');
      }

      await context.close();
    }

    // --- Test 3: "Lost in the Blind Eternities" heading is visible ---
    console.log('\nTest 3 — "Lost in the Blind Eternities" heading is visible');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/404.html`);
      await page.waitForLoadState('networkidle');

      const heading = page.locator('.not-found-heading');
      const count = await heading.count();
      assert(count > 0, '.not-found-heading element is present');

      if (count > 0) {
        const text = await heading.textContent();
        assert(
          text.includes('Blind Eternities'),
          `Heading contains "Blind Eternities" (got: "${text.trim()}")`
        );

        const visible = await heading.isVisible();
        assert(visible, '.not-found-heading is visible');
      }

      await context.close();
    }

    // --- Test 4: Five mana pip circles are visible ---
    console.log('\nTest 4 — Five mana pip circles (W, U, B, R, G) are visible');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/404.html`);
      await page.waitForLoadState('networkidle');

      const pips = page.locator('.mana-pip');
      const count = await pips.count();
      assert(count === 5, `Exactly five mana pip elements are present (got: ${count})`);

      const colors = ['mana-W', 'mana-U', 'mana-B', 'mana-R', 'mana-G'];
      for (const color of colors) {
        const pip = page.locator(`.${color}`);
        const pipCount = await pip.count();
        assert(pipCount > 0, `Mana pip with class ${color} is present`);
      }

      await context.close();
    }

    // --- Test 5: "Return to the Multiverse" home link is present and correct ---
    console.log('\nTest 5 — Home link "Return to the Multiverse" is present and points to /');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/404.html`);
      await page.waitForLoadState('networkidle');

      const homeLink = page.locator('.not-found-home-link');
      const count = await homeLink.count();
      assert(count > 0, '.not-found-home-link element is present');

      if (count > 0) {
        const text = await homeLink.textContent();
        assert(
          text.includes('Return to the Multiverse'),
          `Home link text is correct (got: "${text.trim()}")`
        );

        const href = await homeLink.getAttribute('href');
        assert(href === '/', `Home link href is "/" (got: "${href}")`);

        const visible = await homeLink.isVisible();
        assert(visible, 'Home link is visible');
      }

      await context.close();
    }

    // --- Test 6: Links to /combo/ and /about are present ---
    console.log('\nTest 6 — Links to /combo/ and /about are present and correct');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/404.html`);
      await page.waitForLoadState('networkidle');

      const comboLink = page.locator('a[href="/combo/"]');
      const comboCount = await comboLink.count();
      assert(comboCount > 0, 'Link to /combo/ is present');

      const aboutLink = page.locator('a[href="/about"]');
      const aboutCount = await aboutLink.count();
      assert(aboutCount > 0, 'Link to /about is present');

      await context.close();
    }

    // --- Test 7: home-spiral nav element is present ---
    console.log('\nTest 7 — home-spiral nav element is present');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/404.html`);
      await page.waitForLoadState('networkidle');

      const spiral = page.locator('.home-spiral');
      const count = await spiral.count();
      assert(count > 0, '.home-spiral element is present');

      if (count > 0) {
        const href = await spiral.getAttribute('href');
        assert(href === '/', `.home-spiral href is "/" (got: "${href}")`);
      }

      await context.close();
    }

    // --- Test 8: Page uses dark theme (dark background) ---
    console.log('\nTest 8 — Page uses dark theme (dark background)');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/404.html`);
      await page.waitForLoadState('networkidle');

      const bgColor = await page.evaluate(() => {
        const body = document.body;
        const style = window.getComputedStyle(body);
        return style.backgroundColor;
      });

      // Dark background: RGB values should be low (dark)
      // Parse rgb(r, g, b) format
      const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        assert(luminance < 128, `Page has dark background (luminance: ${Math.round(luminance)}, rgb: ${r},${g},${b})`);
      } else {
        // Background might be transparent/inherited — check if style.css is loaded
        const stylesheetLoaded = await page.locator('link[href="/style.css"]').count();
        assert(stylesheetLoaded > 0, `style.css link is present (bg color: "${bgColor}")`);
      }

      await context.close();
    }

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
