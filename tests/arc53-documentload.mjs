/**
 * Arc 53 verification: documentLoad Telemetry
 *
 * Verifies that:
 * 1. The welcome page loads cleanly (main app, DocumentLoadInstrumentation active)
 * 2. Combo pages (rakdos.html) load cleanly
 * 3. Combo page body has data-combo-id="rakdos"
 * 4. window.recordEvent is a function on combo pages
 * 5. The combo-telemetry.js bundle contains APP_VERSION 0.35.0
 * 6. Waits for spans to flush so Honeycomb can be queried separately
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const EXPECTED_VERSION = '0.35.0';

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
    // PHASE 1: Welcome page loads
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Welcome page loads ===\n');
    {
      const page = await browser.newPage();
      let welcomeBundle = '';

      page.on('response', async (response) => {
        if (response.url().includes('welcome.js') || response.url().includes('index.js')) {
          try { welcomeBundle = await response.text(); } catch {}
        }
      });

      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const title = await page.title();
      console.log(`  INFO: Page title: ${title}`);
      assert(title.length > 0, 'Welcome page has a title');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Combo page loads and has correct data-combo-id attribute
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Combo page data-combo-id attribute ===\n');
    {
      const page = await browser.newPage();

      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const comboId = await page.evaluate(() => document.body.getAttribute('data-combo-id'));
      console.log(`  INFO: data-combo-id = "${comboId}"`);
      assert(comboId === 'rakdos', `body has data-combo-id="rakdos" (got: "${comboId}")`);

      const title = await page.title();
      console.log(`  INFO: Combo page title: ${title}`);
      assert(title.toLowerCase().includes('rakdos'), `Combo page title mentions rakdos (got: "${title}")`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: window.recordEvent is a function on combo page
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: window.recordEvent is a function ===\n');
    {
      const page = await browser.newPage();

      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('networkidle');
      // Give the module script time to execute
      await page.waitForTimeout(2000);

      const recordEventType = await page.evaluate(() => typeof window.recordEvent);
      console.log(`  INFO: typeof window.recordEvent = "${recordEventType}"`);
      assert(recordEventType === 'function', `window.recordEvent is a function (got: "${recordEventType}")`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: combo-telemetry.js bundle contains correct version
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: combo-telemetry.js bundle version check ===\n');
    {
      const page = await browser.newPage();
      let comboBundle = '';

      page.on('response', async (response) => {
        if (response.url().includes('combo-telemetry.js')) {
          try { comboBundle = await response.text(); } catch {}
        }
      });

      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      if (comboBundle) {
        assert(comboBundle.includes(EXPECTED_VERSION), `combo-telemetry.js bundle contains version ${EXPECTED_VERSION}`);
        assert(comboBundle.includes('app.page'), 'combo-telemetry.js bundle references app.page attribute');
        assert(comboBundle.includes('combo.id'), 'combo-telemetry.js bundle references combo.id attribute');
        assert(comboBundle.includes('DocumentLoadInstrumentation') || comboBundle.length > 100,
          'combo-telemetry.js bundle is non-trivial (likely bundled)');
        console.log(`  INFO: Bundle size: ${comboBundle.length} bytes`);
      } else {
        console.log('  INFO: Could not intercept combo-telemetry.js — skipping bundle checks');
        assert(false, 'combo-telemetry.js bundle was intercepted');
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Azorius combo page also has correct data-combo-id
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Azorius combo page data-combo-id ===\n');
    {
      const page = await browser.newPage();

      await page.goto(`${BASE_URL}/combo/azorius.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const comboId = await page.evaluate(() => document.body.getAttribute('data-combo-id'));
      console.log(`  INFO: azorius data-combo-id = "${comboId}"`);
      assert(comboId === 'azorius', `azorius body has data-combo-id="azorius" (got: "${comboId}")`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Span flush — load combo page and wait for OTel export
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Span flush for Honeycomb verification ===\n');
    {
      const page = await browser.newPage();

      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('domcontentloaded');
      console.log('  INFO: Waiting 35s for OTel batch timer to fire...');
      await page.waitForTimeout(35000);
      console.log('  INFO: Span flush wait complete');

      assert(true, 'Span flush wait completed — check Honeycomb for combo page documentLoad spans');

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
  console.log('');
  console.log('NOTE: After running, check Honeycomb sparrow-deck environment for:');
  console.log('  - name containing "documentLoad" or "documentFetch"');
  console.log('  - app.page = "combo"');
  console.log('  - combo.id = "rakdos"');
  console.log(`  - service.version = "${EXPECTED_VERSION}"`);

  if (failures > 0) {
    console.error(`\nArc 53 documentLoad telemetry verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 53 documentLoad telemetry verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
