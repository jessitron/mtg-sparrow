/**
 * Arc 75: Contrast Check Script
 *
 * Checks WCAG AA color contrast across all pages and visual states using axe-core.
 * This is an operator tool — it reports findings, it does not fix them.
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 *
 * Usage: npm run test:contrast
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = 'http://localhost:3847';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run axe color-contrast check on the current page state.
 * Returns { violations, incomplete }.
 */
async function checkContrast(page) {
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();
  return { violations: results.violations, incomplete: results.incomplete };
}

/**
 * Format a single axe violation node into a concise selector + contrast info.
 */
function formatNode(node) {
  const selector = node.target.join(', ');
  // axe stores contrast data in relatedNodes or in any[0].data
  const contrastData = node.any?.[0]?.data;
  let contrastInfo = '';
  if (contrastData && contrastData.contrastRatio !== undefined) {
    const required = contrastData.fontSize >= 18 || contrastData.bold ? '3:1' : '4.5:1';
    contrastInfo = ` (contrast ${contrastData.contrastRatio.toFixed(1)}:1, needs ${required})`;
  }
  return `    - ${selector}${contrastInfo}`;
}

/**
 * Print the result block for one page+state.
 */
function printResult(label, { violations, incomplete }) {
  console.log(`\n${label}:`);
  console.log(`  Violations: ${violations.length}`);
  for (const v of violations) {
    console.log(`    Rule: ${v.id} — ${v.help}`);
    for (const node of v.nodes) {
      console.log(formatNode(node));
    }
  }
  console.log(`  Incomplete: ${incomplete.length}`);
  for (const item of incomplete) {
    for (const node of item.nodes) {
      const selector = node.target.join(', ');
      console.log(`    - ${selector}: ${item.description}`);
    }
  }
}

// ----------------------------------------------------------------------------
// Page check functions — one per page+state
// ----------------------------------------------------------------------------

async function checkWelcomeDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/?no-gas`);
  await page.waitForLoadState('networkidle');
  await sleep(500);
  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkWelcomeMobile(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/?no-gas`);
  await page.waitForLoadState('networkidle');
  await sleep(500);
  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkSlidesIntro(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/slides?subgroup=allied&paused`);
  await page.waitForLoadState('networkidle');
  await sleep(600);
  // Do NOT dismiss the intro — check contrast of the intro overlay state
  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkSlidesCardHidden(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/slides?subgroup=allied&paused`);
  await page.waitForLoadState('networkidle');
  await sleep(600);

  // Dismiss intro (click anywhere)
  await page.mouse.click(640, 400);
  await sleep(500);

  // Wait for the card to appear
  await page.waitForSelector('.card-container .card', { timeout: 5000 }).catch(() => {});
  await sleep(300);

  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkSlidesCardRevealed(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/slides?subgroup=allied&paused`);
  await page.waitForLoadState('networkidle');
  await sleep(600);

  // Dismiss intro
  await page.mouse.click(640, 400);
  await sleep(500);

  // Wait for card
  await page.waitForSelector('.card-container .card', { timeout: 5000 }).catch(() => {});
  await sleep(300);

  // Reveal the card name by removing card-name-hidden class
  await page.evaluate(() => {
    const nameEl = document.querySelector('.card-name');
    if (nameEl) {
      nameEl.classList.remove('card-name-hidden');
    }
  });
  await sleep(200);

  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkAssessment(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/assessment?subgroup=allied&cards=10&completed=true`);
  await page.waitForLoadState('networkidle');
  await sleep(500);
  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkEndPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Set localStorage on a blank page before navigating, so the end page has content
  await page.goto(`${BASE_URL}/`);
  await page.evaluate(() => {
    localStorage.setItem('mtg_assessment_allied', 'nailing_it');
    localStorage.setItem('mtg_assessment_enemy', 'getting_there');
    localStorage.setItem('mtg_assessment_shards', 'just_starting');
    localStorage.setItem('mtg_assessment_wedges', 'just_starting');
  });

  await page.goto(`${BASE_URL}/end?subgroup=allied`);
  await page.waitForLoadState('networkidle');
  await sleep(500);
  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkAbout(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/about`);
  await page.waitForLoadState('networkidle');
  await sleep(500);
  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkComboIndex(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/combo/`);
  await page.waitForLoadState('networkidle');
  await sleep(500);
  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkComboDetail(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/combo/azorius.html`);
  await page.waitForLoadState('networkidle');
  await sleep(500);
  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function check404(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Try the nonexistent path first; fall back to /404.html if server returns nothing useful
  const response = await page.goto(`${BASE_URL}/nonexistent-page`);
  await page.waitForLoadState('networkidle');
  await sleep(300);

  const title = await page.title();
  // If the page title looks like a real 404 page, use it; otherwise navigate to /404.html
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (!bodyText || bodyText.trim().length < 10) {
    await page.goto(`${BASE_URL}/404.html`);
    await page.waitForLoadState('networkidle');
    await sleep(300);
  }

  const result = await checkContrast(page);
  await context.close();
  return result;
}

async function checkMenuOpen(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/?no-gas`);
  await page.waitForLoadState('networkidle');
  await sleep(500);

  // Open the hamburger menu
  const menuBtn = page.locator('.menu-btn');
  const menuBtnCount = await menuBtn.count();
  if (menuBtnCount > 0) {
    await menuBtn.click();
    await sleep(400);
  } else {
    console.log('  WARN: .menu-btn not found — menu may not be open');
  }

  const result = await checkContrast(page);
  await context.close();
  return result;
}

// ----------------------------------------------------------------------------
// Main runner
// ----------------------------------------------------------------------------

async function main() {
  const browser = await chromium.launch({ headless: true });

  const checks = [
    { label: 'Welcome (desktop)',           fn: checkWelcomeDesktop },
    { label: 'Welcome (mobile)',            fn: checkWelcomeMobile },
    { label: 'Slides: level intro',         fn: checkSlidesIntro },
    { label: 'Slides: card, name hidden',   fn: checkSlidesCardHidden },
    { label: 'Slides: card, name revealed', fn: checkSlidesCardRevealed },
    { label: 'Assessment',                  fn: checkAssessment },
    { label: 'End page',                    fn: checkEndPage },
    { label: 'About',                       fn: checkAbout },
    { label: 'Combo index',                 fn: checkComboIndex },
    { label: 'Combo detail (azorius)',      fn: checkComboDetail },
    { label: '404',                         fn: check404 },
    { label: 'Menu open',                   fn: checkMenuOpen },
  ];

  console.log('=== Contrast Check Report ===');

  let totalViolations = 0;
  let totalIncomplete = 0;

  try {
    for (const check of checks) {
      const result = await check.fn(browser);
      printResult(check.label, result);
      totalViolations += result.violations.length;
      totalIncomplete += result.incomplete.length;
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== Summary ===');
  console.log(`Total violations: ${totalViolations}`);
  console.log(`Total incomplete: ${totalIncomplete}`);
  console.log(`Pages checked: ${checks.length}`);

  if (totalViolations > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Contrast check error:', err);
  process.exit(1);
});
