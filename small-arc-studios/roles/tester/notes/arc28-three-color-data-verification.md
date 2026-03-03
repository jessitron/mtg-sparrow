# Arc 28 Tester Notes — Wedge & Shard Data

## Summary

Arc 28 added 10 three-color combo definitions (5 wedges + 5 shards) with card references, flavor descriptions, and a telemetry structural marker.

**Result: 59/59 PASS. Honeycomb confirmed.**

## What Was Tested

### Phase 1: Bundle content checks
- `dist/welcome.js` serves HTTP 200 ✓
- `dist/end.js` serves HTTP 200 ✓
- `dist/welcome.js` contains structural marker `"three_color_v1"` ✓
- All 10 combo names present in bundle: Abzan, Jeskai, Sultai, Mardu, Temur, Bant, Esper, Grixis, Jund, Naya ✓
- Tier values `"wedge"` and `"shard"` present ✓

### Phase 2: Data structure checks via bundle
- Exactly 5 wedge tier entries, 5 shard tier entries found ✓
- Iconic card spot-checks per combo (Anafenza/Abzan, Narset/Jeskai, Muldrotha/Sultai, Kaalia/Mardu, Maelstrom Wanderer/Temur, Rafiq/Bant, Sharuum/Esper, Nicol Bolas/Grixis, Korvold/Jund, Zacama/Naya) ✓

### Phase 3: Color count verification
- All 10 combo IDs present in bundle ✓
- Each combo's 3 colors all appear in bundle ✓

### Phase 4: Card image counts
- 203 total scryfall image URLs in bundle (guilds + wedges + shards) ✓
- Meets ≥ 200 threshold confirming three-color data present ✓

### Phase 5: Description map
- Flavor snippets confirmed for all 10 three-color combos ✓
  - Abzan: "outlast", Jeskai: "enlightenment", Sultai: "accumulate"
  - Mardu: "glory", Temur: "wilderness", Bant: "knightly"
  - Esper: "etherium", Grixis: "dying world", Jund: "eat or", Naya: "paradise"

### Phase 6 + Honeycomb: Telemetry structural marker
- Span flush waited 35s for OTel batch timer ✓
- Honeycomb query confirmed: `data.tier_version = 'three_color_v1'` present on `app.startup` span ✓
- Sample span details: `app.version = 0.19.0`, `app.page = welcome`, `app.navigation = multi_page`

## Test Script

`tests/arc28-three-color-data.mjs`

## Date

2026-03-03
