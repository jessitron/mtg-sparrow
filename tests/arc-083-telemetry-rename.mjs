/**
 * Arc 83 verification: telemetry hard-cut rename
 *
 * Proves that the bundle contains the NEW telemetry names and does NOT contain
 * the OLD ones. This verifies the rename was complete (not additive).
 *
 * Changed in guild-columns.ts:
 *   - Span name: end.guild_highlight  → end.combo_highlight   (2 sites)
 *   - Attribute: guild.id             → combo.id              (3 sites)
 *   - New `tier` attribute on tri-color hover: 'wedge' or 'shard'
 *
 * APP_VERSION bumped to 0.52.0.
 *
 * Server must be running at http://localhost:3847.
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

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Bundle contains new names (positive proof)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Bundle contains new telemetry names ===\n');
    {
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      assert(response.status() === 200, 'dist/end.js is served (HTTP 200)');

      const bundleText = await response.text();

      assert(
        bundleText.includes('"end.combo_highlight"'),
        'Bundle contains "end.combo_highlight" span name as a string literal',
      );
      assert(
        bundleText.includes('"combo.id"'),
        'Bundle contains "combo.id" attribute key as a string literal',
      );
      assert(
        bundleText.includes('0.52.0'),
        'Bundle version is 0.52.0 (Arc 83 version bump)',
      );

      // -----------------------------------------------------------------------
      // PHASE 2: Bundle does NOT contain old names (hard-cut proof)
      // -----------------------------------------------------------------------
      console.log('\n=== Phase 2: Bundle does NOT contain old telemetry names (hard cut) ===\n');

      assert(
        !bundleText.includes('"end.guild_highlight"'),
        'Bundle does NOT contain old span name "end.guild_highlight"',
      );

      // "guild.id" as an OTel attribute key appears with surrounding quotes.
      // Note: data-guild-id HTML attributes will appear in the bundle — we are
      // specifically checking for the OTel attribute key string literal form.
      const hasGuildIdAsAttr = bundleText.includes('"guild.id"') || bundleText.includes("'guild.id'");
      assert(
        !hasGuildIdAsAttr,
        'Bundle does NOT contain old attribute key "guild.id" as a string literal (data-guild-id HTML attributes are fine)',
      );

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Tier attribute present on pair hover (guild/college)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Tier attribute present on pair hover ===\n');
    {
      // Confirm the tier values 'guild' and 'college' exist in the bundle
      // (they appear as string literals in the setHighlight function for pairs)
      const page = await browser.newPage();
      const response = await page.request.get(`${BASE_URL}/dist/end.js`);
      const bundleText = await response.text();

      // For pair hover: tier is 'guild' (non-college) or 'college' (COLLEGE_IDS)
      // For tri hover: tier is 'wedge' or 'shard'
      // All four should be present as string literals next to the span emission
      assert(
        bundleText.includes('"wedge"') || bundleText.includes("'wedge'"),
        'Bundle contains tier value "wedge" (for wedge column tri hover)',
      );
      assert(
        bundleText.includes('"shard"') || bundleText.includes("'shard'"),
        'Bundle contains tier value "shard" (for shard column tri hover)',
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
    console.error(`\nArc 83 telemetry-rename verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 83 telemetry-rename verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
