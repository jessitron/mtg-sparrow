#!/usr/bin/env node
/**
 * Generates per-combo og:image social share cards.
 * Output: images/combo/<id>.png (20 files, 1200x630 each)
 *
 * Each card features:
 *   - Warm brown radial gradient background (same as site og:image)
 *   - Subtle concentric ring decoration
 *   - Pentagon SVG with highlighted colors for this combo
 *   - Combo name in GoudyMediaeval
 *   - Tier label in Jost
 *   - Color names with mana pip images
 *   - Turquoise accent bar
 *   - "mtgcolors.quest" URL watermark
 */

import { guilds, ColorCombo } from "../src/data/combos.js";
import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";

// The shell wrapper cds to the project root before running, so process.cwd() is the project root.
const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "images", "combo");

// Pentagon geometry — same as build-combos.ts
const colorNodes = [
  { id: "W", label: "White", cx: 200, cy: 50, imgX: 166, imgY: 16 },
  { id: "U", label: "Blue", cx: 342.66, cy: 153.65, imgX: 308.66, imgY: 119.65 },
  { id: "B", label: "Black", cx: 288.17, cy: 321.35, imgX: 254.17, imgY: 287.35 },
  { id: "R", label: "Red", cx: 111.83, cy: 321.35, imgX: 77.83, imgY: 287.35 },
  { id: "G", label: "Green", cx: 57.34, cy: 153.65, imgX: 23.34, imgY: 119.65 },
];

const manaColors: Record<string, string> = {
  W: "#E2CD77",
  U: "#56A8BA",
  B: "#6E6689",
  R: "#CD5D2C",
  G: "#819A2F",
};

const colorFullName: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

// Allied pairs (pentagon edges)
const alliedPairs: [string, string][] = [
  ["W", "U"], ["U", "B"], ["B", "R"], ["R", "G"], ["G", "W"],
];

// Enemy pairs (star edges)
const enemyPairs: [string, string][] = [
  ["W", "B"], ["U", "R"], ["B", "G"], ["R", "W"], ["G", "U"],
];

function tierLabel(combo: ColorCombo): string {
  if (combo.tier === "guild" && combo.subgroup === "allied") return "Allied Guild";
  if (combo.tier === "guild" && combo.subgroup === "enemy") return "Enemy Guild";
  if (combo.tier === "wedge") return "Wedge";
  if (combo.tier === "shard") return "Shard";
  return combo.tier;
}

function colorNames(combo: ColorCombo): string {
  return combo.colors.map(c => colorFullName[c]).join(" / ");
}

/**
 * Build a scaled pentagon SVG for the og:image card.
 * The original viewBox is 400x400; we keep that and let width/height control scale.
 */
function buildPentagonSvgInline(activeColors: string[], imageBaseUrl: string): string {
  const activeSet = new Set(activeColors);
  const dimLineColor = "#c8b88a";
  const activeLineColor = "#6C9FB0";

  function isLineActive(a: string, b: string): boolean {
    return activeSet.has(a) && activeSet.has(b);
  }

  let lines = "";

  for (const [a, b] of alliedPairs) {
    const na = colorNodes.find(n => n.id === a)!;
    const nb = colorNodes.find(n => n.id === b)!;
    const active = isLineActive(a, b);
    lines += `<line x1="${na.cx}" y1="${na.cy}" x2="${nb.cx}" y2="${nb.cy}" stroke="${active ? activeLineColor : dimLineColor}" stroke-width="8" opacity="${active ? 0.85 : 0.2}" />\n`;
  }

  for (const [a, b] of enemyPairs) {
    const na = colorNodes.find(n => n.id === a)!;
    const nb = colorNodes.find(n => n.id === b)!;
    const active = isLineActive(a, b);
    lines += `<line x1="${na.cx}" y1="${na.cy}" x2="${nb.cx}" y2="${nb.cy}" stroke="${active ? activeLineColor : dimLineColor}" stroke-width="8" opacity="${active ? 0.85 : 0.2}" />\n`;
  }

  let nodes = "";
  for (const node of colorNodes) {
    const active = activeSet.has(node.id);
    const opacity = active ? 1 : 0.3;
    nodes += `<image href="${imageBaseUrl}/${node.id}.svg" x="${node.imgX}" y="${node.imgY}" width="68" height="68" opacity="${opacity}" />\n`;
  }

  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" width="300" height="300" role="img" aria-label="Pentagon highlighting ${activeColors.map(c => colorFullName[c]).join(" and ")}">
${lines}
${nodes}
</svg>`;
}

function buildManaPips(colors: string[], imageBaseUrl: string): string {
  return colors.map(c =>
    `<img src="${imageBaseUrl}/${c}.svg" alt="${colorFullName[c]}" width="36" height="36" style="display:inline-block;vertical-align:middle;margin-right:6px;" />`
  ).join("");
}

function buildComboCardHtml(combo: ColorCombo, projectRootUrl: string): string {
  const imageBaseUrl = `${projectRootUrl}/images`;
  const fontBaseUrl = `${projectRootUrl}/font/goudy-medieval`;
  const tier = tierLabel(combo);
  const colors = colorNames(combo);
  const pentagon = buildPentagonSvgInline(combo.colors, imageBaseUrl);
  const pips = buildManaPips(combo.colors, imageBaseUrl);

  // Dominant active color for subtle accent glow
  const firstColor = combo.colors[0];
  const accentColor = manaColors[firstColor] ?? "#6C9FB0";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @font-face {
      font-family: 'GoudyMediaeval';
      src: url('${fontBaseUrl}/Goudy Mediaeval Regular.ttf') format('truetype');
      font-weight: normal;
    }
    @font-face {
      font-family: 'GoudyMediaeval';
      src: url('${fontBaseUrl}/Goudy Mediaeval DemiBold.ttf') format('truetype');
      font-weight: bold;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Jost', system-ui, sans-serif;
      background: #111;
    }
    .og-card {
      width: 1200px;
      height: 630px;
      position: relative;
      overflow: hidden;
      background: radial-gradient(ellipse at center, #8D6137 0%, #7D572D 40%, #272817 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .og-bg-rings {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.07;
      pointer-events: none;
    }
    .og-content {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 60px;
      gap: 60px;
    }
    .og-pentagon {
      flex-shrink: 0;
      width: 300px;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 24px ${accentColor}44);
    }
    .og-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .og-name {
      font-family: 'GoudyMediaeval', 'Georgia', 'Times New Roman', serif;
      font-size: 80px;
      font-weight: bold;
      color: #e8e0d0;
      letter-spacing: 0.04em;
      text-shadow: 2px 4px 16px rgba(0,0,0,0.8), 0 0 60px rgba(226,205,119,0.15);
      line-height: 1;
    }
    .og-tier {
      font-family: 'Jost', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 600;
      color: #c8b88a;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      text-shadow: 1px 2px 8px rgba(0,0,0,0.7);
    }
    .og-colors {
      font-family: 'Jost', system-ui, sans-serif;
      font-size: 22px;
      color: #a09070;
      letter-spacing: 0.06em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .og-colors-text {
      margin-left: 4px;
    }
    .og-accent-bar {
      width: 360px;
      height: 4px;
      background: #6C9FB0;
      margin-top: 4px;
    }
    .og-url {
      position: absolute;
      bottom: 24px;
      right: 36px;
      font-family: 'Jost', system-ui, sans-serif;
      font-size: 17px;
      color: #6C9FB0;
      letter-spacing: 0.08em;
      opacity: 0.75;
      z-index: 3;
    }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
<div class="og-card" id="og-card">
  <!-- Decorative concentric rings -->
  <div class="og-bg-rings">
    <svg width="900" height="900" viewBox="0 0 900 900" fill="none">
      <circle cx="450" cy="450" r="380" stroke="#c8b88a" stroke-width="1"/>
      <circle cx="450" cy="450" r="300" stroke="#c8b88a" stroke-width="1"/>
      <circle cx="450" cy="450" r="220" stroke="#c8b88a" stroke-width="1"/>
      <circle cx="450" cy="450" r="140" stroke="#c8b88a" stroke-width="1"/>
    </svg>
  </div>

  <div class="og-content">
    <div class="og-pentagon">
      ${pentagon}
    </div>
    <div class="og-text">
      <div class="og-name">${combo.name}</div>
      <div class="og-tier">${tier}</div>
      <div class="og-colors">
        ${pips}
        <span class="og-colors-text">${colors}</span>
      </div>
      <div class="og-accent-bar"></div>
    </div>
  </div>

  <div class="og-url">mtgcolors.quest</div>
</div>
</body>
</html>`;
}

// --- Main ---
fs.mkdirSync(outputDir, { recursive: true });

const projectRootUrl = `file://${projectRoot}`;

const browser = await chromium.launch();
const browserPage = await browser.newPage();
await browserPage.setViewportSize({ width: 1200, height: 630 });

let count = 0;
for (const combo of guilds) {
  const html = buildComboCardHtml(combo, projectRootUrl);
  const outputFile = path.join(outputDir, `${combo.id}.png`);

  // Write HTML to a temp file so file:// image references resolve correctly
  const tmpHtml = `/tmp/combo-og-${combo.id}.html`;
  fs.writeFileSync(tmpHtml, html, "utf-8");

  await browserPage.goto(`file://${tmpHtml}`);

  // Wait for network (Google Fonts) and for document fonts to load
  await browserPage.waitForLoadState("networkidle");
  await browserPage.evaluate(() => document.fonts.ready);

  // Small buffer for font rendering
  await browserPage.waitForTimeout(300);

  const element = await browserPage.$("#og-card");
  if (!element) {
    console.error(`Could not find #og-card for ${combo.id}`);
    continue;
  }

  await browserPage.screenshot({
    path: outputFile,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  console.log(`Generated: images/combo/${combo.id}.png`);
  count++;
}

await browser.close();

// Clean up temp files
for (const combo of guilds) {
  const tmpHtml = `/tmp/combo-og-${combo.id}.html`;
  if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
}

console.log(`\nDone — generated ${count} combo og:images in images/combo/`);
