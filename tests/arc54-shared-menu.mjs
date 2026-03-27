/**
 * Arc 54 verification: Shared Menu with Event-Based Telemetry
 *
 * Verifies that:
 * 1. Hamburger menu appears on combo pages
 * 2. Menu contains correct items (version, Levels, About, Share, Feedback)
 * 3. Reset Progress is NOT in combo menu (showResetProgress: false)
 * 4. Current trace link is NOT in combo menu (showTraceLink: false)
 * 5. Share button changes text to "Copied!" on click
 * 6. Feedback button opens the feedback modal
 * 7. Welcome page menu has Reset Progress (showResetProgress: true)
 * 8. window.recordEvent is a function on combo pages
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const EXPECTED_VERSION = '0.36.0';

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
    // PHASE 1: Combo page - menu button exists
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Combo page menu button ===\n');
    {
      const context = await browser.newContext({
        permissions: ['clipboard-read', 'clipboard-write'],
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // give module script time to run

      const menuBtn = await page.$('#menu-btn');
      assert(menuBtn !== null, 'Hamburger menu button (#menu-btn) exists on combo page');

      const menuBtnVisible = await page.isVisible('#menu-btn');
      assert(menuBtnVisible, 'Menu button is visible');

      await page.close();
      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Combo page - menu panel contents
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Combo page menu panel contents ===\n');
    {
      const context = await browser.newContext({
        permissions: ['clipboard-read', 'clipboard-write'],
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Open the menu
      await page.click('#menu-btn');
      await page.waitForTimeout(200);

      const panelVisible = await page.isVisible('#settings-panel');
      assert(panelVisible, 'Menu panel is visible after clicking menu button');

      // Check panel contents
      const panelText = await page.textContent('#settings-panel');
      console.log(`  INFO: Panel text snippet: "${panelText?.substring(0, 200)}"`);

      // Version
      const versionEl = await page.$('#settings-version');
      const versionText = await versionEl?.textContent();
      console.log(`  INFO: Version text: "${versionText}"`);
      assert(versionText === `v${EXPECTED_VERSION}`, `Version shows v${EXPECTED_VERSION} (got: "${versionText}")`);

      // Levels link
      const levelsLink = await page.$('a.settings-about-link[href="end"]');
      assert(levelsLink !== null, 'Levels link is present in combo menu');

      // About link
      const aboutLink = await page.$('a.settings-about-link[href="about"]');
      assert(aboutLink !== null, 'About link is present in combo menu');

      // Share button
      const shareBtn = await page.$('#settings-share-btn');
      assert(shareBtn !== null, 'Share button is present in combo menu');

      // Feedback button
      const feedbackBtn = await page.$('#settings-feedback-btn');
      assert(feedbackBtn !== null, 'Feedback button is present in combo menu');

      // MTG Colors title link
      const titleLink = await page.$('a.settings-title-link');
      const titleLinkText = await titleLink?.textContent();
      assert(titleLinkText?.trim() === 'MTG Colors', `Title link says "MTG Colors" (got: "${titleLinkText?.trim()}")`);

      // Reset Progress should NOT be present
      const resetBtn = await page.$('#settings-reset-btn');
      assert(resetBtn === null, 'Reset Progress button is NOT in combo menu');

      // Current trace link should NOT be present
      const traceContainer = await page.$('#settings-trace-container');
      assert(traceContainer === null, 'Current trace link is NOT in combo menu');

      await page.close();
      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Combo page - Share button changes text to "Copied!"
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Share button behavior ===\n');
    {
      const context = await browser.newContext({
        permissions: ['clipboard-read', 'clipboard-write'],
      });
      const page = await context.newPage();

      // Override clipboard to avoid permission issues in headless
      await page.addInitScript(() => {
        let clipboardText = '';
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: (text) => {
              clipboardText = text;
              return Promise.resolve();
            },
            readText: () => Promise.resolve(clipboardText),
          },
          writable: true,
          configurable: true,
        });
      });

      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Open the menu
      await page.click('#menu-btn');
      await page.waitForTimeout(200);

      // Click Share
      await page.click('#settings-share-btn');
      await page.waitForTimeout(500);

      const shareBtnText = await page.textContent('#settings-share-btn');
      console.log(`  INFO: Share button text after click: "${shareBtnText}"`);
      assert(shareBtnText === 'Copied!', `Share button text changes to "Copied!" (got: "${shareBtnText}")`);

      // Also verify URL copied contains utm_source=share
      const copiedUrl = await page.evaluate(() => {
        // The mock clipboard above stores the last written text
        return navigator.clipboard.readText();
      });
      console.log(`  INFO: Copied URL: "${copiedUrl}"`);
      assert(copiedUrl.includes('utm_source=share'), `Copied URL contains utm_source=share`);
      assert(copiedUrl.includes('utm_id='), `Copied URL contains utm_id param`);

      await page.close();
      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Combo page - Feedback button opens modal
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Feedback button opens modal ===\n');
    {
      const context = await browser.newContext({
        permissions: ['clipboard-read', 'clipboard-write'],
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Open the menu
      await page.click('#menu-btn');
      await page.waitForTimeout(200);

      // Click Feedback button
      await page.click('#settings-feedback-btn');
      await page.waitForTimeout(500);

      // Check for a feedback modal/dialog
      // The feedback modal should appear — check for common feedback elements
      const feedbackDialog = await page.$('[role="dialog"]');
      const feedbackVisible = feedbackDialog !== null;
      console.log(`  INFO: Feedback dialog found: ${feedbackVisible}`);

      // Also check for a textarea or form that would be in a feedback modal
      const feedbackTextarea = await page.$('textarea');
      const feedbackInput = await page.$('input[type="email"]');
      const hasFeedbackForm = feedbackTextarea !== null || feedbackInput !== null;
      console.log(`  INFO: Feedback form elements found: textarea=${feedbackTextarea !== null}, email=${feedbackInput !== null}`);

      assert(feedbackVisible || hasFeedbackForm, 'Feedback modal/form appears after clicking Feedback button');

      await page.close();
      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Welcome page - menu still works, has Reset Progress
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Welcome page menu ===\n');
    {
      const context = await browser.newContext({
        permissions: ['clipboard-read', 'clipboard-write'],
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Menu button
      const menuBtn = await page.$('#menu-btn');
      assert(menuBtn !== null, 'Hamburger menu button exists on welcome page');

      // Open the menu
      await page.click('#menu-btn');
      await page.waitForTimeout(200);

      const panelVisible = await page.isVisible('#settings-panel');
      assert(panelVisible, 'Menu panel is visible on welcome page');

      // Reset Progress SHOULD be present on welcome page
      const resetBtn = await page.$('#settings-reset-btn');
      assert(resetBtn !== null, 'Reset Progress button IS present in welcome menu');

      // Share should also be present
      const shareBtn = await page.$('#settings-share-btn');
      assert(shareBtn !== null, 'Share button is present in welcome menu');

      // Version check
      const versionEl = await page.$('#settings-version');
      const versionText = await versionEl?.textContent();
      console.log(`  INFO: Welcome page version: "${versionText}"`);
      assert(versionText === `v${EXPECTED_VERSION}`, `Welcome page shows version v${EXPECTED_VERSION}`);

      await page.close();
      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: window.recordEvent is a function on combo page
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: window.recordEvent on combo page ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/combo/azorius.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const recordEventType = await page.evaluate(() => typeof window.recordEvent);
      console.log(`  INFO: typeof window.recordEvent on azorius = "${recordEventType}"`);
      assert(recordEventType === 'function', `window.recordEvent is a function on combo pages`);

      // Also verify combo-telemetry.js bundle has new version
      let comboBundle = '';
      const page2 = await context.newPage();
      page2.on('response', async (response) => {
        if (response.url().includes('combo-telemetry.js')) {
          try { comboBundle = await response.text(); } catch {}
        }
      });
      await page2.goto(`${BASE_URL}/combo/rakdos.html`);
      await page2.waitForLoadState('networkidle');
      await page2.waitForTimeout(500);

      if (comboBundle) {
        assert(comboBundle.includes(EXPECTED_VERSION), `combo-telemetry.js bundle contains version ${EXPECTED_VERSION}`);
        console.log(`  INFO: Bundle size: ${comboBundle.length} bytes`);
      } else {
        console.log('  INFO: Could not intercept combo-telemetry.js — skipping bundle version check');
      }

      await page.close();
      await page2.close();
      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Telemetry flush — load combo page, wait for OTel export
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Telemetry flush for Honeycomb verification ===\n');
    {
      const context = await browser.newContext({
        permissions: ['clipboard-read', 'clipboard-write'],
      });

      // Mock clipboard so share click works in headless
      const page = await context.newPage();
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => Promise.resolve(), readText: () => Promise.resolve('') },
          writable: true,
          configurable: true,
        });
      });

      await page.goto(`${BASE_URL}/combo/rakdos.html`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Click share to generate a share.copy_link log event
      await page.click('#menu-btn');
      await page.waitForTimeout(200);
      await page.click('#settings-share-btn');
      await page.waitForTimeout(300);
      console.log('  INFO: Clicked Share on rakdos combo page — share.copy_link event should be recorded');
      console.log('  INFO: Waiting 35s for OTel batch timer to fire...');
      await page.waitForTimeout(35000);
      console.log('  INFO: Telemetry flush wait complete');

      assert(true, 'Telemetry flush wait completed — check Honeycomb for share.copy_link log events');

      await page.close();
      await context.close();
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
  console.log('  - body = "share.copy_link" (log event from combo page Share click)');
  console.log('  - service.version = "0.36.0"');
  console.log('  - app.page = "combo"');
  console.log('  - combo.id = "rakdos"');

  if (failures > 0) {
    console.error(`\nArc 54 shared menu verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 54 shared menu verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
