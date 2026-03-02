# Arc 22: End Screen Row Layout

## Arc Details
- **Type**: User Arc
- **Version**: v0.20.0
- **Date**: 2026-03-02
- **Status**: COMPLETE — PASS

## Intention
Restructure the end screen from two side-by-side columns to full-width rows, each with a three-part layout (summary, centered color wheel, flavor panel placeholder).

## Observable Outcome
Each completed level renders as a full-width row. The color wheel is centered and larger (max-width 360px, up from 280px). A placeholder flavor panel appears on guild highlight, showing the guild name. Mobile layout stacks vertically at 700px breakpoint.

## Acceptance Criteria — All Met

- [x] Allied and enemy guilds each render as a full-width row
- [x] Each row has: summary section (title, description, combo list), centered color wheel, flavor panel area
- [x] Color wheel interaction (highlight/tap) still works
- [x] Flavor panel shows guild name on highlight (placeholder for Arc 23 content)
- [x] Responsive: three-part layout on desktop, stacked on mobile (700px breakpoint)
- [x] Existing functionality preserved (Learn/Practice buttons, progression state)

## Test Results
- **Test script**: `tests/arc22-end-screen-row-layout.mjs`
- **Result**: 36/36 PASS

## Key Files Changed
- `src/ui/guild-columns.ts` — Row layout DOM construction, three-part structure, flavor panel
- `style/end.css` — Full-width row layout, three-part grid, color wheel sizing, mobile breakpoint
- `src/end.ts` — `end.layout_version = 'rows_v1'` span attribute added

## Observability
- `end.layout_version = 'rows_v1'` span attribute added to `session.summary` spans
- Confirmed in Honeycomb: spans carry the structural marker

## Decisions
- DEC-075: End screen layout changed from two-column grid to full-width stacked rows
- DEC-076: Flavor panel placeholder shows guild name on highlight
- DEC-077: Guild flavor descriptions created as separate data file

## Parallel Work: Arc 23 Data File
While Arc 22 was being delivered, the domain expert created `src/data/guild-descriptions.ts` with:
- Flavor descriptions for all 10 guilds
- Scryfall links per guild
- 3 optional card additions identified (Azor, Voice of Resurgence, Savra)

This data file is not yet wired into the UI — that work is Arc 23.

## Lessons Learned
- Node.js variables referenced inside Playwright `addInitScript` callbacks aren't available in browser context — must inline values directly in the callback string.

---

## SOW Status: End Screen Refinements
Arc 22 completes the first arc of this SOW. Client pause point per SOW cadence — visual direction confirmed before wiring flavor content in Arc 23.
