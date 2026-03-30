/**
 * Arc 60 verification: Next/Previous Navigation on Combo Pages
 *
 * What changed:
 * - All 20 combo pages now have prev/next navigation links in a .combo-nav element
 * - Ordering: Allied Guilds → Enemy Guilds → Wedges → Shards
 *   (Azorius, Dimir, Rakdos, Gruul, Selesnya, Orzhov, Izzet, Golgari, Boros, Simic,
 *    Abzan, Jeskai, Sultai, Mardu, Temur, Bant, Esper, Grixis, Jund, Naya)
 *
 * Acceptance Criteria:
 * 1. First page (Azorius) has no previous link but has a next link to Dimir
 * 2. Last page (Naya) has a previous link to Jund but no next link
 * 3. A middle page (Gruul) has both prev and next links with correct combo names
 * 4. All pages have an "All combinations" link to the index
 * 5. Navigation links actually work (clicking next takes you to the right page)
 * 6. Cross-group transition: Simic has next link to Abzan
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
    // --- Phase 1: Azorius (first page) — no prev, next to Dimir ---
    console.log('\nPhase 1 — Azorius: no previous link, next link to Dimir');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/azorius.html`);
      await page.waitForLoadState('networkidle');

      const prevLink = page.locator('.combo-nav-link--prev');
      const nextLink = page.locator('.combo-nav-link--next');

      const prevCount = await prevLink.count();
      assert(prevCount === 0, 'Azorius has no previous link');

      const nextCount = await nextLink.count();
      assert(nextCount === 1, 'Azorius has exactly one next link');

      if (nextCount > 0) {
        const href = await nextLink.getAttribute('href');
        const text = await nextLink.innerText();
        assert(href === 'dimir.html', `Next link points to dimir.html (got: "${href}")`);
        assert(text.includes('Dimir'), `Next link text includes "Dimir" (got: "${text.trim()}")`);
      }

      await page.close();
    }

    // --- Phase 2: Naya (last page) — prev to Jund, no next ---
    console.log('\nPhase 2 — Naya: previous link to Jund, no next link');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/naya.html`);
      await page.waitForLoadState('networkidle');

      const prevLink = page.locator('.combo-nav-link--prev');
      const nextLink = page.locator('.combo-nav-link--next');

      const prevCount = await prevLink.count();
      assert(prevCount === 1, 'Naya has exactly one previous link');

      if (prevCount > 0) {
        const href = await prevLink.getAttribute('href');
        const text = await prevLink.innerText();
        assert(href === 'jund.html', `Previous link points to jund.html (got: "${href}")`);
        assert(text.includes('Jund'), `Previous link text includes "Jund" (got: "${text.trim()}")`);
      }

      const nextCount = await nextLink.count();
      assert(nextCount === 0, 'Naya has no next link');

      await page.close();
    }

    // --- Phase 3: Gruul (middle page) — prev Rakdos, next Selesnya ---
    console.log('\nPhase 3 — Gruul (middle page): has both prev and next links');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/gruul.html`);
      await page.waitForLoadState('networkidle');

      const prevLink = page.locator('.combo-nav-link--prev');
      const nextLink = page.locator('.combo-nav-link--next');

      const prevCount = await prevLink.count();
      assert(prevCount === 1, 'Gruul has a previous link');

      if (prevCount > 0) {
        const href = await prevLink.getAttribute('href');
        const text = await prevLink.innerText();
        assert(href === 'rakdos.html', `Prev link points to rakdos.html (got: "${href}")`);
        assert(text.includes('Rakdos'), `Prev link text includes "Rakdos" (got: "${text.trim()}")`);
      }

      const nextCount = await nextLink.count();
      assert(nextCount === 1, 'Gruul has a next link');

      if (nextCount > 0) {
        const href = await nextLink.getAttribute('href');
        const text = await nextLink.innerText();
        assert(href === 'selesnya.html', `Next link points to selesnya.html (got: "${href}")`);
        assert(text.includes('Selesnya'), `Next link text includes "Selesnya" (got: "${text.trim()}")`);
      }

      await page.close();
    }

    // --- Phase 4: All pages have "All combinations" link ---
    console.log('\nPhase 4 — All combo pages have an "All combinations" link');
    {
      const allCombos = [
        'azorius', 'dimir', 'rakdos', 'gruul', 'selesnya',
        'orzhov', 'izzet', 'golgari', 'boros', 'simic',
        'abzan', 'jeskai', 'sultai', 'mardu', 'temur',
        'bant', 'esper', 'grixis', 'jund', 'naya'
      ];

      const page = await browser.newPage();
      for (const combo of allCombos) {
        await page.goto(`${BASE_URL}/combo/${combo}.html`);
        await page.waitForLoadState('networkidle');

        const indexLink = page.locator('.combo-nav-index');
        const count = await indexLink.count();
        const href = count > 0 ? await indexLink.getAttribute('href') : null;
        const text = count > 0 ? await indexLink.innerText() : null;

        assert(
          count > 0 && href === './' && text && text.includes('All combinations'),
          `${combo}: has "All combinations" link to ./`
        );
      }

      await page.close();
    }

    // --- Phase 5: Clicking next actually navigates to the correct page ---
    console.log('\nPhase 5 — Clicking "next" on Azorius navigates to Dimir');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/azorius.html`);
      await page.waitForLoadState('networkidle');

      const nextLink = page.locator('.combo-nav-link--next');
      await nextLink.click();
      await page.waitForLoadState('networkidle');

      const url = page.url();
      assert(url.includes('dimir'), `After clicking next, URL includes "dimir" (got: "${url}")`);

      const h1 = await page.locator('h1.combo-name').innerText();
      assert(h1.trim() === 'Dimir', `Page heading is "Dimir" (got: "${h1.trim()}")`);

      await page.close();
    }

    // --- Phase 6: Cross-group transition — Simic → Abzan ---
    console.log('\nPhase 6 — Simic (last enemy guild) has next link to Abzan (first wedge)');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/simic.html`);
      await page.waitForLoadState('networkidle');

      const nextLink = page.locator('.combo-nav-link--next');
      const count = await nextLink.count();
      assert(count === 1, 'Simic has a next link');

      if (count > 0) {
        const href = await nextLink.getAttribute('href');
        const text = await nextLink.innerText();
        assert(href === 'abzan.html', `Simic next link points to abzan.html (got: "${href}")`);
        assert(text.includes('Abzan'), `Simic next link text includes "Abzan" (got: "${text.trim()}")`);
      }

      // Also verify clicking it works
      if (count > 0) {
        await nextLink.click();
        await page.waitForLoadState('networkidle');
        const url = page.url();
        assert(url.includes('abzan'), `After clicking next on Simic, URL includes "abzan" (got: "${url}")`);
      }

      await page.close();
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
