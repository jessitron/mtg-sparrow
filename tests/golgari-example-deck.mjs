/**
 * Golgari Example Deck Arc verification
 *
 * What changed:
 * - Renamed edhrecUrl → deckUrl in ExampleDeck type (internal only, no HTML change)
 * - Removed the Golgari flavor text paragraph (class combo-flavor)
 * - Added a Golgari example deck: Ygra, Eater of All — linking to Archidekt
 * - Rebuilt all combo pages
 *
 * Acceptance Criteria:
 * 1. Golgari page loads at /combo/golgari.html
 * 2. No combo-flavor paragraph exists on Golgari page
 * 3. Example Decks section exists (class combo-decks)
 * 4. Commander name "Ygra, Eater of All" is present
 * 5. Deck link points to archidekt.com URL containing "ygra_especially_likes_to_eat_squirrels"
 * 6. Set name "Duskmourn: House of Horror" is present
 * 7. Description text contains "squirrel"
 * 8. Spot-check: Esper page still has its example deck
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

    // --- Test 1: Golgari page loads ---
    console.log('\nTest 1 — Golgari page loads at /combo/golgari.html');
    await page.goto(`${BASE_URL}/combo/golgari.html`);
    await page.waitForLoadState('networkidle');
    assert(
      page.url().includes('golgari'),
      `URL contains "golgari" (got: ${page.url()})`
    );

    // --- Test 2: No combo-flavor paragraph ---
    console.log('\nTest 2 — No combo-flavor paragraph on Golgari page');
    {
      const flavorElements = await page.locator('.combo-flavor').all();
      assert(
        flavorElements.length === 0,
        `No .combo-flavor elements present (found: ${flavorElements.length})`
      );
    }

    // --- Test 3: Example Decks section exists ---
    console.log('\nTest 3 — Example Decks section exists');
    {
      const deckSection = await page.locator('.combo-decks').count();
      assert(deckSection > 0, `.combo-decks section is present`);
    }

    // --- Test 4: Commander name is Ygra, Eater of All ---
    console.log('\nTest 4 — Commander name "Ygra, Eater of All" is present');
    {
      const commanderName = await page.locator('.combo-deck-commander').first().textContent();
      assert(
        commanderName !== null && commanderName.includes('Ygra, Eater of All'),
        `Commander name contains "Ygra, Eater of All" (got: "${commanderName}")`
      );
    }

    // --- Test 5: Deck link points to archidekt.com with expected slug ---
    console.log('\nTest 5 — Deck link points to archidekt.com/ygra_especially_likes_to_eat_squirrels');
    {
      const deckLink = await page.locator('.combo-deck-link').first();
      const href = await deckLink.getAttribute('href');
      assert(
        href !== null && href.includes('archidekt.com'),
        `Deck link points to archidekt.com (got: "${href}")`
      );
      assert(
        href !== null && href.includes('ygra_especially_likes_to_eat_squirrels'),
        `Deck link slug contains "ygra_especially_likes_to_eat_squirrels" (got: "${href}")`
      );
    }

    // --- Test 6: Set name "Duskmourn: House of Horror" is present ---
    console.log('\nTest 6 — Set name "Duskmourn: House of Horror" is present');
    {
      const metaText = await page.locator('.combo-deck-meta').first().textContent();
      assert(
        metaText !== null && metaText.includes('Duskmourn: House of Horror'),
        `Deck meta contains "Duskmourn: House of Horror" (got: "${metaText}")`
      );
    }

    // --- Test 7: Description mentions squirrels ---
    console.log('\nTest 7 — Deck description mentions squirrels');
    {
      const descText = await page.locator('.combo-deck-description').first().textContent();
      assert(
        descText !== null && descText.toLowerCase().includes('squirrel'),
        `Deck description mentions squirrels (got: "${descText}")`
      );
    }

    // --- Test 8: Spot-check — Esper page still has its example deck ---
    console.log('\nTest 8 — Spot-check: Esper page still has an example deck');
    await page.goto(`${BASE_URL}/combo/esper.html`);
    await page.waitForLoadState('networkidle');
    {
      const deckCount = await page.locator('.combo-deck').count();
      assert(
        deckCount > 0,
        `Esper page has at least one .combo-deck element (found: ${deckCount})`
      );

      const espDeckLink = await page.locator('.combo-deck-link').first();
      const espHref = await espDeckLink.getAttribute('href');
      assert(
        espHref !== null && espHref.startsWith('http'),
        `Esper deck link has a valid URL (got: "${espHref}")`
      );
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
