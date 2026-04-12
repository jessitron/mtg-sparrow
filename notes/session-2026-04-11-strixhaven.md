# Session Notes — 2026-04-11: Strixhaven Colleges

## What happened

New engagement: add Strixhaven colleges for the Secrets of Strixhaven set (releasing April 24, 2026).

### Arc 77 — Level Abstraction (Structural) — COMPLETE
- Refactored hardcoded level system into data-driven `LEVELS[]` array in `src/levels.ts`
- Single source of truth: `GuildSubgroup` type, `LevelDefinition` interface, `LEVELS` array
- Adding/reordering levels is now a config change (~3 files) instead of ~10 file surgery
- Version 0.46.0, 48/48 tests passed
- Decisions: DEC-266 through DEC-269

### Arc 78 — Strixhaven Colleges (User) — COMPLETE
- 5 colleges: Silverquill (WB), Prismari (UR), Witherbloom (BG), Lorehold (RW), Quandrix (GU)
- Cards from original STX set (SOS not on Scryfall yet)
- Colleges are Level 1, existing levels renumbered 2-5
- Combo reference pages generated for all 5 colleges
- BEGIN button now uses `LEVELS[0].id` (dynamic, not hardcoded)
- Version 0.47.0, 70/70 tests passed
- Decisions: DEC-270 through DEC-273

### Documentation
- `small-arc-studios/roles/developer/notes/how-to-add-a-level.md` — comprehensive guide

## Issues found
- All 85 Scryfall card URLs were hallucinated by the LLM — looked real but returned 403
- Fixed via Scryfall bulk data API download + local lookup
- Two cards replaced: "Approached from Below" (fake name), "Wandering Archaic" (double-faced)

## Open follow-ups
- Update card images with SOS set cards after April 24 release
- Card images still loading correctly needs client verification
- Could add college crest images (`images/combo/`) in a future arc
- Could add Example Decks for colleges (SOS commander precons) after release
