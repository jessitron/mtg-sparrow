/**
 * Arc 76: Screenshot-Diff Contrast Check
 *
 * Uses the "two-screenshot diff" technique to verify text contrast against
 * actual rendered backgrounds — including gradients and semi-transparent layers
 * that axe-core cannot analyze.
 *
 * Technique:
 *   1. Take Screenshot A (text + background)
 *   2. Hide all text (visibility: hidden — preserves layout)
 *   3. Take Screenshot B (background only)
 *   4. Diff A vs B: pixels that changed = glyph pixels
 *   5. Compute WCAG contrast ratio between text color (A) and background color (B)
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 *
 * Usage: npm run test:contrast-diff
 */

import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const BASE_URL = 'http://localhost:3847';

// Minimum pixel delta in any channel to count as a glyph pixel (filters antialiasing noise)
const GLYPH_DELTA_THRESHOLD = 30;
// Minimum number of glyph pixels before we attempt a contrast check
const MIN_GLYPH_PIXELS = 3;

// ─── WCAG math ───────────────────────────────────────────────────────────────

function relativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── PNG helpers ─────────────────────────────────────────────────────────────

function decodePng(buffer) {
  return PNG.sync.read(buffer);
}

/**
 * Get the RGBA pixel at (x, y) in a decoded PNG.
 * Returns [r, g, b, a].
 */
function getPixel(png, x, y) {
  const offset = (y * png.width + x) * 4;
  return [png.data[offset], png.data[offset + 1], png.data[offset + 2], png.data[offset + 3]];
}

// ─── Mode color helper ────────────────────────────────────────────────────────

/**
 * Find the most-common color (mode) in an array of [r, g, b] triples.
 * We quantize to the nearest 8 to merge near-identical antialiased shades.
 */
function modeColor(colors) {
  const counts = new Map();
  for (const [r, g, b] of colors) {
    const key = `${Math.round(r / 8) * 8},${Math.round(g / 8) * 8},${Math.round(b / 8) * 8}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = key;
    }
  }
  return best ? best.split(',').map(Number) : colors[0];
}

// ─── Text element collection ──────────────────────────────────────────────────

/**
 * Collect all visible text nodes and their bounding rects from the page.
 * Returns an array of element descriptors.
 */
async function collectTextElements(page) {
  return page.evaluate(() => {
    const elements = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const el = textNode.parentElement;
      if (!el || el.offsetParent === null) continue; // skip hidden elements

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rect = range.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue; // skip zero-size rects

      const computed = getComputedStyle(el);
      const fontSize = parseFloat(computed.fontSize);
      const fontWeight = parseInt(computed.fontWeight) || 400;
      // WCAG large text: 18pt (24px) or 14pt bold (18.66px bold)
      const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

      elements.push({
        selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(/\s+/).join('.') : ''),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        fontSize,
        isLargeText,
        text: textNode.textContent.trim().substring(0, 40),
      });
    }
    return elements;
  });
}

// ─── Hide / restore text ──────────────────────────────────────────────────────

async function hideAllText(page) {
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (el) el.style.visibility = 'hidden';
    }
  });
}

async function restoreAllText(page) {
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (el) el.style.visibility = '';
    }
  });
}

// ─── Per-element contrast analysis ───────────────────────────────────────────

/**
 * Analyze contrast for one text element by diffing Screenshot A vs B
 * within the element's bounding rect.
 *
 * Returns: { status, ratio, textColor, bgColor, threshold }
 *   status: 'pass' | 'fail' | 'skip'
 */
function analyzeElement(pngA, pngB, element, viewportWidth, viewportHeight) {
  const { x, y, width, height } = element.rect;

  // Clip rect to viewport bounds
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(viewportWidth - 1, x + width - 1);
  const y1 = Math.min(viewportHeight - 1, y + height - 1);

  if (x1 < x0 || y1 < y0) {
    return { status: 'skip', reason: 'outside viewport' };
  }

  const textColors = [];
  const bgColors = [];

  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const [rA, gA, bA] = getPixel(pngA, px, py);
      const [rB, gB, bB] = getPixel(pngB, px, py);

      const delta = Math.max(
        Math.abs(rA - rB),
        Math.abs(gA - gB),
        Math.abs(bA - bB)
      );

      if (delta >= GLYPH_DELTA_THRESHOLD) {
        textColors.push([rA, gA, bA]);
        bgColors.push([rB, gB, bB]);
      }
    }
  }

  if (textColors.length < MIN_GLYPH_PIXELS) {
    return { status: 'skip', reason: `only ${textColors.length} glyph pixels found` };
  }

  const textColor = modeColor(textColors);
  const bgColor = modeColor(bgColors);
  const ratio = contrastRatio(textColor, bgColor);
  const threshold = element.isLargeText ? 3.0 : 4.5;

  return {
    status: ratio >= threshold ? 'pass' : 'fail',
    ratio,
    textColor,
    bgColor,
    threshold,
  };
}

// ─── RGB to hex ───────────────────────────────────────────────────────────────

function toHex(rgb) {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
}

// ─── Page checker ─────────────────────────────────────────────────────────────

/**
 * Run the screenshot-diff contrast check on one page.
 * Returns a results object for reporting.
 */
async function checkPage(browser, label, url, viewportWidth = 1280, viewportHeight = 800) {
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    // Collect text elements before any changes
    const elements = await collectTextElements(page);

    // Screenshot A: page as-is
    const bufA = await page.screenshot({ type: 'png' });
    const pngA = decodePng(bufA);

    // Hide all text and take Screenshot B
    await hideAllText(page);
    const bufB = await page.screenshot({ type: 'png' });
    const pngB = decodePng(bufB);

    // Restore text (best-effort — context will be closed anyway)
    await restoreAllText(page);

    // Analyze each element
    const elementResults = [];
    for (const el of elements) {
      const analysis = analyzeElement(pngA, pngB, el, viewportWidth, viewportHeight);
      elementResults.push({ element: el, analysis });
    }

    return { label, elementResults };
  } finally {
    await context.close();
  }
}

// ─── Reporting ────────────────────────────────────────────────────────────────

function printPageResults({ label, elementResults }) {
  let checked = 0;
  let passing = 0;
  let failing = 0;
  let skipped = 0;

  const failLines = [];
  const passLines = [];

  for (const { element, analysis } of elementResults) {
    if (analysis.status === 'skip') {
      skipped++;
    } else {
      checked++;
      const threshold = analysis.threshold === 3.0 ? '3:1' : '4.5:1';
      const largeLabel = element.isLargeText ? ' (large text)' : '';
      const ratioStr = analysis.ratio.toFixed(1);

      if (analysis.status === 'pass') {
        passing++;
        passLines.push(
          `  ✅  ${element.selector}: ${ratioStr}:1${largeLabel}, needs ${threshold}`
        );
      } else {
        failing++;
        failLines.push(
          `  ⚠️   ${element.selector}: ${ratioStr}:1 (needs ${threshold})${largeLabel} — text ${toHex(analysis.textColor)} on bg ${toHex(analysis.bgColor)}`
        );
      }
    }
  }

  console.log(`\n${label}:`);
  console.log(`  Checked ${checked} text elements (${skipped} skipped — no glyph pixels)`);

  // Print failures first so they're easy to see
  for (const line of failLines) console.log(line);
  for (const line of passLines) console.log(line);

  return { checked, passing, failing, skipped };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: true });

  const pages = [
    { label: 'Welcome (desktop)', url: `${BASE_URL}/?no-gas` },
    { label: 'Slides: level intro', url: `${BASE_URL}/slides?subgroup=allied&paused` },
    { label: 'About', url: `${BASE_URL}/about` },
    { label: '404', url: `${BASE_URL}/404.html` },
  ];

  console.log('=== Screenshot-Diff Contrast Report ===');

  let totalChecked = 0;
  let totalPassing = 0;
  let totalFailing = 0;
  let totalSkipped = 0;

  try {
    for (const { label, url } of pages) {
      const pageResult = await checkPage(browser, label, url);
      const counts = printPageResults(pageResult);
      totalChecked += counts.checked;
      totalPassing += counts.passing;
      totalFailing += counts.failing;
      totalSkipped += counts.skipped;
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== Summary ===');
  console.log(`Elements checked: ${totalChecked}`);
  console.log(`Passing: ${totalPassing}`);
  console.log(`Failing: ${totalFailing}`);
  console.log(`Skipped (no glyph pixels found): ${totalSkipped}`);

  if (totalFailing > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Screenshot-diff contrast check error:', err);
  process.exit(1);
});
