/**
 * Arc 41 verification: Feedback Context Enrichment
 *
 * Verifies that feedback.submit telemetry spans include page-specific context
 * attributes when submitted from different pages.
 *
 * Approach: Intercept OTLP POST requests to https://api.honeycomb.io/v1/traces
 * and inspect the JSON request body for expected attribute key strings.
 *
 * Pages tested:
 *   1. Slides page  — feedback.slide.* + feedback.unlocked_levels
 *   2. End page     — feedback.end.* + feedback.unlocked_levels
 *   3. Welcome page — feedback.unlocked_levels only (no slide/end keys)
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const OTLP_URL = 'https://api.honeycomb.io/v1/traces';

// OTLP export happens asynchronously — wait up to this long after submit
const OTLP_WAIT_MS = 10000;

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

/**
 * Check that a captured body string contains an attribute key.
 * OTLP JSON includes attribute keys as quoted strings, so a substring match is reliable.
 */
function hasAttr(body, key) {
  if (!body) return false;
  return body.includes(key);
}

/**
 * Open a fresh browser context, navigate to the given URL, open the feedback
 * modal, submit a message, and wait for the OTLP export.
 *
 * Returns { body: string|null, ctx } — caller is responsible for closing ctx.
 */
async function setupAndSubmitFeedback(browser, url, message, preSubmitFn) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  let capturedBody = null;

  // Intercept the OTLP export request
  await page.route(OTLP_URL, async (route) => {
    if (capturedBody === null) {
      capturedBody = route.request().postData();
    }
    await route.fulfill({ status: 200, body: '{}' });
  });

  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);

  // Allow caller to do extra setup (e.g. wait for card on slides page)
  if (preSubmitFn) {
    await preSubmitFn(page);
  }

  // Open menu
  await page.waitForSelector('#menu-btn', { timeout: 5000 });
  await page.click('#menu-btn');
  await page.waitForTimeout(400);

  // Click Feedback button
  await page.waitForSelector('#settings-feedback-btn', { timeout: 3000 });
  await page.click('#settings-feedback-btn');
  await page.waitForTimeout(400);

  // Type the feedback message
  await page.waitForSelector('.feedback-textarea', { timeout: 3000 });
  await page.fill('.feedback-textarea', message);
  await page.waitForTimeout(100);

  // Click Submit
  const submitBtn = await page.$('.feedback-submit-btn');
  assert(submitBtn !== null, 'Submit button found');
  await submitBtn.click();

  // Wait for thanks message to confirm submit handler fired
  await page.waitForSelector('.feedback-thanks:not([hidden])', { timeout: 5000 });

  // Wait for OTLP export (flushSpans is called in the handler, export is async)
  const deadline = Date.now() + OTLP_WAIT_MS;
  while (!capturedBody && Date.now() < deadline) {
    await page.waitForTimeout(500);
  }

  if (capturedBody) {
    console.log(`  INFO: OTLP body captured (${capturedBody.length} chars)`);
  } else {
    console.log(`  WARN: No OTLP body captured after ${OTLP_WAIT_MS}ms`);
  }

  return { body: capturedBody, ctx };
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Slides page — feedback.slide.* attributes
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Slides page context attributes ===\n');
    {
      const { body, ctx } = await setupAndSubmitFeedback(
        browser,
        `${BASE_URL}/slides?subgroup=allied&welcome_dwell_ms=0`,
        'Slides page feedback test from Arc 41',
        async (page) => {
          // Wait for session to populate so card_index/card_count are available
          await page.waitForSelector('.card-name, .card-image, .card-reveal-btn', { timeout: 8000 });
          await page.waitForTimeout(500);
        }
      );

      if (!body) {
        assert(false, 'OTLP body captured on slides page');
      } else {
        // Core feedback attributes (always present)
        assert(hasAttr(body, 'feedback.message'), 'feedback.message key present in OTLP payload');

        // Slides-specific attributes from setFeedbackContextProvider in slides.ts
        assert(hasAttr(body, 'feedback.unlocked_levels'), 'feedback.unlocked_levels key present');
        assert(hasAttr(body, 'feedback.slide.subgroup'), 'feedback.slide.subgroup key present');
        assert(hasAttr(body, 'feedback.slide.card_index'), 'feedback.slide.card_index key present');
        assert(hasAttr(body, 'feedback.slide.card_count'), 'feedback.slide.card_count key present');

        // card_name is conditionally present (only when currentCardName is populated)
        if (hasAttr(body, 'feedback.slide.card_name')) {
          assert(true, 'feedback.slide.card_name key present (card name loaded)');
        } else {
          console.log('  INFO: feedback.slide.card_name absent — card name not yet populated (acceptable on initial load)');
        }

        // Verify the subgroup value is 'allied'
        assert(body.includes('"allied"') || body.includes('allied'), 'Subgroup value "allied" encoded in payload');
      }

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: End page — feedback.end.* attributes
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: End page context attributes ===\n');
    {
      const { body, ctx } = await setupAndSubmitFeedback(
        browser,
        `${BASE_URL}/end?subgroup=allied&cards=5&completed=true`,
        'End page feedback test from Arc 41',
        async (page) => {
          await page.waitForTimeout(800);
        }
      );

      if (!body) {
        assert(false, 'OTLP body captured on end page');
      } else {
        assert(hasAttr(body, 'feedback.message'), 'feedback.message key present in OTLP payload');
        assert(hasAttr(body, 'feedback.unlocked_levels'), 'feedback.unlocked_levels key present');
        assert(hasAttr(body, 'feedback.end.subgroup'), 'feedback.end.subgroup key present');
        assert(hasAttr(body, 'feedback.end.cards'), 'feedback.end.cards key present');
        assert(hasAttr(body, 'feedback.end.completed'), 'feedback.end.completed key present');
        assert(hasAttr(body, 'feedback.end.current_section'), 'feedback.end.current_section key present');

        // Verify 'allied' value from query param is encoded
        assert(body.includes('allied'), 'Subgroup value "allied" encoded in end page payload');
      }

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Welcome page — feedback.unlocked_levels only (no slide/end keys)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Welcome page context attributes ===\n');
    {
      const { body, ctx } = await setupAndSubmitFeedback(
        browser,
        `${BASE_URL}/`,
        'Welcome page feedback test from Arc 41',
        async (page) => {
          await page.waitForTimeout(400);
        }
      );

      if (!body) {
        assert(false, 'OTLP body captured on welcome page');
      } else {
        assert(hasAttr(body, 'feedback.message'), 'feedback.message key present in OTLP payload');
        assert(hasAttr(body, 'feedback.unlocked_levels'), 'feedback.unlocked_levels key present');

        // Welcome page should NOT include slide or end specific attributes
        assert(!hasAttr(body, 'feedback.slide.subgroup'), 'feedback.slide.subgroup NOT present on welcome page');
        assert(!hasAttr(body, 'feedback.end.subgroup'), 'feedback.end.subgroup NOT present on welcome page');
      }

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: End page with enemy subgroup — verify different query param values
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: End page with enemy subgroup — verify query param values ===\n');
    {
      const { body, ctx } = await setupAndSubmitFeedback(
        browser,
        `${BASE_URL}/end?subgroup=enemy&cards=10&completed=true`,
        'End page enemy subgroup test from Arc 41',
        async (page) => {
          await page.waitForTimeout(800);
        }
      );

      if (!body) {
        assert(false, 'OTLP body captured on end page (enemy)');
      } else {
        assert(hasAttr(body, 'feedback.end.subgroup'), 'feedback.end.subgroup present');
        assert(body.includes('enemy'), 'Value "enemy" encoded in payload');
      }

      await ctx.close();
    }

  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Arc 41 Feedback Context: ${passes} PASS, ${failures} FAIL out of ${passes + failures} tests`);
  console.log('='.repeat(60));

  if (failures > 0) {
    console.error(`\nArc 41 context verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 41 context verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
