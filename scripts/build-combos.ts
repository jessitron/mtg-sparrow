/**
 * Generates static HTML pages for each color combo.
 * Output: combo/<id>.html (20 files at project root)
 *
 * Each page is fully self-contained HTML with SEO metadata
 * and semantic content visible without JS.
 */

import { guilds, ColorCombo } from "../src/data/combos.js";
import { guildDescriptionMap } from "../src/data/guild-descriptions.js";
import * as fs from "fs";
import * as path from "path";

const COMBO_DIR = path.join(process.cwd(), "combo");

// Pentagon geometry — matches guild-columns.ts
// Matches guild-columns.ts node positions exactly
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

function subgroupParam(combo: ColorCombo): string {
  if (combo.tier === "guild" && combo.subgroup === "allied") return "allied";
  if (combo.tier === "guild" && combo.subgroup === "enemy") return "enemy";
  if (combo.tier === "wedge") return "wedges";
  if (combo.tier === "shard") return "shards";
  return "allied";
}

function subgroupLabel(combo: ColorCombo): string {
  if (combo.tier === "guild" && combo.subgroup === "allied") return "allied guild";
  if (combo.tier === "guild" && combo.subgroup === "enemy") return "enemy guild";
  if (combo.tier === "wedge") return "wedge";
  if (combo.tier === "shard") return "shard";
  return combo.tier;
}

function colorNames(combo: ColorCombo): string {
  return combo.colors.map(c => colorFullName[c]).join(" / ");
}

function buildPentagonSvg(activeColors: string[]): string {
  const activeSet = new Set(activeColors);
  const dimLineColor = "#c8b88a";
  const activeLineColor = "#6C9FB0"; // --card-back-turquoise — pops against the dim khaki

  function isLineActive(a: string, b: string): boolean {
    return activeSet.has(a) && activeSet.has(b);
  }

  let lines = "";

  // Allied (edge) lines — matching end page: stroke-width 8, opacity 0.75 active / 0.2 dim
  for (const [a, b] of alliedPairs) {
    const na = colorNodes.find(n => n.id === a)!;
    const nb = colorNodes.find(n => n.id === b)!;
    const active = isLineActive(a, b);
    lines += `<line x1="${na.cx}" y1="${na.cy}" x2="${nb.cx}" y2="${nb.cy}" stroke="${active ? activeLineColor : dimLineColor}" stroke-width="8" opacity="${active ? 0.85 : 0.2}" />\n`;
  }

  // Enemy (star) lines
  for (const [a, b] of enemyPairs) {
    const na = colorNodes.find(n => n.id === a)!;
    const nb = colorNodes.find(n => n.id === b)!;
    const active = isLineActive(a, b);
    lines += `<line x1="${na.cx}" y1="${na.cy}" x2="${nb.cx}" y2="${nb.cy}" stroke="${active ? activeLineColor : dimLineColor}" stroke-width="8" opacity="${active ? 0.85 : 0.2}" />\n`;
  }

  // Mana symbol images — no circles, just the SVG icons at 68x68 (matches end page)
  let nodes = "";
  for (const node of colorNodes) {
    const active = activeSet.has(node.id);
    const opacity = active ? 1 : 0.3;
    nodes += `<image href="../images/${node.id}.svg" x="${node.imgX}" y="${node.imgY}" width="68" height="68" opacity="${opacity}" />\n`;
  }

  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" class="combo-pentagon" role="img" aria-label="Five-color pentagon highlighting ${activeColors.map(c => colorFullName[c]).join(" and ")}">
${lines}
${nodes}
</svg>`;
}

function buildCardGallery(combo: ColorCombo): string {
  const cards = combo.cards ?? [];
  if (cards.length === 0) return `<p class="combo-no-cards">No example cards yet.</p>`;

  return `<div class="combo-card-gallery">
${cards.map(card => `  <figure class="combo-card">
    <img src="${card.imageUrl}" alt="${escapeHtml(card.flavor ?? card.name)}" loading="lazy" width="240" height="340" />
    <figcaption>${escapeHtml(card.name)}</figcaption>
  </figure>`).join("\n")}
</div>`;
}

function manaPips(colors: string[], size = 24): string {
  return colors.map(c =>
    `<img src="../images/${c}.svg" alt="${colorFullName[c]}" width="${size}" height="${size}" class="mana-pip-inline" />`
  ).join("");
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
  const flavor = desc?.flavor ?? "";
  const scryfallUrl = desc?.scryfallUrl ?? "";
  const tier = tierLabel(combo);
  const colors = colorNames(combo);
  const cardCount = combo.cards?.length ?? 0;
  const metaDesc = `${combo.name} — ${tier} (${colors}). ${description.slice(0, 120)}`;
  const pips = manaPips(combo.colors);
  const hasGuildLogo = combo.tier === "guild";
  const guildLogoHtml = hasGuildLogo
    ? `\n          <img src="../images/${combo.id}.png" alt="${combo.name} guild crest" class="combo-guild-logo" width="80" height="80" />`
    : "";

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
  <meta property="og:image" content="https://mtgcolors.quest/images/combo/${combo.id}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://mtgcolors.quest/images/combo/${combo.id}.png">
  <link rel="canonical" href="https://mtgcolors.quest/combo/${combo.id}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap">
  <link rel="icon" href="../images/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../style.css">
  <link rel="stylesheet" href="../combo.css">
</head>
<body data-combo-id="${combo.id}">
  <script type="module" src="../dist/combo-telemetry.js"></script>
  <a href="../" class="home-spiral" title="Home"></a>
  <main id="app">
    <article class="combo-page">
      <nav class="combo-breadcrumb"><a href="./">All combinations</a> &rsaquo; ${escapeHtml(combo.name)}</nav>
      <header class="combo-header">
        <div class="combo-pentagon-container">
          ${buildPentagonSvg(combo.colors)}
        </div>
        <div class="combo-title-block">
          <h1 class="combo-name">${escapeHtml(combo.name)}</h1>
          <p class="combo-tier">${tier}</p>
          <p class="combo-colors" aria-label="${escapeHtml(colors)}">${pips}</p>
        </div>${guildLogoHtml}
      </header>

      <section class="combo-description">
        <p>${escapeHtml(description)}</p>${flavor ? `
        <p class="combo-flavor">${escapeHtml(flavor)}</p>` : ""}
      </section>

      <div class="combo-cta">
        <a href="../slides?subgroup=${subgroupParam(combo)}&from=combo_page" class="combo-learn-button combo-learn-button--prominent">Learn ${subgroupLabel(combo)} names</a>
      </div>

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

function buildIndexPage(): string {
  const groups: { label: string; subgroup: string; combos: ColorCombo[] }[] = [
    { label: "Allied Guilds", subgroup: "allied", combos: guilds.filter(g => g.tier === "guild" && g.subgroup === "allied") },
    { label: "Enemy Guilds", subgroup: "enemy", combos: guilds.filter(g => g.tier === "guild" && g.subgroup === "enemy") },
    { label: "Wedges", subgroup: "wedges", combos: guilds.filter(g => g.tier === "wedge") },
    { label: "Shards", subgroup: "shards", combos: guilds.filter(g => g.tier === "shard") },
  ];

  const sections = groups.map(group => {
    const items = group.combos.map(combo => {
      const pips = manaPips(combo.colors);
      const colors = colorNames(combo);
      return `      <li class="combo-index-item">
        <a href="/combo/${combo.id}.html" class="combo-index-link">
          <span class="combo-index-name">${escapeHtml(combo.name)}</span>
          <span class="combo-index-colors" aria-label="${escapeHtml(colors)}">${pips}</span>
        </a>
      </li>`;
    }).join("\n");

    return `    <section class="combo-index-group">
      <div class="combo-index-group-header">
        <h2>${group.label}</h2>
        <a href="../slides?subgroup=${group.subgroup}&from=combo_index" class="combo-learn-button">Learn these names</a>
      </div>
      <ul class="combo-index-list">
${items}
      </ul>
    </section>`;
  }).join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Color Combinations — MTG Colors</title>
  <meta name="description" content="Browse all 20 Magic: The Gathering color combinations — allied guilds, enemy guilds, shards, and wedges.">
  <meta property="og:title" content="All Color Combinations — MTG Colors">
  <meta property="og:description" content="Browse all 20 Magic: The Gathering color combinations — allied guilds, enemy guilds, shards, and wedges.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://mtgcolors.quest/combo/">
  <meta property="og:site_name" content="MTG Colors">
  <meta property="og:image" content="https://mtgcolors.quest/images/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://mtgcolors.quest/images/og-image.png">
  <link rel="canonical" href="https://mtgcolors.quest/combo/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap">
  <link rel="icon" href="../images/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../style.css">
  <link rel="stylesheet" href="../combo.css">
</head>
<body data-combo-id="index">
  <script type="module" src="../dist/combo-telemetry.js"></script>
  <a href="../" class="home-spiral" title="Home"></a>
  <main id="app">
    <div class="combo-page">
      <h1 class="combo-name">Color Combinations</h1>
      <p class="combo-index-intro">All 20 Magic: The Gathering color combinations, organized by type.</p>

${sections}

      <footer class="combo-footer">
        <a href="../" class="combo-home-link">Back to MTG Colors</a>
      </footer>
    </div>
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

// Index page
fs.writeFileSync(path.join(COMBO_DIR, "index.html"), buildIndexPage(), "utf-8");

console.log(`Generated ${count} combo pages + index in combo/`);
