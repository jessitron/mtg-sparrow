/**
 * Verify: End screen progress dots
 *
 * Tests that the reel progress dots on the end page:
 * 1. Are visible (5 dots on the left side)
 * 2. Have an active dot highlighted
 * 3. Support click navigation between sections
 * 4. Update active state on click
 * 5. Sync with chevron button navigation
 * 6. Respect URL param for initial section (subgroup=shards -> dot 4, subgroup=wedges -> dot 3)
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:3847';
let browser, page;
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.log(`  FAIL: ${label}`);
    failed++;
  }
}

async function setup() {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await context.newPage();
}

async function teardown() {
  if (browser) await browser.close();
}

async function waitForDots() {
  // Wait for the dots container to appear in the DOM
  await page.waitForSelector('.reel-progress-dots', { timeout: 5000 });
  // Small extra wait for animations to settle
  await page.waitForTimeout(500);
}

async function test_dots_visible() {
  console.log('\n--- Test: Dots are visible ---');
  await page.goto(`${BASE}/end`);
  await waitForDots();

  const dots = await page.$$('.reel-progress-dot');
  assert(dots.length === 5, `5 dots present (found ${dots.length})`);

  // Check they're visible (not display:none)
  const container = await page.$('.reel-progress-dots');
  const display = await container.evaluate(el => getComputedStyle(el).display);
  assert(display !== 'none', `Dots container is visible (display: ${display})`);

  // Check position — should be on the left side
  const box = await container.boundingBox();
  assert(box !== null, 'Dots container has a bounding box');
  if (box) {
    assert(box.x < 100, `Dots are on the left side (x=${box.x})`);
    // Should be vertically centered-ish (around middle of viewport)
    const midY = box.y + box.height / 2;
    assert(midY > 200 && midY < 600, `Dots are vertically centered (midY=${midY})`);
  }

  await page.screenshot({ path: '/Users/jessitron/code/jessitron/mtg-sparrow/tests/progress-dots-visible.png' });
}

async function test_active_dot_default() {
  console.log('\n--- Test: Active dot highlighted (default) ---');
  await page.goto(`${BASE}/end`);
  await waitForDots();

  const dots = await page.$$('.reel-progress-dot');
  // First dot should be active by default (allied section)
  const firstActive = await dots[0].evaluate(el => el.classList.contains('reel-progress-dot--active'));
  assert(firstActive, 'First dot is active by default');

  // Other dots should NOT be active
  for (let i = 1; i < dots.length; i++) {
    const isActive = await dots[i].evaluate(el => el.classList.contains('reel-progress-dot--active'));
    assert(!isActive, `Dot ${i + 1} is NOT active`);
  }
}

async function test_click_navigation() {
  console.log('\n--- Test: Click navigation ---');
  await page.goto(`${BASE}/end`);
  await waitForDots();

  // Click the 3rd dot (index 2 = wedges)
  const dots = await page.$$('.reel-progress-dot');
  await dots[2].click();
  // Wait for animation
  await page.waitForTimeout(1000);

  // Now the 3rd dot should be active
  const thirdActive = await dots[2].evaluate(el => el.classList.contains('reel-progress-dot--active'));
  assert(thirdActive, 'Third dot becomes active after click');

  // First dot should no longer be active
  const firstActive = await dots[0].evaluate(el => el.classList.contains('reel-progress-dot--active'));
  assert(!firstActive, 'First dot is no longer active after clicking third');

  await page.screenshot({ path: '/Users/jessitron/code/jessitron/mtg-sparrow/tests/progress-dots-after-click.png' });
}

async function test_chevron_sync() {
  console.log('\n--- Test: Chevron sync ---');
  await page.goto(`${BASE}/end`);
  await waitForDots();

  // Click the bottom chevron to go from section 0 to section 1
  const bottomBtn = await page.$('.reel-nav-btn--bottom');
  assert(bottomBtn !== null, 'Bottom chevron button exists');
  if (!bottomBtn) return;

  await bottomBtn.click();
  await page.waitForTimeout(1000);

  // Dot 2 (index 1) should now be active
  const dots = await page.$$('.reel-progress-dot');
  const secondActive = await dots[1].evaluate(el => el.classList.contains('reel-progress-dot--active'));
  assert(secondActive, 'Second dot becomes active after chevron down click');

  const firstActive = await dots[0].evaluate(el => el.classList.contains('reel-progress-dot--active'));
  assert(!firstActive, 'First dot is no longer active after chevron down');

  // Click bottom again to go to section 2
  await bottomBtn.click();
  await page.waitForTimeout(1000);

  const thirdActive = await dots[2].evaluate(el => el.classList.contains('reel-progress-dot--active'));
  assert(thirdActive, 'Third dot becomes active after second chevron down click');
}

async function test_url_param_shards() {
  console.log('\n--- Test: URL param subgroup=shards ---');
  await page.goto(`${BASE}/end?subgroup=shards`);
  await waitForDots();
  // Wait extra for the initial scroll animation
  await page.waitForTimeout(1500);

  const dots = await page.$$('.reel-progress-dot');
  // shards is index 3 (4th dot)
  const fourthActive = await dots[3].evaluate(el => el.classList.contains('reel-progress-dot--active'));
  assert(fourthActive, 'Fourth dot (shards) is active with subgroup=shards');

  // First dot should NOT be active
  const firstActive = await dots[0].evaluate(el => el.classList.contains('reel-progress-dot--active'));
  assert(!firstActive, 'First dot is NOT active with subgroup=shards');

  await page.screenshot({ path: '/Users/jessitron/code/jessitron/mtg-sparrow/tests/progress-dots-shards.png' });
}

async function test_url_param_wedges() {
  console.log('\n--- Test: URL param subgroup=wedges ---');
  await page.goto(`${BASE}/end?subgroup=wedges`);
  await waitForDots();
  await page.waitForTimeout(1500);

  const dots = await page.$$('.reel-progress-dot');
  // wedges is index 2 (3rd dot)
  const thirdActive = await dots[2].evaluate(el => el.classList.contains('reel-progress-dot--active'));
  assert(thirdActive, 'Third dot (wedges) is active with subgroup=wedges');

  await page.screenshot({ path: '/Users/jessitron/code/jessitron/mtg-sparrow/tests/progress-dots-wedges.png' });
}

// Run all tests
(async () => {
  try {
    await setup();
    await test_dots_visible();
    await test_active_dot_default();
    await test_click_navigation();
    await test_chevron_sync();
    await test_url_param_shards();
    await test_url_param_wedges();
  } catch (err) {
    console.error('\nERROR:', err.message);
    failed++;
  } finally {
    await teardown();
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
})();
