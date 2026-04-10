/**
 * Screenshot-Diff Contrast Check
 *
 * Uses a two-screenshot diff technique to verify text contrast against
 * actual rendered backgrounds — including gradients and semi-transparent layers
 * that axe-core cannot analyze.
 *
 * Technique:
 *   1. Collect text elements + data-contrast-check labeled elements
 *   2. Take Screenshot A (everything visible)
 *   3. Hide text (color: transparent) and labeled non-text elements (opacity: 0)
 *   4. Take Screenshot B (background only)
 *   5. Diff A vs B per element: changed pixels = glyph/icon pixels
 *   6. Compute WCAG contrast ratio from sampled colors
 *
 * Produces:
 *   - Console summary (pass/fail counts)
 *   - HTML report at tests/contrast-report.html with embedded screenshots
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 *
 * Usage: npm run test:contrast-diff
 */

import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'fs';

const BASE_URL = 'http://localhost:3847';
const REPORT_PATH = 'tests/contrast-report.html';

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

function getPixel(png, x, y) {
  const offset = (y * png.width + x) * 4;
  return [png.data[offset], png.data[offset + 1], png.data[offset + 2], png.data[offset + 3]];
}

/**
 * Crop a rectangular region from a PNG, returning a new PNG buffer.
 */
function cropPng(png, x, y, w, h) {
  // Clamp to image bounds
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(png.width, x + w);
  const y1 = Math.min(png.height, y + h);
  const cw = x1 - x0;
  const ch = y1 - y0;
  if (cw <= 0 || ch <= 0) return null;

  const cropped = new PNG({ width: cw, height: ch });
  for (let row = 0; row < ch; row++) {
    const srcOffset = ((y0 + row) * png.width + x0) * 4;
    const dstOffset = row * cw * 4;
    png.data.copy(cropped.data, dstOffset, srcOffset, srcOffset + cw * 4);
  }
  return PNG.sync.write(cropped);
}

// ─── Mode color helper ────────────────────────────────────────────────────────

/**
 * Find the most-common color (mode) in an array of [r, g, b] triples.
 * Quantize to nearest 8 to merge near-identical antialiased shades.
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

function toHex(rgb) {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
}

// ─── Element collection ──────────────────────────────────────────────────────

/**
 * Collect all checkable elements:
 * 1. All visible text nodes (auto-discovered)
 * 2. All elements with data-contrast-check attribute (explicit opt-in)
 *
 * For text nodes, the label is auto-generated from the parent element.
 * For data-contrast-check elements, the attribute value is the label.
 *
 * Returns array of { label, selector, rect, fontSize, isLargeText, text, type }
 *   type: 'text' | 'labeled'
 */
async function collectElements(page) {
  return page.evaluate(() => {
    const elements = [];
    const seen = new Set(); // avoid duplicates between text walk and labeled elements

    // 1. Walk all text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const el = textNode.parentElement;
      if (!el || el.offsetParent === null) continue;

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rect = range.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;

      const computed = getComputedStyle(el);
      const fontSize = parseFloat(computed.fontSize);
      const fontWeight = parseInt(computed.fontWeight) || 400;
      const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

      // Use data-contrast-check as label if present on this element or an ancestor
      const labelEl = el.closest('[data-contrast-check]');
      const label = labelEl?.dataset.contrastCheck || null;

      elements.push({
        label,
        selector: el.tagName.toLowerCase() + (el.className ? '.' + [...el.classList].join('.') : ''),
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        fontSize,
        isLargeText,
        text: textNode.textContent.trim().substring(0, 50),
        type: 'text',
      });
    }

    // 2. Collect data-contrast-check elements that aren't text (e.g. SVG icons)
    const labeled = document.querySelectorAll('[data-contrast-check]');
    for (const el of labeled) {
      // Skip if this element contains text nodes (already covered above)
      const hasText = el.querySelector('*') ?
        [...el.querySelectorAll('*')].some(child => {
          return [...child.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
        }) || [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
        : [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());

      // For labeled non-text elements (like SVG icon buttons), add them
      if (!hasText || el.querySelector('svg')) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;

        const computed = getComputedStyle(el);
        const fontSize = parseFloat(computed.fontSize);
        const isLargeText = fontSize >= 24; // icons are treated like large text for thresholds

        elements.push({
          label: el.dataset.contrastCheck,
          selector: el.tagName.toLowerCase() + (el.className ? '.' + [...el.classList].join('.') : ''),
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
          fontSize,
          isLargeText,
          text: `[${el.dataset.contrastCheck}]`,
          type: 'labeled',
        });
      }
    }

    return elements;
  });
}

// ─── Hide / restore ──────────────────────────────────────────────────────────

/**
 * Hide text and labeled elements for the diff screenshot.
 *
 * Text elements: color: transparent (preserves backgrounds)
 * Labeled non-text elements: opacity: 0 (hides SVG strokes/fills)
 *
 * CSS transitions are disabled first so changes apply instantly.
 */
async function hideElements(page) {
  await page.evaluate(() => {
    // Disable all CSS transitions
    const style = document.createElement('style');
    style.id = '__contrast-check-no-transitions';
    style.textContent = '* { transition: none !important; }';
    document.head.appendChild(style);

    // Hide text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (el) {
        el.dataset._origColor = el.style.color;
        el.style.color = 'transparent';
      }
    }

    // Hide labeled non-text elements (SVG icons etc.)
    const labeled = document.querySelectorAll('[data-contrast-check]');
    for (const el of labeled) {
      // Only hide via opacity if it's not purely a text container
      if (el.querySelector('svg') || !el.textContent.trim()) {
        el.dataset._origOpacity = el.style.opacity;
        el.style.opacity = '0';
      }
    }
  });
}

async function restoreElements(page) {
  await page.evaluate(() => {
    // Restore text color
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (el) {
        el.style.color = el.dataset._origColor ?? '';
        delete el.dataset._origColor;
      }
    }

    // Restore labeled elements
    const labeled = document.querySelectorAll('[data-contrast-check]');
    for (const el of labeled) {
      if (el.dataset._origOpacity !== undefined) {
        el.style.opacity = el.dataset._origOpacity;
        delete el.dataset._origOpacity;
      }
    }

    // Re-enable transitions
    const style = document.getElementById('__contrast-check-no-transitions');
    if (style) style.remove();
  });
}

// ─── Per-element contrast analysis ───────────────────────────────────────────

function analyzeElement(pngA, pngB, element) {
  const { x, y, width, height } = element.rect;

  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(pngA.width - 1, x + width - 1);
  const y1 = Math.min(pngA.height - 1, y + height - 1);

  if (x1 < x0 || y1 < y0) {
    return { status: 'skip', reason: 'outside screenshot bounds' };
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
    const totalPixels = (x1 - x0 + 1) * (y1 - y0 + 1);
    return { status: 'skip', reason: `only ${textColors.length} glyph pixels in ${totalPixels} total (rect: ${x},${y} ${width}x${height})` };
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
    glyphPixelCount: textColors.length,
  };
}

// ─── Page checker ─────────────────────────────────────────────────────────────

async function checkPage(browser, label, url, viewportWidth = 1280, viewportHeight = 800) {
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    const elements = await collectElements(page);

    // Screenshot A: full page, as rendered
    const bufA = await page.screenshot({ type: 'png', fullPage: true });
    const pngA = decodePng(bufA);

    // Hide text + labeled elements, take Screenshot B
    await hideElements(page);
    const bufB = await page.screenshot({ type: 'png', fullPage: true });
    const pngB = decodePng(bufB);

    await restoreElements(page);

    // Analyze each element
    const elementResults = [];
    for (const el of elements) {
      const analysis = analyzeElement(pngA, pngB, el);

      // Crop the element from Screenshot A for the report
      const padding = 4;
      const cropBuf = cropPng(pngA,
        el.rect.x - padding, el.rect.y - padding,
        el.rect.width + padding * 2, el.rect.height + padding * 2
      );

      elementResults.push({
        element: el,
        analysis,
        cropBase64: cropBuf ? cropBuf.toString('base64') : null,
      });
    }

    // Full-page Screenshot A as base64 for the report
    const fullPageBase64 = bufA.toString('base64');

    return { label, url, elementResults, fullPageBase64, width: pngA.width, height: pngA.height };
  } finally {
    await context.close();
  }
}

// ─── Console reporting ───────────────────────────────────────────────────────

function printPageResults({ label, elementResults }) {
  let checked = 0, passing = 0, failing = 0, skipped = 0;
  const failLines = [], passLines = [], skipLines = [];

  for (const { element, analysis } of elementResults) {
    const displayName = element.label || element.selector;

    if (analysis.status === 'skip') {
      skipped++;
      skipLines.push(`  ⏭️   ${displayName}: "${element.text}" — ${analysis.reason}`);
    } else {
      checked++;
      const threshold = analysis.threshold === 3.0 ? '3:1' : '4.5:1';
      const largeLabel = element.isLargeText ? ' (large text)' : '';
      const ratioStr = analysis.ratio.toFixed(1);

      if (analysis.status === 'pass') {
        passing++;
        passLines.push(`  ✅  ${displayName}: ${ratioStr}:1${largeLabel}, needs ${threshold}`);
      } else {
        failing++;
        failLines.push(`  ⚠️   ${displayName}: ${ratioStr}:1 (needs ${threshold})${largeLabel} — text ${toHex(analysis.textColor)} on bg ${toHex(analysis.bgColor)}`);
      }
    }
  }

  console.log(`\n${label}:`);
  console.log(`  Checked ${checked} text elements (${skipped} skipped)`);
  for (const line of failLines) console.log(line);
  for (const line of passLines) console.log(line);
  for (const line of skipLines) console.log(line);

  return { checked, passing, failing, skipped };
}

// ─── HTML report ─────────────────────────────────────────────────────────────

function generateHtmlReport(allResults, totals) {
  const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z/, ' UTC');

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contrast Report — ${timestamp}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #1a1a2e; color: #e0e0e0; padding: 2rem; line-height: 1.5; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  h2 { font-size: 1.2rem; margin: 2rem 0 1rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
  .summary { background: #16213e; border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem; display: flex; gap: 2rem; flex-wrap: wrap; }
  .summary-stat { text-align: center; }
  .summary-stat .number { font-size: 2rem; font-weight: 700; }
  .summary-stat .label { font-size: 0.8rem; opacity: 0.7; text-transform: uppercase; }
  .stat-pass .number { color: #4ade80; }
  .stat-fail .number { color: #f87171; }
  .stat-skip .number { color: #fbbf24; }
  .stat-total .number { color: #60a5fa; }

  .page-section { margin-bottom: 3rem; }
  .page-screenshot { margin: 1rem 0; }
  .page-screenshot img { max-width: 100%; border: 1px solid #333; border-radius: 4px; }
  .page-screenshot summary { cursor: pointer; opacity: 0.7; font-size: 0.85rem; }

  .element-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .element-card { background: #16213e; border-radius: 8px; padding: 1rem; display: grid; grid-template-columns: auto 1fr; gap: 1rem; align-items: center; border-left: 4px solid #333; }
  .element-card.pass { border-left-color: #4ade80; }
  .element-card.fail { border-left-color: #f87171; }
  .element-card.skip { border-left-color: #fbbf24; opacity: 0.6; }

  .element-crop { border: 1px solid #444; border-radius: 4px; max-width: 300px; max-height: 80px; object-fit: contain; background: #000; }
  .element-info { display: flex; flex-direction: column; gap: 0.25rem; }
  .element-name { font-weight: 600; font-size: 0.95rem; }
  .element-text { font-size: 0.8rem; opacity: 0.6; font-style: italic; }
  .element-ratio { font-size: 1.1rem; font-weight: 700; }
  .element-ratio.pass { color: #4ade80; }
  .element-ratio.fail { color: #f87171; }
  .element-details { font-size: 0.8rem; opacity: 0.7; }

  .color-swatches { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem; }
  .swatch { width: 24px; height: 24px; border-radius: 4px; border: 1px solid #555; display: inline-block; }
  .swatch-label { font-size: 0.75rem; opacity: 0.6; }
  .swatch-pair { display: flex; align-items: center; gap: 0.25rem; }
</style>
</head>
<body>
<h1>Contrast Report</h1>
<p style="opacity: 0.6; margin-bottom: 1rem;">${timestamp}</p>

<div class="summary">
  <div class="summary-stat stat-total"><div class="number">${totals.checked}</div><div class="label">Checked</div></div>
  <div class="summary-stat stat-pass"><div class="number">${totals.passing}</div><div class="label">Passing</div></div>
  <div class="summary-stat stat-fail"><div class="number">${totals.failing}</div><div class="label">Failing</div></div>
  <div class="summary-stat stat-skip"><div class="number">${totals.skipped}</div><div class="label">Skipped</div></div>
</div>
`;

  for (const pageResult of allResults) {
    const { label, url, elementResults, fullPageBase64, width, height } = pageResult;
    const fails = elementResults.filter(r => r.analysis.status === 'fail');
    const passes = elementResults.filter(r => r.analysis.status === 'pass');
    const skips = elementResults.filter(r => r.analysis.status === 'skip');

    html += `<div class="page-section">
<h2>${escHtml(label)} <span style="font-weight:normal;opacity:0.5;font-size:0.85rem">(${fails.length} fail, ${passes.length} pass, ${skips.length} skip)</span></h2>
<p style="font-size:0.8rem;opacity:0.5;margin-bottom:0.75rem">${escHtml(url)}</p>

<div class="element-list">
`;

    // Failures first, then passes, then skips
    const sorted = [...fails, ...passes, ...skips];
    for (const { element, analysis, cropBase64 } of sorted) {
      const displayName = element.label || element.selector;
      const statusClass = analysis.status;

      html += `<div class="element-card ${statusClass}">`;

      // Crop image
      if (cropBase64) {
        html += `<img class="element-crop" src="data:image/png;base64,${cropBase64}" alt="${escHtml(displayName)}">`;
      } else {
        html += `<div style="width:60px;height:40px;background:#333;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;opacity:0.5">no crop</div>`;
      }

      html += `<div class="element-info">`;
      html += `<div class="element-name">${escHtml(displayName)}</div>`;
      html += `<div class="element-text">"${escHtml(element.text)}"</div>`;

      if (analysis.status === 'skip') {
        html += `<div class="element-details">${escHtml(analysis.reason)}</div>`;
      } else {
        const threshold = analysis.threshold === 3.0 ? '3:1' : '4.5:1';
        const large = element.isLargeText ? ' (large text)' : '';
        html += `<div class="element-ratio ${analysis.status}">${analysis.ratio.toFixed(1)}:1${large}</div>`;
        html += `<div class="element-details">needs ${threshold} · ${analysis.glyphPixelCount} glyph pixels sampled</div>`;

        if (analysis.textColor && analysis.bgColor) {
          const tHex = toHex(analysis.textColor);
          const bHex = toHex(analysis.bgColor);
          html += `<div class="color-swatches">
  <div class="swatch-pair"><span class="swatch" style="background:${tHex}"></span><span class="swatch-label">text ${tHex}</span></div>
  <span style="opacity:0.3">on</span>
  <div class="swatch-pair"><span class="swatch" style="background:${bHex}"></span><span class="swatch-label">bg ${bHex}</span></div>
</div>`;
        }
      }

      html += `</div></div>\n`;
    }

    html += `</div>\n`;

    // Full page screenshot in a collapsible details
    html += `<details class="page-screenshot">
<summary>Full page screenshot (${width}×${height})</summary>
<img src="data:image/png;base64,${fullPageBase64}" alt="Full page screenshot of ${escHtml(label)}">
</details>
</div>\n`;
  }

  html += `</body></html>`;
  return html;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  let totalChecked = 0, totalPassing = 0, totalFailing = 0, totalSkipped = 0;
  const allResults = [];

  try {
    for (const { label, url } of pages) {
      const pageResult = await checkPage(browser, label, url);
      allResults.push(pageResult);
      const counts = printPageResults(pageResult);
      totalChecked += counts.checked;
      totalPassing += counts.passing;
      totalFailing += counts.failing;
      totalSkipped += counts.skipped;
    }
  } finally {
    await browser.close();
  }

  const totals = { checked: totalChecked, passing: totalPassing, failing: totalFailing, skipped: totalSkipped };

  console.log('\n=== Summary ===');
  console.log(`Elements checked: ${totalChecked}`);
  console.log(`Passing: ${totalPassing}`);
  console.log(`Failing: ${totalFailing}`);
  console.log(`Skipped (no glyph pixels found): ${totalSkipped}`);

  // Generate HTML report
  const html = generateHtmlReport(allResults, totals);
  fs.writeFileSync(REPORT_PATH, html);
  console.log(`\nHTML report: ${REPORT_PATH}`);

  if (totalFailing > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Screenshot-diff contrast check error:', err);
  process.exit(1);
});
