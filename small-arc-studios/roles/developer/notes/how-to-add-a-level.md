# How to Add a New Level

*Last updated: Arc 77 (2026-04-11)*

A level is a group of color combinations that players learn together (e.g., "Allied Guilds", "Strixhaven Colleges"). After Arc 77, levels are data-driven. Here's everything you need to touch.

---

## Step 1: Define the color combos (`src/data/combos.ts`)

Add entries to the `guilds` array. Each combo needs:

```typescript
{
  id: "lorehold",           // URL-safe, lowercase — used everywhere
  name: "Lorehold",         // Display name
  colors: ["R", "W"],       // Mana colors (WUBRG order doesn't matter, but be consistent)
  tier: "college",          // New tier value — update the ColorCombo type first
  cards: [                  // 15-25 example cards with Scryfall image URLs
    { name: "Card Name", imageUrl: "https://cards.scryfall.io/normal/front/..." },
    // ...
  ],
}
```

**Update the `ColorCombo` type** at the top of the file if you're adding a new `tier` value:
```typescript
tier: "guild" | "shard" | "wedge" | "college";  // add new tier
```

**Also add a filter export** at the bottom of the file (alongside `alliedGuilds`, `enemyGuilds`, etc.):
```typescript
export const colleges = guilds.filter(g => g.tier === "college");
```

**Card data guidelines:**
- No split cards (X // Y) — they render sideways
- No double-faced cards — they have lookup issues
- Use Scryfall `normal` size images
- 15-25 cards per combo is the sweet spot

---

## Step 2: Add descriptions (`src/data/guild-descriptions.ts`)

Add a `GuildDescription` entry for each combo:

```typescript
{
  id: "lorehold",  // must match ColorCombo.id
  description: "3-5 sentences of philosophy and flavor.",
  scryfallUrl: "https://scryfall.com/search?q=...",
  flavor: "Optional editorial commentary from the client.",
  exampleDecks: [  // optional
    {
      commander: "Commander Name",
      commanderImageUrl: "https://cards.scryfall.io/normal/front/...",
      deckName: "Precon Deck Name",
      setName: "Set Name",
      deckUrl: "https://edhrec.com/...",
      description: "What the deck does.",
    },
  ],
}
```

---

## Step 3: Register the level (`src/levels.ts`)

1. **Add to the `GuildSubgroup` union type:**
```typescript
export type GuildSubgroup = 'allied' | 'enemy' | 'wedges' | 'shards' | 'colleges';
```

2. **Add to the `LEVELS` array** — position determines level number and progression order:
```typescript
export const LEVELS: LevelDefinition[] = [
  { id: 'colleges', title: 'Strixhaven Colleges', description: '...', pool: colleges },
  // existing levels follow...
];
```

Level number is derived from array position (1-indexed). Progression unlocks the next entry in the array. To reorder later, just move the entry.

---

## Step 4: Add the end-page column builder (`src/ui/guild-columns.ts`)

1. **Write a `buildCollegesColumn` function** following the pattern of existing builders (see `buildAlliedColumn` at line ~623). Each builder:
   - Creates a `div.level-section.level-section--{id}`
   - Checks `unlocked || hasCompletedSubgroup(id)` to decide locked vs. full content
   - In full content: builds summary panel, wheel/visualization panel, flavor panel
   - In locked state: shows a "Learn X" button
   - Returns `[HTMLElement, clearSelectionFn]`

2. **Register in `UI_LEVELS` array** (line ~923):
```typescript
const UI_LEVELS: UILevelDefinition[] = [
  { ...LEVELS[0], buildColumn: buildCollegesColumn },  // if colleges is first in LEVELS
  { ...LEVELS[1], buildColumn: buildAlliedColumn },
  // ...
];
```

**Important:** `UI_LEVELS` must have the same order as `LEVELS`. Each entry spreads the corresponding `LEVELS[i]` and adds its builder.

3. **The visualization is up to you.** Allied/enemy guilds use pair-line color wheels. Wedges/shards use triangle wheels. A new level can have its own visualization. Involve the Designer.

---

## Step 5: Add combo reference pages

### 5a. Add crest images (`images/combo/`)

If the combos have logos/crests, add them as PNGs at `images/combo/{id}.png`. The build script uses these for guild-tier combos (see `hasGuildLogo` in build-combos.ts). For new tiers, update the logo logic in `buildPage()`:

```typescript
// In scripts/build-combos.ts
const hasGuildLogo = combo.tier === "guild" || combo.tier === "college";
```

### 5b. Update the build script (`scripts/build-combos.ts`)

Several functions need the new tier:

**`tierLabel()`** — add a case:
```typescript
if (combo.tier === "college") return "College";
```

**`subgroupParam()`** — add a case:
```typescript
if (combo.tier === "college") return "colleges";
```

**`subgroupLabel()`** — add a case:
```typescript
if (combo.tier === "college") return "college";
```

**`orderedCombos`** — add the new tier to the ordering array (~line 169):
```typescript
const orderedCombos: ColorCombo[] = [
  ...guilds.filter(g => g.tier === "college"),  // if colleges go first
  ...guilds.filter(g => g.tier === "guild" && g.subgroup === "allied"),
  // ...existing...
];
```

**`buildIndexPage()`** — add a group to the `groups` array (~line 322):
```typescript
{
  label: "Strixhaven Colleges",
  subgroup: "colleges",
  description: "Two-color pairs representing Strixhaven's magical schools.",
  combos: guilds.filter(g => g.tier === "college"),
},
```

### 5c. Regenerate combo pages
```bash
npm run build:combos
```

This generates `combo/{id}.html` for every combo plus the index page. The HTML files are committed to git (they're static, served by GitHub Pages).

---

## Step 6: Audio (optional)

If pronunciation audio exists for the new combos, add MP3 files to `audio/{id}.mp3`. The audio system picks them up by combo ID automatically.

---

## Step 7: Bump version and build

- Bump `APP_VERSION` in `src/version.ts`
- Run `npm run build` (builds the main app bundles)
- Run `npm run build:combos` (regenerates combo reference pages)

---

## Step 8: Verify

The Tester should verify:
- Level intro shows correct number, title, and combo names
- Session plays through all combos in the new level
- Completing the level unlocks the next one
- End page shows the new level section
- Combo reference pages render for each new combo
- Combo index page lists the new group
- Honeycomb traces show the new subgroup in `session.subgroup`

---

## Checklist summary

| File | What to add |
|------|-------------|
| `src/data/combos.ts` | `ColorCombo` entries + tier type + filter export |
| `src/data/guild-descriptions.ts` | `GuildDescription` entries (descriptions, Scryfall links, example decks) |
| `src/levels.ts` | `GuildSubgroup` union member + `LEVELS` entry |
| `src/ui/guild-columns.ts` | `buildXxxColumn()` function + `UI_LEVELS` entry |
| `scripts/build-combos.ts` | `tierLabel`, `subgroupParam`, `subgroupLabel`, `orderedCombos`, `buildIndexPage` groups |
| `images/combo/` | Crest PNGs (if applicable) |
| `audio/` | Pronunciation MP3s (if applicable) |
| `src/version.ts` | Version bump |
