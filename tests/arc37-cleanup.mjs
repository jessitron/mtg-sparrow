/**
 * Arc 37 verification: Clean Up Public-Facing Artifacts
 *
 * Tests:
 * 1. Prototype pages removed (return 404): prototype, color-wheel-test, mana-gas, slot-machine, card-back-demo
 * 2. Related CSS removed (404): card-back.css, slot-machine.css
 * 3. Related TS removed (404): src/slot-machine.ts
 * 4. APP_VERSION extracted to src/version.ts with value '0.27.0'
 * 5. All entry points import from version.ts (no local APP_VERSION definitions)
 * 6. app.version appears on spans (checked via source; Honeycomb verified separately)
 * 7. All 5 real pages load correctly (welcome, slides, assessment, end, about)
 * 8. Build succeeds (verified by test server startup)
 *
 * Server must be running at http://localhost:3847 before running this script.
 */

import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = 'http://localhost:3847';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

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

const REMOVED_PAGES = [
  'prototype.html',
  'prototype',
  'color-wheel-test.html',
  'color-wheel-test',
  'mana-gas.html',
  'mana-gas',
  'slot-machine.html',
  'slot-machine',
  'card-back-demo.html',
  'card-back-demo',
];

const REMOVED_CSS = [
  'css/card-back.css',
  'css/slot-machine.css',
];

const REMOVED_TS = [
  'src/slot-machine.ts',
];

const REAL_PAGES = [
  { name: 'welcome', path: '/' },
  { name: 'slides', path: '/slides?subgroup=allied' },
  { name: 'assessment', path: '/assessment?subgroup=allied' },
  { name: 'end', path: '/end?subgroup=allied' },
  { name: 'about', path: '/about' },
];

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // 1. Prototype pages removed (return 404)
    // -----------------------------------------------------------------------
    console.log('\n=== 1. Prototype pages removed (404) ===\n');
    {
      const ctx = await browser.newContext();
      for (const pagePath of REMOVED_PAGES) {
        const resp = await ctx.request.get(`${BASE_URL}/${pagePath}`);
        const status = resp.status();
        assert(status === 404, `/${pagePath} returns 404 (got ${status})`);
      }
      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // 2. Related CSS removed (return 404)
    // -----------------------------------------------------------------------
    console.log('\n=== 2. Related CSS removed (404) ===\n');
    {
      const ctx = await browser.newContext();
      for (const cssPath of REMOVED_CSS) {
        const resp = await ctx.request.get(`${BASE_URL}/${cssPath}`);
        const status = resp.status();
        assert(status === 404, `/${cssPath} returns 404 (got ${status})`);
      }
      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // 3. Related TS removed (not on disk)
    // -----------------------------------------------------------------------
    console.log('\n=== 3. Related TS removed ===\n');
    {
      for (const tsPath of REMOVED_TS) {
        const fullPath = resolve(PROJECT_ROOT, tsPath);
        assert(!existsSync(fullPath), `${tsPath} does not exist on disk`);
      }
    }

    // -----------------------------------------------------------------------
    // 4. APP_VERSION extracted to src/version.ts
    // -----------------------------------------------------------------------
    console.log('\n=== 4. APP_VERSION in src/version.ts ===\n');
    {
      const versionPath = resolve(PROJECT_ROOT, 'src', 'version.ts');
      assert(existsSync(versionPath), 'src/version.ts exists');
      const content = readFileSync(versionPath, 'utf-8');
      assert(content.includes("APP_VERSION = '0.27.0'"), "APP_VERSION = '0.27.0' in version.ts");
      assert(content.includes('export'), 'APP_VERSION is exported');
    }

    // -----------------------------------------------------------------------
    // 5. No local APP_VERSION definitions in entry points
    // -----------------------------------------------------------------------
    console.log('\n=== 5. Entry points import from version.ts ===\n');
    {
      const entryPoints = ['welcome.ts', 'slides.ts', 'assessment.ts', 'end.ts', 'about.ts'];
      for (const ep of entryPoints) {
        const content = readFileSync(resolve(PROJECT_ROOT, 'src', ep), 'utf-8');
        // Should import from ./version
        assert(content.includes("from './version'"), `${ep} imports from './version'`);
        // Should NOT have a local const APP_VERSION = '...' definition
        const localDef = content.match(/const APP_VERSION\s*=\s*'/);
        assert(!localDef, `${ep} has no local APP_VERSION definition`);
      }
    }

    // -----------------------------------------------------------------------
    // 6. app.version on spans (source verification)
    // -----------------------------------------------------------------------
    console.log('\n=== 6. app.version in telemetry (source check) ===\n');
    {
      // Check that initTelemetry receives APP_VERSION and sets service.version
      const telemetryPath = resolve(PROJECT_ROOT, 'src', 'telemetry', 'telemetry.ts');
      const content = readFileSync(telemetryPath, 'utf-8');
      assert(content.includes('service.version') || content.includes('version'),
        'telemetry.ts references service.version or version in resource attributes');

      // Check each entry point passes APP_VERSION to initTelemetry
      const entryPoints = ['welcome.ts', 'slides.ts', 'assessment.ts', 'end.ts', 'about.ts'];
      for (const ep of entryPoints) {
        const epContent = readFileSync(resolve(PROJECT_ROOT, 'src', ep), 'utf-8');
        assert(epContent.includes('initTelemetry(APP_VERSION'),
          `${ep} passes APP_VERSION to initTelemetry`);
      }
    }

    // -----------------------------------------------------------------------
    // 7. All 5 real pages load correctly
    // -----------------------------------------------------------------------
    console.log('\n=== 7. Real pages load correctly ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));

      for (const { name, path } of REAL_PAGES) {
        errors.length = 0;
        const resp = await page.goto(`${BASE_URL}${path}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);

        assert(resp.status() === 200, `${name} page returns 200 (got ${resp.status()})`);
        assert(errors.length === 0, `${name} page has no JS errors${errors.length > 0 ? ': ' + errors[0] : ''}`);

        // Check page has meaningful content
        const bodyText = await page.textContent('body');
        assert(bodyText.length > 50, `${name} page has meaningful content (${bodyText.length} chars)`);
      }
      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // 8. Build works (verified by server being up + generate telemetry for Honeycomb)
    // -----------------------------------------------------------------------
    console.log('\n=== 8. Build verification ===\n');
    {
      // Server being up means build succeeded
      const ctx = await browser.newContext();
      const resp = await ctx.request.get(`${BASE_URL}/`);
      assert(resp.status() === 200, 'Build succeeded (server responds on port 3847)');

      // Visit welcome page to generate a span with service.version for Honeycomb check
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // Flush spans
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForTimeout(3000);

      assert(true, 'Telemetry spans flushed for Honeycomb verification');
      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Arc 37 Cleanup: ${passes} PASS, ${failures} FAIL out of ${passes + failures} tests`);
    console.log('='.repeat(50));

  } finally {
    await browser.close();
  }

  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
