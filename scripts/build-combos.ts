/**
 * Generates static HTML pages for each color combo.
 * Output: combo/<id>.html (20 files at project root)
 *
 * Each page is fully self-contained HTML with SEO metadata
 * and semantic content visible without JS.
 */

import { guilds, ColorCombo, colorEmojiMap } from "../src/data/combos.js";
import { guildDescriptionMap } from "../src/data/guild-descriptions.js";
import * as fs from "fs";
import * as path from "path";

const COMBO_DIR = path.join(process.cwd(), "combo");

// Pentagon geometry — matches guild-columns.ts
const colorNodes = [
  { id: "W", label: "White", cx: 200, cy: 50 },
  { id: "U", label: "Blue", cx: 342.66, cy: 153.65 },
  { id: "B", label: "Black", cx: 288.17, cy: 321.35 },
  { id: "R", label: "Red", cx: 111.83, cy: 321.35 },
  { id: "G", label: "Green", cx: 57.34, cy: 153.65 },
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

function buildPentagonSvg(activeColors: string[]): string {
  const activeSet = new Set(activeColors);
  const r = 30; // node radius
  const dimColor = "#3a3a3a";
  const dimLineColor = "#2a2a2a";
  const activeLineColor = "#c8b88a";

  // Determine which lines to draw and whether they're active
  function isLineActive(a: string, b: string): boolean {
    return activeSet.has(a) && activeSet.has(b);
  }

  let lines = "";

  // Draw all allied (edge) lines
  for (const [a, b] of alliedPairs) {
    const na = colorNodes.find(n => n.id === a)!;
    const nb = colorNodes.find(n => n.id === b)!;
    const active = isLineActive(a, b);
    lines += `<line x1="${na.cx}" y1="${na.cy}" x2="${nb.cx}" y2="${nb.cy}" stroke="${active ? activeLineColor : dimLineColor}" stroke-width="${active ? 3 : 1.5}" opacity="${active ? 1 : 0.3}" />\n`;
  }

  // Draw all enemy (star) lines
  for (const [a, b] of enemyPairs) {
    const na = colorNodes.find(n => n.id === a)!;
    const nb = colorNodes.find(n => n.id === b)!;
    const active = isLineActive(a, b);
    lines += `<line x1="${na.cx}" y1="${na.cy}" x2="${nb.cx}" y2="${nb.cy}" stroke="${active ? activeLineColor : dimLineColor}" stroke-width="${active ? 3 : 1.5}" stroke-dasharray="${active ? "none" : "6 4"}" opacity="${active ? 1 : 0.3}" />\n`;
  }

  // Draw nodes
  let nodes = "";
  for (const node of colorNodes) {
    const active = activeSet.has(node.id);
    const fill = active ? manaColors[node.id] : dimColor;
    const opacity = active ? 1 : 0.4;
    nodes += `<circle cx="${node.cx}" cy="${node.cy}" r="${r}" fill="${fill}" opacity="${opacity}" stroke="${active ? "#fff" : "#555"}" stroke-width="${active ? 2 : 1}" />\n`;
    // Mana symbol image
    nodes += `<image href="../images/${node.id}.svg" x="${node.cx - 20}" y="${node.cy - 20}" width="40" height="40" opacity="${opacity}" />\n`;
  }

  return `<svg viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg" class="combo-pentagon" role="img" aria-label="Five-color pentagon highlighting ${activeColors.map(c => colorFullName[c]).join(" and ")}">
${lines}
${nodes}
</svg>`;
}

function buildCardGallery(combo: ColorCombo): string {
  const cards = combo.cards ?? [];
  if (cards.length === 0) return `<p class="combo-no-cards">No example cards yet.</p>`;

  return `<div class="combo-card-gallery">
${cards.map(card => `  <figure class="combo-card">
    <img src="${card.imageUrl}" alt="${escapeHtml(card.name)}" loading="lazy" width="240" height="340" />
    <figcaption>${escapeHtml(card.name)}</figcaption>
  </figure>`).join("\n")}
</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPage(combo: ColorCombo): string {
  const desc = guildDescriptionMap[combo.id];
  const description = desc?.description ?? "";
  const scryfallUrl = desc?.scryfallUrl ?? "";
  const tier = tierLabel(combo);
  const colors = colorNames(combo);
  const cardCount = combo.cards?.length ?? 0;
  const metaDesc = `${combo.name} — ${tier} (${colors}). ${description.slice(0, 120)}`;
  const colorEmojis = combo.colors.map(c => colorEmojiMap[c] ?? c).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${combo.name} — ${tier} (${colors}) — MTG Colors</title>
  <meta name="description" content="${escapeHtml(metaDesc)}">
  <meta property="og:title" content="${combo.name} — ${tier} — MTG Colors">
  <meta property="og:description" content="${escapeHtml(description.slice(0, 200))}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://mtgcolors.quest/combo/${combo.id}.html">
  <meta property="og:site_name" content="MTG Colors">
  <link rel="canonical" href="https://mtgcolors.quest/combo/${combo.id}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap">
  <link rel="icon" href="../images/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../style.css">
  <link rel="stylesheet" href="../combo.css">
</head>
<body>
  <a href="../" class="home-spiral" title="Home"></a>
  <main id="app">
    <article class="combo-page">
      <header class="combo-header">
        <div class="combo-pentagon-container">
          ${buildPentagonSvg(combo.colors)}
        </div>
        <div class="combo-title-block">
          <h1 class="combo-name">${escapeHtml(combo.name)}</h1>
          <p class="combo-tier">${tier}</p>
          <p class="combo-colors">${colorEmojis} ${escapeHtml(colors)}</p>
        </div>
      </header>

      <section class="combo-description">
        <p>${escapeHtml(description)}</p>
      </section>

      <section class="combo-cards">
        <h2>Example Cards <span class="combo-card-count">(${cardCount})</span></h2>
        ${buildCardGallery(combo)}
      </section>

      <footer class="combo-footer">
        <a href="${scryfallUrl}" target="_blank" rel="noopener noreferrer" class="combo-scryfall-link">Browse more ${combo.name} cards on Scryfall &rarr;</a>
        <a href="../" class="combo-home-link">Back to MTG Colors</a>
      </footer>
    </article>
  </main>
</body>
</html>
`;
}

// --- Main ---
fs.mkdirSync(COMBO_DIR, { recursive: true });

let count = 0;
for (const combo of guilds) {
  const html = buildPage(combo);
  const outPath = path.join(COMBO_DIR, `${combo.id}.html`);
  fs.writeFileSync(outPath, html, "utf-8");
  count++;
}

console.log(`Generated ${count} combo pages in combo/`);
