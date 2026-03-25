/**
 * Arc 46: Dual-Strategy buildSequence — E2E Verification
 *
 * Tests the sequence-harness.html page against the two strategies:
 *   - "familiar": shuffle-and-repeat with min-gap-2 constraint, exact length
 *   - "new": gradual introduction, starts with 2 combos, may exceed length
 *
 * Run via: npm run test:e2e -- tests/arc46-sequence-verification.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const HARNESS_URL = `${BASE_URL}/sequence-harness.html`;

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`PASS: ${msg}`);
  passed++;
}

function fail(msg) {
  console.log(`FAIL: ${msg}`);
  failed++;
}

function check(condition, passMsg, failMsg) {
  if (condition) {
    pass(passMsg);
  } else {
    fail(failMsg);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', err => errors.push(err.message));

// ─────────────────────────────────────────────
// Helper: read all sequence-row combo labels from the page
// Returns an array of combo letters (e.g. ['A', 'B', 'A', 'C', ...])
// ─────────────────────────────────────────────
async function getComboLabels() {
  return page.locator('.sequence-row .combo-chip').allTextContents();
}

// ─────────────────────────────────────────────
// TEST 1: Page loads with familiar as default
// ─────────────────────────────────────────────
console.log('\n─── Test 1: Familiar strategy default ───');
const response = await page.goto(HARNESS_URL, { waitUntil: 'domcontentloaded' });
check(response.status() === 200, 'Harness page loads (HTTP 200)', `Harness page failed to load: HTTP ${response.status()}`);

await page.waitForSelector('#generate-btn', { timeout: 5000 });

const defaultStrategy = await page.locator('#familiarity-select').inputValue();
check(defaultStrategy === 'familiar', `Default strategy is "familiar" (got "${defaultStrategy}")`, `Default strategy should be "familiar" but got "${defaultStrategy}"`);

// Auto-click fires on load; wait for rows
await page.waitForSelector('.sequence-row', { timeout: 3000 });
const defaultRows = await page.locator('.sequence-row').all();
check(defaultRows.length > 0, `Familiar auto-generate produced ${defaultRows.length} sequence rows`, 'No sequence rows rendered after auto-generate');

// ─────────────────────────────────────────────
// TEST 2: Familiar strategy with length=25 produces exactly 25 rows
// ─────────────────────────────────────────────
console.log('\n─── Test 2: Familiar strategy respects length=25 ───');
// Reset to defaults: 5 combos, 10 cards, length=25, familiar
await page.fill('#combo-count-input', '5');
await page.fill('#cards-per-combo-input', '10');
await page.fill('#length-input', '25');
await page.selectOption('#familiarity-select', 'familiar');
await page.click('#generate-btn');
await page.waitForTimeout(300);

const familiarRows = await page.locator('.sequence-row').all();
check(
  familiarRows.length === 25,
  `Familiar strategy: exactly 25 rows for length=25 (got ${familiarRows.length})`,
  `Familiar strategy: expected exactly 25 rows, got ${familiarRows.length}`
);

// ─────────────────────────────────────────────
// TEST 3: Min-gap constraint for familiar — no combo repeats within 2 positions
// ─────────────────────────────────────────────
console.log('\n─── Test 3: Familiar min-gap-2 constraint ───');
const familiarLabels = await getComboLabels();
let gapViolations = 0;

for (let i = 0; i < familiarLabels.length; i++) {
  for (let lookback = 1; lookback <= 2 && i - lookback >= 0; lookback++) {
    if (familiarLabels[i] === familiarLabels[i - lookback]) {
      gapViolations++;
      console.log(`  GAP VIOLATION at position ${i + 1}: "${familiarLabels[i]}" appeared ${lookback} position(s) ago`);
    }
  }
}
check(
  gapViolations === 0,
  `Familiar min-gap-2: no violations in ${familiarLabels.length} positions`,
  `Familiar min-gap-2: ${gapViolations} violation(s) found`
);

// ─────────────────────────────────────────────
// TEST 4: New strategy renders with intro markers and summary
// ─────────────────────────────────────────────
console.log('\n─── Test 4: New strategy renders intro markers and summary ───');
await page.fill('#combo-count-input', '5');
await page.fill('#cards-per-combo-input', '10');
await page.fill('#length-input', '25');
await page.selectOption('#familiarity-select', 'new');
await page.click('#generate-btn');
await page.waitForTimeout(300);

const newRows = await page.locator('.sequence-row').all();
check(newRows.length > 0, `New strategy produced ${newRows.length} sequence rows`, 'New strategy produced no sequence rows');

const introMarkers = await page.locator('.intro-marker').all();
check(introMarkers.length > 0, `New strategy shows ${introMarkers.length} intro-marker element(s)`, 'New strategy shows no intro-marker elements');

const summary = await page.locator('.sequence-summary').count();
check(summary === 1, 'sequence-summary element is present', 'sequence-summary element is missing');

const summaryText = await page.locator('.sequence-summary').textContent();
console.log(`  Summary text: "${summaryText?.trim()}"`);
check(
  summaryText?.includes('Total:'),
  `Summary shows total count ("${summaryText?.trim()}")`,
  `Summary text doesn't include "Total:": "${summaryText?.trim()}"`
);

// ─────────────────────────────────────────────
// TEST 5: New strategy can produce more than 25 rows
// (gradual intro extends beyond minimum length to introduce all combos)
// ─────────────────────────────────────────────
console.log('\n─── Test 5: New strategy may exceed length=25 for full intro ───');
// With 5 combos, INTRO_CADENCE=7: combos 1&2 start active; combo 3 at ~7 appearances,
// combo 4 at ~14, combo 5 at ~21. Full intro needs ~35+ slides.
const newRowCount = newRows.length;
const newSummaryNum = parseInt(summaryText?.replace(/\D/g, '') ?? '0', 10);
console.log(`  Rows in DOM: ${newRowCount}, Summary says: ${newSummaryNum}`);

check(
  newSummaryNum === newRowCount,
  `Summary count (${newSummaryNum}) matches DOM rows (${newRowCount})`,
  `Summary count (${newSummaryNum}) doesn't match DOM rows (${newRowCount})`
);

// We expect more than 25 because 5 combos need ~35 appearances to all be introduced
check(
  newRowCount > 25,
  `New strategy with 5 combos and length=25 produced ${newRowCount} rows (> 25 — all combos introduced)`,
  `New strategy produced only ${newRowCount} rows; expected > 25 to cover all 5 combos`
);

// ─────────────────────────────────────────────
// TEST 6: Gradual intro — sequence starts with only 2 distinct combos
// ─────────────────────────────────────────────
console.log('\n─── Test 6: New strategy starts with only 2 distinct combos ───');
const newLabels = await getComboLabels();

// The first 7 appearances should use only 2 distinct labels (A and B)
const firstBatch = newLabels.slice(0, 7);
const distinctInFirstBatch = new Set(firstBatch).size;
console.log(`  First 7 combos: [${firstBatch.join(', ')}] — ${distinctInFirstBatch} distinct`);
check(
  distinctInFirstBatch <= 2,
  `New strategy starts with only ${distinctInFirstBatch} distinct combo(s) in first 7 positions`,
  `New strategy used ${distinctInFirstBatch} distinct combos in first 7 positions (expected ≤ 2)`
);

// ─────────────────────────────────────────────
// TEST 7: New strategy introduces additional combos later
// ─────────────────────────────────────────────
console.log('\n─── Test 7: New strategy introduces more combos over time ───');
// By position 20+ we expect at least 3 distinct combos (maybe 4 or 5)
const later = newLabels.slice(0, Math.min(30, newLabels.length));
const distinctLater = new Set(later).size;
console.log(`  First 30 combos: ${distinctLater} distinct combo(s)`);
check(
  distinctLater >= 3,
  `New strategy introduces ≥3 combos by position 30 (got ${distinctLater})`,
  `New strategy only has ${distinctLater} distinct combos by position 30 (expected ≥ 3)`
);

// ─────────────────────────────────────────────
// TEST 8: All combos eventually introduced
// ─────────────────────────────────────────────
console.log('\n─── Test 8: New strategy eventually introduces all 5 combos ───');
const distinctAll = new Set(newLabels).size;
console.log(`  Total distinct combos in full sequence: ${distinctAll}`);
check(
  distinctAll === 5,
  `New strategy introduces all 5 combos (got ${distinctAll})`,
  `New strategy only introduced ${distinctAll}/5 combos`
);

// ─────────────────────────────────────────────
// TEST 9: Intro markers count matches combos - 1 (first 2 start without marker, rest get one)
// Strategy: combos 1&2 start together, combos 3-5 each get an intro marker
// Actually combos 1&2 also get intro markers since detectIntroductions marks ALL first appearances
// So we expect exactly 5 intro markers for 5 combos
// ─────────────────────────────────────────────
console.log('\n─── Test 9: Intro marker count matches combo count ───');
const markerTexts = await page.locator('.intro-marker').allTextContents();
console.log(`  Intro markers (${markerTexts.length}): ${markerTexts.map(t => t.trim()).join(' | ')}`);
check(
  markerTexts.length === 5,
  `Exactly 5 intro markers for 5 combos (got ${markerTexts.length})`,
  `Expected 5 intro markers for 5 combos, got ${markerTexts.length}`
);

// Verify marker text format
const wellFormedMarkers = markerTexts.every(t => t.includes('introducing'));
check(
  wellFormedMarkers,
  'All intro markers contain "introducing"',
  `Some intro markers missing "introducing": [${markerTexts.map(t => t.trim()).join(', ')}]`
);

// ─────────────────────────────────────────────
// Console errors check
// ─────────────────────────────────────────────
console.log('\n─── Console errors ───');
if (errors.length > 0) {
  errors.forEach(e => console.log(`  ERROR: ${e}`));
  fail(`${errors.length} console error(s) detected`);
} else {
  pass('No console errors');
}

// ─────────────────────────────────────────────
// Final summary
// ─────────────────────────────────────────────
await browser.close();

console.log(`\n════════════════════════════════════`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`════════════════════════════════════`);

if (failed > 0) {
  process.exit(1);
}
