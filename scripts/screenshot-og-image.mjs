#!/usr/bin/env node
// Renders the og-image mockup HTML and screenshots the #og-full element at 1200x630.
// Called by generate-og-image.sh.

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const htmlFile = path.join(
  projectRoot,
  'small-arc-studios/roles/designer/notes/mockups/og-image-options.html'
);
const outputFile = path.join(projectRoot, 'images/og-image.png');

const browser = await chromium.launch();
const page = await browser.newPage();

// Set viewport large enough for the 1200x630 card plus page chrome (body has 40px padding)
await page.setViewportSize({ width: 1400, height: 1200 });

// Load the file. file:// URLs work fine for local assets.
await page.goto(`file://${htmlFile}`);

// Wait for network to go idle (Google Fonts) and for document fonts to load
await page.waitForLoadState('networkidle');
await page.evaluate(() => document.fonts.ready);

// Extra buffer for font rendering
await page.waitForTimeout(500);

const element = await page.$('#og-full');
if (!element) {
  console.error('Could not find #og-full element');
  process.exit(1);
}

const box = await element.boundingBox();
if (!box) {
  console.error('Could not get bounding box for #og-full');
  process.exit(1);
}

// Enforce exact 1200x630 regardless of sub-pixel rounding
await page.screenshot({
  path: outputFile,
  clip: { x: box.x, y: box.y, width: 1200, height: 630 },
});

console.log(`Saved: ${outputFile}`);
await browser.close();
