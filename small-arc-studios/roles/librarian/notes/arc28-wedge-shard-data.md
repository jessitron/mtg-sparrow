# Arc 28: Wedge & Shard Data

## Arc Details
- **Type**: Structural Arc (Data Layer)
- **Version**: v0.23.0
- **Date**: 2026-03-02
- **Status**: COMPLETE — PASS
- **SOW**: sow-wedges-and-shards.md

## Intention
Add the three-color combination data layer — 5 wedges and 5 shards — to match the existing 10-guild data structure. This arc is purely data: combo definitions, card curation, flavor descriptions, and a structural telemetry marker. No UI changes.

## Observable Outcome
All 10 three-color combos (Abzan, Jeskai, Sultai, Mardu, Temur, Bant, Esper, Grixis, Jund, Naya) are defined in the data layer with ~10 iconic cards each and flavor descriptions. The `data.tier_version = 'three_color_v1'` structural marker is present on every `app.startup` span in Honeycomb.

## What Was Built

### src/data/combos.ts
- 10 three-color combo definitions appended to the existing `guilds` array
- Each combo has a `tier: 'wedge' | 'shard'` field discriminating it from `tier: 'guild'`
- Each combo has ~10 iconic cards with Scryfall image URLs, curated by EDHREC popularity + original block legendaries
- Export helpers added: `wedges` and `shards` (filtering the array by tier)

**Wedges** (Khans of Tarkir block): Abzan (WBG), Jeskai (URW), Sultai (BGU), Mardu (RWB), Temur (GUR)
**Shards** (Shards of Alara block): Bant (GWU), Esper (WUB), Grixis (UBR), Jund (BRG), Naya (RGW)

### src/data/guild-descriptions.ts
- Flavor descriptions and Scryfall search URLs added for all 10 three-color combos
- Uses existing `guildDescriptionMap` keyed by combo ID — no schema change needed
- Each entry includes theme description, mechanical identity, and Scryfall URL

### Structural Telemetry Marker
- `data.tier_version = 'three_color_v1'` added to the `app.startup` span in the relevant entry point
- Follows the same pattern as `app.module_structure` (DEC-059)

## Team
- **Domain Expert**: Researched cards via Scryfall API, curated 100 cards across 10 combos using EDHREC popularity + original block legendaries as selection criteria
- **Developer**: Implemented data layer following existing patterns in combos.ts and guild-descriptions.ts
- **Tester**: 59/59 PASS, Honeycomb verified `data.tier_version = three_color_v1` on startup span

## Acceptance Criteria — All Met

- [x] All 5 wedges defined in combos.ts with color identity, display name, and cards
- [x] All 5 shards defined in combos.ts with color identity, display name, and cards
- [x] ~10 iconic cards per combo, no duplicates across combos
- [x] `wedges` and `shards` export helpers available
- [x] Flavor descriptions added for all 10 combos in guild-descriptions.ts
- [x] `data.tier_version = 'three_color_v1'` visible in Honeycomb on app.startup span
- [x] All existing tests continue to pass (no regressions)

## Test Results
- **Test script**: `tests/arc28-three-color-data.mjs`
- **Result**: 59/59 PASS
- **Honeycomb verification**: `data.tier_version = three_color_v1` confirmed on startup span in sparrow-deck environment

## Key Files Changed
- `src/data/combos.ts` — 10 three-color combo definitions added; `wedges` and `shards` export helpers added
- `src/data/guild-descriptions.ts` — flavor descriptions and Scryfall URLs for all 10 combos
- Entry point file — `data.tier_version = 'three_color_v1'` telemetry marker on `app.startup` span
- `tests/arc28-three-color-data.mjs` — new test suite

## Observability
- `data.tier_version = 'three_color_v1'` on `app.startup` span
- Confirmed in Honeycomb: sparrow-deck environment

## Decisions
- DEC-093: Three-color combos added to existing `guilds` array, discriminated by `tier` field
- DEC-094: Card curation methodology — EDHREC popularity + original block legendaries, ~10 per combo
- DEC-095: Flavor descriptions added to existing `guild-descriptions.ts`, not a new file
- DEC-096: Structural marker `data.tier_version = 'three_color_v1'` on `app.startup` span

## Commits
- `12557ea`: Domain expert research
- `14ac2fb`: Combo definitions
- `7ba980c`: Flavor descriptions
- `2b4b96f`: Telemetry marker
- `4697334`: Test script
