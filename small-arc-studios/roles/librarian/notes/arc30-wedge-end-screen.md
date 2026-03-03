# Arc 30: End Screen — Wedge Section

## Arc Details
- **Type**: User Arc (End Screen)
- **Version**: v0.25.0
- **Date**: 2026-03-02
- **Status**: COMPLETE — PASS
- **SOW**: sow-wedges-and-shards.md

## Intention
Add a wedge section to the end screen reel. Users who have completed wedge sessions should see a wedge column alongside allied and enemy columns, with a triangle-based wheel visualization connecting the three combo nodes per wedge.

## Observable Outcome
The end screen reel includes a wedge section at reel index 2. Hovering wedge triangles highlights the combo. Honeycomb confirms `end.guild_highlight` spans with wedge combo IDs.

## What Was Built

### src/ui/guild-columns.ts
- `buildTriangleWheel`: SVG polygon-based wheel builder for wedge combos. Each wedge is a triangle connecting its 3 pentagon nodes.
- `wireTriangleWheelHover`: Hover wiring for triangle elements, triggering `guild.highlight` telemetry.
- `buildWedgeColumn`: Builds the wedge section column following the same allied/enemy pattern.
- `SECTION_LABELS` updated: `['allied', 'enemy', 'wedges', 'share']` — wedges at index 2.
- `showSessionEndColumns`: Now accepts a `wedgesUnlocked` parameter to conditionally render the wedge column.
- Cross-column deselect extended to all 3 columns (allied, enemy, wedges).

### src/end.ts
- Passes `wedgesUnlocked` to `showSessionEndColumns`.
- Handles `initialSubgroup=wedges` for deep-linking into the wedge section on load.

### end.css
- Triangle polygon styling with purple/violet color theme (distinct from allied gold and enemy red-orange).
- Highlight glow state for active wedge triangles.
- Dim state for inactive triangles when another is highlighted.

### Triangle Data
- `wedgeTriples`: 5 triples, one per wedge combo, mapping each to its 3 color nodes.
- `colorTripleToComboId`: Map from color triple to combo ID for highlight lookup.

## Team
- **Developer**: Implemented triangle wheel and wedge column following existing allied/enemy patterns.
- **Tester**: 39/39 PASS. Honeycomb confirmed `end.guild_highlight` spans with wedge combo IDs.

## Acceptance Criteria — All Met

- [x] Wedge section appears at reel index 2 when wedges are unlocked
- [x] Triangle wheel connects 3 pentagon nodes per wedge using SVG polygon elements
- [x] Purple/violet color theme, distinct from allied (gold) and enemy (red-orange)
- [x] Hovering a triangle highlights the combo and dims others
- [x] Cross-column deselect clears wedge selection when allied or enemy is clicked
- [x] `end.guild_highlight` spans with wedge combo IDs confirmed in Honeycomb
- [x] All existing tests continue to pass (no regressions)

## Test Results
- **Result**: 39/39 PASS
- **Honeycomb verification**: `end.guild_highlight` spans with wedge combo IDs confirmed in sparrow-deck environment

## Key Files Changed
- `src/ui/guild-columns.ts` — `buildTriangleWheel`, `wireTriangleWheelHover`, `buildWedgeColumn`, updated `SECTION_LABELS` and `showSessionEndColumns`
- `src/end.ts` — passes `wedgesUnlocked`, handles `initialSubgroup=wedges`
- `end.css` — triangle polygon styling, purple/violet theme, highlight/dim states

## Observability
- `end.guild_highlight` spans with wedge combo IDs on triangle hover
- Confirmed in Honeycomb: sparrow-deck environment
- `end.layout_version` from Arc 24 remains `single_section_v1`

## Decisions
- DEC-100: Triangle wheel uses SVG polygon elements (not lines) to connect 3 pentagon nodes per wedge
- DEC-101: Purple/violet color theme for wedge triangles
- DEC-102: Reused `end.guild_highlight` telemetry span name for wedge combo highlights
- DEC-103: Wedge section at reel index 2: allied=0, enemy=1, wedges=2, share=3

## Commits
- `eda44d7`: Implementation (guild-columns.ts, end.ts, end.css, triangle data)
- `231060a`: Tests
