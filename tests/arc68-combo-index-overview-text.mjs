/**
 * Arc 68 verification: Combo Index Overview Text
 *
 * What changed:
 * - combo/index.html has an improved intro paragraph mentioning "20 combinations"
 * - Each of the four group sections (Allied Guilds, Enemy Guilds, Wedges, Shards)
 *   now has a description paragraph with class .combo-index-group-description
 * - combo.css defines .combo-index-group-description with smaller/lighter styling
 *
 * Acceptance Criteria:
 * 1. The index page loads at /combo/
 * 2. The intro paragraph contains text about "20 combinations"
 * 3. Each of the four group sections has a description paragraph (.combo-index-group-description)
 * 4. All four group headings are present (Allied Guilds, Enemy Guilds, Wedges, Shards)
 * 5. All 20 combo links are still present and functional
 * 6. The description text is visually muted (smaller/lighter than headings)
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
    const context = await browser.newContext();
    const page = await context.newPage();

    // --- Test 1: Page loads ---
    console.log('\nTest 1 — Page loads at /combo/');
    await page.goto(`${BASE_URL}/combo/`);
    await page.waitForLoadState('networkidle');
    assert(page.url().includes('/combo/'), `URL contains /combo/ (got: ${page.url()})`);

    // --- Test 2: Intro paragraph mentions "20 combinations" ---
    console.log('\nTest 2 — Intro paragraph mentions "20 combinations"');
    {
      const introText = await page.locator('.combo-index-intro').textContent();
      assert(
        introText !== null && introText.includes('20 combinations'),
        `Intro paragraph contains "20 combinations" (got: "${introText?.substring(0, 80)}...")`
      );
    }

    // --- Test 3: All four group headings are present ---
    console.log('\nTest 3 — All four group headings are present');
    {
      const headings = await page.locator('.combo-index-group h2').allTextContents();
      assert(headings.includes('Allied Guilds'), `"Allied Guilds" heading is present`);
      assert(headings.includes('Enemy Guilds'), `"Enemy Guilds" heading is present`);
      assert(headings.includes('Wedges'), `"Wedges" heading is present`);
      assert(headings.includes('Shards'), `"Shards" heading is present`);
    }

    // --- Test 4: Each of the four group sections has a description paragraph ---
    console.log('\nTest 4 — Each group section has a .combo-index-group-description paragraph');
    {
      const descriptions = await page.locator('.combo-index-group-description').all();
      assert(
        descriptions.length === 4,
        `Exactly 4 .combo-index-group-description elements found (got: ${descriptions.length})`
      );

      // Verify each has non-empty text
      for (let i = 0; i < descriptions.length; i++) {
        const text = await descriptions[i].textContent();
        assert(
          text !== null && text.trim().length > 0,
          `Group description ${i + 1} has non-empty text`
        );
      }
    }

    // --- Test 5: All 20 combo links are present ---
    console.log('\nTest 5 — All 20 combo links are present');
    {
      const comboLinks = await page.locator('.combo-index-link').all();
      assert(
        comboLinks.length === 20,
        `Exactly 20 combo links found (got: ${comboLinks.length})`
      );

      // Verify all expected combo names are present
      const comboNames = await page.locator('.combo-index-name').allTextContents();
      const expectedCombos = [
        // Allied Guilds
        'Azorius', 'Dimir', 'Rakdos', 'Gruul', 'Selesnya',
        // Enemy Guilds
        'Orzhov', 'Izzet', 'Golgari', 'Boros', 'Simic',
        // Wedges
        'Abzan', 'Jeskai', 'Sultai', 'Mardu', 'Temur',
        // Shards
        'Bant', 'Esper', 'Grixis', 'Jund', 'Naya',
      ];
      for (const name of expectedCombos) {
        assert(comboNames.includes(name), `Combo "${name}" is present in the list`);
      }
    }

    // --- Test 6: Description text is visually muted (smaller/lighter than h2) ---
    console.log('\nTest 6 — Description text is visually muted (smaller font, lighter color)');
    {
      // Check font-size of description vs h2
      const descFontSize = await page.locator('.combo-index-group-description').first().evaluate(el => {
        return parseFloat(getComputedStyle(el).fontSize);
      });
      const h2FontSize = await page.locator('.combo-index-group h2').first().evaluate(el => {
        return parseFloat(getComputedStyle(el).fontSize);
      });
      assert(
        descFontSize < h2FontSize,
        `Description font-size (${descFontSize}px) is smaller than h2 font-size (${h2FontSize}px)`
      );

      // Check that the color is lighter — the CSS sets color: #999 (a grey)
      const descColor = await page.locator('.combo-index-group-description').first().evaluate(el => {
        return getComputedStyle(el).color;
      });
      // rgb(153, 153, 153) == #999999
      // We check that the color value contains grey-ish tones by checking R=G=B channels
      // Parse the rgb() string
      const match = descColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        // A muted/grey color should have relatively equal and mid-range channels
        const isGrey = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
        const isMuted = r < 210; // not pure white
        assert(isGrey && isMuted, `Description text color is muted/grey (got: ${descColor})`);
      } else {
        assert(false, `Could not parse description text color: "${descColor}"`);
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
