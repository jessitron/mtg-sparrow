# Arc 31: End Screen — Shard Section

## Arc Details
- **Type**: User Arc (End Screen)
- **Version**: v0.26.0
- **Date**: 2026-03-02
- **Status**: COMPLETE — PASS
- **SOW**: sow-wedges-and-shards.md

## Intention
Add a shard section to the end screen reel. Users who have completed shard sessions should see a shard column alongside allied, enemy, and wedge columns. Reuses the triangle wheel visualization from Arc 30 (wedge section) with a teal/cyan color theme to distinguish shards from wedges.

## Observable Outcome
The end screen reel includes a shard section at reel index 3. Hovering shard triangles highlights the combo. Honeycomb confirms `end.guild_highlight` spans with shard combo IDs. `end.layout_version` bumped to `reel_v2` to signal the 5-section layout.

## What Was Built

### src/ui/guild-columns.ts
- `shardTriples`: Data array of 5 triples (one per shard combo), mapping each shard to its 3 color nodes.
- `buildShardColumn`: Builds the shard section column following the same pattern as `buildWedgeColumn`.
- `SECTION_LABELS` updated: `['allied', 'enemy', 'wedges', 'shards', 'share']` — shards at index 3.
- `showSessionEndColumns`: Now accepts a `shardsUnlocked` parameter to conditionally render the shard column.
- Cross-deselect extended to 4 data columns (allied, enemy, wedges, shards).

### src/end.ts
- Passes `shardsUnlocked` to `showSessionEndColumns`.
- Handles `initialSubgroup=shards` for deep-linking into the shard section on load.

### end.css
- Shard triangle polygon styling: `.shard-triangle-vis`, `.shard-color-wheel`.
- Teal/cyan color theme, distinct from purple/violet (wedges), gold (allied), red-orange (enemy).
- Highlight glow state with drop-shadow for active shard triangles.
- Dim state for inactive triangles when another is highlighted.

## Team
- **Developer**: Implemented shard column and CSS reusing triangle wheel pattern from Arc 30, parameterized by color theme.
- **Tester**: Playwright tests run and passed. Honeycomb confirmed `end.guild_highlight` spans with shard combo IDs.

## Acceptance Criteria — All Met

- [x] Shard section appears at reel index 3 when shards are unlocked
- [x] Triangle wheel reuses the Arc 30 polygon pattern, parameterized for shards
- [x] Teal/cyan color theme, distinct from purple/violet wedges, gold allied, red-orange enemy
- [x] Hovering a triangle highlights the combo and dims others
- [x] 4-column cross-deselect clears shard selection when any other data column is clicked
- [x] `end.layout_version = 'reel_v2'` in Honeycomb traces
- [x] `end.guild_highlight` spans with shard combo IDs confirmed in Honeycomb
- [x] All existing tests continue to pass (no regressions)

## Key Files Changed
- `src/ui/guild-columns.ts` — `shardTriples`, `buildShardColumn`, updated `SECTION_LABELS` and `showSessionEndColumns`
- `src/end.ts` — passes `shardsUnlocked`, handles `initialSubgroup=shards`
- `end.css` — shard triangle polygon styling, teal/cyan theme, highlight/dim states

## Observability
- `end.guild_highlight` spans with shard combo IDs on triangle hover
- `end.layout_version = 'reel_v2'` structural marker bumped from `reel_v1`
- Confirmed in Honeycomb: sparrow-deck environment

## Decisions
- DEC-104: Teal/cyan color theme for shard triangles (distinct from purple wedges, gold allied, red-orange enemy)
- DEC-105: Reuse triangle wheel pattern from Arc 30 (wedges), parameterized by color theme
- DEC-106: `end.layout_version` bumped to `reel_v2` for 5-section layout

## Commits
- `f4b5a82`: Arc 31: Add shard section to end screen reel
