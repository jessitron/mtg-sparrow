/**
 * Arc 63 verification: "Next Level" button visibility on end screen
 *
 * What changed:
 * - In src/ui/guild-columns.ts, updateNavButtons() now includes 'shards' in the condition
 *   that shows "Next Level" on the bottom nav button. Previously only 'allied', 'enemy',
 *   and 'wedges' were checked.
 *
 * Acceptance Criteria:
 * 1. When the next section is an uncompleted level, the bottom nav button shows "Next Level"
 * 2. This works for all level transitions: allied→enemy, enemy→wedges, wedges→shards, shards→colleges
 * 3. When the next section IS completed, the button should NOT show "Next Level"
 * 4. The colleges→share transition (colleges is the last level) does NOT show "Next Level"
 * 5. The share section (last section) should never trigger "Next Level"
 *
 * The reel sections are ordered: allied (0), enemy (1), wedges (2), shards (3), colleges (4), share (5)
 * localStorage key: 'sparrow-deck.progression'
 *   - unlockedSubgroups: which sections are accessible
 *   - completedSubgroups: which sections have been completed (determines "Next Level" label)
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

/**
 * Open a fresh browser context with the given localStorage progression state.
 * Returns [context, page] — caller must close both when done.
 */
async function openEndPage(browser, completedSubgroups) {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Pass a single argument (the full state object) — Playwright only forwards one arg
  await page.addInitScript((state) => {
    localStorage.setItem(state.key, JSON.stringify(state.value));
  }, {
    key: STORAGE_KEY,
    value: {
      unlockedSubgroups: ['allied', 'enemy', 'wedges', 'shards', 'colleges'],
      completedSubgroups,
    },
  });

  await page.goto(`${BASE_URL}/end`);
  await page.waitForLoadState('networkidle');
  await sleep(300);

  return [context, page];
}

/**
 * Navigate the end page reel to a given section index by clicking the bottom nav button.
 * Sections: 0=allied, 1=enemy, 2=wedges, 3=shards, 4=colleges, 5=share
 */
async function navigateToSection(page, targetIndex) {
  const bottomBtn = page.locator('.reel-nav-btn--bottom');
  let current = 0;
  while (current < targetIndex) {
    await bottomBtn.click();
    await sleep(900); // wait for 600ms scroll animation plus buffer
    current++;
  }
}

/**
 * Get text content of the bottom nav button (empty string if it has no label).
 */
async function getBottomBtnText(page) {
  const bottomBtn = page.locator('.reel-nav-btn--bottom');
  return (await bottomBtn.textContent()).trim();
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // --- Phase 1: No completion data — allied section shows "Next Level" for enemy ---
    console.log('\nPhase 1 — No completion data: allied→enemy shows "Next Level"');
    {
      const [context, page] = await openEndPage(browser, []);

      // At allied (index 0), next is enemy (index 1) — not completed → "Next Level"
      const btnText = await getBottomBtnText(page);
      assert(
        btnText === 'Next Level',
        `At allied section with enemy uncompleted, bottom button shows "Next Level" (got: "${btnText}")`
      );

      await context.close();
    }

    // --- Phase 2: enemy→wedges shows "Next Level" ---
    console.log('\nPhase 2 — enemy section: enemy→wedges shows "Next Level"');
    {
      // allied and enemy completed, wedges/shards not
      const [context, page] = await openEndPage(browser, ['allied', 'enemy']);

      // Navigate to enemy section (index 1)
      await navigateToSection(page, 1);

      // At enemy (index 1), next is wedges (index 2) — not completed → "Next Level"
      const btnText = await getBottomBtnText(page);
      assert(
        btnText === 'Next Level',
        `At enemy section with wedges uncompleted, bottom button shows "Next Level" (got: "${btnText}")`
      );

      await context.close();
    }

    // --- Phase 3: wedges→shards shows "Next Level" (the Arc 63 fix) ---
    console.log('\nPhase 3 — wedges section: wedges→shards shows "Next Level" (Arc 63 fix)');
    {
      // allied, enemy, wedges completed — shards not completed
      const [context, page] = await openEndPage(browser, ['allied', 'enemy', 'wedges']);

      // Navigate to wedges section (index 2)
      await navigateToSection(page, 2);

      // At wedges (index 2), next is shards (index 3) — not completed → "Next Level"
      const btnText = await getBottomBtnText(page);
      assert(
        btnText === 'Next Level',
        `At wedges section with shards uncompleted, bottom button shows "Next Level" (got: "${btnText}")`
      );

      await context.close();
    }

    // --- Phase 4: Completed next section → no "Next Level" label ---
    console.log('\nPhase 4 — When next section is completed, button does NOT show "Next Level"');
    {
      // All sections completed
      const [context, page] = await openEndPage(browser, ['allied', 'enemy', 'wedges', 'shards', 'colleges']);

      // At allied (index 0), next is enemy (index 1) — enemy IS completed
      const btnText = await getBottomBtnText(page);
      assert(
        btnText !== 'Next Level',
        `At allied section with enemy completed, bottom button does NOT show "Next Level" (got: "${btnText}")`
      );

      await context.close();
    }

    // --- Phase 5: Completed shards → no "Next Level" at wedges ---
    console.log('\nPhase 5 — wedges→shards: shards completed → no "Next Level"');
    {
      // All sections completed
      const [context, page] = await openEndPage(browser, ['allied', 'enemy', 'wedges', 'shards', 'colleges']);

      // Navigate to wedges section (index 2)
      await navigateToSection(page, 2);

      // At wedges (index 2), next is shards (index 3) — shards IS completed
      const btnText = await getBottomBtnText(page);
      assert(
        btnText !== 'Next Level',
        `At wedges section with shards completed, bottom button does NOT show "Next Level" (got: "${btnText}")`
      );

      await context.close();
    }

    // --- Phase 6: shards→colleges shows "Next Level" (colleges is now the last level) ---
    console.log('\nPhase 6 — shards section: shards→colleges shows "Next Level"');
    {
      // allied, enemy, wedges, shards completed — colleges not completed
      const [context, page] = await openEndPage(browser, ['allied', 'enemy', 'wedges', 'shards']);

      // Navigate to shards section (index 3)
      await navigateToSection(page, 3);

      // At shards (index 3), next is colleges (index 4) — not completed → "Next Level"
      const btnText = await getBottomBtnText(page);
      assert(
        btnText === 'Next Level',
        `At shards section with colleges uncompleted, bottom button shows "Next Level" (got: "${btnText}")`
      );

      await context.close();
    }

    // --- Phase 7: colleges section → next is share, NOT "Next Level" ---
    console.log('\nPhase 7 — colleges section: next is share, NOT "Next Level"');
    {
      // All levels completed (so we can navigate freely without "Next Level" confusion)
      const [context, page] = await openEndPage(browser, ['allied', 'enemy', 'wedges', 'shards', 'colleges']);

      // Navigate to colleges section (index 4)
      await navigateToSection(page, 4);

      // At colleges (index 4), next is share (index 5) — share is never a "level"
      const btnText = await getBottomBtnText(page);
      assert(
        btnText !== 'Next Level',
        `At colleges section, next is share (not a level), button does NOT show "Next Level" (got: "${btnText}")`
      );

      await context.close();
    }

    // --- Phase 8: Share section (index 5) — never shows "Next Level" ---
    console.log('\nPhase 8 — Share section (last): bottom button hidden or no "Next Level"');
    {
      // Nothing completed — every level would trigger "Next Level" if visible
      const [context, page] = await openEndPage(browser, []);

      // Navigate to share section (index 5)
      await navigateToSection(page, 5);

      // At share (index 5), there's no next section → bottom button hidden
      const bottomBtn = page.locator('.reel-nav-btn--bottom');
      const isHidden = await bottomBtn.evaluate(el => el.classList.contains('reel-nav-btn--hidden'));
      const btnText = await getBottomBtnText(page);

      assert(
        isHidden || btnText !== 'Next Level',
        `At share section (last), bottom button is hidden or does not show "Next Level" (hidden=${isHidden}, text="${btnText}")`
      );

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
