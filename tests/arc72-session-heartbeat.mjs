/**
 * Arc 72 verification: Session heartbeat fires on new session
 *
 * What to verify:
 * 1. A POST to api.honeycomb.io/1/events/sparrow-deck fires on new session load
 * 2. The payload contains all expected fields:
 *    event.type, event.source, session.id, player.id, page.hostname, page.url,
 *    page.path, app.version, app.page, browser.language, screen.width, screen.height,
 *    viewport.width, viewport.height
 * 3. Navigating to a second page in the same session does NOT send another heartbeat
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const HONEYCOMB_ENDPOINT = 'https://api.honeycomb.io/1/events/sparrow-deck';

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

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // --- Phase 1: Fresh session fires a heartbeat ---
    console.log('\nPhase 1 — Fresh session triggers a heartbeat POST to Honeycomb');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      const capturedHeartbeats = [];

      // Intercept outbound fetch to Honeycomb events endpoint
      await page.route('https://api.honeycomb.io/1/events/sparrow-deck', async (route) => {
        const request = route.request();
        const postData = request.postData();
        let parsed = null;
        try {
          parsed = JSON.parse(postData);
        } catch (_) {
          // not JSON
        }
        capturedHeartbeats.push({
          method: request.method(),
          headers: request.headers(),
          body: parsed ?? postData,
        });
        // Fulfill the request so the app doesn't error
        await route.fulfill({ status: 200, body: '{}' });
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await sleep(500); // allow async fetch to fire

      assert(
        capturedHeartbeats.length >= 1,
        `At least one heartbeat POST was sent (got: ${capturedHeartbeats.length})`
      );

      if (capturedHeartbeats.length >= 1) {
        const hb = capturedHeartbeats[0];

        // Verify HTTP method
        assert(hb.method === 'POST', `Heartbeat used POST method (got: ${hb.method})`);

        // Verify auth header present
        assert(
          hb.headers['x-honeycomb-team'] !== undefined,
          'X-Honeycomb-Team header is present'
        );

        // Verify required fields in payload
        const body = hb.body;
        const requiredFields = [
          'event.type',
          'event.source',
          'session.id',
          'player.id',
          'page.hostname',
          'page.url',
          'page.path',
          'app.version',
          'app.page',
          'browser.language',
          'screen.width',
          'screen.height',
          'viewport.width',
          'viewport.height',
        ];

        for (const field of requiredFields) {
          assert(
            body !== null && body[field] !== undefined,
            `Payload contains field "${field}" (value: ${body?.[field]})`
          );
        }

        // Verify specific values
        assert(
          body?.['event.type'] === 'session.heartbeat',
          `event.type is "session.heartbeat" (got: ${body?.['event.type']})`
        );
        assert(
          body?.['event.source'] === 'direct',
          `event.source is "direct" (got: ${body?.['event.source']})`
        );
        assert(
          typeof body?.['session.id'] === 'string' && body['session.id'].length > 0,
          `session.id is a non-empty string (got: ${body?.['session.id']})`
        );
        assert(
          typeof body?.['player.id'] === 'string' && body['player.id'].length > 0,
          `player.id is a non-empty string (got: ${body?.['player.id']})`
        );

        console.log(`\n  Heartbeat payload snapshot:`);
        console.log(`    event.type     = ${body?.['event.type']}`);
        console.log(`    event.source   = ${body?.['event.source']}`);
        console.log(`    session.id     = ${body?.['session.id']}`);
        console.log(`    player.id      = ${body?.['player.id']}`);
        console.log(`    app.version    = ${body?.['app.version']}`);
        console.log(`    app.page       = ${body?.['app.page']}`);
        console.log(`    page.hostname  = ${body?.['page.hostname']}`);
        console.log(`    page.path      = ${body?.['page.path']}`);
        console.log(`    viewport       = ${body?.['viewport.width']}x${body?.['viewport.height']}`);
      }

      // --- Phase 2: Same session — navigate to a second page, no second heartbeat ---
      console.log('\nPhase 2 — Same session: navigating to another page sends NO second heartbeat');
      {
        const countBefore = capturedHeartbeats.length;

        // Navigate to slides page (common second page)
        await page.goto(`${BASE_URL}/slides.html`);
        await page.waitForLoadState('networkidle');
        await sleep(500);

        const countAfter = capturedHeartbeats.length;
        assert(
          countAfter === countBefore,
          `No additional heartbeat on same-session page navigation (before: ${countBefore}, after: ${countAfter})`
        );
      }

      await context.close();
    }

    // --- Phase 3: Verify exactly one heartbeat per new context (new session) ---
    console.log('\nPhase 3 — New browser context (new session) fires exactly one heartbeat');
    {
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();

      const heartbeats2 = [];

      await page2.route('https://api.honeycomb.io/1/events/sparrow-deck', async (route) => {
        const request = route.request();
        const postData = request.postData();
        let parsed = null;
        try {
          parsed = JSON.parse(postData);
        } catch (_) {}
        heartbeats2.push({ body: parsed ?? postData });
        await route.fulfill({ status: 200, body: '{}' });
      });

      await page2.goto(BASE_URL);
      await page2.waitForLoadState('networkidle');
      await sleep(500);

      // Navigate to another page within this new session
      await page2.goto(`${BASE_URL}/slides.html`);
      await page2.waitForLoadState('networkidle');
      await sleep(500);

      assert(
        heartbeats2.length === 1,
        `Exactly one heartbeat for a new session (2 page loads, got: ${heartbeats2.length})`
      );

      await context2.close();
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
