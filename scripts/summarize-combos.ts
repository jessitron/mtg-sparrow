import { guilds, alliedGuilds, enemyGuilds, wedges, shards } from "../src/data/combos.js";

console.log("=== MTG Sparrow — Combo Data Summary ===\n");

console.log(`Total combos: ${guilds.length}`);
console.log(`  Allied guilds: ${alliedGuilds.length}`);
console.log(`  Enemy guilds:  ${enemyGuilds.length}`);
console.log(`  Wedges:        ${wedges.length}`);
console.log(`  Shards:        ${shards.length}`);
console.log();

const cardCounts = guilds.map(g => ({ id: g.id, count: g.cards?.length ?? 0 }));
const totalCards = cardCounts.reduce((sum, c) => sum + c.count, 0);

console.log(`Total cards across all combos: ${totalCards}`);
console.log();

// Group by tier
for (const [label, group] of [
  ["Allied Guilds", alliedGuilds],
  ["Enemy Guilds", enemyGuilds],
  ["Wedges", wedges],
  ["Shards", shards],
] as const) {
  console.log(`--- ${label} ---`);
  for (const combo of group) {
    const count = combo.cards?.length ?? 0;
    const deficit = 20 - count;
    const marker = deficit > 0 ? `  (needs ${deficit} more)` : deficit === 0 ? "  ✓" : `  (${count} — over by ${-deficit})`;
    console.log(`  ${combo.name.padEnd(12)} ${combo.colors.join("")}  ${count} cards${marker}`);
  }
  console.log();
}

// Cards per combo histogram
console.log("--- Card Count Distribution ---");
const countMap = new Map<number, string[]>();
for (const { id, count } of cardCounts) {
  if (!countMap.has(count)) countMap.set(count, []);
  countMap.get(count)!.push(id);
}
for (const [count, ids] of [...countMap.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  ${count} cards: ${ids.join(", ")}`);
}
console.log();

// Check for duplicate card names
const allCards = guilds.flatMap(g => (g.cards ?? []).map(c => ({ combo: g.id, name: c.name })));
const nameCount = new Map<string, string[]>();
for (const { combo, name } of allCards) {
  if (!nameCount.has(name)) nameCount.set(name, []);
  nameCount.get(name)!.push(combo);
}
const dupes = [...nameCount.entries()].filter(([, combos]) => combos.length > 1);
if (dupes.length > 0) {
  console.log("--- Duplicate Cards (appearing in multiple combos) ---");
  for (const [name, combos] of dupes) {
    console.log(`  "${name}" in: ${combos.join(", ")}`);
  }
} else {
  console.log("No duplicate cards across combos.");
}
console.log();

// Check for missing imageUrls
const missingImages = allCards.filter(c => {
  const card = guilds.flatMap(g => g.cards ?? []).find(x => x.name === c.name);
  return !card?.imageUrl;
});
if (missingImages.length > 0) {
  console.log("--- Cards Missing Image URLs ---");
  for (const { combo, name } of missingImages) {
    console.log(`  ${combo}: ${name}`);
  }
} else {
  console.log("All cards have image URLs.");
}
