/**
 * Arc 59 verification: Combos link in hamburger menu
 *
 * What changed:
 * - A "Combos" link (<a href="/combo/">Combos</a>) was added to the hamburger menu in src/ui/menu.ts
 * - It appears between "Levels" and "About"
 * - APP_VERSION bumped to 0.39.0
 *
 * Acceptance Criteria:
 * 1. The hamburger menu contains a "Combos" link
 * 2. The link navigates to /combo/
 * 3. The link appears between "Levels" and "About"
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const EXPECTED_VERSION = '0.39.0';

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

async function openMenu(page) {
  const menuBtn = page.locator('[aria-label="Menu"], button[aria-label*="menu" i]').first();
  await menuBtn.click();
  await sleep(300);
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // --- Phase 1: Combos link is present in the menu ---
    console.log('\nPhase 1 — Hamburger menu contains a "Combos" link');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForLoadState('networkidle');

      await openMenu(page);

      const combosLink = page.locator('a[href="/combo/"]');
      const count = await combosLink.count();
      assert(count > 0, 'A link with href="/combo/" is present in the menu');

      if (count > 0) {
        const text = await combosLink.first().innerText();
        assert(text.trim() === 'Combos', `Link text is "Combos" (got: "${text.trim()}")`);
      }

      await page.close();
    }

    // --- Phase 2: Combos link navigates to /combo/ ---
    console.log('\nPhase 2 — Combos link navigates to /combo/');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForLoadState('networkidle');

      await openMenu(page);

      const combosLink = page.locator('a[href="/combo/"]').first();
      const href = await combosLink.getAttribute('href');
      assert(href === '/combo/', `Link href is "/combo/" (got: "${href}")`);

      await page.close();
    }

    // --- Phase 3: Combos link appears between "Levels" and "About" ---
    console.log('\nPhase 3 — Combos link appears between "Levels" and "About"');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForLoadState('networkidle');

      await openMenu(page);

      // Get all nav links in the menu panel
      const menuPanel = page.locator('#settings-panel');
      const allLinks = menuPanel.locator('a');
      const linkTexts = await allLinks.allInnerTexts();

      // Strip whitespace from each link text
      const trimmed = linkTexts.map(t => t.trim());

      const levelsIndex = trimmed.indexOf('Levels');
      const combosIndex = trimmed.indexOf('Combos');
      const aboutIndex = trimmed.indexOf('About');

      assert(levelsIndex !== -1, `"Levels" link found (at index ${levelsIndex})`);
      assert(combosIndex !== -1, `"Combos" link found (at index ${combosIndex})`);
      assert(aboutIndex !== -1, `"About" link found (at index ${aboutIndex})`);

      if (levelsIndex !== -1 && combosIndex !== -1 && aboutIndex !== -1) {
        assert(
          levelsIndex < combosIndex && combosIndex < aboutIndex,
          `"Combos" is between "Levels" (${levelsIndex}) and "About" (${aboutIndex}): Combos at ${combosIndex}`
        );
      }

      await page.close();
    }

    // --- Phase 4: Version is 0.39.0 ---
    console.log('\nPhase 4 — Version is 0.39.0');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForLoadState('networkidle');

      await openMenu(page);

      const bodyText = await page.locator('body').innerText();
      assert(
        bodyText.includes(EXPECTED_VERSION),
        `Page text includes version ${EXPECTED_VERSION}`
      );

      await page.close();
    }

    // --- Phase 5: Menu also shows Combos link on the combo page itself ---
    console.log('\nPhase 5 — Combos link also present in menu on the combo page');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/simic.html`);
      await page.waitForLoadState('networkidle');

      await openMenu(page);

      const combosLink = page.locator('a[href="/combo/"]');
      const count = await combosLink.count();
      assert(count > 0, 'Combos link is present in menu on the combo page too');

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
