/**
 * Verify that telemetry routes through the OTel collector at
 * mtg-sparrow.jessitron.honeydemo.io instead of going directly to api.honeycomb.io
 * for traces/logs.
 *
 * What we check:
 * 1. OTLP requests (traces/logs) go to mtg-sparrow.jessitron.honeydemo.io
 * 2. The session heartbeat still goes directly to api.honeycomb.io/1/events/sparrow-deck
 * 3. NO trace or log requests go directly to api.honeycomb.io/v1/traces or /v1/logs
 *
 * Server must be running at http://localhost:3847.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const COLLECTOR_HOST = 'mtg-sparrow.jessitron.honeydemo.io';
const HONEYCOMB_DIRECT_EVENTS = 'api.honeycomb.io/1/events/sparrow-deck';
const HONEYCOMB_DIRECT_TRACES = 'api.honeycomb.io/v1/traces';
const HONEYCOMB_DIRECT_LOGS = 'api.honeycomb.io/v1/logs';

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
    console.log('\n=== Collector Routing Verification ===\n');
    console.log('Phase 1 — Load app with a fresh browser context and monitor network requests');

    const context = await browser.newContext();
    const page = await context.newPage();

    // Collect all outbound requests
    const collectorRequests = [];
    const directHeartbeatRequests = [];
    const directTraceRequests = [];
    const directLogRequests = [];

    page.on('request', (request) => {
      const url = request.url();

      if (url.includes(COLLECTOR_HOST)) {
        collectorRequests.push(url);
        console.log(`  [network] -> collector: ${url}`);
      } else if (url.includes(HONEYCOMB_DIRECT_EVENTS)) {
        directHeartbeatRequests.push(url);
        console.log(`  [network] -> direct heartbeat: ${url}`);
      } else if (url.includes(HONEYCOMB_DIRECT_TRACES)) {
        directTraceRequests.push(url);
        console.log(`  [network] -> DIRECT TRACES (unexpected): ${url}`);
      } else if (url.includes(HONEYCOMB_DIRECT_LOGS)) {
        directLogRequests.push(url);
        console.log(`  [network] -> DIRECT LOGS (unexpected): ${url}`);
      }
    });

    // Load the app homepage (fresh context = new session)
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await sleep(1000);

    // The OTel SDK uses BatchSpanProcessor with a default 5000ms delay.
    // It also flushes on visibilitychange (page hidden). Navigating away
    // triggers that event, causing an immediate flush before the batch timer fires.
    console.log('\n  (navigating away to trigger OTel flush via visibilitychange...)');
    await page.goto(`${BASE_URL}/about.html`);
    await page.waitForLoadState('networkidle');
    await sleep(1000); // Give the export fetch time to complete

    await context.close();

    // --- Assertions ---
    console.log('\nPhase 2 — Assertions\n');

    assert(
      collectorRequests.length > 0,
      `At least one request went to the collector (${COLLECTOR_HOST}): found ${collectorRequests.length}`
    );

    assert(
      directHeartbeatRequests.length >= 1,
      `Session heartbeat still goes directly to api.honeycomb.io (found ${directHeartbeatRequests.length} heartbeat request(s))`
    );

    assert(
      directTraceRequests.length === 0,
      `No trace requests go directly to api.honeycomb.io/v1/traces (found ${directTraceRequests.length})`
    );

    assert(
      directLogRequests.length === 0,
      `No log requests go directly to api.honeycomb.io/v1/logs (found ${directLogRequests.length})`
    );

    // Print summary of what we saw
    console.log('\n  Request summary:');
    console.log(`    Collector (${COLLECTOR_HOST}):              ${collectorRequests.length} request(s)`);
    console.log(`    Direct heartbeat (api.honeycomb.io/1/events): ${directHeartbeatRequests.length} request(s)`);
    console.log(`    Direct traces (api.honeycomb.io/v1/traces):   ${directTraceRequests.length} request(s)`);
    console.log(`    Direct logs (api.honeycomb.io/v1/logs):       ${directLogRequests.length} request(s)`);

    if (collectorRequests.length > 0) {
      console.log('\n  Collector request URLs:');
      for (const url of collectorRequests) {
        console.log(`    ${url}`);
      }
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
